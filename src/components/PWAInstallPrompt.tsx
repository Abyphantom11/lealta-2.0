'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Monitor, Smartphone, Tablet } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onClose?: () => void;
  className?: string;
}

export default function PWAInstallPrompt({ onClose, className = '' }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    // Detectar tipo de dispositivo
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('tablet') || (userAgent.includes('android') && !userAgent.includes('mobile'))) {
      setDeviceType('tablet');
    } else if (userAgent.includes('mobile')) {
      setDeviceType('mobile');
    } else {
      setDeviceType('desktop');
    }

    // Verificar si ya está instalado
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Solo mostrar el prompt si no está instalado y no se ha cerrado manualmente
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    // Escuchar cuando se instala la app
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-prompt-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback para navegadores que no soportan el prompt automático
      showManualInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA instalada por el usuario');
      } else {
        console.log('❌ Usuario rechazó la instalación');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error durante la instalación PWA:', error);
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const instructions = getManualInstructions();
    alert(instructions);
  };

  const getManualInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Para instalar Lealta:\n1. Haz clic en los tres puntos (⋮) en la esquina superior derecha\n2. Selecciona "Instalar Lealta..."\n3. Confirma la instalación';
    } else if (userAgent.includes('firefox')) {
      return 'Para instalar Lealta:\n1. Haz clic en el ícono de casa con "+" en la barra de direcciones\n2. Selecciona "Instalar"';
    } else if (userAgent.includes('safari')) {
      if (deviceType === 'mobile') {
        return 'Para instalar Lealta:\n1. Toca el botón Compartir (□↗)\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"';
      } else {
        return 'Para instalar Lealta:\n1. Ve a Archivo > Agregar a Dock\n2. Confirma para agregar Lealta a tu Dock';
      }
    } else {
      return 'Para instalar Lealta:\nBusca la opción "Instalar" o "Agregar a pantalla de inicio" en el menú de tu navegador';
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    onClose?.();
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'tablet':
        return <Tablet className="w-6 h-6" />;
      default:
        return <Monitor className="w-6 h-6" />;
    }
  };

  const getInstallText = () => {
    switch (deviceType) {
      case 'mobile':
        return 'Instalar en tu teléfono';
      case 'tablet':
        return 'Instalar en tu tablet';
      default:
        return 'Instalar en tu computadora';
    }
  };

  // No mostrar si ya está instalado o si no debe mostrarse
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getDeviceIcon()}
            <h3 className="font-semibold text-gray-900">
              ¡Instala Lealta!
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-600">
          Accede más rápido y funciona sin conexión. Una experiencia nativa en tu dispositivo.
        </p>

        {/* Action Button */}
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{getInstallText()}</span>
        </button>

        {/* Alternative action */}
        <button
          onClick={showManualInstructions}
          className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          ¿No ves el botón? Instrucciones manuales
        </button>
      </div>
    </div>
  );
}

// Hook personalizado para usar el componente más fácilmente
export function usePWAInstall() {
  const [showPrompt, setShowPrompt] = useState(false);

  const showInstallPrompt = () => setShowPrompt(true);
  const hideInstallPrompt = () => setShowPrompt(false);

  return {
    showPrompt,
    showInstallPrompt,
    hideInstallPrompt,
    PWAInstallPrompt: (props: Omit<PWAInstallPromptProps, 'onClose'>) => (
      <PWAInstallPrompt {...props} onClose={hideInstallPrompt} />
    )
  };
}
