// 🚨 MIDDLEWARE DE EMERGENCIA - BYPASS RATE LIMITING
// Versión temporal para resolver problemas críticos de conectividad

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const referer = request.headers.get('referer') || '';
  
  // 🔒 MODO MANTENIMIENTO - Bloquear todos los logins
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Permitir solo páginas públicas y logout
    const allowedPaths = ['/api/health', '/maintenance', '/'];
    
    if (!allowedPaths.some(path => pathname.startsWith(path))) {
      console.log('🔒 [MAINTENANCE] Bloqueando acceso:', pathname);
      
      // Si es una página HTML, mostrar mensaje
      if (!pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Sistema en mantenimiento. Intenta más tarde.' },
          { status: 503 }
        );
      }
      
      // Si es API, retornar 503
      return NextResponse.json(
        { error: 'Sistema en mantenimiento' },
        { status: 503 }
      );
    }
  }
  
  // 🔄 CLOUDFLARE QR INTERCEPTOR - Para QR específico que va a morir
  // Interceptar la URL exacta de Cloudflare: loud-entity-fluid-trade.trycloudflare.com/r/ig4gRl
  if (host.includes('loud-entity-fluid-trade.trycloudflare.com') || 
      referer.includes('loud-entity-fluid-trade.trycloudflare.com') ||
      request.url.includes('loud-entity-fluid-trade.trycloudflare.com')) {
    
    console.log('🌩️ Cloudflare QR intercepted (will die soon):', request.url);
    
    // Si es específicamente el path /r/ig4gRl, redirigir a lealta.app
    if (pathname === '/r/ig4gRl') {
      const lealtaUrl = 'https://lealta.app/r/ig4gRl';
      console.log(`🔄 Redirecting dying Cloudflare QR -> ${lealtaUrl}`);
      return NextResponse.redirect(lealtaUrl, 301);
    }
  }
  
  // 🔗 QR REDIRECT - Interceptar rutas /r/[shortId] y redirigir a API
  if (pathname.startsWith('/r/') && pathname.length > 3) {
    const shortId = pathname.substring(3); // Remover "/r/"
    
    // Redirigir a la API route que maneja la redirección
    const apiUrl = new URL(`/api/r/${shortId}`, request.url);
    console.log(`🔗 QR Redirect: ${pathname} -> ${apiUrl.pathname}`);
    
    return NextResponse.rewrite(apiUrl);
  }
  
  // 🔄 BYPASS TEMPORAL - Sin rate limiting hasta resolver Upstash
  console.log(`🔄 [EMERGENCY MIDDLEWARE] Processing: ${pathname}`);
  
  // Solo logging básico, sin validaciones complejas
  if (pathname.startsWith('/api/')) {
    console.log(`📡 API request: ${pathname}`);
  }
  
  if (pathname.startsWith('/cliente')) {
    console.log(`👤 Client route: ${pathname}`);
  }
  
  if (pathname.startsWith('/admin')) {
    console.log(`🔐 Admin route: ${pathname}`);
  }
  
  // Permitir todo sin validaciones - TEMPORAL
  console.log(`✅ [EMERGENCY] Allowing request to: ${pathname}`);
  return NextResponse.next();
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
