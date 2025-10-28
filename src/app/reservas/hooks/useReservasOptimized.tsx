'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Reserva, EstadoReserva } from '../types/reservation';
import { reservasQueryKeys } from '../../../providers/QueryProvider';

// Type alias para reserva sin campos generados
type NewReservaData = Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>;

// 🌍 UTILIDAD: Obtener fecha actual del negocio (con corte 4 AM Ecuador)
const getFechaActualNegocio = (): string => {
  try {
    const now = new Date();
    
    // Obtener componentes de fecha/hora en Ecuador
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '2025');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    
    const currentDate = new Date(year, month - 1, day);
    
    // Si es antes de las 4 AM, usar el día anterior (día de negocio continúa)
    if (hour < 4) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Formatear como YYYY-MM-DD
    const fechaCalculada = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    console.log('🌍 [FRONTEND] Fecha actual negocio calculada:', {
      fechaEcuador: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      horaEcuador: hour,
      esAntesDe4AM: hour < 4,
      fechaFinal: fechaCalculada
    });
    
    return fechaCalculada;
  } catch (error) {
    console.error('❌ Error calculando fecha negocio:', error);
    // Fallback a fecha UTC simple
    return new Date().toISOString().split('T')[0];
  }
};

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
    
    console.log('🔥🌐 HOOK - ENVIANDO FETCH AL API:', {
      url,
      method: 'PUT',
      reservaId: id,
      businessId,
      datosAEnviar: JSON.stringify(reservaData),
      horaEnviada: reservaData.hora,
      fechaEnviada: reservaData.fecha
    });
    
    // 🚀 TIMEOUT: 5 segundos máximo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservaData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('🔥🌐 HOOK - RESPUESTA RECIBIDA DEL API:', {
        status: response.status,
        ok: response.ok,
        reservaId: id
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error updating reserva:', response.status, errorData);
        throw new Error(`Error updating reserva: ${errorData.error || response.statusText}`);
      }
      
      const resultado = await response.json();
      
      console.log('🔥🌐 HOOK - DATOS PARSEADOS DE LA RESPUESTA:', {
        success: resultado.success,
        reservaDevuelta: resultado.reserva,
        horaEnRespuesta: resultado.reserva?.hora,
        fechaEnRespuesta: resultado.reserva?.fecha
      });
      
      return resultado;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Si es timeout, retornar éxito fake (optimistic update ya aplicado)
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⏱️ Timeout - cambio visible por optimistic update');
        return { success: true, reserva: { id, ...reservaData } };
      }
      
      throw error;
    }
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

// 🧠 POLLING: Usamos intervalo fijo de 30 segundos (como en bd16e02)

