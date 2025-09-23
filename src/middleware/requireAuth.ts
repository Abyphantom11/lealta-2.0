/**
 * 🔥 MIDDLEWARE CRÍTICO: requireAuth() - Protección robusta para APIs Admin
 * 
 * Este middleware centraliza la autenticación y autorización para todas las APIs admin,
 * proporcionando múltiples capas de seguridad contra acceso no autorizado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession, hasPermission, AdminSession } from './security';

export interface AuthConfig {
  requiredPermission?: string;
  requireBusinessOwnership?: boolean;
  allowedRoles?: readonly ('superadmin' | 'admin' | 'staff')[];
  logAccess?: boolean;
}

/**
 * Middleware de autenticación para APIs Admin
 * Valida sesión, permisos y ownership de business
 */
export async function requireAuth(
  request: NextRequest,
  config: AuthConfig = {}
): Promise<{ success: true; session: AdminSession } | { success: false; response: NextResponse }> {
  
  const {
    requiredPermission = 'admin',
    requireBusinessOwnership = true,
    allowedRoles = ['superadmin', 'admin', 'staff'],
    logAccess = true
  } = config;

  const pathname = request.nextUrl.pathname;
  // const method = request.method; // Para futuro logging detallado

  // Log de seguridad
  if (logAccess) {
    // ✅ Auth protecting log removido para evitar spam
  }

  // 1. EXTRAER COOKIE DE SESIÓN
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    console.log(`❌ AUTH DENIED: No session cookie - ${pathname}`);
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Se requiere autenticación para acceder a esta API',
          code: 'NO_SESSION'
        },
        { status: 401 }
      )
    };
  }

  // 2. VALIDAR SESIÓN
  let sessionData: AdminSession | null;
  try {
    sessionData = await validateUserSession(sessionCookie.value);
  } catch (error) {
    console.log(`❌ AUTH ERROR: Session validation failed - ${pathname}:`, error);
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Authentication error',
          message: 'Error al validar la sesión',
          code: 'SESSION_ERROR'
        },
        { status: 401 }
      )
    };
  }

  if (!sessionData) {
    console.log(`❌ AUTH DENIED: Invalid session - ${pathname}`);
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Invalid session',
          message: 'Sesión inválida o expirada',
          code: 'INVALID_SESSION'
        },
        { status: 401 }
      )
    };
  }

  // 3. VERIFICAR ROLE PERMITIDO
  if (!allowedRoles.includes(sessionData.role)) {
    console.log(`❌ AUTH DENIED: Insufficient role (${sessionData.role}) - ${pathname}`);
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Insufficient privileges',
          message: `Su rol (${sessionData.role}) no tiene acceso a esta API`,
          code: 'INSUFFICIENT_ROLE'
        },
        { status: 403 }
      )
    };
  }

  // 4. VERIFICAR PERMISOS ESPECÍFICOS
  if (requiredPermission && !hasPermission(sessionData, requiredPermission)) {
    console.log(`❌ AUTH DENIED: Missing permission (${requiredPermission}) - ${pathname}`);
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Insufficient permissions',
          message: `No tiene permisos para: ${requiredPermission}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    };
  }

  // 5. VERIFICAR BUSINESS OWNERSHIP (Si está configurado)
  if (requireBusinessOwnership) {
    const businessIdFromUrl = extractBusinessIdFromUrl(pathname);
    if (businessIdFromUrl && businessIdFromUrl !== sessionData.businessId) {
      console.log(`❌ AUTH DENIED: Business ownership violation - ${pathname}`);
      console.log(`  Session business: ${sessionData.businessId}`);
      console.log(`  Requested business: ${businessIdFromUrl}`);
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Business access denied',
            message: 'No tiene acceso a este negocio',
            code: 'BUSINESS_ACCESS_DENIED'
          },
          { status: 403 }
        )
      };
    }
  }

  // ✅ AUTENTICACIÓN EXITOSA
  if (logAccess) {
    // ✅ Auth success log solo en development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ AUTH: ${sessionData.role} - ${pathname}`);
    }
  }

  return {
    success: true,
    session: sessionData
  };
}

/**
 * Extrae businessId de URLs que contienen contexto de negocio
 */
function extractBusinessIdFromUrl(pathname: string): string | null {
  // Buscar patrones como: /api/admin/business/{businessId}/...
  const businessPattern = /\/api\/admin\/business\/([^\/]+)/;
  const match = pathname.match(businessPattern);
  return match ? match[1] : null;
}

/**
 * Wrapper para APIs que necesitan autenticación simple
 */
export async function withAuth(
  request: NextRequest,
  handler: (session: AdminSession) => Promise<NextResponse> | NextResponse,
  config?: AuthConfig
): Promise<NextResponse> {
  
  const authResult = await requireAuth(request, config);
  
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    return await handler(authResult.session);
  } catch (error) {
    console.error(`API Error in ${request.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Configuraciones predefinidas para diferentes tipos de APIs
 */
export const AuthConfigs = {
  // Para APIs de solo lectura (estadísticas, etc)
  READ_ONLY: {
    requiredPermission: 'read',
    allowedRoles: ['superadmin', 'admin', 'staff'] as const,
    requireBusinessOwnership: true,
    logAccess: true
  },

  // Para APIs de escritura (crear, editar)  
  WRITE: {
    requiredPermission: 'write',
    allowedRoles: ['superadmin', 'admin'] as const,
    requireBusinessOwnership: true,
    logAccess: true
  },

  // Para APIs críticas (eliminar, configuración)
  ADMIN_ONLY: {
    requiredPermission: 'admin',
    allowedRoles: ['superadmin', 'admin'] as const,
    requireBusinessOwnership: true,
    logAccess: true
  },

  // Para APIs de superadmin únicamente
  SUPERADMIN_ONLY: {
    requiredPermission: 'superadmin',
    allowedRoles: ['superadmin'] as const,
    requireBusinessOwnership: false,
    logAccess: true
  }
};
