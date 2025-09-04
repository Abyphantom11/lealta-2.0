/**
 * Servicio centralizado para realizar peticiones HTTP
 * Reduce la duplicación de código en llamadas a API y estandariza el manejo de errores
 */

import { logger } from './';

// Tipos de método HTTP
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

// Tipos de body para peticiones
export type RequestBody = 
  | string 
  | number 
  | boolean 
  | null 
  | Array<unknown> 
  | Record<string, unknown>
  | FormData
  | Blob;

// Opciones para peticiones HTTP
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: RequestBody;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  tags?: string[];
}

// Tipos de respuesta de API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown> | string | Error | null;
  };
  status: number;
}

// Configuración por defecto
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Construye las opciones de fetch basadas en los parámetros
 */
function buildFetchOptions(options: RequestOptions): RequestInit {
  const { method = 'GET', headers = {}, body, cache, credentials, signal } = options;
  
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

  return fetchOptions;
}

/**
 * Maneja la respuesta de fetch y parsea los datos
 */
async function handleResponse(response: Response, method: string, url: string, tags?: string[]) {
  let data;
  
  try {
    data = await response.json();
  } catch (error: unknown) {
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

  return data;
}

/**
 * Construye la respuesta estandarizada
 */
function buildApiResponse<T>(response: Response, data: unknown): ApiResponse<T> {
  const result: ApiResponse<T> = {
    success: response.ok,
    status: response.status,
    data: response.ok ? data as T : undefined,
  };

  if (!response.ok) {
    result.error = {
      code: (data as any)?.error?.code || `HTTP_${response.status}`,
      message: (data as any)?.error?.message || (data as any)?.message || response.statusText,
      details: (data as any)?.error?.details || data as Record<string, unknown> | string | Error | null,
    };
  }

  return result;
}

/**
 * Realiza una petición HTTP y maneja errores de forma consistente
 * @param url URL de la petición
 * @param options Opciones de la petición
 * @returns Respuesta de la API tipada
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', tags } = options;

  try {
    // Construir opciones de fetch
    const fetchOptions = buildFetchOptions(options);

    // Log de petición en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`API Request: ${method} ${url}`, {
        body: fetchOptions.body,
        tags,
      });
    }

    // Ejecutar fetch
    const response = await fetch(url, fetchOptions);
    
    // Manejar respuesta y parsear datos
    const data = await handleResponse(response, method, url, tags);
    
    // Construir respuesta estandarizada
    const result = buildApiResponse<T>(response, data);

    // Log de errores
    if (!response.ok && result.error) {
      logger.error(`API Error: ${method} ${url}`, {
        status: response.status,
        error: result.error,
        tags,
      });
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails = error instanceof Error ? error : { message: String(error) };

    logger.error(`Network Error: ${method} ${url}`, {
      error: errorMessage,
      tags,
    });

    return {
      success: false,
      status: 0,
      error: {
        code: 'NETWORK_ERROR',
        message: errorMessage || 'Error de conexión',
        details: errorDetails,
      },
    };
  }
}

/**
 * Atajos para métodos HTTP comunes
 */

export function get<T = unknown>(
  url: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'GET' });
}

export function post<T = unknown>(
  url: string,
  body?: RequestBody,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'POST', body });
}

export function put<T = unknown>(
  url: string,
  body?: RequestBody,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'PUT', body });
}

export function del<T = unknown>(
  url: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'DELETE' });
}

export function patch<T = unknown>(
  url: string,
  body?: RequestBody,
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
