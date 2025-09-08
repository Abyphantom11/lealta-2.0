'use client';
import { motion } from 'framer-motion';
import { Coffee, Eye } from 'lucide-react';
import { ClienteData } from '../types';

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
  
  // Debug: Verificar qué datos estamos recibiendo
  console.log('🐛 BalanceCard - clienteData:', clienteData);
  console.log('🐛 BalanceCard - tarjetaLealtad:', clienteData?.tarjetaLealtad);
  console.log('🐛 BalanceCard - puntos:', clienteData?.tarjetaLealtad?.puntos);
  
  // Obtener puntos de forma más robusta
  const puntos = clienteData?.tarjetaLealtad?.puntos ?? 0;
  
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
              Tarjeta ****{(clienteData?.cedula || cedula).slice(-4)}
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
};
