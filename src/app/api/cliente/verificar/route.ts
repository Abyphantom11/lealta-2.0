import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { cedula } = await request.json();

    if (!cedula) {
      return NextResponse.json(
        { error: 'Cédula es requerida' },
        { status: 400 }
      );
    }

    // Buscar cliente por cédula (sin restricción de business por ahora)
    const cliente = await prisma.cliente.findFirst({
      where: {
        cedula: cedula.toString()
      }
    });

    if (cliente) {
      // Cliente existe
      return NextResponse.json({
        existe: true,
        cliente: {
          id: cliente.id,
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          puntos: cliente.puntos,
          visitas: cliente.totalVisitas
        }
      });
    } else {
      // Cliente no existe
      return NextResponse.json({
        existe: false
      });
    }

  } catch (error) {
    console.error('Error verificando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
