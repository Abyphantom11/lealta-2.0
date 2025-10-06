'use client';

import { BrandingProvider } from './components/branding/BrandingProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthHandler from './components/AuthHandler';

export default function ClienteV2Page() {
  // 🔥 ID del negocio - Usando el ID correcto de "momo" en la BD
  const businessId = "cmgewmtue0000eygwq8taawak";
  
  return (
    <BrandingProvider businessId={businessId}>
      <ThemeProvider businessId={businessId}>
        <AuthHandler />
      </ThemeProvider>
    </BrandingProvider>
  );
}
