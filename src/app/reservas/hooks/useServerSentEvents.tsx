import { useEffect, useRef, useState, useCallback } from 'react';
import { REALTIME_CONFIG } from '../utils/realtime-config';
import type { SSEEvent, ConnectionStatus } from '../types/realtime';

interface UseServerSentEventsOptions {
  businessId: number | string;
  enabled?: boolean;
  onEvent?: (event: SSEEvent<any>) => void;
  onError?: (error: Event) => void;
}

interface UseServerSentEventsReturn {
  status: ConnectionStatus;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

export function useServerSentEvents({
  businessId,
  enabled = true,
  onEvent,
  onError
}: UseServerSentEventsOptions): UseServerSentEventsReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalDisconnectRef = useRef(false);

  // Calcular delay de reconexión exponencial
  const getReconnectDelay = useCallback(() => {
    const attempt = reconnectAttemptsRef.current;
    const delays = REALTIME_CONFIG.sse.reconnection.delays;
    return delays[Math.min(attempt, delays.length - 1)];
  }, []);

  // Función para conectar SSE
  const connect = useCallback(() => {
    // No conectar si SSE está deshabilitado o no hay businessId
    if (!REALTIME_CONFIG.sse.enabled || !enabled || !businessId) {
      if (REALTIME_CONFIG.debug) {
        console.log('[SSE] Conexión no iniciada:', {
          enabled: REALTIME_CONFIG.sse.enabled && enabled,
          businessId
        });
      }
      return;
    }

    // Cerrar conexión existente si hay
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      setStatus('connecting');
      setError(null);
      isIntentionalDisconnectRef.current = false;

      const url = `${REALTIME_CONFIG.sse.endpoint}?businessId=${businessId}`;
      
      if (REALTIME_CONFIG.debug) {
        console.log('[SSE] Conectando a:', url, 'intento:', reconnectAttemptsRef.current + 1);
      }

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Evento: Conexión abierta
      eventSource.onopen = () => {
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset contador de intentos
        
        if (REALTIME_CONFIG.debug) {
          console.log('[SSE] ✅ Conectado exitosamente');
        }
      };

      // Evento: Mensaje recibido
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SSEEvent<any>;
          
          if (REALTIME_CONFIG.debug && data.type !== 'heartbeat') {
            console.log('[SSE] 📨 Evento recibido:', data.type, data);
          }

          // Callback del evento
          if (onEvent) {
            onEvent(data);
          }
        } catch (parseError) {
          console.error('[SSE] Error parseando evento:', parseError);
        }
      };

      // Evento: Error de conexión
      eventSource.onerror = (errorEvent) => {
        console.error('[SSE] ❌ Error de conexión:', errorEvent);
        
        setStatus('error');
        setError('Error de conexión SSE');
        
        // Cerrar la conexión actual
        eventSource.close();
        eventSourceRef.current = null;

        // Callback de error
        if (onError) {
          onError(errorEvent);
        }

        // Intentar reconexión automática si no fue desconexión intencional
        if (!isIntentionalDisconnectRef.current) {
          const maxAttempts = REALTIME_CONFIG.sse.reconnection.maxAttempts;
          
          if (reconnectAttemptsRef.current < maxAttempts) {
            const delay = getReconnectDelay();
            reconnectAttemptsRef.current += 1;
            
            setStatus('reconnecting');
            
            if (REALTIME_CONFIG.debug) {
              console.log(`[SSE] 🔄 Reconectando en ${delay}ms (intento ${reconnectAttemptsRef.current}/${maxAttempts})`);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            setStatus('disconnected');
            setError(`No se pudo reconectar después de ${maxAttempts} intentos`);
            
            if (REALTIME_CONFIG.debug) {
              console.log('[SSE] ⚠️ Máximo de intentos de reconexión alcanzado');
            }
          }
        }
      };

    } catch (err) {
      console.error('[SSE] Error al crear EventSource:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [businessId, enabled, onEvent, onError, getReconnectDelay]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    isIntentionalDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
      
      if (REALTIME_CONFIG.debug) {
        console.log('[SSE] 🔌 Desconectado manualmente');
      }
    }
  }, []);

  // Función para reconectar manualmente
  const reconnect = useCallback(() => {
    if (REALTIME_CONFIG.debug) {
      console.log('[SSE] 🔄 Reconexión manual solicitada');
    }
    
    reconnectAttemptsRef.current = 0;
    disconnect();
    
    // Pequeño delay antes de reconectar
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  // Effect: Conectar al montar o cuando cambien las dependencias
  useEffect(() => {
    connect();

    // Cleanup: Desconectar al desmontar
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    error,
    reconnect,
    disconnect,
    isConnected: status === 'connected'
  };
}
