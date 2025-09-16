'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { browserNotifications } from '@/services/browserNotifications';
import { logger } from '@/utils/logger';

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
  businessId?: string;
}

export default function BannersSection({ businessId }: BannersProps) {
  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Obtener día actual como estado para permitir actualizarlo en cambios de día
  const [diaActual, setDiaActual] = useState(() => {
    const diasSemana = [
      'domingo',
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
    ];
    return diasSemana[new Date().getDay()];
  });

  // Agregar estado para detectar simulación de día
  const [simulatedDay, setSimulatedDay] = useState<string | null>(null);

  // Definimos fetchBanners ANTES de usarlo en useEffect
  const fetchBanners = useCallback(async () => {
    try {
      // Usar businessId si está disponible, sino usar 'default'
      const configBusinessId = businessId || 'default';
      const response = await fetch(
        `/api/admin/portal-config?businessId=${configBusinessId}&t=` + new Date().getTime(),
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();

        // Obtener todos los banners activos de forma más eficiente
        const todosActivos =
          data.config?.banners?.filter(
            (b: any) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== ''
          ) || [];

        if (todosActivos.length === 0) {
          setBanners([]);
          return;
        }

        // Obtener el día y hora actual de forma más eficiente
        const ahora = new Date();
        const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();

        // Usar el día simulado si está disponible
        const diaParaMostrar = simulatedDay || diaActual;
        const esModoSimulacion = Boolean(simulatedDay);

        // Filtrar banners del día actual/simulado
        const bannersDelDia = todosActivos.filter((b: any) => {
          // Verificar día
          if (b.dia !== diaParaMostrar) {
            return false;
          }

          // En modo simulación no verificamos la activación
          if (esModoSimulacion) {
            return true;
          }

          // Verificar hora si está configurada (solo en modo normal)
          if (b.horaPublicacion) {
            const [horas, minutos] = b.horaPublicacion.split(':').map(Number);
            const horaPublicacion = horas * 60 + minutos;
            const cumpleHora = horaActualMinutos >= horaPublicacion;
            return cumpleHora;
          }

          return true;
        });

        // Actualizar banners inmediatamente
        const bannersToShow = bannersDelDia.length > 0 ? bannersDelDia : [];

        setBanners(bannersToShow);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  }, [diaActual, simulatedDay, businessId]);

  // Verificar si hay un día simulado configurado desde el administrador
  useEffect(() => {
    const checkSimulationMode = () => {
      const currentSimDay =
        typeof window !== 'undefined' ? (window as any).portalPreviewDay : null;
      if (currentSimDay !== simulatedDay) {
        console.log(
          '🔄 BannersSection: Cambio en simulación detectado -',
          currentSimDay || 'modo normal'
        );
        setSimulatedDay(currentSimDay);
        // Forzar recarga inmediata de banners con el nuevo día simulado
        fetchBanners();
      }
    };

    // Verificar inicialmente
    checkSimulationMode();

    // Verificar cambios en la simulación cada segundo
    const simulationInterval = setInterval(checkSimulationMode, 1000);

    // Listener para escuchar cambios en el día simulado
    const handleSimulationChange = () => {
      console.log(
        '🔄 BannersSection: Evento de cambio en simulación detectado'
      );
      checkSimulationMode();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'portalPreviewDayChanged',
        handleSimulationChange
      );
    }

    return () => {
      clearInterval(simulationInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'portalPreviewDayChanged',
          handleSimulationChange
        );
      }
    };
  }, [simulatedDay, fetchBanners]);

  // Actualizar el día cuando cambia la fecha (solo en modo normal)
  useEffect(() => {
    // Solo monitorear cambios de día natural si no estamos en modo simulación
    if (simulatedDay) return;

    const checkDayChange = () => {
      const diasSemana = [
        'domingo',
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes',
        'sabado',
      ];
      const nuevoDia = diasSemana[new Date().getDay()];
      if (nuevoDia !== diaActual) {
        setDiaActual(nuevoDia);
        // Forzar recarga de banners cuando cambia el día
        fetchBanners();
      }
    };

    // Verificar cambio de día cada minuto
    const intervaloDia = setInterval(checkDayChange, 60000);
    return () => clearInterval(intervaloDia);
  }, [diaActual, fetchBanners, simulatedDay]);

  useEffect(() => {
    console.log(
      '🔌 BannersSection: Iniciando SSE para actualizaciones en tiempo real'
    );

    // Verificar estado inicial de permisos de notificación
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      // Solo logeamos el estado sin almacenarlo
      logger.log(`🔔 Permisos de notificación: ${currentPermission}`);
      setShowNotificationPrompt(currentPermission === 'default');
      console.log('🔔 Estado inicial de notificaciones:', currentPermission);
    }



    // Carga inicial
    fetchBanners();

    // Polling simple cada 5 segundos
    // Polling optimizado: cada 30 segundos para banners
    const interval = setInterval(fetchBanners, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchBanners]);

  // Función para habilitar notificaciones del navegador
  const enableNotifications = async () => {
    try {
      const granted = await browserNotifications.requestPermission();
      logger.log(`✅ Notificaciones ${granted ? 'habilitadas' : 'denegadas'}`);
      setShowNotificationPrompt(false);

      if (granted) {
        console.log('✅ Notificaciones habilitadas correctamente');
      } else {
        console.log('❌ El usuario denegó los permisos de notificación');
      }
    } catch (error) {
      console.error('❌ Error al habilitar notificaciones:', error);
    }
  };

  const dismissNotificationPrompt = () => {
    setShowNotificationPrompt(false);
  };



  // VERSIÓN MÁS AGRESIVA: Si no hay banners válidos o está cargando, no renderizar NADA
  if (isLoading || !banners || banners.length === 0) {
    console.log(
      '🚫 BannersSection: No hay banners para mostrar, devolviendo null'
    );
    return null;
  }

  // Solo mostrar si hay al menos un banner válido con URL de imagen
  if (
    !banners.some(banner => banner.imagenUrl && banner.imagenUrl.trim() !== '')
  ) {
    console.log('🚫 BannersSection: No hay banners con imágenes válidas');
    return null;
  }

  console.log(
    '✅ BannersSection: Renderizando sección con banners:',
    banners.length
  );

  return (
    <div className="mx-4 mb-6">
      {/* Mostrar el título del banner como un encabezado separado */}
      {banners.length > 0 && banners[0].titulo && (
        <h3 className="text-lg font-semibold text-white mb-4">
          {banners[0].titulo}
        </h3>
      )}
      <div className="space-y-3">
        {/* Prompt para habilitar notificaciones */}
        {showNotificationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 border border-blue-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-white" />
                <div>
                  <h4 className="font-semibold text-white">
                    ¡Recibe Notificaciones!
                  </h4>
                  <p className="text-sm text-white/80">
                    Te avisaremos cuando haya nuevas ofertas
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={enableNotifications}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  Activar
                </button>
                <button
                  onClick={dismissNotificationPrompt}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}



        {/* Banners normales - Solo mostrar si hay al menos uno con URL válida */}
        {banners
          .filter(banner => banner.imagenUrl && banner.imagenUrl.trim() !== '')
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
                <span>📅 Evento del {selectedBanner.dia}</span>
                {selectedBanner.horaPublicacion && (
                  <span>🕐 Desde las {selectedBanner.horaPublicacion}</span>
                )}
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
