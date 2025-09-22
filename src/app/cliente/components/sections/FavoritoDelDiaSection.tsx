'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { useAutoRefreshPortalConfig } from '@/hooks/useAutoRefreshPortalConfig';
import { getCurrentBusinessDay, type DayOfWeek } from '@/lib/business-day-utils';

interface FavoritoDelDia {
  id: string;
  dia: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  horaPublicacion: string;
  activo: boolean;
}

interface FavoritoProps {
  readonly businessId?: string;
}

export default function FavoritoDelDiaSection({ businessId }: Readonly<FavoritoProps>) {
  // 🔄 Auto-refresh hook para sincronización admin → cliente  
  const { getFavoritoDelDia, isLoading } = useAutoRefreshPortalConfig({
    businessId,
    refreshInterval: 12000, // 12 segundos para favorito del día
    enabled: true
  });

  // ✅ SOLUCIÓN: Obtener día comercial con hora de reseteo configurable
  const [diaActual, setDiaActual] = useState<DayOfWeek>('domingo');
  
  useEffect(() => {
    const updateBusinessDay = async () => {
      try {
        const businessDay = await getCurrentBusinessDay(businessId);
        setDiaActual(businessDay);
      } catch (error) {
        console.error('Error obteniendo día comercial:', error);
        // Fallback a día natural si falla
        const diasSemana: DayOfWeek[] = [
          'domingo', 'lunes', 'martes', 'miercoles', 
          'jueves', 'viernes', 'sabado'
        ];
        setDiaActual(diasSemana[new Date().getDay()]);
      }
    };

    updateBusinessDay();
    
    // Actualizar cada minuto para detectar cambios de día comercial
    const interval = setInterval(updateBusinessDay, 60000);
    
    return () => clearInterval(interval);
  }, [businessId]);

  // Estados para favorito del día
  const [favorito, setFavorito] = useState<FavoritoDelDia | null>(null);
  const [selectedFavorito, setSelectedFavorito] = useState<FavoritoDelDia | null>(null);

  // Cargar favorito del día cuando cambia el día actual
  useEffect(() => {
    const loadFavorito = async () => {
      try {
        const favoritoData = await getFavoritoDelDia(diaActual);
        setFavorito(favoritoData);
      } catch (error) {
        console.error('Error cargando favorito del día:', error);
        setFavorito(null);
      }
    };

    if (diaActual) {
      loadFavorito();
    }
  }, [getFavoritoDelDia, diaActual]);

  // Si no hay favorito del día, no renderizar nada
  if (isLoading || !favorito?.imagenUrl) return null;

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400" />
        {favorito.nombre || 'Favorito del Día'}
      </h3>

      <div className="space-y-4">
        <motion.div
          className="bg-dark-800 rounded-xl overflow-hidden relative cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setSelectedFavorito(favorito)}
        >
          <img
            src={favorito.imagenUrl}
            alt={favorito.nombre}
            className="w-full h-48 object-cover rounded-xl"
          />

          {/* Overlay con información */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                {favorito.descripcion && (
                  <p className="text-white font-bold text-lg mb-2">
                    {favorito.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xs font-medium bg-yellow-500/30 px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Especial de hoy
                  </span>

                  <span className="text-xs text-gray-300">
                    Desde las {favorito.horaPublicacion}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal para favorito expandido */}
      {selectedFavorito && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFavorito(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedFavorito(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedFavorito.imagenUrl}
              alt={selectedFavorito.nombre}
              className="w-full h-64 object-cover"
            />

            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                {selectedFavorito.nombre}
              </h3>

              {selectedFavorito.descripcion && (
                <p className="text-gray-300 text-base mb-4">
                  {selectedFavorito.descripcion}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>⭐ Especial del {selectedFavorito.dia}</span>
                {selectedFavorito.horaPublicacion && (
                  <span>🕐 Desde las {selectedFavorito.horaPublicacion}</span>
                )}
              </div>

              <button
                onClick={() => setSelectedFavorito(null)}
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
