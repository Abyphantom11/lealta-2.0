/**
 * 🎉 Events API - CRUD for events
 * GET: List all events for a business
 * POST: Create a new event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// Helper para obtener la URL base dinámicamente
function getBaseUrl(request: NextRequest): string {
  // En producción, usar el dominio configurado
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // En desarrollo, usar el host de la request (funciona con tunnels)
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
}

// GET /api/events?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
    }

    const baseUrl = getBaseUrl(request);

    const events = await prisma.event.findMany({
      where: { businessId },
      include: {
        _count: {
          select: { EventGuest: true }
        }
      },
      orderBy: { eventDate: 'desc' }
    });

    // Map to include guest count
    const eventsWithCount = events.map(event => ({
      ...event,
      guestCount: event._count.EventGuest,
      registrationUrl: `${baseUrl}/evento/${event.slug}`
    }));

    return NextResponse.json({ events: eventsWithCount });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
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
      isPublic
    } = body;

    if (!businessId || !name || !eventDate || !startTime || !maxCapacity) {
      return NextResponse.json(
        { error: 'Campos requeridos: businessId, name, eventDate, startTime, maxCapacity' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '') // Remove accents
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(?:^-|-$)/g, '');
    
    const uniqueSlug = `${baseSlug}-${nanoid(6)}`;

    const event = await prisma.event.create({
      data: {
        businessId,
        name,
        description,
        slug: uniqueSlug,
        eventDate: new Date(eventDate),
        startTime,
        endTime,
        maxCapacity: Number.parseInt(maxCapacity),
        imageUrl,
        primaryColor: primaryColor || '#6366f1',
        requirePhone: requirePhone !== false,
        requireEmail: requireEmail === true,
        customFields,
        isPublic: isPublic !== false,
        status: 'DRAFT'
      }
    });

    const baseUrl = getBaseUrl(request);

    return NextResponse.json({
      event,
      registrationUrl: `${baseUrl}/evento/${event.slug}`
    });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 });
  }
}
