'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface PollingConfig {
  businessId: string;
  onUpdate?: () => void;
  interval?: number; // en milisegundos
  enabled?: boolean;
  onlyWhenVisible?: boolean; // Solo hacer polling cuando la ventana está visible
}

interface UpdateStatus {
  hasChanges: boolean;
  lastUpdate: string;
  changedCount?: number;
  message?: string;
}

export function useSmartPolling({
  businessId,
  onUpdate,
  interval = 30000, // 30 segundos por defecto
  enabled = true,
  onlyWhenVisible = true
}: PollingConfig) {
  const [lastKnownUpdate, setLastKnownUpdate] = useState<string>(new Date().toISOString());
  const [isChecking, setIsChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Función para verificar actualizaciones
  const checkForUpdates = useCallback(async () => {
    if (!enabled || !businessId || isChecking) return;
    
    // Si está configurado para solo verificar cuando es visible, y no lo está, salir
    if (onlyWhenVisible && !isVisible) return;

    try {
      setIsChecking(true);
      
      const response = await fetch(
        `/api/reservas/check-updates?businessId=${businessId}&since=${lastKnownUpdate}`,
        { 
          // Evitar cache para obtener datos frescos
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        }
      );

      if (!response.ok) {
        console.warn('❌ Error verificando actualizaciones:', response.status);
        return;
      }

      const data: UpdateStatus = await response.json();

      if (data.hasChanges && data.changedCount && data.changedCount > 0) {
        // Actualizar timestamp conocido
        setLastKnownUpdate(data.lastUpdate);
        
        // Mostrar notificación discreta
        toast.success(
          `🔄 ${data.changedCount} reserva(s) actualizada(s)`,
          {
            duration: 2000,
            position: 'bottom-right',
            className: 'bg-blue-600 text-white border-0',
          }
        );

        // Notificar al componente padre
        onUpdate?.();
      }

    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      // No mostrar toast de error para no molestar al usuario
    } finally {
      setIsChecking(false);
    }
  }, [businessId, enabled, isChecking, isVisible, lastKnownUpdate, onUpdate, onlyWhenVisible]);

  // Función para iniciar el polling
  const startPolling = useCallback(() => {
    // Limpiar cualquier polling existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!enabled || !businessId) return;

    // Primera verificación después de 2 segundos
    timeoutRef.current = setTimeout(checkForUpdates, 2000);

    // Polling regular
    intervalRef.current = setInterval(checkForUpdates, interval);
  }, [businessId, enabled, interval, checkForUpdates]);

  // Función para detener el polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Detectar visibilidad de la ventana
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible && onlyWhenVisible) {
        // Verificar inmediatamente cuando se vuelve visible
        setTimeout(checkForUpdates, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkForUpdates, onlyWhenVisible]);

  // Iniciar/detener polling cuando cambian las props
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  // Verificación manual (útil para llamar después de acciones)
  const checkNow = useCallback(() => {
    if (!isChecking) {
      checkForUpdates();
    }
  }, [checkForUpdates, isChecking]);

  return {
    isChecking,
    lastKnownUpdate,
    checkNow,
    startPolling,
    stopPolling,
  };
}
