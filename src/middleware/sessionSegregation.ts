/**
 * 🔒 FASE 1.3: SESSION SEGREGATION
 * 
 * Sistema de segregación de sesiones que diferencia entre:
 * - AdminSession: Sesiones de servidor con cookies para admin/staff
 * - ClientSession: Sesiones de localStorage para portal cliente
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession, AdminSession, ClientSession } from './security';
import { prisma } from '../lib/prisma';

export interface SessionValidationResult {
  valid: boolean;
  session?: AdminSession | ClientSession;
  sessionType?: 'admin' | 'client';
  error?: string;
  shouldRedirect?: boolean;
  redirectUrl?: string;
}

/**
 * Valida sesión de cliente basada en datos del frontend
 */
export async function validateClientSessionData(
  clientData: { cedula: string; timestamp: number },
  businessId: string
): Promise<ClientSession | null> {
  try {
    if (!clientData?.cedula || !businessId) {
      return null;
    }
    
    // Verificar que el cliente existe en la base de datos y pertenece al business
    const cliente = await prisma.cliente.findFirst({
      where: {
        cedula: clientData.cedula,
        businessId: businessId,
      },
      select: {
        cedula: true,
        businessId: true,
      },
    });
    
    if (!cliente?.businessId) {
      return null;
    }
    
    return {
      cedula: cliente.cedula,
      businessId: cliente.businessId,
      sessionType: 'client'
    };
    
  } catch (error) {
    console.error('Error validando sesión de cliente:', error);
    return null;
  }
}

/**
 * Detecta el tipo de ruta para aplicar la validación correcta
 */
export function getRouteType(pathname: string): 'admin' | 'client' | 'public' {
  // Rutas de administración
  if (/^\/[^/]+\/(admin|staff|superadmin)/.test(pathname)) {
    return 'admin';
  }
  
  // Rutas de cliente
  if (/^\/[^/]+\/cliente/.test(pathname)) {
    return 'client';
  }
  
  // APIs de administración
  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/api/staff/')) {
    return 'admin';
  }
  
  // APIs de cliente
  if (pathname.startsWith('/api/cliente/')) {
    return 'client';
  }
  
  return 'public';
}

/**
 * Función principal de segregación de sesiones
 */
export async function validateSessionByType(
  request: NextRequest,
  pathname: string,
  businessId: string
): Promise<SessionValidationResult> {
  const routeType = getRouteType(pathname);
  
  console.log(`🔒 SESSION SEGREGATION: ${routeType.toUpperCase()} route: ${pathname}`);
  
  switch (routeType) {
    case 'admin':
      return await validateAdminSession(request, businessId);
      
    case 'client':
      return await validateClientSession(request, businessId);
      
    case 'public':
    default:
      return { valid: true };
  }
}

/**
 * Valida sesiones de administración (cookies de servidor)
 */
async function validateAdminSession(
  request: NextRequest,
  businessId: string
): Promise<SessionValidationResult> {
  console.log(`🔐 ADMIN SESSION: Validating server session`);
  
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    console.log(`❌ ADMIN SESSION: No session cookie found`);
    return {
      valid: false,
      error: 'admin-auth-required',
      shouldRedirect: true,
      redirectUrl: '/login'
    };
  }
  
  const adminSession = await validateUserSession(sessionCookie.value);
  if (!adminSession) {
    console.log(`❌ ADMIN SESSION: Invalid session data`);
    return {
      valid: false,
      error: 'admin-session-invalid',
      shouldRedirect: true,
      redirectUrl: '/login'
    };
  }
  
  // Verificar que el admin tiene acceso al business correcto
  if (adminSession.businessId !== businessId) {
    console.log(`❌ ADMIN SESSION: Business mismatch - Session: ${adminSession.businessId}, Required: ${businessId}`);
    return {
      valid: false,
      error: 'business-access-denied',
      shouldRedirect: true,
      redirectUrl: '/login'
    };
  }
  
  console.log(`✅ ADMIN SESSION: Valid for user ${adminSession.userId} (${adminSession.role})`);
  return {
    valid: true,
    session: adminSession,
    sessionType: 'admin'
  };
}

/**
 * Valida sesiones de cliente (localStorage validado en BD)
 */
async function validateClientSession(
  request: NextRequest,
  businessId: string
): Promise<SessionValidationResult> {
  console.log(`👤 CLIENT SESSION: Validating client access`);
  
  // Para rutas de cliente, no validamos cookies de sesión de servidor
  // La validación real se hace en el frontend con localStorage
  // Aquí solo verificamos que el business existe y está activo
  
  try {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
    
    if (!business) {
      console.log(`❌ CLIENT SESSION: Business not found or inactive: ${businessId}`);
      return {
        valid: false,
        error: 'business-not-found',
        shouldRedirect: true,
        redirectUrl: '/login'
      };
    }
    
    console.log(`✅ CLIENT SESSION: Business valid, client access allowed`);
    return {
      valid: true,
      sessionType: 'client',
      // Session será validada en el frontend con localStorage
      session: {
        cedula: 'frontend-validated',
        businessId: businessId,
        sessionType: 'client'
      }
    };
    
  } catch (error) {
    console.error('Error validating business for client:', error);
    return {
      valid: false,
      error: 'validation-error'
    };
  }
}

/**
 * Middleware handler para aplicar segregación de sesiones
 */
export async function handleSessionSegregation(
  request: NextRequest,
  pathname: string,
  businessId: string
): Promise<NextResponse | null> {
  const result = await validateSessionByType(request, pathname, businessId);
  
  if (!result.valid && result.shouldRedirect && result.redirectUrl) {
    console.log(`🚫 SESSION SEGREGATION: Redirecting to ${result.redirectUrl} - ${result.error}`);
    
    const redirectUrl = new URL(result.redirectUrl, request.url);
    redirectUrl.searchParams.set('error', result.error || 'access-denied');
    redirectUrl.searchParams.set('attempted', pathname);
    
    return NextResponse.redirect(redirectUrl);
  }
  
  if (!result.valid) {
    console.log(`🚫 SESSION SEGREGATION: Access denied - ${result.error}`);
    
    return new NextResponse(
      JSON.stringify({
        error: 'Access denied',
        message: 'No tiene permisos para acceder a esta área',
        code: result.error || 'ACCESS_DENIED'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Si llegamos aquí, la sesión es válida
  console.log(`✅ SESSION SEGREGATION: Access granted for ${result.sessionType} session`);
  
  // Agregar headers informativos para debugging
  const response = NextResponse.next();
  response.headers.set('x-session-type', result.sessionType || 'unknown');
  response.headers.set('x-business-id', businessId);
  
  if (result.session?.sessionType === 'admin') {
    const adminSession = result.session as AdminSession;
    response.headers.set('x-user-role', adminSession.role);
    response.headers.set('x-user-id', adminSession.userId);
  }
  
  return response;
}
