import { NextRequest, NextResponse } from 'next/server';
import { getOptimizationStats } from '@/lib/optimized-fetch';

/**
 * API endpoint para obtener estadísticas de optimización del middleware
 * Útil para monitorear el impacto de las optimizaciones
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que sea un admin (básico)
    const authHeader = request.headers.get('authorization');
    if (!authHeader && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const optimizationStats = getOptimizationStats();

    // Stats simplificadas sin dependencia del middleware
    const stats = {
      timestamp: new Date().toISOString(),
      requestOptimization: optimizationStats,
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting middleware stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para limpiar caches en desarrollo
 */
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const cacheType = url.searchParams.get('type');

    const { requestDeduplicator } = await import('@/lib/request-deduplicator');
    requestDeduplicator.clear();

    return NextResponse.json({ 
      message: 'Deduplication cache cleared',
      timestamp: new Date().toISOString(),
      clearedType: cacheType || 'deduplication',
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}