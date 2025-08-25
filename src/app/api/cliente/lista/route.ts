import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener todos los clientes registrados
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        registeredAt: 'desc'
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        telefono: true,
        correo: true,
        puntos: true,
        totalVisitas: true,
        registeredAt: true,
        lastLogin: true
      }
    });

    return NextResponse.json({
      success: true,
      clientes
    });

  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
