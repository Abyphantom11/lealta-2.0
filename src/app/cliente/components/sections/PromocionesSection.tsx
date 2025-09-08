'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Percent } from 'lucide-react';

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

export default function PromocionesSection() {
  const [promociones, setPromociones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchPromociones = useCallback(async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default');
        if (response.ok) {
          const data = await response.json();
          
          // Obtener todas las promociones activas
          const todasActivas = data.config?.promociones?.filter((p: any) => p.activo) || [];
          
          // Obtener el día y hora actual SIEMPRE actualizada
          const ahora = new Date();
          const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          const diaActual = diasSemana[ahora.getDay()];
          const horaActual = ahora.getHours() * 60 + ahora.getMinutes(); // Convertir a minutos desde medianoche
          
          console.log(`🕐 Debug Promociones - Día: ${diaActual}, Hora: ${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')}`);
          console.log(`🔍 Promociones totales encontradas:`, todasActivas);
          console.log(`⏰ Hora actual en minutos:`, horaActual);
          
          // Filtrar promociones del día actual que no hayan terminado
          const promocionesDelDia = todasActivas.filter((p: any) => {
            console.log(`📦 Evaluando promo "${p.titulo}" - Día: ${p.dia}, Hora término: ${p.horaTermino}`);
            
            if (p.dia !== diaActual) {
              console.log(`❌ Promo "${p.titulo}" no es para hoy (${diaActual})`);
              return false;
            }
            
            // Si tiene hora de término, verificar que no haya pasado
            if (p.horaTermino) {
              const [horas, minutos] = p.horaTermino.split(':').map(Number);
              const horaTermino = horas * 60 + minutos;
              
              console.log(`🕐 Promo "${p.titulo}": termina a las ${p.horaTermino} (${horaTermino} min), ahora son ${horaActual} min`);
              
              const resultado = horaActual < horaTermino;
              console.log(`⏰ ¿Promo "${p.titulo}" aún válida?`, resultado);
              return resultado;
            }
            
            console.log(`✅ Promo "${p.titulo}" válida (sin hora límite)`);
            // Promoción válida sin restricción de horario
            return true;
          });
          
          console.log(`✅ Promociones válidas para ${diaActual}:`, promocionesDelDia);
          
          // Si no hay promociones para el día actual, mostrar todas las activas (sin filtro de hora)
          setPromociones(promocionesDelDia.length > 0 ? promocionesDelDia : todasActivas);
        }
      } catch (error) {
        console.error('Error loading promociones:', error);
      } finally {
        setIsLoading(false);
      }
    }, []);
    
    useEffect(() => {
      fetchPromociones();
      
      // Actualizar promociones cada minuto para cambios automáticos de día/hora
      const interval = setInterval(() => {
        console.log('🔄 Actualizando promociones automáticamente...');
        fetchPromociones();
      }, 60000); // Cada 60 segundos
      
      return () => clearInterval(interval);
    }, [fetchPromociones]);

    // También actualizar cuando se enfoque la ventana (si alguien vuelve después de un rato)
    useEffect(() => {
      const handleFocus = () => {
        console.log('👁️ Ventana enfocada - actualizando promociones...');
        fetchPromociones();
      };
      
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }, [fetchPromociones]);
    
  if (isLoading || promociones.length === 0) return null;
  
  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Promociones Especiales</h3>
      <div className="grid grid-cols-1 gap-3">
        {promociones.map((promo: Promocion, index: number) => (
          <motion.div
            key={promo.id}
            className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Imagen de fondo si existe */}
            {promo.imagenUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${promo.imagenUrl})` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{promo.titulo}</div>
                  <div className="text-white/80 text-sm">{promo.descripcion}</div>
                  <div className="text-white/90 text-sm mt-1 font-bold">
                    {promo.descuento}% de descuento
                  </div>
                  {promo.fechaFin && (
                    <div className="text-white/60 text-xs mt-1">
                      Válido hasta: {new Date(promo.fechaFin).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <Percent className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
