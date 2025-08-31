import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Type assertion temporal mientras TypeScript reconoce los nuevos modelos
const extendedPrisma = prisma as any;

export async function POST(request: NextRequest) {
  try {
    const { clienteId, nivel, asignacionManual = false } = await request.json();

    if (!clienteId || !nivel) {
      return NextResponse.json(
        { error: 'Cliente ID y nivel son requeridos' },
        { status: 400 }
      );
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
          historicoNiveles: {
            [new Date().toISOString()]: {
              nivelAnterior: null,
              nivelNuevo: nivel,
              asignacionManual
            }
          }
        }
      });

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