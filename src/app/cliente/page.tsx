'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClienteV2Page() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir al selector de business en lugar de error
    router.push('/login?message=Selecciona tu negocio para continuar');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirigiendo al selector de negocio...</p>
        <p className="text-gray-400 text-sm mt-2">
          Para acceder al portal del cliente, necesitas seleccionar tu negocio
        </p>
      </div>
    </div>
  );
}
