import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAutoRefreshOptions {
  businessId?: string;
  refreshInterval?: number; // en milisegundos
  enabled?: boolean;
}

/**
 * Hook para auto-refrescar configuración del portal con cache-busting
 * Se actualiza automáticamente para sincronizar cambios admin → cliente
 */
export const useAutoRefreshPortalConfig = (options: UseAutoRefreshOptions = {}) => {
  const { businessId, refreshInterval = 30000, enabled = true } = options; // 30 segundos por defecto
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConfig = useCallback(async (showLoading = true) => {
    if (!enabled) return;
    
    if (showLoading) setIsLoading(true);
    
    try {
      const configBusinessId = businessId || 'default';
      const timestamp = new Date().getTime();
      
      console.log(`🔄 Auto-refresh: Fetching portal config for ${configBusinessId} at ${new Date().toLocaleTimeString()}`);
      
      const response = await fetch(
        `/api/portal/config?businessId=${configBusinessId}&t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setLastUpdate(new Date());
        console.log(`✅ Config updated successfully at ${new Date().toLocaleTimeString()}`);
      } else {
        console.error('❌ Error fetching config:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching portal config:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [businessId, enabled]);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    fetchConfig(false);
  }, [fetchConfig]);

  useEffect(() => {
    if (!enabled) return;

    // Fetch inicial
    fetchConfig(true);

    // Configurar polling automático
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchConfig(false); // No mostrar loading en updates automáticos
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchConfig, refreshInterval, enabled]);

  // Función para obtener datos específicos con filtros
  const getPromociones = useCallback((diaActual?: string) => {
    if (!config?.config?.promociones) return [];
    
    const todasActivas = config.config.promociones.filter((p: any) => p.activo) || [];
    
    if (!diaActual) return todasActivas;
    
    // Filtrar por día específico
    return todasActivas.filter((p: any) => {
      if (!p.dias || p.dias.length === 0) return true; // Sin restricción de días
      return p.dias.includes(diaActual);
    });
  }, [config]);

  const getFavoritoDelDia = useCallback((diaActual: string) => {
    if (!config?.config?.favoritoDelDia) return null;
    
    return config.config.favoritoDelDia.find(
      (f: any) => f.activo && f.dia === diaActual
    );
  }, [config]);

  const getRecompensas = useCallback(() => {
    if (!config?.config) return [];
    
    const recompensasData = config.config.recompensas || config.config.rewards || [];
    return recompensasData.filter((r: any) => r.activo || r.isActive) || [];
  }, [config]);

  return {
    config,
    isLoading,
    lastUpdate,
    refresh,
    getPromociones,
    getFavoritoDelDia,
    getRecompensas,
  };
};
