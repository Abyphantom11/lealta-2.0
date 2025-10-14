/**
 * Servicio de deduplicación de requests para evitar llamadas duplicadas
 * Esto reduce significativamente los edge requests innecesarios
 */

import { useMemo } from 'react';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 30000; // 30 segundos por defecto
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Deduplica requests idénticos y cachea resultados
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // 1. Verificar cache primero
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    // 2. Verificar si ya hay un request pendiente
    const pending = this.pendingRequests.get(key);
    if (pending) {
      // Si el request pendiente es muy viejo (>30s), eliminarlo y crear uno nuevo
      if (Date.now() - pending.timestamp > 30000) {
        this.pendingRequests.delete(key);
      } else {
        return pending.promise;
      }
    }

    // 3. Crear nuevo request
    const promise = requestFn()
      .then((result) => {
        // Cachear resultado exitoso
        this.setCache(key, result, ttl);
        return result;
      })
      .catch((error) => {
        // No cachear errores, pero limpiar pending
        throw error;
      })
      .finally(() => {
        // Limpiar request pendiente
        this.pendingRequests.delete(key);
      });

    // 4. Guardar como pendiente
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Cachea un valor manualmente
   */
  setCache(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Limpiar cache si está muy lleno
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Obtiene un valor del cache
   */
  getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Invalida cache por patrón
   */
  invalidateCache(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpia cache expirado
   */
  private cleanupCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        toDelete.push(key);
      }
    }

    // Eliminar entradas expiradas
    toDelete.forEach(key => this.cache.delete(key));

    // Si aún está muy lleno, eliminar las más viejas
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.3)); // Eliminar 30% más viejas

      entries.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Obtiene estadísticas del deduplicador
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
    };
  }

  /**
   * Limpia todo el cache y requests pendientes
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Instancia singleton
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Hook para usar deduplicación de requests
 */
export const useRequestDeduplication = () => {
  return useMemo(() => ({
    deduplicate: requestDeduplicator.deduplicate.bind(requestDeduplicator),
    setCache: requestDeduplicator.setCache.bind(requestDeduplicator),
    getCache: requestDeduplicator.getCache.bind(requestDeduplicator),
    invalidateCache: requestDeduplicator.invalidateCache.bind(requestDeduplicator),
    getStats: requestDeduplicator.getStats.bind(requestDeduplicator),
  }), []);
};

/**
 * Función helper para crear keys de deduplicación
 */
export const createRequestKey = (
  endpoint: string,
  params?: Record<string, any>
): string => {
  const paramString = params 
    ? Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&')
    : '';
  
  return paramString ? `${endpoint}?${paramString}` : endpoint;
};