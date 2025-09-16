'use client';

import { useEffect, useState } from 'react';

/**
 * Página de redirección para /superadmin legacy
 * Redirige automáticamente al superadmin con contexto de business o al login
 */
export default function SuperAdminRedirectPage() {
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    console.log('🔄 SuperAdmin legacy: Obteniendo contexto de business...');
    
    const redirectToBusinessContext = async () => {
      try {
        // Obtener información del usuario actual
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          const businessSlug = data.user?.business?.slug || data.user?.business?.subdomain;
          
          if (businessSlug) {
            console.log(`✅ Redirigiendo a /${businessSlug}/superadmin`);
            window.location.href = `/${businessSlug}/superadmin`;
            return;
          }
        }
        
        // Si no hay sesión o no se puede obtener business, ir a login
        console.log('❌ No se pudo obtener business context, redirigiendo a login');
        const redirectUrl = new URL('/login', window.location.origin);
        redirectUrl.searchParams.set('error', 'business-required');
        redirectUrl.searchParams.set('message', 'Debe acceder a través de un negocio específico');
        redirectUrl.searchParams.set('attempted', '/superadmin');
        
        window.location.href = redirectUrl.toString();
        
      } catch (error) {
        console.error('❌ Error obteniendo contexto:', error);
        // Si hay error de red o API, ir directo a login
        window.location.href = '/login?error=connection-error&message=Error de conexión, inicie sesión nuevamente';
      } finally {
        setIsRedirecting(false);
      }
    };

    // Ejecutar la redirección después de un pequeño delay para mostrar el loading
    const timeoutId = setTimeout(redirectToBusinessContext, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-gray-950 to-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">
          {isRedirecting ? 'Obteniendo contexto de negocio...' : 'Redirigiendo...'}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Si no se redirige automáticamente, <a href="/login" className="text-blue-400 hover:underline">haga clic aquí</a>
        </p>
      </div>
    </div>
  );
}
