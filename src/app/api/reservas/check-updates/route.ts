import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forzar renderizado dinámico (no estático)
export const dynamic = 'force-dynamic';

/**
 * Endpoint ligero para verificar si hay cambios en las reservas
 * Solo retorna si hay cambios (no envía datos pesados)
 * 
 * Query params:
 * - businessId: ID del negocio
 * - since: Timestamp ISO de la última actualización conocida
 * 
 * Response:
 * - hasChanges: boolean
 * - lastUpdate: string (ISO timestamp)
 * - changedCount: number (opcional, solo si hay cambios)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessIdOrSlug = searchParams.get('businessId');
    const since = searchParams.get('since');

    if (!businessIdOrSlug) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Intentar buscar el business por ID o por slug
    let business;
    try {
      business = await prisma.business.findFirst({
        where: {
          OR: [
            { id: businessIdOrSlug },
            { slug: businessIdOrSlug }
          ]
        }
      });
    } catch (e) {
      business = await prisma.business.findUnique({
        where: { slug: businessIdOrSlug }
      });
    }

    if (!business) {
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }
    
    const businessId = business.id;

    // Obtener la última fecha de actualización de las reservas del negocio
    const latestReservation = await prisma.reservation.findFirst({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    if (!latestReservation) {
      // No hay reservas para este negocio
      return NextResponse.json({
        hasChanges: false,
        lastUpdate: new Date().toISOString(),
        totalReservations: 0,
      });
    }

    const lastUpdate = latestReservation.updatedAt.toISOString();

    // Si no se proporciona 'since', es la primera consulta
    if (!since) {
      return NextResponse.json({
        hasChanges: true,
        lastUpdate,
        message: 'Primera sincronización',
      });
    }

    // Comparar timestamps
    const sinceDate = new Date(since);
    const hasChanges = latestReservation.updatedAt > sinceDate;

    if (hasChanges) {
      // Contar cuántas reservas cambiaron
      const changedCount = await prisma.reservation.count({
        where: {
          businessId,
          updatedAt: { gt: sinceDate },
        },
      });

      return NextResponse.json({
        hasChanges: true,
        lastUpdate,
        changedCount,
      });
    }

    // No hay cambios
    return NextResponse.json({
      hasChanges: false,
      lastUpdate: since, // Mantener el timestamp anterior
    });

  } catch (error) {
    console.error('❌ Error verificando actualizaciones:', error);
    return NextResponse.json(
      { 
        error: 'Error al verificar actualizaciones',
        hasChanges: false, // Fallar de manera segura
      },
      { status: 500 }
    );
  }
}
