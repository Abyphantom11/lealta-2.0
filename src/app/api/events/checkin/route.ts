/**
 * 🎟️ Event Guest Check-in API
 * POST: Check-in a guest by QR token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/events/checkin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrToken, userId } = body;

    if (!qrToken) {
      return NextResponse.json({ error: 'Token QR requerido' }, { status: 400 });
    }

    // Find guest by token
    const guest = await prisma.eventGuest.findUnique({
      where: { qrToken },
      include: {
        Event: true
      }
    });

    if (!guest) {
      return NextResponse.json(
        { error: 'Código QR no válido', valid: false },
        { status: 404 }
      );
    }

    // Check status
    if (guest.status === 'CHECKED_IN') {
      return NextResponse.json({
        valid: true,
        alreadyCheckedIn: true,
        guest: {
          id: guest.id,
          name: guest.name,
          guestCount: guest.guestCount,
          checkedInAt: guest.checkedInAt
        },
        event: {
          name: guest.Event.name
        },
        message: `${guest.name} ya registró su entrada a las ${guest.checkedInAt?.toLocaleTimeString('es-EC')}`
      });
    }

    if (guest.status === 'CANCELLED') {
      return NextResponse.json(
        { 
          error: 'Este registro fue cancelado',
          valid: false,
          cancelled: true
        },
        { status: 400 }
      );
    }

    // Check if event is active
    if (guest.Event.status !== 'ACTIVE' && guest.Event.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { 
          error: 'El evento no está activo actualmente',
          valid: false
        },
        { status: 400 }
      );
    }

    // Perform check-in
    const updatedGuest = await prisma.eventGuest.update({
      where: { id: guest.id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInBy: userId || 'scanner'
      }
    });

    return NextResponse.json({
      success: true,
      valid: true,
      guest: {
        id: updatedGuest.id,
        name: updatedGuest.name,
        guestCount: updatedGuest.guestCount,
        phone: updatedGuest.phone,
        checkedInAt: updatedGuest.checkedInAt
      },
      event: {
        name: guest.Event.name,
        eventDate: guest.Event.eventDate
      },
      message: `✅ Bienvenido ${updatedGuest.name}! (${updatedGuest.guestCount} persona${updatedGuest.guestCount > 1 ? 's' : ''})`
    });
  } catch (error) {
    console.error('❌ Error checking in guest:', error);
    return NextResponse.json({ error: 'Error al registrar entrada' }, { status: 500 });
  }
}
