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
    console.log('🔍 INICIANDO validación de business:', businessId);
    
    try {
      console.log('📡 Haciendo fetch a:', `/api/businesses/${businessId}/validate`);
      const response = await fetch(`/api/businesses/${businessId}/validate`);
      
      console.log('📡 Respuesta de validación RAW:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        }
      });
      
      // Intentar leer la respuesta como texto primero
      const responseText = await response.text();
      console.log('📄 Respuesta como texto:', responseText);
      
      if (response.ok) {
        try {
          // Intentar parsear como JSON
          const data = JSON.parse(responseText);
          console.log('✅ Business válido - datos parseados correctamente:', data);
          console.log('✅ Verificando estructura de respuesta:', {
            hasData: !!data,
            hasId: !!data.id,
            hasName: !!data.name,
            hasSlug: !!data.slug,
            isActive: data.isActive,
            responseType: typeof data,
            keys: Object.keys(data || {})
          });
          
          setIsValidBusiness(true);
          console.log('✅ Estado actualizado: isValidBusiness = true');
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
        console.log('❌ Estado actualizado: isValidBusiness = false');
        
        // Redirigir a login con error
        const loginUrl = `/login?error=invalid-business&message=El negocio no es válido o no existe`;
        console.log('🔄 Redirigiendo a:', loginUrl);
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.error('Error durante validacion:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
      setIsValidBusiness(false);
      console.log('Estado actualizado por error: isValidBusiness = false');
      
      const loginUrl = '/login?error=validation-error&message=Error validando el negocio';
      console.log('Redirigiendo por error a:', loginUrl);
      window.location.href = loginUrl;
    }
  }, [businessId]);

  useEffect(() => {
    // Solo validar el business si la autenticación ya terminó
    if (!loading && isAuthenticated) {
      console.log('🔍 Iniciando validación de business después de auth exitosa');
      validateBusiness();
    } else if (!loading && !isAuthenticated) {
      console.log('❌ No hay autenticación - no validar business');
    } else {
      console.log('⏳ Esperando autenticación antes de validar business');
    }
  }, [validateBusiness, loading, isAuthenticated]);

  // Loading states
  if (loading || isValidBusiness === null) {
    console.log('⏳ RENDERIZANDO loading - Estados:', {
      loading,
      isValidBusiness,
      businessId
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando acceso de SuperAdmin...</p>
        </div>
      </div>
    );
  }

  console.log('🚦 EVALUANDO estados finales antes de renderizar:', {
    loading,
    isValidBusiness,
    businessId,
    willShowError: !isValidBusiness
  });

  if (!isValidBusiness) {
    console.log('🔴 RENDERIZANDO página de error - Business No Válido:', {
      businessId,
      isValidBusiness,
      loading
    });
    
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
    <PWALayout promptPosition="bottom">
      <SuperAdminPage businessId={businessId} />
    </PWALayout>
  );
}
