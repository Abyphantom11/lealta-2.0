/**
 * 🌐 Public Event API - Get event by slug (no auth required)
 * Used for the public registration page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/events/public/[slug]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        Business: {
          select: {
            name: true,
            BrandingConfig: {
              select: {
                logoUrl: true,
                primaryColor: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Increment view count
    await prisma.event.update({
      where: { id: event.id },
      data: { totalViews: { increment: 1 } }
    });

    // Calculate available spots
    const currentPeople = await prisma.eventGuest.aggregate({
      where: { 
        eventId: event.id,
        status: { not: 'CANCELLED' }
      },
      _sum: { guestCount: true }
    });

    const totalRegistered = currentPeople._sum.guestCount || 0;
    const availableSpots = event.maxCapacity - totalRegistered;

    // Return public data only
    return NextResponse.json({
      id: event.id,
      name: event.name,
      description: event.description,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      imageUrl: event.imageUrl,
      primaryColor: event.primaryColor,
      requirePhone: event.requirePhone,
      requireEmail: event.requireEmail,
      customFields: event.customFields,
      status: event.status,
      maxCapacity: event.maxCapacity,
      availableSpots,
      isOpen: event.status === 'ACTIVE' && availableSpots > 0,
      business: {
        name: event.Business.name,
        logoUrl: event.Business.BrandingConfig?.logoUrl,
        primaryColor: event.Business.BrandingConfig?.primaryColor
      }
    });
  } catch (error) {
    console.error('❌ Error fetching public event:', error);
    return NextResponse.json({ error: 'Error al obtener evento' }, { status: 500 });
  }
}
