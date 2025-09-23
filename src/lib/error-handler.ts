// src/lib/error-handler.ts
/**
 * Sistema centralizado de manejo de errores
 * Integrado con Sentry para producción y logging local para desarrollo
 */

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK'
}

export interface ErrorContext {
  userId?: string;
  businessId?: string;
  action?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  ip?: string;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;

  constructor(
    message: string,
    type: ErrorType = ErrorType.SYSTEM,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Mantener stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Maneja errores de forma centralizada
 */
export function handleError(error: Error | AppError, context?: ErrorContext): void {
  const isAppError = error instanceof AppError;
  const errorType = isAppError ? error.type : ErrorType.SYSTEM;
  const statusCode = isAppError ? error.statusCode : 500;
  const errorContext = isAppError ? { ...error.context, ...context } : context;

  // Log en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error(`🚨 [${errorType}] ${error.message}`, {
      statusCode,
      context: errorContext,
      stack: error.stack
    });
  }

  // Enviar a Sentry en producción
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', errorType);
      scope.setLevel('error');
      
      if (errorContext) {
        scope.setContext('errorContext', errorContext as Record<string, any>);
        if (errorContext.userId) scope.setUser({ id: errorContext.userId });
        if (errorContext.businessId) scope.setTag('businessId', errorContext.businessId);
      }

      Sentry.captureException(error);
    });
  }
}

/**
 * Wrapper para funciones async que pueden fallar
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: ErrorContext,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error as Error, context);
    return fallback;
  }
}

/**
 * Wrapper para APIs de Next.js
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Convertir errores desconocidos en AppError
      throw new AppError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        ErrorType.SYSTEM,
        500,
        false
      );
    }
  };
}

/**
 * Errores predefinidos comunes
 */
export const CommonErrors = {
  BUSINESS_NOT_FOUND: (businessId: string) => 
    new AppError(
      `Business not found: ${businessId}`,
      ErrorType.BUSINESS_LOGIC,
      404
    ),
    
  UNAUTHORIZED: (action?: string) =>
    new AppError(
      `Unauthorized access${action ? ` to ${action}` : ''}`,
      ErrorType.AUTHORIZATION,
      401
    ),
    
  VALIDATION_FAILED: (field: string, value?: any) =>
    new AppError(
      `Validation failed for field: ${field}${value ? ` (value: ${value})` : ''}`,
      ErrorType.VALIDATION,
      400
    ),
    
  DATABASE_ERROR: (operation: string) =>
    new AppError(
      `Database operation failed: ${operation}`,
      ErrorType.DATABASE,
      500
    ),
    
  EXTERNAL_API_ERROR: (service: string, status?: number) =>
    new AppError(
      `External API error: ${service}${status ? ` (status: ${status})` : ''}`,
      ErrorType.EXTERNAL_API,
      502
    )
};

/**
 * Middleware para APIs de Next.js
 */
export function apiErrorHandler(error: Error, req?: any): NextResponse {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const message = isAppError ? error.message : 'Internal server error';
  
  // Log del error
  handleError(error, {
    action: req?.url,
    userAgent: req?.headers?.['user-agent'],
    ip: req?.ip || req?.connection?.remoteAddress
  });

  // Respuesta para el cliente
  return NextResponse.json(
    {
      error: true,
      message: process.env.NODE_ENV === 'production' && !isAppError 
        ? 'Internal server error' 
        : message,
      type: isAppError ? error.type : ErrorType.SYSTEM,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    { status: statusCode }
  );
}