---
trigger: always_on
---

Supabase Pooler Rule: "Always use Supabase IPv4 pooler URL. DATABASE_URL must use port 6543 for app. DIRECT_URL must use port 5432 for migrations."
Supabase Pause Rule: "If database unreachable error happen, first check if Supabase free project go sleep (paused). Wake it up in dashboard."
Prisma Rule: "Only use Prisma ORM. Run npx prisma generate when schema change. No raw SQL if Prisma can do it."