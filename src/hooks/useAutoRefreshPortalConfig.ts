import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getCurrentBusinessDay, 
  isItemVisibleInBusinessDay,
  type DayOfWeek 
} from '@/lib/business-day-utils';
import { debugLog } from '@/lib/debug-utils';

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
        debugLog(`�️ DÍA COMERCIAL CAMBIÓ: ${lastFetchDay} → ${currentDay}`);
        debugLog('🔄 Forzando cache-bust para obtener datos frescos...');
      }
      
      debugLog(`�🔄 Auto-refresh: Fetching portal config v2 for ${configBusinessId} at ${new Date().toLocaleTimeString()}`);
      
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
        
        // ✅ CORRECCIÓN: Extraer los datos reales de la respuesta de la API
        const realData = data.data || data;
        debugLog('🔍 [useAutoRefreshPortalConfig] API response structure:', {
          hasSuccess: !!data.success,
          hasData: !!data.data,
          topLevelKeys: Object.keys(data),
          realDataKeys: Object.keys(realData)
        });
        
        setConfig(realData); // ✅ Usar los datos reales, no toda la respuesta
        setLastUpdate(new Date());
        setLastFetchDay(currentDay); // ✅ Actualizar el día del último fetch
        
        debugLog(`✅ Config v2 (DB) updated successfully at ${new Date().toLocaleTimeString()}`);
        debugLog('🔍 Raw API data:', {
          banners: realData.banners?.length || 0,
          promociones: (realData.promociones || realData.promotions)?.length || 0,
          recompensas: (realData.recompensas || realData.rewards)?.length || 0,
          favoritoDelDia: (realData.favoritoDelDia || realData.favorites)?.length || 0,
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
        debugLog('🗓️ ¡CAMBIO DE DÍA COMERCIAL DETECTADO!');
        debugLog(`   Anterior: ${lastFetchDay}`);
        debugLog(`   Actual: ${currentDay}`);
        debugLog('🔄 Refrescando configuración automáticamente...');
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

  // ✅ NUEVA FUNCIÓN: Obtener promociones usando día comercial y lógica centralizada
  const getPromocionesForBusinessDay = useCallback(async () => {
    if (!config?.promociones && !config?.promotions) return [];
    
    const promociones = config.promociones || config.promotions || [];
    const todasActivas = promociones.filter((p: any) => p.activo !== false) || [];
    
    try {
      // Filtrar usando la nueva lógica centralizada
      const promocionesVisibles = [];
      
      for (const promo of todasActivas) {
        // Convertir al formato DailyScheduledItem
        const item = {
          dia: promo.dia, // Usar dia singular
          horaTermino: promo.horaTermino,
          activo: promo.activo !== false
        };
        
        const visible = await isItemVisibleInBusinessDay(item, businessId);
        if (visible) {
          promocionesVisibles.push(promo);
        }
      }
      
      return promocionesVisibles;
    } catch (error) {
      console.error('Error obteniendo promociones para día comercial:', error);
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

  const getBannersForBusinessDay = useCallback(async () => {
    debugLog('🔍 [getBannersForBusinessDay] Iniciando función...');
    debugLog('🔍 [getBannersForBusinessDay] Config disponible:', !!config);
    debugLog('🔍 [getBannersForBusinessDay] BusinessId:', businessId);
    
    if (!config?.banners) {
      debugLog('❌ [getBannersForBusinessDay] No hay config.banners disponible');
      debugLog('🔍 [getBannersForBusinessDay] Config keys:', Object.keys(config || {}));
      debugLog('🔍 [getBannersForBusinessDay] Config completo:', config);
      return [];
    }
    
    const banners = config.banners || [];
    debugLog('🔍 [getBannersForBusinessDay] Banners raw del config:', banners.length);
    
    const todasActivas = banners.filter((b: any) => b.activo !== false && b.imagenUrl && b.imagenUrl.trim() !== '') || [];
    debugLog('🔍 [getBannersForBusinessDay] Banners activos con imagen:', todasActivas.length);
    
    if (todasActivas.length > 0) {
      todasActivas.forEach((banner: any, idx: number) => {
        debugLog(`   ${idx + 1}. "${banner.titulo}" - Día: ${banner.dia} - Activo: ${banner.activo}`);
      });
    }

    try {
      // Filtrar usando la nueva lógica centralizada
      const bannersVisibles = [];
      
      for (const banner of todasActivas) {
        // Convertir al formato DailyScheduledItem
        const item = {
          dia: banner.dia,
          horaPublicacion: banner.horaPublicacion,
          activo: banner.activo !== false
        };
        
        debugLog(`🔍 [getBannersForBusinessDay] Verificando "${banner.titulo}" con día: ${banner.dia}`);
        const visible = await isItemVisibleInBusinessDay(item, businessId);
        debugLog(`🔍 [getBannersForBusinessDay] "${banner.titulo}" visible: ${visible}`);
        
        if (visible) {
          bannersVisibles.push(banner);
        }
      }
      
      debugLog('✅ [getBannersForBusinessDay] Banners finales visibles:', bannersVisibles.length);
      return bannersVisibles;
    } catch (error) {
      console.error('❌ [getBannersForBusinessDay] Error obteniendo banners para día comercial:', error);
      return todasActivas; // Fallback: mostrar todos los activos
    }
  }, [config, businessId]);

  // ✅ NUEVA FUNCIÓN: Obtener favorito del día usando lógica centralizada (como banners)
  const getFavoritoForBusinessDay = useCallback(async () => {
    debugLog('🔍 [getFavoritoForBusinessDay] Iniciando función...');
    debugLog('🔍 [getFavoritoForBusinessDay] Config actual:', config);
    
    if (!config?.favoritoDelDia && !config?.favorites) {
      debugLog('❌ [getFavoritoForBusinessDay] No hay config.favoritoDelDia disponible');
      debugLog('🔍 [getFavoritoForBusinessDay] Keys del config:', Object.keys(config || {}));
      return null;
    }
    
    // El API devuelve favoritoDelDia como objeto único, no como array
    let favoritos = [];
    if (config.favoritoDelDia) {
      // Si es un objeto único, convertirlo a array
      favoritos = Array.isArray(config.favoritoDelDia) ? config.favoritoDelDia : [config.favoritoDelDia];
    } else if (config.favorites) {
      favoritos = Array.isArray(config.favorites) ? config.favorites : [config.favorites];
    }
    
    debugLog('🔍 [getFavoritoForBusinessDay] Favoritos procesados:', favoritos.length);
    debugLog('🔍 [getFavoritoForBusinessDay] Favoritos data:', favoritos);
    
    const todosActivos = favoritos.filter((f: any) => f && f.active !== false) || [];
    debugLog('🔍 [getFavoritoForBusinessDay] Favoritos activos:', todosActivos.length);

    try {
      // Filtrar usando la nueva lógica centralizada
      for (const favorito of todosActivos) {
        // Convertir al formato DailyScheduledItem
        const item = {
          dia: favorito.dia,
          horaPublicacion: favorito.horaPublicacion,
          activo: favorito.active !== false
        };
        
        debugLog(`🔍 [getFavoritoForBusinessDay] Verificando "${favorito.productName}" con día: ${favorito.dia}`);
        const visible = await isItemVisibleInBusinessDay(item, businessId);
        debugLog(`🔍 [getFavoritoForBusinessDay] "${favorito.productName}" visible: ${visible}`);
        
        if (visible) {
          debugLog('✅ [getFavoritoForBusinessDay] Favorito encontrado:', favorito.productName);
          return favorito;
        }
      }
      
      debugLog('⚠️ [getFavoritoForBusinessDay] Ningún favorito visible para el día actual');
      return null;
    } catch (error) {
      console.error('❌ [getFavoritoForBusinessDay] Error obteniendo favorito para día comercial:', error);
      return todosActivos[0] || null; // Fallback: devolver el primero activo
    }
  }, [config, businessId]);

  return {
    config,
    isLoading,
    lastUpdate,
    refresh,
    getPromociones,
    getPromocionesForBusinessDay,
    getFavoritoDelDia,
    getFavoritoForBusinessDay,
    getRecompensas,
    getBanners,
    getBannersForBusinessDay,
  };
};
