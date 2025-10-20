import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import {
  enviarNotificacionClientes,
  TipoNotificacion,
} from '@/lib/notificaciones';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';
import { getTarjetasConfigCentral, evaluarNivelCorrespondiente } from '@/lib/tarjetas-config-central';

const prisma = new PrismaClient();

// Función para evaluar el nivel más alto que le corresponde a un cliente
async function evaluarNivelCliente(cliente: any, businessId: string) {
  // 🎯 CAMBIO CRÍTICO: Usar puntosProgreso de la tarjeta para evaluación automática
  // Esto respeta los reseteos/actualizaciones de asignaciones manuales
  const puntosProgreso = cliente.tarjetaLealtad?.puntosProgreso || cliente.puntosAcumulados || cliente.puntos || 0;
  const visitas = cliente.totalVisitas || 0;

  // Usar la función central para evaluar nivel
  const nivelCorrespondiente = await evaluarNivelCorrespondiente(businessId, puntosProgreso, visitas);
  
  // Solo log para cambios importantes
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Cliente califica para ${nivelCorrespondiente} (Puntos progreso: ${puntosProgreso}, Visitas: ${visitas})`
    );
  }
  
  return nivelCorrespondiente;
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
      id: nanoid(),
      clienteId: cliente.id,
      businessId: cliente.businessId,
      nivel: nivelCorrespondiente,
      activa: true,
      fechaAsignacion: new Date(),
      asignacionManual: false,
      puntosProgreso: cliente.puntosAcumulados || cliente.puntos || 0,
      updatedAt: new Date(),
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

    // Obtener la configuración centralizada
    const config = await getTarjetasConfigCentral(businessId);
    if (!config.tarjetas.length) {
      return NextResponse.json(
        { error: 'Configuración de tarjetas no encontrada' },
        { status: 500 }
      );
    }

    const whereClause = cedula 
      ? { businessId_cedula: { businessId, cedula } }
      : { id: clienteId }; // ✅ USAR COMPOUND KEY CORRECTO
    
    const cliente = await prisma.cliente.findUnique({
      where: whereClause as any,
      include: { TarjetaLealtad: true, Consumo: true },
    }) as any;

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const nivelCorrespondiente = await evaluarNivelCliente(cliente, businessId);
    const nivelActual = cliente.tarjetaLealtad?.nivel || 'Bronce';
    const esAsignacionManual = cliente.tarjetaLealtad?.asignacionManual || false;

    // ✅ CAMBIO: Permitir ascensos automáticos incluso en tarjetas manuales
    // Solo bloquear degradaciones automáticas en tarjetas manuales
    const jerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
    const indexActual = jerarquia.indexOf(nivelActual);
    const indexCorrespondiente = jerarquia.indexOf(nivelCorrespondiente);
    const esAscenso = indexCorrespondiente > indexActual;
    const esDegradacion = indexCorrespondiente < indexActual;

    if (esAsignacionManual && esDegradacion) {
      console.log(`🚫 Tarjeta asignada manualmente (${nivelActual}), bloqueando solo degradación automática`);
      return NextResponse.json({
        message: 'Tarjeta asignada manualmente, no se permite degradación automática',
        nivelActual,
        nivelCorrespondiente,
        actualizado: false,
        razon: 'asignacion_manual_preservada_degradacion',
        info: `La tarjeta ${nivelActual} fue asignada manualmente. Solo se permiten ascensos automáticos.`
      });
    }

    if (esAsignacionManual && esAscenso) {
      console.log(`🆙 Tarjeta asignada manualmente (${nivelActual}), pero permitiendo ascenso automático a ${nivelCorrespondiente}`);
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
    
    // Obtener la configuración centralizada
    const config = await getTarjetasConfigCentral(businessId);
    if (!config.tarjetas.length) {
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
        TarjetaLealtad: true,
        Consumo: true,
      },
    });

    const resultados = [];

    for (const cliente of clientes) {
      const nivelCorrespondiente = await evaluarNivelCliente(cliente, businessId);
      const nivelActual = cliente.TarjetaLealtad?.nivel || 'Bronce';

      if (nivelActual !== nivelCorrespondiente) {
        // Actualizar cliente
        if (cliente.TarjetaLealtad) {
          await prisma.tarjetaLealtad.update({
            where: { id: cliente.TarjetaLealtad.id },
            data: {
              nivel: nivelCorrespondiente,
              fechaAsignacion: new Date(),
              asignacionManual: false,
            },
          });
        } else {
          await prisma.tarjetaLealtad.create({
            data: {
              id: nanoid(),
              clienteId: cliente.id,
              businessId: cliente.businessId,
              nivel: nivelCorrespondiente,
              activa: true,
              fechaAsignacion: new Date(),
              asignacionManual: false,
              updatedAt: new Date(),
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
