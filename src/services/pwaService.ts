// PWA Service - Sistema limpio para instalación nativa
import { clientNotificationService } from './clientNotificationService';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Inicializar el servicio PWA
export const initializePWA = () => {
  // Registrar Service Worker
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  }

  // Escuchar evento de instalación nativo
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que se muestre automáticamente
    e.preventDefault();
    // Guardar el evento para uso posterior
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('📱 PWA instalable detectada - evento guardado');
    
    // NO crear notificación automáticamente
    // La notificación se creará cuando el usuario esté más familiarizado con la app
  });

  // Evento cuando la app se instala
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA instalada exitosamente');
    deferredPrompt = null;
  });
};

// Verificar si la PWA puede instalarse
export const canInstallPWA = (): boolean => {
  return deferredPrompt !== null;
};

// Función para mostrar notificación de PWA cuando sea apropiado
export const showPWANotificationIfAvailable = () => {
  console.log('🔍 showPWANotificationIfAvailable called');
  console.log('🔍 canInstallPWA():', canInstallPWA());
  console.log('🔍 isPWAInstalled():', isPWAInstalled());
  console.log('🔍 deferredPrompt:', deferredPrompt);

  if (canInstallPWA() && !isPWAInstalled()) {
    console.log('✅ Creando notificación PWA');
    clientNotificationService.notifyPWAInstall();
  } else {
    console.log('❌ No se creó notificación PWA - condiciones no cumplidas');
  }
};

// Instalar PWA usando el prompt nativo del navegador
export const installPWA = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('❌ No hay prompt de instalación disponible');
    return false;
  }

  try {
    // Mostrar el prompt nativo del navegador
    await deferredPrompt.prompt();
    
    // Esperar la decisión del usuario
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ Usuario aceptó instalar la PWA');
      deferredPrompt = null;
      return true;
    } else {
      console.log('❌ Usuario rechazó instalar la PWA');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al instalar PWA:', error);
    return false;
  }
};

// Verificar si ya está instalada
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as any).standalone === true;
};
