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
  const [lastFetchDay, setLastFetchDay] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * ✅ SOLUCIÓN: Calcular el día comercial actual (considerando hora de reseteo a las 4 AM)
   */
  const getCurrentBusinessDayKey = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    
    // Si es antes de las 4 AM, consideramos que aún es el día anterior
    if (hour < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toDateString();
    }
    
    return now.toDateString();
  }, []);

  const fetchConfig = useCallback(async (showLoading = true) => {
    if (!enabled) return;
    
    if (showLoading) setIsLoading(true);
    
    try {
      const configBusinessId = businessId || 'default';
      const timestamp = new Date().getTime();
      
      // ✅ Detectar si cambió el día comercial
      const currentDay = getCurrentBusinessDayKey();
      const dayChanged = lastFetchDay !== '' && currentDay !== lastFetchDay;
      
      if (dayChanged) {
        console.log(`�️ DÍA COMERCIAL CAMBIÓ: ${lastFetchDay} → ${currentDay}`);
        console.log('🔄 Forzando cache-bust para obtener datos frescos...');
      }
      
      console.log(`�🔄 Auto-refresh: Fetching portal config v2 for ${configBusinessId} at ${new Date().toLocaleTimeString()}`);
      
      const response = await fetch(
        `/api/portal/config-v2?businessId=${configBusinessId}&t=${timestamp}&dayKey=${currentDay}`,
        {
          // ✅ Si cambió el día, forzar reload completo ignorando cualquier cache
          cache: dayChanged ? 'reload' : 'no-store',
          headers: {
            'Cache-Control': dayChanged ? 'no-cache, must-revalidate, max-age=0' : 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setLastUpdate(new Date());
        setLastFetchDay(currentDay); // ✅ Actualizar el día del último fetch
        
        console.log(`✅ Config v2 (DB) updated successfully at ${new Date().toLocaleTimeString()}`);
        console.log('🔍 Raw API data:', {
          banners: data.banners?.length || 0,
          promociones: (data.promociones || data.promotions)?.length || 0,
          recompensas: (data.recompensas || data.rewards)?.length || 0,
          favoritoDelDia: (data.favoritoDelDia || data.favorites)?.length || 0,
          businessDay: currentDay
        });
      } else {
        console.error('❌ Error fetching config:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching portal config:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [businessId, enabled, lastFetchDay, getCurrentBusinessDayKey]);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    fetchConfig(false);
  }, [fetchConfig]);

  useEffect(() => {
    if (!enabled) return;

    // Fetch inicial
    fetchConfig(true);

    // ✅ Configurar detector de cambio de día (verifica cada minuto)
    const dayCheckInterval = setInterval(() => {
      const currentDay = getCurrentBusinessDayKey();
      
      // Si el día cambió, forzar refresh inmediato
      if (lastFetchDay !== '' && currentDay !== lastFetchDay) {
        console.log('🗓️ ¡CAMBIO DE DÍA COMERCIAL DETECTADO!');
        console.log(`   Anterior: ${lastFetchDay}`);
        console.log(`   Actual: ${currentDay}`);
        console.log('🔄 Refrescando configuración automáticamente...');
        fetchConfig(false);
      }
    }, 60000); // Verificar cada minuto

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
      clearInterval(dayCheckInterval);
    };
  }, [fetchConfig, refreshInterval, enabled, getCurrentBusinessDayKey, lastFetchDay]);

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
