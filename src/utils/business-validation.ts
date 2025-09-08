/**
 * Utilidades para validación de business access
 * Centraliza la lógica de validación para evitar duplicación
 */

/**
 * Valida el acceso a un business ID
 * @param businessId - ID del business a validar
 * @returns El business ID validado
 * @throws Error si el acceso es denegado
 */
export function validateBusinessAccess(businessId: string): string {
  if (!businessId) {
    throw new Error('Business ID is required');
  }
  
  // Solo permitir business_1 que es el que existe en la base de datos
  const allowedBusinessIds = ['business_1'];
  
  // Normalizar IDs comunes a business_1
  const normalizedId = businessId === 'default-business' || businessId === 'default' 
    ? 'business_1' 
    : businessId;
  
  if (!allowedBusinessIds.includes(normalizedId)) {
    throw new Error(`Access denied to business: ${businessId}`);
  }
  
  return normalizedId;
}

/**
 * Obtiene el business ID por defecto
 * @returns Business ID por defecto (siempre business_1)
 */
export function getDefaultBusinessId(): string {
  return 'business_1';
}

/**
 * Normaliza el business ID para compatibilidad
 * @param businessId - Business ID a normalizar
 * @returns Business ID normalizado (siempre business_1)
 */
export function normalizeBusinessId(businessId: string): string {
  // Todos los IDs se normalizan a business_1
  return 'business_1';
}
