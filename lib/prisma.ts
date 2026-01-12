// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

console.log("DEBUG: Prisma Client Initialized. Models:", Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
