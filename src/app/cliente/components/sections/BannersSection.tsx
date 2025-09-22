'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { browserNotifications } from '@/services/browserNotifications';
import { useAutoRefreshPortalConfig } from '@/hooks/useAutoRefreshPortalConfig';

interface Banner {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen: string;
  imagenUrl?: string;
  activo: boolean;
  dia?: string;
  horaPublicacion?: string;
}

interface BannersProps {
  readonly businessId?: string;
}

export default function BannersSection({ businessId }: BannersProps) {
  // 🔄 Auto-refresh hook para sincronización admin → cliente
  const { getBanners, isLoading } = useAutoRefreshPortalConfig({
    businessId,
    refreshInterval: 10000, // 10 segundos para banners
    enabled: true
  });

  // Obtener banners con filtros aplicados (usa día comercial internamente)
  const banners = useMemo(() => {
    const allBanners = getBanners();
    
    if (!allBanners || allBanners.length === 0) {
      return [];
    }

    // Filtrar solo banners activos con imagen
    const activeBanners = allBanners.filter(
      (banner: Banner) => banner.activo && banner.imagenUrl && banner.imagenUrl.trim() !== ''
    );

    return activeBanners;
  }, [getBanners]);

  // Estados para UI
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(() => {
    // Verificar localStorage para persistir la decisión del usuario
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('notification-prompt-dismissed');
      return dismissed !== 'true';
    }
    return true;
  });
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Función para habilitar notificaciones del navegador
  const enableNotifications = async () => {
    try {
      console.log('🔔 Intentando habilitar notificaciones del navegador...');
      const granted = await browserNotifications.requestPermission();
      
      if (granted) {
        console.log('✅ Notificaciones del navegador habilitadas');
        setShowNotificationPrompt(false);
        // Persistir la decisión del usuario
        if (typeof window !== 'undefined') {
          localStorage.setItem('notification-prompt-dismissed', 'true');
          localStorage.setItem('browser-notifications-enabled', 'true');
        }
        
        // Mostrar confirmación al usuario
        browserNotifications.showNotification({
          title: '🔔 Notificaciones Activadas',
          body: 'Ahora recibirás alertas de promociones y actualizaciones importantes'
        });
      } else {
        console.log('❌ Usuario rechazó las notificaciones del navegador');
        // No ocultar el prompt si fue rechazado, dar otra oportunidad
      }
    } catch (error) {
      console.error('Error al habilitar notificaciones:', error);
    }
  };

  // Función para descartar el prompt de notificaciones
  const dismissNotificationPrompt = () => {
    setShowNotificationPrompt(false);
    // Persistir la decisión del usuario en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-prompt-dismissed', 'true');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-dark-800 rounded-xl h-48 w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Prompt de notificaciones - Mostrar siempre que no haya sido descartado */}
        {showNotificationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-white animate-pulse" />
                <div>
                  <h4 className="font-semibold text-white">
                    🔔 ¡Activa las Notificaciones!
                  </h4>
                  <p className="text-white/80 text-sm">
                    Recibe alertas de nuevos niveles, promociones y actualizaciones en tiempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={enableNotifications}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ✨ Activar
                </button>
                <button
                  onClick={dismissNotificationPrompt}
                  className="text-white/60 hover:text-white transition-colors p-1"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Banners normales - Solo mostrar si hay al menos uno con URL válida */}
        {banners
          .filter((banner: Banner) => banner.imagenUrl && banner.imagenUrl.trim() !== '')
          .slice(0, 1)
          .map((banner: Banner, index: number) => (
            <motion.div
              key={banner.id}
              className="bg-dark-800 rounded-xl overflow-hidden relative cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setSelectedBanner(banner)}
            >
              <img
                src={banner.imagenUrl}
                alt={banner.titulo || 'Evento del día'}
                className="w-full h-48 object-cover rounded-xl"
              />
            </motion.div>
          ))}
      </div>

      {/* Modal para banner expandido */}
      {selectedBanner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBanner(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBanner(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedBanner.imagenUrl}
              alt={selectedBanner.titulo}
              className="w-full h-64 object-cover"
            />

            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                {selectedBanner.titulo}
              </h3>

              {selectedBanner.descripcion && (
                <p className="text-gray-300 text-base mb-4">
                  {selectedBanner.descripcion}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>📅 {selectedBanner.dia ? `Evento del ${selectedBanner.dia}` : 'Evento especial'}</span>
              </div>

              <button
                onClick={() => setSelectedBanner(null)}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                ¡Entendido!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
