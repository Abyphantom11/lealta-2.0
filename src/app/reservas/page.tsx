'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReservasApp from './ReservasApp';
import { saveSessionBackup, getSessionBackup, clearSessionBackup } from '@/utils/session-persistence';

// Forzar renderizado dinámico para evitar prerendering
export const dynamic = 'force-dynamic';

/**
 * Componente interno que usa useSearchParams
 */
function ReservasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        // 1. Verificar si hay businessId en los parámetros de búsqueda
        const businessIdParam = searchParams.get('businessId');
        if (businessIdParam) {
          console.log('✅ BusinessId desde URL params:', businessIdParam);
          setBusinessId(businessIdParam);
          // Guardar en localStorage para persistencia
          saveSessionBackup({ businessId: businessIdParam });
          setIsLoading(false);
          return;
        }

        // 2. Intentar recuperar desde localStorage primero (persistencia entre refreshes)
        const cachedSession = getSessionBackup();
        if (cachedSession?.businessId) {
          console.log('✅ BusinessId recuperado desde localStorage:', cachedSession.businessId);
          setBusinessId(cachedSession.businessId);
          setIsLoading(false);
          return;
        }

        // 3. Verificar si hay sesión activa en cookies
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          // No hay sesión válida, limpiar localStorage y ir al login
          clearSessionBackup();
          router.replace(
            '/login?message=Debe iniciar sesión para acceder a reservas'
          );
          return;
        }

        const sessionData = await response.json();
        const businessSlug = sessionData.user?.businessSlug;
        const userBusinessId = sessionData.user?.businessId;

        if (businessSlug && userBusinessId) {
          console.log(`🔄 Redirigiendo a /${businessSlug}/reservas`);
          // Guardar en localStorage antes de redirigir
          saveSessionBackup({
            businessId: userBusinessId,
            businessSlug: businessSlug,
            userId: sessionData.user?.id
          });
          router.replace(`/${businessSlug}/reservas`);
        } else {
          // Si no tiene businessSlug en la sesión, mostrar la app sin businessId
          console.log('⚠️ No se encontró businessSlug en la sesión');
          setBusinessId(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // En caso de error, intentar usar localStorage como fallback
        const cachedSession = getSessionBackup();
        if (cachedSession?.businessId) {
          console.log('🔄 Usando businessId desde localStorage como fallback');
          setBusinessId(cachedSession.businessId);
          setIsLoading(false);
          return;
        }
        // Si todo falla, mostrar la app sin businessId
        setBusinessId(null);
        setIsLoading(false);
      }
    };

    checkSessionAndRedirect();
  }, [router, searchParams]);

  // Mostrar loading mientras resuelve la redirección
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Detectando su negocio...</p>
        </div>
      </div>
    );
  }

  // Mostrar la aplicación de reservas
  return <ReservasApp businessId={businessId || undefined} />;
}

/**
 * 🔄 RUTA CON AUTO-DETECCIÓN DE BUSINESS
 * Detecta el business de la sesión y redirije a /{businessSlug}/reservas
 * O muestra la app directamente si hay businessId en la URL
 * 
 * ✅ Persistencia de sesión: Usa localStorage como backup de cookies
 */
export default function ReservasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <ReservasPageContent />
    </Suspense>
  );
}
