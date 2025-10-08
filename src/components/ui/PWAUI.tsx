/**
 * 🎯 PWA UI COMPONENT ÚNICO
 * 
 * Reemplaza TODOS los componentes PWA duplicados:
 * ❌ PWAInstallPrompt, PWAInstallButton, SimplePWAPrompt
 * ❌ ConditionalPWAPrompt, cliente/PWAInstallButton, etc.
 * 
 * ✅ UNA SOLA implementación que maneja:
 * - Instalación PWA
 * - Responsive design (desktop/mobile)
 * - Estados de loading
 * - Notificaciones integradas
 * - Rutas permitidas/excluidas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Monitor, Smartphone, CheckCircle } from 'lucide-react';
import { 
  pwaController, 
  installPWA, 
  canInstallPWA, 
  isPWAInstalled,
  isPWAButtonAllowed,
  subscribeToPWA,
  PWAState 
} from '@/services/PWAController';

interface PWAUIProps {
  variant?: 'auto' | 'desktop' | 'mobile';
  position?: 'top' | 'bottom' | 'floating' | 'button-only';
  autoShow?: boolean;
  delay?: number;
  className?: string;
}

type UIMode = 'hidden' | 'button' | 'notification' | 'installing' | 'success';
type DeviceType = 'desktop' | 'mobile' | 'tablet';

export default function PWAUI({ 
  variant = 'auto',
  position = 'bottom',
  autoShow = true,
  delay = 3000,
  className = ''
}: PWAUIProps) {
  // Estados unificados
  const [uiMode, setUIMode] = useState<UIMode>('hidden');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isInstalling, setIsInstalling] = useState(false);

  // Función para evaluar modo UI
  const evaluateUIMode = React.useCallback((state: PWAState) => {
    if (state.isInstalled) {
      setUIMode('hidden');
      return;
    }

    if (!state.isInstallable) {
      setUIMode('hidden');
      return;
    }

    // Verificar si estamos en ruta permitida para botón
    if (isPWAButtonAllowed()) {
      setUIMode('button');
    } else if (autoShow) {
      setUIMode('notification');
    } else {
      setUIMode('hidden');
    }
  }, [autoShow]);

  // Detectar tipo de dispositivo
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('tablet') || (userAgent.includes('android') && !userAgent.includes('mobile'))) {
      setDeviceType('tablet');
    } else if (userAgent.includes('mobile')) {
      setDeviceType('mobile');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  // Suscribirse al PWAController
  useEffect(() => {
    const unsubscribe = subscribeToPWA((state) => {
      evaluateUIMode(state);
    });

    // Escuchar eventos personalizados del controller
    const handleInstallAvailable = (e: Event) => {
      const customEvent = e as CustomEvent;
      
      if (autoShow && customEvent.detail.canInstall) {
        setTimeout(() => {
          if (customEvent.detail.isButtonAllowed) {
            setUIMode('button');
          } else {
            setUIMode('notification');
          }
        }, delay);
      }
    };

    const handleInstallSuccess = () => {
      setUIMode('success');
      setTimeout(() => {
        setUIMode('hidden');
      }, 4000);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-success', handleInstallSuccess);

    return () => {
      unsubscribe();
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-success', handleInstallSuccess);
    };
  }, [autoShow, delay, evaluateUIMode]);

  /**
   * 🎯 MANEJAR INSTALACIÓN
   */
  const handleInstall = async () => {
    if (isInstalling) return;
    
    setIsInstalling(true);
    setUIMode('installing');
    
    try {
      const success = await installPWA();
      
      if (success) {
        setUIMode('success');
        setTimeout(() => setUIMode('hidden'), 3000);
      } else {
        // Volver al estado anterior si falla
        setUIMode(isPWAButtonAllowed() ? 'button' : 'notification');
      }
    } catch (error) {
      console.error('Error instalando PWA:', error);
      setUIMode(isPWAButtonAllowed() ? 'button' : 'notification');
    } finally {
      setIsInstalling(false);
    }
  };

  /**
   * 🎯 CERRAR NOTIFICACIÓN
   */
  const handleDismiss = () => {
    setUIMode('hidden');
    
    // En login, mantener botón disponible
    if (isPWAButtonAllowed()) {
      setTimeout(() => setUIMode('button'), 1000);
    }
  };

  /**
   * 🎯 OBTENER TEXTO APROPIADO PARA DISPOSITIVO
   */
  const getDeviceText = () => {
    const actualDevice = variant === 'auto' ? deviceType : variant;
    
    switch (actualDevice) {
      case 'mobile':
        return {
          title: 'Instalar en tu Teléfono',
          description: 'Úsala como una app nativa',
          icon: Smartphone,
          buttonText: 'Agregar a Pantalla'
        };
      case 'tablet':
        return {
          title: 'Instalar en tu Tablet', 
          description: 'Acceso rápido desde tu pantalla',
          icon: Smartphone,
          buttonText: 'Instalar App'
        };
      default:
        return {
          title: 'Instalar en tu Escritorio',
          description: 'Accede sin abrir el navegador',
          icon: Monitor,
          buttonText: 'Instalar Lealta'
        };
    }
  };

  /**
   * 🎯 OBTENER CLASES DE POSICIÓN
   */
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-4 right-4';
      case 'bottom':
        return 'bottom-4 left-4 right-4';
      case 'floating':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'button-only':
        return 'bottom-4 right-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  // No renderizar si está oculto
  if (uiMode === 'hidden') {
    return null;
  }

  const deviceText = getDeviceText();
  const Icon = deviceText.icon;

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <AnimatePresence mode="wait">
        
        {/* 🎯 MODO BOTÓN (Solo en rutas permitidas como /login) */}
        {uiMode === 'button' && (
          <motion.button
            key="pwa-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstall}
            className="
              w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 
              text-white rounded-full shadow-lg hover:shadow-xl 
              flex items-center justify-center
              transition-all duration-200
            "
            title={deviceText.buttonText}
          >
            <Download className="w-5 h-5" />
          </motion.button>
        )}

        {/* 🎯 MODO NOTIFICACIÓN (Rutas permitidas con auto-show) */}
        {uiMode === 'notification' && (
          <motion.div
            key="pwa-notification"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="
              bg-gradient-to-r from-blue-600 to-purple-600 
              text-white rounded-lg shadow-xl max-w-sm p-4 space-y-3
            "
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="w-6 h-6 text-blue-200" />
                <div>
                  <h3 className="font-semibold text-sm">{deviceText.title}</h3>
                  <p className="text-xs text-blue-100 mt-1">{deviceText.description}</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Action Button */}
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="
                w-full flex items-center justify-center space-x-2 
                bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-md 
                transition-colors disabled:opacity-50
              "
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? 'Instalando...' : deviceText.buttonText}</span>
            </button>
          </motion.div>
        )}

        {/* 🎯 MODO INSTALANDO */}
        {uiMode === 'installing' && (
          <motion.div
            key="pwa-installing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="
              bg-orange-500 text-white rounded-lg shadow-xl p-4 
              flex items-center space-x-3 max-w-sm
            "
          >
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <div>
              <p className="font-medium text-sm">Instalando Lealta...</p>
              <p className="text-xs text-orange-100">Sigue las instrucciones del navegador</p>
            </div>
          </motion.div>
        )}

        {/* 🎯 MODO ÉXITO */}
        {uiMode === 'success' && (
          <motion.div
            key="pwa-success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="
              bg-green-500 text-white rounded-lg shadow-xl p-4 
              flex items-center space-x-3 max-w-sm
            "
          >
            <CheckCircle className="w-6 h-6 text-green-200" />
            <div>
              <p className="font-medium text-sm">¡Instalación Exitosa!</p>
              <p className="text-xs text-green-100">
                Lealta está ahora en tu {deviceType === 'mobile' ? 'pantalla de inicio' : 'escritorio'}
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/**
 * 🎯 HOOK SIMPLIFICADO PARA USAR PWA UI
 */
export function usePWAUI() {
  const [state, setState] = useState(pwaController.getState());

  useEffect(() => {
    const unsubscribe = subscribeToPWA(setState);
    return unsubscribe;
  }, []);

  return {
    canInstall: canInstallPWA(),
    isInstalled: isPWAInstalled(),
    isButtonAllowed: isPWAButtonAllowed(),
    install: installPWA,
    state
  };
}

/**
 * 🎯 COMPONENTE PWA PARA CLIENTE (Compatibilidad)
 */
export function PWAClientButton() {
  return (
    <PWAUIComponent 
      variant="mobile"
      position="button-only"
      autoShow={true}
      delay={2000}
    />
  );
}

/**
 * 🎯 COMPONENTE PWA PARA ADMIN/STAFF (Compatibilidad)
 */
export function PWAAdminPrompt() {
  return (
    <PWAUIComponent 
      variant="desktop"
      position="bottom"
      autoShow={true}
      delay={5000}
    />
  );
}

// Alias para evitar problemas de naming
const PWAUIComponent = PWAUI;
