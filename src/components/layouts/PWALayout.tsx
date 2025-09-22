'use client';

import { useEffect } from 'react';
// import { initializePWA } from '@/services/pwaService'; // ✅ DESHABILITADO
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';

interface PWALayoutProps {
  readonly children: React.ReactNode;
  readonly showInstallPrompt?: boolean;
  readonly promptPosition?: 'top' | 'bottom' | 'floating';
}

export default function PWALayout({ 
  children, 
  showInstallPrompt = false, // ✅ DESHABILITADO por defecto
  promptPosition = 'bottom' 
}: PWALayoutProps) {
  useEffect(() => {
    // ✅ PWA COMPLETAMENTE DESHABILITADO
    console.log('🚫 PWA Layout: Inicialización deshabilitada');
    // initializePWA(); // COMENTADO - NO INICIALIZAR PWA
  }, []);

  return (
    <>
      {children}
      
      {/* ✅ PWA Install Prompt COMPLETAMENTE DESHABILITADO */}
      {false && showInstallPrompt && (
        <PWAInstallPrompt 
          variant="auto" 
          showOnLogin={false} 
          position={promptPosition} 
        />
      )}
    </>
  );
}
