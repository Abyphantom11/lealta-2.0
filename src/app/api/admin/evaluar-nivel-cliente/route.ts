import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  enviarNotificacionClientes,
  TipoNotificacion,
} from '@/lib/notificaciones';

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
  // Usar puntos acumulados para nivel (no se reducen por canjes)
  const puntosAcumulados = cliente.puntosAcumulados || cliente.puntos || 0;
  const visitas = cliente.totalVisitas || 0;

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
    
    const cumplePuntos = puntosAcumulados >= puntosRequeridos;
    const cumpleVisitas = visitas >= visitasRequeridas;

    // Lógica OR: cumple si tiene puntos suficientes O visitas suficientes
    // Esto permite que clientes VIP (mucho gasto, pocas visitas) o 
    // clientes frecuentes (poco gasto, muchas visitas) obtengan beneficios
    if (cumplePuntos || cumpleVisitas) {
      // Solo log para cambios importantes
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Cliente califica para ${tarjeta.nivel} (Puntos acumulados: ${puntosAcumulados}/${puntosRequeridos}, Visitas: ${visitas}/${visitasRequeridas})`
        );
      }
      return tarjeta.nivel;
    }
  }

  // Si no cumple ninguno, devolver Bronce (nivel mínimo)
  return 'Bronce';
}

export async function POST(request: NextRequest) {
  try {
    const { cedula, clienteId } = await request.json();

    if (!cedula && !clienteId) {
      return NextResponse.json(
        { error: 'Se requiere cédula o clienteId' },
        { status: 400 }
      );
    }

    // Obtener configuración del portal
    const portalConfig = await getPortalConfig();
    if (!portalConfig?.tarjetas) {
      return NextResponse.json(
        { error: 'Configuración de tarjetas no encontrada' },
        { status: 500 }
      );
    }

    // Buscar cliente
    const whereClause = cedula ? { cedula } : { id: clienteId };
    const cliente = await prisma.cliente.findUnique({
      where: whereClause,
      include: {
        tarjetaLealtad: true,
        consumos: true,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Evaluar nivel que le corresponde
    const nivelCorrespondiente = evaluarNivelCliente(
      cliente,
      portalConfig.tarjetas
    );
    const nivelActual = cliente.tarjetaLealtad?.nivel || 'Bronce';

    // Si ya tiene el nivel correcto, no hacer nada
    if (nivelActual === nivelCorrespondiente) {
      return NextResponse.json({
        message: 'Cliente ya tiene el nivel correcto',
        nivelActual,
        nivelCorrespondiente,
        actualizado: false,
      });
    }

    // Actualizar o crear tarjeta de lealtad
    let tarjetaActualizada;

    if (cliente.tarjetaLealtad) {
      // Actualizar tarjeta existente
      const historicoActual = cliente.tarjetaLealtad.historicoNiveles
        ? JSON.parse(cliente.tarjetaLealtad.historicoNiveles as string)
        : [];

      historicoActual.push({
        fecha: new Date().toISOString(),
        nivelAnterior: nivelActual,
        nivelNuevo: nivelCorrespondiente,
        motivo: 'Actualización automática',
      });

      tarjetaActualizada = await prisma.tarjetaLealtad.update({
        where: { id: cliente.tarjetaLealtad.id },
        data: {
          nivel: nivelCorrespondiente,
          fechaAsignacion: new Date(),
          asignacionManual: false,
          historicoNiveles: JSON.stringify(historicoActual),
        },
      });
    } else {
      // Crear nueva tarjeta
      tarjetaActualizada = await prisma.tarjetaLealtad.create({
        data: {
          clienteId: cliente.id,
          nivel: nivelCorrespondiente,
          activa: true,
          fechaAsignacion: new Date(),
          asignacionManual: false,
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

    // Enviar notificación de cambio de nivel
    await enviarNotificacionClientes(TipoNotificacion.NIVEL_CAMBIADO);

    // 🎯 Determinar si es subida o bajada para la animación
    const jerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
    const indicePrevio = jerarquia.indexOf(nivelActual);
    const indiceNuevo = jerarquia.indexOf(nivelCorrespondiente);
    const esSubida = indiceNuevo > indicePrevio;
    const esBajada = indiceNuevo < indicePrevio;

    return NextResponse.json({
      message: `Cliente actualizado de ${nivelActual} a ${nivelCorrespondiente}`,
      nivelAnterior: nivelActual,
      nivelNuevo: nivelCorrespondiente,
      actualizado: true,
      esSubida,
      esBajada,
      mostrarAnimacion: esSubida, // Solo mostrar animación para subidas
      tarjeta: tarjetaActualizada,
    });
  } catch (error) {
    console.error('Error evaluando nivel de cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// También manejar evaluación masiva
export async function PUT() {
  try {
    // Evaluar todos los clientes
    const portalConfig = await getPortalConfig();
    if (!portalConfig?.tarjetas) {
      return NextResponse.json(
        { error: 'Configuración de tarjetas no encontrada' },
        { status: 500 }
      );
    }

    const clientes = await prisma.cliente.findMany({
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
}
