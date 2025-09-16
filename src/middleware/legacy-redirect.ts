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
      // Sin business en sesión, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no-business');
      loginUrl.searchParams.set('message', 'No hay negocio asociado a la sesión');
      return NextResponse.redirect(loginUrl);
    }

    // Obtener subdomain del business
    const { prisma } = await import('../lib/prisma');
    
    const business = await prisma.business.findUnique({
      where: { 
        id: sessionData.businessId,
        isActive: true 
      },
      select: {
        slug: true
      }
    });

    if (!business) {
      // Business no encontrado, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'business-not-found');
      loginUrl.searchParams.set('message', 'El negocio no fue encontrado');
      return NextResponse.redirect(loginUrl);
    }

    // Redirigir a la ruta con business context usando slug
    const newUrl = new URL(`/${business.slug}${pathname}`, request.url);
    
    console.log(`🔄 Legacy redirect: ${pathname} → /${business.slug}${pathname}`);
    
    return NextResponse.redirect(newUrl);

  } catch (error) {
    console.error('Error in legacy redirect:', error);
    
    // En caso de error, redirigir a login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'redirect-error');
    loginUrl.searchParams.set('message', 'Error en la redirección');
    return NextResponse.redirect(loginUrl);
  }
}
