/**
 * 🎟️ Event Guest Info API
 * GET: Get guest info by QR token (without checking in)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrToken = searchParams.get('qrToken');

    if (!qrToken) {
      return NextResponse.json(
        { success: false, error: 'Token QR requerido' },
        { status: 400 }
      );
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
        { success: false, error: 'Código QR no válido' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
        guestCount: guest.guestCount,
        phone: guest.phone,
        email: guest.email,
        status: guest.status,
        checkedInAt: guest.checkedInAt
      },
      event: {
        id: guest.Event.id,
        name: guest.Event.name,
        eventDate: guest.Event.eventDate,
        status: guest.Event.status
      }
    });
  } catch (error) {
    console.error('❌ Error getting guest info:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener información' },
      { status: 500 }
    );
  }
}
