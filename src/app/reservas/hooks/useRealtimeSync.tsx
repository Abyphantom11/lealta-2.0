import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useServerSentEvents } from './useServerSentEvents';
import { REALTIME_CONFIG } from '../utils/realtime-config';
import type { SSEEvent, ConnectionStatus } from '../types/realtime';
import type { Reserva } from '../types/reservation';

interface UseRealtimeSyncOptions {
  businessId: number | string;
  enabled?: boolean;
  showToasts?: boolean; // Mostrar notificaciones toast
  autoUpdateCache?: boolean; // Actualizar caché automáticamente
}

interface UseRealtimeSyncReturn {
  status: ConnectionStatus;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  isRealtimeEnabled: boolean;
}

export function useRealtimeSync({
  businessId,
  enabled = true,
  showToasts = true,
  autoUpdateCache = true
}: UseRealtimeSyncOptions): UseRealtimeSyncReturn {
  const queryClient = useQueryClient();

  // 📱 Handler: QR Escaneado
  const handleQRScanned = useCallback((event: SSEEvent<any>) => {
    // Los datos vienen directamente en el evento del servidor
    const { reservationId, customerName, scanCount, increment, isFirstScan } = event.data || event;

    if (REALTIME_CONFIG.debug) {
      console.log('[Realtime] QR escaneado:', { reservationId, scanCount, isFirstScan });
    }

    // Actualizar caché de React Query
    if (autoUpdateCache) {
      queryClient.setQueryData(
        ['reservas', businessId],
        (oldData: any) => {
          if (!oldData?.reservas) return oldData;

          return {
            ...oldData,
            reservas: oldData.reservas.map((reserva: Reserva) => {
              if (reserva.id === reservationId) {
                return {
                  ...reserva,
                  asistenciaActual: scanCount,
                  estado: isFirstScan ? 'Confirmada' : reserva.estado,
                  fechaModificacion: new Date().toISOString()
                };
              }
              return reserva;
            })
          };
        }
      );
    }

    // Emitir evento custom para forzar re-render de tarjetas
    if (globalThis.window !== undefined) {
      globalThis.window.dispatchEvent(new CustomEvent('force-card-refresh', {
        detail: { reservationId, scanCount }
      }));
    }

    // Mostrar toast
    if (showToasts) {
      const message = increment === 1 
        ? `${customerName}: +1 persona registrada`
        : `${customerName}: +${increment} personas registradas`;
      
      toast.success(message, {
        duration: 3000,
        icon: '📱'
      });
    }
  }, [businessId, autoUpdateCache, showToasts, queryClient]);

  // 🎫 Handler: Reserva Creada
  const handleReservationCreated = useCallback((event: SSEEvent<any>) => {
    const { reservationId, customerName } = event.data || event;

    if (REALTIME_CONFIG.debug) {
      console.log('[Realtime] Nueva reserva:', { reservationId, customerName });
    }

    // Invalidar query para refetch
    if (autoUpdateCache) {
      queryClient.invalidateQueries({
        queryKey: ['reservas', businessId]
      });
    }

    // Mostrar toast
    if (showToasts) {
      toast.success(`Nueva reserva: ${customerName}`, {
        duration: 4000,
        icon: '🎫'
      });
    }
  }, [businessId, autoUpdateCache, showToasts, queryClient]);

  // ✏️ Handler: Reserva Actualizada
  const handleReservationUpdated = useCallback((event: SSEEvent<any>) => {
    const { reservationId } = event.data || event;

    if (REALTIME_CONFIG.debug) {
      console.log('[Realtime] Reserva actualizada:', reservationId);
    }

    // Invalidar query para refetch
    if (autoUpdateCache) {
      queryClient.invalidateQueries({
        queryKey: ['reservas', businessId]
      });
    }

    // Emitir evento custom
    if (globalThis.window !== undefined) {
      globalThis.window.dispatchEvent(new CustomEvent('force-card-refresh', {
        detail: { reservationId }
      }));
    }

    // Toast opcional (puede ser demasiado ruido)
    if (showToasts && REALTIME_CONFIG.debug) {
      toast('Reserva actualizada', {
        duration: 2000
      });
    }
  }, [businessId, autoUpdateCache, showToasts, queryClient]);

  // ❌ Handler: Reserva Eliminada
  const handleReservationDeleted = useCallback((event: SSEEvent<any>) => {
    const { reservationId } = event.data || event;

    if (REALTIME_CONFIG.debug) {
      console.log('[Realtime] Reserva eliminada:', reservationId);
    }

    // Actualizar caché removiendo la reserva
    if (autoUpdateCache) {
      queryClient.setQueryData(
        ['reservas', businessId],
        (oldData: any) => {
          if (!oldData?.reservas) return oldData;

          return {
            ...oldData,
            reservas: oldData.reservas.filter((reserva: Reserva) => reserva.id !== reservationId)
          };
        }
      );
    }

    // Mostrar toast
    if (showToasts) {
      toast.error('Reserva eliminada', {
        duration: 3000,
        icon: '❌'
      });
    }
  }, [businessId, autoUpdateCache, showToasts, queryClient]);

  // 🔄 Handler: Estado Cambiado
  const handleStatusChanged = useCallback((event: SSEEvent<any>) => {
    const { reservationId, newStatus } = event.data || event;

    if (REALTIME_CONFIG.debug) {
      console.log('[Realtime] Estado cambiado:', { reservationId, newStatus });
    }

    // Actualizar caché
    if (autoUpdateCache) {
      queryClient.setQueryData(
        ['reservas', businessId],
        (oldData: any) => {
          if (!oldData?.reservas) return oldData;

          return {
            ...oldData,
            reservas: oldData.reservas.map((reserva: Reserva) => {
              if (reserva.id === reservationId) {
                return {
                  ...reserva,
                  estado: newStatus,
                  fechaModificacion: new Date().toISOString()
                };
              }
              return reserva;
            })
          };
        }
      );
    }

    // Emitir evento custom
    if (globalThis.window !== undefined) {
      globalThis.window.dispatchEvent(new CustomEvent('force-card-refresh', {
        detail: { reservationId, newStatus }
      }));
    }
  }, [businessId, autoUpdateCache, queryClient]);

  // 🎯 Handler principal para eventos SSE
  const handleEvent = useCallback((event: SSEEvent<any>) => {
    const { type } = event;

    if (REALTIME_CONFIG.debug && type !== 'heartbeat') {
      console.log('[Realtime] Procesando evento:', type, event);
    }

    switch (type) {
      case REALTIME_CONFIG.events.QR_SCANNED:
        handleQRScanned(event);
        break;
      case REALTIME_CONFIG.events.RESERVATION_CREATED:
        handleReservationCreated(event);
        break;
      case REALTIME_CONFIG.events.RESERVATION_UPDATED:
        handleReservationUpdated(event);
        break;
      case REALTIME_CONFIG.events.RESERVATION_DELETED:
        handleReservationDeleted(event);
        break;
      case REALTIME_CONFIG.events.STATUS_CHANGED:
        handleStatusChanged(event);
        break;
      case REALTIME_CONFIG.events.CONNECTED:
        if (REALTIME_CONFIG.debug) {
          console.log('[Realtime] ✅ Conectado al servidor SSE');
        }
        if (showToasts) {
          toast.success('Tiempo real activado', { duration: 2000 });
        }
        break;
      case REALTIME_CONFIG.events.HEARTBEAT:
        // Silencioso
        break;
      case REALTIME_CONFIG.events.ERROR:
        console.error('[Realtime] Error:', event.data);
        if (showToasts) {
          toast.error('Error en tiempo real', { duration: 3000 });
        }
        break;
      default:
        if (REALTIME_CONFIG.debug) {
          console.log('[Realtime] Evento desconocido:', type);
        }
    }
  }, [showToasts, handleQRScanned, handleReservationCreated, handleReservationUpdated, handleReservationDeleted, handleStatusChanged]);

  // Error handler
  const handleError = useCallback((error: Event) => {
    console.error('[Realtime] Error de conexión:', error);
    
    if (showToasts) {
      toast.error('Perdida conexión tiempo real', {
        duration: 3000
      });
    }
  }, [showToasts]);

  // Usar el hook de SSE
  const { status, error, reconnect, disconnect, isConnected } = useServerSentEvents({
    businessId,
    enabled: enabled && REALTIME_CONFIG.sse.enabled,
    onEvent: handleEvent,
    onError: handleError
  });

  return {
    status,
    error,
    reconnect,
    disconnect,
    isConnected,
    isRealtimeEnabled: REALTIME_CONFIG.sse.enabled && enabled
  };
}
