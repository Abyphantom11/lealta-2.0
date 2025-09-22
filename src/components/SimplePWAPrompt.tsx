'use client';

import { useEffect, useState } from 'react';
import { Download, X, Monitor, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerPWAInstall } from './PWAManager';

interface SimplePWAPromptProps {
  readonly variant?: 'desktop' | 'mobile' | 'auto';
  readonly position?: 'top' | 'bottom' | 'floating';
  readonly autoShow?: boolean;
  readonly delay?: number;
}

/**
 * Prompt simplificado que usa el PWAManager centralizado
 * No duplica la lógica de beforeinstallprompt
 */
export default function SimplePWAPrompt({ 
  variant = 'auto', 
  position = 'top',
  autoShow = true,
  delay = 3000
}: Readonly<SimplePWAPromptProps>) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    // Detectar tipo de dispositivo
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Escuchar eventos del PWAManager
    const handlePWAInstallable = () => {
      console.log('🔧 SimplePWAPrompt: PWA disponible para instalación');
      setCanInstall(true);
      
      if (autoShow) {
        setTimeout(() => {
          setShowPrompt(true);
        }, delay);
      }
    };

    const handlePWAInstalled = () => {
      console.log('✅ SimplePWAPrompt: PWA instalada');
      setCanInstall(false);
      setShowPrompt(false);
      setIsInstalling(false);
    };

    // Escuchar eventos personalizados del PWAManager
    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('pwa-installed', handlePWAInstalled);

    // Verificar si ya está disponible
    if ((window as any).deferredPrompt) {
      handlePWAInstallable();
    }

    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('pwa-installed', handlePWAInstalled);
    };
  }, [autoShow, delay]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    const success = await triggerPWAInstall();
    
    if (success) {
      setShowPrompt(false);
      setCanInstall(false);
    }
    
    setIsInstalling(false);
  };

  const shouldShowVariant = variant === 'auto' ? deviceType : variant;
  const Icon = shouldShowVariant === 'desktop' ? Monitor : Smartphone;

  if (!canInstall || !showPrompt) return null;

  const positionClasses = {
    top: 'top-4 left-1/2 transform -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
    floating: 'bottom-4 right-4'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
        className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full mx-4`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-xl p-4 border border-blue-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Icon className="w-5 h-5 text-blue-200" />
              <div>
                <h3 className="font-semibold text-sm">
                  Instalar Lealta en tu {shouldShowVariant === 'desktop' ? 'Escritorio' : 'Teléfono'}
                </h3>
                <p className="text-blue-100 text-xs">
                  Accede rápidamente sin abrir el navegador
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-white text-blue-600 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 text-sm"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Instalando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Instalar</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-2 text-blue-200 hover:text-white transition-colors text-sm"
            >
              Más tarde
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
