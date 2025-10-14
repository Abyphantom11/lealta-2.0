/**
 * 🎯 COMPONENTE PWA DISCRETO PARA CLIENTE
 * 
 * Se integra con el notification box existente en /cliente
 * Detecta automáticamente si PWA está disponible y notifica de manera discreta
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePWAContext } from '@/providers/PWAProvider';
import { useClientNotifications } from '@/services/clientNotificationService';

interface PWANotificationTriggerProps {
  clienteId?: string;
  enabled?: boolean;
}

export function PWANotificationTrigger({ 
  clienteId, 
  enabled = true 
}: PWANotificationTriggerProps) {
  const pathname = usePathname();
  const { state, isInitialized } = usePWAContext();
  const { notifyPWAInstall } = useClientNotifications(clienteId);

  useEffect(() => {
    if (!enabled || !isInitialized) return;
    
    // Solo activar en rutas de cliente
    const isClienteRoute = pathname.includes('/cliente');
    if (!isClienteRoute) return;

    // Solo activar si PWA está disponible pero no instalado
    if (state.isInstallable && !state.isInstalled && !state.isStandalone) {
      // Detectar Chrome/Edge que soporte instalación
      const isChromium = /Chrome|Chromium|Edge/.test(navigator.userAgent);
      
      if (isChromium && state.deferredPrompt) {
        // Esperar un poco después de que el usuario esté en la pantalla
        const timer = setTimeout(() => {
          notifyPWAInstall();
        }, 3000); // 3 segundos después de llegar a /cliente

        return () => clearTimeout(timer);
      }
    }
  }, [pathname, state, isInitialized, enabled, notifyPWAInstall]);

  // Este componente no renderiza nada visible
  return null;
}

export default PWANotificationTrigger;
