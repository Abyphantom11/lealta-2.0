import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentBusinessDay, type DayOfWeek } from '@/lib/business-day-utils';

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
      
      console.log(`🔄 Auto-refresh: Fetching portal config v2 for ${configBusinessId} at ${new Date().toLocaleTimeString()}`);
      
      const response = await fetch(
        `/api/portal/config-v2?businessId=${configBusinessId}&t=${timestamp}`,
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
        console.log(`✅ Config v2 (DB) updated successfully at ${new Date().toLocaleTimeString()}`);
        console.log('🔍 Raw API data:', {
          banners: data.banners?.length || 0,
          promociones: (data.promociones || data.promotions)?.length || 0,
          recompensas: (data.recompensas || data.rewards)?.length || 0,
          favoritoDelDia: (data.favoritoDelDia || data.favorites)?.length || 0
        });
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

  // ✅ NUEVA FUNCIÓN: Obtener promociones usando día comercial
  const getPromocionesForBusinessDay = useCallback(async () => {
    if (!config?.promociones && !config?.promotions) return [];
    
    const promociones = config.promociones || config.promotions || [];
    const todasActivas = promociones.filter((p: any) => p.activo !== false) || [];
    
    try {
      const diaComercial = await getCurrentBusinessDay(businessId);
      return todasActivas.filter((p: any) => {
        if (!p.dias || p.dias.length === 0) return true; // Sin restricción de días
        return p.dias.includes(diaComercial);
      });
    } catch (error) {
      console.error('Error obteniendo día comercial para promociones:', error);
      return todasActivas; // Fallback: mostrar todas las activas
    }
  }, [config, businessId]);

  // Función para obtener datos específicos con filtros (LEGACY - mantener compatibilidad)
  const getPromociones = useCallback((diaActual?: string) => {
    if (!config?.promociones && !config?.promotions) return [];
    
    const promociones = config.promociones || config.promotions || [];
    const todasActivas = promociones.filter((p: any) => p.activo !== false) || [];
    
    if (!diaActual) return todasActivas;
    
    // Filtrar por día específico
    return todasActivas.filter((p: any) => {
      if (!p.dias || p.dias.length === 0) return true; // Sin restricción de días
      return p.dias.includes(diaActual);
    });
  }, [config]);

  const getFavoritoDelDia = useCallback(async (diaActual?: string) => {
    const favoritoData = config?.favoritoDelDia || config?.favorites || [];
    if (!favoritoData || favoritoData.length === 0) return null;
    
    let diaParaBuscar = diaActual;
    
    // ✅ Si no se especifica día, usar día comercial
    if (!diaParaBuscar) {
      try {
        diaParaBuscar = await getCurrentBusinessDay(businessId);
      } catch (error) {
        console.error('Error obteniendo día comercial para favorito:', error);
        // Fallback a día natural
        const diasSemana: DayOfWeek[] = [
          'domingo', 'lunes', 'martes', 'miercoles', 
          'jueves', 'viernes', 'sabado'
        ];
        diaParaBuscar = diasSemana[new Date().getDay()];
      }
    }
    
    // Retornar el primer favorito activo que coincida con el día
    const favorito = favoritoData.find(
      (f: any) => f.activo !== false && (f.dia === diaParaBuscar || f.dia?.toLowerCase() === diaParaBuscar?.toLowerCase())
    ) || favoritoData[0]; // Fallback al primero si no hay coincidencia exacta
    
    return favorito;
  }, [config, businessId]);

  const getRecompensas = useCallback(() => {
    const recompensas = config?.recompensas || config?.rewards || [];
    return recompensas.filter((r: any) => r.activo !== false) || [];
  }, [config]);

  const getBanners = useCallback(() => {
    const banners = config?.banners || [];
    return banners.filter((b: any) => b.activo !== false) || [];
  }, [config]);

  return {
    config,
    isLoading,
    lastUpdate,
    refresh,
    getPromociones,
    getPromocionesForBusinessDay,
    getFavoritoDelDia,
    getRecompensas,
    getBanners,
  };
};
