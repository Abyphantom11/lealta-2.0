'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SinReserva } from '../types/sin-reserva';
import { format } from 'date-fns';

// 🔑 Query Keys para Sin Reserva
export const sinReservaQueryKeys = {
  all: ['sin-reserva'] as const,
  lists: () => [...sinReservaQueryKeys.all, 'list'] as const,
  list: (businessId: string, fecha?: string) => [...sinReservaQueryKeys.lists(), businessId, fecha] as const,
  stats: (businessId: string, mes?: string) => [...sinReservaQueryKeys.all, 'stats', businessId, mes] as const,
  updates: (businessId: string, since: string) => [...sinReservaQueryKeys.all, 'updates', businessId, since] as const,
};

// 🚀 API CLIENT para Sin Reserva
const sinReservaAPI = {
  // Obtener registros por fecha específica
  fetchByDate: async (businessId: string, fecha: string) => {
    const url = `/api/sin-reserva?businessId=${businessId}&fecha=${fecha}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) {
      throw new Error('Error fetching sin reserva by date');
    }
    return response.json();
  },

  // Obtener estadísticas mensuales
  fetchMonthlyStats: async (businessId: string, mes: string) => {
    const url = `/api/sin-reserva?businessId=${businessId}&mes=${mes}&includeStats=true`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) {
      throw new Error('Error fetching monthly stats');
    }
    return response.json();
  },

  // Crear nuevo registro
  create: async (data: Omit<SinReserva, 'id' | 'createdAt'>) => {
    const response = await fetch('/api/sin-reserva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error creating sin reserva: ${errorData}`);
    }
    return response.json();
  },

  // Eliminar registro
  delete: async (id: string) => {
    const response = await fetch(`/api/sin-reserva?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error deleting sin reserva');
    }
    return response.json();
  },
};

// 🎯 HOOK PRINCIPAL: useSinReservaByDate
interface UseSinReservaByDateOptions {
  businessId: string;
  fecha: Date;
  enabled?: boolean;
}

export function useSinReservaByDate({ 
  businessId, 
  fecha, 
  enabled = true 
}: UseSinReservaByDateOptions) {
  const queryClient = useQueryClient();
  const fechaString = format(fecha, 'yyyy-MM-dd');
  
  // Query para obtener registros de la fecha específica
  const query = useQuery({
    queryKey: sinReservaQueryKeys.list(businessId, fechaString),
    queryFn: () => sinReservaAPI.fetchByDate(businessId, fechaString),
    enabled: enabled && !!businessId,
    staleTime: 30000, // 30 segundos fresh
    gcTime: 5 * 60 * 1000, // 5 minutos en caché
  });

  // Mutation para crear nuevo registro
  const createMutation = useMutation({
    mutationFn: sinReservaAPI.create,
    onMutate: async (newRegistro) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: sinReservaQueryKeys.list(businessId, fechaString) 
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        sinReservaQueryKeys.list(businessId, fechaString)
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        sinReservaQueryKeys.list(businessId, fechaString), 
        (old: any) => {
          if (!old) return old;
          
          const tempId = `temp-${Date.now()}`;
          const optimisticRegistro = {
            ...newRegistro,
            id: tempId,
            createdAt: new Date().toISOString()
          };
          
          return {
            ...old,
            registros: [optimisticRegistro, ...old.registros],
            count: old.count + 1
          };
        }
      );

      return { previousData };
    },
    onError: (err, newRegistro, context) => {
      // Rollback
      if (context?.previousData) {
        queryClient.setQueryData(
          sinReservaQueryKeys.list(businessId, fechaString),
          context.previousData
        );
      }
      toast.error('❌ Error al crear registro');
    },
    onSuccess: (data) => {
      toast.success('✅ Registro creado exitosamente');
      // Refetch para obtener datos reales
      queryClient.invalidateQueries({ 
        queryKey: sinReservaQueryKeys.list(businessId, fechaString) 
      });
    },
  });

  // Mutation para eliminar registro
  const deleteMutation = useMutation({
    mutationFn: sinReservaAPI.delete,
    onMutate: async (idToDelete) => {
      await queryClient.cancelQueries({ 
        queryKey: sinReservaQueryKeys.list(businessId, fechaString) 
      });

      const previousData = queryClient.getQueryData(
        sinReservaQueryKeys.list(businessId, fechaString)
      );

      // Optimistic removal
      queryClient.setQueryData(
        sinReservaQueryKeys.list(businessId, fechaString), 
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            registros: old.registros.filter((r: any) => r.id !== idToDelete),
            count: old.count - 1
          };
        }
      );

      return { previousData };
    },
    onError: (err, idToDelete, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          sinReservaQueryKeys.list(businessId, fechaString),
          context.previousData
        );
      }
      toast.error('❌ Error al eliminar registro');
    },
    onSuccess: () => {
      toast.success('✅ Registro eliminado');
    },
  });

  // Refetch function
  const refetch = async () => {
    await query.refetch();
  };

  return {
    // Data
    registros: query.data?.registros || [],
    stats: query.data?.stats,
    count: query.data?.count || 0,
    
    // States
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    
    // Actions
    createRegistro: createMutation.mutate,
    deleteRegistro: deleteMutation.mutate,
    refetch,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Metadata
    lastUpdated: query.dataUpdatedAt,
    fecha: fechaString,
  };
}

// 📊 HOOK PARA ESTADÍSTICAS MENSUALES
interface UseSinReservaMonthlyStatsOptions {
  businessId: string;
  year: number;
  month: number;
  enabled?: boolean;
}

export function useSinReservaMonthlyStats({ 
  businessId, 
  year, 
  month, 
  enabled = true 
}: UseSinReservaMonthlyStatsOptions) {
  const mesString = `${year}-${month.toString().padStart(2, '0')}`;
  
  const query = useQuery({
    queryKey: sinReservaQueryKeys.stats(businessId, mesString),
    queryFn: () => sinReservaAPI.fetchMonthlyStats(businessId, mesString),
    enabled: enabled && !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutos fresh (stats cambian menos)
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
  });

  return {
    stats: query.data?.stats,
    registros: query.data?.registros || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
