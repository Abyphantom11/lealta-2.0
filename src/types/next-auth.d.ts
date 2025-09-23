// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      businessId: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    businessId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    businessId: string;
  }
}