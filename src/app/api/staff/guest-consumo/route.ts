import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Schema de validación
const linkGuestConsumoSchema = z.object({
  hostTrackingId: z.string().min(1, 'hostTrackingId es requerido'),
  consumoId: z.string().min(1, 'consumoId es requerido'),
  guestCedula: z.string().optional(),
  guestName: z.string().optional(),
});

/**
 * POST /api/staff/guest-consumo
 * 
 * Vincula un consumo de un invitado al registro del anfitrión.
 * El consumo debe existir previamente (creado con el flujo normal de staff).
 * 
 * Body:
 * {
 *   hostTrackingId: string;  // ID del HostTracking (el anfitrión)
 *   consumoId: string;       // ID del Consumo a vincular
 *   guestCedula?: string;    // Opcional - si el invitado está registrado
 *   guestName?: string;      // Opcional - nombre del invitado
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar payload
    const data = linkGuestConsumoSchema.parse(body);

    console.log('🔗 [GUEST CONSUMO] Vinculando consumo a anfitrión:', data);

    // 1. Verificar que el HostTracking existe y está activo
    const hostTracking = await prisma.hostTracking.findUnique({
      where: { id: data.hostTrackingId },
      include: {
        anfitrion: {
          select: {
            nombre: true,
            cedula: true,
          },
        },
      },
    });

    if (!hostTracking) {
      return NextResponse.json(
        {
          success: false,
          error: 'El anfitrión no existe',
        },
        { status: 404 }
      );
    }

    if (!hostTracking.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'El tracking del anfitrión está desactivado',
        },
        { status: 400 }
      );
    }

    // 2. Verificar que el Consumo existe
    const consumo = await prisma.consumo.findUnique({
      where: { id: data.consumoId },
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true,
          },
        },
      },
    });

    if (!consumo) {
      return NextResponse.json(
        {
          success: false,
          error: 'El consumo no existe',
        },
        { status: 404 }
      );
    }

    // 3. Verificar aislamiento de business
    if (consumo.businessId !== hostTracking.businessId) {
      return NextResponse.json(
        {
          success: false,
          error: 'El consumo y el anfitrión pertenecen a negocios diferentes',
        },
        { status: 403 }
      );
    }

    // 4. Verificar que el consumo no esté ya vinculado
    const existingLink = await prisma.guestConsumo.findUnique({
      where: { consumoId: data.consumoId },
    });

    if (existingLink) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este consumo ya está vinculado a un anfitrión',
        },
        { status: 400 }
      );
    }

    // 5. Crear el vínculo
    const guestConsumo = await prisma.guestConsumo.create({
      data: {
        businessId: consumo.businessId,
        hostTrackingId: data.hostTrackingId,
        consumoId: data.consumoId,
        guestCedula: data.guestCedula || consumo.cliente.cedula,
        guestName: data.guestName || consumo.cliente.nombre,
      },
    });

    console.log('✅ [GUEST CONSUMO] Vinculación exitosa:', {
      guestConsumoId: guestConsumo.id,
      anfitrion: hostTracking.anfitrion.nombre,
      invitado: guestConsumo.guestName,
      monto: consumo.total,
    });

    return NextResponse.json({
      success: true,
      data: guestConsumo,
      message: `Consumo vinculado a ${hostTracking.anfitrion.nombre}`,
      details: {
        anfitrionNombre: hostTracking.anfitrion.nombre,
        invitadoNombre: guestConsumo.guestName,
        montoConsumo: consumo.total,
        puntosConsumo: consumo.puntos,
      },
    });

  } catch (error) {
    console.error('❌ [GUEST CONSUMO] Error:', error);

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
        error: 'Error al vincular consumo',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/staff/guest-consumo?consumoId=xxx
 * 
 * Verifica si un consumo ya está vinculado a un anfitrión.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumoId = searchParams.get('consumoId');

    if (!consumoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'consumoId es requerido',
        },
        { status: 400 }
      );
    }

    const guestConsumo = await prisma.guestConsumo.findUnique({
      where: { consumoId },
      include: {
        hostTracking: {
          include: {
            anfitrion: {
              select: {
                nombre: true,
                cedula: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      isLinked: !!guestConsumo,
      data: guestConsumo,
    });

  } catch (error) {
    console.error('❌ [GUEST CONSUMO] Error al verificar:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al verificar vinculación',
      },
      { status: 500 }
    );
  }
}
