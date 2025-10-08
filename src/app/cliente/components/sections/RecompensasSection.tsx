'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { useAutoRefreshPortalConfig } from '@/hooks/useAutoRefreshPortalConfig';
import { useTheme } from '@/contexts/ThemeContext';

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
  readonly businessId?: string;
}

export default function RecompensasSection({ businessId }: Readonly<RecompensasProps>) {
  const { theme, themeConfig } = useTheme();
  
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

    return sorted;
  }, [getRecompensas]);

  // Si no hay recompensas, no renderizar nada
  if (isLoading || recompensas.length === 0) return null;
  
  // 🎨 Estilos según el tema
  let containerStyles = '';
  let textColorStyle = {};
  let descriptionColorStyle = {};
  let cardBgStyle = {};
  let textColorClass = '';
  let descriptionColorClass = '';
  let cardBgClass = '';
  
  if (theme === 'moderno') {
    containerStyles = 'bg-gradient-to-r from-purple-600 to-pink-600';
    textColorClass = 'text-white';
    descriptionColorClass = 'text-white/80';
    cardBgClass = 'bg-white/20';
  } else if (theme === 'elegante') {
    containerStyles = 'bg-gradient-to-r from-zinc-900 to-zinc-800 border-2 border-yellow-500/30';
    textColorClass = 'text-yellow-400';
    descriptionColorClass = 'text-zinc-400';
    cardBgClass = 'bg-yellow-500/10 border border-yellow-500/30';
  } else {
    // TEMA SENCILLO - Usar colores personalizados
    const accentColor = themeConfig.accentColor || '#a855f7';
    containerStyles = 'bg-white shadow-lg';
    textColorStyle = { color: accentColor };
    descriptionColorStyle = { color: '#6b7280' };
    cardBgStyle = { 
      backgroundColor: `${accentColor}10`,
      borderWidth: '1px',
      borderColor: `${accentColor}33`
    };
  }
  
  return (
    <div className="mx-4 mb-6 mt-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recompensas</h3>
      <div className={`rounded-xl p-4 ${containerStyles}`}>
        <div className="flex items-center space-x-3 mb-3">
          <Gift className={`w-6 h-6 ${textColorClass}`} style={textColorStyle} />
          <div className={`font-semibold ${textColorClass}`} style={textColorStyle}>Programa de Puntos</div>
        </div>
        {/* Contenedor scrollable horizontal para las recompensas */}
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
            {recompensas.map((recompensa: Recompensa, index: number) => (
              <motion.div
                key={recompensa.id}
                className={`rounded-lg p-3 min-w-[200px] max-w-[200px] ${cardBgClass}`}
                style={cardBgStyle}
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
                  <div className={`font-medium text-sm ${textColorClass}`} style={textColorStyle}>{recompensa.nombre}</div>
                  <div className={`text-xs mb-2 ${descriptionColorClass}`} style={descriptionColorStyle}>{recompensa.descripcion}</div>
                  <div className="flex items-center justify-between">
                    <div className={`font-bold text-sm ${textColorClass}`} style={textColorStyle}>
                      {recompensa.puntosRequeridos} pts
                    </div>
                    {(recompensa.stock && recompensa.stock > 0) && (
                      <div className={`text-xs ${descriptionColorClass}`} style={descriptionColorStyle}>
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
