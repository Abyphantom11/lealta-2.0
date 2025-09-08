import { logger } from '@/utils/logger';

// Definir la interfaz para el evento de instalación PWA - EXTRAÍDA DEL ORIGINAL
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
}

// Función para instalar la aplicación PWA - EXTRAÍDA DEL ORIGINAL
export const installApp = (
  deferredPrompt: BeforeInstallPromptEvent | null,
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void,
  setError: (error: string) => void
) => {
  try {
    // Mostrar el diálogo de instalación si está disponible mediante PWA
    if (deferredPrompt) {
      deferredPrompt.prompt();
      
      // Usar then para manejar la promesa de userChoice
      deferredPrompt.userChoice
        .then((choiceResult: {outcome: string}) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('El usuario aceptó instalar la app');
            logger.log('✅ PWA instalada exitosamente');
            // Limpiar el prompt guardado después de usarlo
            setDeferredPrompt(null);
          } else {
            console.log('El usuario rechazó instalar la app');
            logger.log('❌ Instalación PWA cancelada');
          }
          // Limpiar el prompt guardado
          setDeferredPrompt(null);
        })
        .catch((error: Error) => {
          console.error('Error al instalar la app:', error);
          setError('No se pudo instalar la app. Intenta nuevamente más tarde.');
          setTimeout(() => setError(''), 3000);
        });
    } else {
      attemptManualInstall(setError);
    }
  } catch (error) {
    console.error('Error al instalar la app:', error);
    setError('Hubo un problema al instalar la app. Intenta más tarde.');
    setTimeout(() => setError(''), 3000);
  }
};

// Función para intentar instalación manual - EXTRAÍDA DEL ORIGINAL
export const attemptManualInstall = (setError: (error: string) => void) => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  try {
    // Para Safari en iOS
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      // Usar Web Share API si está disponible
      if (navigator.share) {
        navigator.share({
          title: 'Lealta 2.0',
          text: 'Agregar Lealta 2.0 a tu pantalla de inicio',
          url: window.location.href
        })
        .then(() => {
          logger.log('✅ Contenido compartido exitosamente');
        })
        .catch((error: Error) => {
          console.error('Error al compartir:', error);
          showInstallInstructions(setError);
        });
      } else {
        showInstallInstructions(setError);
      }
    } else {
      showInstallInstructions(setError);
    }
  } catch (error) {
    console.error('Error en instalación manual:', error);
    showInstallInstructions(setError);
  }
};

// Función para mostrar instrucciones según el dispositivo - EXTRAÍDA DEL ORIGINAL
export const showInstallInstructions = (setError: (error: string) => void) => {
  let message = '';
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
    message = 'En Safari, toca el botón "Compartir" y luego "Añadir a pantalla de inicio"';
  } else if (userAgent.includes('android') && userAgent.includes('chrome')) {
    message = 'Toca el botón de Menú (tres puntos) y selecciona "Añadir a pantalla de inicio" o "Instalar aplicación"';
  } else if (userAgent.includes('opera')) {
    message = 'Toca el botón + en la barra de dirección para agregar esta app a tu pantalla de inicio';
  } else {
    message = 'Toca el botón de opciones de tu navegador y selecciona "Añadir a pantalla de inicio" o "Instalar aplicación"';
  }
  
  // Mostrar las instrucciones en un mensaje
  setError(message);
  setTimeout(() => setError(''), 6000);
};

// Handler para el evento beforeinstallprompt - EXTRAÍDO DEL ORIGINAL
export const handleBeforeInstallPrompt = (
  e: BeforeInstallPromptEvent,
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void
) => {
  // Prevenir que Chrome muestre el diálogo automáticamente
  e.preventDefault();
  // Guardar el evento para usarlo más tarde
  setDeferredPrompt(e);
};
