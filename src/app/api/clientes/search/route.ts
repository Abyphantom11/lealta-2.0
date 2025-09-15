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

    // Buscar clientes por nombre, correo, teléfono o cédula
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: query } },
          { correo: { contains: query } },
          { telefono: { contains: query } },
          { cedula: { contains: query } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        cedula: true,
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
            registeredAt: true,
          },
        },
        // Incluir información de tarjeta si existe
        tarjetaLealtad: {
          select: {
            nivel: true,
            activa: true,
            asignacionManual: true,
            fechaAsignacion: true,
          },
        },
      },
      take: 10, // Limitar resultados
    });

    // Procesar datos para incluir estadísticas actualizadas y info de tarjeta
    const clientesConStats = clientes.map(cliente => {
      // Usar datos ya calculados del modelo, pero también verificar consumos recientes
      const gastoTotal = cliente.totalGastado;
      const puntosActuales = cliente.puntos;
      const visitasTotal = cliente.totalVisitas;

      // Información de tarjeta de lealtad
      const tarjetaInfo = cliente.tarjetaLealtad
        ? {
            nivel: cliente.tarjetaLealtad.nivel,
            activa: cliente.tarjetaLealtad.activa,
            asignacionManual: cliente.tarjetaLealtad.asignacionManual,
            fechaAsignacion: cliente.tarjetaLealtad.fechaAsignacion,
          }
        : null;

      return {
        id: cliente.id,
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        email: cliente.correo,
        telefono: cliente.telefono,
        puntos: puntosActuales,
        gastoTotal,
        visitas: visitasTotal,
        tarjetaLealtad: tarjetaInfo, // Cambiar 'tarjeta' por 'tarjetaLealtad'
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
