import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBusinessDay } from '@/lib/business-day-utils';

/**
 * API para obtener el día comercial actual calculado en el servidor
 * Esto asegura que todos los clientes vean el mismo día sin importar su timezone
 */
export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId') || 'default';
    
    // Calcular día comercial en el servidor (con timezone correcto)
    const currentDay = await getCurrentBusinessDay(businessId);
    
    return NextResponse.json({
      success: true,
      businessDay: currentDay,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        // Cache por 1 minuto para reducir llamadas
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo día comercial:', error);
    return NextResponse.json({
      success: false,
      error: 'Error calculando día comercial'
    }, { status: 500 });
  }
}

// Marcar como ruta dinámica
export const dynamic = 'force-dynamic';
