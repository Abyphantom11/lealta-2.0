'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Reserva } from '../types/reservation';
import { reservasQueryKeys } from '../../../providers/QueryProvider';

// 🚀 OPTIMIZED API CLIENT
const reservasAPI = {
  // 🔥 Query combinada: Reservas + Stats + Clients en una sola request
  fetchReservasWithStats: async (businessId: string) => {
    const url = businessId 
      ? `/api/reservas?business_id=${businessId}&include=stats,clients`
      : `/api/reservas?include=stats,clients`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error fetching reservas with stats');
    }
    return response.json();
  },

  // 🎯 Request individual para casos específicos
  fetchReservas: async (businessId?: string) => {
    const url = businessId ? `/api/reservas?business_id=${businessId}` : '/api/reservas';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error fetching reservas');
    }
    return response.json();
  },

  createReserva: async (reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>, businessId?: string) => {
    const response = await fetch('/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...reservaData, business_id: businessId }),
    });
    
    if (!response.ok) {
      throw new Error('Error creating reserva');
    }
    
    return response.json();
  },

  updateReserva: async (id: string, reservaData: Partial<Reserva>) => {
    const response = await fetch(`/api/reservas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservaData),
    });
    
    if (!response.ok) {
      throw new Error('Error updating reserva');
    }
    
    return response.json();
  },

  deleteReserva: async (id: string) => {
    const response = await fetch(`/api/reservas/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Error deleting reserva');
    }
    
    return response.json();
  },

  // 📊 Endpoint para solo estadísticas (caché separado)
  fetchStats: async (businessId?: string) => {
    const url = businessId ? `/api/reservas/stats?business_id=${businessId}` : '/api/reservas/stats';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error fetching stats');
    }
    return response.json();
  },

  // 🔄 Verificar actualizaciones (para polling inteligente)
  checkUpdates: async (businessId: string, lastUpdate: string) => {
    const response = await fetch(`/api/reservas/updates?business_id=${businessId}&since=${lastUpdate}`);
    if (!response.ok) {
      throw new Error('Error checking updates');
    }
    return response.json();
  },
};

// 🎯 HOOK PRINCIPAL: useReservasOptimized
interface UseReservasOptimizedOptions {
  businessId?: string;
  enabled?: boolean;
  includeStats?: boolean;
}

export function useReservasOptimized({ 
  businessId, 
  enabled = true, 
  includeStats = true 
}: UseReservasOptimizedOptions = {}) {
  const queryClient = useQueryClient();

  // 🔥 OPTIMIZACIÓN: Query combinada (reservas + stats en una sola request)
  const combinedQuery = useQuery({
    queryKey: reservasQueryKeys.list(businessId || 'default'),
    queryFn: () => reservasAPI.fetchReservasWithStats(businessId || ''),
    enabled: enabled && includeStats,
    staleTime: 5 * 60 * 1000, // 5 minutos fresh
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 🎯 Query simple solo para reservas (cuando no necesitamos stats)
  const reservasQuery = useQuery({
    queryKey: reservasQueryKeys.list(businessId || 'default'),
    queryFn: () => reservasAPI.fetchReservas(businessId),
    enabled: enabled && !includeStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Seleccionar la query activa
  const activeQuery = includeStats ? combinedQuery : reservasQuery;

  // 🔄 MUTATIONS CON OPTIMISTIC UPDATES
  const createMutation = useMutation({
    mutationFn: (reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) =>
      reservasAPI.createReserva(reservaData, businessId),
    onSuccess: (newReserva) => {
      // 🎯 Invalidación selectiva (solo las queries afectadas)
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.list(businessId || 'default') });
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId || 'default') });
      
      toast.success('✓ Reserva creada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating reserva:', error);
      toast.error('❌ Error al crear la reserva');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reserva> }) =>
      reservasAPI.updateReserva(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.list(businessId || 'default') });
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId || 'default') });
      
      toast.success('✓ Reserva actualizada exitosamente');
    },
    onError: (error) => {
      console.error('Error updating reserva:', error);
      toast.error('❌ Error al actualizar la reserva');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reservasAPI.deleteReserva(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.list(businessId || 'default') });
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId || 'default') });
      
      toast.success('✓ Reserva eliminada exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting reserva:', error);
      toast.error('❌ Error al eliminar la reserva');
    },
  });

  // 📊 DATOS OPTIMIZADOS
  const reservas = includeStats 
    ? (combinedQuery.data?.reservas || [])
    : (reservasQuery.data || []);
  
  const stats = includeStats ? combinedQuery.data?.stats : undefined;
  const clients = includeStats ? combinedQuery.data?.clients : undefined;

  // 🔄 MÉTODOS DE ACCIÓN
  const createReserva = (reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) => {
    createMutation.mutate(reservaData);
  };

  const updateReserva = (id: string, data: Partial<Reserva>) => {
    updateMutation.mutate({ id, data });
  };

  const deleteReserva = (id: string) => {
    deleteMutation.mutate(id);
  };

  const refetchReservas = () => {
    queryClient.invalidateQueries({ queryKey: reservasQueryKeys.list(businessId || 'default') });
  };

  return {
    // 📊 Datos
    reservas,
    stats,
    clients,
    
    // 🔄 Estados
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    error: activeQuery.error,
    isFetching: activeQuery.isFetching,
    
    // 🎯 Acciones
    createReserva,
    updateReserva,
    deleteReserva,
    refetchReservas,
    
    // 🔄 Estados de mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // 📈 Métricas de optimización
    lastUpdated: activeQuery.dataUpdatedAt,
    queryCount: queryClient.getQueryCache().getAll().length,
  };
}

// 🔔 HOOK PARA POLLING INTELIGENTE (Opcional - solo cuando se necesite)
export function useReservasUpdates(businessId: string, enabled = true) {
  const queryClient = useQueryClient();
  
  // Timestamp de la última actualización conocida
  const lastUpdate = queryClient.getQueryState(reservasQueryKeys.list(businessId))?.dataUpdatedAt || Date.now();
  
  // Query para verificar actualizaciones (con interval)
  const updatesQuery = useQuery({
    queryKey: reservasQueryKeys.updates(businessId, new Date(lastUpdate).toISOString()),
    queryFn: () => reservasAPI.checkUpdates(businessId, new Date(lastUpdate).toISOString()),
    enabled: enabled && !!businessId,
    refetchInterval: 30000, // Cada 30 segundos (reducido de 5-10 segundos)
    refetchIntervalInBackground: false, // No polling en background
    staleTime: 25000, // 25 segundos fresh
  });
  
  // Si hay cambios, invalidar y refetch
  if (updatesQuery.data?.hasChanges) {
    queryClient.invalidateQueries({ queryKey: reservasQueryKeys.list(businessId) });
    queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId) });
  }
  
  return {
    hasUpdates: updatesQuery.data?.hasChanges || false,
    isChecking: updatesQuery.isFetching,
  };
}

// 📊 HOOK PARA SOLO ESTADÍSTICAS (Caché separado)
export function useReservasStats(businessId?: string, enabled = true) {
  return useQuery({
    queryKey: reservasQueryKeys.stats(businessId || 'default'),
    queryFn: () => reservasAPI.fetchStats(businessId),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos (stats cambian menos)
    gcTime: 30 * 60 * 1000, // 30 minutos en caché
  });
}
