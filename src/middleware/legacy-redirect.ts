// src/middleware/legacy-redirect.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Maneja la migración de rutas legacy a rutas con business context
 */
export async function handleLegacyRedirect(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  const legacyRoutes = ['/admin', '/staff', '/superadmin', '/cliente'];
  
  const isLegacyRoute = legacyRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (!isLegacyRoute) {
    return null;
  }

  try {
    // Obtener sesión del usuario
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      // Sin sesión, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch {
      // Sesión inválida, redirigir a login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (!sessionData.businessId) {
      // Sin business en sesión, mostrar selector
      const selectionUrl = new URL('/business-selection', request.url);
      selectionUrl.searchParams.set('blocked_route', pathname);
      selectionUrl.searchParams.set('reason', 'no-business-in-session');
      return NextResponse.redirect(selectionUrl);
    }

    // Obtener subdomain del business
    const { prisma } = await import('../lib/prisma');
    
    const business = await prisma.business.findUnique({
      where: { 
        id: sessionData.businessId,
        isActive: true 
      },
      select: {
        subdomain: true
      }
    });

    if (!business) {
      // Business no encontrado, mostrar selector
      const selectionUrl = new URL('/business-selection', request.url);
      selectionUrl.searchParams.set('blocked_route', pathname);
      selectionUrl.searchParams.set('reason', 'business-not-found');
      return NextResponse.redirect(selectionUrl);
    }

    // Redirigir a la ruta con business context
    const newUrl = new URL(`/${business.subdomain}${pathname}`, request.url);
    
    console.log(`🔄 Legacy redirect: ${pathname} → /${business.subdomain}${pathname}`);
    
    return NextResponse.redirect(newUrl);

  } catch (error) {
    console.error('Error in legacy redirect:', error);
    
    // En caso de error, mostrar selector
    const selectionUrl = new URL('/business-selection', request.url);
    selectionUrl.searchParams.set('blocked_route', pathname);
    selectionUrl.searchParams.set('reason', 'redirect-error');
    return NextResponse.redirect(selectionUrl);
  }
}
