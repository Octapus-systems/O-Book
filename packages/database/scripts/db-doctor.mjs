import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootEnv = path.resolve(__dirname, '../../../.env')
const pkgEnv = path.resolve(__dirname, '../.env')

config({ path: rootEnv, override: true })

const ref = 'kwvzhiybpokphavtsrmt'
const parsed = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://'))
  : null
const password = parsed ? decodeURIComponent(parsed.password) : process.env.SUPABASE_DB_PASSWORD

if (!password) {
  console.error('No database password found in DATABASE_URL')
  process.exit(1)
}

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'eu-west-1',
  'us-east-1',
  'us-west-1',
  'eu-central-1',
]

const candidates = [
  {
    label: 'direct',
    url: `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
  },
  ...regions.map((region) => ({
    label: `pooler-${region}`,
    url: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`,
  })),
]

let working = null

for (const candidate of candidates) {
  const prisma = new PrismaClient({ datasources: { db: { url: candidate.url } } })
  try {
    await prisma.$queryRaw`SELECT 1 as ok`
    working = candidate
    console.log(`OK  ${candidate.label}`)
    await prisma.$disconnect()
    break
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const reason = message.includes('tenant/user')
      ? 'project not found (wrong region or paused)'
      : message.includes("Can't reach")
        ? 'unreachable'
        : message.split('\n').find((line) => line.trim()) ?? 'failed'
    console.log(`FAIL ${candidate.label} — ${reason}`)
    await prisma.$disconnect()
  }
}

if (!working) {
  console.error('\nNo working database URL found.')
  console.error('1. Unpause project in Supabase dashboard')
  console.error('2. Settings → Database → Connect → copy Session pooler URI')
  console.error('3. Paste into .env as DATABASE_URL')
  process.exit(1)
}

const line = `DATABASE_URL="${working.url}"`
for (const envPath of [rootEnv, pkgEnv]) {
  const content = readFileSync(envPath, 'utf8')
  const updated = content.replace(/^DATABASE_URL=.*$/m, line)
  writeFileSync(envPath, updated)
}

console.log(`\nUpdated .env files to use: ${working.label}`)
console.log('Run: npm run db:push && npm run db:seed')
