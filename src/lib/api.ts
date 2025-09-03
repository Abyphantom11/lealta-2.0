import { ApiResponse } from '@/types/common';

/**
 * Función de utilidad para realizar peticiones a la API con tipado
 * @param url - URL del endpoint de la API
 * @param options - Opciones de fetch
 * @returns Respuesta de la API tipada
 */
export async function fetchAPI<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    // Aseguramos que la respuesta siga el formato ApiResponse
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Error desconocido',
      };
    }

    return {
      success: true,
      data: data as T,
      message: data.message,
    };
  } catch (error) {
    console.error('Error en fetchAPI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

/**
 * Realiza una petición GET a la API
 * @param url - URL del endpoint
 * @returns Respuesta de la API tipada
 */
export function get<T>(url: string): Promise<ApiResponse<T>> {
  return fetchAPI<T>(url);
}

/**
 * Realiza una petición POST a la API
 * @param url - URL del endpoint
 * @param body - Cuerpo de la petición
 * @returns Respuesta de la API tipada
 */
export function post<T>(url: string, body: any): Promise<ApiResponse<T>> {
  return fetchAPI<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Realiza una petición PUT a la API
 * @param url - URL del endpoint
 * @param body - Cuerpo de la petición
 * @returns Respuesta de la API tipada
 */
export function put<T>(url: string, body: any): Promise<ApiResponse<T>> {
  return fetchAPI<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Realiza una petición DELETE a la API
 * @param url - URL del endpoint
 * @returns Respuesta de la API tipada
 */
export function del<T>(url: string): Promise<ApiResponse<T>> {
  return fetchAPI<T>(url, {
    method: 'DELETE',
  });
}
