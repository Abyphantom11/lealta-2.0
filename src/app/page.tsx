'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página principal - REDIRIGE A LOGIN O RESERVAS
 * Si no está autenticado: redirige a /login
 * Si está autenticado: redirige a /reservas
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          // Usuario autenticado, redirigir a reservas
          router.replace('/reservas');
        } else {
          // No autenticado, redirigir a login
          router.replace('/login');
        }
      } catch {
        // Error al verificar auth, redirigir a login por seguridad
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return null;
}
