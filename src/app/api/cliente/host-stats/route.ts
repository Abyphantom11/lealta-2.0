import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { HostStats, ProductoFavorito, HostEvent } from '@/types/host-tracking';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/host-stats?clienteId=xxx&businessId=xxx
 * 
 * Obtiene las estadísticas del cliente como anfitrión.
 * Incluye:
 * - Total consumido por sus invitados
 * - Número de invitados únicos
 * - Eventos realizados
 * - Productos favoritos del grupo
 * - Historial de eventos recientes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const businessId = searchParams.get('businessId');

    if (!clienteId || !businessId) {
      return NextResponse.json(
        {
          success: false,
          error: 'clienteId y businessId son requeridos',
        },
        { status: 400 }
      );
    }

    console.log('📊 [HOST STATS] Obteniendo stats para cliente:', clienteId);

    // 1. Obtener todos los eventos donde es anfitrión
    const hostTrackings = await prisma.hostTracking.findMany({
      where: {
        clienteId,
        businessId,
      },
      include: {
        guestConsumos: {
          include: {
            consumo: {
              include: {
                cliente: {
                  select: {
                    nombre: true,
                    cedula: true,
                  },
                },
              },
            },
          },
        },
        reservation: {
          select: {
            reservationNumber: true,
            status: true,
            reservedAt: true,
          },
        },
      },
      orderBy: {
        reservationDate: 'desc',
      },
    });

    console.log(`📊 [HOST STATS] Encontrados ${hostTrackings.length} eventos`);

    // 2. Procesar todos los consumos
    const allConsumos = hostTrackings.flatMap((ht) =>
      ht.guestConsumos.map((gc) => gc.consumo)
    );

    console.log(`📊 [HOST STATS] Total consumos de invitados: ${allConsumos.length}`);

    // 3. Calcular totales
    const totalConsumo = allConsumos.reduce((sum, c) => sum + c.total, 0);
    const clientesUnicos = new Set(allConsumos.map((c) => c.clienteId));
    const totalInvitados = clientesUnicos.size;

    // 4. Agregar productos favoritos
    const productosMap = new Map<string, ProductoFavorito>();

    allConsumos.forEach((consumo) => {
      try {
        const productos = consumo.productos as any[];
        if (!Array.isArray(productos)) return;

        productos.forEach((p) => {
          const key = p.nombre || 'Producto desconocido';
          if (!productosMap.has(key)) {
            productosMap.set(key, {
              nombre: key,
              cantidad: 0,
              totalGastado: 0,
              categoria: p.categoria || 'otro',
            });
          }
          const existing = productosMap.get(key)!;
          existing.cantidad += p.cantidad || 1;
          existing.totalGastado += (p.precio || 0) * (p.cantidad || 1);
        });
      } catch (error) {
        console.warn('⚠️ [HOST STATS] Error procesando productos:', error);
      }
    });

    // 5. Ordenar productos por cantidad (más pedidos primero)
    const productosFavoritos = Array.from(productosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10); // Top 10

    console.log('📊 [HOST STATS] Productos favoritos calculados:', productosFavoritos.length);

    // 6. Formatear eventos recientes (últimos 5)
    const eventosRecientes: HostEvent[] = hostTrackings.slice(0, 5).map((ht) => {
      const consumosEvento = ht.guestConsumos.map((gc) => gc.consumo);
      const totalEvento = consumosEvento.reduce((sum, c) => sum + c.total, 0);

      return {
        id: ht.id,
        fecha: ht.reservationDate,
        mesa: ht.tableNumber || 'Sin mesa',
        invitados: ht.guestCount,
        totalConsumo: totalEvento,
        reservationNumber: ht.reservation.reservationNumber,
        status: ht.reservation.status,
        consumosDetalle: ht.guestConsumos.map((gc) => ({
          guestName: gc.guestName || 'Invitado',
          guestCedula: gc.guestCedula,
          total: gc.consumo.total,
          productos: Array.isArray(gc.consumo.productos)
            ? (gc.consumo.productos as any[]).map((p) => p.nombre || 'Producto')
            : [],
          registeredAt: gc.consumo.registeredAt,
        })),
      };
    });

    const stats: HostStats = {
      totalConsumo,
      totalInvitados,
      totalEventos: hostTrackings.length,
      productosFavoritos,
      eventosRecientes,
    };

    console.log('✅ [HOST STATS] Stats calculados exitosamente:', {
      totalConsumo: stats.totalConsumo,
      totalInvitados: stats.totalInvitados,
      totalEventos: stats.totalEventos,
    });

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('❌ [HOST STATS] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al calcular estadísticas',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
