'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * 🚀 QueryClient Provider para optimización de edge requests
 * 
 * Configuración optimizada para Lealta 2.0:
 * - Cache inteligente (5min fresh, 10min stale)
 * - Sin refetch en window focus (reduce requests innecesarios)
 * - Retry strategy optimizada
 * - DevTools solo en desarrollo
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // 🎯 OPTIMIZACIÓN PRINCIPAL: Cache Strategy
          staleTime: 5 * 60 * 1000,        // 5 min - datos considerados fresh
          gcTime: 10 * 60 * 1000,          // 10 min - datos mantenidos en cache (antes cacheTime)
          
          // 🔥 REDUCIR EDGE REQUESTS: Comportamiento automático
          refetchOnWindowFocus: false,      // No refetch al volver a la ventana
          refetchOnMount: true,             // Solo refetch al montar componente
          refetchOnReconnect: true,         // Refetch cuando se reconnecta internet
          
          // 🎛️ RETRY STRATEGY: Optimizado para edge functions
          retry: (failureCount, error: any) => {
            // No retry para errores 4xx (cliente)
            if (error?.status >= 400 && error?.status < 500) {
              return false;
            }
            // Máximo 2 reintentos para errores 5xx
            return failureCount < 2;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          
          // 📊 NETWORKING: Timeouts optimizados
          networkMode: 'online', // Solo ejecutar cuando hay conexión
        },
        mutations: {
          // 🔄 MUTATIONS: Configuración para operaciones de escritura
          retry: 1,
          networkMode: 'online',
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 🛠️ DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}

// 🎯 Query Keys centralizadas para mejor cache management
export const reservasQueryKeys = {
  all: ['reservas'] as const,
  lists: () => [...reservasQueryKeys.all, 'list'] as const,
  list: (businessId: string, filters?: any) => 
    [...reservasQueryKeys.lists(), { businessId, filters }] as const,
  details: () => [...reservasQueryKeys.all, 'detail'] as const,
  detail: (id: string, businessId: string) => 
    [...reservasQueryKeys.details(), { id, businessId }] as const,
  stats: (businessId: string) => 
    [...reservasQueryKeys.all, 'stats', { businessId }] as const,
  updates: (businessId: string, since: string) => 
    [...reservasQueryKeys.all, 'updates', { businessId, since }] as const,
};

// 🔧 Helper para invalidar cache específico
export const invalidateReservas = (queryClient: QueryClient, businessId: string) => {
  queryClient.invalidateQueries({ queryKey: reservasQueryKeys.list(businessId) });
  queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId) });
};
