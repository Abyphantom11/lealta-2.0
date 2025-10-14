import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface UseVisitTrackingOptions {
  clienteId?: string;
  businessId?: string;
  enabled?: boolean;
  path?: string;
}

/**
 * Hook para trackear visitas automáticamente
 * Se ejecuta una vez por sesión pero permite recargas cada 5 minutos
 */
export const useVisitTracking = (options: UseVisitTrackingOptions = {}) => {
  const { clienteId, businessId, enabled = true, path = '/cliente' } = options;
  const lastVisitTime = useRef<number>(0);
  const sessionId = useRef<string>('');

  useEffect(() => {
    // No trackear si está deshabilitado
    if (!enabled) return;

    // Generar sessionId único si no existe
    if (!sessionId.current) {
      // Intentar recuperar de sessionStorage primero
      const existingSessionId = sessionStorage.getItem('visit_session_id');
      if (existingSessionId) {
        sessionId.current = existingSessionId;
      } else {
        sessionId.current = uuidv4();
        sessionStorage.setItem('visit_session_id', sessionId.current);
      }
    }

    // Verificar si han pasado al menos 5 minutos desde la última visita
    const now = Date.now();
    const timeSinceLastVisit = now - lastVisitTime.current;
    const minInterval = 5 * 60 * 1000; // 5 minutos

    if (timeSinceLastVisit < minInterval) {
      console.log('📊 Visita no registrada - muy reciente');
      return;
    }

    const registrarVisita = async () => {
      try {
        const visitData = {
          sessionId: sessionId.current,
          clienteId: clienteId || undefined,
          businessId: businessId || undefined,
          path,
          referrer: document.referrer || undefined
        };

        console.log('📊 Registrando visita:', visitData);

        const response = await fetch('/api/cliente/visitas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visitData)
        });

        if (response.ok) {
          lastVisitTime.current = now;
          console.log('📊 Visita registrada exitosamente');
        } else {
          console.warn('⚠️ Error registrando visita:', response.status);
        }
      } catch (error) {
        console.warn('⚠️ Error de red registrando visita:', error);
      }
    };

    // Registrar visita después de un pequeño delay para asegurar que la página se cargó
    const timer = setTimeout(registrarVisita, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [clienteId, businessId, enabled, path]); // Re-ejecutar si cambia clienteId o businessId (login/logout)

  return {
    sessionId: sessionId.current,
    isTracking: enabled
  };
};
