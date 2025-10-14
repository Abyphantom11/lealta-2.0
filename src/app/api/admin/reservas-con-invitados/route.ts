import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Schema de validación
const querySchema = z.object({
  businessId: z.string().min(1, 'businessId es requerido'),
  anfitrionCedula: z.string().optional(), // Ahora es opcional
});

/**
 * GET /api/admin/reservas-con-invitados
 * 
 * Obtiene todas las reservas donde el cliente es anfitrión,
 * con los consumos de los invitados vinculados, estadísticas
 * y top productos consumidos.
 * 
 * Query params:
 * - businessId: ID del negocio
 * - anfitrionCedula: (Opcional) Cédula del anfitrión. Si no se proporciona, devuelve todas las reservas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar parámetros
    const params = querySchema.parse({
      businessId: searchParams.get('businessId'),
      anfitrionCedula: searchParams.get('anfitrionCedula'),
    });

    console.log('🔍 [RESERVAS INVITADOS] Buscando reservas:', params);

    // 1. Si se proporciona anfitrionCedula, buscar ese cliente específico
    // Si no, buscar todas las reservas con invitados
    let anfitrion = null;
    const whereCondition: { businessId: string; clienteId?: string } = {
      businessId: params.businessId,
    };

    if (params.anfitrionCedula) {
      anfitrion = await prisma.cliente.findFirst({
        where: {
          cedula: params.anfitrionCedula,
          businessId: params.businessId,
        },
        select: {
          id: true,
          nombre: true,
          cedula: true,
        },
      });

      if (!anfitrion) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Cliente no encontrado',
        });
      }

      whereCondition.clienteId = anfitrion.id;
    }

    // 2. Buscar todas las reservas donde hay invitados
    const hostTrackings = await prisma.hostTracking.findMany({
      where: whereCondition,
      include: {
        anfitrion: {
          select: {
            id: true,
            nombre: true,
            cedula: true,
          },
        },
        reservation: {
          select: {
            id: true,
            reservationNumber: true,
            reservedAt: true,
          },
        },
        guestConsumos: {
          include: {
            consumo: {
              select: {
                id: true,
                total: true,
                puntos: true,
                productos: true, // JSON field
                registeredAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        reservationDate: 'desc',
      },
    });

    console.log(`✅ [RESERVAS INVITADOS] Encontradas ${hostTrackings.length} reservas`);

    // 3. Formatear los datos
    const reservasFormateadas = hostTrackings.map((ht) => {
      // Calcular estadísticas
      const invitados = ht.guestConsumos.map((gc) => {
        // Parsear productos desde JSON
        const productosJson = gc.consumo.productos;
        const productosArray = Array.isArray(productosJson) ? productosJson : [];

        return {
          guestName: gc.guestName,
          guestCedula: gc.guestCedula,
          consumoId: gc.consumoId,
          consumoTotal: gc.consumo.total,
          consumoPuntos: gc.consumo.puntos,
          consumoFecha: gc.consumo.registeredAt.toISOString(),
          productos: productosArray.map((p: any) => ({
            nombre: p.nombre || p.name || 'Producto',
            cantidad: p.cantidad || 1,
            precio: p.precio || p.price || 0,
          })),
        };
      });

      const totalConsumo = invitados.reduce((sum, inv) => sum + inv.consumoTotal, 0);
      const totalPuntos = invitados.reduce((sum, inv) => sum + inv.consumoPuntos, 0);

      // Calcular top productos
      const productosCount: Record<string, { cantidad: number; totalVendido: number }> = {};
      
      invitados.forEach((invitado) => {
        invitado.productos.forEach((producto) => {
          if (!productosCount[producto.nombre]) {
            productosCount[producto.nombre] = { cantidad: 0, totalVendido: 0 };
          }
          productosCount[producto.nombre].cantidad += producto.cantidad;
          productosCount[producto.nombre].totalVendido += producto.precio * producto.cantidad;
        });
      });

      const topProductos = Object.entries(productosCount)
        .map(([nombre, stats]) => ({
          nombre,
          cantidad: stats.cantidad,
          totalVendido: stats.totalVendido,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 3);

      return {
        id: ht.id,
        reservationNumber: ht.reservation.reservationNumber,
        reservationDate: ht.reservationDate.toISOString(),
        tableNumber: ht.tableNumber,
        guestCount: ht.guestCount,
        anfitrion: {
          nombre: ht.anfitrion.nombre,
          cedula: ht.anfitrion.cedula,
        },
        invitados,
        stats: {
          totalConsumo,
          totalPuntos,
          totalInvitados: invitados.length,
          consumosRegistrados: invitados.length,
          topProductos,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: reservasFormateadas,
      count: reservasFormateadas.length,
    });

  } catch (error) {
    console.error('❌ [RESERVAS INVITADOS] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
