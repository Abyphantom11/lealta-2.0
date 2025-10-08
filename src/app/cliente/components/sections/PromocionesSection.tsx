'use client';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Percent } from 'lucide-react';
import { useAutoRefreshPortalConfig } from '@/hooks/useAutoRefreshPortalConfig';
import { useTheme } from '@/contexts/ThemeContext';

interface Promocion {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen?: string;
  imagenUrl?: string;
  descuento: number;
  activo: boolean;
  dia?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  horaTermino?: string;
}

interface PromocionesProps {
  businessId?: string;
}

export default function PromocionesSection({ businessId }: Readonly<PromocionesProps>) {
  const { theme, themeConfig } = useTheme();
  const [sectionTitle, setSectionTitle] = useState('Promociones Especiales');
  
  // 🔄 Auto-refresh hook para sincronización admin → cliente
  const { getPromociones, isLoading } = useAutoRefreshPortalConfig({
    businessId,
    refreshInterval: 15000, // 15 segundos para promociones (más frecuente)
    enabled: true
  });
  
  // 📥 Cargar título personalizado
  const loadSectionTitle = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const response = await fetch(`/api/portal/section-titles?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setSectionTitle(data.promocionesTitle || 'Promociones Especiales');
      }
    } catch (error) {
      console.error('Error cargando título de sección:', error);
    }
  }, [businessId]);
  
  useEffect(() => {
    loadSectionTitle();
  }, [loadSectionTitle]);

  // Obtener promociones para el día comercial actual con filtros (usa día comercial internamente)
  const promociones = useMemo(() => {
    const allPromociones = getPromociones(); // Ya incluye lógica de día comercial
    
    if (!allPromociones || allPromociones.length === 0) {
      return [];
    }

    // Obtener hora actual para validaciones
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    // Filtrar promociones activas y validar horarios
    const promocionesActivas = allPromociones.filter((p: any) => {
      // Verificar estado activo
      if (!p.activo) return false;

      // Si tiene hora de término, verificar que no haya terminado
      if (p.horaTermino) {
        const [horas, minutos] = p.horaTermino.split(':').map(Number);
        const horaTermino = horas * 60 + minutos;
        return horaActual < horaTermino;
      }

      return true;
    });

    return promocionesActivas;
  }, [getPromociones]);

  if (isLoading || promociones.length === 0) return null;

  // 🎨 Estilos según el tema
  let containerStyles = '';
  let textColorStyle = {};
  let descriptionColorStyle = {};
  let cardBgStyle = {};
  let textColorClass = '';
  let descriptionColorClass = '';
  let cardBgClass = '';
  
  if (theme === 'moderno') {
    containerStyles = 'bg-gradient-to-r from-green-600 to-emerald-600';
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
    const secondaryColor = themeConfig.secondaryColor || '#10b981';
    containerStyles = 'bg-white shadow-lg';
    textColorStyle = { color: secondaryColor };
    descriptionColorStyle = { color: '#6b7280' };
    cardBgStyle = { 
      backgroundColor: `${secondaryColor}10`,
      borderWidth: '1px',
      borderColor: `${secondaryColor}33`
    };
  }

  return (
    <div className="mx-4 mb-6 mt-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {sectionTitle}
      </h3>
      <div className={`rounded-xl p-4 ${containerStyles}`}>
        <div className="flex items-center space-x-3 mb-3">
          <Percent className={`w-6 h-6 ${textColorClass}`} style={textColorStyle} />
        </div>
        {/* Contenedor scrollable horizontal para las promociones */}
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
            {promociones.map((promo: Promocion, index: number) => (
              <motion.div
                key={promo.id}
                className={`rounded-lg p-3 min-w-[200px] max-w-[200px] relative overflow-hidden ${cardBgClass}`}
                style={cardBgStyle}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Imagen de fondo si existe */}
                {promo.imagenUrl && (
                  <div className="w-full h-20 mb-2 rounded-md overflow-hidden">
                    <img
                      src={promo.imagenUrl}
                      alt={promo.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className={`font-medium text-sm ${textColorClass}`} style={textColorStyle}>{promo.titulo}</div>
                  <div className={`text-xs mb-2 ${descriptionColorClass}`} style={descriptionColorStyle}>{promo.descripcion}</div>
                  <div className="flex items-center justify-between">
                    {/* Solo mostrar el descuento si es mayor a 0 */}
                    {Boolean(promo.descuento && promo.descuento > 0) && (
                      <div className={`font-bold text-sm ${textColorClass}`} style={textColorStyle}>
                        {promo.descuento}% OFF
                      </div>
                    )}
                    {promo.fechaFin && (
                      <div className={`text-xs ${descriptionColorClass}`} style={descriptionColorStyle}>
                        Hasta: {new Date(promo.fechaFin).toLocaleDateString()}
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
