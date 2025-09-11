import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  enviarNotificacionClientes,
  TipoNotificacion,
} from '@/lib/notificaciones';

const prisma = new PrismaClient();

interface NivelConfig {
  nombre: string;
  puntosRequeridos: number;
  visitasRequeridas: number;
  beneficio: string;
  colores: string[];
}

interface TarjetaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  condicional: string;
  niveles: NivelConfig[];
}

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
function evaluarNivelCliente(cliente: any, tarjetasConfig: TarjetaConfig[]) {
  const puntos = cliente.puntos || 0;
  const visitas = cliente.totalVisitas || 0;

  // Usar la primera tarjeta activa
  const tarjetaActiva = tarjetasConfig.find(t => t.activa);
  if (!tarjetaActiva) {
    console.warn('No hay tarjetas activas configuradas');
    return 'Bronce';
  }

  // Ordenar niveles por requisitos de puntos (de mayor a menor) para evaluar desde el más alto
  const nivelesOrdenados = tarjetaActiva.niveles
    .slice() // crear copia para no mutar el original
    .sort((a, b) => b.puntosRequeridos - a.puntosRequeridos);

  // Encontrar el nivel MÁS ALTO que cumple (lógica OR)
  for (const nivel of nivelesOrdenados) {
    const cumplePuntos = puntos >= nivel.puntosRequeridos;
    const cumpleVisitas = visitas >= nivel.visitasRequeridas;

    // Lógica OR: cumple si tiene puntos suficientes O visitas suficientes
    if (cumplePuntos || cumpleVisitas) {
      // Solo log para cambios de nivel importantes
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Cliente califica para ${nivel.nombre} (Puntos: ${puntos}, Visitas: ${visitas})`
        );
      }
      return nivel.nombre;
    }
  }

  // Si no cumple ninguno, devolver el nivel más bajo (primer nivel)
  const nivelMinimo = tarjetaActiva.niveles[0]?.nombre || 'Bronce';
  return nivelMinimo;
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

    return NextResponse.json({
      message: `Cliente actualizado de ${nivelActual} a ${nivelCorrespondiente}`,
      nivelAnterior: nivelActual,
      nivelNuevo: nivelCorrespondiente,
      actualizado: true,
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
