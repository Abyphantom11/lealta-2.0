import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  enviarNotificacionClientes,
  TipoNotificacion,
} from '@/lib/notificaciones';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

const prisma = new PrismaClient();

// Función para obtener la configuración del portal
async function getPortalConfig() {
  try {
    const configPath = path.join(process.cwd(), 'portal-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading portal config:', error);
    return null;
  }
}

// Función para evaluar el nivel más alto que le corresponde a un cliente
function evaluarNivelCliente(cliente: any, tarjetasConfig: any[]) {
  // 🎯 CAMBIO CRÍTICO: Usar puntosProgreso de la tarjeta para evaluación automática
  // Esto respeta los reseteos/actualizaciones de asignaciones manuales
  const puntosProgreso = cliente.tarjetaLealtad?.puntosProgreso || cliente.puntosAcumulados || cliente.puntos || 0;
  const visitas = cliente.totalVisitas || 0;

  console.log(`🤖 Evaluación automática usando:`);
  console.log(`   • puntosProgreso: ${puntosProgreso} (desde tarjeta)`);
  console.log(`   • puntos canjeables: ${cliente.puntos || 0} (se mantienen separados)`);
  console.log(`   • visitas: ${visitas}`);

  // Usar las tarjetas activas de la nueva estructura
  const tarjetasActivas = tarjetasConfig.filter(t => t.activo);
  if (!tarjetasActivas.length) {
    console.warn('No hay tarjetas activas configuradas');
    return 'Bronce';
  }

  // Ordenar tarjetas por requisitos de puntos (de mayor a menor) para evaluar desde el más alto
  const tarjetasOrdenadas = tarjetasActivas
    .slice() // crear copia para no mutar el original
    .sort((a, b) => (b.condiciones?.puntosMinimos || 0) - (a.condiciones?.puntosMinimos || 0));

  // Encontrar el nivel MÁS ALTO que cumple los requisitos (lógica OR)
  for (const tarjeta of tarjetasOrdenadas) {
    const puntosRequeridos = tarjeta.condiciones?.puntosMinimos || 0;
    const visitasRequeridas = tarjeta.condiciones?.visitasMinimas || 0;

    const cumplePuntos = puntosProgreso >= puntosRequeridos;
    const cumpleVisitas = visitas >= visitasRequeridas;

    // Lógica OR: cumple si tiene puntos suficientes O visitas suficientes
    // Esto permite que clientes VIP (mucho gasto, pocas visitas) o
    // clientes frecuentes (poco gasto, muchas visitas) obtengan beneficios
    if (cumplePuntos || cumpleVisitas) {
      // Solo log para cambios importantes
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Cliente califica para ${tarjeta.nivel} (Puntos progreso: ${puntosProgreso}/${puntosRequeridos}, Visitas: ${visitas}/${visitasRequeridas})`
        );
      }
      return tarjeta.nivel;
    }
  }

  // Si no cumple ninguno, devolver Bronce (nivel mínimo)
  return 'Bronce';
}

// Helper functions para reducir complejidad cognitiva
async function processHistoricoNiveles(historico: any): Promise<any[]> {
  let historicoActual = [];

  try {
    if (Array.isArray(historico)) {
      historicoActual = historico;
    } else if (typeof historico === 'string') {
      try {
        historicoActual = JSON.parse(historico);
      } catch {
        console.log('Error parsing JSON string, iniciando array vacío');
        historicoActual = [];
      }
    } else if (typeof historico === 'object' && historico !== null) {
      historicoActual = [historico];
    } else {
      historicoActual = [];
    }
  } catch (error) {
    console.log('Error procesando historicoNiveles, iniciando array vacío:', error);
    historicoActual = [];
  }

  return historicoActual;
}

async function updateExistingCard(cliente: any, nivelCorrespondiente: string, nivelActual: string) {
  const historicoActual = await processHistoricoNiveles(cliente.tarjetaLealtad.historicoNiveles);

  historicoActual.push({
    fecha: new Date().toISOString(),
    nivelAnterior: nivelActual,
    nivelNuevo: nivelCorrespondiente,
    motivo: 'Actualización automática',
  });

  return await prisma.tarjetaLealtad.update({
    where: { id: cliente.tarjetaLealtad.id },
    data: {
      nivel: nivelCorrespondiente,
      fechaAsignacion: new Date(),
      asignacionManual: false,
      puntosProgreso: cliente.puntosAcumulados || cliente.puntos || 0,
      historicoNiveles: JSON.stringify(historicoActual),
    },
  });
}

async function createNewCard(cliente: any, nivelCorrespondiente: string) {
  return await prisma.tarjetaLealtad.create({
    data: {
      clienteId: cliente.id,
      nivel: nivelCorrespondiente,
      activa: true,
      fechaAsignacion: new Date(),
      asignacionManual: false,
      puntosProgreso: cliente.puntosAcumulados || cliente.puntos || 0,
      historicoNiveles: JSON.stringify([
        {
          fecha: new Date().toISOString(),
          nivelAnterior: null,
          nivelNuevo: nivelCorrespondiente,
          motivo: 'Asignación automática inicial',
        },
      ]),
    },
  });
}

function calculateLevelChange(nivelActual: string, nivelCorrespondiente: string) {
  const jerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  const indicePrevio = jerarquia.indexOf(nivelActual);
  const indiceNuevo = jerarquia.indexOf(nivelCorrespondiente);

  return {
    esSubida: indiceNuevo > indicePrevio,
    esBajada: indiceNuevo < indicePrevio
  };
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`⚡ Evaluar-nivel POST by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);

    const { businessId } = session;
    const { cedula, clienteId } = await request.json();

    if (!cedula && !clienteId) {
      return NextResponse.json(
        { error: 'Se requiere cédula o clienteId' },
        { status: 400 }
      );
    }

    const portalConfig = await getPortalConfig();
    if (!portalConfig?.tarjetas) {
      return NextResponse.json(
        { error: 'Configuración de tarjetas no encontrada' },
        { status: 500 }
      );
    }

    const whereClause = cedula 
      ? { cedula, businessId } 
      : { id: clienteId, businessId }; // ✅ FILTRO POR BUSINESS
    
    const cliente = await prisma.cliente.findUnique({
      where: whereClause,
      include: { tarjetaLealtad: true, consumos: true },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const nivelCorrespondiente = evaluarNivelCliente(cliente, portalConfig.tarjetas);
    const nivelActual = cliente.tarjetaLealtad?.nivel || 'Bronce';
    const esAsignacionManual = cliente.tarjetaLealtad?.asignacionManual || false;

    if (esAsignacionManual && nivelActual !== nivelCorrespondiente) {
      console.log(`🚫 Tarjeta asignada manualmente (${nivelActual}), saltando evaluación automática`);
      return NextResponse.json({
        message: 'Tarjeta asignada manualmente, no se modifica automáticamente',
        nivelActual,
        nivelCorrespondiente,
        actualizado: false,
        razon: 'asignacion_manual_preservada',
        info: `La tarjeta ${nivelActual} fue asignada manualmente. Para cambiarla, use asignación manual.`
      });
    }

    if (nivelActual === nivelCorrespondiente) {
      return NextResponse.json({
        message: 'Cliente ya tiene el nivel correcto',
        nivelActual,
        nivelCorrespondiente,
        actualizado: false,
      });
    }

    let tarjetaActualizada;
    if (cliente.tarjetaLealtad) {
      tarjetaActualizada = await updateExistingCard(cliente, nivelCorrespondiente, nivelActual);
    } else {
      tarjetaActualizada = await createNewCard(cliente, nivelCorrespondiente);
    }

    await enviarNotificacionClientes(TipoNotificacion.NIVEL_CAMBIADO);

    const { esSubida, esBajada } = calculateLevelChange(nivelActual, nivelCorrespondiente);

    return NextResponse.json({
      message: `Cliente actualizado de ${nivelActual} a ${nivelCorrespondiente}`,
      nivelAnterior: nivelActual,
      nivelNuevo: nivelCorrespondiente,
      actualizado: true,
      esSubida,
      esBajada,
      mostrarAnimacion: esSubida,
      tarjeta: tarjetaActualizada,
    });
  } catch (error) {
    console.error('Error evaluando nivel de cliente:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      evaluatedBy: session.userId // ✅ AUDITORÍA
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
  }, AuthConfigs.WRITE);
}

// También manejar evaluación masiva
export async function PUT(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`⚡ Evaluar-nivel PUT by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
    const { businessId } = session;
    
    // Evaluar todos los clientes
    const portalConfig = await getPortalConfig();
    if (!portalConfig?.tarjetas) {
      return NextResponse.json(
        { error: 'Configuración de tarjetas no encontrada' },
        { status: 500 }
      );
    }

    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: businessId, // ✅ FILTRO POR BUSINESS
      },
      include: {
        tarjetaLealtad: true,
        consumos: true,
      },
    });

    const resultados = [];

    for (const cliente of clientes) {
      const nivelCorrespondiente = evaluarNivelCliente(
        cliente,
        portalConfig.tarjetas
      );
      const nivelActual = cliente.tarjetaLealtad?.nivel || 'Bronce';

      if (nivelActual !== nivelCorrespondiente) {
        // Actualizar cliente
        if (cliente.tarjetaLealtad) {
          await prisma.tarjetaLealtad.update({
            where: { id: cliente.tarjetaLealtad.id },
            data: {
              nivel: nivelCorrespondiente,
              fechaAsignacion: new Date(),
              asignacionManual: false,
            },
          });
        } else {
          await prisma.tarjetaLealtad.create({
            data: {
              clienteId: cliente.id,
              nivel: nivelCorrespondiente,
              activa: true,
              fechaAsignacion: new Date(),
              asignacionManual: false,
            },
          });
        }

        resultados.push({
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          nivelAnterior: nivelActual,
          nivelNuevo: nivelCorrespondiente,
        });
      }
    }

    return NextResponse.json({
      message: `Evaluación masiva completada. ${resultados.length} clientes actualizados.`,
      clientesActualizados: resultados,
    });
  } catch (error) {
    console.error('Error en evaluación masiva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
  }, AuthConfigs.WRITE);
}
