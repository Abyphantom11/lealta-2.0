'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página Cliente - REDIRIGE A RESERVAS
 * Ruta: /cliente
 */
export default function ClienteV2Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reservas');
  }, [router]);

  return null;
}
