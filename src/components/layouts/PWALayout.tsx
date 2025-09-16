'use client';

import { useEffect } from 'react';
import { initializePWA } from '@/services/pwaService';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';

interface PWALayoutProps {
  children: React.ReactNode;
  showInstallPrompt?: boolean;
  promptPosition?: 'top' | 'bottom' | 'floating';
}

export default function PWALayout({ 
  children, 
  showInstallPrompt = true, 
  promptPosition = 'bottom' 
}: PWALayoutProps) {
  useEffect(() => {
    // Inicializar PWA cuando el componente se monta
    initializePWA();
  }, []);

  return (
    <>
      {children}
      
      {/* PWA Install Prompt global */}
      {showInstallPrompt && (
        <PWAInstallPrompt 
          variant="auto" 
          showOnLogin={false} 
          position={promptPosition} 
        />
      )}
    </>
  );
}
