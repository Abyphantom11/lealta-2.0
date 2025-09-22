'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Percent } from 'lucide-react';
import { useAutoRefreshPortalConfig } from '@/hooks/useAutoRefreshPortalConfig';

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
  // 🔄 Auto-refresh hook para sincronización admin → cliente
  const { getPromociones, isLoading } = useAutoRefreshPortalConfig({
    businessId,
    refreshInterval: 15000, // 15 segundos para promociones (más frecuente)
    enabled: true
  });

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

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Promociones Especiales
      </h3>
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Percent className="w-6 h-6 text-white" />
          <div className="text-white font-semibold">Ofertas del Día</div>
        </div>
        {/* Contenedor scrollable horizontal para las promociones */}
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
            {promociones.map((promo: Promocion, index: number) => (
              <motion.div
                key={promo.id}
                className="bg-white/20 rounded-lg p-3 min-w-[200px] max-w-[200px] relative overflow-hidden"
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
                  <div className="text-white font-medium text-sm">{promo.titulo}</div>
                  <div className="text-white/80 text-xs mb-2">{promo.descripcion}</div>
                  <div className="flex items-center justify-between">
                    {/* Solo mostrar el descuento si es mayor a 0 */}
                    {Boolean(promo.descuento && promo.descuento > 0) && (
                      <div className="text-white font-bold text-sm">
                        {promo.descuento}% OFF
                      </div>
                    )}
                    {promo.fechaFin && (
                      <div className="text-white/60 text-xs">
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
