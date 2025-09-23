// src/lib/auth.config.ts
import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        (session.user as any).role = token.role;
        (session.user as any).businessId = token.businessId;
      }
      return session;
    },
  },
};