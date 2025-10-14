import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/tickets/asociar-reserva - Asociar un ticket con una reserva
export async function POST(request: NextRequest) {
  try {
    const { ticketId, reservaId, businessId, ticketAmount, ticketItems } = await request.json();

    if (!ticketId || !reservaId || !businessId) {
      return NextResponse.json(
        { success: false, error: 'ticketId, reservaId y businessId son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔗 Asociando ticket con reserva:', { ticketId, reservaId, businessId, ticketAmount });

    // Verificar que la reserva existe y pertenece al business
    const reserva = await prisma.reservation.findFirst({
      where: {
        id: reservaId,
        businessId: businessId
      }
    });

    if (!reserva) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Buscar si ya existe una asociación para este ticket
    let ticketReservaAssociation = await prisma.ticketReservaAssociation.findFirst({
      where: {
        ticketId: ticketId,
        businessId: businessId
      }
    });

    if (ticketReservaAssociation) {
      // Actualizar la asociación existente
      ticketReservaAssociation = await prisma.ticketReservaAssociation.update({
        where: { id: ticketReservaAssociation.id },
        data: {
          reservaId: reservaId,
          updatedAt: new Date(),
          ticketAmount: ticketAmount || null,
          ticketItems: ticketItems || null
        },
        include: {
          reservation: {
            include: {
              cliente: true
            }
          }
        }
      });
    } else {
      // Crear nueva asociación
      ticketReservaAssociation = await prisma.ticketReservaAssociation.create({
        data: {
          ticketId: ticketId,
          reservaId: reservaId,
          businessId: businessId,
          associatedAt: new Date(),
          ticketAmount: ticketAmount || null,
          ticketItems: ticketItems || null
        },
        include: {
          reservation: {
            include: {
              cliente: true
            }
          }
        }
      });
    }

    console.log('✅ Asociación creada/actualizada exitosamente');

    return NextResponse.json({
      success: true,
      association: {
        id: ticketReservaAssociation.id,
        ticketId: ticketReservaAssociation.ticketId,
        reservaId: ticketReservaAssociation.reservaId,
        reservaNombre: (ticketReservaAssociation as any).reservation?.cliente?.nombre || 'Cliente sin nombre',
        associatedAt: ticketReservaAssociation.associatedAt,
        ticketAmount: ticketReservaAssociation.ticketAmount,
        ticketItems: ticketReservaAssociation.ticketItems
      }
    });

  } catch (error) {
    console.error('❌ Error asociando ticket con reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/tickets/asociar-reserva - Obtener todas las asociaciones de tickets con reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const reservaId = searchParams.get('reservaId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const whereClause: any = { businessId };
    if (reservaId) {
      whereClause.reservaId = reservaId;
    }

    const associations = await prisma.ticketReservaAssociation.findMany({
      where: whereClause,
      include: {
        reservation: {
          include: {
            cliente: true
          }
        }
      },
      orderBy: {
        associatedAt: 'desc'
      }
    });

    // Calcular el consumo total por reserva
    const consumoPorReserva = associations.reduce((acc: any, association) => {
      const reservaId = association.reservaId;
      if (!acc[reservaId]) {
        acc[reservaId] = {
          reservaId,
          reservaNombre: (association as any).reservation?.cliente?.nombre || 'Cliente sin nombre',
          tickets: [],
          consumoTotal: 0
        };
      }
      
      // Agregar información del ticket
      acc[reservaId].tickets.push({
        ticketId: association.ticketId,
        associatedAt: association.associatedAt,
        ticketAmount: association.ticketAmount || 0,
        ticketItems: association.ticketItems
      });
      
      // Sumar al consumo total
      acc[reservaId].consumoTotal += association.ticketAmount || 0;
      
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      associations,
      consumoPorReserva: Object.values(consumoPorReserva)
    });

  } catch (error) {
    console.error('❌ Error obteniendo asociaciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
