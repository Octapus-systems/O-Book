import { Prisma } from '@prisma/client'

export function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.message.includes("Can't reach database server")) {
      return 'Database unreachable. Use the Supabase IPv4 pooler URL in DATABASE_URL and ensure the project is active (not paused).'
    }
    return 'Database connection failed. Check DATABASE_URL in .env.'
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `Database request error (${error.code}): ${error.message}`
  }

  if (error instanceof Error) {
    if (error.message.includes('tenant/user')) {
      return 'Supabase project not found. Restore or unpause the project in the Supabase dashboard, then update DATABASE_URL.'
    }
    return error.message
  }

  return 'Internal server error'
}

