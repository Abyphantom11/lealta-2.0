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
    // ✅ SEGURIDAD: Solo conectar si estamos en la ruta de reservas
    if (typeof globalThis.window !== 'undefined' && !globalThis.window.location.pathname.includes('/reservas')) {
      if (REALTIME_CONFIG.debug) {
        console.log('[SSE] Conexión bloqueada: No estamos en ruta de reservas');
      }
      return;
    }

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

      // Usar fetch con credentials en lugar de EventSource nativo
      // Esto asegura que las cookies de sesión se envíen correctamente
      fetch(url, {
        method: 'GET',
        credentials: 'include', // ⚡ Crucial: Incluir cookies de sesión
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        if (REALTIME_CONFIG.debug) {
          console.log('[SSE] ✅ Conectado exitosamente');
        }

        // Leer el stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Guardar referencia para poder cerrar
        const streamController = {
          close: () => {
            reader.cancel();
          }
        };
        eventSourceRef.current = streamController as any;

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            if (REALTIME_CONFIG.debug) {
              console.log('[SSE] Stream cerrado por servidor');
            }
            break;
          }

          // Decodificar chunk
          buffer += decoder.decode(value, { stream: true });
          
          // Procesar mensajes completos (terminan en \n\n)
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || ''; // Guardar el último fragmento incompleto

          for (const message of messages) {
            if (!message.trim()) continue;
            
            // Parsear líneas del mensaje SSE
            const lines = message.split('\n');
            let eventData = '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                eventData = line.substring(6);
                break;
              }
            }

            if (eventData) {
              try {
                const data = JSON.parse(eventData) as SSEEvent<any>;
                
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
            }
          }
        }

        // Stream terminado
        if (!isIntentionalDisconnectRef.current) {
          setStatus('error');
          setError('Conexión cerrada por servidor');
          
          // Intentar reconexión
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
          }
        }

      }).catch((error) => {
        console.error('[SSE] ❌ Error de conexión:', error);
        
        setStatus('error');
        setError(error.message || 'Error de conexión SSE');
        
        if (onError) {
          onError(error);
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
      });

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
