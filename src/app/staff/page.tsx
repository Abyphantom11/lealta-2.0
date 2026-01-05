// ========================================
// 📦 SECCIÓN: IMPORTS Y DEPENDENCIAS (1-18)
// ========================================
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página Staff - REDIRIGE A RESERVAS
 * Ruta: /staff
 */
export default function StaffPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reservas');
  }, [router]);

  return null;
}
