import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/client';

const globalForDb = globalThis as unknown as { db?: PrismaClient };

const createDb = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Не задан DATABASE_URL.');

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
