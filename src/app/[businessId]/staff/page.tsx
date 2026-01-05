'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página del panel de staff - REDIRIGE A RESERVAS
 * Ruta: /[businessId]/staff
 */
export default function BusinessStaffPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reservas');
  }, [router]);

  return null;
}
