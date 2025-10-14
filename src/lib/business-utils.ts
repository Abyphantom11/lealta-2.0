import { NextRequest } from 'next/server';
import { getBusinessIdFromContext } from '@/utils/business-validation';

/**
 * Obtiene el business ID de una request HTTP
 * @param request - NextRequest object
 * @returns Business ID string o null si no existe
 */
export function getBusinessIdFromRequest(request: NextRequest): string | null {
  return getBusinessIdFromContext(request);
}

/**
 * Valida y obtiene el business ID de una request HTTP
 * Lanza error si no existe
 * @param request - NextRequest object
 * @returns Business ID string
 * @throws Error si no existe business ID
 */
export function requireBusinessId(request: NextRequest): string {
  const businessId = getBusinessIdFromContext(request);
  
  if (!businessId) {
    throw new Error('Business ID requerido');
  }
  
  return businessId;
}
