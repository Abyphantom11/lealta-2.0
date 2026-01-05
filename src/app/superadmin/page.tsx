'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página SuperAdmin - REDIRIGE A RESERVAS
 * Ruta: /superadmin
 */
export default function SuperAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reservas');
  }, [router]);

  return null;
}
