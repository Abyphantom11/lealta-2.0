'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminV2Page from '../../../components/admin-v2/AdminV2Page';
import PWALayout from '../../../components/layouts/PWALayout';

/**
 * Página dinámica del panel de administración
 * Renderiza AdminV2Page con contexto de businessId desde la URL
 * Ruta: /[businessId]/admin
 */
export default function BusinessAdminPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isValidBusiness, setIsValidBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validar que el businessId existe y es válido
    const validateBusiness = async () => {
      try {
        console.log(`🔍 Validating business from URL: ${businessId}`);
        
        // Verificar que el business existe
        const response = await fetch(`/api/businesses/${businessId}/validate`);
        if (response.ok) {
          const businessData = await response.json();
          console.log(`✅ Business validated:`, businessData);
          setIsValidBusiness(true);
        } else {
          console.log(`❌ Business validation failed for: ${businessId}`);
          // Redirect a login si no es válido
          window.location.href = `/login?error=invalid-business&message=El negocio no es válido o no existe`;
        }
      } catch (error) {
        console.error('Error validating business:', error);
        setIsValidBusiness(false);
        // Redirect a login en caso de error
        window.location.href = '/login?error=validation-error&message=Error validando el negocio';
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      validateBusiness();
    } else {
      console.error('❌ No businessId provided');
      setIsLoading(false);
    }
  }, [businessId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">Validando negocio {businessId}...</p>
        </div>
      </div>
    );
  }

  // Business context válido
  if (isValidBusiness) {
    return (
      <PWALayout>
        <AdminV2Page businessId={businessId} />
      </PWALayout>
    );
  }

  // Fallback - no debería llegar aquí por la validación anterior
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Negocio No Encontrado</h1>
        <p className="text-gray-600 mb-6">
          El negocio &quot;{businessId}&quot; no existe o no tienes acceso.
        </p>
        <button
          onClick={() => (window.location.href = '/login?error=invalid-business&message=El negocio no existe o no tienes acceso')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al Login
        </button>
      </div>
    </div>
  );
}
