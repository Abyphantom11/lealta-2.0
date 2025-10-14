import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { HostSearchResult } from '@/types/host-tracking';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Schema de validación
const searchSchema = z.object({
  businessId: z.string().min(1, 'businessId es requerido'),
  query: z.string().min(1, 'query es requerido'),
  searchMode: z.enum(['table', 'name'], {
    errorMap: () => ({ message: 'searchMode debe ser "table" o "name"' })
  }),
  date: z.string().optional(), // ISO date, default: hoy
});

/**
 * GET /api/staff/host-tracking/search
 * 
 * Busca anfitriones activos por mesa o nombre de reserva.
 * Usado por el staff al procesar consumos de invitados.
 * 
 * Query params:
 * - businessId: ID del negocio
 * - query: Texto de búsqueda ("5", "Mesa 5", "Juan Pérez")
 * - searchMode: "table" | "name"
 * - date: ISO date (opcional, default: hoy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar parámetros
    const params = searchSchema.parse({
      businessId: searchParams.get('businessId'),
      query: searchParams.get('query'),
      searchMode: searchParams.get('searchMode'),
      date: searchParams.get('date'),
    });

    console.log('🔍 [HOST SEARCH] Búsqueda de anfitriones:', params);

    // Determinar rango de fechas
    const searchDate = params.date ? new Date(params.date) : new Date();
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('📅 [HOST SEARCH] Rango de búsqueda:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // Construir where clause según el modo de búsqueda
    const whereClause: any = {
      businessId: params.businessId,
      isActive: true,
      reservationDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (params.searchMode === 'table') {
      // Búsqueda por mesa - case insensitive, parcial
      whereClause.tableNumber = {
        contains: params.query,
        mode: 'insensitive' as const,
      };
    } else {
      // Búsqueda por nombre - case insensitive, parcial
      whereClause.reservationName = {
        contains: params.query,
        mode: 'insensitive' as const,
      };
    }

    // Buscar en la base de datos
    const results = await prisma.hostTracking.findMany({
      where: whereClause,
      include: {
        anfitrion: {
          select: {
            id: true,
            nombre: true,
            cedula: true,
            correo: true,
            telefono: true,
          },
        },
        reservation: {
          select: {
            id: true,
            reservationNumber: true,
            status: true,
            reservedAt: true,
          },
        },
        guestConsumos: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        reservationDate: 'desc',
      },
      take: 10, // Máximo 10 resultados
    });

    console.log(`✅ [HOST SEARCH] Encontrados ${results.length} anfitriones`);

    // Formatear resultados
    const formattedResults: HostSearchResult[] = results.map((ht) => ({
      id: ht.id,
      reservationName: ht.reservationName,
      tableNumber: ht.tableNumber,
      guestCount: ht.guestCount,
      reservationDate: ht.reservationDate,
      anfitrionNombre: ht.anfitrion.nombre,
      anfitrionCedula: ht.anfitrion.cedula,
      reservationNumber: ht.reservation.reservationNumber,
      // Info adicional útil
      consumosVinculados: ht.guestConsumos.length,
      reservationStatus: ht.reservation.status,
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      count: formattedResults.length,
    });

  } catch (error) {
    console.error('❌ [HOST SEARCH] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al buscar anfitriones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
