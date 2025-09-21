'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Shield } from 'lucide-react';
import Link from 'next/link';

interface CookieBannerProps {
  position?: 'from-logo' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  theme?: 'dark' | 'light';
}

export default function CookieBanner({ 
  position = 'from-logo', 
  theme = 'dark' 
}: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreIndicator, setShowPreIndicator] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Siempre activadas
    analytics: true,
    marketing: false,
    functional: true
  });

  useEffect(() => {
    // Verificar si ya se dio consentimiento
    const consentGiven = localStorage.getItem('lealta-cookie-consent');
    
    if (!consentGiven) {
      if (position === 'from-logo') {
        // Mostrar indicador sutil primero
        const preTimer = setTimeout(() => {
          setShowPreIndicator(true);
        }, 2500);
        
        // Luego mostrar el banner completo
        const mainTimer = setTimeout(() => {
          setShowPreIndicator(false);
          setIsVisible(true);
        }, 3000);
        
        return () => {
          clearTimeout(preTimer);
          clearTimeout(mainTimer);
        };
      } else {
        // Para otras posiciones, comportamiento normal
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [position]);

  const handleAcceptAll = () => {
    localStorage.setItem('lealta-cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: Date.now()
    }));
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('lealta-cookie-consent', JSON.stringify({
      ...preferences,
      timestamp: Date.now()
    }));
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleReject = () => {
    localStorage.setItem('lealta-cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: Date.now()
    }));
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'from-logo':
        return 'top-24 left-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900/95 border-gray-700 text-white' 
    : 'bg-white/95 border-gray-200 text-gray-900';

  if (!isVisible && !showPreIndicator) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Indicador pre-banner (solo para from-logo) */}
        {showPreIndicator && position === 'from-logo' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-20 pointer-events-auto"
          >
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
          </motion.div>
        )}

        {/* Banner principal */}
        {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            y: position === 'from-logo' ? -50 : 100, 
            scale: 0.95,
            x: position === 'from-logo' ? 0 : 0
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            x: 0
          }}
          exit={{ 
            opacity: 0, 
            y: position === 'from-logo' ? -50 : 100, 
            scale: 0.95 
          }}
          transition={{ 
            type: "spring", 
            duration: 0.6, 
            bounce: 0.3,
            delay: position === 'from-logo' ? 0.1 : 0
          }}
          className={`
            fixed ${getPositionClasses()} 
            max-w-sm w-full mx-4 
            ${themeClasses}
            backdrop-blur-xl border rounded-2xl shadow-2xl 
            pointer-events-auto
            ${position === 'from-logo' ? 'transform-gpu' : ''}
          `}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cookie className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm">Cookies</h3>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-4">
            {!showPreferences ? (
              <>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Usamos cookies para mejorar tu experiencia. Al continuar navegando, 
                  aceptas nuestro uso de cookies.
                </p>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleAcceptAll}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                  >
                    Aceptar todas
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="flex-1 bg-gray-800 text-gray-300 text-sm py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Personalizar
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex-1 bg-gray-800 text-gray-300 text-sm py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Solo necesarias
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 mt-3 text-xs">
                  <Link 
                    href="/legal/privacidad" 
                    className="text-gray-400 hover:text-gray-300 transition-colors flex items-center"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Privacidad
                  </Link>
                  <span className="text-gray-600">•</span>
                  <Link 
                    href="/legal/terminos" 
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Términos
                  </Link>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Necesarias</span>
                    <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                      <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analíticas</span>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className={`w-8 h-4 rounded-full relative transition-colors ${
                        preferences.analytics ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                        preferences.analytics ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Funcionales</span>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                      className={`w-8 h-4 rounded-full relative transition-colors ${
                        preferences.functional ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                        preferences.functional ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Marketing</span>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))}
                      className={`w-8 h-4 rounded-full relative transition-colors ${
                        preferences.marketing ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                        preferences.marketing ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="flex-1 bg-gray-800 text-gray-300 text-sm py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleAcceptSelected}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm py-2 px-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
