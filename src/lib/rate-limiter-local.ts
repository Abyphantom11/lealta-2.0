// 🛡️ RATE LIMITER LOCAL - FALLBACK PARA UPSTASH REDIS
// Sistema de rate limiting en memoria como backup

interface RateLimitEntry {
  count: number;
  resetTime: number;
  windowStart: number;
}

class LocalRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async limit(identifier: string, options: {
    requests: number;
    window: number; // en segundos
  }) {
    const now = Date.now();
    const windowMs = options.window * 1000;
    
    let entry = this.store.get(identifier);
    
    if (!entry || now > entry.resetTime) {
      // Nueva ventana
      entry = {
        count: 1,
        resetTime: now + windowMs,
        windowStart: now
      };
      this.store.set(identifier, entry);
      
      return {
        success: true,
        limit: options.requests,
        remaining: options.requests - 1,
        reset: entry.resetTime,
        pending: Promise.resolve()
      };
    }
    
    // Ventana existente
    if (entry.count >= options.requests) {
      return {
        success: false,
        limit: options.requests,
        remaining: 0,
        reset: entry.resetTime,
        pending: Promise.resolve()
      };
    }
    
    entry.count++;
    this.store.set(identifier, entry);
    
    return {
      success: true,
      limit: options.requests,
      remaining: options.requests - entry.count,
      reset: entry.resetTime,
      pending: Promise.resolve()
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Instancia global
const localLimiter = new LocalRateLimiter();

// Función helper para crear response de rate limit
export async function createRateLimitResponse(request: Request, type: 'auth' | 'api' | 'public' = 'api') {
  try {
    // Primero intentar con Upstash (si está disponible)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      // Aquí iría el código de Upstash original
      // Por ahora usar local como fallback
    }
    
    // Fallback a rate limiting local
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               request.headers.get('cf-connecting-ip') ?? 
               '127.0.0.1';
               
    const identifier = `${type}:${ip}`;
    
    // Configurar límites según tipo
    const limits = {
      auth: { requests: 5, window: 60 },    // 5 por minuto
      api: { requests: 100, window: 60 },   // 100 por minuto
      public: { requests: 30, window: 60 }  // 30 por minuto
    };
    
    const result = await localLimiter.limit(identifier, limits[type]);
    
    if (!result.success) {
      console.log(`🛡️ [LOCAL] Rate limit exceeded for ${identifier}`);
      return new Response('Rate limit exceeded', { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limits[type].requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
        }
      });
    }
    
    console.log(`✅ [LOCAL] Rate limit passed for ${identifier} (${result.remaining} remaining)`);
    return null; // No blocking
    
  } catch (error) {
    console.error('❌ Rate limit error:', error);
    // En caso de error, permitir la request (fail open)
    return null;
  }
}

export { localLimiter };
