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
  '/api/consumos'
];

// Rutas públicas (login, signup, etc.)
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a rutas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permitir acceso a archivos estáticos
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Verificar si la ruta está protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Verificar sesión desde cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      // Redirigir a login si no está autenticado
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Parsear datos básicos de la sesión
    const sessionData = JSON.parse(sessionCookie);
    
    if (!sessionData.userId || !sessionData.role) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verificación básica de acceso por rol
    const role = sessionData.role;
    
    // SUPERADMIN puede acceder a todos los dashboards
    if (role === 'SUPERADMIN') {
      // Permitir acceso completo a SUPERADMIN
      const response = NextResponse.next();
      response.headers.set('x-user-id', sessionData.userId);
      response.headers.set('x-user-role', role);
      response.headers.set('x-business-id', sessionData.businessId);
      return response;
    }
    
    // Verificar acceso específico para otros roles
    if ((pathname.startsWith('/superadmin') || pathname.startsWith('/dashboard/superadmin'))) {
      // Solo SUPERADMIN puede acceder aquí
      const redirectUrl = new URL(role === 'ADMIN' ? '/admin' : '/staff', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    if ((pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) && role !== 'ADMIN') {
      const redirectUrl = new URL('/staff', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if ((pathname.startsWith('/staff') || pathname.startsWith('/dashboard/staff')) && !['ADMIN', 'STAFF'].includes(role)) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Añadir información del usuario a los headers para uso en API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', sessionData.userId);
    response.headers.set('x-user-role', role);
    response.headers.set('x-business-id', sessionData.businessId);

    return response;

  } catch (error) {
    console.error('Middleware auth error:', error);
    
    // En caso de error, redirigir a login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}