'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '../../../hooks/useAuth';
import SuperAdminPage from '../../../app/superadmin/SuperAdminDashboard';

/**
 * Página de SuperAdmin contextualizada con businessId
 * Ruta: /[businessId]/superadmin
 */
export default function BusinessSuperAdminPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isValidBusiness, setIsValidBusiness] = useState<boolean | null>(null);
  const { loading } = useRequireAuth('SUPERADMIN');

  const validateBusiness = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/validate`);
      const data = await response.json();
      setIsValidBusiness(data.valid);
      
      if (!data.valid) {
        console.error('Business inválido:', businessId);
        // Redirigir a business-selection con error
        window.location.href = `/business-selection?error=invalid-business&businessId=${businessId}`;
      }
    } catch (error) {
      console.error('Error validando business:', error);
      setIsValidBusiness(false);
      window.location.href = '/business-selection?error=validation-error';
    }
  }, [businessId]);

  useEffect(() => {
    validateBusiness();
  }, [validateBusiness]);

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
            onClick={() => (window.location.href = '/business-selection')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Seleccionar Business
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header contextual */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                SuperAdmin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Negocio: <span className="font-medium text-purple-600">{businessId}</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                SUPERADMIN
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                /{businessId}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard principal con contexto de business */}
      <SuperAdminPage businessId={businessId} />
    </div>
  );
}
