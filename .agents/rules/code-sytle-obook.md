---
trigger: always_on
---

2. Tech Stack
Monorepo: Turborepo
Frontend: Next.js 15 (App Router), Tailwind CSS
Backend: Next.js API Routes (/api/v1/)
Database: PostgreSQL (Supabase) + Prisma
Auth: NextAuth (JWT + PIN)
3. Data Flow
User click button in Next.js UI (React components in src/modules).
UI send fetch() to Next.js API Route (app/api/v1/).
API Route check Auth (NextAuth session).
API Route use Prisma (packages/database/prisma/schema.prisma).
Prisma talk to Postgres (Supabase pooler aws-1-ap-northeast-1.pooler.supabase.com:6543).
API return JSON { "success": true, "data": ... }.
UI show data to User.
4. API Rules in Code
All APIs live in app/api/v1/. No stray APIs.
API return same shape: success, message, data.
Comments, Attachments, Audit Logs all tie to transactionId. No orphan comments.