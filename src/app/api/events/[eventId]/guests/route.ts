/**
 * 🎟️ Event Guests API
 * GET: List guests for an event
 * POST: Register a new guest (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { generateId } from '@/lib/generateId';

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

// GET /api/events/[eventId]/guests
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    const guests = await prisma.eventGuest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: {
        Cliente: {
          select: {
            id: true,
            nombre: true,
            cedula: true,
            puntos: true
          }
        },
        Promotor: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    // Calculate statistics
    const stats = {
      total: guests.length,
      totalPeople: guests.reduce((sum, g) => sum + g.guestCount, 0),
      registered: guests.filter(g => g.status === 'REGISTERED').length,
      checkedIn: guests.filter(g => g.status === 'CHECKED_IN').length,
      cancelled: guests.filter(g => g.status === 'CANCELLED').length
    };

    return NextResponse.json({ guests, stats });
  } catch (error) {
    console.error('❌ Error fetching guests:', error);
    return NextResponse.json({ error: 'Error al obtener invitados' }, { status: 500 });
  }
}

// POST /api/events/[eventId]/guests - Public registration
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { 
      name, 
      phone, 
      email, 
      cedula, 
      clienteId,
      customData, 
      source,
      referralCode // Promoter affiliate code
    } = body;

    // Get event and validate
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { EventGuest: true } }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Check if event is open for registration
    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'El registro para este evento no está disponible' },
        { status: 400 }
      );
    }

    // Check capacity (always 1 person per registration now)
    const currentPeople = await prisma.eventGuest.aggregate({
      where: { 
        eventId,
        status: { not: 'CANCELLED' }
      },
      _sum: { guestCount: true }
    });
    
    const totalPeople = (currentPeople._sum.guestCount || 0) + 1;
    
    if (totalPeople > event.maxCapacity) {
      return NextResponse.json(
        { error: 'Lo sentimos, el evento ha alcanzado su capacidad máxima' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    if (!cedula) {
      return NextResponse.json({ error: 'La cédula es requerida' }, { status: 400 });
    }

    // Normalize cedula
    const normalizedCedula = cedula.replace(/\D/g, '');

    // Check if already registered (by cedula)
    const existingGuest = await prisma.eventGuest.findFirst({
      where: {
        eventId,
        cedula: normalizedCedula,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingGuest) {
      return NextResponse.json(
        { 
          error: 'Ya estás registrado para este evento',
          existingGuest: {
            id: existingGuest.id,
            qrToken: existingGuest.qrToken,
            name: existingGuest.name
          }
        },
        { status: 409 }
      );
    }

    // Normalize phone
    let normalizedPhone = phone?.replace(/\D/g, '') || null;
    if (normalizedPhone) {
      if (normalizedPhone.startsWith('09') && normalizedPhone.length === 10) {
        normalizedPhone = '593' + normalizedPhone.substring(1);
      } else if (normalizedPhone.startsWith('9') && normalizedPhone.length === 9) {
        normalizedPhone = '593' + normalizedPhone;
      }
    }

    // Find or create Cliente
    let finalClienteId = clienteId;
    
    if (!finalClienteId) {
      // Check if cliente exists with this cedula in this business
      const existingCliente = await prisma.cliente.findFirst({
        where: {
          businessId: event.businessId,
          cedula: normalizedCedula
        }
      });

      if (existingCliente) {
        finalClienteId = existingCliente.id;
      } else {
        // Create new cliente
        const newCliente = await prisma.cliente.create({
          data: {
            id: generateId(),
            businessId: event.businessId,
            cedula: normalizedCedula,
            nombre: name,
            correo: email || '',
            telefono: normalizedPhone || '',
            puntos: 0,
            puntosAcumulados: 0,
            totalVisitas: 0,
            totalGastado: 0
          }
        });
        finalClienteId = newCliente.id;
      }
    }

    // Generate QR token
    const qrToken = nanoid(12);
    const qrData = JSON.stringify({
      type: 'EVENT_GUEST',
      eventId,
      guestToken: qrToken,
      cedula: normalizedCedula,
      timestamp: Date.now()
    });

    // Find promotor by referral code if provided
    let promotorId: string | null = null;
    if (referralCode) {
      const promotor = await prisma.promotor.findFirst({
        where: {
          businessId: event.businessId,
          nombre: referralCode, // Using nombre as the referral code for now
          activo: true
        }
      });
      
      if (promotor) {
        promotorId = promotor.id;
        console.log('✅ Promotor match found:', promotor.nombre, 'for code:', referralCode);
      } else {
        console.log('⚠️ No promotor found for referral code:', referralCode);
      }
    }

    // Create guest registration
    const guest = await prisma.eventGuest.create({
      data: {
        eventId,
        name,
        cedula: normalizedCedula,
        phone: normalizedPhone,
        email: email || null,
        guestCount: 1, // Always 1 - individual tickets
        clienteId: finalClienteId,
        promotorId: promotorId, // Link to promoter if found
        referralCode: referralCode || null, // Store the code for analytics
        qrToken,
        qrData,
        customData,
        source: source || 'public_link',
        status: 'REGISTERED'
      }
    });

    // Update event count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        currentCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
        cedula: guest.cedula,
        qrToken: guest.qrToken,
        guestCount: guest.guestCount
      },
      event: {
        name: event.name,
        eventDate: event.eventDate,
        startTime: event.startTime
      }
    });
  } catch (error) {
    console.error('❌ Error registering guest:', error);
    return NextResponse.json({ error: 'Error al registrar invitado' }, { status: 500 });
  }
}
