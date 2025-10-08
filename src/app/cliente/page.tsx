'use client';

import { BrandingProvider } from './components/branding/BrandingProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthHandler from './components/AuthHandler';

export default function ClienteV2Page() {
  // ⚠️ DEPRECATED: Esta ruta /cliente está deprecada
  // Usa /[businessId]/cliente en su lugar para business isolation correcto
  
  // Redirigir al usuario a la página de login con mensaje
  if (typeof window !== 'undefined') {
    window.location.href = '/login?error=deprecated-route&message=Por favor usa la URL con tu negocio';
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirigiendo...</p>
      </div>
    </div>
  );
}
