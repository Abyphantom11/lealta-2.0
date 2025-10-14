'use client';

import { useSmartPolling } from '../hooks/useSmartPolling';

interface RealtimeUpdateNotifierProps {
  businessId: string;
  onUpdateDetected?: () => void;
  enabled?: boolean;
  interval?: number;
}

export function RealtimeUpdateNotifier({ 
  businessId, 
  onUpdateDetected,
  enabled = true,
  interval = 30000 // 30 segundos por defecto
}: RealtimeUpdateNotifierProps) {
  
  // Usar el hook de polling inteligente
  const { isChecking } = useSmartPolling({
    businessId,
    onUpdate: onUpdateDetected,
    interval,
    enabled,
    onlyWhenVisible: true // Solo verificar cuando la ventana está visible
  });

  // Mostrar indicador de verificación en desarrollo (opcional)
  if (process.env.NODE_ENV === 'development' && isChecking) {
    console.log('🔄 Verificando actualizaciones...');
  }

  return null; // Este componente no renderiza nada visible
}
