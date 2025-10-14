import { NextRequest, NextResponse } from 'next/server';
import { getPuntosMinimosConfig } from '@/lib/tarjetas-config-central';

// Marcar como ruta dinámica
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const puntosMinimos = await getPuntosMinimosConfig(businessId);

    return NextResponse.json({
      success: true,
      data: puntosMinimos
    });

  } catch (error) {
    console.error('Error obteniendo configuración de puntos:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
