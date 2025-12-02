/**
 * 🎉 Event API - Single event operations
 * GET: Get event details
 * PATCH: Update event
 * DELETE: Delete event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

// Helper para obtener la URL base dinámicamente
function getBaseUrl(request: NextRequest): string {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
}

// GET /api/events/[eventId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { EventGuest: true }
        },
        EventGuest: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const baseUrl = getBaseUrl(request);

    return NextResponse.json({
      ...event,
      guestCount: event._count.EventGuest,
      registrationUrl: `${baseUrl}/evento/${event.slug}`
    });
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    return NextResponse.json({ error: 'Error al obtener evento' }, { status: 500 });
  }
}

// PATCH /api/events/[eventId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const body = await request.json();

    const {
      name,
      description,
      eventDate,
      startTime,
      endTime,
      maxCapacity,
      imageUrl,
      primaryColor,
      requirePhone,
      requireEmail,
      customFields,
      status,
      isPublic
    } = body;

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (maxCapacity !== undefined) updateData.maxCapacity = Number.parseInt(maxCapacity);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (requirePhone !== undefined) updateData.requirePhone = requirePhone;
    if (requireEmail !== undefined) updateData.requireEmail = requireEmail;
    if (customFields !== undefined) updateData.customFields = customFields;
    if (status !== undefined) updateData.status = status;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    return NextResponse.json({ error: 'Error al actualizar evento' }, { status: 500 });
  }
}

// DELETE /api/events/[eventId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    await prisma.event.delete({
      where: { id: eventId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    return NextResponse.json({ error: 'Error al eliminar evento' }, { status: 500 });
  }
}
