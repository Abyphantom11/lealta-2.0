// src/lib/auth.config.ts
import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';

// Detectar si estamos en desarrollo (Cloudflare Tunnel/localhost)
const isDevelopment = process.env.NODE_ENV === 'development';
// Detectar si la URL usa HTTPS
const isSecure = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;

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
      name: `${isSecure ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // Secure solo si la URL es HTTPS
        secure: isSecure,
        maxAge: 30 * 24 * 60 * 60, // 30 días
        domain: isDevelopment ? undefined : process.env.NEXTAUTH_COOKIE_DOMAIN,
      }
    },
    callbackUrl: {
      name: `${isSecure ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: isSecure,
        domain: isDevelopment ? undefined : process.env.NEXTAUTH_COOKIE_DOMAIN,
      }
    },
    csrfToken: {
      name: `${isSecure && !isDevelopment ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isSecure,
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
        token.id = user.id;
        token.role = (user as any).role;
        token.businessId = (user as any).businessId;
        console.log('🔐 JWT: Token actualizado con:', { 
          id: token.id,
          role: token.role, 
          businessId: token.businessId 
        });
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔐 SESSION: Construyendo sesión con token:', { 
        hasToken: !!token,
        tokenId: token?.sub,
        role: token?.role,
        businessId: token?.businessId 
      });
      
      if (token) {
        (session.user as any).id = token.sub; // sub es el ID del usuario en el JWT
        (session.user as any).role = token.role;
        (session.user as any).businessId = token.businessId;
      }
      
      console.log('🔐 SESSION: Sesión final:', {
        userId: (session.user as any).id,
        userEmail: session.user?.email,
        userRole: (session.user as any).role,
        userBusinessId: (session.user as any).businessId
      });
      
      return session;
    },
  },
};