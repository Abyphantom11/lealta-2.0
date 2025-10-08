import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { HostEvent } from '@/types/host-tracking';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/host-stats/[eventId]
 * 
 * Obtiene el detalle completo de un evento específico como anfitrión.
 * Incluye todos los consumos de invitados con productos detallados.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: 'businessId es requerido',
        },
        { status: 400 }
      );
    }

    console.log('📋 [HOST EVENT DETAIL] Obteniendo evento:', eventId);

    // 1. Buscar el evento
    const hostTracking = await prisma.hostTracking.findFirst({
      where: {
        id: eventId,
        businessId,
      },
      include: {
        anfitrion: {
          select: {
            nombre: true,
            cedula: true,
            correo: true,
            telefono: true,
          },
        },
        reservation: {
          select: {
            reservationNumber: true,
            status: true,
            reservedAt: true,
            customerEmail: true,
            customerPhone: true,
          },
        },
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!hostTracking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Evento no encontrado',
        },
        { status: 404 }
      );
    }

    // 2. Calcular total del evento
    const totalEvento = hostTracking.guestConsumos.reduce(
      (sum, gc) => sum + gc.consumo.total,
      0
    );

    // 3. Obtener productos del evento
    const productosEvento = new Map<string, { nombre: string; cantidad: number; categoria?: string }>();

    hostTracking.guestConsumos.forEach((gc) => {
      try {
        const productos = gc.consumo.productos as any[];
        if (!Array.isArray(productos)) return;

        productos.forEach((p) => {
          const key = p.nombre || 'Producto desconocido';
          if (!productosEvento.has(key)) {
            productosEvento.set(key, {
              nombre: key,
              cantidad: 0,
              categoria: p.categoria,
            });
          }
          const existing = productosEvento.get(key)!;
          existing.cantidad += p.cantidad || 1;
        });
      } catch (error) {
        console.warn('⚠️ [HOST EVENT DETAIL] Error procesando productos:', error);
      }
    });

    const productosTop = Array.from(productosEvento.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // 4. Formatear detalle del evento
    const eventDetail: HostEvent & {
      anfitrionInfo: any;
      reservationInfo: any;
      productosTop: any[];
    } = {
      id: hostTracking.id,
      fecha: hostTracking.reservationDate,
      mesa: hostTracking.tableNumber || 'Sin mesa asignada',
      invitados: hostTracking.guestCount,
      totalConsumo: totalEvento,
      consumosDetalle: hostTracking.guestConsumos.map((gc) => ({
        guestName: gc.guestName || gc.consumo.cliente.nombre || 'Invitado',
        guestCedula: gc.guestCedula || gc.consumo.cliente.cedula,
        total: gc.consumo.total,
        productos: Array.isArray(gc.consumo.productos)
          ? (gc.consumo.productos as any[]).map(
              (p) => `${p.cantidad || 1}x ${p.nombre || 'Producto'}`
            )
          : [],
        registeredAt: gc.consumo.registeredAt,
        puntos: gc.consumo.puntos,
      })),
      anfitrionInfo: {
        nombre: hostTracking.anfitrion.nombre,
        cedula: hostTracking.anfitrion.cedula,
        correo: hostTracking.anfitrion.correo,
        telefono: hostTracking.anfitrion.telefono,
      },
      reservationInfo: {
        numero: hostTracking.reservation.reservationNumber,
        status: hostTracking.reservation.status,
        horaReservada: hostTracking.reservation.reservedAt,
      },
      productosTop,
    };

    console.log('✅ [HOST EVENT DETAIL] Evento obtenido:', {
      id: eventDetail.id,
      mesa: eventDetail.mesa,
      totalConsumo: eventDetail.totalConsumo,
      consumos: eventDetail.consumosDetalle.length,
    });

    return NextResponse.json({
      success: true,
      event: eventDetail,
    });

  } catch (error) {
    console.error('❌ [HOST EVENT DETAIL] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener detalle del evento',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
