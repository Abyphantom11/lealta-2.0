'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Settings, ExternalLink } from 'lucide-react';

interface DemoModeBannerProps {
  isVisible?: boolean;
  onDismiss?: () => void;
  showSettingsLink?: boolean;
}

export default function DemoModeBanner({
  isVisible = true,
  onDismiss,
  showSettingsLink = true,
}: DemoModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Verificar si estamos en modo demo
    const checkDemoMode = async () => {
      try {
        const response = await fetch('/api/whatsapp/status');
        if (response.ok) {
          const data = await response.json();
          setIsDemo(data.isDemoMode || !data.isConfigured);
        } else {
          // Si no hay endpoint de status, verificar por otra vía
          setIsDemo(true); // Asumir demo si no hay respuesta
        }
      } catch {
        // En caso de error, mostrar como demo
        setIsDemo(true);
      }
    };

    checkDemoMode();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (!isVisible || dismissed || !isDemo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-amber-300">
                  Modo Demostración Activo
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/30 text-amber-300 rounded-full">
                  DEMO
                </span>
              </div>
              
              <p className="text-amber-200/80 text-sm leading-relaxed">
                WhatsApp Business no está configurado. Los mensajes no serán enviados realmente. 
                Para habilitar el envío real, configura las credenciales de Twilio.
              </p>

              {showSettingsLink && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="https://console.twilio.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Consola Twilio
                  </a>
                  <a
                    href="/superadmin/configuracion"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 rounded-lg transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configuración
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Indicador visual de que es demo */}
          <div className="mt-4 pt-3 border-t border-amber-500/20">
            <div className="flex items-center gap-4 text-xs text-amber-200/60">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Sandbox Mode</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>•</span>
                <span>Mensajes simulados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>•</span>
                <span>Sin cargos</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
