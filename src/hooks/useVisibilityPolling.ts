import { useEffect, useRef, useCallback, useState } from 'react';

interface PollingOptions {
  interval: number;
  enabled?: boolean;
  immediate?: boolean;
}

/**
 * Hook para polling inteligente que se pausa cuando el tab no está visible
 * Esto reduce significativamente los edge requests cuando el usuario no está activo
 * ENHANCED v2.2: Incluye detección de red para pausar en conexiones pobres
 */
export const useVisibilityPolling = (
  callback: () => void | Promise<void>,
  options: PollingOptions
) => {
  const { interval, enabled = true, immediate = true } = options;
  const { isGoodConnection } = useNetworkStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Mantener callback actualizado
  callbackRef.current = callback;

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      // Solo ejecutar si el tab está visible Y la conexión es buena
      if (!document.hidden && isGoodConnection) {
        callbackRef.current();
      }
    }, interval);
  }, [interval, isGoodConnection]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden || !isGoodConnection) {
      // Tab inactivo o conexión pobre - pausar polling
      stopPolling();
    } else {
      // Tab activo y buena conexión - ejecutar callback inmediatamente y reanudar polling
      callbackRef.current();
      startPolling();
    }
  }, [startPolling, stopPolling, isGoodConnection]);

  useEffect(() => {
    if (!enabled || !isGoodConnection) {
      stopPolling();
      return;
    }

    // Ejecutar inmediatamente si está habilitado y hay buena conexión
    if (immediate) {
      callbackRef.current();
    }

    // Iniciar polling
    startPolling();

    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, immediate, startPolling, stopPolling, handleVisibilityChange, isGoodConnection]);

  return {
    startPolling,
    stopPolling,
    isPolling: intervalRef.current !== null,
  };
};

/**
 * Hook para detectar el estado de la red
 * Pausa polling cuando la conexión es pobre
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
      
      // Detectar tipo de conexión si está disponible
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Escuchar cambios en la conexión si está disponible
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  const isGoodConnection = isOnline && (connectionType === 'unknown' || !['slow-2g', '2g'].includes(connectionType));

  return {
    isOnline,
    connectionType,
    isGoodConnection
  };
};

/**
 * Hook para polling con backoff exponencial ENHANCED v2.3
 * Útil para APIs que pueden fallar temporalmente
 * Ajusta dinámicamente el intervalo basado en éxitos/fallos
 */
