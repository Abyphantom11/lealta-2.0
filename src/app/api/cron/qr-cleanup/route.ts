/**
 * API Route para limpieza automática de QR codes
 * Endpoint: /api/cron/qr-cleanup
 * 
 * Este endpoint debe ser llamado por un cron job (ej: Vercel Cron)
 * para limpiar automáticamente QR codes antiguos cada día
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldQRCodes, getQRStats } from '@/lib/qr-cleanup';

export const maxDuration = 60; // 60 segundos para función serverless
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización (token secreto en header o query param)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Si hay un secreto configurado, verificarlo
    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');
      
      if (token !== cronSecret) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
    }

    console.log('🚀 Iniciando tarea de limpieza de QR codes...');

    // Obtener estadísticas antes de la limpieza
    const statsBefore = await getQRStats();
    console.log('📊 Estadísticas antes de limpieza:', statsBefore);

    // Ejecutar limpieza
    const cleanupResult = await cleanupOldQRCodes();

    // Obtener estadísticas después de la limpieza
    const statsAfter = await getQRStats();
    console.log('📊 Estadísticas después de limpieza:', statsAfter);

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      before: statsBefore,
      after: statsAfter,
      cleanup: cleanupResult,
      message: `Limpieza completada: ${cleanupResult.totalDeleted} QR codes eliminados`
    };

    console.log('✅ Limpieza completada exitosamente');
    
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Error en tarea de limpieza:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// También permitir POST para mayor flexibilidad
export async function POST(request: NextRequest) {
  return GET(request);
}
