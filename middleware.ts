import { NextRequest, NextResponse } from 'next/server';
import {
  getBusinessContext,
  extractBusinessFromUrl
} from './src/middleware/subdomain';
import { handleLegacyRedirect } from './src/middleware/legacy-redirect';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/superadmin',
  '/admin',
  '/staff',
  '/dashboard',
  '/api/users',
  '/api/business',
  '/api/clients',
  '/api/consumos',
  // Las rutas /api/admin/* están protegidas pero se manejan de forma especial
];

// Rutas públicas (login, signup, etc.)
const PUBLIC_ROUTES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 MIDDLEWARE DEBUG:', {
    pathname,
    hasSessionCookie: !!request.cookies.get('session'),
    sessionCookieValue: request.cookies.get('session')?.value,
  });

  // 🚫 ESTRATEGIA HÍBRIDA PARA RUTAS LEGACY
  const criticalRoutes = ['/superadmin']; // Bloqueo total para admin crítico
  const userRoutes = ['/admin', '/staff', '/cliente']; // Redirección inteligente

  // BLOQUEO COMPLETO para rutas críticas
  const isCriticalRoute = criticalRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isCriticalRoute) {
    console.log(`🚫 Ruta crítica bloqueada: ${pathname}`);

    const redirectUrl = new URL('/business-selection', request.url);
    redirectUrl.searchParams.set('blocked_route', pathname);
    redirectUrl.searchParams.set('reason', 'critical-route-blocked');

    return NextResponse.redirect(redirectUrl);
  }

  // REDIRECCIÓN INTELIGENTE para rutas de usuario
  const isUserRoute = userRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isUserRoute) {
    const legacyRedirect = await handleLegacyRedirect(request, pathname);
    if (legacyRedirect) {
      return legacyRedirect;
    }
  }

  // 1. MANEJO DE BUSINESS CONTEXT
  const businessContext = await handleBusinessRouting(request);
  if (businessContext) {
    return businessContext; // Ya sea rewrite o redirect
  }

  // 2. PERMITIR RUTAS PÚBLICAS Y ESTÁTICAS
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // 3. MANEJO ESPECIAL PARA APIs DE ADMIN
  if (pathname.startsWith('/api/admin/')) {
    return handleAdminApiRoute(request, pathname);
  }

  // 4. VERIFICAR SI LA RUTA ESTÁ PROTEGIDA
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  console.log('🔒 Ruta protegida, verificando autenticación...');
  return handleProtectedRoute(request, pathname);
}

/**
 * Maneja el routing basado en business context
 */
async function handleBusinessRouting(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Verificar si es una ruta con business context
  const urlData = extractBusinessFromUrl(pathname);
  if (!urlData) {
    return null; // No es una ruta de business
  }

  try {
    // Obtener contexto completo del business
    const businessContext = await getBusinessContext(request);

    if (!businessContext) {
      // Business no encontrado o inactivo
      console.log(`❌ Business '${urlData.subdomain}' no encontrado o inactivo`);

      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'business-not-found');
      errorUrl.searchParams.set('subdomain', urlData.subdomain);

      return NextResponse.redirect(errorUrl);
    }

    // 🔐 VALIDACIÓN DE SEGURIDAD: Verificar que el usuario tenga acceso al business
    const hasBusinessAccess = await validateUserBusinessAccess(request, businessContext.businessId);

    if (!hasBusinessAccess.allowed) {
      console.log(`🚫 Acceso denegado a business '${urlData.subdomain}' para usuario:`, hasBusinessAccess.reason);

      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'access-denied');
      errorUrl.searchParams.set('business', urlData.subdomain);
      errorUrl.searchParams.set('reason', hasBusinessAccess.reason);

      return NextResponse.redirect(errorUrl);
    }

    // Reescribir URL interna removiendo el subdomain
    const internalUrl = new URL(businessContext.remainingPath || '/', request.url);
    const response = NextResponse.rewrite(internalUrl);

    // Agregar headers de business context
    response.headers.set('x-business-id', businessContext.businessId);
    response.headers.set('x-business-subdomain', businessContext.subdomain);
    response.headers.set('x-business-name', businessContext.business?.name || '');
    response.headers.set('x-user-id', hasBusinessAccess.userId || '');
    response.headers.set('x-user-role', hasBusinessAccess.userRole || '');

    console.log('✅ Business context aplicado:', {
      subdomain: businessContext.subdomain,
      businessId: businessContext.businessId,
      userId: hasBusinessAccess.userId,
      userRole: hasBusinessAccess.userRole,
      originalPath: pathname,
      rewrittenPath: businessContext.remainingPath
    });

    return response;

  } catch (error) {
    console.error('❌ Error en business routing:', error);

    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set('error', 'business-error');

    return NextResponse.redirect(errorUrl);
  }
}

