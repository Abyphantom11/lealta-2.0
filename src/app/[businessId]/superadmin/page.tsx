'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '../../../hooks/useAuth';
import SuperAdminPage from '../../../app/superadmin/SuperAdminDashboard';
import PWALayout from '../../../components/layouts/PWALayout';

/**
 * Página de SuperAdmin contextualizada con businessId
 * Ruta: /[businessId]/superadmin
 */
export default function BusinessSuperAdminPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isValidBusiness, setIsValidBusiness] = useState<boolean | null>(null);
  const { loading, isAuthenticated } = useRequireAuth('SUPERADMIN');

  const validateBusiness = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/validate`);
      
      // Intentar leer la respuesta como texto primero
      const responseText = await response.text();
      
      if (response.ok) {
        try {
          // Intentar parsear como JSON
          JSON.parse(responseText);
          setIsValidBusiness(true);
        } catch (parseError) {
          console.error('💥 Error parseando JSON:', parseError);
          console.error('💥 Texto que no se pudo parsear:', responseText);
          setIsValidBusiness(false);
        }
      } else {
        console.error('❌ Business inválido - detalles:', {
          businessId,
          status: response.status,
          statusText: response.statusText,
          responseText
        });
        
        setIsValidBusiness(false);
        
        // Redirigir a login con error
        const loginUrl = `/login?error=invalid-business&message=El negocio no es válido o no existe`;
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.error('Error durante validacion:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
      setIsValidBusiness(false);
      
      const loginUrl = '/login?error=validation-error&message=Error validando el negocio';
      window.location.href = loginUrl;
    }
  }, [businessId]);

  useEffect(() => {
    // Solo validar el business si la autenticación ya terminó
    if (!loading && isAuthenticated) {
      validateBusiness();
    }
  }, [validateBusiness, loading, isAuthenticated]);

  // Loading states
  if (loading || isValidBusiness === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando acceso de SuperAdmin...</p>
        </div>
      </div>
    );
  }

  if (!isValidBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Business No Válido</h1>
          <p className="text-gray-600 mb-6">El negocio "{businessId}" no existe o no está activo.</p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Seleccionar Business
          </button>
        </div>
      </div>
    );
  }

  return (
    <PWALayout>
      <SuperAdminPage businessId={businessId} />
    </PWALayout>
  );
}
