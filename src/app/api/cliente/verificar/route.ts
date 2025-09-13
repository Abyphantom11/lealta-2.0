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
        cedula: cedula.toString(),
      },
      include: {
        tarjetaLealtad: true, // Incluir información de la tarjeta
      },
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
          visitas: cliente.totalVisitas,
          tarjetaLealtad: cliente.tarjetaLealtad
            ? {
                nivel: cliente.tarjetaLealtad.nivel,
                activa: cliente.tarjetaLealtad.activa,
                fechaAsignacion: cliente.tarjetaLealtad.fechaAsignacion,
                puntos: cliente.puntos, // Los puntos siempre vienen del cliente
              }
            : {
                nivel: 'Bronce',
                activa: true,
                fechaAsignacion: new Date(),
                puntos: cliente.puntos, // Los puntos siempre vienen del cliente
              },
        },
      });
    } else {
      // Cliente no existe
      return NextResponse.json({
        existe: false,
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
