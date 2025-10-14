import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/reservas/[id]/consumo - Obtener el consumo detallado de una reserva
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservaId = params.id;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const reserva = await prisma.reservation.findFirst({
      where: {
        id: reservaId,
        businessId: businessId
      },
      include: {
        cliente: true,
        service: true,
        slot: true
      }
    });

    if (!reserva) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Obtener todas las asociaciones de tickets para esta reserva
    const ticketAssociations = await prisma.ticketReservaAssociation.findMany({
      where: {
        reservaId: reservaId,
        businessId: businessId
      },
      orderBy: {
        associatedAt: 'desc'
      }
    });

    // Calcular estadísticas de consumo
    const totalConsumo = ticketAssociations.reduce((sum, assoc) => sum + (assoc.ticketAmount || 0), 0);
    const totalTickets = ticketAssociations.length;
    const consumoPromedioPorTicket = totalTickets > 0 ? totalConsumo / totalTickets : 0;
    const consumoPromedioPorPersona = reserva.guestCount > 0 ? totalConsumo / reserva.guestCount : 0;

    // Análisis de productos más consumidos
    const productosConsumo: { [key: string]: number } = {};
    ticketAssociations.forEach(assoc => {
      if (assoc.ticketItems && Array.isArray(assoc.ticketItems)) {
        (assoc.ticketItems as string[]).forEach(item => {
          productosConsumo[item] = (productosConsumo[item] || 0) + 1;
        });
      }
    });

    const topProductos = Object.entries(productosConsumo)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([producto, cantidad]) => ({ producto, cantidad }));

    const response = {
      success: true,
      reserva: {
        id: reserva.id,
        cliente: reserva.cliente?.nombre || 'Cliente sin nombre',
        numeroPersonas: reserva.guestCount,
        fecha: reserva.slot?.date ? new Date(reserva.slot.date).toISOString().split('T')[0] : '',
        hora: reserva.slot?.startTime ? 
          new Date(reserva.slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
        estado: reserva.status
      },
      consumo: {
        totalConsumo,
        totalTickets,
        consumoPromedioPorTicket,
        consumoPromedioPorPersona,
        topProductos,
        detalleTickets: ticketAssociations.map(assoc => ({
          ticketId: assoc.ticketId,
          monto: assoc.ticketAmount || 0,
          items: assoc.ticketItems || [],
          fechaAsociacion: assoc.associatedAt
        }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo consumo de reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
