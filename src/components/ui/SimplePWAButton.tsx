'use client';

interface SimplePWAButtonProps {
  position?: 'top-right' | 'bottom-right';
  theme?: 'dark' | 'light';
}

/**
 * Botón PWA simplificado - DESACTIVADO TEMPORALMENTE
 */
export default function SimplePWAButton({ 
  position = 'top-right', 
  theme = 'dark' 
}: SimplePWAButtonProps) {
  // Desactivado temporalmente - sin argumentos no utilizados
  console.log('SimplePWAButton desactivado', { position, theme });
  return null;
}
