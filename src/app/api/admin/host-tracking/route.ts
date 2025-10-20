import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/host-tracking
 * 
 * Lista todos los anfitriones con estadísticas de consumo de invitados.
 * Para uso del panel de SuperAdmin.
 * 
 * Query params:
 * - businessId: string (requerido)
 * - isActive: boolean (opcional - filtrar por activos/inactivos)
 * - limit: number (opcional - default: 50)
 * - orderBy: 'date' | 'consumo' | 'invitados' (opcional - default: 'date')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const isActiveParam = searchParams.get('isActive');
    const limitParam = searchParams.get('limit');
    const orderBy = searchParams.get('orderBy') || 'date';

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: 'businessId es requerido',
        },
        { status: 400 }
      );
    }

    console.log('📊 [ADMIN HOST TRACKING] Obteniendo lista de anfitriones:', {
      businessId,
      isActive: isActiveParam,
      orderBy,
    });

    // Construir filtros
    const whereClause: any = { businessId };
    if (isActiveParam !== null) {
      whereClause.isActive = isActiveParam === 'true';
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Obtener anfitriones con relaciones
    const hostTrackings = await prisma.hostTracking.findMany({
      where: whereClause,
      include: {
        Cliente: {
          select: {
            id: true,
            nombre: true,
            cedula: true,
            correo: true,
            telefono: true,
            puntos: true,
            totalGastado: true,
          },
        },
        reservation: {
          select: {
            reservationNumber: true,
            status: true,
            reservedAt: true,
          },
        },
        GuestConsumo: {
          include: {
            Consumo: {
              select: {
                id: true,
                total: true,
                puntos: true,
                productos: true,
                registeredAt: true,
                clienteId: true,
                Cliente: {
                  select: {
                    nombre: true,
                    cedula: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy:
        orderBy === 'date'
          ? { reservationDate: 'desc' }
          : orderBy === 'invitados'
          ? { guestCount: 'desc' }
          : { createdAt: 'desc' },
      take: limit,
    });

    console.log(`✅ [ADMIN HOST TRACKING] Encontrados ${hostTrackings.length} anfitriones`);

    // Calcular estadísticas para cada anfitrión
    const hostTrackingsWithStats = hostTrackings.map((ht) => {
      const totalConsumo = ht.GuestConsumo.reduce(
        (sum, gc) => sum + gc.Consumo.total,
        0
      );
      const totalPuntos = ht.GuestConsumo.reduce(
        (sum, gc) => sum + gc.Consumo.puntos,
        0
      );
      const invitadosRegistrados = new Set(
        ht.GuestConsumo.map((gc) => gc.Consumo.clienteId)
      ).size;

      // Productos más consumidos
      const productosMap = new Map<string, number>();
      ht.GuestConsumo.forEach((gc) => {
        try {
          const productos = gc.Consumo.productos as any[];
          if (Array.isArray(productos)) {
            productos.forEach((p) => {
              const nombre = p.nombre || 'Desconocido';
              productosMap.set(nombre, (productosMap.get(nombre) || 0) + (p.cantidad || 1));
            });
          }
        } catch (error) {
          console.warn('Error procesando productos:', error);
        }
      });

      const topProductos = Array.from(productosMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }));

      return {
        id: ht.id,
        reservationId: ht.reservationId,
        reservationNumber: ht.reservation.reservationNumber,
        reservationStatus: ht.reservation.status,
        reservationDate: ht.reservationDate,
        tableNumber: ht.tableNumber,
        guestCount: ht.guestCount,
        isActive: ht.isActive,
        createdAt: ht.createdAt,
        anfitrion: {
          id: ht.Cliente.id,
          nombre: ht.Cliente.nombre,
          cedula: ht.Cliente.cedula,
          correo: ht.Cliente.correo,
          telefono: ht.Cliente.telefono,
          puntos: ht.Cliente.puntos,
          totalGastado: ht.Cliente.totalGastado,
        },
        stats: {
          consumosVinculados: ht.GuestConsumo.length,
          totalConsumo,
          totalPuntos,
          invitadosRegistrados,
          promedioConsumo: ht.GuestConsumo.length > 0 
            ? totalConsumo / ht.GuestConsumo.length 
            : 0,
          topProductos,
        },
        // Incluir detalle de invitados si es necesario
        invitados: ht.GuestConsumo.map((gc) => ({
          guestName: gc.guestName,
          guestCedula: gc.guestCedula,
          consumoTotal: gc.Consumo.total,
          consumoPuntos: gc.Consumo.puntos,
          consumoFecha: gc.Consumo.registeredAt,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: hostTrackingsWithStats,
      count: hostTrackingsWithStats.length,
      summary: {
        totalAnfitriones: hostTrackingsWithStats.length,
        totalConsumo: hostTrackingsWithStats.reduce(
          (sum, ht) => sum + ht.stats.totalConsumo,
          0
        ),
        totalInvitados: hostTrackingsWithStats.reduce(
          (sum, ht) => sum + ht.stats.invitadosRegistrados,
          0
        ),
        activos: hostTrackingsWithStats.filter((ht) => ht.isActive).length,
      },
    });
  } catch (error) {
    console.error('❌ [ADMIN HOST TRACKING] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener lista de anfitriones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/host-tracking
 * 
 * Desactivar/reactivar un tracking de anfitrión.
 * 
 * Body:
 * {
 *   hostTrackingId: string;
 *   isActive: boolean;
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostTrackingId, isActive } = body;

    if (!hostTrackingId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'hostTrackingId e isActive son requeridos',
        },
        { status: 400 }
      );
    }

    console.log('🔄 [ADMIN HOST TRACKING] Actualizando estado:', {
      hostTrackingId,
      isActive,
    });

    const updated = await prisma.hostTracking.update({
      where: { id: hostTrackingId },
      data: { isActive },
      include: {
        Cliente: {
          select: {
            nombre: true,
          },
        },
      },
    });

    console.log(`✅ [ADMIN HOST TRACKING] Estado actualizado para ${updated.Cliente.nombre}`);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Tracking ${isActive ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    console.error('❌ [ADMIN HOST TRACKING] Error al actualizar:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar tracking',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
