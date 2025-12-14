'use client';

import { Temporal } from '@js-temporal/polyfill';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Reserva, EstadoReserva } from '../types/reservation';
import { reservasQueryKeys } from '../../../providers/QueryProvider';
import { 
  calcularFechasReserva, 
  formatearHoraMilitar, 
  formatearFechaCompletaMilitar
} from '@/lib/timezone-utils';

// Type alias para reserva sin campos generados
type NewReservaData = Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>;

// 🌍 UTILIDAD: Obtener fecha actual del negocio (con corte 4 AM Ecuador)
const getFechaActualNegocio = (): string => {
  try {
    // Obtener fecha/hora actual en Ecuador usando Temporal API
    const now = Temporal.Now.zonedDateTimeISO('America/Guayaquil');
    
    // Si es antes de las 4 AM, usar el día anterior
    const businessDate = now.hour < 4 
      ? now.subtract({ days: 1 }) 
      : now;
    
    // Convertir a string YYYY-MM-DD
    const fechaCalculada = businessDate.toPlainDate().toString();
    
    // Debug verbose removido
    // console.log('🌍 [FRONTEND] Fecha actual negocio calculada:', {
    //   fechaEcuador: now.toString(),
    //   horaEcuador: now.hour,
    //   esAntesDe4AM: now.hour < 4,
    //   fechaFinal: fechaCalculada
    // });
    
    return fechaCalculada;
  } catch (error) {
    console.error('❌ Error calculando fecha negocio:', error);
    // Fallback a fecha UTC simple
    return Temporal.Now.plainDateISO().toString();
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

    // Validar y ajustar fecha/hora con timezone
    const { fechaReserva, esValida } = calcularFechasReserva(reservaData.fecha, reservaData.hora);
    
    if (!esValida) {
      throw new Error('La fecha de reserva es muy antigua (más de 48 horas en el pasado)');
    }

    // Usar fechas ajustadas
    const reservaAjustada = {
      ...reservaData,
      fecha: formatearFechaCompletaMilitar(fechaReserva).split(' ')[0],
      hora: formatearHoraMilitar(fechaReserva)
    };

    // Enviar la reserva ajustada al servidor
     
     // Construir la URL con el businessId como query parameter
     const url = `/api/reservas?businessId=${businessId}`;
     
     const response = await fetch(url, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
      body: JSON.stringify(reservaAjustada),
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
    
    // 🚀 TIMEOUT: 10 segundos máximo (aumentado para Vercel Edge)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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
    staleTime: 30000, // 🚀 30 segundos - datos considerados fresh
    gcTime: 5 * 60 * 1000, // 5 minutos en caché
    refetchOnWindowFocus: false, // ❌ NO refetch al volver a la ventana
    refetchOnMount: true, // ✅ SI refetch al montar para tener datos frescos
    // 🧠 POLLING CADA 60 SEGUNDOS como backup (SSE es principal)
    refetchInterval: 60000, // 60 segundos - polling de respaldo
    refetchIntervalInBackground: false,
  });

  // Seleccionar la query activa
  const activeQuery = mainQuery;

  // 🔄 MUTATIONS CON OPTIMISTIC UPDATES
  const createMutation = useMutation({
    mutationFn: (reservaData: NewReservaData) =>
      reservasAPI.createReserva(reservaData, businessId),
    onMutate: async (reservaData) => {
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
        fechaCreacion: Temporal.Now.instant().toString(),
        fechaModificacion: Temporal.Now.instant().toString(),
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
          const hoy = getFechaActualNegocio();
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
            reservasHoy: reservasHoy.length
          };
          
          return {
            ...old,
            reservas: reservasActualizadas,
            stats: statsActualizadas // ✅ ACTUALIZAR STATS TAMBIÉN
          };
        }
      );
      
      return { previousReservas, tempId };
    },
    onSuccess: async (responseData, _variables, context) => {
      // 🔥 ESTRATEGIA CORREGIDA: Actualizar cache + forzar re-render
      const newReserva = responseData?.reserva || responseData;
      
      console.log('✅ [CREATE] onSuccess - Procesando respuesta:', {
        tieneReserva: !!newReserva,
        reservaId: newReserva?.id,
        tempId: context?.tempId
      });
      
      if (newReserva?.id) {
        const queryKey = reservasQueryKeys.list(businessId || 'default', { includeStats });
        
        // 1. Actualizar cache manualmente
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.reservas) {
            console.warn('⚠️ [CREATE] Cache vacío, creando estructura inicial');
            return { reservas: [newReserva], stats: old?.stats };
          }
          
          // Remover la temporal si existe
          const reservasSinTemporal = context?.tempId 
            ? old.reservas.filter((r: any) => r.id !== context.tempId)
            : old.reservas;
          
          // Verificar que no esté duplicada
          const yaExiste = reservasSinTemporal.some((r: any) => r.id === newReserva.id);
          if (yaExiste) {
            console.log('⚠️ [CREATE] Reserva ya existe en cache, no duplicar');
            return old;
          }
          
          console.log('✅ [CREATE] Agregando reserva real al cache:', newReserva.id);
          
          // Agregar la reserva real al principio (más reciente primero)
          return {
            ...old,
            reservas: [newReserva, ...reservasSinTemporal]
          };
        });
        
        // 2. 🔥 FORZAR que React Query notifique a los suscriptores
        // Esto es CRÍTICO para que el componente se re-renderice
        await queryClient.refetchQueries({ 
          queryKey,
          type: 'active',
          exact: true 
        });
        
        console.log('✅ [CREATE] Cache actualizado y refetch completado');
      } else {
        console.error('❌ [CREATE] No se recibió reserva válida del servidor');
        // Forzar refetch completo como fallback
        await queryClient.invalidateQueries({ 
          queryKey: reservasQueryKeys.lists() 
        });
      }
      
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
      await queryClient.cancelQueries({ queryKey: reservasQueryKeys.lists() });
      
      const previousReservas = queryClient.getQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats)
      );
      
      queryClient.setQueryData(
        reservasQueryKeys.list(businessId || 'default', includeStats),
        (old: any) => {
          if (!old?.reservas) return old;
          
          const reservasActualizadas = old.reservas.map((r: Reserva) => 
            r.id === id ? { ...r, ...data, fechaModificacion: Temporal.Now.instant().toString() } : r
          );
          
          const hoy = getFechaActualNegocio();
          const reservasHoy = reservasActualizadas.filter((r: Reserva) => r.fecha === hoy);
          
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
          
          return {
            ...old,
            reservas: reservasActualizadas,
            stats: statsActualizadas // ✅ ACTUALIZAR STATS TAMBIÉN
          };
        }
      );
      
      return { previousReservas, id };
    },
    onSuccess: async (payload, variables) => {
      const data = payload?.data || variables?.data;
      const queryKey = reservasQueryKeys.list(businessId || 'default', { includeStats });
      
      console.log('✅ [UPDATE] onSuccess - Sincronizando cache:', {
        reservaId: variables?.id,
        cambios: Object.keys(data || {})
      });
      
      // 🔥 SIEMPRE refetch activo para asegurar que el UI se actualice
      await queryClient.refetchQueries({ 
        queryKey,
        type: 'active',
        exact: true 
      });
       
      toast.success('✓ Reserva actualizada');
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
          
          return {
            ...old,
            reservas: reservasActualizadas,
            stats: statsActualizadas // ✅ ACTUALIZAR STATS TAMBIÉN
          };
        }
      );
      
      return { previousReservas, id };
    },
    onSuccess: async (_data, id) => {
      const queryKey = reservasQueryKeys.list(businessId || 'default', { includeStats });
      
      console.log('✅ [DELETE] onSuccess - Reserva eliminada:', id);
      
      // 🔥 Refetch para asegurar que el UI se actualice
      await queryClient.refetchQueries({ 
        queryKey,
        type: 'active',
        exact: true 
      });
      
      toast.success('✓ Reserva eliminada');
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
    onSuccess: async (data, _variables, context) => {
      console.log('✅ [ASISTENCIA] Respuesta del servidor:', data);
      
      // 🚀 ACTUALIZAR CON VALOR REAL DEL SERVIDOR (no solo optimista)
      const reservaId = context?.reservaId;
      if (reservaId && data.incrementCount !== undefined) {
        queryClient.setQueryData(
          reservasQueryKeys.list(businessId || 'default', includeStats),
          (old: any) => {
            if (!old?.reservas) return old;
            
            return {
              ...old,
              reservas: old.reservas.map((r: Reserva) => 
                r.id === reservaId 
                  ? { ...r, asistenciaActual: data.incrementCount } // ✅ Usar valor real del servidor
                  : r
              )
            };
          }
        );
        console.log('🎯 [ASISTENCIA] Actualizado con valor real del servidor:', data.incrementCount);
      }
      
      // 🚀 OPTIMIZACIÓN: Invalidar en background (no bloquear UI)
      setTimeout(() => {
        invalidateReservasCache('all').catch(err => 
          console.error('Error al invalidar cache:', err)
        );
      }, 500);
      
      toast.success('✓ Asistencia registrada');
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
    
    // Console debug ruidoso removido
    // console.log('🔄 Hook: Creando nueva referencia de reservas array', {
    //   count: data.length,
    //   dataUpdatedAt: mainQuery.dataUpdatedAt
    // });
    
    // Crear nuevo array para garantizar nueva referencia en memoria
    return [...data];
  }, [
    includeStats,
    mainQuery.data
  ]);
  
  const stats = includeStats ? mainQuery.data?.stats : undefined;
  const clients = includeStats ? mainQuery.data?.clients : undefined;

  // 🔄 MÉTODOS DE ACCIÓN
  const createReserva = async (reservaData: NewReservaData) => {
    if (reservaData.fecha && reservaData.hora) {
      // Validar y ajustar fecha/hora con timezone
      const { fechaReserva, esValida } = calcularFechasReserva(reservaData.fecha, reservaData.hora);
      
      if (!esValida) {
        throw new Error('La fecha de reserva es muy antigua (más de 48 horas en el pasado)');
      }

      // Usar fechas ajustadas
      const reservaAjustada = {
        ...reservaData,
        fecha: formatearFechaCompletaMilitar(fechaReserva).split(' ')[0],
        hora: formatearHoraMilitar(fechaReserva)
      };

      console.log('🎯 Creando reserva con fechas ajustadas:', {
        original: { fecha: reservaData.fecha, hora: reservaData.hora },
        ajustada: { fecha: reservaAjustada.fecha, hora: reservaAjustada.hora }
      });

      return createMutation.mutateAsync(reservaAjustada);
    }

    return createMutation.mutateAsync(reservaData);
  };

  const updateReserva = (id: string, data: Partial<Reserva>) => {
    // Si se está actualizando fecha u hora, ajustar con timezone
    if (data.fecha && data.hora) {
      const { fechaReserva, esValida } = calcularFechasReserva(data.fecha, data.hora);
      
      if (!esValida) {
        throw new Error('La fecha de reserva es muy antigua (más de 48 horas en el pasado)');
      }

      const dataAjustada = {
        ...data,
        fecha: formatearFechaCompletaMilitar(fechaReserva).split(' ')[0],
        hora: formatearHoraMilitar(fechaReserva)
      };

      console.log('🎯 Actualizando reserva con fechas ajustadas:', {
        original: { fecha: data.fecha, hora: data.hora },
        ajustada: { fecha: dataAjustada.fecha, hora: dataAjustada.hora }
      });

      return updateMutation.mutateAsync({ id, data: dataAjustada, businessId });
    }

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
    queryKey: reservasQueryKeys.updates(businessId, Temporal.Instant.fromEpochMilliseconds(lastUpdate).toString()),
    queryFn: () => reservasAPI.checkUpdates(businessId, Temporal.Instant.fromEpochMilliseconds(lastUpdate).toString()),
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
