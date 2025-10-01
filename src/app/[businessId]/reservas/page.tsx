'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../../hooks/useAuth';
import PWALayout from '../../../components/layouts/PWALayout';
import ReservasApp from '../../reservas/ReservasApp';
import { saveSessionBackup, clearSessionBackup } from '@/utils/session-persistence';

/**
 * Página dinámica del módulo de reservas
 * Ruta: /[businessId]/reservas
 * 
 * Usa el mismo componente ReservasApp del módulo original
 * Solo adapta para recibir businessId desde la URL
 * 
 * ✅ Persistencia de sesión: Usa localStorage para mantener la sesión después de hard refresh
 */
export default function BusinessReservasPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isValidBusiness, setIsValidBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación
  const { loading: authLoading } = useRequireAuth();

  useEffect(() => {
    // Esperar a que termine la autenticación antes de validar el negocio
    if (authLoading) return;

    // Guardar businessId en localStorage para persistencia
    if (businessId) {
      saveSessionBackup({ businessId: businessId });
      console.log('💾 BusinessId guardado en localStorage:', businessId);
    }

    // Validar que el businessId existe y es válido
    const validateBusiness = async () => {
      try {
        console.log(`🔍 Validating business for reservas: ${businessId}`);
        
        const response = await fetch(`/api/businesses/${businessId}/validate`);
        if (response.ok) {
          const businessData = await response.json();
          console.log(`✅ Business validated for reservas:`, businessData);
          setIsValidBusiness(true);
        } else {
          console.log(`❌ Business validation failed for reservas: ${businessId}`);
          // Limpiar localStorage si el business no es válido
          clearSessionBackup();
          window.location.href = `/login?error=invalid-business&message=El negocio no es válido o no existe`;
        }
      } catch (error) {
        console.error('Error validating business for reservas:', error);
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
            {authLoading ? 'Verificando autenticación...' : `Validando acceso a reservas de ${businessId}...`}
          </p>
        </div>
      </div>
    );
  }

  // Business context válido - usar el mismo componente ReservasApp
  if (isValidBusiness) {
    return (
      <PWALayout>
        <ReservasApp businessId={businessId} />
      </PWALayout>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes acceso al módulo de reservas del negocio &quot;{businessId}&quot;.
        </p>
        <button
          onClick={() => (window.location.href = '/login?error=access-denied&message=No tienes acceso al módulo de reservas de este negocio')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al Login
        </button>
      </div>
    </div>
  );
}