'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Users } from 'lucide-react';

interface AsistenciaUpdatedIndicatorProps {
  reservaId: string;
  nuevaAsistencia: number;
  maxAsistencia: number;
  onAnimationComplete?: () => void;
}

export function AsistenciaUpdatedIndicator({ 
  reservaId, 
  nuevaAsistencia, 
  maxAsistencia,
  onAnimationComplete 
}: AsistenciaUpdatedIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const isExceso = nuevaAsistencia > maxAsistencia;
  const exceso = Math.max(0, nuevaAsistencia - maxAsistencia);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.3 
          }}
          className={`
            absolute top-0 right-0 z-10 px-3 py-1 rounded-full text-xs font-semibold
            flex items-center gap-1.5 shadow-lg border-2
            ${isExceso 
              ? 'bg-orange-100 text-orange-800 border-orange-300' 
              : 'bg-green-100 text-green-800 border-green-300'
            }
          `}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 600 }}
          >
            {isExceso ? (
              <Clock className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
          </motion.div>
          
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1"
          >
            <Users className="h-3 w-3" />
            {nuevaAsistencia}/{maxAsistencia}
            {exceso > 0 && (
              <span className="text-orange-600 font-bold">
                (+{exceso})
              </span>
            )}
          </motion.span>
          
          {/* Pulso de fondo */}
          <motion.div
            className={`
              absolute inset-0 rounded-full opacity-20
              ${isExceso ? 'bg-orange-500' : 'bg-green-500'}
            `}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ 
              duration: 1.5, 
              repeat: 2,
              ease: "easeInOut" 
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook para manejar múltiples indicadores
export function useAsistenciaIndicators() {
  const [indicators, setIndicators] = useState<Record<string, AsistenciaUpdatedIndicatorProps>>({});

  const showIndicator = (reservaId: string, nuevaAsistencia: number, maxAsistencia: number) => {
    setIndicators(prev => ({
      ...prev,
      [reservaId]: {
        reservaId,
        nuevaAsistencia,
        maxAsistencia,
        onAnimationComplete: () => {
          setIndicators(current => {
            const { [reservaId]: removed, ...rest } = current;
            return rest;
          });
        }
      }
    }));
  };

  const clearIndicator = (reservaId: string) => {
    setIndicators(prev => {
      const { [reservaId]: removed, ...rest } = prev;
      return rest;
    });
  };

  return {
    indicators,
    showIndicator,
    clearIndicator,
    hasIndicators: Object.keys(indicators).length > 0
  };
}
