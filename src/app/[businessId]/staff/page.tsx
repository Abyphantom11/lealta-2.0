'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../../hooks/useAuth';
import PWALayout from '../../../components/layouts/PWALayout';

// Importar el componente de staff completo
import StaffPageContent from './StaffPageContent';

/**
 * Página dinámica del panel de staff
 * Ruta: /[businessId]/staff
 */
export default function BusinessStaffPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isValidBusiness, setIsValidBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación
  const { loading: authLoading } = useRequireAuth();

  useEffect(() => {
    // Esperar a que termine la autenticación antes de validar el negocio
    if (authLoading) return;

    // Validar que el businessId existe y es válido
    const validateBusiness = async () => {
      try {
        const response = await fetch(`/api/businesses/${businessId}/validate`);
        if (response.ok) {
          await response.json();
          setIsValidBusiness(true);
        } else {
          window.location.href = `/login?error=invalid-business&message=El negocio no es válido o no existe`;
        }
      } catch (error) {
        console.error('Error validating business for staff:', error);
        setIsValidBusiness(false);
        window.location.href = '/login?error=validation-error&message=Error validando el negocio';
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      validateBusiness();
    } else {
      setIsLoading(false);
    }
  }, [businessId, authLoading]);

  // Loading state (tanto para auth como para validación de business)
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">
            {authLoading ? 'Verificando autenticación...' : `Validando acceso staff a ${businessId}...`}
          </p>
        </div>
      </div>
    );
  }

  // Business context válido
  if (isValidBusiness) {
    return (
      <PWALayout>
        <StaffPageContent businessId={businessId} />
      </PWALayout>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes acceso de staff al negocio &quot;{businessId}&quot;.
        </p>
        <button
          onClick={() => (window.location.href = '/login?error=access-denied&message=No tienes acceso de staff a este negocio')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Volver al Login
        </button>
      </div>
    </div>
  );
}
