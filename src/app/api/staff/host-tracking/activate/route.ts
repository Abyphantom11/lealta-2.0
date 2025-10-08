import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Schema de validación
const activateSchema = z.object({
  businessId: z.string().min(1, 'businessId es requerido'),
  reservationId: z.string().min(1, 'reservationId es requerido'),
  clienteId: z.string().min(1, 'clienteId es requerido'),
  reservationName: z.string().min(1, 'reservationName es requerido'),
  tableNumber: z.string().optional(),
  reservationDate: z.string().min(1, 'reservationDate es requerido'),
  guestCount: z.number().int().min(1, 'guestCount debe ser mayor a 0'),
});

/**
 * POST /api/staff/host-tracking/activate
 * 
 * Activa manualmente el tracking de anfitrión para una reserva.
 * Normalmente esto se hace automáticamente, pero este endpoint permite
 * activarlo después si fue necesario.
 * 
 * Body:
 * {
 *   businessId: string;
 *   reservationId: string;
 *   clienteId: string;
 *   reservationName: string;
 *   tableNumber?: string;
 *   reservationDate: string; // ISO date
 *   guestCount: number;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar payload
    const data = activateSchema.parse(body);

    console.log('🎯 [ACTIVATE HOST] Activando tracking para reserva:', data);

    // 1. Verificar que la reserva existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: {
        cliente: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        {
          success: false,
          error: 'La reserva no existe',
        },
        { status: 404 }
      );
    }

    // 2. Verificar aislamiento de business
    if (reservation.businessId !== data.businessId) {
      return NextResponse.json(
        {
          success: false,
          error: 'La reserva pertenece a otro negocio',
        },
        { status: 403 }
      );
    }

    // 3. Verificar que el cliente es el dueño de la reserva o coincide
    if (reservation.clienteId !== data.clienteId) {
      console.warn('⚠️ [ACTIVATE HOST] Cliente diferente al de la reserva');
      // No bloqueamos, pero logueamos
    }

    // 4. Verificar que no exista ya un tracking para esta reserva
    const existingTracking = await prisma.hostTracking.findUnique({
      where: { reservationId: data.reservationId },
    });

    if (existingTracking) {
      // Si existe pero está inactivo, reactivarlo
      if (!existingTracking.isActive) {
        const updated = await prisma.hostTracking.update({
          where: { id: existingTracking.id },
          data: {
            isActive: true,
            tableNumber: data.tableNumber || existingTracking.tableNumber,
            guestCount: data.guestCount,
            reservationName: data.reservationName,
          },
        });

        console.log('✅ [ACTIVATE HOST] Tracking reactivado:', updated.id);

        return NextResponse.json({
          success: true,
          data: updated,
          message: 'Tracking de anfitrión reactivado',
        });
      }

      // Si ya existe y está activo, devolver el existente
      return NextResponse.json({
        success: true,
        data: existingTracking,
        message: 'El tracking ya estaba activo',
      });
    }

    // 5. Crear el HostTracking
    const hostTracking = await prisma.hostTracking.create({
      data: {
        businessId: data.businessId,
        reservationId: data.reservationId,
        clienteId: data.clienteId,
        reservationName: data.reservationName,
        tableNumber: data.tableNumber,
        reservationDate: new Date(data.reservationDate),
        guestCount: data.guestCount,
        isActive: true,
      },
      include: {
        anfitrion: {
          select: {
            nombre: true,
            cedula: true,
            correo: true,
          },
        },
        reservation: {
          select: {
            reservationNumber: true,
            status: true,
          },
        },
      },
    });

    console.log('✅ [ACTIVATE HOST] Tracking creado exitosamente:', {
      id: hostTracking.id,
      anfitrion: hostTracking.anfitrion.nombre,
      mesa: hostTracking.tableNumber,
      invitados: hostTracking.guestCount,
    });

    return NextResponse.json({
      success: true,
      data: hostTracking,
      message: 'Tracking de anfitrión activado exitosamente',
    });

  } catch (error) {
    console.error('❌ [ACTIVATE HOST] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al activar tracking',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/staff/host-tracking/activate?reservationId=xxx
 * 
 * Verifica si una reserva tiene tracking activo.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'reservationId es requerido',
        },
        { status: 400 }
      );
    }

    const hostTracking = await prisma.hostTracking.findUnique({
      where: { reservationId },
      include: {
        anfitrion: {
          select: {
            nombre: true,
            cedula: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      hasTracking: !!hostTracking,
      isActive: hostTracking?.isActive || false,
      data: hostTracking,
    });

  } catch (error) {
    console.error('❌ [ACTIVATE HOST] Error al verificar:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al verificar tracking',
      },
      { status: 500 }
    );
  }
}
