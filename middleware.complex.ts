import { NextRequest, NextResponse } from 'next/server';
import {
  getBusinessContext,
  extractBusinessFromUrl
} from './src/middleware/subdomain';
import { 
  validateUserSession, 
  hasPermission, 
  extractBusinessSlugFromPath,
  getRequiredPermissions,
  isClientRoute,
  requiresAdminAuth
} from './src/middleware/security';
import { handleSessionSegregation } from './src/middleware/sessionSegregation';

import { publicClientAccessEdge as publicClientAccess } from './src/middleware/publicClientAccessEdge';
import { createRateLimitResponse } from './src/lib/rate-limiter';

// 🚀 CACHE OPTIMIZADO PARA PRODUCCIÓN
const CACHE_TTL = process.env.NODE_ENV === 'production' ? 120000 : 30000; // 2 min en prod, 30s en dev
const BUSINESS_CACHE_TTL = process.env.NODE_ENV === 'production' ? 300000 : 60000; // 5 min en prod, 1 min en dev
const MAX_CACHE_SIZE = 1000; // Límite de entradas en cache

interface CacheEntry {
  data: any;
  timestamp: number;
  hitCount: number; // Para LRU optimization
}

const validationCache = new Map<string, CacheEntry>();
const businessCache = new Map<string, CacheEntry>();

// 🎯 OPTIMIZACIÓN: Cleanup periódico del cache
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 300000; // 5 minutos

function cleanupCache() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  // Limpiar validation cache
  for (const [key, entry] of validationCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      validationCache.delete(key);
    }
  }
  
  // Limpiar business cache
  for (const [key, entry] of businessCache.entries()) {
    if (now - entry.timestamp > BUSINESS_CACHE_TTL) {
      businessCache.delete(key);
    }
  }
  
  // LRU: Si el cache está muy lleno, eliminar las entradas menos usadas
  if (validationCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(validationCache.entries())
      .sort((a, b) => a[1].hitCount - b[1].hitCount)
      .slice(0, Math.floor(MAX_CACHE_SIZE * 0.2)); // Eliminar 20% menos usadas
    
    entries.forEach(([key]) => validationCache.delete(key));
  }
  
  lastCleanup = now;
}

async function getCachedBusiness(businessId: string): Promise<any> {
  cleanupCache(); // Cleanup automático
  const entry = businessCache.get(businessId);
  if (entry && (Date.now() - entry.timestamp) < BUSINESS_CACHE_TTL) {
    entry.hitCount++; // Incrementar contador para LRU
    return entry.data;
  }
  businessCache.delete(businessId);
  return null;
}

function setCachedBusiness(businessId: string, data: any): void {
  businessCache.set(businessId, { data, timestamp: Date.now(), hitCount: 1 });
}

// Exportar funciones de cache para uso en otros módulos
export { getCachedBusiness, setCachedBusiness };

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
const PUBLIC_ROUTES = [
  '/',
  '/login', 
  '/signup',
  '/api/auth/signin',
  '/api/auth/signup', 
  '/api/businesses',
  '/api/portal/config',
  '/api/branding',  // ✅ AGREGADO para acceso público
  '/api/debug',
];

/**
 * 🔥 FUNCIÓN CRÍTICA: Maneja redirecciones de rutas legacy con autenticación y contexto
 */
