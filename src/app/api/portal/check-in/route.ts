import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const checkInSchema = z.object({
  cedula: z.string().min(6, 'Cédula requerida'),
  locationId: z.string().min(1, 'Location ID requerido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = checkInSchema.parse(body);

    // Find client
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: validatedData.cedula }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado. Debe registrarse primero.' },
        { status: 404 }
      );
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: validatedData.locationId }
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Ubicación no válida' },
        { status: 400 }
      );
    }

    // Create check-in visit log
    await prisma.visitLog.create({
      data: {
        clienteId: cliente.id,
        action: 'check_in',
        metadata: {
          locationId: validatedData.locationId,
          locationName: location.name,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Update client visit count
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        totalVisitas: { increment: 1 },
        lastLogin: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `¡Bienvenido/a ${cliente.nombre} a ${location.name}!`,
      cliente: {
        nombre: cliente.nombre,
        puntos: cliente.puntos,
        totalVisitas: cliente.totalVisitas + 1
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
