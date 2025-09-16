'use client';

import { useEffect } from 'react';
import { BrandingProvider } from './components/branding/BrandingProvider';
import AuthHandler from './components/AuthHandler';

export default function ClienteV2Page() {
  // 🚫 BLOQUEO DE BUSINESS CONTEXT - SECURITY ENFORCEMENT
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Si estamos en ruta legacy sin business context, redirigir
    if (currentPath === '/cliente' || (currentPath.startsWith('/cliente/') && !currentPath.includes('/cafedani/') && !currentPath.includes('/arepa/'))) {
      console.log('🚫 Cliente: Ruta legacy detectada, redirigiendo automáticamente');
      
      // Para cliente, hacer redirect inteligente
      const redirectUrl = '/business-selection?blocked_route=' + encodeURIComponent(currentPath) + '&reason=legacy-cliente-redirect';
      window.location.href = redirectUrl;
      return;
    }
  }, []);

  return (
    <BrandingProvider>
      <AuthHandler />
    </BrandingProvider>
  );
}
