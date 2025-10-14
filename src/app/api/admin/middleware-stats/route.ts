import { NextRequest, NextResponse } from 'next/server';
import { getMiddlewareStats } from '../../../../../middleware';
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

    const middlewareStats = getMiddlewareStats();
    const optimizationStats = getOptimizationStats();

    // 🚀 ENHANCED v3.2: Estadísticas mejoradas con nuevas métricas
    const stats = {
      timestamp: new Date().toISOString(),
      middleware: middlewareStats,
      requestOptimization: optimizationStats,
      environment: process.env.NODE_ENV,
      summary: {
        totalCacheEntries: middlewareStats.performance.totalCacheEntries,
        totalMemoryUsage: middlewareStats.performance.totalMemoryUsage,
        averageCacheHitRate: Object.values(middlewareStats.caches).reduce((acc, cache) => acc + cache.hitRate, 0) / Object.keys(middlewareStats.caches).length,
        memoryEfficiency: middlewareStats.performance.totalCacheEntries / middlewareStats.config.maxCacheSize,
        cacheDistribution: {
          validation: middlewareStats.caches.validation.size,
          business: middlewareStats.caches.business.size,
          session: middlewareStats.caches.session.size,
          permission: middlewareStats.caches.permission.size,
          businessValidation: middlewareStats.caches.businessValidation.size
        },
        topBusinesses: middlewareStats.frequentBusinesses.businesses.slice(0, 10),
        optimization: {
          cacheHitRateImprovement: 'Baseline established with enhanced caching',
          memoryUsageOptimization: `${Math.round(middlewareStats.performance.totalMemoryUsage / 1024)} KB total`,
          frequentBusinessOptimization: `${middlewareStats.frequentBusinesses.count} businesses being warmed`
        }
      }
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
 * 🚀 ENHANCED v3.2: Endpoint para limpiar caches con opciones granulares
 */
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const cacheType = url.searchParams.get('type');
    const businessId = url.searchParams.get('businessId');

    // Importar funciones de invalidación
    const { 
      invalidateAllCaches, 
      invalidateBusinessCache
    } = await import('../../../../../middleware');
    const { requestDeduplicator } = await import('@/lib/request-deduplicator');

    let message = '';

    if (cacheType === 'all') {
      invalidateAllCaches();
      requestDeduplicator.clear();
      message = 'All caches cleared successfully';
    } else if (cacheType === 'business' && businessId) {
      invalidateBusinessCache(businessId);
      message = `Business cache cleared for: ${businessId}`;
    } else if (cacheType === 'deduplication') {
      requestDeduplicator.clear();
      message = 'Request deduplication cache cleared';
    } else {
      // Default: clear all
      invalidateAllCaches();
      requestDeduplicator.clear();
      message = 'All caches cleared successfully (default)';
    }

    return NextResponse.json({ 
      message,
      timestamp: new Date().toISOString(),
      clearedType: cacheType || 'all',
      businessId: businessId || null
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}