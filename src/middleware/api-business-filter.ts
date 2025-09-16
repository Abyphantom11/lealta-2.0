// src/middleware/api-business-filter.ts
import { NextRequest } from 'next/server';

/**
 * Helper para extraer business context de las APIs legacy
 * Agrega filtrado automático por businessId
 */
export function getBusinessContextFromAPI(request: NextRequest): {
  businessId: string | null;
  userId: string | null;
  userRole: string | null;
} {
  // Intentar obtener del header (ya procesado por middleware)
  const businessId = request.headers.get('x-business-id');
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (businessId && userId) {
    return { businessId, userId, userRole };
  }

  // Fallback: obtener de la sesión directamente
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      const sessionData = JSON.parse(sessionCookie);
      return {
        businessId: sessionData.businessId || null,
        userId: sessionData.userId || null,
        userRole: sessionData.role || null
      };
    }
  } catch (error) {
    console.error('Error parsing session in API:', error);
  }

  return { businessId: null, userId: null, userRole: null };
}

/**
 * Wrapper para queries que necesitan filtrado por business
 */
export function withBusinessFilter<T extends { businessId?: string }>(
  baseWhere: T,
  businessId: string | null
): T {
  if (!businessId) {
    throw new Error('Business context required for this operation');
  }

  return {
    ...baseWhere,
    businessId
  } as T;
}

/**
 * Validar que el usuario tenga acceso al business
 */
export async function validateBusinessAccess(
  userId: string,
  businessId: string
): Promise<boolean> {
  try {
    const { prisma } = await import('../lib/prisma');
    
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        businessId: businessId,
        isActive: true
      }
    });

    return !!user;
  } catch (error) {
    console.error('Error validating business access:', error);
    return false;
  }
}

/**
 * Middleware helper para APIs que requieren business context
 */
export async function requireBusinessContext(request: NextRequest): Promise<{
  businessId: string;
  userId: string;
  userRole: string;
} | null> {
  const context = getBusinessContextFromAPI(request);
  
  if (!context.businessId || !context.userId) {
    return null;
  }

  // Validar acceso
  const hasAccess = await validateBusinessAccess(context.userId, context.businessId);
  if (!hasAccess) {
    return null;
  }

  return {
    businessId: context.businessId,
    userId: context.userId,
    userRole: context.userRole || 'STAFF'
  };
}
