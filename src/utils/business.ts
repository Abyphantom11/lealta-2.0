// utils/business.ts
/**
 * Utilidades para manejo de Business ID
 * Integrado con NextAuth para obtener el business del usuario autenticado
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

const DEVELOPMENT_BUSINESS_ID = 'business_1';

/**
 * Obtiene el Business ID actual del usuario autenticado
 * En desarrollo: retorna ID hardcodeado
 * En producción: obtiene del usuario autenticado via NextAuth
 */
export async function getCurrentBusinessId(): Promise<string> {
  // En desarrollo
  if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_BUSINESS_ID;
  }
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      throw new Error('No business ID found in user session');
    }
    
    return session.user.businessId;
  } catch (error) {
    throw new Error(`Failed to get business ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifica si un business ID es válido para el usuario actual
 * En desarrollo: siempre retorna true para el business de desarrollo
 * En producción: verifica que el usuario tenga acceso al business
 */
export async function canAccessBusiness(businessId: string): Promise<boolean> {
  // En desarrollo
  if (process.env.NODE_ENV === 'development') {
    return businessId === DEVELOPMENT_BUSINESS_ID;
  }
  
  try {
    const userBusinessId = await getCurrentBusinessId();
    return userBusinessId === businessId;
  } catch {
    return false;
  }
}

/**
 * Middleware helper para APIs que necesitan business ID
 * Valida acceso y retorna el business ID verificado
 */
export async function validateBusinessAccess(businessId: string): Promise<string> {
  if (!businessId) {
    throw new Error('Business ID is required');
  }
  
  const hasAccess = await canAccessBusiness(businessId);
  if (!hasAccess) {
    throw new Error('Access denied to this business');
  }
  
  return businessId;
}

/**
 * Versión síncrona para contextos cliente (hooks, componentes)
 * Solo funciona en desarrollo o cuando el businessId ya está validado
 */
export function getCurrentBusinessIdSync(): string {
  if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_BUSINESS_ID;
  }
  
  // En producción, esto debe usarse solo cuando ya tienes el businessId del contexto
  throw new Error('Use getCurrentBusinessId() async version in production');
}
