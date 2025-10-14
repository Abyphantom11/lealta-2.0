// src/middleware/api-error-middleware.ts
/**
 * Middleware para manejo centralizado de errores en APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, ErrorType, apiErrorHandler } from '@/lib/error-handler';
import { ZodError } from 'zod';

export type ApiHandler = (request: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * Wrapper para APIs que maneja errores automáticamente
 */
export function withApiErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      // Manejo específico para diferentes tipos de errores
      if (error instanceof ZodError) {
        const validationError = new AppError(
          `Validation failed: ${error.errors[0].message}`,
          ErrorType.VALIDATION,
          400,
          true,
          {
            action: request.url,
            metadata: { zodErrors: error.errors }
          }
        );
        return apiErrorHandler(validationError, request);
      }

      if (error instanceof AppError) {
        return apiErrorHandler(error, request);
      }

      // Error desconocido - convertir a AppError
      const systemError = new AppError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        ErrorType.SYSTEM,
        500,
        false,
        {
          action: request.url,
          userAgent: request.headers.get('user-agent') || undefined,
          ip: request.ip || request.headers.get('x-forwarded-for') || undefined
        }
      );

      return apiErrorHandler(systemError, request);
    }
  };
}

/**
 * Middleware para validar business access en APIs
 */
export function withBusinessValidation(handler: ApiHandler): ApiHandler {
  return withApiErrorHandling(async (request: NextRequest, ...args: any[]) => {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      throw new AppError(
        'Business ID is required',
        ErrorType.BUSINESS_LOGIC,
        400,
        true,
        { action: 'business_validation' }
      );
    }

    // Validar que el business existe y está activo
    const { prisma } = await import('@/lib/prisma');
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        isActive: true
      }
    });

    if (!business) {
      throw new AppError(
        `Business not found or inactive: ${businessId}`,
        ErrorType.BUSINESS_LOGIC,
        404,
        true,
        { businessId }
      );
    }

    // Agregar business al request para uso posterior
    (request as any).business = business;

    return handler(request, ...args);
  });
}

/**
 * Middleware para rate limiting
 */
export function withRateLimit(
  requests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
) {
  // TODO: Implementar rate limiting real con Redis
  console.log(`Rate limit configurado: ${requests} requests per ${windowMs}ms`);
  return function(handler: ApiHandler): ApiHandler {
    return withApiErrorHandling(async (request: NextRequest, ...args: any[]) => {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      
      // Implementar rate limiting aquí
      // Por ahora, solo log para desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚦 Rate limit check for IP: ${ip}`);
      }

      return handler(request, ...args);
    });
  };
}

/**
 * Helper para extraer business ID del request
 */
function getBusinessIdFromRequest(request: NextRequest): string | null {
  // Método 1: Header
  const headerBusinessId = request.headers.get('x-business-id');
  if (headerBusinessId) return headerBusinessId;

  // Método 2: Query parameter
  const url = new URL(request.url);
  const queryBusinessId = url.searchParams.get('businessId');
  if (queryBusinessId) return queryBusinessId;

  // Método 3: Path parameter (para rutas como /api/businesses/[businessId]/...)
  const pathMatch = request.url.match(/\/api\/businesses\/([^\/]+)/);
  if (pathMatch) return pathMatch[1];

  return null;
}

/**
 * Composición de middlewares comunes
 */
export const withStandardMiddleware = (handler: ApiHandler) =>
  withRateLimit()(
    withBusinessValidation(
      withApiErrorHandling(handler)
    )
  );

export const withBasicMiddleware = (handler: ApiHandler) =>
  withRateLimit()(
    withApiErrorHandling(handler)
  );