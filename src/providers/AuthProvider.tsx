'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 🔐 AUTH PROVIDER
 * 
 * Wrapper para SessionProvider de NextAuth
 * Debe ser un componente de cliente
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
