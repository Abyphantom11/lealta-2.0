import NextAuth, { Session, User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '../../../../lib/prisma';
import { compare } from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

const authOptions = {
  trustHost: true,
  session: { strategy: 'jwt' as const },
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
        });

        if (!user) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User & { role?: string } }) {
      if (user) {
        (token as any).role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT & { role?: string } }) {
      if (token?.role) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
