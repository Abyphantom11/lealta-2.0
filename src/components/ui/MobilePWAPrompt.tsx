'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobilePWAPromptProps {
  businessId?: string;
}

export default function MobilePWAPrompt({ businessId }: MobilePWAPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Solo mostrar en dispositivos móviles
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      console.log('📱 No es dispositivo móvil, no mostrar PWA prompt');
      return;
    }

    // Verificar si ya está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      console.log('✅ PWA ya está instalada');
      return;
    }

    // Verificar si ya fue dismissed
    const wasDismissed = sessionStorage.getItem('mobile-pwa-dismissed');
    if (wasDismissed) {
      console.log('⏭️ PWA prompt ya fue descartado en esta sesión');
      return;
    }

    // Escuchar evento de instalación
    const handleBeforeInstall = (e: Event) => {
      console.log('📱 Móvil: PWA se puede instalar');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt después de un breve delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      console.log('✅ Móvil: PWA instalada');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    // Registrar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // También escuchar el evento personalizado de ServiceWorkerRegistration
    const handleCustomPWAEvent = () => {
      console.log('📱 Móvil: Evento PWA personalizado detectado');
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener('pwa-installable', handleCustomPWAEvent);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installable', handleCustomPWAEvent);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt || isInstalling) return;

    setIsInstalling(true);

    try {
      console.log('📱 Móvil: Iniciando instalación PWA...');
      
      // Mostrar el prompt nativo
      await deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('📱 Móvil: Resultado instalación:', outcome);
      
      if (outcome === 'accepted') {
        console.log('✅ Móvil: Usuario aceptó instalar PWA');
        setShowPrompt(false);
      } else {
        console.log('❌ Móvil: Usuario rechazó instalar PWA');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ Móvil: Error instalando PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    console.log('⏭️ Móvil: Usuario descartó PWA prompt');
    setShowPrompt(false);
    sessionStorage.setItem('mobile-pwa-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50"
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 shadow-lg border border-white/20">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">
                ¡Instala Lealta!
              </h3>
              <p className="text-white/90 text-xs mb-3">
                Accede más rápido desde tu pantalla de inicio
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-white text-purple-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {isInstalling ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  {isInstalling ? 'Instalando...' : 'Instalar'}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white text-xs px-2"
                >
                  Ahora no
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
