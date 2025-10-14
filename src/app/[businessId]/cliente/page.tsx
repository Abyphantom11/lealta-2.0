'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandingProvider } from '../../cliente/components/branding/BrandingProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthHandler from '../../cliente/components/AuthHandler';
import DynamicManifest from '@/components/DynamicManifest';
import IOSInstallWrapper from '@/components/ios/IOSInstallWrapper';

/**
 * Página dinámica del portal cliente
 * Ruta: /[businessId]/cliente
 */
export default function BusinessClientePage() {
  const params = useParams();
  const businessSlug = params?.businessId as string; // Slug de la URL
  const [businessData, setBusinessData] = useState<any>(null); // Datos completos del business
  const [isValidBusiness, setIsValidBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validar que el businessId existe y es válido
    const validateBusiness = async () => {
      try {
        const response = await fetch(`/api/businesses/${businessSlug}/validate`);
        if (response.ok) {
          const businessInfo = await response.json();
          setBusinessData(businessInfo); // Guardar datos completos incluido el ID real
          setIsValidBusiness(true);
        } else {
          window.location.href = `/login?error=invalid-business&message=El negocio no es válido o no existe`;
        }
      } catch (error) {
        console.error('❌ Cliente - Error validating business:', error);
        setIsValidBusiness(false);
        window.location.href = '/login?error=validation-error';
      } finally {
        setIsLoading(false);
      }
    };

    if (businessSlug) {
      validateBusiness();
    } else {
      setIsLoading(false);
    }
  }, [businessSlug]);

  // Loading state - mostrar loading optimizado
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-sm">Validando negocio...</p>
        </div>
      </div>
    );
  }

  // Business context válido - usar el portal completo
  if (isValidBusiness && businessData) {
    return (
      <BrandingProvider businessId={businessData.id}>
        <ThemeProvider businessId={businessData.id}>
          <DynamicManifest businessSlug={businessSlug} />
          {/* ✅ Guía de instalación iOS - solo se muestra después de login */}
          <IOSInstallWrapper businessName={businessData.name} />
          <AuthHandler businessId={businessData.id} />
        </ThemeProvider>
      </BrandingProvider>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Negocio No Encontrado</h1>
        <p className="text-gray-600 mb-6">
          El negocio &quot;{businessSlug}&quot; no existe.
        </p>
        <button
          onClick={() => (window.location.href = '/login')}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
