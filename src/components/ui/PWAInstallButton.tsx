'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { shouldShowPWAButtonForRoute } from '@/hooks/usePWAConditional';
import { triggerPWAInstall } from '../PWAManager';

interface PWAInstallButtonProps {
  position?: 'top-right' | 'bottom-right';
  theme?: 'dark' | 'light';
}

export default function PWAInstallButton({ 
  position = 'top-right', 
  theme = 'dark' 
}: Readonly<PWAInstallButtonProps>) {
  const pathname = usePathname();
  const [showButton, setShowButton] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPreIndicator, setShowPreIndicator] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Usar el control específico para botones (más restrictivo - solo login)
  const shouldShow = shouldShowPWAButtonForRoute(pathname);

  // Arreglar hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Si no debe mostrarse en esta ruta, limpiar estado y salir
    if (!shouldShow) {
      console.log(`🔧 PWAInstallButton: Bloqueado en ruta ${pathname}`);
      setShowButton(false);
      setShowNotification(false);
      setShowPreIndicator(false);
      return;
    }

    // Verificar si la PWA ya está instalada
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar localStorage para persistencia
    const installPromptShown = localStorage.getItem('lealta-pwa-prompt-shown');
    
    // 🎯 MOSTRAR BOTÓN DIRECTAMENTE si estamos en login y hay PWA disponible
    const checkPWAAvailability = () => {
      // Verificar si hay deferredPrompt disponible
      if ((window as any).deferredPrompt) {
        console.log('🔧 PWAInstallButton: deferredPrompt disponible - mostrando botón');
        setShowButton(true);
        localStorage.setItem('lealta-pwa-button-available', 'true');
        return true;
      }
      
      // Verificar disponibilidad por ruta (login siempre permite PWA)
      if (pathname === '/login') {
        console.log('🔧 PWAInstallButton: En login - preparando para PWA');
        // Mostrar botón después de un tiempo para dar chance a deferredPrompt
        setTimeout(() => {
          if ((window as any).deferredPrompt) {
            setShowButton(true);
            localStorage.setItem('lealta-pwa-button-available', 'true');
          }
        }, 2000);
      }
      
      return false;
    };
    
    // Escuchar eventos del PWAManager centralizado
    const handlePWAInstallable = () => {
      console.log('🔧 PWAInstallButton: PWA disponible desde manager centralizado');
      
      if (!installPromptShown) {
        // Primera vez: Mostrar indicador después de 4 segundos
        setTimeout(() => {
          setShowPreIndicator(true);
        }, 4000);

        // Primera vez: Mostrar botón después de 5 segundos
        setTimeout(() => {
          setShowPreIndicator(false);
          setShowButton(true);
          localStorage.setItem('lealta-pwa-button-available', 'true');
        }, 5000);
      } else {
        // Ya se mostró antes: Mostrar botón inmediatamente
        setShowButton(true);
        localStorage.setItem('lealta-pwa-button-available', 'true');
      }
    };

    const handlePWAInstalled = () => {
      console.log('✅ PWAInstallButton: PWA instalada');
      setIsInstalled(true);
      setShowNotification(false);
      setShowButton(false);
      localStorage.removeItem('lealta-pwa-prompt-shown');
      localStorage.removeItem('lealta-pwa-button-available');
    };

    // Verificar disponibilidad inmediata
    checkPWAAvailability();

    // Escuchar eventos del PWAManager (no beforeinstallprompt directamente)
    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('pwa-installed', handlePWAInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('pwa-installed', handlePWAInstalled);
    };
  }, [shouldShow, pathname]);

  const handleInstallClick = async () => {
    setShowButton(false);
    setShowNotification(true);
    localStorage.setItem('lealta-pwa-prompt-shown', 'true');
    localStorage.setItem('lealta-pwa-button-available', 'true');
  };

  const handleInstallConfirm = async () => {
    const success = await triggerPWAInstall();
    
    if (success) {
      setIsInstalled(true);
      localStorage.removeItem('lealta-pwa-prompt-shown');
      localStorage.removeItem('lealta-pwa-button-available');
      console.log('✅ PWA instalada exitosamente desde botón');
      setShowNotification(false);
    } else {
      // 🎯 Si falla la instalación, mantener botón disponible
      console.log('❌ Instalación PWA cancelada/fallida - botón permanece disponible');
      setShowNotification(false);
      setShowButton(true);
      localStorage.setItem('lealta-pwa-button-available', 'true');
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    // 🎯 MANTENER el botón visible después del rechazo
    setShowButton(true);
    localStorage.setItem('lealta-pwa-prompt-shown', 'true');
    // Mantener disponibilidad del botón
    localStorage.setItem('lealta-pwa-button-available', 'true');
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900/95 border-gray-700 text-white' 
    : 'bg-white/95 border-gray-200 text-gray-900';

  // No renderizar si no debe mostrarse, ya está instalado, o no está montado
  if (!shouldShow || isInstalled || !isMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 pointer-events-none">
        {/* Indicador pre-botón */}
        {showPreIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed ${getPositionClasses()} pointer-events-auto`}
          >
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          </motion.div>
        )}

        {/* Botón discreto para instalar - versión compacta */}
        {showButton && !showNotification && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstallClick}
            className={`
              fixed ${getPositionClasses()} 
              w-10 h-10 
              bg-gradient-to-r from-emerald-600 to-teal-600 
              text-white rounded-full shadow-lg hover:shadow-xl 
              flex items-center justify-center
              pointer-events-auto
              transition-all duration-200
            `}
          >
            <Download className="w-4 h-4" />
          </motion.button>
        )}

        {/* Notificación de instalación - versión compacta */}
        {showNotification && (
          <motion.div
            initial={{ 
              opacity: 0, 
              y: position === 'top-right' ? -30 : 50, 
              scale: 0.95 
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              y: position === 'top-right' ? -30 : 50, 
              scale: 0.95 
            }}
            transition={{ 
              type: "spring", 
              duration: 0.5, 
              bounce: 0.3,
              delay: 0.1
            }}
            className={`
              fixed ${getPositionClasses()} 
              max-w-xs w-full mx-4 
              ${themeClasses}
              backdrop-blur-xl border rounded-xl shadow-2xl 
              pointer-events-auto
              transform-gpu
            `}
          >
            {/* Header compacto */}
            <div className="p-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-medium text-sm">Instalar lealta</h3>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Contenido compacto */}
            <div className="p-3">
              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                Accede rápidamente sin abrir el navegador
              </p>

              <div className="flex space-x-2">
                <button
                  onClick={handleInstallConfirm}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:from-emerald-700 hover:to-teal-700 transition-colors flex items-center justify-center"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Instalar
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-800 text-gray-300 text-xs py-2 px-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Después
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
