import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Buscar clientes por nombre, correo o teléfono
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: query } },
          { correo: { contains: query } },
          { telefono: { contains: query } }
        ]
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        puntos: true,
        totalGastado: true,
        totalVisitas: true,
        // Incluir consumos para calcular estadísticas actualizadas
        consumos: {
          select: {
            total: true,
            puntos: true,
            registeredAt: true
          }
        }
      },
      take: 10 // Limitar resultados
    });

    // Procesar datos para incluir estadísticas actualizadas
    const clientesConStats = clientes.map(cliente => {
      // Usar datos ya calculados del modelo, pero también verificar consumos recientes
      const gastoTotal = cliente.totalGastado;
      const puntosActuales = cliente.puntos;
      const visitasTotal = cliente.totalVisitas;

      return {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.correo,
        telefono: cliente.telefono,
        puntos: puntosActuales,
        gastoTotal,
        visitas: visitasTotal
      };
    });

    return NextResponse.json(clientesConStats);
  } catch (error) {
    console.error('Error buscando clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
