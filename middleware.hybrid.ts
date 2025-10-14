// 🛡️ MIDDLEWARE HÍBRIDO - UPSTASH + LOCAL FALLBACK
// Versión estable con fallback de rate limiting local

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimitResponse } from './src/lib/rate-limiter-local';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔄 [HYBRID MIDDLEWARE] Processing: ${pathname}`);
  
  try {
    // 🛡️ RATE LIMITING - Con fallback local
    let rateLimitType: 'auth' | 'api' | 'public' = 'public';
    
    if (pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
      rateLimitType = 'auth';
    } else if (pathname.startsWith('/api')) {
      rateLimitType = 'api';
    }
    
    const rateLimitResponse = await createRateLimitResponse(request, rateLimitType);
    if (rateLimitResponse) {
      console.log(`🛡️ Rate limit blocked: ${pathname} (${rateLimitType})`);
      return rateLimitResponse;
    }
    
    // 📝 LOGGING POR TIPO DE RUTA
    if (pathname.startsWith('/api/')) {
      console.log(`📡 API request: ${pathname}`);
    } else if (pathname.startsWith('/cliente')) {
      console.log(`👤 Client route: ${pathname}`);
    } else if (pathname.startsWith('/admin')) {
      console.log(`🔐 Admin route: ${pathname}`);
    }
    
    // ✅ Permitir request
    console.log(`✅ [HYBRID] Allowing request to: ${pathname}`);
    return NextResponse.next();
    
  } catch (error) {
    console.error(`❌ [HYBRID MIDDLEWARE] Error processing ${pathname}:`, error);
    // Fail open - permitir la request en caso de error
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
