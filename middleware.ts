import { NextRequest, NextResponse } from 'next/server';

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

  // Permitir acceso a rutas públicas y estáticas
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Verificar si la ruta está protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Manejo especial para rutas de API de admin
  if (pathname.startsWith('/api/admin/')) {
    return handleAdminApiRoute(request, pathname);
  }

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  console.log('🔒 Ruta protegida, verificando autenticación...');
  return handleProtectedRoute(request, pathname);
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

  // SUPERADMIN puede acceder a todo
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

  // ADMIN puede acceder a admin y staff
  // STAFF solo puede acceder a staff
  if (pathname.startsWith('/admin') && !['SUPERADMIN', 'ADMIN'].includes(role)) {
    const redirectUrl = new URL('/staff', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/staff') && !['SUPERADMIN', 'ADMIN', 'STAFF'].includes(role)) {
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
