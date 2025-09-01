import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarNotificacionClientes, TipoNotificacion } from '@/lib/notificaciones';

// Type assertion temporal mientras TypeScript reconoce los nuevos modelos
const extendedPrisma = prisma as any;

export async function POST(request: NextRequest) {
  try {
    const { clienteId, nivel, asignacionManual = false, fastUpdate = false } = await request.json();

    if (!clienteId || !nivel) {
      return NextResponse.json(
        { error: 'Cliente ID y nivel son requeridos' },
        { status: 400 }
      );
    }
    
    // Usar el sistema de caché para operaciones rápidas cuando se solicita
    if (fastUpdate) {
      request.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    // Verificar si el cliente ya tiene una tarjeta
    const tarjetaExistente = await extendedPrisma.tarjetaLealtad.findUnique({
      where: { clienteId }
    });

    if (tarjetaExistente) {
      // Actualizar tarjeta existente
      const tarjetaActualizada = await extendedPrisma.tarjetaLealtad.update({
        where: { clienteId },
        data: {
          nivel,
          asignacionManual,
          condicionesCumplidas: true, // Marcar como cumplidas cuando es asignación manual
          fechaAsignacion: new Date(),
          historicoNiveles: {
            ...(tarjetaExistente.historicoNiveles || {}),
            [new Date().toISOString()]: {
              nivelAnterior: tarjetaExistente.nivel,
              nivelNuevo: nivel,
              asignacionManual
            }
          }
        }
      });

      // Enviar notificación de actualización de tarjeta
      await enviarNotificacionClientes(TipoNotificacion.TARJETA_ASIGNADA);
      
      return NextResponse.json({
        success: true,
        message: 'Tarjeta actualizada exitosamente',
        tarjeta: tarjetaActualizada
      });
    } else {
      // Obtener información del cliente para el nivel automático
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        include: {
          consumos: true
        }
      });

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        );
      }

      // Crear nueva tarjeta
      const nuevaTarjeta = await extendedPrisma.tarjetaLealtad.create({
        data: {
          clienteId,
          nivel,
          asignacionManual,
          activa: true,
          condicionesCumplidas: true, // Marcar como cumplidas cuando es asignación manual
          historicoNiveles: {
            [new Date().toISOString()]: {
              nivelAnterior: null,
              nivelNuevo: nivel,
              asignacionManual
            }
          }
        }
      });

      // Enviar notificación de asignación de nueva tarjeta
      await enviarNotificacionClientes(TipoNotificacion.TARJETA_ASIGNADA);

      return NextResponse.json({
        success: true,
        message: 'Tarjeta creada exitosamente',
        tarjeta: nuevaTarjeta
      });
    }

  } catch (error) {
    console.error('Error en asignación de tarjeta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}