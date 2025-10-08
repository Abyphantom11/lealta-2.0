'use client';
import { motion } from 'framer-motion';
import { Coffee, Eye } from 'lucide-react';
import { ClienteData } from '../types';
import { useTheme } from '@/contexts/ThemeContext';

interface BalanceCardProps {
  clienteData: ClienteData | null;
  cedula: string;
  showTarjeta: boolean;
  setShowTarjeta: (show: boolean) => void;
}

// Balance Card extraído del original - COMPONENTE EXACTO DEL ORIGINAL
export const BalanceCard = ({ 
  clienteData, 
  cedula, 
  showTarjeta, 
  setShowTarjeta 
}: BalanceCardProps) => {
  
  const { theme, themeConfig, isLoading } = useTheme();
  
  // Obtener puntos de forma más robusta
  const puntos = clienteData?.tarjetaLealtad?.puntos ?? 0;
  const tarjetaNumero = (clienteData?.cedula || cedula).slice(-4);
  
  // Mostrar loading mientras carga el tema
  if (isLoading) {
    return (
      <div className="mx-4 mb-6 mt-4">
        <div className="bg-dark-800 rounded-2xl p-6 animate-pulse">
          <div className="h-20 bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  // 🌈 TEMA MODERNO
  if (theme === 'moderno') {
    return (
      <div className="mx-4 mb-6 mt-4">
        <motion.div
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <Coffee className="w-full h-full text-white/30" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/80 text-lg mb-2">Balance de Puntos</div>
              <div className="text-4xl font-bold text-white mb-1">
                {puntos}
              </div>
              <div className="text-white/60 text-sm mb-2">
                Tarjeta ****{tarjetaNumero}
              </div>
            </div>
            <button 
              onClick={() => setShowTarjeta(!showTarjeta)} 
              className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
              aria-label="Ver tarjeta de fidelidad"
            >
              <Eye className="w-6 h-6 text-white" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // ✨ TEMA ELEGANTE
  if (theme === 'elegante') {
    return (
      <div className="mx-4 mb-6 mt-4">
        <motion.div
          className="bg-[#0a0a0a] rounded-2xl p-6 relative overflow-hidden border-2 border-yellow-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background pattern elegante */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-yellow-400">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-zinc-400 text-lg mb-2 font-light tracking-wide">Balance de Puntos</div>
              <div className="text-4xl font-bold text-yellow-400 mb-1">
                {puntos}
              </div>
              <div className="text-zinc-500 text-sm font-light mb-2">
                Tarjeta ****{tarjetaNumero}
              </div>
            </div>
            <button 
              onClick={() => setShowTarjeta(!showTarjeta)} 
              className="bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-sm rounded-full p-3 hover:bg-yellow-500/20 transition-colors"
              aria-label="Ver tarjeta de fidelidad"
            >
              <Eye className="w-6 h-6 text-yellow-400" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // 📋 TEMA SENCILLO
  const primaryColor = themeConfig.primaryColor || '#3b82f6';
  
  return (
    <div className="mx-4 mb-6 mt-4">
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden"
        style={{ borderWidth: '2px', borderColor: primaryColor }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-600 text-lg mb-2">Balance de Puntos</div>
            <div className="text-4xl font-bold mb-1" style={{ color: primaryColor }}>
              {puntos}
            </div>
            <div className="text-gray-500 text-sm mb-2">
              Tarjeta ****{tarjetaNumero}
            </div>
          </div>
          <button 
            onClick={() => setShowTarjeta(!showTarjeta)} 
            className="rounded-full p-3 transition-colors"
            style={{ 
              backgroundColor: `${primaryColor}10`,
              borderWidth: '1px',
              borderColor: `${primaryColor}33`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
            aria-label="Ver tarjeta de fidelidad"
          >
            <Eye className="w-6 h-6" style={{ color: primaryColor }} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
