// utils/business.ts
/**
 * Utilidades para manejo de Business ID
 * En desarrollo usa un ID hardcodeado, en producción debe venir del contexto de auth
 */

// TODO: En producción, obtener del contexto de autenticación
const DEVELOPMENT_BUSINESS_ID = 'business_1';

/**
 * Obtiene el Business ID actual
 * En desarrollo: retorna ID hardcodeado
 * En producción: debería obtenerlo del usuario autenticado
 */
export function getCurrentBusinessId(): string {
  // En desarrollo
  if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_BUSINESS_ID;
  }
  
  // TODO: En producción, implementar lógica real
  // Ejemplo: obtenerlo del contexto de auth, JWT, session, etc.
  throw new Error('Business ID logic not implemented for production');
}

/**
 * Verifica si un business ID es válido para el usuario actual
 * En desarrollo: siempre retorna true
 * En producción: debería verificar permisos
 */
export function canAccessBusiness(businessId: string): boolean {
  // En desarrollo
  if (process.env.NODE_ENV === 'development') {
    return businessId === DEVELOPMENT_BUSINESS_ID;
  }
  
  // TODO: En producción, verificar permisos del usuario
  return false;
}

/**
 * Middleware helper para APIs que necesitan business ID
 */
export function validateBusinessAccess(businessId: string) {
  if (!businessId) {
    throw new Error('Business ID is required');
  }
  
  if (!canAccessBusiness(businessId)) {
    throw new Error('Access denied to this business');
  }
  
  return businessId;
}
