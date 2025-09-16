/**
 * Utilidades para validación de business access
 * Centraliza la lógica de validación para evitar duplicación
 */
import { NextRequest } from 'next/server';

/**
 * Valida el acceso a un business ID usando el contexto del middleware
 * @param request - Request object con headers del middleware
 * @returns El business ID validado desde los headers
 * @throws Error si el acceso es denegado
 */
export function validateBusinessAccess(request: NextRequest): string {
  const businessId = request.headers.get('x-business-id');
  
  if (!businessId) {
    throw new Error('No business context found. Access denied.');
  }
  
  // Validar formato del business ID
  if (typeof businessId !== 'string' || businessId.length < 1) {
    throw new Error('Invalid business ID format');
  }
  
  return businessId;
}

/**
 * Valida el acceso a un business ID específico contra el contexto actual
 * @param request - Request object con headers del middleware
 * @param expectedBusinessId - Business ID esperado para validar
 * @returns El business ID validado
 * @throws Error si no coincide con el contexto
 */
export function validateSpecificBusinessAccess(request: NextRequest, expectedBusinessId: string): string {
  const contextBusinessId = validateBusinessAccess(request);
  
  if (contextBusinessId !== expectedBusinessId) {
    throw new Error(`Business context mismatch. Expected: ${expectedBusinessId}, Got: ${contextBusinessId}`);
  }
  
  return contextBusinessId;
}

/**
 * Obtiene el business ID del contexto actual sin validación estricta
 * @param request - Request object con headers del middleware
 * @returns Business ID o null si no existe
 */
export function getBusinessIdFromContext(request: NextRequest): string | null {
  return request.headers.get('x-business-id');
}

/**
 * Obtiene información completa del business desde los headers del middleware
 * @param request - Request object con headers del middleware
 * @returns Objeto con información del business
 */
export function getBusinessContext(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    subdomain: request.headers.get('x-business-subdomain'),
    businessName: request.headers.get('x-business-name'),
    userId: request.headers.get('x-user-id'),
    userRole: request.headers.get('x-user-role'),
  };
}
