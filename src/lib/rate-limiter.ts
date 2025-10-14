import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Configuración condicional para desarrollo (sin Redis requerido)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }) 
  : null

// Rate limiters con fallback para desarrollo
export const authLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests por minuto
  analytics: true,
}) : null

export const apiLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 requests por minuto  
  analytics: true,
}) : null

export const publicLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 requests por minuto
  analytics: true,
}) : null

// Helper para aplicar rate limiting
export async function applyRateLimit(request: Request, type: 'auth' | 'api' | 'public' = 'api') {
  // En desarrollo sin Redis, permitir todo
  if (!redis) {
    console.log('🔄 Rate limiting disabled (Redis not configured)')
    return { 
      success: true, 
      limit: 1000, 
      remaining: 999, 
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    }
  }

  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             request.headers.get('cf-connecting-ip') ?? // Cloudflare
             '127.0.0.1'

  let limiter
  switch (type) {
    case 'auth': limiter = authLimiter; break
    case 'api': limiter = apiLimiter; break
    case 'public': limiter = publicLimiter; break
  }

  if (!limiter) {
    return { 
      success: true, 
      limit: 1000, 
      remaining: 999, 
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    }
  }

  try {
    const result = await limiter.limit(ip)
    console.log(`🛡️ Rate limit check - IP: ${ip}, Type: ${type}, Success: ${result.success}, Remaining: ${result.remaining}`)
    return result
  } catch (error) {
    console.error('❌ Rate limit error:', error)
    // En caso de error, permitir la request
    return { 
      success: true, 
      limit: 1000, 
      remaining: 999, 
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    }
  }
}

// Middleware helper para Next.js
export async function createRateLimitResponse(
  request: Request, 
  type: 'auth' | 'api' | 'public' = 'api'
): Promise<Response | null> {
  const result = await applyRateLimit(request, type)
  
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
      }), 
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.reset).toISOString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        }
      }
    )
  }

  return null // No blocking
}
