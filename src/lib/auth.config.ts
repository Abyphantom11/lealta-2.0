// src/lib/auth.config.ts
import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
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