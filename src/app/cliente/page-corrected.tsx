'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

// Definir la interfaz para el evento de instalación PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
}

export default function ClientePortalPage() {
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Escuchar el evento beforeinstallprompt para PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevenir que Chrome muestre el diálogo automáticamente
      e.preventDefault();
      // Guardar el evento para usarlo más tarde
      setDeferredPrompt(e);
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener
    );

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener
      );
    };
  }, []);

  // Función para mostrar instrucciones según el dispositivo
  const showInstallInstructions = () => {
    let message = '';
    const userAgent = navigator.userAgent.toLowerCase();

    if (
      userAgent.includes('iphone') ||
      userAgent.includes('ipad') ||
      userAgent.includes('ipod')
    ) {
      message =
        'En Safari, toca el botón "Compartir" y luego "Añadir a pantalla de inicio"';
    } else if (userAgent.includes('android') && userAgent.includes('chrome')) {
      message =
        'Toca el botón de menú (tres puntos) y selecciona "Añadir a pantalla de inicio" o "Instalar aplicación"';
    } else if (userAgent.includes('opera')) {
      message =
        'Toca el botón + en la barra de dirección para agregar esta app a tu pantalla de inicio';
    } else {
      message =
        'Toca el botón de opciones de tu navegador y selecciona "Añadir a pantalla de inicio" o "Instalar aplicación"';
    }

    // Mostrar las instrucciones en un mensaje
    setError(message);
    setTimeout(() => setError(''), 6000);
  };

  // Función para intentar instalación manual con las APIs nativas del navegador
  const attemptManualInstall = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    try {
      // Para Safari en iOS
      if (
        userAgent.includes('iphone') ||
        userAgent.includes('ipad') ||
        userAgent.includes('ipod')
      ) {
        // Usar Web Share API si está disponible
        if (navigator.share) {
          navigator
            .share({
              title: 'Lealta 2.0',
              text: 'Agregar Lealta 2.0 a tu pantalla de inicio',
              url: window.location.href,
            })
            .then(() => {
              setInfo(
                'Compartido exitosamente. Sigue las instrucciones para añadir a tu pantalla de inicio.'
              );
              setTimeout(() => setInfo(''), 5000);
            })
            .catch((error: Error) => {
              console.error('Error al compartir:', error);
              showInstallInstructions();
            });
        } else {
          showInstallInstructions();
        }
      } else {
        showInstallInstructions();
      }
    } catch (error) {
      console.error('Error en instalación manual:', error);
      showInstallInstructions();
    }
  };

  // Función para instalar la aplicación y mostrarla en la pantalla de inicio
  const installApp = () => {
    try {
      // Mostrar el diálogo de instalación si está disponible mediante PWA
      if (deferredPrompt) {
        deferredPrompt.prompt();

        // Usar then para manejar la promesa de userChoice
        deferredPrompt.userChoice
          .then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('El usuario aceptó instalar la app');
              setInfo(
                '¡Instalación exitosa! La app se ha añadido a tu pantalla de inicio'
              );
              // Limpiar el prompt guardado después de usarlo
              setDeferredPrompt(null);
              setTimeout(() => setInfo(''), 3000);
            } else {
              console.log('El usuario rechazó instalar la app');
              setInfo('Instalación cancelada');
              setTimeout(() => setInfo(''), 3000);
            }
            // Limpiar el prompt guardado
            setDeferredPrompt(null);
          })
          .catch((error: Error) => {
            console.error('Error al instalar la app:', error);
            setError(
              'No se pudo instalar la app. Intenta nuevamente más tarde.'
            );
            setTimeout(() => setError(''), 3000);
          });
      } else {
        attemptManualInstall();
      }
    } catch (error) {
      console.error('Error al instalar la app:', error);
      setError('Hubo un problema al instalar la app. Intenta más tarde.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Interfaz para instalar la aplicación */}
      {deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 p-4 rounded-lg shadow-lg z-50 flex justify-between items-center">
          <div className="flex items-center">
            <Smartphone className="w-6 h-6 mr-2" />
            <span>Instala esta app para acceder más fácilmente</span>
          </div>
          <button
            onClick={installApp}
            className="bg-white text-blue-600 px-3 py-1 rounded-md font-medium"
          >
            Instalar
          </button>
        </div>
      )}

      {/* Mensajes de error o información */}
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-500 p-3 rounded-md shadow-md z-50">
          {error}
        </div>
      )}

      {info && (
        <div className="fixed top-4 left-4 right-4 bg-green-500 p-3 rounded-md shadow-md z-50">
          {info}
        </div>
      )}

      {/* Aquí iría el resto del contenido de tu portal */}
    </div>
  );
}
