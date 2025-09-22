'use client';

// ✅ PWA COMPLETAMENTE DESHABILITADO - Todas las importaciones comentadas para evitar errores
// import { useState, useEffect } from 'react';
// import { usePathname } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Download, X } from 'lucide-react';
// import { shouldShowPWAButtonForRoute } from '@/hooks/usePWAConditional';
// import { triggerPWAInstall } from '../PWAManager';

interface PWAInstallButtonProps {
  position?: 'top-right' | 'bottom-right';
  theme?: 'dark' | 'light';
}

export default function PWAInstallButton({ 
  position = 'top-right', 
  theme = 'dark' 
}: Readonly<PWAInstallButtonProps>) {
  // ✅ PWA COMPLETAMENTE DESHABILITADO
  console.log('🚫 PWAInstallButton principal: Componente deshabilitado');
  return null;
}
