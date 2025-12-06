// lib/prisma.js
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Build adapter using your DATABASE_URL env var
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Use a global to avoid creating multiple clients in dev (Next.js hot reload)
const globalForPrisma = globalThis;
const prismaClientInstance = globalForPrisma.__prisma_client;

if (!prismaClientInstance) {
  const client = new PrismaClient({ adapter });
  // attach to global for dev hot-reload safety
  globalForPrisma.__prisma_client = client;
}

// export the singleton
export default globalForPrisma.__prisma_client;
