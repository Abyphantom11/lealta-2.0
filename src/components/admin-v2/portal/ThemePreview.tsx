'use client';

import { motion } from 'framer-motion';
import { Coffee, Gift, Percent } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

type ThemeStyle = 'moderno' | 'elegante' | 'sencillo';

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  nameColor?: string;
}

interface ThemePreviewProps {
  theme: ThemeStyle;
  previewConfig?: ThemeConfig; // Config en tiempo real desde el editor
}

export default function ThemePreview({ theme, previewConfig }: ThemePreviewProps) {
  const { themeConfig } = useTheme();
  
  // Usar previewConfig si está disponible (desde el editor), sino usar themeConfig del contexto
  const activeConfig = previewConfig || themeConfig;
  
  return (
    <div className="space-y-4">
      {/* Header with Client Name */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold text-white">
          Bienvenido, <span style={{ color: activeConfig.nameColor || '#ec4899' }}>Cliente</span>
        </h3>
        <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
          <span className="text-white text-sm font-semibold">C</span>
        </div>
      </div>
      
      {/* Balance Card Preview */}
      <BalanceCardPreview theme={theme} config={activeConfig} />
      
      {/* Promociones Preview */}
      <PromocionesPreview theme={theme} config={activeConfig} />
      
      {/* Recompensas Preview */}
      <RecompensasPreview theme={theme} config={activeConfig} />
    </div>
  );
}

// ========================================
// 💳 BALANCE CARD PREVIEWS
// ========================================

function BalanceCardPreview({ theme, config }: { theme: ThemeStyle; config: any }) {
  if (theme === 'moderno') {
    return (
      <motion.div
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-4 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
          <Coffee className="w-full h-full text-white/30" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="text-white/80 text-xs mb-1">Balance de Puntos</div>
            <div className="text-2xl font-bold text-white mb-0.5">150</div>
            <div className="text-white/60 text-xs">Tarjeta ****1234</div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (theme === 'elegante') {
    return (
      <motion.div
        className="bg-[#0a0a0a] rounded-xl p-4 relative overflow-hidden border-2 border-yellow-400 shadow-2xl shadow-yellow-400/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Degradado metálico sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 via-transparent to-zinc-700/10" />
        
        {/* Background pattern elegante con efecto dorado */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-yellow-400">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="text-zinc-400 text-xs mb-1 font-light tracking-wide">Balance de Puntos</div>
            <div className="text-2xl font-bold text-yellow-400 mb-0.5">150</div>
            <div className="text-zinc-500 text-xs font-light">Tarjeta ****1234</div>
          </div>
        </div>

        {/* Shine effect metálico */}
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/3 via-transparent to-zinc-400/3 pointer-events-none" />
      </motion.div>
    );
  }

  // Sencillo - with custom colors
  const primaryColor = config.primaryColor || '#3b82f6';
  return (
    <motion.div
      className="bg-white rounded-lg p-4 relative overflow-hidden shadow-md"
      style={{ borderWidth: '2px', borderColor: primaryColor }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-600 text-xs mb-1">Balance de Puntos</div>
          <div className="text-2xl font-bold mb-0.5" style={{ color: primaryColor }}>150</div>
          <div className="text-gray-500 text-xs">Tarjeta ****1234</div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// 🎁 PROMOCIONES PREVIEWS
// ========================================

function PromocionesPreview({ theme, config }: { theme: ThemeStyle; config: any }) {
  if (theme === 'moderno') {
    return (
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Percent className="w-4 h-4 text-white" />
          <div className="text-white font-semibold text-xs">Ofertas del Día</div>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <motion.div
            className="bg-white/20 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-white font-medium text-xs mb-0.5">2x1 Hamburguesas</div>
            <div className="text-white/80 text-xs mb-1">Lunes a Viernes</div>
            <div className="text-white font-bold text-xs">50% OFF</div>
          </motion.div>

          <motion.div
            className="bg-white/20 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-white font-medium text-xs mb-0.5">Bebida Gratis</div>
            <div className="text-white/80 text-xs mb-1">Con cualquier combo</div>
            <div className="text-white font-bold text-xs">GRATIS</div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (theme === 'elegante') {
    return (
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-2 border-yellow-500/30 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Percent className="w-4 h-4 text-yellow-400" />
          <div className="text-yellow-400 font-semibold text-xs">Ofertas del Día</div>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <motion.div
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-yellow-400 font-medium text-xs mb-0.5">2x1 Hamburguesas</div>
            <div className="text-zinc-400 text-xs mb-1">Lunes a Viernes</div>
            <div className="text-yellow-400 font-bold text-xs">50% OFF</div>
          </motion.div>

          <motion.div
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-yellow-400 font-medium text-xs mb-0.5">Bebida Gratis</div>
            <div className="text-zinc-400 text-xs mb-1">Con cualquier combo</div>
            <div className="text-yellow-400 font-bold text-xs">GRATIS</div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Sencillo - with custom colors
  const secondaryColor = config.secondaryColor || '#10b981';
  return (
    <div 
      className="rounded-xl p-3"
      style={{ backgroundColor: 'white', borderWidth: '2px', borderColor: secondaryColor }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Percent className="w-4 h-4" style={{ color: secondaryColor }} />
        <div className="font-semibold text-xs" style={{ color: secondaryColor }}>Ofertas del Día</div>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-1">
        <motion.div
          className="rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
          style={{ backgroundColor: `${secondaryColor}15`, borderWidth: '1px', borderColor: `${secondaryColor}50` }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="font-medium text-xs mb-0.5" style={{ color: secondaryColor }}>2x1 Hamburguesas</div>
          <div className="text-gray-600 text-xs mb-1">Lunes a Viernes</div>
          <div className="font-bold text-xs" style={{ color: secondaryColor }}>50% OFF</div>
        </motion.div>

        <motion.div
          className="rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
          style={{ backgroundColor: `${secondaryColor}15`, borderWidth: '1px', borderColor: `${secondaryColor}50` }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="font-medium text-xs mb-0.5" style={{ color: secondaryColor }}>Bebida Gratis</div>
          <div className="text-gray-600 text-xs mb-1">Con cualquier combo</div>
          <div className="font-bold text-xs" style={{ color: secondaryColor }}>GRATIS</div>
        </motion.div>
      </div>
    </div>
  );
}

// ========================================
// 🎁 RECOMPENSAS PREVIEWS
// ========================================

function RecompensasPreview({ theme, config }: { theme: ThemeStyle; config: any }) {
  if (theme === 'moderno') {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Gift className="w-4 h-4 text-white" />
          <div className="text-white font-semibold text-xs">Programa de Puntos</div>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <motion.div
            className="bg-white/20 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-white font-medium text-xs mb-0.5">Café Gratis</div>
            <div className="text-white/80 text-xs mb-1">Redime tu premio</div>
            <div className="text-white font-bold text-xs">45 pts</div>
          </motion.div>

          <motion.div
            className="bg-white/20 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-white font-medium text-xs mb-0.5">Descuento 20%</div>
            <div className="text-white/80 text-xs mb-1">En tu próxima compra</div>
            <div className="text-white font-bold text-xs">100 pts</div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (theme === 'elegante') {
    return (
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-2 border-yellow-500/30 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Gift className="w-4 h-4 text-yellow-400" />
          <div className="text-yellow-400 font-semibold text-xs">Programa de Puntos</div>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <motion.div
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-yellow-400 font-medium text-xs mb-0.5">Café Gratis</div>
            <div className="text-zinc-400 text-xs mb-1">Redime tu premio</div>
            <div className="text-yellow-400 font-bold text-xs">45 pts</div>
          </motion.div>

          <motion.div
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-yellow-400 font-medium text-xs mb-0.5">Descuento 20%</div>
            <div className="text-zinc-400 text-xs mb-1">En tu próxima compra</div>
            <div className="text-yellow-400 font-bold text-xs">100 pts</div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Sencillo - with custom colors
  const accentColor = config.accentColor || '#8b5cf6';
  return (
    <div 
      className="rounded-xl p-3"
      style={{ backgroundColor: 'white', borderWidth: '2px', borderColor: accentColor }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Gift className="w-4 h-4" style={{ color: accentColor }} />
        <div className="font-semibold text-xs" style={{ color: accentColor }}>Programa de Puntos</div>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-1">
        <motion.div
          className="rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
          style={{ backgroundColor: `${accentColor}15`, borderWidth: '1px', borderColor: `${accentColor}50` }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="font-medium text-xs mb-0.5" style={{ color: accentColor }}>Café Gratis</div>
          <div className="text-gray-600 text-xs mb-1">Redime tu premio</div>
          <div className="font-bold text-xs" style={{ color: accentColor }}>45 pts</div>
        </motion.div>

        <motion.div
          className="rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
          style={{ backgroundColor: `${accentColor}15`, borderWidth: '1px', borderColor: `${accentColor}50` }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="font-medium text-xs mb-0.5" style={{ color: accentColor }}>Descuento 20%</div>
          <div className="text-gray-600 text-xs mb-1">En tu próxima compra</div>
          <div className="font-bold text-xs" style={{ color: accentColor }}>100 pts</div>
        </motion.div>
      </div>
    </div>
  );
}
