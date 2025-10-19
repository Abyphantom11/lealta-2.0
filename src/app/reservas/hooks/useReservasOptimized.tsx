'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Reserva } from '../types/reservation';
import { reservasQueryKeys } from '../../../providers/QueryProvider';
import { useRealtimeSync } from './useRealtimeSync';
import { REALTIME_CONFIG } from '../utils/realtime-config';

// Type alias para reserva sin campos generados
type NewReservaData = Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>;

// 🚀 OPTIMIZED API CLIENT
const reservasAPI = {
  // 🔥 Query combinada: Reservas + Stats + Clients en una sola request
  fetchReservasWithStats: async (businessId: string) => {
    const url = businessId 
      ? `/api/reservas?businessId=${businessId}&include=stats,clients`
      : `/api/reservas?include=stats,clients`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error fetching reservas with stats');
    }
    return response.json();
  },

  // 🎯 Request individual para casos específicos
  fetchReservas: async (businessId?: string) => {
    const url = businessId ? `/api/reservas?businessId=${businessId}` : '/api/reservas';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error fetching reservas');
    }
    return response.json();
  },

  createReserva: async (reservaData: NewReservaData, businessId?: string) => {
    // 🐛 DEBUG: Validar businessId antes de construir URL
    if (!businessId) {
      console.error('🚨 CRITICAL: createReserva llamado sin businessId!');
      throw new Error('BusinessId es requerido para crear reservas. Verifica tu sesión.');
    }
    
    // Construir la URL con el businessId como query parameter
    const url = `/api/reservas?businessId=${businessId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservaData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error creating reserva:', response.status, errorData);
      throw new Error(`Error creating reserva: ${response.status} - ${errorData}`);
    }
    
    return response.json();
  },

  updateReserva: async (id: string, reservaData: Partial<Reserva>, businessId?: string) => {
    // 🐛 DEBUG: Validar businessId antes de construir URL
    if (!businessId) {
      console.error('🚨 CRITICAL: updateReserva llamado sin businessId!');
      console.error('📋 Datos de la reserva:', reservaData);
      console.error('🆔 ID de la reserva:', id);
      throw new Error('BusinessId es requerido para actualizar reservas. Verifica tu sesión.');
    }
    
    // ✅ Incluir businessId como query parameter
    const url = `/api/reservas/${id}?businessId=${businessId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservaData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error updating reserva:', response.status, errorData);
      throw new Error(`Error updating reserva: ${errorData.error || response.statusText}`);
    }
    
    return response.json();
  },

  deleteReserva: async (id: string, businessId?: string) => {
    // 🐛 DEBUG: Validar businessId antes de construir URL
    if (!businessId) {
      console.error('🚨 CRITICAL: deleteReserva llamado sin businessId!');
      throw new Error('BusinessId es requerido para eliminar reservas. Verifica tu sesión.');
    }
    
    // ✅ Incluir businessId como query parameter
    const url = `/api/reservas/${id}?businessId=${businessId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error deleting reserva:', response.status, errorData);
      throw new Error(`Error deleting reserva: ${errorData.error || response.statusText}`);
    }
    
    return response.json();
  },

  // 📊 Endpoint para solo estadísticas (caché separado)
  fetchStats: async (businessId?: string) => {
    const url = businessId ? `/api/reservas/stats?businessId=${businessId}` : '/api/reservas/stats';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error fetching stats');
    }
    return response.json();
  },

  // 🔄 Verificar actualizaciones (para polling inteligente)
  checkUpdates: async (businessId: string, lastUpdate: string) => {
    const response = await fetch(`/api/reservas/updates?businessId=${businessId}&since=${lastUpdate}`);
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

  // 🔥 REAL-TIME: Integrar SSE para actualizaciones en tiempo real
  const { 
    isConnected: isSSEConnected,
    isRealtimeEnabled,
    status: realtimeStatus 
  } = useRealtimeSync({
    businessId: businessId ? Number.parseInt(businessId) : 0,
    enabled: enabled && REALTIME_CONFIG.sse.enabled,
    showToasts: true,
    autoUpdateCache: true
  });

  // 🔥 OPTIMIZACIÓN: Query combinada (reservas + stats en una sola request)
  const combinedQuery = useQuery({
    queryKey: reservasQueryKeys.list(businessId || 'default', { includeStats: true }),
    queryFn: () => {
      return reservasAPI.fetchReservasWithStats(businessId || '');
    },
    enabled: enabled && includeStats,
    staleTime: 60000, // 1 minuto - datos considerados fresh
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    refetchOnWindowFocus: true,
    refetchOnMount: false, // ❌ NO refetch al montar - usar caché
    // 🔥 POLLING ADAPTIVO: Solo si SSE no está activo
    refetchInterval: isRealtimeEnabled ? false : REALTIME_CONFIG.polling.interval,
  });

  // 🎯 Query simple solo para reservas (cuando no necesitamos stats)
  const reservasQuery = useQuery({
    queryKey: reservasQueryKeys.list(businessId || 'default', { includeStats: false }),
    queryFn: () => {
      return reservasAPI.fetchReservas(businessId);
    },
    enabled: enabled && !includeStats,
    staleTime: 60000, // 1 minuto - datos considerados fresh
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    refetchOnWindowFocus: true,
    refetchOnMount: false, // ❌ NO refetch al montar - usar caché
    // 🔥 POLLING ADAPTIVO: Solo si SSE no está activo
    refetchInterval: isRealtimeEnabled ? false : REALTIME_CONFIG.polling.interval,
  });

  // Seleccionar la query activa
  const activeQuery = includeStats ? combinedQuery : reservasQuery;

  // 🔄 MUTATIONS CON OPTIMISTIC UPDATES
  const createMutation = useMutation({
    mutationFn: (reservaData: NewReservaData) =>
      reservasAPI.createReserva(reservaData, businessId),
    onSuccess: () => {
      // 🎯 Invalidar TODAS las listas de reservas (con y sin stats)
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId || 'default') });
      
      toast.success('✓ Reserva creada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating reserva:', error);
      toast.error('❌ Error al crear la reserva');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, businessId: mutationBusinessId }: { id: string; data: Partial<Reserva>; businessId?: string }) =>
      reservasAPI.updateReserva(id, data, mutationBusinessId || businessId),
    onSuccess: async (_result, { data }) => {
      // 🎯 Campos que requieren invalidación completa
      const fieldsRequiringFullRefresh = new Set(['fecha', 'hora', 'estado']);
      const isFieldRequiringRefresh = data && Object.keys(data).some(key => fieldsRequiringFullRefresh.has(key));
      
      // 🎯 Para cambios de fecha, SIEMPRE invalidar y refetch
      const isDateChange = data && 'fecha' in data;
      
      if (isDateChange) {
        console.log('📅 CAMBIO DE FECHA DETECTADO - Invalidación agresiva');
        console.log('💾 BusinessId usado:', businessId || 'default');
        
        // Invalidar inmediatamente todas las queries relacionadas
        await Promise.all([
          queryClient.invalidateQueries({ 
            queryKey: reservasQueryKeys.all,
            refetchType: 'all' 
          }),
          queryClient.invalidateQueries({ 
            queryKey: reservasQueryKeys.lists(),
            refetchType: 'all' 
          }),
          queryClient.invalidateQueries({ 
            queryKey: reservasQueryKeys.stats(businessId || 'default'),
            refetchType: 'all' 
          })
        ]);
        
        console.log('✅ Invalidación agresiva completada para cambio de fecha');
      } else if (!data || Object.keys(data).length > 1 || isFieldRequiringRefresh) {
        console.log('🔄 Invalidación estándar para:', Object.keys(data || {}));
        
        await queryClient.invalidateQueries({ 
          queryKey: reservasQueryKeys.lists(),
          refetchType: 'active' 
        });
        await queryClient.invalidateQueries({ 
          queryKey: reservasQueryKeys.stats(businessId || 'default'),
          refetchType: 'active' 
        });
      } else {
        console.log('⚡ Actualización optimista - Sin invalidación inmediata');
      }
      
      toast.success('✓ Reserva actualizada exitosamente');
    },
    onError: (error) => {
      console.error('Error updating reserva:', error);
      toast.error('❌ Error al actualizar la reserva');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reservasAPI.deleteReserva(id, businessId),
    onSuccess: async () => {
      console.log('🗑️ Reserva eliminada - Invalidando cache completo...');
      
      // 🔥 INVALIDACIÓN AGRESIVA: Forzar refetch inmediato
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: reservasQueryKeys.lists(),
          refetchType: 'all' // Refetch todas las queries, no solo las activas
        }),
        queryClient.invalidateQueries({ 
          queryKey: reservasQueryKeys.stats(businessId || 'default'),
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: reservasQueryKeys.all,
          refetchType: 'all'
        })
      ]);
      
      console.log('✅ Cache invalidado completamente después de eliminar reserva');
      
      toast.success('✓ Reserva eliminada exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting reserva:', error);
      toast.error('❌ Error al eliminar la reserva');
    },
  });

  // 📊 DATOS OPTIMIZADOS
  // 🔥 CRÍTICO: Usar useMemo para crear nueva referencia del array cuando cambien los datos
  // Esto fuerza a React a detectar el cambio y re-renderizar los componentes
  const reservas = useMemo(() => {
    const data = includeStats 
      ? (combinedQuery.data?.reservas || [])
      : (reservasQuery.data || []);
    
    console.log('🔄 Hook: Creando nueva referencia de reservas array', {
      count: data.length,
      dataUpdatedAt: includeStats ? combinedQuery.dataUpdatedAt : reservasQuery.dataUpdatedAt
    });
    
    // Crear nuevo array para garantizar nueva referencia en memoria
    return [...data];
  }, [
    includeStats,
    combinedQuery.data?.reservas,
    combinedQuery.dataUpdatedAt,
    reservasQuery.data,
    reservasQuery.dataUpdatedAt
  ]);
  
  const stats = includeStats ? combinedQuery.data?.stats : undefined;
  const clients = includeStats ? combinedQuery.data?.clients : undefined;

  // 🔄 MÉTODOS DE ACCIÓN
  const createReserva = (reservaData: NewReservaData) => {
    return createMutation.mutateAsync(reservaData);
  };

  const updateReserva = (id: string, data: Partial<Reserva>) => {
    return updateMutation.mutateAsync({ id, data, businessId });
  };

  const deleteReserva = (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const refetchReservas = async () => {
    // 🔥 REFETCH DIRECTO - No depender de invalidación
    console.log('🔄 refetchReservas: Ejecutando refetch directo...');
    
    try {
      const result = includeStats 
        ? await combinedQuery.refetch()
        : await reservasQuery.refetch();
      
      console.log('✅ Refetch completado:', {
        success: result.isSuccess,
        dataLength: result.data?.reservas?.length || result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error en refetch:', error);
      throw error;
    }
  };

  // 🎯 OPTIMISTIC UPDATE: Actualizar cache local inmediatamente
  const updateReservaAsistencia = (reservaId: string, nuevaAsistencia: number) => {
    console.log('🎯 updateReservaAsistencia - Inicio:', { 
      reservaId, 
      nuevaAsistencia 
    });
    
    // Actualizar cache de query CON stats (combinedQuery)
    const queryKeyWithStats = reservasQueryKeys.list(businessId || 'default', { includeStats: true });
    queryClient.setQueryData(queryKeyWithStats, (oldData: any) => {
      if (!oldData?.reservas) return oldData;
      
      const updated = {
        ...oldData,
        reservas: oldData.reservas.map((reserva: any) => 
          reserva.id === reservaId 
            ? { ...reserva, asistenciaActual: nuevaAsistencia }
            : reserva
        )
      };
      console.log('✅ Cache actualizado (con stats)');
      return updated;
    });
    
    // Actualizar cache de query SIN stats (reservasQuery)
    const queryKeyWithoutStats = reservasQueryKeys.list(businessId || 'default', { includeStats: false });
    queryClient.setQueryData(queryKeyWithoutStats, (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData;
      
      const updated = oldData.map((reserva: any) => 
        reserva.id === reservaId 
          ? { ...reserva, asistenciaActual: nuevaAsistencia }
          : reserva
      );
      console.log('✅ Cache actualizado (sin stats)');
      return updated;
    });
    
    console.log('✅ updateReservaAsistencia - Completado para ambas cachés');
  };

  // 🎯 OPTIMISTIC UPDATE: Actualizar cualquier campo en el cache local inmediatamente
  const updateReservaOptimized = async (reservaId: string, updates: Partial<Reserva>) => {
    const queryKey = reservasQueryKeys.list(businessId || 'default');
    
    console.log('🚀 updateReservaOptimized - Inicio:', { reservaId, updates });
    
    // Guardar el estado anterior para posible rollback
    const previousData = queryClient.getQueryData(queryKey);
    
    // 1️⃣ Actualización optimista del cache
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      
      // Si es query combinada
      if (oldData.reservas) {
        const updatedReservas = oldData.reservas.map((reserva: any) => 
          reserva.id === reservaId 
            ? { ...reserva, ...updates }
            : reserva
        );
        console.log('✅ Cache actualizado (combined):', updatedReservas.find((r: any) => r.id === reservaId));
        return {
          ...oldData,
          reservas: updatedReservas
        };
      }
      
      // Si es query simple de reservas
      if (Array.isArray(oldData)) {
        const updatedReservas = oldData.map((reserva: any) => 
          reserva.id === reservaId 
            ? { ...reserva, ...updates }
            : reserva
        );
        console.log('✅ Cache actualizado (simple):', updatedReservas.find((r: any) => r.id === reservaId));
        return updatedReservas;
      }
      
      return oldData;
    });

    // 2️⃣ Ejecutar la actualización en el servidor
    try {
      const result = await updateMutation.mutateAsync({ id: reservaId, data: updates, businessId });
      console.log('✅ Servidor respondió con reserva actualizada:', result.reserva || result);
      
      // 3️⃣ Actualizar el cache con la respuesta real del servidor
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        const serverReserva = result.reserva || result;
        
        if (oldData.reservas) {
          return {
            ...oldData,
            reservas: oldData.reservas.map((reserva: any) => 
              reserva.id === reservaId ? { ...reserva, ...serverReserva } : reserva
            )
          };
        }
        
        if (Array.isArray(oldData)) {
          return oldData.map((reserva: any) => 
            reserva.id === reservaId ? { ...reserva, ...serverReserva } : reserva
          );
        }
        
        return oldData;
      });
      
      return result;
    } catch (error) {
      // Si falla, revertir al estado anterior
      console.error('❌ Error en actualización optimista, revirtiendo...', error);
      queryClient.setQueryData(queryKey, previousData);
      toast.error('Error al actualizar');
      throw error;
    }
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
    updateReservaAsistencia, // ✅ Función optimistic para asistencia
    updateReservaOptimized, // ✅ Función optimistic para cualquier campo
    
    // 🔄 Estados de mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // 📈 Métricas de optimización
    lastUpdated: activeQuery.dataUpdatedAt,
    queryCount: queryClient.getQueryCache().getAll().length,
    
    // 🔥 NUEVO: Estados de Real-Time
    isRealtimeEnabled,
    isSSEConnected,
    realtimeStatus,
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
