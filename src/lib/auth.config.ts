// src/lib/auth.config.ts
import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';

// Detectar si estamos en desarrollo (Cloudflare Tunnel/localhost)
const isDevelopment = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // Actualizar sesión cada 24 horas
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días para el JWT también
  },
  cookies: {
    sessionToken: {
      name: `${isDevelopment ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // En desarrollo con Cloudflare Tunnel, usar secure siempre
        secure: true, // Siempre true para ambos ambientes
        maxAge: 30 * 24 * 60 * 60, // 30 días
        domain: isDevelopment ? undefined : process.env.NEXTAUTH_COOKIE_DOMAIN,
      }
    },
    callbackUrl: {
      name: `${isDevelopment ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: isDevelopment ? undefined : process.env.NEXTAUTH_COOKIE_DOMAIN,
      }
    },
    csrfToken: {
      name: `${isDevelopment ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: isDevelopment ? undefined : process.env.NEXTAUTH_COOKIE_DOMAIN,
      }
    },
  },
  // Páginas personalizadas
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  // Debug solo en desarrollo
  debug: isDevelopment,
  providers: [
    Credentials({
      name: 'Backoffice',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
          include: { business: true }
        });

        if (!user) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
          businessId: user.businessId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.businessId = (user as any).businessId;
        console.log('🔐 JWT: Token actualizado con:', { role: token.role, businessId: token.businessId });
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔐 SESSION: Construyendo sesión con token:', { 
        hasToken: !!token,
        role: token?.role,
        businessId: token?.businessId 
      });
      
      if (token?.role) {
        (session.user as any).role = token.role;
        (session.user as any).businessId = token.businessId;
      }
      
      console.log('🔐 SESSION: Sesión final:', {
        userEmail: session.user?.email,
        userRole: (session.user as any).role,
        userBusinessId: (session.user as any).businessId
      });
      
      return session;
    },
  },
};