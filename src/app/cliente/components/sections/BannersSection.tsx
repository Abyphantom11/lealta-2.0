'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

export default function BannersSection() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

  // Debug: Mostrar siempre la sección para verificar datos
  console.log('🐛 BannersSection DEBUG:', { banners, bannersLength: banners.length, isLoading });

  // Memoizar cálculo del día actual para evitar recálculos constantes
  const diaActual = useMemo(() => {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return diasSemana[new Date().getDay()];
  }, []);

  // Debounce para evitar actualizaciones demasiado rápidas
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/portal-config?businessId=default', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Obtener todos los banners activos de forma más eficiente
        const todosActivos = data.config?.banners?.filter((b: any) => 
          b.activo && b.imagenUrl && b.imagenUrl.trim() !== ''
        ) || [];
        
        if (todosActivos.length === 0) {
          setBanners([]);
          return;
        }
        
        // Obtener el día y hora actual de forma más eficiente
        const ahora = new Date();
        const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
        
        // Filtrar banners del día actual (optimizado)
        const bannersDelDia = todosActivos.filter((b: any) => {
          // Verificar día
          if (b.dia !== diaActual) return false;
          
          // Verificar hora si está configurada
          if (b.horaPublicacion) {
            const [horas, minutos] = b.horaPublicacion.split(':').map(Number);
            const horaPublicacion = horas * 60 + minutos;
            return horaActualMinutos >= horaPublicacion;
          }
          
          return true;
        });
        
        // Actualizar banners inmediatamente
        setBanners(bannersDelDia.length > 0 ? bannersDelDia : todosActivos);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setIsLoading(false);
    }
  }, [diaActual]);

  useEffect(() => {
    console.log('🔌 BannersSection: Iniciando SSE para actualizaciones en tiempo real');
    
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
    
    // Configurar SSE para actualizaciones instantáneas
    const eventSource = new EventSource('/api/admin/portal-config/stream');
    
    eventSource.onopen = () => {
      console.log('✅ SSE Banners: Conexión establecida para actualizaciones automáticas');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 SSE Banners: Datos recibidos:', data.type);
        
        // Actualizar banners cuando hay cambios de configuración
        if (data.type === 'config-update' || data.type === 'initial-config') {
          // Mostrar notificación push si hay cambios reales (no inicial)
          if (data.type === 'config-update') {
            browserNotifications.notifyBannerUpdate(1);
          }
          
          // Debounce: evitar actualizaciones demasiado rápidas
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          
          updateTimeoutRef.current = setTimeout(() => {
            fetchBanners();
          }, 100); // Esperar 100ms antes de actualizar
        }
      } catch (error) {
        console.error('❌ SSE Banners: Error procesando mensaje:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.log('⚠️ SSE Banners: Error de conexión, usando fallback:', error);
    };
    
    // Fallback: actualizar solo si SSE falla completamente
    const fallbackInterval = setInterval(() => {
      if (eventSource.readyState !== EventSource.OPEN) {
        fetchBanners();
      }
    }, 300000); // Solo cada 5 minutos como backup (reducir carga)
    
    return () => {
      console.log('🔌 BannersSection: Cerrando conexión SSE');
      eventSource.close();
      clearInterval(fallbackInterval);
      
      // Limpiar debounce timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
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

  if (isLoading) {
    return (
      <div className="mx-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Evento del día</h3>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-white/60">Cargando banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Evento del día</h3>
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="bg-dark-800 rounded-xl p-4">
            <p className="text-white/60">No hay eventos del día configurados</p>
          </div>
        ) : (
          <>
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
                  <h4 className="font-semibold text-white">¡Recibe Notificaciones!</h4>
                  <p className="text-sm text-white/80">Te avisaremos cuando haya nuevas ofertas</p>
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
        
        {/* Banners normales */}
        {banners.slice(0, 1).map((banner: Banner, index: number) => (
          <motion.div
            key={banner.id}
            className="bg-dark-800 rounded-xl overflow-hidden relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <img 
              src={banner.imagenUrl} 
              alt="Evento del día"
              className="w-full h-48 object-cover rounded-xl"
            />
          </motion.div>
        ))}
          </>
        )}
      </div>
    </div>
  );
}
