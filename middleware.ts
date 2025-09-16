import { NextRequest, NextResponse } from 'next/server';
import {
  getBusinessContext,
  extractBusinessFromUrl
} from './src/middleware/subdomain';
import { prisma } from './src/lib/prisma';

// Rutas que requieren autenticación (después del chequeo de businessId)
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/users',
  '/api/business',
  '/api/clients',
  '/api/consumos',
  // Las rutas /api/admin/* están protegidas pero se manejan de forma especial
  // Nota: /superadmin, /admin, /staff ya no están aquí porque se manejan en el bloqueo de rutas peligrosas
];

// Rutas públicas (login, signup, etc.)
const PUBLIC_ROUTES = ['/login', '/signup'];

/**
 * Obtiene el businessId del usuario desde la base de datos
 */
async function getUserBusinessSlug(sessionCookie: string): Promise<string | null> {
  try {
    console.log(`Obteniendo business slug desde DB...`);
    const sessionData = JSON.parse(sessionCookie);
    
    if (!sessionData.userId) {
      console.log(`No userId en sesion`);
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: {
        id: sessionData.userId,
        isActive: true,
      },
      include: {
        business: {
          select: {
            slug: true,
            subdomain: true,
            isActive: true,
          },
        },
      },
    });
    
    if (!user?.business?.isActive) {
      console.log(`Usuario o business no encontrado/activo`);
      return null;
    }
    
    const businessSlug = user.business.slug || user.business.subdomain;
    console.log(`Business slug obtenido: ${businessSlug}`);
    return businessSlug;
    
  } catch (error) {
    console.error('Error obteniendo business slug:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log básico para debug
  console.log(`MIDDLEWARE: ${pathname}`);

  // BLOQUEAR RUTAS ESPECÍFICAS Y REDIRIGIR CON CONTEXTO REAL
  if (pathname === '/admin' || pathname === '/staff' || pathname === '/superadmin' || pathname === '/cliente') {
    console.log(`Bloqueando ruta: ${pathname}`);
    
    // Obtener cookie de sesión
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie) {
      console.log(`Sesion encontrada, obteniendo business...`);
      
      // Obtener el business slug del usuario desde la DB
      const businessSlug = await getUserBusinessSlug(sessionCookie.value);
      
      if (businessSlug) {
        const redirectUrl = new URL(`/${businessSlug}${pathname}`, request.url);
        console.log(`Redirigiendo a: ${redirectUrl.pathname}`);
        return NextResponse.redirect(redirectUrl);
      } else {
        console.log(`No se pudo obtener business, redirigiendo a login`);
        // Redirigir a login con información sobre la ruta intentada
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'business-required');
        loginUrl.searchParams.set('message', 'Su sesión no tiene un negocio asociado válido');
        loginUrl.searchParams.set('attempted', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      console.log(`No hay sesion activa`);
      // Sin sesión, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'auth-required');
      loginUrl.searchParams.set('message', 'Debe iniciar sesión para acceder a esta área');
      loginUrl.searchParams.set('attempted', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 🚨 BLOQUEAR RUTAS ESPECÍFICAS Y REDIRIGIR
  if (pathname === '/admin') {
    console.log('🚫 Blocking /admin, redirecting to /arepa/admin');
    return NextResponse.redirect(new URL('/arepa/admin', request.url));
  }

  if (pathname === '/staff') {
    console.log('🚫 Blocking /staff, redirecting to /arepa/staff');
    return NextResponse.redirect(new URL('/arepa/staff', request.url));
  }

  if (pathname === '/superadmin') {
    console.log('� Blocking /superadmin, redirecting to /arepa/superadmin');
    return NextResponse.redirect(new URL('/arepa/superadmin', request.url));
  }

  if (pathname === '/cliente') {
    console.log('🚫 Blocking /cliente, redirecting to /arepa/cliente');
    return NextResponse.redirect(new URL('/arepa/cliente', request.url));
  }

  // 🚨 CAPTURAR PETICIONES A BUSINESS-SELECTION
  if (pathname.includes('business-selection')) {
    console.log('🚨 INTERCEPTED business-selection request:', {
      pathname,
      searchParams: request.nextUrl.searchParams.toString(),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    });
    
    // Redirigir a login en lugar de devolver 404
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'legacy-redirect-blocked');
    redirectUrl.searchParams.set('message', 'La página de selección de business fue eliminada por seguridad. Inicia sesión directamente.');
    return NextResponse.redirect(redirectUrl);
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

  // 3. BLOQUEAR APIs CRÍTICAS SIN BUSINESS CONTEXT
  const criticalApiRoutes = ['/api/clients', '/api/consumos', '/api/business'];
  const isCriticalApi = criticalApiRoutes.some(route => pathname.startsWith(route));
  
  if (isCriticalApi && !pathname.includes('/api/businesses/') && !extractBusinessFromUrl(pathname)) {
    console.log(`API CRITICA BLOQUEADA sin business context: ${pathname}`);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Business context required', 
        message: 'Esta API requiere contexto de negocio específico' 
      }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  // 4. MANEJO ESPECIAL PARA APIs DE ADMIN
  if (pathname.startsWith('/api/admin/')) {
    return handleAdminApiRoute(request, pathname);
  }

  // 5. VERIFICAR SI LA RUTA ESTÁ PROTEGIDA
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

      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'invalid-business');
      redirectUrl.searchParams.set('message', 'El negocio solicitado no existe o no está disponible.');

      return NextResponse.redirect(redirectUrl);
    }

    // 🔐 VALIDACIÓN DE SEGURIDAD: Verificar que el usuario tenga acceso al business
    const hasBusinessAccess = await validateUserBusinessAccess(request, businessContext.businessId);

    if (!hasBusinessAccess.allowed) {
      console.log(`🚫 Acceso denegado a business '${urlData.subdomain}' para usuario:`, hasBusinessAccess.reason);

      // Si no tiene sesión, ir a login
      if (hasBusinessAccess.reason === 'no-session' || hasBusinessAccess.reason === 'invalid-session') {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'session-required');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Si tiene sesión pero no acceso al business, ir a login con error
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'access-denied');
      loginUrl.searchParams.set('message', 'No tienes permisos para acceder a este negocio.');

      return NextResponse.redirect(loginUrl);
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

/**
 * Extrae el businessId de la sesión de manera segura
 */
function extractBusinessIdFromSession(sessionCookie: string): string | null {
  try {
    console.log(`Parsing session cookie...`);
    const sessionData = JSON.parse(sessionCookie);
    console.log(`📊 Session data keys:`, Object.keys(sessionData));
    
    // Múltiples intentos para obtener el businessId
    const businessId = sessionData.businessId || 
                      sessionData.business?.id || 
                      sessionData.business?.slug ||
                      sessionData.selectedBusinessId ||
                      null;
                      
    console.log(`🏢 BusinessId extraction attempts:`, {
      'sessionData.businessId': sessionData.businessId,
      'sessionData.business?.id': sessionData.business?.id,
      'sessionData.business?.slug': sessionData.business?.slug,
      'sessionData.selectedBusinessId': sessionData.selectedBusinessId,
      'final result': businessId
    });
    
    return businessId;
  } catch (error) {
    console.error('❌ Error parseando sesión para businessId:', error);
    return null;
  }
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
