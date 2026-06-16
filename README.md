# O Book

O Book is an internal bookkeeping and financial management platform built for Octapus.

## Tech Stack

- **Monorepo Tool**: Turborepo
- **Frontend**: Next.js 15 (App Router)
- **Backend**: Next.js API Routes (Node.js Runtime)
- **Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Server State**: TanStack Query
- **Form Handling**: React Hook Form + Zod
- **Excel Processing**: ExcelJS + XLSX

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 15
- npm >= 9.0.0

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
o-book/
├── apps/
│   ├── web/          # Main Next.js application
│   └── docs/         # Documentation site
├── packages/
│   ├── ui/           # Shared UI components
│   ├── database/     # Prisma schema and migrations
│   ├── auth/         # Authentication configuration
│   ├── config/       # Shared configuration
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utility functions
│   └── validators/   # Shared Zod schemas
└── docs/             # Architecture documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter
- `npm run test` - Run tests
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

## Documentation

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for complete system architecture documentation.

## License

Internal use only for Octapus.
