import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    readonly user: {
      readonly role?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    readonly role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    readonly role?: string;
  }
}