export function useReservasOptimized({ 
  businessId, 
  enabled = true, 
  includeStats = true 
}: UseReservasOptimizedOptions = {}) {
  const queryClient = useQueryClient();

  // ✅ Helper centralizado para invalidar cache
  const invalidateReservasCache = async (scope: 'all' | 'standard' = 'standard') => {
    if (scope === 'all') {
      // Invalidación completa (cambios estructurales: fecha, estado, etc.)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reservasQueryKeys.all, refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: reservasQueryKeys.lists(), refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId || 'default'), refetchType: 'all' })
      ]);
    } else {
      // Invalidación estándar (la mayoría de casos)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reservasQueryKeys.lists(), refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: reservasQueryKeys.stats(businessId || 'default'), refetchType: 'all' })
      ]);
    }
  };

  // 🔥 OPTIMIZACIÓN: Query unificada (elimina redundancia)
  const mainQuery = useQuery({
    queryKey: reservasQueryKeys.list(businessId || 'default', { includeStats }),
    queryFn: () => {
      return includeStats 
        ? reservasAPI.fetchReservasWithStats(businessId || '')
        : reservasAPI.fetchReservas(businessId);
    },
    enabled: enabled,
    staleTime: 60000, // 1 minuto - datos considerados fresh
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    refetchOnWindowFocus: true,
    refetchOnMount: false, // ❌ NO refetch al montar - usar caché
    // 🧠 POLLING SIMPLIFICADO (como en bd16e02 que funcionaba)
    refetchInterval: 30000, // 30 segundos - polling constante
    refetchIntervalInBackground: false, // ❌ NO polling en background
  });

  // Seleccionar la query activa
  const activeQuery = mainQuery;

  // 🔄 MUTATIONS CON OPTIMISTIC UPDATES
  const createMutation = useMutation({
    mutationFn: (reservaData: NewReservaData) =>
      reservasAPI.createReserva(reservaData, businessId),
    onMutate: async (reservaData) => {
      console.log('🎯 [CREATE] Iniciando actualización optimista');
      
      // Cancelar refetches en progreso
      await queryClient.cancelQueries({ queryKey: reservasQueryKeys.lists() });
      
      // Snapshot para rollback
      const previousReservas = queryClient.getQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats)
      );
      
      // Crear reserva temporal con ID temporal
      const tempId = `temp-${Date.now()}`;
      const tempReserva: any = {
        ...reservaData,
        id: tempId,
        estado: 'En Progreso' as EstadoReserva,
        codigoQR: '',
        asistenciaActual: 0,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString(),
        registroEntradas: [],
        _isOptimistic: true // Flag para identificar temporales
      };
      
      // Actualización optimista en la caché
      queryClient.setQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats),
        (old: any) => {
          if (!old?.reservas) return old;
          
          // 🔄 Agregar reserva temporal al principio
          const reservasActualizadas = [tempReserva, ...old.reservas];
          
          // 🧮 RECALCULAR ESTADÍSTICAS después del create optimista
          const hoy = getFechaActualNegocio(); // 🌍 Usar fecha de negocio con corte 4 AM
          const reservasHoy = reservasActualizadas.filter((r: any) => r.fecha === hoy);
          
          // Calcular totales con la nueva reserva incluida
          const totalAsistentes = reservasActualizadas.reduce((acc: number, r: any) => acc + (r.asistenciaActual || 0), 0);
          const reservasCompletadas = reservasActualizadas.filter((r: any) => r.estado === 'Activa' || r.estado === 'En Camino');
          const totalReservados = reservasCompletadas.reduce((acc: number, r: any) => acc + r.numeroPersonas, 0);
          const promedioAsistencia = totalReservados > 0 ? (totalAsistentes / totalReservados) * 100 : 0;
          
          const statsActualizadas = {
            totalReservas: reservasActualizadas.length,
            totalAsistentes,
            promedioAsistencia: Math.round(promedioAsistencia),
            reservasHoy: reservasHoy.length // ✅ ESTO SE RECALCULA CORRECTAMENTE
          };
          
          console.log('🧮 [CREATE] Stats recalculadas optimistamente:', {
            reservasHoyAntes: old.stats?.reservasHoy || 0,
            reservasHoyDespues: statsActualizadas.reservasHoy,
            totalReservasAntes: old.stats?.totalReservas || 0,
            totalReservasDespues: statsActualizadas.totalReservas
          });
          
          return {
            ...old,
            reservas: reservasActualizadas,
            stats: statsActualizadas // ✅ ACTUALIZAR STATS TAMBIÉN
          };
        }
      );
      
      console.log('✅ [CREATE] Reserva temporal agregada al cache');
      
      return { previousReservas, tempId };
    },
    onSuccess: async (newReserva, _variables, context) => {
      console.log('✅ [CREATE] Reserva creada en servidor', { id: newReserva?.id });
      
      // 🔥 ESTRATEGIA MEJORADA: Agregar la reserva real al cache directamente
      if (newReserva) {
        queryClient.setQueryData(
          reservasQueryKeys.list(businessId || 'default', includeStats),
          (old: any) => {
            if (!old?.reservas) return old;
            
            // Remover la temporal si existe
            const reservasSinTemporal = context?.tempId 
              ? old.reservas.filter((r: any) => r.id !== context.tempId)
              : old.reservas;
            
            // Agregar la reserva real al principio (más reciente primero)
            return {
              ...old,
              reservas: [newReserva, ...reservasSinTemporal]
            };
          }
        );
        
        console.log('✅ [CREATE] Reserva real agregada al cache');
      }
      
      // 🚀 Invalidar y refetch inmediatamente
      await queryClient.invalidateQueries({ 
        queryKey: reservasQueryKeys.list(businessId || 'default', includeStats),
        refetchType: 'active' // Refetch inmediatamente si hay observers activos
      });
      
      toast.success('✓ Reserva creada exitosamente');
    },
    onError: (error, _variables, context) => {
      console.error('❌ [CREATE] Error al crear', error);
      
      // Rollback: Restaurar datos anteriores
      if (context?.previousReservas) {
        queryClient.setQueryData(
          reservasQueryKeys.list(businessId || 'default', includeStats),
          context.previousReservas
        );
        // Rollback aplicado
      }
      
      toast.error('❌ Error al crear la reserva');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, businessId: mutationBusinessId }: { id: string; data: Partial<Reserva>; businessId?: string }) =>
      reservasAPI.updateReserva(id, data, mutationBusinessId || businessId),
    onMutate: async ({ id, data }) => {
      console.log('🎯 [UPDATE] Iniciando actualización optimista', { id, fields: Object.keys(data) });
      
      await queryClient.cancelQueries({ queryKey: reservasQueryKeys.lists() });
      
      const previousReservas = queryClient.getQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats)
      );
      
      queryClient.setQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats),
        (old: any) => {
          if (!old?.reservas) return old;
          
          // 🔄 Actualizar la reserva específica
          const reservasActualizadas = old.reservas.map((r: Reserva) => 
            r.id === id ? { ...r, ...data, fechaModificacion: new Date().toISOString() } : r
          );
          
          // 🧮 RECALCULAR ESTADÍSTICAS después del update optimista
          const hoy = getFechaActualNegocio(); // 🌍 Usar fecha de negocio con corte 4 AM
          const reservasHoy = reservasActualizadas.filter((r: Reserva) => r.fecha === hoy);
          
          // Calcular totales con la reserva actualizada
          const totalAsistentes = reservasActualizadas.reduce((acc: number, r: Reserva) => acc + (r.asistenciaActual || 0), 0);
          const reservasCompletadas = reservasActualizadas.filter((r: Reserva) => r.estado === 'Activa' || r.estado === 'En Camino');
          const totalReservados = reservasCompletadas.reduce((acc: number, r: Reserva) => acc + r.numeroPersonas, 0);
          const promedioAsistencia = totalReservados > 0 ? (totalAsistentes / totalReservados) * 100 : 0;
          
          const statsActualizadas = {
            totalReservas: reservasActualizadas.length,
            totalAsistentes,
            promedioAsistencia: Math.round(promedioAsistencia),
            reservasHoy: reservasHoy.length // ✅ ESTO SE RECALCULA CORRECTAMENTE
          };
          
          console.log('🧮 [UPDATE] Stats recalculadas optimistamente:', {
            camposActualizados: Object.keys(data || {}),
            reservasHoyAntes: old.stats?.reservasHoy || 0,
            reservasHoyDespues: statsActualizadas.reservasHoy
          });
          
          return {
            ...old,
            reservas: reservasActualizadas,
            stats: statsActualizadas // ✅ ACTUALIZAR STATS TAMBIÉN
          };
        }
      );
      
      console.log('✅ [UPDATE] Caché actualizada optimistamente');
      return { previousReservas, id };
    },
    onSuccess: async (_result, { data }) => {
      const structuralFields = new Set(['fecha', 'hora', 'estado', 'businessId']);
      const requiresFullInvalidation = data && Object.keys(data).some(key => structuralFields.has(key));
      
      if (requiresFullInvalidation) {
        console.log('📅 [UPDATE] Cambio estructural detectado:', Object.keys(data || {}));
        // 🚀 NO ESPERAR: Invalidar en background
        invalidateReservasCache('all').catch(err => 
          console.error('Error al invalidar cache:', err)
        );
      } else {
        console.log('🔄 [UPDATE] Cambio simple:', Object.keys(data || {}));
        // 🚀 NO ESPERAR: Invalidar en background
        invalidateReservasCache('standard').catch(err => 
          console.error('Error al invalidar cache:', err)
        );
      }
      
      toast.success('✓ Reserva actualizada exitosamente');
    },
    onError: (error, _variables, context) => {
      console.error('❌ [UPDATE] Error al actualizar', error);
      
      if (context?.previousReservas) {
        queryClient.setQueryData(
          reservasQueryKeys.list(businessId || 'default', includeStats),
          context.previousReservas
        );
        // Rollback aplicado
      }
      
      toast.error('❌ Error al actualizar la reserva');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reservasAPI.deleteReserva(id, businessId),
    onMutate: async (id) => {
      console.log('🎯 [DELETE] Iniciando eliminación optimista', { id });
      
      await queryClient.cancelQueries({ queryKey: reservasQueryKeys.lists() });
      
      const previousReservas = queryClient.getQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats)
      );
      
      queryClient.setQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats),
        (old: any) => {
          if (!old?.reservas) return old;
          
          // 🔄 Filtrar reservas eliminando la que se va a borrar
          const reservasActualizadas = old.reservas.filter((r: Reserva) => r.id !== id);
          
          // 🧮 RECALCULAR ESTADÍSTICAS después del delete optimista
          const hoy = getFechaActualNegocio(); // 🌍 Usar fecha de negocio con corte 4 AM
          const reservasHoy = reservasActualizadas.filter((r: Reserva) => r.fecha === hoy);
          
          // Calcular totales con las reservas restantes
          const totalAsistentes = reservasActualizadas.reduce((acc: number, r: Reserva) => acc + (r.asistenciaActual || 0), 0);
          const reservasCompletadas = reservasActualizadas.filter((r: Reserva) => r.estado === 'Activa' || r.estado === 'En Camino');
          const totalReservados = reservasCompletadas.reduce((acc: number, r: Reserva) => acc + r.numeroPersonas, 0);
          const promedioAsistencia = totalReservados > 0 ? (totalAsistentes / totalReservados) * 100 : 0;
          
          const statsActualizadas = {
            totalReservas: reservasActualizadas.length,
            totalAsistentes,
            promedioAsistencia: Math.round(promedioAsistencia),
            reservasHoy: reservasHoy.length // ✅ ESTO SE RECALCULA CORRECTAMENTE
          };
          
          console.log('🧮 [DELETE] Stats recalculadas optimistamente:', {
            reservasHoyAntes: old.stats?.reservasHoy || 0,
            reservasHoyDespues: statsActualizadas.reservasHoy,
            totalReservasAntes: old.stats?.totalReservas || 0,
            totalReservasDespues: statsActualizadas.totalReservas
          });
          
          return {
            ...old,
            reservas: reservasActualizadas,
            stats: statsActualizadas // ✅ ACTUALIZAR STATS TAMBIÉN
          };
        }
      );
      
      console.log('✅ [DELETE] Reserva removida del caché optimistamente');
      return { previousReservas, id };
    },
    onSuccess: async () => {
      console.log('✅ [DELETE] Reserva eliminada en servidor');
      // 🚀 NO ESPERAR: Invalidar en background
      invalidateReservasCache('all').catch(err => 
        console.error('Error al invalidar cache:', err)
      );
      toast.success('✓ Reserva eliminada exitosamente');
    },
    onError: (error, _id, context) => {
      console.error('❌ [DELETE] Error al eliminar', error);
      
      if (context?.previousReservas) {
        queryClient.setQueryData(
          reservasQueryKeys.list(businessId || 'default', includeStats),
          context.previousReservas
        );
        console.log('🔄 [DELETE] Rollback aplicado');
      }
      
      toast.error('❌ Error al eliminar la reserva');
    },
  });

  // 🎯 MUTATION: Registrar Asistencia con Optimistic Updates
  const updateAsistenciaMutation = useMutation({
    mutationFn: async ({ qrCode, increment }: { qrCode: string; increment: number }) => {
      const response = await fetch('/api/reservas/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          qrCode, 
          action: 'increment', 
          increment,
          businessId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar asistencia');
      }

      return response.json();
    },
    onMutate: async ({ qrCode, increment }) => {
      console.log('🎯 [ASISTENCIA] Iniciando actualización optimista', { qrCode, increment });
      
      // Cancelar refetches en progreso para evitar sobrescribir cambios
      await queryClient.cancelQueries({ queryKey: reservasQueryKeys.lists() });
      
      // Snapshot de datos anteriores para rollback
      const previousReservas = queryClient.getQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats)
      );
      
      // Extraer ID de la reserva del qrCode (formato: res-{id} o {id})
      const reservaId = qrCode.startsWith('res-') ? qrCode.substring(4) : qrCode;
      
      // Actualización optimista en la caché
      queryClient.setQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats),
        (old: any) => {
          if (!old?.reservas) return old;
          
          return {
            ...old,
            reservas: old.reservas.map((r: Reserva) => 
              r.id === reservaId 
                ? { ...r, asistenciaActual: (r.asistenciaActual || 0) + increment }
                : r
            )
          };
        }
      );
      
      console.log('✅ [ASISTENCIA] Caché actualizada optimistamente');
      
      return { previousReservas, reservaId };
    },
    onSuccess: async (_result, _variables, context) => {
      console.log('✅ [ASISTENCIA] Registro exitoso', { reservaId: context?.reservaId });
      // 🚀 NO ESPERAR: Invalidar en background para no bloquear UI
      invalidateReservasCache('standard').catch(err => 
        console.error('Error al invalidar cache:', err)
      );
      toast.success('✓ Asistencia registrada correctamente');
    },
    onError: (error, _variables, context) => {
      console.error('❌ [ASISTENCIA] Error al registrar', error);
      
      // Rollback: Restaurar datos anteriores
      if (context?.previousReservas) {
        queryClient.setQueryData(
          reservasQueryKeys.list(businessId || 'default', includeStats),
          context.previousReservas
        );
        console.log('🔄 [ASISTENCIA] Rollback aplicado');
      }
      
      toast.error(`❌ ${error instanceof Error ? error.message : 'Error al registrar asistencia'}`);
    },
  });

  // 📊 DATOS OPTIMIZADOS
  // 🔥 CRÍTICO: Usar useMemo para crear nueva referencia del array cuando cambien los datos
  // Esto fuerza a React a detectar el cambio y re-renderizar los componentes
  const reservas = useMemo(() => {
    const data = includeStats 
      ? (mainQuery.data?.reservas || [])
      : (mainQuery.data || []);
    
    console.log('🔄 Hook: Creando nueva referencia de reservas array', {
      count: data.length,
      dataUpdatedAt: mainQuery.dataUpdatedAt
    });
    
    // Crear nuevo array para garantizar nueva referencia en memoria
    return [...data];
  }, [
    includeStats,
    mainQuery.data,
    mainQuery.dataUpdatedAt
  ]);
  
  const stats = includeStats ? mainQuery.data?.stats : undefined;
  const clients = includeStats ? mainQuery.data?.clients : undefined;

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
      const result = await mainQuery.refetch();
      
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
    
    // Actualizar cache de la query principal
    const queryKey = reservasQueryKeys.list(businessId || 'default', { includeStats });
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (includeStats) {
        // Con stats: estructura { reservas, stats, clients }
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
      } else {
        // Sin stats: array directo
        if (!Array.isArray(oldData)) return oldData;
        
        const updated = oldData.map((reserva: any) => 
          reserva.id === reservaId 
            ? { ...reserva, asistenciaActual: nuevaAsistencia }
            : reserva
        );
        console.log('✅ Cache actualizado (sin stats)');
        return updated;
      }
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
    updateReservaAsistencia, // ✅ Función optimistic para asistencia (legacy)
    updateReservaOptimized, // ✅ Función optimistic para cualquier campo
    registrarAsistencia: updateAsistenciaMutation.mutateAsync, // 🔥 Nueva mutation para asistencia
    
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
