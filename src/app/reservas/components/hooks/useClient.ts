import { useEffect, useState } from 'react';

/**
 * Hook personalizado para detectar si estamos en el cliente
 * Previene errores de hidratación en Next.js
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para detectar si estamos en un dispositivo móvil
 * Solo funciona en el cliente para evitar hidratación
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;

    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileUA || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  return isMobile;
}
