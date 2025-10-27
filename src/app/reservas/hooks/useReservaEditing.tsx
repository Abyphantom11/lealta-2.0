'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Reserva } from '../types/reservation';
import { reservasQueryKeys } from '../../../providers/QueryProvider';

interface UseReservaEditingOptions {
  businessId?: string;
}

interface EditingState {
  [reservaId: string]: Partial<Reserva>;
}

/**
 * 🎯 Hook unificado para manejo de edición de reservas
 * Maneja tanto ediciones inline como modales
 * Integra directamente con React Query para estado optimista
 */
export function useReservaEditing({ businessId }: UseReservaEditingOptions = {}) {
  const queryClient = useQueryClient();
  
  // 🔄 Estado local de ediciones (reemplaza localStorage)
  const [editingState, setEditingState] = useState<EditingState>({});
  
  // 🔄 Mutation unificada para actualizaciones (optimizada para Cloudflare Tunnel)
  const updateMutation = useMutation({
    // ⚙️ Configuración optimizada para Cloudflare Tunnel
    retry: 2, // Reintentar hasta 2 veces
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Backoff exponencial
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reserva> }) => {
      const startTime = Date.now();
      const url = `/api/reservas/${id}?businessId=${businessId}`;
      
      // 🌐 Timeout más alto para Cloudflare Tunnel
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Error en respuesta del servidor:', { 
            status: response.status, 
            errorData,
            responseTime,
            url 
          });
          throw new Error(`Error updating reserva: ${errorData.error || response.statusText}`);
        }
        
        const result = await response.json();
        
        // 🎯 VALIDAR QUE LA RESPUESTA TENGA DATOS VÁLIDOS
        if (!result.success || !result.reserva) {
          console.error('❌ HOOK - Respuesta del servidor inválida:', result);
          throw new Error('El servidor no devolvió datos válidos');
        }

        return result.reserva;
        
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('❌ HOOK - Timeout en Cloudflare Tunnel (30s)');
          throw new Error('La conexión tardó demasiado (Cloudflare Tunnel)');
        }
        throw error;
      }
    },
    
    // 🎯 Optimistic Update - Actualización inmediata en UI
    onMutate: async ({ id, updates }) => {
      console.log('🚀 Optimistic update para reserva:', id, updates);
      
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: reservasQueryKeys.list(businessId || 'default') });
      
      // Snapshot del estado anterior
      const previousReservas = queryClient.getQueryData(reservasQueryKeys.list(businessId || 'default'));
      
      // Actualización optimista
      queryClient.setQueryData(reservasQueryKeys.list(businessId || 'default'), (old: any) => {
        if (!old) return old;
        
        // Si es data combinada (con stats)
        if (old.reservas) {
          return {
            ...old,
            reservas: old.reservas.map((reserva: Reserva) =>
              reserva.id === id ? { ...reserva, ...updates } : reserva
            )
          };
        }
        
        // Si es array simple
        if (Array.isArray(old)) {
          return old.map((reserva: Reserva) =>
            reserva.id === id ? { ...reserva, ...updates } : reserva
          );
        }
        
        return old;
      });
      
      // 🎯 NO limpiar estado local aquí - mantenerlo hasta onSuccess
      // setEditingState(prev => {
      //   const newState = { ...prev };
      //   delete newState[id];
      //   return newState;
      // });
      
      return { previousReservas };
    },
    
    onError: (err, variables, context) => {
      console.error('❌ Error en actualización:', err);
      
      // Revertir optimistic update
      if (context?.previousReservas) {
        queryClient.setQueryData(
          reservasQueryKeys.list(businessId || 'default'),
          context.previousReservas
        );
      }
      
      toast.error('❌ Error al actualizar la reserva');
    },
    
    onSuccess: (result, { id }) => {
      // 🚨 VERIFICAR SI EL SERVIDOR DEVOLVIÓ DATOS VÁLIDOS
      if (!result || typeof result !== 'object') {
        console.error('❌ HOOK - Respuesta del servidor inválida:', result);
        return;
      }
      
      // � FORZAR ACTUALIZACIÓN DEL CACHÉ CON DATOS FRESCOS DEL SERVIDOR
      queryClient.setQueryData(reservasQueryKeys.list(businessId || 'default'), (old: any) => {
        if (!old) return old;
        
        console.log('🔄 HOOK - Actualizando caché con datos del servidor:', {
          reservaId: id,
          horaAntes: old.reservas?.find((r: any) => r.id === id)?.hora || 'No encontrada',
          horaDespues: result.hora,
          detallesAntes: old.reservas?.find((r: any) => r.id === id)?.detalles?.length || 0,
          detallesDespues: result.detalles?.length || 0
        });
        
        // Si es data combinada (con stats)
        if (old.reservas) {
          return {
            ...old,
            reservas: old.reservas.map((reserva: Reserva) =>
              reserva.id === id ? { ...reserva, ...result } : reserva
            )
          };
        }
        
        // Si es array simple
        if (Array.isArray(old)) {
          return old.map((reserva: Reserva) =>
            reserva.id === id ? { ...reserva, ...result } : reserva
          );
        }
        
        return old;
      });
      
      // Invalidar caché para forzar datos frescos
      queryClient.invalidateQueries({ 
        queryKey: reservasQueryKeys.list(businessId || 'default'),
        refetchType: 'active'
      });
      
      // 🧹 Ya no necesitamos limpiar estado local porque no lo usamos
      
      //  PROTECCIÓN ADICIONAL: Verificar datos después de un tiempo
      setTimeout(() => {
        // Verificando que los datos no fueron revertidos
        const currentData = queryClient.getQueryData(reservasQueryKeys.list(businessId || 'default'));
        
        if (currentData) {
          let reservas: any[] = [];
          if ((currentData as any).reservas) {
            reservas = (currentData as any).reservas;
          } else if (Array.isArray(currentData)) {
            reservas = currentData;
          }
          
          const reservaEnCache = reservas.find(r => r.id === id);
          if (reservaEnCache && reservaEnCache.hora !== result.hora) {
            console.log('� HOOK - ¡Datos revertidos! Restaurando desde respuesta del servidor:', {
              horaEnCache: reservaEnCache.hora,
              horaCorrecta: result.hora
            });
            
            // Restaurar datos desde la respuesta del servidor
            // NOSONAR - Nesting necesario para verificación post-actualización en React Query
            queryClient.setQueryData(reservasQueryKeys.list(businessId || 'default'), (old: any) => {
              if (!old) return old;
              
              if (old.reservas) {
                // NOSONAR - Callback map necesario para actualización inmutable
                const updatedReservas = old.reservas.map((r: any) => r.id === id ? { ...r, ...result } : r);
                return { ...old, reservas: updatedReservas };
              } else if (Array.isArray(old)) {
                // NOSONAR - Callback map necesario para actualización inmutable
                return old.map((r: any) => r.id === id ? { ...r, ...result } : r);
              }
              
              return old;
            });
          }
        }
      }, 3000); // Verificar después de 3 segundos
      
      // 🎯 Actualizar el cache con la respuesta del servidor para asegurar sincronía
      queryClient.setQueryData(reservasQueryKeys.list(businessId || 'default'), (old: any) => {
        if (!old) return old;
        
        console.log('📦 HOOK - Actualizando cache con resultado del servidor:', { 
          id, 
          resultDetalles: JSON.stringify(result.detalles),
          oldDataType: old.reservas ? 'combined' : 'array'
        });
        
        // Si es data combinada (con stats)
        if (old.reservas) {
          const updatedReservas = old.reservas.map((reserva: Reserva) => {
            if (reserva.id === id) {
              // 🎯 Combinar datos existentes con la respuesta del servidor
              const updated = { ...reserva, ...result };
              console.log('🔄 HOOK - Reserva actualizada en cache:', { 
                original: reserva, 
                updated,
                detallesAntes: JSON.stringify(reserva.detalles),
                detallesDespues: JSON.stringify(updated.detalles)
              });
              return updated;
            }
            return reserva;
          });
          
          return {
            ...old,
            reservas: updatedReservas
          };
        }
        
        // Si es array simple
        if (Array.isArray(old)) {
          return old.map((reserva: Reserva) => {
            if (reserva.id === id) {
              const updated = { ...reserva, ...result };
              console.log('🔄 HOOK - Reserva actualizada en cache (array):', { 
                original: reserva, 
                updated,
                detallesAntes: JSON.stringify(reserva.detalles),
                detallesDespues: JSON.stringify(updated.detalles)
              });
              return updated;
            }
            return reserva;
          });
        }
        
        return old;
      });
      
      // 🎯 Forzar invalidación suave para triggear re-renders - DESHABILITADO temporalmente
      // setTimeout(() => {
      //   console.log('🔄 Forzando invalidación suave del cache...');
      //   queryClient.invalidateQueries({ 
      //     queryKey: reservasQueryKeys.list(businessId || 'default'),
      //     refetchType: 'none' // No refetch, solo marcar como stale
      //   });
      // }, 100);
      
      toast.success('✅ Reserva actualizada correctamente');
    },
  });
  
  // 🎯 Función para actualizar un campo específico (CON OPTIMISTIC UPDATE INMEDIATO)
  const updateField = useCallback((reservaId: string, field: keyof Reserva, value: any) => {
    console.log('🔄 updateField con optimistic update:', { reservaId, field, value });
    
    // 🚀 OPTIMISTIC UPDATE INMEDIATO: Actualizar cache local antes del servidor
    queryClient.setQueryData(reservasQueryKeys.list(businessId || 'default'), (old: any) => {
      if (!old) return old;
      
      console.log('🎯 Aplicando optimistic update al cache:', { reservaId, field, value });
      
      // Si es data combinada (con stats)
      if (old.reservas) {
        return {
          ...old,
          reservas: old.reservas.map((reserva: Reserva) =>
            reserva.id === reservaId ? { ...reserva, [field]: value } : reserva
          )
        };
      }
      
      // Si es array simple
      if (Array.isArray(old)) {
        return old.map((reserva: Reserva) =>
          reserva.id === reservaId ? { ...reserva, [field]: value } : reserva
        );
      }
      
      return old;
    });
    
    // Luego hacer la mutación al servidor
    return updateMutation.mutateAsync({
      id: reservaId,
      updates: { [field]: value }
    });
  }, [updateMutation, queryClient, businessId]);
  
  // 🎯 Función para actualizar múltiples campos (edición modal)
  const updateReserva = useCallback((reservaId: string, updates: Partial<Reserva>) => {
    
    return updateMutation.mutateAsync({
      id: reservaId,
      updates
    });
  }, [updateMutation]);

  // 🗑️ Función para eliminar una reserva
  const deleteReserva = useCallback(async (reservaId: string) => {
    const url = `/api/reservas/${reservaId}?businessId=${businessId}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error eliminando reserva: ${errorData.error || response.statusText}`);
    }
    
    // Actualización optimista - remover de cache inmediatamente
    queryClient.setQueryData(reservasQueryKeys.list(businessId || 'default'), (old: any) => {
      if (!old) return old;
      
      // Si es data combinada (con stats)
      if (old.reservas) {
        return {
          ...old,
          reservas: old.reservas.filter((reserva: Reserva) => reserva.id !== reservaId)
        };
      }
      
      // Si es array simple
      if (Array.isArray(old)) {
        return old.filter((reserva: Reserva) => reserva.id !== reservaId);
      }
      
      return old;
    });
    
    // Limpiar cualquier estado de edición
    setEditingState(prev => {
      const newState = { ...prev };
      delete newState[reservaId];
      return newState;
    });
    
    toast.success('✅ Reserva eliminada correctamente');
    
    return response.json();
  }, [businessId, queryClient]);
  
  // 🎯 Función para obtener el valor actual de un campo (SIMPLIFICADO)
  const getFieldValue = useCallback((reservaId: string, field: keyof Reserva, originalValue: any) => {
    // 1. Intentar obtener del cache de React Query primero
    const queryData = queryClient.getQueryData(reservasQueryKeys.list(businessId || 'default'));
    
    let reservaFromCache: Reserva | undefined;
    if (queryData) {
      if ((queryData as any).reservas) {
        reservaFromCache = (queryData as any).reservas.find((r: Reserva) => r.id === reservaId);
      } else if (Array.isArray(queryData)) {
        reservaFromCache = queryData.find((r: Reserva) => r.id === reservaId);
      }
    }
    
    // 2. Si hay datos en cache, usarlos
    if (reservaFromCache?.[field] !== undefined) {
      return reservaFromCache[field];
    }
    
    // 3. Fallback al valor original
    return originalValue;
  }, [queryClient, businessId]);
  
  // 🎯 Función para verificar si una reserva tiene ediciones pendientes
  const hasLocalEdits = useCallback((reservaId: string) => {
    return !!editingState[reservaId] && Object.keys(editingState[reservaId]).length > 0;
  }, [editingState]);
  
  // 🎯 Función para limpiar ediciones locales de una reserva
  const clearLocalEdits = useCallback((reservaId: string) => {
    setEditingState(prev => {
      const newState = { ...prev };
      delete newState[reservaId];
      return newState;
    });
  }, []);
  
  return {
    // Estados
    isUpdating: updateMutation.isPending,
    editingState,
    
    // Acciones
    updateField,
    updateReserva,
    deleteReserva,
    getFieldValue,
    hasLocalEdits,
    clearLocalEdits,
    
    // Información adicional
    error: updateMutation.error,
  };
}
