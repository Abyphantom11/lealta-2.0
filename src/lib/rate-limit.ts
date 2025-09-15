import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function createRateLimit({
  maxRequests = 100,
  windowMs = 15 * 60 * 1000, // 15 minutos
} = {}) {
  return async function rateLimit(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const ip =
      request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;

    const now = Date.now();
    const resetTime = now + windowMs;

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime,
      };
    } else {
      store[key].count++;
    }

    const { count } = store[key];

    if (count > maxRequests) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((store[key].resetTime - now) / 1000)} seconds.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(
              store[key].resetTime / 1000
            ).toString(),
          },
        }
      );
    }

    // Limpiar entradas expiradas cada 10 minutos
    if (Math.random() < 0.01) {
      Object.keys(store).forEach(k => {
        if (store[k].resetTime < now) {
          delete store[k];
        }
      });
    }

    return null; // Continuar con la request
  };
}

import { getRateLimitConfig } from './env';

export const apiRateLimit = createRateLimit(getRateLimitConfig());
