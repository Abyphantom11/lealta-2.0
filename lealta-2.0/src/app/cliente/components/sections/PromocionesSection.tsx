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
  descuento?: number;
  activo: boolean;
  dia?: string;
  horaInicio?: string;
  horaTermino?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface PromocionesProps {
  businessId?: string;
}

export default function PromocionesSection({ businessId }: PromocionesProps) {
  // 🔄 Auto-refresh hook para sincronización admin → cliente
  const { getPromociones, isLoading } = useAutoRefreshPortalConfig({
    businessId,
    refreshInterval: 15000, // 15 segundos para promociones (más frecuente)
    enabled: true
  });

  // Obtener promociones para el día actual con filtros
  const promociones = useMemo(() => {
    // Obtener el día actual
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
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    console.log(`🗓️ Día actual: ${diaActual}, Hora: ${Math.floor(horaActual/60)}:${horaActual%60}`);

    // Obtener todas las promociones activas
    const todasActivas = getPromociones();

    // Filtrar promociones del día actual que no hayan terminado
    const promocionesDelDia = todasActivas.filter((p: any) => {
      console.log(`🔍 Evaluando promoción: ${p.titulo}, día: ${p.dia}, diaActual: ${diaActual}`);

      // Verificar si es el día de la promoción O si estamos en las primeras horas del día siguiente
      let esDiaValido = false;

      if (p.dia === diaActual) {
        // Es el día de la promoción
        esDiaValido = true;
        console.log(`✅ Es el día de la promoción: ${p.dia}`);
      } else if (p.horaTermino) {
        // Verificar si estamos en las primeras horas del día siguiente
        const [horas, minutos] = p.horaTermino.split(':').map(Number);
        const horaTermino = horas * 60 + minutos;

        // Si la hora de término es temprana (ej: 4:00 AM) y estamos en el día siguiente antes de esa hora
        if (horaTermino < 12 * 60) { // Menos de 12 PM
          const indiceDiaAnterior = (ahora.getDay() - 1 + 7) % 7; // Día anterior con manejo circular
          const diaAnterior = diasSemana[indiceDiaAnterior];

          if (p.dia === diaAnterior && horaActual < horaTermino) {
            esDiaValido = true;
            console.log(`✅ Promoción del día anterior (${diaAnterior}) aún válida hasta las ${p.horaTermino}`);
          }
        }
      }

      if (!esDiaValido) {
        console.log(`❌ Promoción ${p.titulo} no es válida para hoy (${p.dia} != ${diaActual})`);
        return false;
      }

      // Si tiene hora de término y es el día de la promoción, la promoción dura el día completo hasta la hora de término del día siguiente
      if (p.horaTermino && p.dia === diaActual) {
        console.log(`✅ Promoción ${p.titulo} válida el día completo hasta las ${p.horaTermino} de mañana`);
        return true;
      }

      // Si tiene hora de término y estamos en el día siguiente, verificar la hora
      if (p.horaTermino && p.dia !== diaActual) {
        const [horas, minutos] = p.horaTermino.split(':').map(Number);
        const horaTermino = horas * 60 + minutos;
        const valida = horaActual < horaTermino;
        console.log(`⏰ Promoción ${p.titulo} - horaActual: ${Math.floor(horaActual/60)}:${horaActual%60}, horaTermino: ${Math.floor(horaTermino/60)}:${horaTermino%60}, válida: ${valida}`);
        return valida;
      }

      // Promoción válida sin restricción de horario
      console.log(`✅ Promoción ${p.titulo} sin restricción de horario`);
      return true;
    });

    console.log(`🎉 Promociones filtradas para mostrar (${promocionesDelDia.length}):`, promocionesDelDia);
    return promocionesDelDia;
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
