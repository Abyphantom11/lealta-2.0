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

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  descuento?: number;
  activo?: boolean;
}

interface Recompensa {
  id: string;
  nombre: string;
  descripcion: string;
  puntosRequeridos: number;
  activo?: boolean;
}

interface ThemePreviewProps {
  theme: ThemeStyle;
  previewConfig?: ThemeConfig; // Config en tiempo real desde el editor
  promociones?: Promocion[]; // 🆕 Promociones reales
  recompensas?: Recompensa[]; // 🆕 Recompensas reales
}

export default function ThemePreview({ theme, previewConfig, promociones = [], recompensas = [] }: ThemePreviewProps) {
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
      <PromocionesPreview theme={theme} config={activeConfig} promociones={promociones} />
      
      {/* Recompensas Preview */}
      <RecompensasPreview theme={theme} config={activeConfig} recompensas={recompensas} />
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
        className="bg-[#0a0a0a] rounded-xl p-4 relative overflow-hidden border-2 border-yellow-500/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
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

function PromocionesPreview({ theme, config, promociones = [] }: { theme: ThemeStyle; config: any; promociones?: Promocion[] }) {
  // 🔥 Si no hay promociones, mostrar mensaje
  const promocionesActivas = promociones.filter(p => p.activo !== false).slice(0, 3);
  
  if (promocionesActivas.length === 0) {
    return (
      <div className={`rounded-xl p-3 ${
        theme === 'moderno' ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
        theme === 'elegante' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 border-2 border-yellow-500/30' :
        'bg-gray-100 border-2 border-gray-300'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <Percent className={`w-4 h-4 ${
            theme === 'moderno' ? 'text-white' :
            theme === 'elegante' ? 'text-yellow-400' :
            'text-gray-500'
          }`} />
          <div className={`font-semibold text-xs ${
            theme === 'moderno' ? 'text-white' :
            theme === 'elegante' ? 'text-yellow-400' :
            'text-gray-700'
          }`}>Ofertas del Día</div>
        </div>
        <p className={`text-xs ${
          theme === 'moderno' ? 'text-white/70' :
          theme === 'elegante' ? 'text-zinc-400' :
          'text-gray-500'
        }`}>
          No hay promociones activas. Crea una en la pestaña "Promociones".
        </p>
      </div>
    );
  }
  
  if (theme === 'moderno') {
    return (
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Percent className="w-4 h-4 text-white" />
          <div className="text-white font-semibold text-xs">Ofertas del Día</div>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {promocionesActivas.map((promo, index) => (
            <motion.div
              key={promo.id}
              className="bg-white/20 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-white font-medium text-xs mb-0.5 line-clamp-1">{promo.titulo}</div>
              <div className="text-white/80 text-xs mb-1 line-clamp-1">{promo.descripcion}</div>
              <div className="text-white font-bold text-xs">{promo.descuento ? `${promo.descuento}% OFF` : 'OFERTA'}</div>
            </motion.div>
          ))}
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
          {promocionesActivas.map((promo, index) => (
            <motion.div
              key={promo.id}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-yellow-400 font-medium text-xs mb-0.5 line-clamp-1">{promo.titulo}</div>
              <div className="text-zinc-400 text-xs mb-1 line-clamp-1">{promo.descripcion}</div>
              <div className="text-yellow-400 font-bold text-xs">{promo.descuento ? `${promo.descuento}% OFF` : 'OFERTA'}</div>
            </motion.div>
          ))}
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
        {promocionesActivas.map((promo, index) => (
          <motion.div
            key={promo.id}
            className="rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            style={{ backgroundColor: `${secondaryColor}15`, borderWidth: '1px', borderColor: `${secondaryColor}50` }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="font-medium text-xs mb-0.5 line-clamp-1" style={{ color: secondaryColor }}>{promo.titulo}</div>
            <div className="text-xs mb-1 line-clamp-1" style={{ color: '#6b7280' }}>{promo.descripcion}</div>
            <div className="font-bold text-xs" style={{ color: secondaryColor }}>{promo.descuento ? `${promo.descuento}% OFF` : 'OFERTA'}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ========================================
// 🎁 RECOMPENSAS PREVIEWS
// ========================================

function RecompensasPreview({ theme, config, recompensas = [] }: { theme: ThemeStyle; config: any; recompensas?: Recompensa[] }) {
  // 🔥 Si no hay recompensas, mostrar mensaje
  const recompensasActivas = recompensas.filter(r => r.activo !== false).slice(0, 3);
  
  if (recompensasActivas.length === 0) {
    return (
      <div className={`rounded-xl p-3 ${
        theme === 'moderno' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
        theme === 'elegante' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 border-2 border-yellow-500/30' :
        'bg-gray-100 border-2 border-purple-300'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <Gift className={`w-4 h-4 ${
            theme === 'moderno' ? 'text-white' :
            theme === 'elegante' ? 'text-yellow-400' :
            'text-purple-500'
          }`} />
          <div className={`font-semibold text-xs ${
            theme === 'moderno' ? 'text-white' :
            theme === 'elegante' ? 'text-yellow-400' :
            'text-purple-700'
          }`}>Programa de Puntos</div>
        </div>
        <p className={`text-xs ${
          theme === 'moderno' ? 'text-white/70' :
          theme === 'elegante' ? 'text-zinc-400' :
          'text-gray-500'
        }`}>
          No hay recompensas activas. Crea una en la pestaña "Recompensas".
        </p>
      </div>
    );
  }
  
  if (theme === 'moderno') {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Gift className="w-4 h-4 text-white" />
          <div className="text-white font-semibold text-xs">Programa de Puntos</div>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {recompensasActivas.map((recompensa, index) => (
            <motion.div
              key={recompensa.id}
              className="bg-white/20 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-white font-medium text-xs mb-0.5 line-clamp-1">{recompensa.nombre}</div>
              <div className="text-white/80 text-xs mb-1 line-clamp-1">{recompensa.descripcion}</div>
              <div className="text-white font-bold text-xs">{recompensa.puntosRequeridos} pts</div>
            </motion.div>
          ))}
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
          {recompensasActivas.map((recompensa, index) => (
            <motion.div
              key={recompensa.id}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-yellow-400 font-medium text-xs mb-0.5 line-clamp-1">{recompensa.nombre}</div>
              <div className="text-zinc-400 text-xs mb-1 line-clamp-1">{recompensa.descripcion}</div>
              <div className="text-yellow-400 font-bold text-xs">{recompensa.puntosRequeridos} pts</div>
            </motion.div>
          ))}
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
        {recompensasActivas.map((recompensa, index) => (
          <motion.div
            key={recompensa.id}
            className="rounded-lg px-2 pb-2 pt-2 min-w-[140px]"
            style={{ backgroundColor: `${accentColor}15`, borderWidth: '1px', borderColor: `${accentColor}50` }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="font-medium text-xs mb-0.5 line-clamp-1" style={{ color: accentColor }}>{recompensa.nombre}</div>
            <div className="text-xs mb-1 line-clamp-1" style={{ color: '#6b7280' }}>{recompensa.descripcion}</div>
            <div className="font-bold text-xs" style={{ color: accentColor }}>{recompensa.puntosRequeridos} pts</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
