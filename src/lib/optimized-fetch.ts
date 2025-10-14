import { requestDeduplicator, createRequestKey } from './request-deduplicator';

interface OptimizedFetchOptions extends RequestInit {
  deduplicate?: boolean;
  cacheTTL?: number;
  retries?: number;
  timeout?: number;
}

/**
 * Fetch optimizado con deduplicación, cache y retry automático
 * Reduce significativamente los edge requests duplicados
 */
export async function optimizedFetch(
  url: string,
  options: OptimizedFetchOptions = {}
): Promise<Response> {
  const {
    deduplicate = true,
    cacheTTL = 30000, // 30 segundos por defecto
    retries = 2,
    timeout = 10000,
    ...fetchOptions
  } = options;

  // Crear key para deduplicación
  const requestKey = createRequestKey(url, {
    method: fetchOptions.method || 'GET',
    body: fetchOptions.body,
  });

  const executeRequest = async (): Promise<Response> => {
    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const executeWithRetry = async (): Promise<Response> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await executeRequest();
      } catch (error) {
        lastError = error as Error;
        
        // No reintentar en ciertos casos
        if (error instanceof Error && error.name === 'AbortError') {
          throw error; // Timeout - no reintentar
        }

        // Esperar antes del siguiente intento (exponential backoff)
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  };

  // Usar deduplicación si está habilitada
  if (deduplicate && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
    return requestDeduplicator.deduplicate(
      requestKey,
      executeWithRetry,
      cacheTTL
    );
  }

  return executeWithRetry();
}

/**
 * Wrapper para GET requests con cache automático
 */
export async function optimizedGet(
  url: string,
  options: Omit<OptimizedFetchOptions, 'method'> = {}
): Promise<Response> {
  return optimizedFetch(url, { ...options, method: 'GET' });
}

/**
 * Wrapper para POST requests (sin cache por defecto)
 */
export async function optimizedPost(
  url: string,
  data?: any,
  options: Omit<OptimizedFetchOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return optimizedFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    deduplicate: false, // POST requests no se deduplicán por defecto
  });
}

/**
 * Helper para requests JSON con parsing automático
 */
export async function optimizedFetchJSON<T = any>(
  url: string,
  options: OptimizedFetchOptions = {}
): Promise<T> {
  const response = await optimizedFetch(url, options);
  return response.json();
}

/**
 * Invalidar cache para un patrón de URLs
 */
export function invalidateCache(pattern: string): void {
  requestDeduplicator.invalidateCache(pattern);
}

/**
 * Obtener estadísticas de optimización
 */
export function getOptimizationStats() {
  return requestDeduplicator.getStats();
}

// Re-exportar createRequestKey para uso externo
export { createRequestKey };