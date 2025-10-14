// 🚨 MIDDLEWARE DE EMERGENCIA - BYPASS RATE LIMITING
// Versión temporal para resolver problemas críticos de conectividad

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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
