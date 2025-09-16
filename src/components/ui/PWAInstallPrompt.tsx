'use client';

import { useEffect, useState } from 'react';
import { Download, X, Monitor, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { canInstallPWA, installPWA, isPWAInstalled } from '@/services/pwaService';

interface PWAInstallPromptProps {
  variant?: 'desktop' | 'mobile' | 'auto';
  showOnLogin?: boolean;
  position?: 'top' | 'bottom' | 'floating';
}

export default function PWAInstallPrompt({ 
  variant = 'auto', 
  showOnLogin = false,
  position = 'top'
}: PWAInstallPromptProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    // Detectar tipo de dispositivo
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Verificar estado PWA
    const checkPWAStatus = () => {
      const installed = isPWAInstalled();
      const installable = canInstallPWA();
      
      setIsInstalled(installed);
      setCanInstall(installable);
      
      // Mostrar prompt si es instalable y no está instalado
      if (installable && !installed) {
        // En login mostrar inmediatamente, en otros módulos esperar un poco
        const delay = showOnLogin ? 1000 : 5000;
        setTimeout(() => setShowPrompt(true), delay);
      }
    };

    checkPWAStatus();

    // Verificar periódicamente
    const interval = setInterval(checkPWAStatus, 3000);
    
    return () => clearInterval(interval);
  }, [showOnLogin]);

  const handleInstall = async () => {
    if (isInstalling) return;
    
    setIsInstalling(true);
    
    try {
      const success = await installPWA();
      
      if (success) {
        setShowPrompt(false);
        setCanInstall(false);
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // No mostrar de nuevo en esta sesión
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // No mostrar si ya está instalado o no se puede instalar
  if (isInstalled || !canInstall || !showPrompt) {
    return null;
  }

  // No mostrar si fue dismissed en esta sesión
  if (sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  const shouldShowVariant = variant === 'auto' ? deviceType : variant;
  const Icon = shouldShowVariant === 'desktop' ? Monitor : Smartphone;
  
  const positionClasses = {
    top: 'top-4 left-4 right-4',
    bottom: 'bottom-4 left-4 right-4', 
    floating: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'bottom' ? 100 : -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'bottom' ? 100 : -100 }}
        className={`fixed ${positionClasses[position]} z-50 max-w-md mx-auto`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 shadow-2xl border border-blue-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">
                  Instalar Lealta en tu {shouldShowVariant === 'desktop' ? 'Escritorio' : 'Teléfono'}
                </h3>
                <p className="text-xs text-blue-100 mt-1">
                  {shouldShowVariant === 'desktop' 
                    ? 'Accede rápidamente sin abrir el navegador'
                    : 'Úsala como una app nativa en tu teléfono'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-white text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isInstalling ? 'Instalando...' : 'Instalar'}
            </motion.button>
            
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm text-blue-100 hover:text-white transition-colors"
            >
              Más tarde
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
