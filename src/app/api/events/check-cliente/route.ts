/**
 * 🔍 Check if cliente exists in the business database
 * GET /api/events/check-cliente?cedula=xxx&eventId=xxx
 * 
 * This endpoint checks if a client with the given cedula exists
 * in the business associated with the event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get('cedula');
    const eventId = searchParams.get('eventId');

    if (!cedula || !eventId) {
      return NextResponse.json({ error: 'Cédula y eventId requeridos' }, { status: 400 });
    }

    // Get the event to find the businessId
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { businessId: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Check if client exists in this business
    const cliente = await prisma.cliente.findFirst({
      where: {
        cedula,
        businessId: event.businessId
      },
      select: {
        id: true,
        nombre: true,
        cedula: true,
        correo: true,
        telefono: true
      }
    });

    if (cliente) {
      return NextResponse.json({
        exists: true,
        cliente
      });
    }

    return NextResponse.json({
      exists: false,
      cliente: null
    });
  } catch (error) {
    console.error('❌ Error checking cliente:', error);
    return NextResponse.json({ error: 'Error al verificar cliente' }, { status: 500 });
  }
}