/**
 * 🔐 Valida que el usuario actual tenga acceso al business solicitado
 */
async function validateUserBusinessAccess(
  request: NextRequest,
  businessId: string
): Promise<{
  allowed: boolean;
  reason: string;
  userId?: string;
  userRole?: string;
}> {
  try {
    // Obtener sesión del usuario
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return {
        allowed: false,
        reason: 'no-session'
      };
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch {
      return {
        allowed: false,
        reason: 'invalid-session'
      };
    }

    if (!sessionData.userId || !sessionData.businessId) {
      return {
        allowed: false,
        reason: 'incomplete-session'
      };
    }

    // 🚫 VALIDACIÓN CRÍTICA: El business de la sesión DEBE coincidir con el de la URL
    if (sessionData.businessId !== businessId) {
      return {
        allowed: false,
        reason: 'business-mismatch',
        userId: sessionData.userId
      };
    }

    // Validar que el usuario aún existe y tiene acceso
    const { prisma } = await import('./src/lib/prisma');

    const user = await prisma.user.findUnique({
      where: {
        id: sessionData.userId,
        businessId: businessId, // Doble verificación
        isActive: true
      },
      select: {
        id: true,
        businessId: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return {
        allowed: false,
        reason: 'user-not-found'
      };
    }

    if (user.businessId !== businessId) {
      return {
        allowed: false,
        reason: 'user-business-mismatch'
      };
    }

    // ✅ Usuario validado y autorizado
    return {
      allowed: true,
      reason: 'authorized',
      userId: user.id,
      userRole: user.role
    };

  } catch (error) {
    console.error('Error validating user business access:', error);
    return {
      allowed: false,
      reason: 'validation-error'
    };
  }
}

async function handleAdminApiRoute(request: NextRequest, pathname: string) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      console.log('❌ API Admin: No hay cookie de sesión');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie);

    if (!sessionData.userId || !sessionData.role) {
      console.log('❌ API Admin: Datos de sesión incompletos');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos de admin o staff
    if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(sessionData.role)) {
      console.log('❌ API Admin: Rol insuficiente:', sessionData.role);
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // Pasar headers de autenticación a la API
    const response = NextResponse.next();
    response.headers.set('x-user-id', sessionData.userId);
    response.headers.set('x-user-role', sessionData.role);
    response.headers.set('x-business-id', sessionData.businessId);

    console.log('✅ API Admin autorizada:', {
      pathname,
      role: sessionData.role,
      userId: sessionData.userId,
    });

    return response;
  } catch (error) {
    console.error('❌ Error en API Admin middleware:', error);
    return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 });
  }
}

async function handleProtectedRoute(request: NextRequest, pathname: string) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      console.log('❌ No hay cookie de sesión, redirigiendo a login');
      return redirectToLogin(request, pathname);
    }

    const sessionData = JSON.parse(sessionCookie);

    if (!sessionData.userId || !sessionData.role) {
      console.log('❌ Datos de sesión incompletos');
      return redirectToLogin(request, pathname);
    }

    return processUserRole(sessionData, pathname, request);
  } catch (error) {
    console.error('❌ Middleware auth error:', {
      message: error instanceof Error ? error.message : String(error),
      pathname: pathname,
      hasCookie: !!request.cookies.get('session'),
    });

    return redirectToLogin(request, pathname);
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

function processUserRole(
  sessionData: any,
  pathname: string,
  request: NextRequest
) {
  const role = sessionData.role;

  // SUPERADMIN puede acceder a todas las rutas
  if (role === 'SUPERADMIN') {
    return createResponseWithHeaders(sessionData, role);
  }

  // Verificar acceso específico para otros roles
  if (pathname.startsWith('/superadmin') && role !== 'SUPERADMIN') {
    const redirectUrl = new URL(
      role === 'ADMIN' ? '/admin' : '/staff',
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    const redirectUrl = new URL('/staff', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/staff') && !['ADMIN', 'STAFF'].includes(role)) {
    return redirectToLogin(request, pathname);
  }

  return createResponseWithHeaders(sessionData, role);
}

function createResponseWithHeaders(sessionData: any, role: string) {
  const response = NextResponse.next();
  response.headers.set('x-user-id', sessionData.userId);
  response.headers.set('x-user-role', role);
  response.headers.set('x-business-id', sessionData.businessId);

  console.log('✅ Headers añadidos:', {
    'x-user-id': sessionData.userId,
    'x-user-role': role,
    'x-business-id': sessionData.businessId,
  });

  return response;
}

// Configuración del middleware - especifica en qué rutas debe ejecutarse
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes should be public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
