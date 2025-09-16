import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireBusinessContext } from '../../../../middleware/api-business-filter';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener contexto de business del usuario autenticado
    const context = await requireBusinessContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 401 }
      );
    }

    const { businessId } = context;

    // Obtener el historial real de canjes SOLO del business del usuario
    const canjes = await prisma.historialCanje.findMany({
      where: {
        // Filtrar por business a través de la relación cliente
        cliente: {
          businessId: businessId, // ✅ FILTRO POR BUSINESS
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limitar a los últimos 50 canjes
    });

    // Transformar los datos para el frontend
    const canjesFormateados = canjes.map(canje => ({
      id: canje.id,
      clienteId: canje.clienteId,
      clienteNombre: canje.clienteNombre,
      clienteCedula: canje.clienteCedula,
      recompensaId: canje.recompensaId,
      recompensaNombre: canje.recompensaNombre,
      puntosDescontados: canje.puntosDescontados,
      fecha: canje.createdAt,
    }));

    return NextResponse.json({
      success: true,
      canjes: canjesFormateados,
      total: canjesFormateados.length,
    });

  } catch (error) {
    console.error('Error obteniendo historial de canjes:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
