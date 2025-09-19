'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { useAutoRefreshPortalConfig } from '@/hooks/useAutoRefreshPortalConfig';

interface Recompensa {
  id: string;
  titulo: string;
  nombre: string;
  descripcion?: string;
  puntosRequeridos: number;
  imagen?: string;
  imagenUrl?: string;
  activo: boolean;
  stock?: number;
}

interface RecompensasProps {
  businessId?: string;
}

export default function RecompensasSection({ businessId }: RecompensasProps) {
  // 🔄 Auto-refresh hook para sincronización admin → cliente
  const { getRecompensas, isLoading } = useAutoRefreshPortalConfig({
    businessId,
    refreshInterval: 20000, // 20 segundos para recompensas
    enabled: true
  });

  // Obtener recompensas activas ordenadas por puntos
  const recompensas = useMemo(() => {
    const allRecompensas = getRecompensas();
    
    if (!allRecompensas || allRecompensas.length === 0) {
      return [];
    }

    // Ordenar por puntos requeridos (menor a mayor)
    const sorted = [...allRecompensas].sort((a, b) => 
      (a.puntosRequeridos || 0) - (b.puntosRequeridos || 0)
    );

    // console.log('🎁 Recompensas activas encontradas:', sorted.length);
    return sorted;
  }, [getRecompensas]);

  // Si no hay recompensas, no renderizar nada
  if (isLoading || recompensas.length === 0) return null;
  
  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recompensas</h3>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Gift className="w-6 h-6 text-white" />
          <div className="text-white font-semibold">Programa de Puntos</div>
        </div>
        {/* Contenedor scrollable horizontal para las recompensas */}
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
            {recompensas.map((recompensa: Recompensa, index: number) => (
              <motion.div
                key={recompensa.id}
                className="bg-white/20 rounded-lg p-3 min-w-[200px] max-w-[200px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Imagen de la recompensa si existe */}
                {recompensa.imagenUrl && (
                  <div className="w-full h-20 mb-2 rounded-md overflow-hidden">
                    <img 
                      src={recompensa.imagenUrl} 
                      alt={recompensa.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="text-white font-medium text-sm">{recompensa.nombre}</div>
                  <div className="text-white/80 text-xs mb-2">{recompensa.descripcion}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-white font-bold text-sm">
                      {recompensa.puntosRequeridos} pts
                    </div>
                    {(recompensa.stock && recompensa.stock > 0) && (
                      <div className="text-white/60 text-xs">
                        Stock: {recompensa.stock}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
