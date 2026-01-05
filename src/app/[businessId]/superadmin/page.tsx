'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de SuperAdmin - REDIRIGE A RESERVAS
 * Ruta: /[businessId]/superadmin
 */
export default function BusinessSuperAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reservas');
  }, [router]);

  return null;
}
