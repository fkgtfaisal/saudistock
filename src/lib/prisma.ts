import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;
console.log('[PRISMA CLIENT] Initializing with NODE_ENV:', process.env.NODE_ENV);
console.log('[PRISMA CLIENT] DATABASE_URL exists:', !!connectionString);
console.log('[PRISMA CLIENT] DATABASE_URL type/length:', typeof connectionString, connectionString?.length);

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
prisma = new PrismaClient({ adapter });

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | PrismaClient
}

const globalPrisma = globalThis.prismaGlobal ?? prisma

export default globalPrisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = globalPrisma;
