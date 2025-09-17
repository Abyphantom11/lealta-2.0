'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandingProvider } from '../../cliente/components/branding/BrandingProvider';
import AuthHandler from '../../cliente/components/AuthHandler';

/**
 * Página dinámica del portal cliente
 * Ruta: /[businessId]/cliente
 */
export default function BusinessClientePage() {
  const params = useParams();
  const businessSlug = params.businessId as string; // Slug de la URL
  const [businessData, setBusinessData] = useState<any>(null); // Datos completos del business
  const [isValidBusiness, setIsValidBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validar que el businessId existe y es válido
    const validateBusiness = async () => {
      try {
        console.log(`🔍 Cliente - Validating business for: ${businessSlug}`);
        
        const response = await fetch(`/api/businesses/${businessSlug}/validate`);
        if (response.ok) {
          const businessInfo = await response.json();
          console.log(`✅ Cliente - Business validated:`, businessInfo);
          setBusinessData(businessInfo); // Guardar datos completos incluido el ID real
          setIsValidBusiness(true);
        } else {
          console.log(`❌ Cliente - Business validation failed: ${businessSlug}`);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando portal cliente {businessSlug}...</p>
        </div>
      </div>
    );
  }

  // Business context válido - usar el portal completo
  if (isValidBusiness && businessData) {
    console.log('✅ Rendering client with business data:', businessData);
    return (
      <BrandingProvider businessId={businessData.id}>
        <AuthHandler businessId={businessData.id} />
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
