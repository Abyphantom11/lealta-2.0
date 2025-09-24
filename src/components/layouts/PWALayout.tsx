'use client';

import { useEffect } from 'react';

interface PWALayoutProps {
  readonly children: React.ReactNode;
}

export default function PWALayout({ children }: PWALayoutProps) {
  useEffect(() => {
    // ✅ PWA COMPLETAMENTE DESHABILITADO
    console.log('🚫 PWA Layout: Inicialización deshabilitada');
    // initializePWA(); // COMENTADO - NO INICIALIZAR PWA
  }, []);

  return (
    <>
      {children}
      {/* PWA Install Prompt deshabilitado - funcionalidad removida temporalmente */}
    </>
  );
}
