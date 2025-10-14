// src/middleware/legacy-redirect.ts
import { NextRequest, NextResponse } from 'next/server';

// Importar funciones de cache del middleware
let getCachedBusiness: ((businessId: string) => any | null) | null = null;
let setCachedBusiness: ((businessId: string, data: any) => void) | null = null;

// Función async para inicializar funciones de cache
async function initializeCacheFunctions() {
  if (getCachedBusiness && setCachedBusiness) return; // Ya inicializadas
  
  try {
    const middlewareModule = await import('../../middleware');
    getCachedBusiness = middlewareModule.getCachedBusiness;
    setCachedBusiness = middlewareModule.setCachedBusiness;
  } catch (error) {
    console.log('Cache functions not available:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Función optimizada para obtener business con cache
 */
async function getBusinessSlug(businessId: string): Promise<string | null> {
  // Inicializar funciones de cache si es necesario
  await initializeCacheFunctions();
  
  // Intentar obtener del cache primero
  if (getCachedBusiness) {
    const cached = getCachedBusiness(businessId);
    if (cached?.slug) {
      console.log(`🚀 CACHE HIT: Business slug ${businessId} found in cache`);
      return cached.slug;
    }
  }

  // Si no está en cache, consultar base de datos
  try {
    const { prisma } = await import('../lib/prisma');
    
    const business = await prisma.business.findUnique({
      where: { 
        id: businessId,
        isActive: true 
      },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
      }
    });

    // Guardar en cache si está disponible
    if (setCachedBusiness && business) {
      setCachedBusiness(businessId, business);
      console.log(`💾 CACHE SET: Business ${businessId} cached`);
    }

    return business?.slug || null;
  } catch (error) {
    console.error('Error getting business slug:', error);
    return null;
  }
}

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

    // Obtener subdomain del business usando cache
    const businessSlug = await getBusinessSlug(sessionData.businessId);

    if (!businessSlug) {
      // Business no encontrado, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'business-not-found');
      loginUrl.searchParams.set('message', 'El negocio no fue encontrado');
      return NextResponse.redirect(loginUrl);
    }

    // Redirigir a la ruta con business context usando slug
    const newUrl = new URL(`/${businessSlug}${pathname}`, request.url);
    
    console.log(`🔄 Legacy redirect: ${pathname} → /${businessSlug}${pathname}`);
    
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
