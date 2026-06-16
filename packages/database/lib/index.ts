import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Pre-warm connection on module load — eliminates cold-start latency on first request.
// Fire-and-forget: establishes TCP + PgBouncer slot in background while app boots.
prisma.$connect().catch((err) => {
  console.error('[Prisma] Pre-warm connection failed:', err)
})

export default prisma
