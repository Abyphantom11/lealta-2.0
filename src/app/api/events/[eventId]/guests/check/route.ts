/**
 * 🔍 Check if guest is already registered for an event
 * GET /api/events/[eventId]/guests/check?cedula=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get('cedula');

    if (!cedula) {
      return NextResponse.json({ error: 'Cédula requerida' }, { status: 400 });
    }

    // Check if guest with this cedula is already registered for this event
    const existingGuest = await prisma.eventGuest.findFirst({
      where: {
        eventId,
        cedula,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingGuest) {
      return NextResponse.json({
        alreadyRegistered: true,
        qrToken: existingGuest.qrToken,
        guestName: existingGuest.name
      });
    }

    return NextResponse.json({
      alreadyRegistered: false
    });
  } catch (error) {
    console.error('❌ Error checking guest:', error);
    return NextResponse.json({ error: 'Error al verificar registro' }, { status: 500 });
  }
}