async function handleLegacyRouteRedirect(request: NextRequest, pathname: string): Promise<NextResponse> {
  console.log(`🚨 SECURITY: Blocking legacy route: ${pathname}`);
  
  // Obtener cookie de sesión
  const sessionCookie = request.cookies.get('session');
  if (sessionCookie) {
    console.log(`Sesión encontrada, validando...`);
    
    // Validar sesión usando nueva función de seguridad
    const sessionData = await validateUserSession(sessionCookie.value);
    if (sessionData?.businessSlug) {
      const redirectUrl = new URL(`/${sessionData.businessSlug}${pathname}`, request.url);
      console.log(`✅ Redirigiendo a ruta con contexto: ${redirectUrl.pathname}`);
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log(`❌ Sesión inválida o sin business`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'business-required');
      loginUrl.searchParams.set('message', 'Su sesión no tiene un negocio asociado válido');
      loginUrl.searchParams.set('attempted', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    console.log(`❌ No hay sesión activa`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'auth-required');
    loginUrl.searchParams.set('message', 'Debe iniciar sesión para acceder a esta área');
    loginUrl.searchParams.set('attempted', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * 🔥 FUNCIÓN CRÍTICA: Protege rutas admin con validación completa
 */
async function handleAdminRouteProtection(request: NextRequest, pathname: string): Promise<NextResponse> {
  console.log(`🔒 SECURITY: Protecting admin route: ${pathname}`);
  
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    console.log(`❌ Admin route access denied: No session`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'admin-auth-required');
    loginUrl.searchParams.set('message', 'Se requiere autenticación de administrador');
    return NextResponse.redirect(loginUrl);
  }

  // Validar sesión y permisos
  const sessionData = await validateUserSession(sessionCookie.value);
  if (!sessionData) {
    console.log(`❌ Admin route access denied: Invalid session`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'session-expired');
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permisos de admin (usando los permisos ya en la sesión)
  const requiredPermissions = getRequiredPermissions(pathname);
  const hasAccess = hasPermission(sessionData, requiredPermissions[0] || 'admin');
  
  if (!hasAccess) {
    console.log(`❌ Admin route access denied: Insufficient permissions`);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Insufficient permissions', 
        message: 'No tiene permisos para acceder a esta área' 
      }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log(`✅ Admin route access granted: ${pathname}`);
  return NextResponse.next();
}

/**
 * 🔥 FUNCIÓN CRÍTICA: Protege APIs de admin con autenticación robusta
 */
async function handleAdminApiProtection(request: NextRequest, pathname: string): Promise<NextResponse> {
  console.log(`🔒 SECURITY: Protecting admin API: ${pathname}`);
  
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Authentication required', 
        message: 'Esta API requiere autenticación de administrador' 
      }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  const sessionData = await validateUserSession(sessionCookie.value);
  if (!sessionData) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Invalid session', 
        message: 'Sesión inválida o expirada' 
      }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  // Verificar permisos específicos para la API
  const requiredPermissions = getRequiredPermissions(pathname);
  const hasAccess = hasPermission(sessionData, requiredPermissions[0] || 'admin');
  
  if (!hasAccess) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Insufficient permissions', 
        message: 'No tiene permisos para usar esta API' 
      }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  return NextResponse.next();
}

/**
 * 🔥 FUNCIÓN CRÍTICA: Maneja acceso de clientes con validación de contexto
 */
async function handleClientRouteAccess(request: NextRequest, pathname: string): Promise<NextResponse> {
  // Para rutas de cliente, permitir acceso pero validar business context
  const businessSlug = extractBusinessSlugFromPath(pathname);
  if (!businessSlug) {
    console.log(`❌ Client route missing business context: ${pathname}`);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Business context required', 
        message: 'Esta ruta requiere contexto de negocio específico' 
      }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log(`✅ Client route access granted: ${pathname}`);
  return NextResponse.next();
}



export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🛡️ RATE LIMITING - APLICAR ANTES DE CUALQUIER PROCESAMIENTO
  // Determinar tipo de rate limiting basado en la ruta
  let rateLimitType: 'auth' | 'api' | 'public' = 'public';
  
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    rateLimitType = 'auth';
  } else if (pathname.startsWith('/api/')) {
    rateLimitType = 'api';
  }

  const rateLimitResponse = await createRateLimitResponse(request, rateLimitType);
  if (rateLimitResponse) {
    console.log(`🛡️ Rate limit blocked: ${pathname} (${rateLimitType})`);
    return rateLimitResponse;
  }

  // Log básico para debug
  console.log(`🔒 MIDDLEWARE HARDENED: ${pathname}`);

  // 0. ACCESO PÚBLICO TOTAL: /api/cliente (sin restricciones de business context en middleware)
  if (pathname.startsWith('/api/cliente')) {
    console.log(`🌐 API CLIENTE PÚBLICA: Permitiendo acceso directo a ${pathname}`);
    return NextResponse.next();
  }

  // 0.1. ACCESO PÚBLICO: /[businessId]/cliente con validación de business
  if (/^\/[a-zA-Z0-9_-]+\/cliente(\/|$)/.test(pathname)) {
    return await publicClientAccess(request);
  }

  // 1. PERMITIR RUTAS PÚBLICAS INMEDIATAMENTE
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // 2. 🚨 BLOQUEAR RUTAS LEGACY Y REDIRIGIR CON CONTEXTO
  if (pathname === '/admin' || pathname === '/staff' || pathname === '/superadmin' || pathname === '/cliente') {
    return await handleLegacyRouteRedirect(request, pathname);
  }

  // 3. 🚨 CAPTURAR PETICIONES A BUSINESS-SELECTION (VULNERABILIDAD CRÍTICA)
  if (pathname.includes('business-selection')) {
    console.log('🚨 SECURITY: INTERCEPTED business-selection request:', {
      pathname,
      searchParams: request.nextUrl.searchParams.toString(),
      referer: request.headers.get('referer'),
      ip: request.ip || 'unknown',
    });
    
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'legacy-redirect-blocked');
    redirectUrl.searchParams.set('message', 'La página de selección de business fue eliminada por seguridad.');
    return NextResponse.redirect(redirectUrl);
  }

  // 4. 🔥 PROTECCIÓN CRÍTICA: RUTAS ADMIN CON BUSINESS CONTEXT
  if (requiresAdminAuth(pathname)) {
    return await handleAdminRouteProtection(request, pathname);
  }

  // 5. 🔥 PROTECCIÓN DE APIs CRÍTICAS DE ADMIN
  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/api/staff/')) {
    return await handleAdminApiProtection(request, pathname);
  }

  // 6. VALIDAR BUSINESS CONTEXT EN APIs QUE LO REQUIEREN (EXCLUYENDO /api/cliente que es público)
  const criticalApiRoutes = ['/api/clients', '/api/consumos', '/api/business']; // ✅ QUITADO /api/cliente
  const isCriticalApi = criticalApiRoutes.some(route => pathname.startsWith(route));
  
  if (isCriticalApi && !pathname.includes('/api/businesses/') && !extractBusinessFromUrl(pathname)) {
    console.log(`❌ API CRÍTICA BLOQUEADA sin business context: ${pathname}`);
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

  // 7. MANEJO DE BUSINESS CONTEXT ROUTING
  const businessContext = await handleBusinessRouting(request);
  if (businessContext) {
    return businessContext;
  }

  // 8. RUTAS DE CLIENTE (PÚBLICAS PERO CON BUSINESS CONTEXT)
  if (isClientRoute(pathname)) {
    return await handleClientRouteAccess(request, pathname);
  }

  // 9. VERIFICAR SI LA RUTA ESTÁ PROTEGIDA (FALLBACK)
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (isProtectedRoute) {
    console.log('🔒 Ruta protegida, verificando autenticación...');
    return handleProtectedRoute(request, pathname);
  }

  // 10. CONTINUAR CON RUTAS NO PROTEGIDAS
  return NextResponse.next();
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

    // 🔒 FASE 1.3: SESSION SEGREGATION - Validar tipo de sesión correcto
    const sessionValidation = await handleSessionSegregation(request, pathname, businessContext.businessId);
    if (sessionValidation) {
      return sessionValidation; // Puede ser redirect o error response
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
     * - _next/ (Next.js internals including HMR, static files, webpack, etc.)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - icons/ (icon assets)
     * - images/ (image assets)
     * - uploads/ (uploaded files)
     */
    '/((?!api/auth|_next|favicon.ico|manifest.json|sw.js|icons|images|uploads).*)',
  ],
};
