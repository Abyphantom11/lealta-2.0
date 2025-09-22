'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useAutoRefreshPortalConfig } from '@/hooks/useAutoRefreshPortalConfig';

interface FavoritoDelDia {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio?: number;
  descuento?: number;
  activo: boolean;
  dia: string;
}

interface FavoritoProps {
  businessId?: string;
}

export default function FavoritoDelDiaSection({ businessId }: FavoritoProps) {
  // 🔄 Auto-refresh hook para sincronización admin → cliente
  const { getFavoritoDelDia, isLoading } = useAutoRefreshPortalConfig({
    businessId,
    refreshInterval: 30000, // 30 segundos para favorito del día
    enabled: true
  });

  const [favorito, setFavorito] = useState<FavoritoDelDia | null>(null);

  // Obtener favorito del día actual
  useEffect(() => {
    const loadFavorito = async () => {
      const diasSemana = [
        'domingo',
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes',
        'sabado',
      ];
      const ahora = new Date();
      const diaActual = diasSemana[ahora.getDay()];

      console.log(`🌟 Buscando favorito del día para: ${diaActual}`);
      
      try {
        const favoritoActual = await getFavoritoDelDia(diaActual);
        
        if (favoritoActual) {
          console.log(`✅ Favorito encontrado: ${favoritoActual.nombre}`);
          setFavorito(favoritoActual);
        } else {
          console.log(`❌ No hay favorito para ${diaActual}`);
          setFavorito(null);
        }
      } catch (error) {
        console.error('Error cargando favorito:', error);
        setFavorito(null);
      }
    };

    loadFavorito();
  }, [getFavoritoDelDia]);

  if (isLoading || !favorito) return null;

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Favorito del Día</h3>
      <motion.div
        className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <Star className="w-6 h-6 text-white" />
          <div className="text-white font-semibold">Especial de Hoy</div>
        </div>
        
        <div className="bg-white/20 rounded-lg p-4">
          {favorito.imagen && (
            <div className="w-full h-32 mb-3 rounded-md overflow-hidden">
              <img
                src={favorito.imagen}
                alt={favorito.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="text-white">
            <div className="font-bold text-lg mb-2">{favorito.nombre}</div>
            <div className="text-white/90 text-sm mb-3">{favorito.descripcion}</div>
            
            <div className="flex items-center justify-between">
              {favorito.precio && (
                <div className="flex items-center space-x-2">
                  {favorito.descuento && favorito.descuento > 0 ? (
                    <>
                      <span className="text-white/70 line-through text-sm">
                        ${favorito.precio.toLocaleString()}
                      </span>
                      <span className="text-white font-bold">
                        ${(favorito.precio * (1 - favorito.descuento / 100)).toLocaleString()}
                      </span>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        -{favorito.descuento}%
                      </span>
                    </>
                  ) : (
                    <span className="text-white font-bold">
                      ${favorito.precio.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
