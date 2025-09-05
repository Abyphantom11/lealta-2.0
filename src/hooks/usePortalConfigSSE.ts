import { useEffect, useRef, useState } from 'react';

interface SSEConfig {
  type: 'initial-config' | 'config-update' | 'heartbeat';
  config?: any;
  timestamp: number;
}

interface UsePortalConfigSSEOptions {
  onConfigUpdate?: (config: any) => void;
  enabled?: boolean;
}

export function usePortalConfigSSE({ onConfigUpdate, enabled = true }: UsePortalConfigSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const connect = () => {
    if (!enabled || eventSourceRef.current) return;
    
    console.log('🔌 Conectando SSE para actualizaciones de configuración...');
    
    try {
      const eventSource = new EventSource('/api/admin/portal-config/stream');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('✅ SSE conectado exitosamente');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data: SSEConfig = JSON.parse(event.data);
          
          switch (data.type) {
            case 'initial-config':
              console.log('🎯 Configuración inicial recibida via SSE');
              if (data.config && onConfigUpdate) {
                onConfigUpdate(data.config);
              }
              setLastUpdate(data.timestamp);
              break;
              
            case 'config-update':
              console.log('🔄 Actualización de configuración recibida via SSE');
              if (data.config && onConfigUpdate) {
                onConfigUpdate(data.config);
              }
              setLastUpdate(data.timestamp);
              break;
              
            case 'heartbeat':
              console.log('💓 Heartbeat SSE recibido');
              break;
          }
        } catch (error) {
          console.error('❌ Error parsing SSE data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        setIsConnected(false);
        
        // Intentar reconectar con backoff exponencial
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(`🔄 Reintentando conexión SSE en ${delay}ms (intento ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            eventSource.close();
            eventSourceRef.current = null;
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.log('❌ Máximo de reintentos SSE alcanzado. Desconectando.');
          eventSource.close();
          eventSourceRef.current = null;
        }
      };
      
    } catch (error) {
      console.error('❌ Error creando conexión SSE:', error);
      setIsConnected(false);
    }
  };
  
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      console.log('🔌 Desconectando SSE...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  };
  
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    
    return disconnect;
  }, [enabled]);
  
  // Reconectar cuando la ventana vuelve al foco
  useEffect(() => {
    const handleFocus = () => {
      if (enabled && !eventSourceRef.current) {
        console.log('👁️ Ventana enfocada - reconectando SSE...');
        connect();
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && !eventSourceRef.current) {
        console.log('👁️ Página visible - reconectando SSE...');
        connect();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
  
  return {
    isConnected,
    lastUpdate,
    connect,
    disconnect,
  };
}
