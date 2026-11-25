import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prismaInstance: PrismaClient | undefined;
}

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  global.__prismaInstance ||
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prismaInstance = prisma;
}
