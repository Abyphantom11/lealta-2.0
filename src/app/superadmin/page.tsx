'use client';

import { useEffect } from 'react';

/**
 * Página de redirección para /superadmin legacy
 * Redirige automáticamente a business-selection
 */
export default function SuperAdminRedirectPage() {
  useEffect(() => {
    console.log('🚫 SuperAdmin legacy: Redirigiendo a business-selection');
    
    const redirectUrl = new URL('/business-selection', window.location.origin);
    redirectUrl.searchParams.set('blocked_route', '/superadmin');
    redirectUrl.searchParams.set('reason', 'legacy-superadmin-redirect');
    redirectUrl.searchParams.set('message', 'SuperAdmin requiere selección de business');
    
    window.location.href = redirectUrl.toString();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a selección de business...</p>
      </div>
    </div>
  );
}
