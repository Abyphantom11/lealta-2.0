'use client';
import { useEffect, useState, useCallback } from 'react';

interface UseSSEProps {
  onBannerUpdate?: () => void;
  onPromotionUpdate?: () => void;
  onMenuUpdate?: () => void;
}

export function useSSE({
  onBannerUpdate,
  onPromotionUpdate,
  onMenuUpdate,
}: UseSSEProps = {}) {
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const connectToStream = useCallback(() => {
    console.log('🔄 Iniciando conexión SSE...');
    setConnectionStatus('connecting');

    const eventSource = new EventSource('/api/admin/portal-config/stream', {
      withCredentials: false,
    });

    eventSource.addEventListener('open', () => {
      console.log('✅ SSE: Conexión exitosa establecida');
      setConnectionStatus('connected');
      setLastUpdate(new Date());
    });

    eventSource.addEventListener('message', event => {
      console.log('📡 SSE: Mensaje recibido:', event.data);

      try {
        const data = JSON.parse(event.data);
        setLastUpdate(new Date());

        switch (data.type) {
          case 'banners':
            console.log('🎯 SSE: Actualizando banners...');
            onBannerUpdate?.();
            break;
          case 'promociones':
            console.log('🎯 SSE: Actualizando promociones...');
            onPromotionUpdate?.();
            break;
          case 'menu':
            console.log('🎯 SSE: Actualizando menú...');
            onMenuUpdate?.();
            break;
          case 'config':
          case 'config-update':
            console.log(
              '🎯 SSE: Configuración actualizada:',
              data.section || 'general'
            );
            // Ejecutar todas las actualizaciones para cambios generales
            onBannerUpdate?.();
            onPromotionUpdate?.();
            onMenuUpdate?.();
            break;
          default:
            console.log(
              '🎯 SSE: Tipo de actualización desconocido:',
              data.type
            );
        }
      } catch (error) {
        console.log('⚠️ SSE: Error parseando mensaje:', error);
      }
    });

    eventSource.addEventListener('error', event => {
      console.error('❌ SSE: Error en la conexión:', event);
      setConnectionStatus('disconnected');

      // Reintentar conexión después de 3 segundos
      setTimeout(() => {
        console.log('🔄 SSE: Reintentando conexión...');
        connectToStream();
      }, 3000);
    });

    return eventSource;
  }, [onBannerUpdate, onPromotionUpdate, onMenuUpdate]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    // Solo conectar si estamos en el cliente
    if (typeof window !== 'undefined') {
      eventSource = connectToStream();
    }

    return () => {
      if (eventSource) {
        console.log('🔌 SSE: Cerrando conexión');
        eventSource.close();
      }
    };
  }, [connectToStream]);

  return {
    connectionStatus,
    lastUpdate,
    isConnected: connectionStatus === 'connected',
  };
}
