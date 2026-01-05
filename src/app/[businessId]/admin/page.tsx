'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página del panel de administración - REDIRIGE A RESERVAS
 * Ruta: /[businessId]/admin
 */
export default function BusinessAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reservas');
  }, [router]);

  return null;
}
