'use client';

import SimplePWAPrompt from './SimplePWAPrompt';
import { usePWAConditional } from '@/hooks/usePWAConditional';
import { usePathname } from 'next/navigation';

/**
 * Componente que muestra condicionalmente el prompt de instalación PWA
 * usando el sistema centralizado PWAManager
 */
export default function ConditionalPWAPrompt() {
  const shouldShow = usePWAConditional();
  const pathname = usePathname();

  // No renderizar nada si no debe mostrarse
  if (!shouldShow) {
    return null;
  }

  // Configuración específica por ruta
  const getConfigForRoute = () => {
    if (pathname === '/login') {
      return {
        variant: 'auto' as const,
        position: 'top' as const,
        autoShow: true,
        delay: 2000 // Mostrar después de 2s en login
      };
    }
    
    return {
      variant: 'auto' as const,
      position: 'top' as const,
      autoShow: true,
      delay: 5000 // Mostrar después de 5s en otras rutas
    };
  };

  const config = getConfigForRoute();

  return (
    <SimplePWAPrompt 
      variant={config.variant}
      position={config.position}
      autoShow={config.autoShow}
      delay={config.delay}
    />
  );
}
