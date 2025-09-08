/**
 * Cliente HTTP robusto con timeout, retry y error handling
 * Reemplaza fetch nativo para calls más confiables en producción
 */

export interface FetchConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  abortController?: AbortController;
  headers?: Record<string, string>;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class RobustHttpClient {
  private defaultTimeout = 10000; // 10 segundos
  private defaultRetries = 2;
  private defaultRetryDelay = 1000; // 1 segundo
  
  /**
   * Fetch robusto con timeout, retry y mejor error handling
   */
  async fetch(
    url: string, 
    options: RequestInit & FetchConfig = {}
  ): Promise<Response> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      abortController,
      ...fetchOptions
    } = options;
    
    // Crear AbortController si no se proporciona
    const controller = abortController || new AbortController();
    
    // Configurar timeout
    let timeoutId: NodeJS.Timeout | null = null;
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
    }
    
    let lastError: Error | null = null;
    
    // Intentar request con retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
        
        // Limpiar timeout si el request fue exitoso
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Si no es exitoso pero tampoco es un error de red, retornar respuesta
        // (dejamos que el código que llama maneje los errores HTTP)
        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        // Si es el último intento o es un error de abort, lanzar el error
        if (attempt === retries || lastError.name === 'AbortError') {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          throw this.createApiError(lastError, url);
        }
        
        // Esperar antes del siguiente intento (excepto en el último)
        if (attempt < retries) {
          await this.delay(retryDelay * (attempt + 1)); // Backoff exponencial
        }
      }
    }
    
    // Esto no debería ejecutarse, pero por seguridad
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    throw this.createApiError(lastError || new Error('Unknown error'), url);
  }
  
  /**
   * GET con handling robusto
   */
  async get(url: string, config?: FetchConfig): Promise<Response> {
    return this.fetch(url, { ...config, method: 'GET' });
  }
  
  /**
   * POST con handling robusto
   */
  async post(url: string, data?: any, config?: FetchConfig): Promise<Response> {
    return this.fetch(url, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * PUT con handling robusto
   */
  async put(url: string, data?: any, config?: FetchConfig): Promise<Response> {
    return this.fetch(url, {
      ...config,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * DELETE con handling robusto
   */
  async delete(url: string, config?: FetchConfig): Promise<Response> {
    return this.fetch(url, { ...config, method: 'DELETE' });
  }
  
  /**
   * Delay helper para retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Crear error de API más descriptivo
   */
  private createApiError(error: Error, url: string): ApiError {
    if (error.name === 'AbortError') {
      return {
        message: `Request timeout: ${url}`,
        code: 'TIMEOUT',
      };
    }
    
    if (error.message.includes('Failed to fetch')) {
      return {
        message: `Network error: ${url}`,
        code: 'NETWORK_ERROR',
      };
    }
    
    return {
      message: error.message || 'Unknown API error',
      code: 'API_ERROR',
    };
  }
}

// Instancia singleton
const httpClient = new RobustHttpClient();

// Exportar métodos convenientes
export const robustFetch = (url: string, options?: RequestInit & FetchConfig) => 
  httpClient.fetch(url, options);

export const robustGet = (url: string, config?: FetchConfig) => 
  httpClient.get(url, config);

export const robustPost = (url: string, data?: any, config?: FetchConfig) => 
  httpClient.post(url, data, config);

export const robustPut = (url: string, data?: any, config?: FetchConfig) => 
  httpClient.put(url, data, config);

export const robustDelete = (url: string, config?: FetchConfig) => 
  httpClient.delete(url, config);

export default httpClient;
