/**
 * Servicio centralizado para realizar peticiones HTTP
 * Reduce la duplicación de código en llamadas a API y estandariza el manejo de errores
 */

import { logger } from './';

// Tipos de método HTTP
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

// Opciones para peticiones HTTP
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  tags?: string[];
}

// Tipos de respuesta de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  status: number;
}

// Configuración por defecto
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Realiza una petición HTTP y maneja errores de forma consistente
 * @param url URL de la petición
 * @param options Opciones de la petición
 * @returns Respuesta de la API tipada
 */
export async function apiRequest<T = any>(
  url: string,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    cache,
    credentials,
    signal,
    tags,
  } = options || {};

  // Crear opciones de fetch
  const fetchOptions: RequestInit = {
    method,
    headers: { ...DEFAULT_HEADERS, ...headers },
    cache,
    credentials,
    signal,
  };

  // Añadir body para métodos que lo requieren
  if (body && !(method === 'GET' || method === 'HEAD')) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    // Registrar información de la petición en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`API Request: ${method} ${url}`, {
        body: fetchOptions.body,
        tags,
      });
    }

    // Ejecutar fetch
    const response = await fetch(url, fetchOptions);
    let data;

    try {
      // Intentar parsear como JSON
      data = await response.json();
    } catch (error: unknown) {
      // Si no es JSON, usar el texto como respuesta
      data = await response.text();
      logger.debug('La respuesta no es JSON válido, usando texto plano', {
        url,
        method,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Registrar respuesta en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`API Response: ${method} ${url}`, {
        status: response.status,
        data,
        tags,
      });
    }

    // Construir respuesta estandarizada
    const result: ApiResponse<T> = {
      success: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
    };

    // Añadir información de error si no es exitosa
    if (!response.ok) {
      result.error = {
        code: data?.error?.code || `HTTP_${response.status}`,
        message: data?.error?.message || data?.message || response.statusText,
        details: data?.error?.details || data,
      };

      // Registrar errores
      logger.error(`API Error: ${method} ${url}`, {
        status: response.status,
        error: result.error,
        tags,
      });
    }

    return result;
  } catch (error: any) {
    // Manejar errores de red
    logger.error(`Network Error: ${method} ${url}`, {
      error: error.message,
      tags,
    });

    return {
      success: false,
      status: 0,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Error de conexión',
        details: error,
      },
    };
  }
}

/**
 * Atajos para métodos HTTP comunes
 */

export function get<T = any>(
  url: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'GET' });
}

export function post<T = any>(
  url: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'POST', body });
}

export function put<T = any>(
  url: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'PUT', body });
}

export function del<T = any>(
  url: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'DELETE' });
}

export function patch<T = any>(
  url: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'PATCH', body });
}

// Exportar todas las funciones juntas
export const apiService = {
  request: apiRequest,
  get,
  post,
  put,
  delete: del,
  patch,
};

export default apiService;
