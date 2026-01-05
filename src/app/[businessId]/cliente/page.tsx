'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página del portal cliente - REDIRIGE A RESERVAS
 * Ruta: /[businessId]/cliente
 */
export default function BusinessClientePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reservas');
  }, [router]);

  return null;
}