export const useExponentialBackoffPolling = (
  callback: () => Promise<boolean>, // Retorna true si fue exitoso
  options: {
    baseInterval: number;
    maxInterval: number;
    backoffMultiplier?: number;
    maxConsecutiveFailures?: number;
    enabled?: boolean;
    resetOnSuccess?: boolean;
  }
) => {
  const { 
    baseInterval, 
    maxInterval, 
    backoffMultiplier = 2, 
    maxConsecutiveFailures = 5,
    enabled = true,
    resetOnSuccess = true
  } = options;
  
  const [currentInterval, setCurrentInterval] = useState(baseInterval);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [isBackingOff, setIsBackingOff] = useState(false);
  const callbackRef = useRef(callback);

  // Mantener callback actualizado
  callbackRef.current = callback;

  // Calcular nuevo intervalo basado en fallos
  const calculateInterval = useCallback((failures: number) => {
    if (failures === 0) return baseInterval;
    
    const exponentialInterval = baseInterval * Math.pow(backoffMultiplier, failures);
    return Math.min(exponentialInterval, maxInterval);
  }, [baseInterval, maxInterval, backoffMultiplier]);

  // Wrapper del callback con lógica de backoff
  const wrappedCallback = useCallback(async (): Promise<void> => {
    try {
      const success = await callbackRef.current();
      
      if (success) {
        // Éxito: resetear contador y volver al intervalo base
        if (resetOnSuccess && consecutiveFailures > 0) {
          setConsecutiveFailures(0);
          setCurrentInterval(baseInterval);
          setIsBackingOff(false);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Backoff reset - volviendo al intervalo base:', baseInterval);
          }
        }
      } else {
        // Fallo: incrementar contador y ajustar intervalo
        const newFailures = consecutiveFailures + 1;
        setConsecutiveFailures(newFailures);
        
        if (newFailures <= maxConsecutiveFailures) {
          const newInterval = calculateInterval(newFailures);
          setCurrentInterval(newInterval);
          setIsBackingOff(true);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`⚠️ Backoff activado - fallo ${newFailures}/${maxConsecutiveFailures}, nuevo intervalo: ${newInterval}ms`);
          }
        } else {
          // Demasiados fallos consecutivos - pausar temporalmente
          if (process.env.NODE_ENV === 'development') {
            console.log(`🛑 Demasiados fallos consecutivos (${newFailures}), pausando polling temporalmente`);
          }
        }
      }
    } catch (error) {
      console.error('Error in exponential backoff polling:', error);
      
      const newFailures = consecutiveFailures + 1;
      setConsecutiveFailures(newFailures);
      
      if (newFailures <= maxConsecutiveFailures) {
        const newInterval = calculateInterval(newFailures);
        setCurrentInterval(newInterval);
        setIsBackingOff(true);
      }
    }
  }, [consecutiveFailures, maxConsecutiveFailures, calculateInterval, baseInterval, resetOnSuccess]);

  // Usar useVisibilityPolling con intervalo dinámico
  const { startPolling, stopPolling, isPolling } = useVisibilityPolling(
    wrappedCallback,
    {
      interval: currentInterval,
      enabled: enabled && consecutiveFailures <= maxConsecutiveFailures,
      immediate: false
    }
  );

  // Función para resetear manualmente el backoff
  const resetBackoff = useCallback(() => {
    setConsecutiveFailures(0);
    setCurrentInterval(baseInterval);
    setIsBackingOff(false);
  }, [baseInterval]);

  // Función para forzar un intento inmediato
  const retryNow = useCallback(async () => {
    await wrappedCallback();
    if (!isPolling) {
      startPolling();
    }
  }, [wrappedCallback, isPolling, startPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling,
    currentInterval,
    consecutiveFailures,
    isBackingOff,
    resetBackoff,
    retryNow,
    isMaxFailuresReached: consecutiveFailures > maxConsecutiveFailures
  };
};

/**
 * Hook para polling adaptativo ENHANCED v2.3
 * Combina visibilidad, detección de red y backoff exponencial
 * Ideal para APIs críticas que necesitan máxima resiliencia
 */
export const useAdaptivePolling = (
  callback: () => Promise<boolean>,
  options: {
    baseInterval: number;
    maxInterval?: number;
    backoffMultiplier?: number;
    maxConsecutiveFailures?: number;
    enabled?: boolean;
    enableBackoff?: boolean;
  }
) => {
  const {
    baseInterval,
    maxInterval = baseInterval * 8, // Default: 8x el intervalo base
    backoffMultiplier = 2,
    maxConsecutiveFailures = 3, // Más conservador para APIs críticas
    enabled = true,
    enableBackoff = true
  } = options;

  // Usar hooks incondicionalmente
  const simplePolling = useVisibilityPolling(
    async () => {
      try {
        await callback();
      } catch (error) {
        console.error('Error in adaptive polling:', error);
      }
    },
    {
      interval: baseInterval,
      enabled: enabled && !enableBackoff,
      immediate: false
    }
  );

  const backoffPolling = useExponentialBackoffPolling(callback, {
    baseInterval,
    maxInterval,
    backoffMultiplier,
    maxConsecutiveFailures,
    enabled: enabled && enableBackoff,
    resetOnSuccess: true
  });

  // Retornar según la configuración
  return enableBackoff ? backoffPolling : simplePolling;
};