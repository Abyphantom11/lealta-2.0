'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LealtaLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function LealtaLogo({ size = 64, className = "", animated = false }: LealtaLogoProps) {
  const MotionSvg = animated ? motion.svg : 'svg';
  // const MotionDiv = animated ? motion.div : 'div';
  const MotionRect = animated ? motion.rect : 'rect';

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <MotionSvg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xl"
        {...(animated && {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: 0.6, ease: "easeOut" }
        })}
      >
        {/* Logo L elegante y visible */}
        <defs>
          <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1f1f1f" />
            <stop offset="60%" stopColor="#0a0a0a" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          
          <linearGradient id="lGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Círculo de fondo con degradado */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="url(#backgroundGradient)"
          className="filter drop-shadow-2xl"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
        />
        
        {/* L elegante centrada y visible */}
        <g fill="url(#lGradient)" filter="url(#softGlow)">
          {/* Parte vertical de la L - centrada */}
          <MotionRect
            x="28"
            y="21"
            width="7"
            height="33"
            rx="3.5"
            {...(animated && {
              initial: { scaleY: 0, transformOrigin: "bottom" },
              animate: { scaleY: 1 },
              transition: { duration: 0.8, delay: 0.2, ease: "easeOut" }
            })}
          />
          
          {/* Parte horizontal de la L - centrada */}
          <MotionRect
            x="28"
            y="47"
            width="23"
            height="7"
            rx="3.5"
            {...(animated && {
              initial: { scaleX: 0, transformOrigin: "left" },
              animate: { scaleX: 1 },
              transition: { duration: 0.8, delay: 0.6, ease: "easeOut" }
            })}
          />
          
          {/* Highlight sutil en la parte superior */}
          <MotionRect
            x="29"
            y="21"
            width="5"
            height="3.5"
            rx="1.75"
            fill="rgba(255, 255, 255, 0.9)"
            {...(animated && {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.4, delay: 1.2 }
            })}
          />
          
          {/* Highlight en la esquina horizontal */}
          <MotionRect
            x="29"
            y="48"
            width="3.5"
            height="5"
            rx="1.75"
            fill="rgba(255, 255, 255, 0.9)"
            {...(animated && {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.4, delay: 1.4 }
            })}
          />
        </g>
        
        {/* Efecto de movimiento ascendente */}
        {animated && (
          <>
            <motion.circle
              cx="45"
              cy="45"
              r="2"
              fill="#60a5fa"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 0], y: [10, -5, -15] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
            <motion.circle
              cx="50"
              cy="50"
              r="1.5"
              fill="#93c5fd"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], y: [8, -3, -10] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.3 }}
            />
            <motion.circle
              cx="40"
              cy="48"
              r="1"
              fill="#dbeafe"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: [0, 1, 0], y: [6, -2, -8] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.6 }}
            />
          </>
        )}
      </MotionSvg>
    </div>
  );
}

// Variante para texto con logo
export function LealtaLogoWithText({ 
  size = 40, 
  className = "",
  animated = false 
}: LealtaLogoProps & { animated?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LealtaLogo size={size} animated={animated} />
      <motion.div 
        className="flex flex-col"
        {...(animated && {
          initial: { x: -20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { duration: 0.8, delay: 0.4 }
        })}
      >
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          lealta
        </span>
        <span className="text-xs text-gray-400 -mt-1">
          Incrementa tus posibilidades
        </span>
      </motion.div>
    </div>
  );
}

export default LealtaLogo;
