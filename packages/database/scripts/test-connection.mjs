import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.resolve(__dirname, '../../../.env'), override: true })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL missing in .env')
  process.exit(1)
}

console.log('Testing DATABASE_URL host:', url.split('@')[1]?.split('/')[0] ?? 'unknown')

const prisma = new PrismaClient()
try {
  await prisma.$queryRaw`SELECT 1 as ok`
  console.log('Database connection OK')
  process.exit(0)
} catch (error) {
  console.error('Database connection FAILED')
  if (error instanceof Error) {
    console.error(error.message)
    if (error.message.includes("Can't reach database server")) {
      console.error('\nFix: use Supabase Session pooler URL (IPv4), not direct db.* host.')
    }
    if (error.message.includes('tenant/user')) {
      console.error('\nFix: unpause or restore Supabase project, then copy fresh URI from dashboard.')
    }
  }
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
