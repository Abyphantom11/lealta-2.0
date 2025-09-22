'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { shouldShowPWAForRoute } from '@/hooks/usePWAConditional';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Manager centralizado para PWA que previene el prompt nativo 
 * en rutas excluidas y gestiona el evento de forma unificada
 */
export default function PWAManager() {
  const pathname = usePathname();

  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      const shouldShow = shouldShowPWAForRoute(pathname);
      
      console.log(`🔧 PWA Manager: beforeinstallprompt en ${pathname} → ${shouldShow ? 'PERMITIR' : 'BLOQUEAR'}`);
      
      if (!shouldShow) {
        // ⛔ BLOQUEAR: Prevenir el prompt nativo en rutas excluidas
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log(`❌ PWA bloqueado en ruta excluida: ${pathname}`);
        return;
      }

      // ✅ PERMITIR: Gestionar prompt en rutas permitidas
      e.preventDefault(); // Prevenir prompt automático del navegador
      deferredPrompt = e as BeforeInstallPromptEvent;
      
      // Guardar en window para acceso global (compatibilidad con componentes existentes)
      (window as any).deferredPrompt = deferredPrompt;
      
      // Disparar evento personalizado para componentes que lo escuchen
      window.dispatchEvent(new CustomEvent('pwa-installable', {
        detail: { prompt: deferredPrompt, pathname }
      }));
      
      console.log(`✅ PWA preparado para instalación en: ${pathname}`);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA instalada exitosamente');
      deferredPrompt = null;
      (window as any).deferredPrompt = null;
      
      // Disparar evento de instalación completada
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    };

    // Registrar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [pathname]);

  return null; // No renderiza nada, solo gestiona eventos
}

/**
 * Función utilitaria para activar la instalación PWA manualmente
 */
export const triggerPWAInstall = async (): Promise<boolean> => {
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (!deferredPrompt) {
    console.warn('⚠️ No hay prompt PWA disponible para instalación');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ Usuario aceptó instalar PWA');
      (window as any).deferredPrompt = null;
      return true;
    } else {
      console.log('❌ Usuario rechazó instalar PWA');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al mostrar prompt PWA:', error);
    return false;
  }
};
