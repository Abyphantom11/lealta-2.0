import { PrismaClient } from '@prisma/client';

// Type for PrismaClient instance
type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Solo logs de errores, no queries para evitar spam
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
