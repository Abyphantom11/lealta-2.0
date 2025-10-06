import { NextRequest, NextResponse } from 'next/server';
import { GeminiReservationParser } from '@/lib/ai/gemini-reservation-parser';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * POST /api/reservas/ai-parse
 * Analiza texto con IA para extraer datos de reserva
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, businessId } = body;

    // Validar que venga businessId
    if (!businessId) {
      console.error('❌ [AI-PARSE] Missing businessId in request');
      return NextResponse.json(
        { success: false, error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    console.log('🤖 [AI-PARSE] Request:', {
      businessId,
      textLength: text?.length
    });

    // Validar que venga el texto
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El texto es demasiado corto. Debe tener al menos 10 caracteres.' 
        },
        { status: 400 }
      );
    }

    // Validar longitud máxima (evitar textos enormes)
    if (text.length > 5000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El texto es demasiado largo. Máximo 5000 caracteres.' 
        },
        { status: 400 }
      );
    }

    console.log('🤖 [API] Iniciando análisis IA de reserva para business:', businessId);
    console.log('📝 [API] Longitud del texto:', text.length, 'caracteres');

    // Analizar con Gemini
    const parser = new GeminiReservationParser();
    const result = await parser.parseReservationText(text);

    console.log('✅ [API] Análisis completado exitosamente');
    console.log('📊 [API] Confianza:', result.confianza);
    console.log('📋 [API] Campos detectados:', Object.keys(result).filter(k => result[k as keyof typeof result]));

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ [API] Error en ai-parse:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
