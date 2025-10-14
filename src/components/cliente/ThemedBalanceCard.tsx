'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedBalanceCardProps {
  puntos: number;
  tarjetaNumero: string;
  nivel?: string;
}

export default function ThemedBalanceCard({ puntos, tarjetaNumero, nivel }: ThemedBalanceCardProps) {
  const { theme } = useTheme();

  if (theme === 'moderno') {
    return (
      <motion.div
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 relative overflow-hidden shadow-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="relative z-10">
          <div className="text-white/80 text-sm mb-1">Balance de Puntos</div>
          <div className="text-white text-4xl font-bold mb-1">{puntos}</div>
          <div className="text-white/70 text-sm">Tarjeta {tarjetaNumero}</div>
          {nivel && (
            <div className="mt-3 inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium">
              Nivel: {nivel}
            </div>
          )}
        </div>
        <Star className="absolute bottom-4 right-4 w-24 h-24 text-white/10" />
      </motion.div>
    );
  }

  if (theme === 'elegante') {
    return (
      <motion.div
        className="bg-[#0a0a0a] rounded-2xl p-6 relative overflow-hidden border-2 border-yellow-400 shadow-2xl shadow-yellow-400/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Degradado metálico sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 via-transparent to-zinc-700/10" />
        
        {/* Background pattern elegante */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-yellow-400">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>

        <div className="relative z-10">
          <div className="text-zinc-400 text-sm mb-1 font-light tracking-wide">Balance de Puntos</div>
          <div className="text-yellow-400 text-4xl font-bold mb-1">{puntos}</div>
          <div className="text-zinc-500 text-sm font-light">Tarjeta {tarjetaNumero}</div>
          {nivel && (
            <div className="mt-3 inline-block bg-yellow-400/10 border border-yellow-400/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-yellow-400 font-medium">
              Nivel: {nivel}
            </div>
          )}
        </div>

        {/* Shine effect metálico */}
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/3 via-transparent to-zinc-400/3 pointer-events-none" />
      </motion.div>
    );
  }

  // Tema Sencillo
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 border-2 border-blue-500 shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="text-gray-600 text-sm mb-1">Balance de Puntos</div>
      <div className="text-blue-600 text-4xl font-bold mb-1">{puntos}</div>
      <div className="text-gray-500 text-sm">Tarjeta {tarjetaNumero}</div>
      {nivel && (
        <div className="mt-3 inline-block bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs text-blue-600 font-medium">
          Nivel: {nivel}
        </div>
      )}
    </motion.div>
  );
}
