import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API para cerrar automáticamente el día
 * Cambia todas las reservas PENDING del día anterior a NO_SHOW
 * 
 * Uso:
 * - Puede ejecutarse mediante cron job a las 00:01 cada día
 * - También se puede ejecutar manualmente desde el dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Calcular el límite del día comercial (4:00 AM de hoy)
    // Todo lo que sea antes de las 4 AM de hoy ya pasó y debe cerrarse
    const ahora = new Date();
    const limiteDiaComercial = new Date();
    limiteDiaComercial.setHours(4, 0, 0, 0); // 4:00 AM de hoy
    
    // Si aún no son las 4 AM, el límite es 4 AM de ayer
    if (ahora.getHours() < 4) {
      limiteDiaComercial.setDate(limiteDiaComercial.getDate() - 1);
    }
    
    console.log('🔄 Cerrando día comercial:', {
      businessId,
      horaActual: ahora.toISOString(),
      limiteDiaComercial: limiteDiaComercial.toISOString(),
      explicacion: 'Reservas antes de las 4:00 AM de hoy se consideran del día anterior'
    });

    // Buscar todas las reservas PENDING/CONFIRMED de días comerciales anteriores
    // (antes de las 4 AM de hoy)
    const reservasPendientes = await prisma.reservation.findMany({
      where: {
        businessId,
        status: {
          in: ['PENDING', 'CONFIRMED'] // Incluir ambos estados "no finales"
        },
        reservedAt: {
          lt: limiteDiaComercial // Menor que 4:00 AM de hoy
        }
      },
      include: {
        Cliente: true,
        Promotor: true
      }
    });

    console.log(`📊 Encontradas ${reservasPendientes.length} reservas pendientes de días anteriores`);

    // Actualizar todas a NO_SHOW
    const resultado = await prisma.reservation.updateMany({
      where: {
        businessId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        reservedAt: {
          lt: limiteDiaComercial
        }
      },
      data: {
        status: 'NO_SHOW',
        guestCount: 0 // Asegurar que guestCount sea 0 para NO_SHOW
      }
    });

    console.log(`✅ Actualizadas ${resultado.count} reservas a NO_SHOW`);

    // Log de las reservas actualizadas (para auditoría)
    const detalles = reservasPendientes.map(r => ({
      id: r.id,
      cliente: r.customerName,
      promotor: r.Promotor?.nombre || 'Sin promotor',
      fecha: r.reservedAt.toISOString(),
      hora: new Date(r.reservedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      guestCount: r.guestCount,
      estadoAnterior: r.status
    }));

    return NextResponse.json({
      success: true,
      message: `Día comercial cerrado correctamente. ${resultado.count} reservas actualizadas a NO_SHOW`,
      reservasActualizadas: resultado.count,
      detalles,
      limiteDiaComercial: limiteDiaComercial.toISOString(),
      explicacion: 'Todas las reservas PENDING/CONFIRMED antes de las 4:00 AM fueron marcadas como NO_SHOW'
    });

  } catch (error) {
    console.error('❌ Error al cerrar el día:', error);
    return NextResponse.json(
      { 
        error: 'Error al cerrar el día',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para verificar cuántas reservas pendientes hay
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Calcular el límite del día comercial (4:00 AM de hoy)
    const ahora = new Date();
    const limiteDiaComercial = new Date();
    limiteDiaComercial.setHours(4, 0, 0, 0);
    
    if (ahora.getHours() < 4) {
      limiteDiaComercial.setDate(limiteDiaComercial.getDate() - 1);
    }

    const reservasPendientes = await prisma.reservation.findMany({
      where: {
        businessId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        reservedAt: {
          lt: limiteDiaComercial
        }
      },
      select: {
        id: true,
        customerName: true,
        reservedAt: true,
        guestCount: true,
        status: true,
        Promotor: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        reservedAt: 'desc'
      }
    });

    return NextResponse.json({
      total: reservasPendientes.length,
      limiteDiaComercial: limiteDiaComercial.toISOString(),
      explicacion: 'Reservas PENDING/CONFIRMED antes de las 4:00 AM que deberían cerrarse',
      reservas: reservasPendientes.map(r => ({
        id: r.id,
        cliente: r.customerName,
        promotor: r.Promotor?.nombre || 'Sin promotor',
        fechaHora: r.reservedAt.toISOString(),
        personas: r.guestCount,
        estado: r.status
      }))
    });

  } catch (error) {
    console.error('❌ Error al verificar reservas pendientes:', error);
    return NextResponse.json(
      { error: 'Error al verificar reservas pendientes' },
      { status: 500 }
    );
  }
}
