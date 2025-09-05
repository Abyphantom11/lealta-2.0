'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { ApiResponse } from '@/types/common';

// Tipo para datos de request
type RequestData = Record<string, unknown> | string | FormData | null | undefined;

interface ApiContextType {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  apiRequest: <T>(
    endpoint: string,
    method?: string,
    data?: RequestData,
    options?: RequestInit
  ) => Promise<ApiResponse<T>>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  readonly children: React.ReactNode;
  readonly baseUrl?: string;
}

/**
 * Proveedor global para centralizar peticiones a la API
 * Gestiona estados de carga y errores de manera consistente
 */
export function ApiProvider({ children, baseUrl = '' }: ApiProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const apiRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: string = 'GET',
      data?: RequestData,
      options: RequestInit = {}
    ): Promise<ApiResponse<T>> => {
      setIsLoading(true);
      clearError();

      const url = endpoint.startsWith('http')
        ? endpoint
        : `${baseUrl}${endpoint}`;

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          ...options,
        });

        const responseData = await response.json();

        if (!response.ok) {
          const errorMessage =
            responseData.error ||
            responseData.message ||
            `Error ${response.status}: ${response.statusText}`;
          setError(errorMessage);

          return {
            success: false,
            error: errorMessage,
          };
        }

        return {
          success: true,
          data: responseData as T,
          message: responseData.message,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error de conexión';
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, clearError]
  );

  const value = useMemo(
    () => ({
      isLoading,
      error,
      clearError,
      apiRequest,
    }),
    [isLoading, error, clearError, apiRequest]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

/**
 * Hook para usar el contexto de API
 * @returns Funciones y estados para interactuar con la API
 */
export function useApi() {
  const context = useContext(ApiContext);

  if (context === undefined) {
    throw new Error('useApi debe ser usado dentro de un ApiProvider');
  }

  return context;
}

// Helpers para métodos HTTP comunes
export function useGet() {
  const { apiRequest, isLoading, error, clearError } = useApi();

  const get = useCallback(
    <T,>(endpoint: string, options?: RequestInit) => {
      return apiRequest<T>(endpoint, 'GET', undefined, options);
    },
    [apiRequest]
  );

  return { get, isLoading, error, clearError };
}

export function usePost() {
  const { apiRequest, isLoading, error, clearError } = useApi();

  const post = useCallback(
    <T,>(endpoint: string, data: RequestData, options?: RequestInit) => {
      return apiRequest<T>(endpoint, 'POST', data, options);
    },
    [apiRequest]
  );

  return { post, isLoading, error, clearError };
}

export function usePut() {
  const { apiRequest, isLoading, error, clearError } = useApi();

  const put = useCallback(
    <T,>(endpoint: string, data: RequestData, options?: RequestInit) => {
      return apiRequest<T>(endpoint, 'PUT', data, options);
    },
    [apiRequest]
  );

  return { put, isLoading, error, clearError };
}

export function useDelete() {
  const { apiRequest, isLoading, error, clearError } = useApi();

  const del = useCallback(
    <T,>(endpoint: string, options?: RequestInit) => {
      return apiRequest<T>(endpoint, 'DELETE', undefined, options);
    },
    [apiRequest]
  );

  return { del, isLoading, error, clearError };
}
