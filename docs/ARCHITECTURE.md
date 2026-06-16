# O Book - Complete System Architecture

> Enterprise-grade architecture blueprint for O Book financial management platform
> Version: 1.0
> Last Updated: 2026-06-13

---

# Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Domain Architecture](#2-domain-architecture)
3. [Module Architecture](#3-module-architecture)
4. [Monorepo Architecture](#4-monorepo-architecture)
5. [Next.js Application Structure](#5-nextjs-application-structure)
6. [Database Architecture](#6-database-architecture)
7. [API Architecture](#7-api-architecture)
8. [Authentication & Authorization Architecture](#8-authentication--authorization-architecture)
9. [Transaction Architecture](#9-transaction-architecture)
10. [Dashboard Architecture](#10-dashboard-architecture)
11. [Reporting Architecture](#11-reporting-architecture)
12. [Security Architecture](#12-security-architecture)
13. [Scalability Architecture](#13-scalability-architecture)
14. [Development Guidelines](#14-development-guidelines)

---

# 1. High-Level System Architecture

## Architecture Style

**Modular Monolith with Domain-Driven Design**

O Book follows a Modular Monolith architecture pattern, which provides the benefits of microservices (clear boundaries, independent modules) without the operational complexity. This architecture is chosen because:

- Single deployment unit simplifies operations
- Clear domain boundaries enable future extraction to microservices if needed
- Shared database with clear ownership boundaries
- Faster development cycle for internal tool
- Easier testing and debugging
- Lower infrastructure costs for internal use

## System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     O Book System                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Presentation Layer                       │  │
│  │  Next.js 15 App Router + Shadcn/UI Components         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Application Layer                        │  │
│  │  Next.js API Routes + Server Actions + Business Logic│  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Domain Layer                             │  │
│  │  Business Logic + Domain Services + Validation       │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Infrastructure Layer                    │  │
│  │  Prisma ORM + PostgreSQL + File Storage + Auth      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

**Technology Stack:**
- Next.js 15 with App Router
- React Server Components (RSC) by default
- Client Components only when interactivity required
- Shadcn/UI for component library
- Tailwind CSS for styling
- Zustand for client-side state
- TanStack Query for server state
- React Hook Form + Zod for forms

**Architecture Principles:**
- Server-first rendering for performance
- Progressive enhancement for interactivity
- Component composition over inheritance
- Unidirectional data flow
- Co-located styles with components

**State Management Strategy:**
- Server State: TanStack Query (caching, refetching, optimistic updates)
- Client State: Zustand (UI state, modals, toasts)
- Form State: React Hook Form (controlled components, validation)
- URL State: Next.js Router (filters, pagination, search)

## Backend Architecture

**Technology Stack:**
- Next.js API Routes (Node.js Runtime)
- Server Actions for mutations
- Prisma ORM for database access
- Zod for validation
- NextAuth.js for authentication

**Architecture Pattern:**
- Layered architecture within API routes
- Request → Validation → Authorization → Business Logic → Persistence → Response
- Error handling at every layer
- Transaction management for data consistency

**API Design:**
- RESTful principles
- Versioned endpoints (/api/v1/)
- Consistent response format
- Proper HTTP status codes
- Request validation with Zod schemas

## Database Architecture

**Technology Stack:**
- PostgreSQL 15+
- Prisma ORM
- Connection pooling
- Read replicas for reporting (future)

**Architecture Principles:**
- Single database with clear schema boundaries
- Foreign key constraints for referential integrity
- Indexes for query optimization
- Soft deletes for audit trail
- JSONB columns for flexible metadata

**Data Access Pattern:**
- Prisma Client for all database operations
- Repository pattern for complex queries
- Transactions for multi-table operations
- Query optimization with indexes

## Authentication Architecture

**Technology Stack:**
- NextAuth.js v5
- JWT session strategy
- 4-digit PIN authentication
- Secure cookie storage

**Authentication Flow:**
1. User enters 4-digit PIN
2. Server validates PIN against database
3. NextAuth creates JWT session
4. Session stored in secure HTTP-only cookie
5. Middleware validates session on protected routes

**Session Management:**
- JWT contains user ID, role, cashbook ID
- Session expires after configurable timeout
- Refresh tokens not needed (internal tool)
- Single device login per user

## State Management Architecture

**Client State (Zustand):**
- UI state: modals, toasts, sidebars
- Temporary form state
- User preferences
- Theme settings

**Server State (TanStack Query):**
- Cached API responses
- Automatic refetching on focus/reconnect
- Optimistic updates for mutations
- Pagination and infinite scroll

**Form State (React Hook Form):**
- Controlled form inputs
- Zod validation integration
- Error handling
- Submission state

---

# 2. Domain Architecture

## Domain Overview

O Book is organized into 8 core business domains, each with clear responsibilities and boundaries. Domains are aligned with business capabilities, not technical layers.

## Domain Map

```
┌─────────────────────────────────────────────────────────────┐
│                        O Book Domains                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Authentication│  │    Users     │  │  Dashboard   │      │
│  │              │  │              │  │              │      │
│  │ - Login      │  │ - Profile    │  │ - Overview   │      │
│  │ - Sessions   │  │ - Roles      │  │ - KPIs       │      │
│  │ - AuthN      │  │ - Permissions│  │ - Activity   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Cashbooks   │  │ Transactions │  │   Reports    │      │
│  │              │  │              │  │              │      │
│  │ - Multi-book │  │ - Cash In    │  │ - Cash Flow  │      │
│  │ - Balances   │  │ - Cash Out   │  │ - Balance    │      │
│  │ - Currencies │  │ - Comments   │  │ - Category   │      │
│  │              │  │ - Attachments│  │ - Export     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │    Imports   │  │   Settings   │                         │
│  │              │  │              │                         │
│  │ - Excel      │  │ - Categories │                         │
│  │ - Validation │  │ - Payment    │                         │
│  │ - Bulk Load  │  │ - Users      │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Domain Details

### Authentication Domain

**Responsibilities:**
- User authentication via 4-digit PIN
- Session management
- JWT token generation and validation
- Route protection middleware

**Ownership:**
- Owns User authentication flow
- Owns Session lifecycle
- Owns Auth middleware

**Relationships:**
- Depends on: User Domain (for user data)
- Used by: All domains (for auth checks)

**Why it exists:**
- Centralized auth logic prevents duplication
- Single source of truth for authentication
- Enables consistent security across application

### User Domain

**Responsibilities:**
- User profile management
- Role assignment and management
- Permission checks
- User-cashbook associations

**Ownership:**
- Owns User entity
- Owns Role entity
- Owns User-Cashbook relationships

**Relationships:**
- Used by: Authentication Domain (for login)
- Used by: Transaction Domain (for audit logs)
- Used by: All domains (for authorization)

**Why it exists:**
- Separates user management from business logic
- Enables role-based access control
- Provides audit trail for all actions

### Dashboard Domain

**Responsibilities:**
- Financial overview widgets
- KPI calculations
- Activity feed aggregation
- Balance summaries
- Quick action shortcuts

**Ownership:**
- Owns dashboard data aggregation
- Owns widget configuration
- Owns KPI calculation logic

**Relationships:**
- Depends on: Transaction Domain (for data)
- Depends on: Cashbook Domain (for balances)
- Depends on: User Domain (for personalization)

**Why it exists:**
- Provides immediate financial visibility
- Centralizes key metrics
- Enables quick access to common actions

### Cashbook Domain

**Responsibilities:**
- Cashbook creation and management
- Multi-currency support
- Balance calculations
- Cashbook-user associations
- Currency exchange rates

**Ownership:**
- Owns Cashbook entity
- Owns Currency configuration
- Owns Balance calculations

**Relationships:**
- Used by: Transaction Domain (transactions belong to cashbook)
- Used by: Dashboard Domain (balance display)
- Used by: Report Domain (cashbook-specific reports)

**Why it exists:**
- Enables multi-entity accounting
- Supports multi-currency operations
- Provides financial boundaries

### Transaction Domain

**Responsibilities:**
- Cash In transaction management
- Cash Out transaction management
- Transaction comments
- Transaction attachments
- Audit trail
- Category assignment
- Payment method tracking
- Currency conversion
- Running balance calculation
- Transaction search and filtering

**Ownership:**
- Owns Transaction entity
- Owns TransactionComment entity
- Owns TransactionAttachment entity
- Owns Category entity
- Owns PaymentMethod entity
- Owns AuditLog entity

**Relationships:**
- Depends on: Cashbook Domain (transactions belong to cashbook)
- Depends on: User Domain (transactions created by user)
- Used by: Dashboard Domain (transaction data)
- Used by: Report Domain (report data)
- Used by: Import Domain (bulk transaction creation)

**Why it exists:**
- Core business logic for financial transactions
- Centralizes all transaction-related features
- Ensures data consistency across transaction operations
- Provides complete audit trail

### Import Domain

**Responsibilities:**
- Excel file parsing
- Data validation
- Bulk transaction creation
- Import error handling
- Import history tracking

**Ownership:**
- Owns import validation logic
- Owns Excel parsing logic
- Owns bulk transaction creation

**Relationships:**
- Depends on: Transaction Domain (creates transactions)
- Depends on: Cashbook Domain (target cashbook)
- Depends on: User Domain (imported by user)

**Why it exists:**
- Enables bulk data entry
- Reduces manual transaction entry
- Provides migration path from other systems

### Report Domain

**Responsibilities:**
- Cash flow reporting
- Balance reporting
- Category analysis
- Date range reporting
- Excel export generation
- PDF export generation
- Report caching

**Ownership:**
- Owns report query logic
- Owns report formatting
- Owns export generation

**Relationships:**
- Depends on: Transaction Domain (data source)
- Depends on: Cashbook Domain (cashbook filtering)
- Depends on: User Domain (access control)

**Why it exists:**
- Provides financial insights
- Enables regulatory compliance
- Supports decision-making

### Settings Domain

**Responsibilities:**
- Category management
- Payment method management
- System configuration
- User preferences
- Cashbook settings

**Ownership:**
- Owns Category entity (shared with Transaction)
- Owns PaymentMethod entity (shared with Transaction)
- Owns system configuration

**Relationships:**
- Used by: Transaction Domain (category/payment method selection)
- Used by: Report Domain (category filtering)
- Used by: Import Domain (category mapping)

**Why it exists:**
- Centralizes configuration management
- Enables system customization
- Provides master data management

## Domain Dependencies

```
                    ┌──────────────┐
                    │ Authentication│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Users     │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│  Cashbooks   │  │  Transactions   │  │  Settings  │
└───────┬──────┘  └────────┬────────┘  └─────┬──────┘
        │                  │                  │
        │         ┌────────┼────────┐         │
        │         │                 │         │
┌───────▼──────┐  │  ┌────────▼────┐  ┌─────▼──────┐
│  Dashboard   │  │  │   Reports    │  │   Imports  │
└──────────────┘  │  └─────────────┘  └────────────┘
                  │
                  │
            ┌─────▼─────┐
            │  Reports  │
            └───────────┘
```

---

# 3. Module Architecture

## Module Overview

Each domain is implemented as a module with clear internal structure. Modules are organized by business capability, not technical feature.

## Module Hierarchy

```
o-book/
├── modules/
│   ├── authentication/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── cashbooks/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── transactions/
│   │   ├── components/
│   │   │   ├── cash-in/
│   │   │   ├── cash-out/
│   │   │   ├── comments/
│   │   │   ├── attachments/
│   │   │   ├── audit/
│   │   │   └── filters/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   ├── cash-in.service.ts
│   │   │   ├── cash-out.service.ts
│   │   │   ├── comment.service.ts
│   │   │   ├── attachment.service.ts
│   │   │   ├── audit.service.ts
│   │   │   └── currency.service.ts
│   │   ├── types/
│   │   └── utils/
│   ├── imports/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── reports/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── settings/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
```

## Module Details

### Authentication Module

**Purpose:**
Handle all authentication-related functionality including login, session management, and route protection.

**Features:**
- 4-digit PIN login
- JWT session management
- Session refresh
- Route protection middleware
- Logout functionality

**Internal Structure:**
```
authentication/
├── components/
│   ├── LoginForm.tsx
│   ├── PinInput.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useSession.ts
├── services/
│   └── auth.service.ts
├── types/
│   └── auth.types.ts
└── utils/
    └── auth.utils.ts
```

**Responsibilities:**
- Validate user credentials
- Generate and validate JWT tokens
- Manage session lifecycle
- Protect routes based on authentication status
- Handle logout and session cleanup

**Data Ownership:**
- Does not own any database entities
- Uses User entity from User module
- Manages JWT tokens in cookies

### User Module

**Purpose:**
Manage user profiles, roles, permissions, and user-cashbook associations.

**Features:**
- User profile management
- Role assignment
- Permission checking
- User-cashbook mapping
- User activity tracking

**Internal Structure:**
```
users/
├── components/
│   ├── UserProfile.tsx
│   ├── RoleSelector.tsx
│   └── UserList.tsx
├── hooks/
│   ├── useUser.ts
│   ├── useUsers.ts
│   └── usePermissions.ts
├── services/
│   ├── user.service.ts
│   └── permission.service.ts
├── types/
│   └── user.types.ts
└── utils/
    └── permission.utils.ts
```

**Responsibilities:**
- Create and update user profiles
- Assign and manage roles
- Check permissions for actions
- Manage user access to cashbooks
- Track user activity

**Data Ownership:**
- Owns User entity
- Owns Role entity
- Owns UserCashbook junction entity

### Dashboard Module

**Purpose:**
Provide financial overview, KPIs, and quick access to common actions.

**Features:**
- Balance overview cards
- Recent transactions widget
- Cash flow chart
- Quick transaction entry
- Activity feed
- KPI indicators

**Internal Structure:**
```
dashboard/
├── components/
│   ├── BalanceCard.tsx
│   ├── CashFlowChart.tsx
│   ├── RecentTransactions.tsx
│   ├── ActivityFeed.tsx
│   ├── QuickEntry.tsx
│   └── KPICard.tsx
├── hooks/
│   ├── useDashboard.ts
│   ├── useBalance.ts
│   └── useKPIs.ts
├── services/
│   ├── dashboard.service.ts
│   └── kpi.service.ts
├── types/
│   └── dashboard.types.ts
└── utils/
    └── kpi.utils.ts
```

**Responsibilities:**
- Aggregate financial data for dashboard
- Calculate KPIs
- Format dashboard data for display
- Handle quick transaction entry
- Generate activity feed

**Data Ownership:**
- Does not own any database entities
- Aggregates data from Transaction and Cashbook modules
- Caches computed KPIs

### Cashbook Module

**Purpose:**
Manage cashbooks, multi-currency support, and balance calculations.

**Features:**
- Cashbook creation and management
- Multi-currency configuration
- Balance calculation
- Currency exchange rates
- Cashbook-user associations

**Internal Structure:**
```
cashbooks/
├── components/
│   ├── CashbookList.tsx
│   ├── CashbookForm.tsx
│   ├── CashbookSelector.tsx
│   └── BalanceDisplay.tsx
├── hooks/
│   ├── useCashbook.ts
│   ├── useCashbooks.ts
│   └── useBalance.ts
├── services/
│   ├── cashbook.service.ts
│   ├── currency.service.ts
│   └── balance.service.ts
├── types/
│   └── cashbook.types.ts
└── utils/
    └── currency.utils.ts
```

**Responsibilities:**
- Create and update cashbooks
- Manage currency configuration
- Calculate running balances
- Handle currency conversions
- Manage user access to cashbooks

**Data Ownership:**
- Owns Cashbook entity
- Owns Currency configuration
- Owns ExchangeRate entity (future)

### Transaction Module

**Purpose:**
Core module for managing all transaction-related functionality including cash in/out, comments, attachments, audit trail, and currency handling.

**Features:**
- Cash In transaction management
- Cash Out transaction management
- Transaction comments
- Transaction attachments
- Audit trail
- Category assignment
- Payment method tracking
- Currency conversion
- Running balance calculation
- Transaction search and filtering

**Internal Structure:**
```
transactions/
├── components/
│   ├── cash-in/
│   │   ├── CashInForm.tsx
│   │   ├── CashInList.tsx
│   │   └── CashInDetail.tsx
│   ├── cash-out/
│   │   ├── CashOutForm.tsx
│   │   ├── CashOutList.tsx
│   │   └── CashOutDetail.tsx
│   ├── comments/
│   │   ├── CommentList.tsx
│   │   ├── CommentForm.tsx
│   │   └── CommentItem.tsx
│   ├── attachments/
│   │   ├── AttachmentList.tsx
│   │   ├── AttachmentUpload.tsx
│   │   └── AttachmentPreview.tsx
│   ├── audit/
│   │   ├── AuditLog.tsx
│   │   └── AuditTimeline.tsx
│   └── filters/
│       ├── TransactionFilters.tsx
│       ├── DateRangePicker.tsx
│       └── CategoryFilter.tsx
├── hooks/
│   ├── useTransactions.ts
│   ├── useTransaction.ts
│   ├── useCashIn.ts
│   ├── useCashOut.ts
│   ├── useComments.ts
│   ├── useAttachments.ts
│   └── useAuditLog.ts
├── services/
│   ├── transaction.service.ts
│   ├── cash-in.service.ts
│   ├── cash-out.service.ts
│   ├── comment.service.ts
│   ├── attachment.service.ts
│   ├── audit.service.ts
│   ├── currency.service.ts
│   └── balance.service.ts
├── types/
│   ├── transaction.types.ts
│   ├── comment.types.ts
│   ├── attachment.types.ts
│   └── audit.types.ts
└── utils/
    ├── transaction.utils.ts
    ├── currency.utils.ts
    └── balance.utils.ts
```

**Responsibilities:**
- Create and update transactions
- Manage transaction comments
- Handle file attachments
- Maintain audit trail
- Calculate running balances
- Handle currency conversions
- Search and filter transactions
- Validate transaction data

**Data Ownership:**
- Owns Transaction entity
- Owns TransactionComment entity
- Owns TransactionAttachment entity
- Owns Category entity (shared with Settings)
- Owns PaymentMethod entity (shared with Settings)
- Owns AuditLog entity

### Import Module

**Purpose:**
Handle bulk transaction imports from Excel files.

**Features:**
- Excel file upload
- Data validation
- Bulk transaction creation
- Import error reporting
- Import history tracking

**Internal Structure:**
```
imports/
├── components/
│   ├── ImportForm.tsx
│   ├── FileUploader.tsx
│   ├── ValidationResults.tsx
│   └── ImportHistory.tsx
├── hooks/
│   ├── useImport.ts
│   └── useImportHistory.ts
├── services/
│   ├── import.service.ts
│   ├── excel-parser.service.ts
│   └── validation.service.ts
├── types/
│   └── import.types.ts
└── utils/
    ├── excel.utils.ts
    └── validation.utils.ts
```

**Responsibilities:**
- Parse Excel files
- Validate import data
- Create transactions in bulk
- Report import errors
- Track import history

**Data Ownership:**
- Does not own any database entities
- Creates Transaction entities via Transaction module
- May own ImportHistory entity (future)

### Report Module

**Purpose:**
Generate financial reports and exports.

**Features:**
- Cash flow reports
- Balance reports
- Category analysis
- Date range reports
- Excel export
- PDF export

**Internal Structure:**
```
reports/
├── components/
│   ├── ReportSelector.tsx
│   ├── CashFlowReport.tsx
│   ├── BalanceReport.tsx
│   ├── CategoryReport.tsx
│   └── ExportButton.tsx
├── hooks/
│   ├── useReports.ts
│   ├── useCashFlow.ts
│   └── useExport.ts
├── services/
│   ├── report.service.ts
│   ├── cash-flow.service.ts
│   ├── balance.service.ts
│   ├── category.service.ts
│   ├── excel-export.service.ts
│   └── pdf-export.service.ts
├── types/
│   └── report.types.ts
└── utils/
    ├── export.utils.ts
    └── report.utils.ts
```

**Responsibilities:**
- Query transaction data for reports
- Calculate report metrics
- Format report data
- Generate Excel exports
- Generate PDF exports
- Cache report results

**Data Ownership:**
- Does not own any database entities
- Queries Transaction and Cashbook entities
- May own ReportCache entity (future)

### Settings Module

**Purpose:**
Manage system configuration, categories, and payment methods.

**Features:**
- Category management
- Payment method management
- System configuration
- User preferences
- Cashbook settings

**Internal Structure:**
```
settings/
├── components/
│   ├── CategoryManager.tsx
│   ├── PaymentMethodManager.tsx
│   ├── SystemSettings.tsx
│   └── UserPreferences.tsx
├── hooks/
│   ├── useCategories.ts
│   ├── usePaymentMethods.ts
│   └── useSettings.ts
├── services/
│   ├── category.service.ts
│   ├── payment-method.service.ts
│   └── settings.service.ts
├── types/
│   └── settings.types.ts
└── utils/
    └── settings.utils.ts
```

**Responsibilities:**
- Create and update categories
- Create and update payment methods
- Manage system configuration
- Handle user preferences
- Configure cashbook settings

**Data Ownership:**
- Owns Category entity (shared with Transaction)
- Owns PaymentMethod entity (shared with Transaction)
- Owns SystemSetting entity (future)

---

# 4. Monorepo Architecture

## Turborepo Structure

```
o-book/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── styles/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── next.config.js
│   │   └── turbo.json
│   └── docs/
│       ├── app/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── auth/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── validators/
│       ├── lib/
│       ├── package.json
│       └── tsconfig.json
├── package.json
├── turbo.json
├── tsconfig.json
└── .env.example
```

## Package Descriptions

### apps/web

**Purpose:**
Main Next.js application for O Book.

**Contents:**
- App Router structure
- Page components
- API routes
- Server actions
- Public assets
- Styles

**Dependencies:**
- @o-book/ui
- @o-book/database
- @o-book/auth
- @o-book/config
- @o-book/types
- @o-book/utils
- @o-book/validators

### apps/docs

**Purpose:**
Documentation site (optional, can use external docs).

**Contents:**
- Documentation pages
- API documentation
- Architecture docs

### packages/ui

**Purpose:**
Shared UI components built with Shadcn/UI.

**Contents:**
- Reusable UI components
- Component variants
- Component composition utilities

**Dependencies:**
- @o-book/utils
- @o-book/types

### packages/database

**Purpose:**
Database schema, migrations, and Prisma client.

**Contents:**
- Prisma schema
- Database migrations
- Seed scripts
- Prisma client generation
- Database utilities

**Dependencies:**
- @o-book/config
- @o-book/types

### packages/auth

**Purpose:**
Authentication configuration and utilities.

**Contents:**
- NextAuth configuration
- Auth utilities
- Session helpers
- Permission helpers

**Dependencies:**
- @o-book/database
- @o-book/types
- @o-book/config

### packages/config

**Purpose:**
Shared configuration and environment variables.

**Contents:**
- Environment variable schemas
- Configuration objects
- Constants

**Dependencies:**
- @o-book/types

### packages/types

**Purpose:**
Shared TypeScript types and interfaces.

**Contents:**
- Domain types
- API types
- Component types
- Utility types

**Dependencies:**
- None

### packages/utils

**Purpose:**
Shared utility functions.

**Contents:**
- Date utilities
- Currency utilities
- String utilities
- Validation utilities

**Dependencies:**
- @o-book/types

### packages/validators

**Purpose:**
Shared Zod validation schemas.

**Contents:**
- API request schemas
- Form validation schemas
- Domain validation schemas

**Dependencies:**
- @o-book/types

## Turborepo Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

## Package Dependencies Graph

```
                    ┌─────────────┐
                    │    types    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌───────▼──────┐  ┌────────▼────────┐
│    config    │  │    utils     │  │   validators    │
└───────┬──────┘  └───────┬──────┘  └────────┬────────┘
        │                  │                  │
        │         ┌────────┼────────┐         │
        │         │                 │         │
┌───────▼──────┐  │  ┌────────▼────┐  ┌──────▼──────┐
│  database   │  │  │     ui      │  │    auth     │
└───────┬──────┘  │  └─────────────┘  └─────────────┘
        │         │
        │         │
┌───────▼─────────▼─────┐
│         web           │
└───────────────────────┘
```

---

# 5. Next.js Application Structure

## App Router Structure

```
apps/web/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── cashbooks/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── transactions/
│   │   ├── page.tsx
│   │   ├── cash-in/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── cash-out/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── reports/
│   │   ├── page.tsx
│   │   ├── cash-flow/
│   │   │   └── page.tsx
│   │   ├── balance/
│   │   │   └── page.tsx
│   │   └── category/
│   │       └── page.tsx
│   ├── imports/
│   │   ├── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   └── settings/
│       ├── page.tsx
│       ├── categories/
│       │   └── page.tsx
│       ├── payment-methods/
│       │   └── page.tsx
│       └── users/
│           └── page.tsx
├── api/
│   └── v1/
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts
│       │   ├── logout/
│       │   │   └── route.ts
│       │   └── session/
│       │       └── route.ts
│       ├── users/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── cashbooks/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   └── route.ts
│       │   └── balance/
│       │       └── route.ts
│       ├── transactions/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   ├── route.ts
│       │   │   ├── comments/
│       │   │   │   └── route.ts
│       │   │   ├── attachments/
│       │   │   │   └── route.ts
│       │   │   └── audit/
│       │   │       └── route.ts
│       │   ├── cash-in/
│       │   │   └── route.ts
│       │   └── cash-out/
│       │       └── route.ts
│       ├── categories/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── payment-methods/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── reports/
│       │   ├── cash-flow/
│       │   │   └── route.ts
│       │   ├── balance/
│       │   │   └── route.ts
│       │   └── category/
│       │       └── route.ts
│       ├── imports/
│       │   ├── route.ts
│       │   └── validate/
│       │       └── route.ts
│       └── settings/
│           └── route.ts
├── layout.tsx
└── not-found.tsx
```

## Route Groups

### (auth) Route Group

**Purpose:**
Authentication-related pages that don't share layout with dashboard.

**Routes:**
- `/login` - Login page with PIN input

**Layout:**
- Minimal layout without sidebar
- Centered content
- No authentication required

### (dashboard) Route Group

**Purpose:**
Main application pages with shared dashboard layout.

**Routes:**
- `/` - Dashboard home
- `/cashbooks` - Cashbook management
- `/transactions` - Transaction management
- `/reports` - Financial reports
- `/imports` - Import transactions
- `/settings` - System settings

**Layout:**
- Sidebar navigation
- Header with user info
- Cashbook selector
- Responsive design

## Layout Strategy

### Root Layout (`app/layout.tsx`)

**Responsibilities:**
- Global providers (Theme, Query, Auth)
- Global styles
- Font configuration
- Metadata configuration

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <QueryClientProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Auth Layout (`app/(auth)/layout.tsx`)

**Responsibilities:**
- Centered layout for auth pages
- Minimal styling
- No navigation

### Dashboard Layout (`app/(dashboard)/layout.tsx`)

**Responsibilities:**
- Sidebar navigation
- Header with user info
- Cashbook selector
- Breadcrumbs
- Responsive behavior

## Dashboard Routes

### `/` - Dashboard Home

**Components:**
- Balance cards (total balance, cash in, cash out)
- Cash flow chart
- Recent transactions list
- Activity feed
- Quick transaction entry

**Data Sources:**
- Transaction module (recent transactions, activity)
- Cashbook module (balances)
- Dashboard module (KPIs)

### `/cashbooks` - Cashbook Management

**Components:**
- Cashbook list
- Cashbook creation form
- Cashbook settings
- Balance overview

**Data Sources:**
- Cashbook module

### `/cashbooks/[id]` - Cashbook Detail

**Components:**
- Cashbook details
- Transaction list filtered by cashbook
- Balance history
- Cashbook settings

**Data Sources:**
- Cashbook module
- Transaction module

## Transaction Routes

### `/transactions` - Transaction List

**Components:**
- Transaction filters (date, category, type)
- Transaction list (cash in/out)
- Pagination
- Search
- Export button

**Data Sources:**
- Transaction module

### `/transactions/cash-in` - Cash In Transactions

**Components:**
- Cash in transaction list
- Cash in filters
- New cash in button
- Export

**Data Sources:**
- Transaction module (cash-in service)

### `/transactions/cash-in/new` - New Cash In

**Components:**
- Cash in form
- Category selection
- Payment method selection
- Attachment upload
- Currency selection

**Data Sources:**
- Transaction module (cash-in service)
- Settings module (categories, payment methods)
- Cashbook module (currencies)

### `/transactions/cash-out` - Cash Out Transactions

**Components:**
- Cash out transaction list
- Cash out filters
- New cash out button
- Export

**Data Sources:**
- Transaction module (cash-out service)

### `/transactions/cash-out/new` - New Cash Out

**Components:**
- Cash out form
- Category selection
- Payment method selection
- Attachment upload
- Currency selection

**Data Sources:**
- Transaction module (cash-out service)
- Settings module (categories, payment methods)
- Cashbook module (currencies)

### `/transactions/[id]` - Transaction Detail

**Components:**
- Transaction details
- Comments section
- Attachments section
- Audit log timeline
- Edit/delete actions (based on role)

**Data Sources:**
- Transaction module
- User module (for user info)

## Report Routes

### `/reports` - Report Home

**Components:**
- Report type selector
- Date range picker
- Cashbook selector
- Generate report button

**Data Sources:**
- Report module

### `/reports/cash-flow` - Cash Flow Report

**Components:**
- Cash flow chart
- Cash flow table
- Summary metrics
- Export buttons (Excel, PDF)

**Data Sources:**
- Report module (cash-flow service)

### `/reports/balance` - Balance Report

**Components:**
- Balance over time chart
- Balance table
- Currency breakdown
- Export buttons

**Data Sources:**
- Report module (balance service)

### `/reports/category` - Category Report

**Components:**
- Category breakdown chart
- Category table
- Category comparison
- Export buttons

**Data Sources:**
- Report module (category service)

## Settings Routes

### `/settings` - Settings Home

**Components:**
- Settings navigation
- System overview
- Quick settings

**Data Sources:**
- Settings module

### `/settings/categories` - Category Management

**Components:**
- Category list
- Category creation form
- Category editing
- Category deletion

**Data Sources:**
- Settings module (category service)

### `/settings/payment-methods` - Payment Method Management

**Components:**
- Payment method list
- Payment method creation form
- Payment method editing
- Payment method deletion

**Data Sources:**
- Settings module (payment-method service)

### `/settings/users` - User Management (Admin only)

**Components:**
- User list
- User creation form
- Role assignment
- User-cashbook mapping

**Data Sources:**
- User module
- Cashbook module

## API Routes

### Authentication APIs

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/session
```

### User APIs

```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/[id]
PUT    /api/v1/users/[id]
DELETE /api/v1/users/[id]
```

### Cashbook APIs

```
GET    /api/v1/cashbooks
POST   /api/v1/cashbooks
GET    /api/v1/cashbooks/[id]
PUT    /api/v1/cashbooks/[id]
DELETE /api/v1/cashbooks/[id]
GET    /api/v1/cashbooks/[id]/balance
```

### Transaction APIs

```
GET    /api/v1/transactions
POST   /api/v1/transactions
GET    /api/v1/transactions/[id]
PUT    /api/v1/transactions/[id]
DELETE /api/v1/transactions/[id]
GET    /api/v1/transactions/[id]/comments
POST   /api/v1/transactions/[id]/comments
GET    /api/v1/transactions/[id]/attachments
POST   /api/v1/transactions/[id]/attachments
GET    /api/v1/transactions/[id]/audit
POST   /api/v1/transactions/cash-in
POST   /api/v1/transactions/cash-out
```

### Category APIs

```
GET    /api/v1/categories
POST   /api/v1/categories
GET    /api/v1/categories/[id]
PUT    /api/v1/categories/[id]
DELETE /api/v1/categories/[id]
```

### Payment Method APIs

```
GET    /api/v1/payment-methods
POST   /api/v1/payment-methods
GET    /api/v1/payment-methods/[id]
PUT    /api/v1/payment-methods/[id]
DELETE /api/v1/payment-methods/[id]
```

### Report APIs

```
GET    /api/v1/reports/cash-flow
GET    /api/v1/reports/balance
GET    /api/v1/reports/category
```

### Import APIs

```
POST   /api/v1/imports
POST   /api/v1/imports/validate
```

### Settings APIs

```
GET    /api/v1/settings
PUT    /api/v1/settings
```

---

# 6. Database Architecture

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐
│    User     │       │    Role     │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ name        │       │ name        │
│ email       │       │ slug        │
│ pin         │       │ description │
│ roleId (FK) │       └─────────────┘
│ createdAt   │              │
│ updatedAt   │              │
└──────┬──────┘              │
       │                     │
       │              ┌──────▼──────┐
       │              │             │
       │       ┌──────▼──────┐      │
       │       │             │      │
       └───────┼─────────────┼──────┘
               │             │
         ┌─────▼─────┐ ┌────▼─────┐
         │ UserCash-  │ │          │
         │ book       │ │          │
         ├────────────┤ │          │
         │ userId (FK)│ │          │
         │ cashbookId │ │          │
         │ (FK)       │ │          │
         └─────┬──────┘ │          │
               │        │          │
         ┌─────▼──────┐ │          │
         │            │ │          │
┌────────▼────────┐    │ │          │
│   Cashbook     │    │ │          │
├────────────────┤    │ │          │
│ id (PK)        │    │ │          │
│ name           │    │ │          │
│ description    │    │ │          │
│ baseCurrency   │    │ │          │
│ createdAt      │    │ │          │
│ updatedAt      │    │ │          │
└────────┬───────┘    │ │          │
         │            │ │          │
         │    ┌───────▼─▼─▼──────────┐
         │    │                     │
         │    │                     │
         └────┼─────────────────────┼──────┐
              │                     │      │
         ┌────▼─────────┐   ┌──────▼──────┐│
         │              │   │             ││
         │ Transaction  │   │ Category    ││
         ├──────────────┤   ├─────────────┤│
         │ id (PK)      │   │ id (PK)     ││
         │ cashbookId   │   │ name        ││
         │ (FK)         │   │ type        ││
         │ type         │   │ description ││
         │ amount       │   │ color       ││
         │ currency     │   │ isActive    ││
         │ categoryId   │   │ createdAt   ││
         │ (FK)         │   └─────────────┘│
         │ paymentMethod│                  │
         │ Id (FK)      │                  │
         │ description  │                  │
         │ date         │                  │
         │ createdById  │                  │
         │ (FK)         │                  │
         │ createdAt    │                  │
         │ updatedAt    │                  │
         └──┬───────────┘                  │
            │                             │
            │        ┌────────────────────┘
            │        │
     ┌──────▼────────▼────────┐
     │                         │
     │                         │
┌────▼─────────┐    ┌────────▼─────────┐
│ Transaction- │    │ PaymentMethod     │
│ Comment      │    ├───────────────────┤
├──────────────┤    │ id (PK)           │
│ id (PK)      │    │ name              │
│ transactionId│    │ description       │
│ (FK)         │    │ icon              │
│ userId (FK)  │    │ isActive          │
│ content      │    │ createdAt         │
│ createdAt    │    └───────────────────┘
└──────────────┘
┌──────────────┐
│ Transaction- │
│ Attachment   │
├──────────────┤
│ id (PK)      │
│ transactionId│
│ (FK)         │
│ fileName     │
│ filePath     │
│ fileSize     │
│ mimeType     │
│ uploadedById │
│ (FK)         │
│ createdAt    │
└──────────────┘
┌──────────────┐
│ AuditLog     │
├──────────────┤
│ id (PK)      │
│ transactionId│
│ (FK)         │
│ userId (FK)  │
│ action       │
│ changes      │
│ createdAt    │
└──────────────┘
```

## Prisma Schema

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoleType {
  ADMIN
  ACCOUNTANT
  CEO
  PARTNER
}

enum TransactionType {
  CASH_IN
  CASH_OUT
}

enum AuditAction {
  CREATED
  UPDATED
  DELETED
  COMMENT_ADDED
  ATTACHMENT_ADDED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  pin       String   @db.VarChar(4)
  role      Role     @relation(fields: [roleId], references: [id])
  roleId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cashbooks          UserCashbook[]
  createdTransactions Transaction[]
  comments           TransactionComment[]
  uploadedAttachments TransactionAttachment[]
  auditLogs          AuditLog[]

  @@index([email])
  @@index([pin])
}

model Role {
  id          String     @id @default(cuid())
  name        String     @unique
  slug        RoleType   @unique
  description String?
  users       User[]
  createdAt   DateTime   @default(now())
}

model Cashbook {
  id           String        @id @default(cuid())
  name         String
  description  String?
  baseCurrency String        @default("USD")
  users        UserCashbook[]
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([name])
}

model UserCashbook {
  id        String   @id @default(cuid())
  userId    String
  cashbookId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  cashbook  Cashbook @relation(fields: [cashbookId], references: [id], onDelete: Cascade)

  @@unique([userId, cashbookId])
  @@index([userId])
  @@index([cashbookId])
}

model Transaction {
  id             String                @id @default(cuid())
  cashbook       Cashbook              @relation(fields: [cashbookId], references: [id], onDelete: Cascade)
  cashbookId     String
  type           TransactionType
  amount         Decimal               @db.Decimal(15, 2)
  currency       String
  category       Category              @relation(fields: [categoryId], references: [id])
  categoryId     String
  paymentMethod  PaymentMethod         @relation(fields: [paymentMethodId], references: [id])
  paymentMethodId String
  description    String?
  date           DateTime              @default(now())
  createdBy      User                  @relation(fields: [createdById], references: [id])
  createdById     String
  comments       TransactionComment[]
  attachments    TransactionAttachment[]
  auditLogs      AuditLog[]
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  @@index([cashbookId])
  @@index([type])
  @@index([date])
  @@index([categoryId])
  @@index([createdById])
}

model Category {
  id          String        @id @default(cuid())
  name        String        @unique
  type        TransactionType
  description String?
  color       String?
  isActive    Boolean       @default(true)
  transactions Transaction[]
  createdAt   DateTime      @default(now())

  @@index([type])
  @@index([isActive])
}

model PaymentMethod {
  id           String        @id @default(cuid())
  name         String        @unique
  description  String?
  icon         String?
  isActive     Boolean       @default(true)
  transactions Transaction[]
  createdAt    DateTime      @default(now())

  @@index([isActive])
}

model TransactionComment {
  id           String       @id @default(cuid())
  transaction  Transaction  @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  transactionId String
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String
  content      String
  createdAt    DateTime     @default(now())

  @@index([transactionId])
  @@index([userId])
}

model TransactionAttachment {
  id           String       @id @default(cuid())
  transaction  Transaction  @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  transactionId String
  fileName     String
  filePath     String
  fileSize     Int
  mimeType     String
  uploadedBy   User         @relation(fields: [uploadedById], references: [id], onDelete: Cascade)
  uploadedById String
  createdAt    DateTime     @default(now())

  @@index([transactionId])
  @@index([uploadedById])
}

model AuditLog {
  id           String       @id @default(cuid())
  transaction  Transaction  @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  transactionId String
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String
  action       AuditAction
  changes      Json?
  createdAt    DateTime     @default(now())

  @@index([transactionId])
  @@index([userId])
  @@index([action])
}
```

## Table Ownership

### User Module
- **User** - User profiles and credentials
- **Role** - Role definitions
- **UserCashbook** - User-cashbook associations

### Cashbook Module
- **Cashbook** - Cashbook definitions

### Transaction Module
- **Transaction** - Core transaction data
- **TransactionComment** - Transaction comments
- **TransactionAttachment** - Transaction attachments
- **AuditLog** - Transaction audit trail
- **Category** - Transaction categories (shared with Settings)
- **PaymentMethod** - Payment methods (shared with Settings)

## Foreign Key Relationships

### User Relationships
- `User.roleId → Role.id` - Each user has one role
- `UserCashbook.userId → User.id` - Users can access multiple cashbooks
- `Transaction.createdById → User.id` - Transactions track creator
- `TransactionComment.userId → User.id` - Comments track author
- `TransactionAttachment.uploadedById → User.id` - Attachments track uploader
- `AuditLog.userId → User.id` - Audit logs track actor

### Cashbook Relationships
- `UserCashbook.cashbookId → Cashbook.id` - Cashbooks have multiple users
- `Transaction.cashbookId → Cashbook.id` - Transactions belong to cashbook

### Transaction Relationships
- `Transaction.categoryId → Category.id` - Transactions have categories
- `Transaction.paymentMethodId → PaymentMethod.id` - Transactions have payment methods
- `TransactionComment.transactionId → Transaction.id` - Comments belong to transaction
- `TransactionAttachment.transactionId → Transaction.id` - Attachments belong to transaction
- `AuditLog.transactionId → Transaction.id` - Audit logs belong to transaction

## Indexing Strategy

### User Table
- `email` - Unique index for login
- `pin` - Index for PIN lookup
- `roleId` - Index for role-based queries

### Cashbook Table
- `name` - Index for search
- `baseCurrency` - Index for currency filtering

### Transaction Table
- `cashbookId` - Index for cashbook filtering
- `type` - Index for cash in/out filtering
- `date` - Index for date range queries
- `categoryId` - Index for category filtering
- `createdById` - Index for user filtering

### Category Table
- `type` - Index for cash in/out category filtering
- `isActive` - Index for active category filtering

### PaymentMethod Table
- `isActive` - Index for active payment method filtering

### TransactionComment Table
- `transactionId` - Index for comment retrieval
- `userId` - Index for user comment history

### TransactionAttachment Table
- `transactionId` - Index for attachment retrieval
- `uploadedById` - Index for user upload history

### AuditLog Table
- `transactionId` - Index for audit log retrieval
- `userId` - Index for user audit history
- `action` - Index for action type filtering

### UserCashbook Table
- `userId` - Index for user cashbook lookup
- `cashbookId` - Index for cashbook user lookup
- Unique composite index on `[userId, cashbookId]` - Prevent duplicates

---

# 7. API Architecture

## API Versioning Strategy

**Versioning Approach:**
- URL-based versioning: `/api/v1/`
- All APIs live under `/api/v1/`
- Version number incremented only for breaking changes
- Non-breaking changes added without version increment

**Rationale:**
- Clear version separation
- Easy to deprecate old versions
- URL-based versioning is most common and understood
- Internal tool, so version changes will be infrequent

## Route Naming Conventions

**Resource Naming:**
- Use plural nouns for collections: `/transactions`, `/users`
- Use singular nouns for single resources: `/transactions/[id]`
- Use kebab-case for multi-word resources: `/payment-methods`

**Action Naming:**
- Use standard HTTP methods for CRUD operations
- Use nested routes for related resources: `/transactions/[id]/comments`
- Use descriptive names for custom actions: `/imports/validate`

**Examples:**
```
GET    /api/v1/transactions           - List transactions
POST   /api/v1/transactions           - Create transaction
GET    /api/v1/transactions/[id]      - Get single transaction
PUT    /api/v1/transactions/[id]      - Update transaction
DELETE /api/v1/transactions/[id]      - Delete transaction
GET    /api/v1/transactions/[id]/comments - List comments
POST   /api/v1/transactions/[id]/comments - Add comment
```

## Resource Hierarchy

```
/api/v1/
├── auth/                    - Authentication
│   ├── login
│   ├── logout
│   └── session
├── users/                   - User management
│   └── [id]/
├── cashbooks/               - Cashbook management
│   ├── [id]/
│   └── balance/
├── transactions/            - Transaction management
│   ├── [id]/
│   │   ├── comments/
│   │   ├── attachments/
│   │   └── audit/
│   ├── cash-in/
│   └── cash-out/
├── categories/              - Category management
│   └── [id]/
├── payment-methods/         - Payment method management
│   └── [id]/
├── reports/                 - Report generation
│   ├── cash-flow/
│   ├── balance/
│   └── category/
├── imports/                 - Import operations
│   └── validate/
└── settings/                - System settings
```

## Authentication Flow

### Login Flow

```
Client                    Server                    Database
  │                         │                          │
  │ POST /api/v1/auth/login │                          │
  │ { pin: "1234" }         │                          │
  │────────────────────────>│                          │
  │                         │ Validate PIN             │
  │                         │─────────────────────────>│
  │                         │                          │
  │                         │ Return user              │
  │                         │<─────────────────────────│
  │                         │                          │
  │                         │ Create JWT               │
  │                         │ Set session cookie       │
  │                         │                          │
  │ { success: true,        │                          │
  │   data: { user, token }│                          │
  │ }                       │                          │
  │<────────────────────────│                          │
  │                         │                          │
```

### Session Validation Flow

```
Client                    Server                    Database
  │                         │                          │
  │ GET /api/v1/auth/session│                         │
  │ (with session cookie)   │                          │
  │────────────────────────>│                          │
  │                         │ Validate JWT             │
  │                         │                          │
  │                         │ Fetch user data          │
  │                         │─────────────────────────>│
  │                         │                          │
  │                         │ Return user              │
  │                         │<─────────────────────────│
  │                         │                          │
  │ { success: true,        │                          │
  │   data: { user }        │                          │
  │ }                       │                          │
  │<────────────────────────│                          │
  │                         │                          │
```

## Authorization Flow

### Permission Check Flow

```
Client                    Server                    Database
  │                         │                          │
  │ GET /api/v1/transactions│                         │
  │ (with session cookie)   │                          │
  │────────────────────────>│                          │
  │                         │ Validate JWT             │
  │                         │ Extract user role        │
  │                         │                          │
  │                         │ Check permissions        │
  │                         │ (role-based)             │
  │                         │                          │
  │                         │ Fetch transactions       │
  │                         │─────────────────────────>│
  │                         │                          │
  │                         │ Return transactions      │
  │                         │<─────────────────────────│
  │                         │                          │
  │ { success: true,        │                          │
  │   data: { transactions }│                         │
  │ }                       │                          │
  │<────────────────────────│                          │
  │                         │                          │
```

## Error Handling Strategy

### Error Response Format

```typescript
// Success Response
{
  success: true,
  message: "Operation successful",
  data: T
}

// Error Response
{
  success: false,
  message: "Operation failed",
  error: "ERROR_CODE"
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Authentication Errors
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Authorization Errors
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Validation Errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Resource Errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Server Errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Business Logic Errors
  INVALID_TRANSACTION_TYPE = "INVALID_TRANSACTION_TYPE",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_CURRENCY = "INVALID_CURRENCY",
}
```

### Error Handling Middleware

```typescript
// app/api/v1/middleware/error-handler.ts
export function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: "VALIDATION_ERROR",
          details: error.errors,
        })
      }

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
          error: "FORBIDDEN",
        })
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
          error: "NOT_FOUND",
        })
      }

      // Log unexpected errors
      console.error("Unexpected error:", error)

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      })
    }
  }
}
```

## API Route Examples

### Authentication API

```typescript
// app/api/v1/auth/login/route.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { authLoginSchema } from '@o-book/validators'

const loginSchema = z.object({
  pin: z.string().length(4).regex(/^\d+$/),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { pin } = loginSchema.parse(body)

    // Validate PIN and get user
    const user = await validatePin(pin)

    // Create session
    const session = await createSession(user)

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: { user, session },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Invalid input",
        error: "VALIDATION_ERROR",
        details: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: "Login failed",
      error: "INVALID_CREDENTIALS",
    }, { status: 401 })
  }
}
```

### Transaction API

```typescript
// app/api/v1/transactions/route.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { transactionSchema } from '@o-book/validators'

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        error: "UNAUTHORIZED",
      }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cashbookId = searchParams.get('cashbookId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const transactions = await getTransactions({
      cashbookId: cashbookId || undefined,
      type: type as TransactionType | undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    return NextResponse.json({
      success: true,
      message: "Transactions retrieved",
      data: transactions,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to retrieve transactions",
      error: "INTERNAL_SERVER_ERROR",
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        error: "UNAUTHORIZED",
      }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = transactionSchema.parse(body)

    const transaction = await createTransaction({
      ...validatedData,
      createdById: session.user.id,
    })

    return NextResponse.json({
      success: true,
      message: "Transaction created",
      data: transaction,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Invalid input",
        error: "VALIDATION_ERROR",
        details: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: "Failed to create transaction",
      error: "INTERNAL_SERVER_ERROR",
    }, { status: 500 })
  }
}
```

### Comment API

```typescript
// app/api/v1/transactions/[id]/comments/route.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { commentSchema } from '@o-book/validators'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        error: "UNAUTHORIZED",
      }, { status: 401 })
    }

    const comments = await getComments(params.id)

    return NextResponse.json({
      success: true,
      message: "Comments retrieved",
      data: comments,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to retrieve comments",
      error: "INTERNAL_SERVER_ERROR",
    }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        error: "UNAUTHORIZED",
      }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = commentSchema.parse(body)

    const comment = await createComment({
      transactionId: params.id,
      userId: session.user.id,
      content: validatedData.content,
    })

    return NextResponse.json({
      success: true,
      message: "Comment added",
      data: comment,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Invalid input",
        error: "VALIDATION_ERROR",
        details: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: "Failed to add comment",
      error: "INTERNAL_SERVER_ERROR",
    }, { status: 500 })
  }
}
```

---

# 8. Authentication & Authorization Architecture

## NextAuth Configuration Strategy

### Configuration File

```typescript
// packages/auth/lib/auth.config.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@o-book/database'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.cashbookIds = user.cashbookIds
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.cashbookIds = token.cashbookIds as string[]
      }
      return session
    },
  },
  providers: [
    // No social providers - PIN only
  ],
}
```

### Custom Credentials Provider

```typescript
// packages/auth/lib/pin-provider.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@o-book/database'

export const pinProvider: NextAuthOptions['providers'][0] = CredentialsProvider({
  name: 'PIN',
  credentials: {
    pin: { label: 'PIN', type: 'password' },
  },
  async authorize(credentials) {
    if (!credentials?.pin) {
      throw new Error('PIN is required')
    }

    const user = await prisma.user.findUnique({
      where: { pin: credentials.pin },
      include: {
        role: true,
        cashbooks: {
          include: {
            cashbook: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('Invalid PIN')
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.slug,
      cashbookIds: user.cashbooks.map(uc => uc.cashbookId),
    }
  },
})
```

## 4 Digit PIN Login Flow

### Login Process

```
1. User enters 4-digit PIN on login page
2. Client validates PIN format (4 digits)
3. Client sends POST /api/v1/auth/login with PIN
4. Server validates PIN against database
5. Server retrieves user with role and cashbooks
6. NextAuth creates JWT session
7. Session stored in HTTP-only cookie
8. User redirected to dashboard
```

### PIN Validation Rules

- Must be exactly 4 digits
- Must be numeric only
- Stored as hashed string in database
- Never logged or exposed in error messages
- Rate limited to prevent brute force

### PIN Storage

```typescript
// Hash PIN before storage
import bcrypt from 'bcrypt'

const hashedPin = await bcrypt.hash(pin, 10)

// Verify PIN during login
const isValid = await bcrypt.compare(inputPin, storedPin)
```

## JWT Session Flow

### JWT Token Structure

```typescript
interface JWTPayload {
  id: string
  name: string
  email: string
  role: string
  cashbookIds: string[]
  iat: number
  exp: number
}
```

### Session Lifecycle

```
1. Login → JWT created → Cookie set
2. Request → Cookie sent → JWT validated → Session restored
3. Session expires → JWT invalid → Redirect to login
4. Logout → Cookie cleared → Session destroyed
```

### Session Configuration

```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // Update every 24 hours
}
```

### Cookie Configuration

```typescript
cookies: {
  sessionToken: {
    name: 'o-book-session',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
}
```

## Role Based Access Control

### Role Definitions

```typescript
enum Role {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  CEO = 'CEO',
  PARTNER = 'PARTNER',
}
```

### Permission Matrix

| Action | Admin | Accountant | CEO | Partner |
|--------|-------|------------|-----|---------|
| View All Transactions | ✅ | ✅ | ✅ | ✅ |
| Add Transactions | ✅ | ✅ | ✅ | ✅ |
| Edit Own Transactions | ✅ | ✅ | ✅ | ✅ |
| Edit Any Transaction | ✅ | ❌ | ❌ | ❌ |
| Delete Own Transactions | ✅ | ❌ | ❌ | ❌ |
| Delete Any Transaction | ✅ | ❌ | ❌ | ❌ |
| Upload Attachments | ✅ | ✅ | ❌ | ❌ |
| Add Comments | ✅ | ✅ | ✅ | ✅ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Cashbooks | ✅ | ❌ | ❌ | ❌ |
| Import Transactions | ✅ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ |
| Export Reports | ✅ | ✅ | ✅ | ✅ |
| Manage Categories | ✅ | ❌ | ❌ | ❌ |
| Manage Payment Methods | ✅ | ❌ | ❌ | ❌ |

### Permission Checker

```typescript
// packages/auth/lib/permissions.ts
import { Role } from '@o-book/types'

export const permissions = {
  [Role.ADMIN]: {
    canViewAllTransactions: true,
    canAddTransactions: true,
    canEditAnyTransaction: true,
    canDeleteAnyTransaction: true,
    canUploadAttachments: true,
    canAddComments: true,
    canViewAuditLogs: true,
    canManageUsers: true,
    canManageCashbooks: true,
    canImportTransactions: true,
    canViewReports: true,
    canExportReports: true,
    canManageCategories: true,
    canManagePaymentMethods: true,
  },
  [Role.ACCOUNTANT]: {
    canViewAllTransactions: true,
    canAddTransactions: true,
    canEditAnyTransaction: false,
    canDeleteAnyTransaction: false,
    canUploadAttachments: true,
    canAddComments: true,
    canViewAuditLogs: false,
    canManageUsers: false,
    canManageCashbooks: false,
    canImportTransactions: false,
    canViewReports: true,
    canExportReports: true,
    canManageCategories: false,
    canManagePaymentMethods: false,
  },
  [Role.CEO]: {
    canViewAllTransactions: true,
    canAddTransactions: true,
    canEditAnyTransaction: false,
    canDeleteAnyTransaction: false,
    canUploadAttachments: false,
    canAddComments: true,
    canViewAuditLogs: false,
    canManageUsers: false,
    canManageCashbooks: false,
    canImportTransactions: false,
    canViewReports: true,
    canExportReports: true,
    canManageCategories: false,
    canManagePaymentMethods: false,
  },
  [Role.PARTNER]: {
    canViewAllTransactions: true,
    canAddTransactions: true,
    canEditAnyTransaction: false,
    canDeleteAnyTransaction: false,
    canUploadAttachments: false,
    canAddComments: true,
    canViewAuditLogs: false,
    canManageUsers: false,
    canManageCashbooks: false,
    canImportTransactions: false,
    canViewReports: true,
    canExportReports: true,
    canManageCategories: false,
    canManagePaymentMethods: false,
  },
}

export function hasPermission(role: Role, permission: string): boolean {
  return permissions[role]?.[permission] ?? false
}
```

### Authorization Middleware

```typescript
// packages/auth/lib/authorization.ts
import { getServerSession } from 'next-auth'
import { Role } from '@o-book/types'
import { hasPermission } from './permissions'

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

export async function requirePermission(permission: string) {
  const session = await requireAuth()
  const role = session.user.role as Role

  if (!hasPermission(role, permission)) {
    throw new Error('FORBIDDEN')
  }

  return session
}

export async function requireRole(role: Role) {
  const session = await requireAuth()
  if (session.user.role !== role) {
    throw new Error('FORBIDDEN')
  }
  return session
}
```

### Route Protection

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
}
```

---

# 9. Transaction Architecture

## Transaction Lifecycle Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Transaction Lifecycle                      │
└─────────────────────────────────────────────────────────────┘

1. Creation
   ├── User fills transaction form
   ├── Client validates input
   ├── Server validates with Zod
   ├── Check permissions
   ├── Create transaction record
   ├── Calculate running balance
   ├── Create audit log
   └── Return transaction

2. Updates
   ├── User edits transaction
   ├── Client validates input
   ├── Server validates with Zod
   ├── Check permissions
   ├── Update transaction record
   ├── Recalculate running balance
   ├── Create audit log
   └── Return updated transaction

3. Comments
   ├── User adds comment
   ├── Validate comment content
   ├── Create comment record
   ├── Create audit log
   └── Return comment

4. Attachments
   ├── User uploads file
   ├── Validate file type and size
   ├── Store file
   ├── Create attachment record
   ├── Create audit log
   └── Return attachment

5. Deletion
   ├── Check permissions
   ├── Soft delete transaction
   ├── Recalculate running balance
   ├── Create audit log
   └── Return success
```

## Cash In Workflow

### Flow Diagram

```
User                      Client                    Server                  Database
 │                          │                          │                         │
 │ Fill Cash In Form        │                          │                         │
 │─────────────────────────>│                          │                         │
 │                          │ Validate Form            │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │                         │
 │                          │ POST /api/v1/transactions│                         │
 │                          │ { type: CASH_IN, ... }   │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │ Validate with Zod        │
 │                          │                          │ Check Permissions        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Transaction      │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Calculate Balance        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Audit Log        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │<─────────────────────────│                         │
 │                          │ { success: true, data }  │                         │
 │<─────────────────────────│                          │                         │
 │                          │                          │                         │
 │ View Transaction         │                          │                         │
 │─────────────────────────>│                          │                         │
```

### Implementation

```typescript
// packages/database/prisma/transactions/cash-in.service.ts
import { prisma } from '@o-book/database'
import { cashInSchema } from '@o-book/validators'

export async function createCashIn(data: CashInInput) {
  const validated = cashInSchema.parse(data)

  return await prisma.$transaction(async (tx) => {
    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        type: 'CASH_IN',
        cashbookId: validated.cashbookId,
        amount: validated.amount,
        currency: validated.currency,
        categoryId: validated.categoryId,
        paymentMethodId: validated.paymentMethodId,
        description: validated.description,
        date: validated.date,
        createdById: validated.createdById,
      },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        transactionId: transaction.id,
        userId: validated.createdById,
        action: 'CREATED',
        changes: {
          before: null,
          after: transaction,
        },
      },
    })

    return transaction
  })
}
```

## Cash Out Workflow

### Flow Diagram

```
User                      Client                    Server                  Database
 │                          │                          │                         │
 │ Fill Cash Out Form       │                          │                         │
 │─────────────────────────>│                          │                         │
 │                          │ Validate Form            │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │                         │
 │                          │ POST /api/v1/transactions│                         │
 │                          │ { type: CASH_OUT, ... }  │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │ Validate with Zod        │
 │                          │                          │ Check Permissions        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Transaction      │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Calculate Balance        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Audit Log        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │<─────────────────────────│                         │
 │                          │ { success: true, data }  │                         │
 │                          │                          │                         │
 │<─────────────────────────│                          │                         │
 │                          │                          │                         │
```

### Implementation

```typescript
// packages/database/prisma/transactions/cash-out.service.ts
import { prisma } from '@o-book/database'
import { cashOutSchema } from '@o-book/validators'

export async function createCashOut(data: CashOutInput) {
  const validated = cashOutSchema.parse(data)

  return await prisma.$transaction(async (tx) => {
    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        type: 'CASH_OUT',
        cashbookId: validated.cashbookId,
        amount: validated.amount,
        currency: validated.currency,
        categoryId: validated.categoryId,
        paymentMethodId: validated.paymentMethodId,
        description: validated.description,
        date: validated.date,
        createdById: validated.createdById,
      },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        transactionId: transaction.id,
        userId: validated.createdById,
        action: 'CREATED',
        changes: {
          before: null,
          after: transaction,
        },
      },
    })

    return transaction
  })
}
```

## Comment Workflow

### Flow Diagram

```
User                      Client                    Server                  Database
 │                          │                          │                         │
 │ Add Comment              │                          │                         │
 │─────────────────────────>│                          │                         │
 │                          │ Validate Comment         │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │                         │
 │                          │ POST /api/v1/transactions│                         │
 │                          │ /[id]/comments           │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │ Validate with Zod        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Comment          │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Audit Log        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │<─────────────────────────│                         │
 │                          │ { success: true, data }  │                         │
 │<─────────────────────────│                          │                         │
 │                          │                          │                         │
```

### Implementation

```typescript
// packages/database/prisma/transactions/comment.service.ts
import { prisma } from '@o-book/database'
import { commentSchema } from '@o-book/validators'

export async function addComment(data: CommentInput) {
  const validated = commentSchema.parse(data)

  return await prisma.$transaction(async (tx) => {
    // Create comment
    const comment = await tx.transactionComment.create({
      data: {
        transactionId: validated.transactionId,
        userId: validated.userId,
        content: validated.content,
      },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        transactionId: validated.transactionId,
        userId: validated.userId,
        action: 'COMMENT_ADDED',
        changes: {
          commentId: comment.id,
        },
      },
    })

    return comment
  })
}
```

## Attachment Workflow

### Flow Diagram

```
User                      Client                    Server                  Database
 │                          │                          │                         │
 │ Upload File              │                          │                         │
 │─────────────────────────>│                          │                         │
 │                          │ Validate File            │                         │
 │                          │ (type, size)             │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │                         │
 │                          │ Upload to Storage        │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │                         │
 │                          │ POST /api/v1/transactions│                         │
 │                          │ /[id]/attachments        │                         │
 │                          │─────────────────────────>│                         │
 │                          │                          │ Validate with Zod        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Attachment       │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │                          │ Create Audit Log        │
 │                          │                          │─────────────────────────>│
 │                          │                          │                         │
 │                          │<─────────────────────────│                         │
 │                          │ { success: true, data }  │                         │
 │<─────────────────────────│                          │                         │
 │                          │                          │                         │
```

### Implementation

```typescript
// packages/database/prisma/transactions/attachment.service.ts
import { prisma } from '@o-book/database'
import { uploadFile } from '@o-book/utils/storage'
import { attachmentSchema } from '@o-book/validators'

export async function addAttachment(
  transactionId: string,
  file: File,
  userId: string
) {
  // Upload file
  const { path, size } = await uploadFile(file)

  return await prisma.$transaction(async (tx) => {
    // Create attachment
    const attachment = await tx.transactionAttachment.create({
      data: {
        transactionId,
        fileName: file.name,
        filePath: path,
        fileSize: size,
        mimeType: file.type,
        uploadedById: userId,
      },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        transactionId,
        userId,
        action: 'ATTACHMENT_ADDED',
        changes: {
          attachmentId: attachment.id,
        },
      },
    })

    return attachment
  })
}
```

## Audit Workflow

### Audit Log Structure

```typescript
interface AuditLog {
  id: string
  transactionId: string
  userId: string
  action: AuditAction
  changes: {
    before?: Record<string, any>
    after?: Record<string, any>
  }
  createdAt: Date
}
```

### Audit Actions

```typescript
enum AuditAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
}
```

### Audit Log Creation

```typescript
// packages/database/prisma/transactions/audit.service.ts
import { prisma } from '@o-book/database'

export async function createAuditLog(data: AuditLogInput) {
  return await prisma.auditLog.create({
    data: {
      transactionId: data.transactionId,
      userId: data.userId,
      action: data.action,
      changes: data.changes,
    },
  })
}

export async function getTransactionAuditLog(transactionId: string) {
  return await prisma.auditLog.findMany({
    where: { transactionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
```

## Multi-Currency Workflow

### Currency Conversion

```typescript
// packages/utils/currency.ts
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  INR: 83.12,
  AED: 3.67,
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  if (from === to) return amount

  const fromRate = EXCHANGE_RATES[from]
  const toRate = EXCHANGE_RATES[to]

  if (!fromRate || !toRate) {
    throw new Error('Unsupported currency')
  }

  const amountInUSD = amount / fromRate
  return amountInUSD * toRate
}

export function formatCurrency(
  amount: number,
  currency: string
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
```

### Transaction Currency Handling

```typescript
// When creating a transaction with foreign currency
export async function createTransactionWithCurrency(data: TransactionInput) {
  const cashbook = await prisma.cashbook.findUnique({
    where: { id: data.cashbookId },
  })

  const baseCurrency = cashbook!.baseCurrency
  const amountInBaseCurrency = convertCurrency(
    data.amount,
    data.currency,
    baseCurrency
  )

  return await prisma.transaction.create({
    data: {
      ...data,
      // Store both original and converted amounts
      amount: data.amount,
      currency: data.currency,
      // Add metadata for converted amount
      metadata: {
        amountInBaseCurrency,
        baseCurrency,
      },
    },
  })
}
```

## Running Balance Workflow

### Balance Calculation

```typescript
// packages/database/prisma/transactions/balance.service.ts
import { prisma } from '@o-book/database'

export async function calculateRunningBalance(cashbookId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { cashbookId },
    orderBy: { date: 'asc' },
  })

  let runningBalance = 0

  const transactionsWithBalance = transactions.map((transaction) => {
    if (transaction.type === 'CASH_IN') {
      runningBalance += Number(transaction.amount)
    } else {
      runningBalance -= Number(transaction.amount)
    }

    return {
      ...transaction,
      runningBalance,
    }
  })

  return transactionsWithBalance
}

export async function getCashbookBalance(cashbookId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { cashbookId },
  })

  const cashIn = transactions
    .filter((t) => t.type === 'CASH_IN')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const cashOut = transactions
    .filter((t) => t.type === 'CASH_OUT')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    cashIn,
    cashOut,
    balance: cashIn - cashOut,
  }
}
```

### Balance Update Trigger

```typescript
// Update balance after transaction creation/update
export async function updateBalanceAfterTransaction(
  cashbookId: string
) {
  const balance = await getCashbookBalance(cashbookId)

  // Could store this in a separate CashbookBalance table
  // or calculate on-demand for simplicity

  return balance
}
```

---

# 10. Dashboard Architecture

## Dashboard Overview

The dashboard provides a comprehensive financial overview with real-time data, KPIs, and quick access to common actions.

## Dashboard Components

### Balance Cards

**Purpose:**
Display key financial metrics at a glance.

**Components:**
- Total Balance Card
- Cash In Card
- Cash Out Card
- Net Cash Flow Card

**Data Sources:**
- Transaction module (aggregated data)
- Cashbook module (cashbook selection)

**Implementation:**

```typescript
// modules/dashboard/components/BalanceCard.tsx
interface BalanceCardProps {
  title: string
  amount: number
  currency: string
  trend?: number
  icon: React.ReactNode
}

export function BalanceCard({ title, amount, currency, trend, icon }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(amount, currency)}
        </div>
        {trend !== undefined && (
          <p className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### Cash Flow Chart

**Purpose:**
Visualize cash flow over time.

**Components:**
- Line chart showing cash in/out trends
- Date range selector
- Currency toggle

**Data Sources:**
- Transaction module (time-series data)
- Report module (aggregated metrics)

**Implementation:**

```typescript
// modules/dashboard/components/CashFlowChart.tsx
export function CashFlowChart({ cashbookId, dateRange }: CashFlowChartProps) {
  const { data } = useCashFlowData(cashbookId, dateRange)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cashIn" stroke="#22c55e" name="Cash In" />
            <Line type="monotone" dataKey="cashOut" stroke="#ef4444" name="Cash Out" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### Recent Transactions Widget

**Purpose:**
Show recent transactions for quick reference.

**Components:**
- Transaction list (last 10 transactions)
- Transaction type indicator
- Quick action buttons (view, edit)
- Filter by type

**Data Sources:**
- Transaction module (recent transactions)

**Implementation:**

```typescript
// modules/dashboard/components/RecentTransactions.tsx
export function RecentTransactions({ cashbookId }: RecentTransactionsProps) {
  const { data: transactions } = useRecentTransactions(cashbookId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions?.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Activity Feed

**Purpose:**
Show recent user activities and system events.

**Components:**
- Activity list
- Activity type indicator
- User avatar
- Timestamp

**Data Sources:**
- Audit log module (activity data)
- User module (user info)

**Implementation:**

```typescript
// modules/dashboard/components/ActivityFeed.tsx
export function ActivityFeed({ cashbookId }: ActivityFeedProps) {
  const { data: activities } = useActivityFeed(cashbookId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Quick Transaction Entry

**Purpose:**
Enable fast transaction creation without leaving dashboard.

**Components:**
- Compact transaction form
- Type toggle (cash in/out)
- Category selector
- Amount input
- Submit button

**Data Sources:**
- Transaction module (creation)
- Settings module (categories, payment methods)

**Implementation:**

```typescript
// modules/dashboard/components/QuickEntry.tsx
export function QuickEntry({ cashbookId }: QuickEntryProps) {
  const form = useForm<QuickEntryForm>()
  const createMutation = useCreateTransaction()

  const onSubmit = (data: QuickEntryForm) => {
    createMutation.mutate({
      ...data,
      cashbookId,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleGroup type="single" {...field}>
                      <ToggleGroupItem value="CASH_IN">Cash In</ToggleGroupItem>
                      <ToggleGroupItem value="CASH_OUT">Cash Out</ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="number" placeholder="Amount" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Add Transaction
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

## KPI Indicators

### KPI Definitions

```typescript
interface KPI {
  id: string
  name: string
  value: number
  currency: string
  trend: number
  target?: number
  format: 'currency' | 'percentage' | 'number'
}

type KPIMetric =
  | 'totalBalance'
  | 'cashIn'
  | 'cashOut'
  | 'netCashFlow'
  | 'transactionCount'
  | 'averageTransaction'
```

### KPI Calculation Service

```typescript
// modules/dashboard/services/kpi.service.ts
export async function calculateKPIs(cashbookId: string, dateRange?: DateRange) {
  const transactions = await getTransactions({
    cashbookId,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  })

  const cashIn = transactions
    .filter((t) => t.type === 'CASH_IN')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const cashOut = transactions
    .filter((t) => t.type === 'CASH_OUT')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const previousPeriod = await getTransactions({
    cashbookId,
    startDate: dateRange?.startDate
      ? subDays(dateRange.startDate, 30)
      : undefined,
    endDate: dateRange?.startDate,
  })

  const previousCashIn = previousPeriod
    .filter((t) => t.type === 'CASH_IN')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const cashInTrend = previousCashIn > 0
    ? ((cashIn - previousCashIn) / previousCashIn) * 100
    : 0

  return {
    totalBalance: {
      value: cashIn - cashOut,
      currency: 'USD',
      trend: cashInTrend,
      format: 'currency',
    },
    cashIn: {
      value: cashIn,
      currency: 'USD',
      trend: cashInTrend,
      format: 'currency',
    },
    cashOut: {
      value: cashOut,
      currency: 'USD',
      trend: 0, // Calculate similarly
      format: 'currency',
    },
    transactionCount: {
      value: transactions.length,
      currency: '',
      trend: 0,
      format: 'number',
    },
  }
}
```

## User-Specific Views

### Role-Based Dashboard Views

**Admin Dashboard:**
- All cashbooks overview
- System-wide KPIs
- User activity summary
- Recent audit logs

**Accountant Dashboard:**
- Assigned cashbooks
- Transaction queue
- Pending approvals
- Category breakdown

**CEO Dashboard:**
- Executive summary
- High-level KPIs
- Trend analysis
- Quick reports

**Partner Dashboard:**
- Relevant cashbooks
- Transaction overview
- Balance summary
- Activity feed

### Personalization

```typescript
// modules/dashboard/services/personalization.service.ts
export async function getUserDashboardConfig(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      cashbooks: true,
    },
  })

  return {
    defaultCashbookId: user?.cashbooks[0]?.cashbookId,
    preferredCurrency: user?.preferredCurrency || 'USD',
    widgetOrder: user?.widgetOrder || ['balance', 'cashFlow', 'recentTransactions'],
    dateRange: user?.preferredDateRange || '30d',
  }
}
```

---

# 11. Reporting Architecture

## Report Overview

The reporting module provides comprehensive financial reports with flexible filtering, multiple export formats, and caching for performance.

## Report Types

### Cash Flow Report

**Purpose:**
Track money coming in and going out over time.

**Data Points:**
- Daily/weekly/monthly cash in
- Daily/weekly/monthly cash out
- Net cash flow
- Running balance
- Currency breakdown

**Filters:**
- Date range
- Cashbook
- Currency
- Category

**Implementation:**

```typescript
// modules/reports/services/cash-flow.service.ts
export async function generateCashFlowReport(params: CashFlowReportParams) {
  const transactions = await prisma.transaction.findMany({
    where: {
      cashbookId: params.cashbookId,
      date: {
        gte: params.startDate,
        lte: params.endDate,
      },
      ...(params.categoryId && { categoryId: params.categoryId }),
    },
    orderBy: { date: 'asc' },
  })

  // Group by date period
  const grouped = groupBy(transactions, (t) =>
    format(t.date, params.groupBy)
  )

  const report = Object.entries(grouped).map(([period, txs]) => {
    const cashIn = txs
      .filter((t) => t.type === 'CASH_IN')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const cashOut = txs
      .filter((t) => t.type === 'CASH_OUT')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      period,
      cashIn,
      cashOut,
      netFlow: cashIn - cashOut,
    }
  })

  return report
}
```

### Balance Report

**Purpose:**
Show balance history and current standing.

**Data Points:**
- Opening balance
- Closing balance
- Balance changes over time
- Currency breakdown
- Cashbook comparison

**Filters:**
- Date range
- Cashbook
- Currency

**Implementation:**

```typescript
// modules/reports/services/balance.service.ts
export async function generateBalanceReport(params: BalanceReportParams) {
  const transactions = await prisma.transaction.findMany({
    where: {
      cashbookId: params.cashbookId,
      date: {
        gte: params.startDate,
        lte: params.endDate,
      },
    },
    orderBy: { date: 'asc' },
  })

  let runningBalance = 0
  const balanceHistory = transactions.map((transaction) => {
    if (transaction.type === 'CASH_IN') {
      runningBalance += Number(transaction.amount)
    } else {
      runningBalance -= Number(transaction.amount)
    }

    return {
      date: transaction.date,
      balance: runningBalance,
      transaction: transaction,
    }
  })

  return {
    openingBalance: 0, // Calculate from before startDate
    closingBalance: runningBalance,
    history: balanceHistory,
  }
}
```

### Category Report

**Purpose:**
Analyze spending/income by category.

**Data Points:**
- Category breakdown
- Category trends
- Top categories
- Category comparison

**Filters:**
- Date range
- Cashbook
- Transaction type

**Implementation:**

```typescript
// modules/reports/services/category.service.ts
export async function generateCategoryReport(params: CategoryReportParams) {
  const transactions = await prisma.transaction.findMany({
    where: {
      cashbookId: params.cashbookId,
      date: {
        gte: params.startDate,
        lte: params.endDate,
      },
      ...(params.type && { type: params.type }),
    },
    include: {
      category: true,
    },
  })

  const grouped = groupBy(transactions, (t) => t.category.name)

  const report = Object.entries(grouped).map(([categoryName, txs]) => {
    const total = txs.reduce((sum, t) => sum + Number(t.amount), 0)
    const percentage = (total / getTotalAmount(transactions)) * 100

    return {
      category: categoryName,
      total,
      percentage,
      count: txs.length,
      color: txs[0].category.color,
    }
  })

  return report.sort((a, b) => b.total - a.total)
}
```

## Date Range Reports

### Date Range Options

```typescript
type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom'

function getDateRange(preset: DateRangePreset, customStart?: Date, customEnd?: Date) {
  const now = new Date()

  switch (preset) {
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now) }
    case 'last7days':
      return { startDate: subDays(now, 7), endDate: now }
    case 'last30days':
      return { startDate: subDays(now, 30), endDate: now }
    case 'thisMonth':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
    case 'custom':
      return { startDate: customStart, endDate: customEnd }
    default:
      return { startDate: startOfDay(now), endDate: endOfDay(now) }
  }
}
```

## Excel Export

### Excel Export Service

```typescript
// modules/reports/services/excel-export.service.ts
import ExcelJS from 'exceljs'

export async function exportToExcel(reportData: ReportData, type: ReportType) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Report')

  // Add headers
  worksheet.columns = getColumnsForReportType(type)

  // Add data
  reportData.forEach((row) => {
    worksheet.addRow(row)
  })

  // Style headers
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()

  return buffer
}
```

### Excel Export API

```typescript
// app/api/v1/reports/excel/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const reportData = await generateReport(body.type, body.params)
  const excelBuffer = await exportToExcel(reportData, body.type)

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${body.type}-${Date.now()}.xlsx"`,
    },
  })
}
```

## PDF Export

### PDF Export Service

```typescript
// modules/reports/services/pdf-export.service.ts
import { PDFDocument, rgb } from 'pdf-lib'

export async function exportToPDF(reportData: ReportData, type: ReportType) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])

  // Add title
  page.drawText(type, {
    x: 50,
    y: 750,
    size: 24,
    color: rgb(0, 0, 0),
  })

  // Add data table
  let y = 700
  reportData.forEach((row) => {
    page.drawText(JSON.stringify(row), {
      x: 50,
      y,
      size: 12,
      color: rgb(0, 0, 0),
    })
    y -= 20
  })

  const pdfBytes = await pdfDoc.save()

  return Buffer.from(pdfBytes)
}
```

## Report Caching

### Cache Strategy

```typescript
// modules/reports/services/cache.service.ts
import { redis } from '@o-book/utils/redis'

export async function getCachedReport(cacheKey: string) {
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  return null
}

export async function cacheReport(cacheKey: string, data: any, ttl: number = 3600) {
  await redis.set(cacheKey, JSON.stringify(data), 'EX', ttl)
}

export function generateCacheKey(type: string, params: any): string {
  return `report:${type}:${hashParams(params)}`
}
```

### Cached Report Generation

```typescript
export async function generateReportWithCache(type: ReportType, params: ReportParams) {
  const cacheKey = generateCacheKey(type, params)

  // Try cache first
  const cached = await getCachedReport(cacheKey)
  if (cached) {
    return cached
  }

  // Generate report
  const report = await generateReport(type, params)

  // Cache result
  await cacheReport(cacheKey, report, 1800) // 30 minutes

  return report
}
```

## Data Flow

```
User Request
    │
    ▼
Validate Parameters
    │
    ▼
Check Cache
    │
    ├── Hit → Return Cached Data
    │
    └── Miss → Generate Report
                  │
                  ▼
              Query Database
                  │
                  ▼
              Process Data
                  │
                  ▼
              Cache Result
                  │
                  ▼
              Return Data
```

---

# 12. Security Architecture

## Authentication Security

### PIN Security

**Storage:**
- PINs hashed with bcrypt (10 rounds)
- Never stored in plain text
- Salt included in hash

**Validation:**
- Rate limited (5 attempts per minute)
- Account lockout after 10 failed attempts
- Never logged in error messages

**Transmission:**
- Always sent over HTTPS
- Included in request body (not URL)
- Never exposed in client-side logs

### Session Security

**JWT Configuration:**
- Strong secret key (256-bit)
- Short expiration (30 days for internal tool)
- Secure HTTP-only cookies
- SameSite=lax to prevent CSRF

**Cookie Security:**
```typescript
cookies: {
  sessionToken: {
    name: 'o-book-session',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },
}
```

### Password/PIN Policy

**PIN Requirements:**
- Exactly 4 digits
- Numeric only
- No sequential patterns (1234, 4321)
- No repeated patterns (1111, 2222)

**Validation:**
```typescript
function validatePIN(pin: string): boolean {
  // Length check
  if (pin.length !== 4) return false

  // Numeric check
  if (!/^\d+$/.test(pin)) return false

  // Sequential pattern check
  if (isSequential(pin)) return false

  // Repeated pattern check
  if (isRepeated(pin)) return false

  return true
}
```

## Authorization Security

### Role-Based Access Control

**Implementation:**
- Server-side permission checks on every API
- Client-side UI adjustments (not security)
- Permission checks at domain boundaries

**API Middleware:**
```typescript
export async function requirePermission(permission: string) {
  const session = await getServerSession()
  if (!session) {
    throw new AuthorizationError('UNAUTHORIZED')
  }

  const role = session.user.role as Role
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError('FORBIDDEN')
  }

  return session
}
```

### Resource-Level Authorization

**Transaction Access:**
- Users can only access transactions from their assigned cashbooks
- Admin can access all transactions
- Edit/delete restricted by role

**Implementation:**
```typescript
export async function requireTransactionAccess(transactionId: string) {
  const session = await requireAuth()
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { cashbook: true },
  })

  if (!transaction) {
    throw new NotFoundError('Transaction not found')
  }

  // Check if user has access to cashbook
  const hasAccess = await prisma.userCashbook.findUnique({
    where: {
      userId_cashbookId: {
        userId: session.user.id,
        cashbookId: transaction.cashbookId,
      },
    },
  })

  if (!hasAccess && session.user.role !== Role.ADMIN) {
    throw new AuthorizationError('FORBIDDEN')
  }

  return transaction
}
```

## Input Validation

### Zod Schema Validation

**All API Inputs:**
- Validated with Zod schemas
- Type-safe validation
- Clear error messages

**Example:**
```typescript
const transactionSchema = z.object({
  cashbookId: z.string().cuid(),
  type: z.enum(['CASH_IN', 'CASH_OUT']),
  amount: z.number().positive().max(1000000000),
  currency: z.string().length(3),
  categoryId: z.string().cuid(),
  paymentMethodId: z.string().cuid(),
  description: z.string().max(500).optional(),
  date: z.coerce.date(),
})
```

### SQL Injection Prevention

**Prisma ORM:**
- All queries parameterized
- No raw SQL unless absolutely necessary
- Input sanitization built-in

**Policy:**
- Never use raw SQL with user input
- Always use Prisma query builder
- Validate all inputs before database operations

## File Upload Security

### File Validation

**Allowed Types:**
- Images: jpg, jpeg, png, gif, webp
- Documents: pdf, doc, docx, xls, xlsx
- Max size: 10MB

**Validation:**
```typescript
function validateFile(file: File): void {
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('Invalid file type')
  }

  // Check file size
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new ValidationError('File too large')
  }

  // Check file extension matches type
  const extension = file.name.split('.').pop()?.toLowerCase()
  const expectedExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'application/pdf': ['pdf'],
    // ... etc
  }

  const expected = expectedExtensions[file.type]
  if (expected && !expected.includes(extension!)) {
    throw new ValidationError('File extension does not match type')
  }
}
```

### File Storage Security

**Storage Strategy:**
- Files stored outside web root
- Random filenames (UUID)
- No execution permissions
- Virus scanning (optional for internal tool)

**Implementation:**
```typescript
export async function uploadFile(file: File): Promise<{ path: string; size: number }> {
  // Validate file
  validateFile(file)

  // Generate random filename
  const extension = file.name.split('.').pop()
  const filename = `${uuidv4()}.${extension}`

  // Store in secure location
  const storagePath = path.join(process.env.STORAGE_PATH, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(storagePath, buffer)

  return {
    path: storagePath,
    size: file.size,
  }
}
```

## API Protection

### Rate Limiting

**Implementation:**
- Per-user rate limits
- Per-endpoint limits
- Sliding window algorithm

**Example:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1m'),
})

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier)
  if (!success) {
    throw new RateLimitError('Too many requests')
  }
}
```

### CORS Configuration

**Internal Tool:**
- Restrict to allowed origins
- No wildcard origins
- Credentials not allowed (cookies used)

**Configuration:**
```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}
```

### Request Size Limits

**Configuration:**
```javascript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
```

## Audit Requirements

### Audit Log Requirements

**What to Audit:**
- All transaction CRUD operations
- Comment additions
- Attachment uploads
- User management changes
- Cashbook management changes
- Failed authentication attempts
- Permission denials

**Audit Log Structure:**
```typescript
interface AuditLog {
  id: string
  transactionId?: string
  userId: string
  action: AuditAction
  changes: {
    before?: any
    after?: any
  }
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}
```

### Audit Log Retention

**Policy:**
- Keep audit logs for 7 years (financial requirement)
- Archive old logs to cold storage
- Provide audit log export for compliance

### Audit Log Query

**Implementation:**
```typescript
export async function getAuditLogs(filters: AuditLogFilters) {
  return await prisma.auditLog.findMany({
    where: {
      ...(filters.transactionId && { transactionId: filters.transactionId }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
```

## Environment Security

### Environment Variables

**Required Variables:**
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
STORAGE_PATH=/secure/storage/path
ALLOWED_ORIGINS=https://your-domain.com
```

**Security Rules:**
- Never commit .env files
- Use strong secrets (256-bit)
- Rotate secrets regularly
- Use different secrets per environment

### Secrets Management

**Development:**
- .env.local file (gitignored)
- Documented in .env.example

**Production:**
- Environment-specific secrets
- Secret management service (AWS Secrets Manager, etc.)
- Encrypted at rest

---

# 13. Scalability Architecture

## Future Mobile App Support

### API-First Design

**Current Architecture:**
- All business logic in API routes
- Frontend is just a consumer
- No frontend-specific logic in backend

**Mobile App Readiness:**
- Same APIs can be consumed by mobile app
- JWT authentication works across platforms
- RESTful design easy to implement on mobile

### Mobile-Specific Considerations

**API Optimization:**
- Add pagination to all list endpoints
- Add field selection (sparse fieldsets)
- Add mobile-specific endpoints if needed

**Example:**
```typescript
// Mobile-optimized endpoint
GET /api/v1/transactions?fields=id,amount,date&limit=20&offset=0
```

### Offline Support (Future)

**Strategy:**
- Use service workers for caching
- Implement sync queue for offline changes
- Conflict resolution strategy

## Future Accounting Features

### Extensible Transaction Types

**Current:**
- Cash In
- Cash Out

**Future:**
- Transfers (between cashbooks)
- Recurring transactions
- Scheduled payments
- Multi-split transactions

**Implementation:**
```typescript
enum TransactionType {
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
  TRANSFER = 'TRANSFER', // Future
  RECURRING = 'RECURRING', // Future
}
```

### Advanced Reporting

**Future Reports:**
- Profit & Loss statement
- Balance sheet
- Trial balance
- Budget vs Actual
- Forecasting

**Implementation:**
- Add new report services
- Reuse existing data access patterns
- Maintain same export formats

### Budgeting Module (Future)

**Architecture:**
```
Budget Module
├── Budget Creation
├── Budget Allocation
├── Budget Tracking
├── Budget Alerts
└── Budget Reports
```

**Integration:**
- Links to Transaction module
- Links to Category module
- Links to Report module

## Future Integrations

### Banking Integration

**Architecture:**
```
Banking Module
├── Bank Connections
├── Transaction Sync
├── Account Reconciliation
└── Bank Feed Processing
```

**Implementation:**
- Add BankAccount entity
- Add BankTransaction entity
- Sync service to pull bank data
- Reconciliation service to match transactions

### Payment Gateway Integration

**Architecture:**
```
Payment Module
├── Payment Processing
├── Payment Tracking
├── Refund Handling
└── Payment Reports
```

**Implementation:**
- Add Payment entity
- Add PaymentGateway entity
- Integration with Stripe/PayPal
- Webhook handling

### Accounting Software Integration

**Target Systems:**
- QuickBooks
- Xero
- Sage

**Implementation:**
- Add Integration entity
- Add SyncLog entity
- Mapping service for data transformation
- Sync service for data transfer

## Future Notification System

### Notification Types

**Real-time Notifications:**
- New comments on transactions
- Attachment uploads
- Approval requests
- Budget alerts

**Email Notifications:**
- Daily/weekly summaries
- Report generation complete
- System alerts

**Push Notifications:**
- Mobile app notifications
- Browser notifications

### Notification Architecture

```
Notification Module
├── Notification Channels
│   ├── In-App
│   ├── Email
│   ├── Push
│   └── SMS
├── Notification Templates
├── Notification Queue
└── Notification Preferences
```

### Implementation

**Database Schema (Future):**
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        NotificationType
  title       String
  body        String
  data        Json?
  read        Boolean  @default(false)
  channels    String[]
  createdAt   DateTime @default(now())
}

model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  channel     NotificationChannel
  enabled     Boolean  @default(true)
}
```

## Database Scalability

### Current Architecture

**Single Database:**
- PostgreSQL 15+
- Connection pooling
- Read replicas (future)

### Future Scaling

**Read Replicas:**
- Add read replicas for reporting
- Direct read queries to replicas
- Write queries go to primary

**Implementation:**
```typescript
// Prisma with read replicas
const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_URL },
  },
})

const prismaWrite = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_WRITE_URL },
  },
})
```

**Database Sharding (Future):**
- Shard by cashbook if needed
- Shard by date range for historical data
- Use Citus for PostgreSQL sharding

## Performance Optimization

### Caching Strategy

**Current:**
- Report caching (Redis)
- Session caching (JWT in cookie)

**Future:**
- Query result caching
- API response caching
- Page fragment caching

### Database Indexing

**Current:**
- Foreign key indexes
- Frequently queried fields indexed

**Future:**
- Composite indexes for complex queries
- Partial indexes for filtered queries
- Covering indexes for performance-critical queries

### Query Optimization

**Strategies:**
- Use Prisma's query optimization
- Avoid N+1 queries with include/select
- Use database views for complex aggregations
- Materialized views for heavy reports

## Horizontal Scaling

### Application Scaling

**Current:**
- Single Next.js application
- Can scale horizontally (stateless)

**Future:**
- Load balancer
- Multiple application instances
- Container orchestration (Kubernetes)

### Implementation

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: o-book
spec:
  replicas: 3
  selector:
    matchLabels:
      app: o-book
  template:
    metadata:
      labels:
        app: o-book
    spec:
      containers:
      - name: o-book
        image: o-book:latest
        ports:
        - containerPort: 3000
```

## Microservices Migration Path

**Current: Modular Monolith**

**Future: Microservices (if needed)**

**Migration Strategy:**
1. Identify bounded contexts
2. Extract one service at a time
3. Use API gateway for routing
4. Implement service discovery
5. Add distributed tracing

**Potential Services:**
- Authentication Service
- Transaction Service
- Report Service
- Notification Service

---

# 14. Development Guidelines

## Naming Conventions

### File Naming

**Components:**
- PascalCase: `TransactionList.tsx`, `BalanceCard.tsx`
- Test files: `TransactionList.test.tsx`

**Utilities:**
- camelCase: `formatCurrency.ts`, `calculateBalance.ts`
- Test files: `formatCurrency.test.ts`

**Types:**
- camelCase: `transaction.types.ts`, `user.types.ts`

**Hooks:**
- camelCase with `use` prefix: `useTransactions.ts`, `useAuth.ts`

**Services:**
- camelCase with `.service` suffix: `transaction.service.ts`

### Variable Naming

**Constants:**
- UPPER_SNAKE_CASE: `MAX_FILE_SIZE`, `DEFAULT_CURRENCY`

**Variables:**
- camelCase: `transactionId`, `cashbookBalance`

**Functions:**
- camelCase: `createTransaction`, `calculateBalance`

**Classes:**
- PascalCase: `TransactionService`, `BalanceCalculator`

**Interfaces/Types:**
- PascalCase: `Transaction`, `Cashbook`, `User`

### Database Naming

**Tables:**
- PascalCase: `User`, `Transaction`, `Cashbook`

**Columns:**
- camelCase: `createdAt`, `paymentMethodId`

**Foreign Keys:**
- `{entity}Id` pattern: `userId`, `cashbookId`, `categoryId`

**Enums:**
- PascalCase: `TransactionType`, `Role`, `AuditAction`

## Folder Conventions

### Module Structure

```
modules/
├── {module-name}/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── index.ts          # Module exports
```

### Component Structure

```
components/
├── {ComponentName}/
│   ├── {ComponentName}.tsx
│   ├── {ComponentName}.test.tsx
│   ├── index.ts
│   └── types.ts          # If complex
```

### API Route Structure

```
app/api/v1/
├── {resource}/
│   ├── route.ts          # List/Create
│   ├── [id]/
│   │   └── route.ts      # Read/Update/Delete
│   └── {sub-resource}/
│       └── route.ts
```

## API Conventions

### Route Naming

**Collections:**
- Plural nouns: `/transactions`, `/users`, `/cashbooks`

**Single Resources:**
- Use ID parameter: `/transactions/[id]`

**Nested Resources:**
- Use nested routes: `/transactions/[id]/comments`

**Actions:**
- Use descriptive names: `/imports/validate`

### HTTP Methods

**Standard CRUD:**
- GET: Read resource(s)
- POST: Create resource
- PUT: Update resource (full)
- PATCH: Update resource (partial)
- DELETE: Delete resource

**Custom Actions:**
- POST for actions that change state
- GET for queries

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Operation failed",
  "error": "ERROR_CODE"
}
```

### Status Codes

- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Prisma Conventions

### Model Naming

**Models:**
- PascalCase: `User`, `Transaction`, `Cashbook`

**Fields:**
- camelCase: `createdAt`, `paymentMethodId`

### Relationships

**One-to-Many:**
```prisma
model User {
  id           String       @id @default(cuid())
  transactions Transaction[]
}

model Transaction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
```

**Many-to-Many:**
```prisma
model User {
  id        String       @id @default(cuid())
  cashbooks UserCashbook[]
}

model Cashbook {
  id        String       @id @default(cuid())
  users     UserCashbook[]
}

model UserCashbook {
  id        String   @id @default(cuid())
  userId    String
  cashbookId String
  user      User     @relation(fields: [userId], references: [id])
  cashbook  Cashbook @relation(fields: [cashbookId], references: [id])

  @@unique([userId, cashbookId])
}
```

### Indexes

**Single Field:**
```prisma
@@index([fieldName])
```

**Composite:**
```prisma
@@index([field1, field2])
```

**Unique:**
```prisma
@@unique([field1, field2])
```

### Default Values

**IDs:**
```prisma
id String @id @default(cuid())
```

**Timestamps:**
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

## TypeScript Conventions

### Type Definitions

**Interfaces vs Types:**
- Use `interface` for object shapes that might be extended
- Use `type` for unions, primitives, and utility types

**Example:**
```typescript
// Interface
interface Transaction {
  id: string
  amount: number
  createdAt: Date
}

// Type
type TransactionType = 'CASH_IN' | 'CASH_OUT'
type TransactionWithUser = Transaction & { user: User }
```

### Strict Mode

**Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Imports

**Prefer type imports:**
```typescript
import type { Transaction } from './types'
import { createTransaction } from './services'
```

### Generic Types

**Naming:**
- Use descriptive names: `TTransaction`, `TUser`
- Use single letter for simple generics: `T`, `K`, `V`

## Component Conventions

### Component Structure

**Functional Components:**
```typescript
interface Props {
  title: string
  data: Transaction[]
}

export function TransactionList({ title, data }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      {/* ... */}
    </div>
  )
}
```

### Props Definition

**Interface for Props:**
```typescript
interface Props {
  // Required props
  id: string
  title: string

  // Optional props
  subtitle?: string
  disabled?: boolean

  // Callbacks
  onClick?: () => void
  onChange?: (value: string) => void
}
```

### Hooks Usage

**Custom Hooks:**
```typescript
// hooks/useTransactions.ts
export function useTransactions(filters?: TransactionFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
  })

  return { transactions: data, isLoading, error }
}
```

**Built-in Hooks:**
- Use `useState` for local component state
- Use `useEffect` for side effects
- Use `useCallback` for memoized callbacks
- Use `useMemo` for memoized values

### Server vs Client Components

**Server Components (Default):**
- No interactivity needed
- Data fetching on server
- Better performance

**Client Components:**
- Need interactivity (onClick, onChange)
- Use browser APIs
- Use state hooks

**Example:**
```typescript
// Server Component
export default function TransactionList() {
  const transactions = await getTransactions()
  return <div>{/* ... */}</div>
}

// Client Component
'use client'
export function TransactionForm() {
  const [value, setValue] = useState('')
  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

## Code Style

### General Rules

**Indentation:**
- 2 spaces for TypeScript/JavaScript
- 4 spaces for Prisma schema

**Line Length:**
- Max 100 characters (soft limit)
- 120 characters (hard limit)

**Blank Lines:**
- One blank line between functions
- Two blank lines between major sections

**Imports:**
- Group imports: external, internal, types
- Alphabetical within groups

**Example:**
```typescript
import { z } from 'zod'
import { NextResponse } from 'next/server'

import { prisma } from '@o-book/database'
import { requireAuth } from '@o-book/auth'

import type { Transaction } from './types'
```

### Comments

**When to Comment:**
- Explain "why", not "what"
- Complex business logic
- Non-obvious implementations
- Public API documentation

**JSDoc for Functions:**
```typescript
/**
 * Creates a new transaction with audit logging
 * @param data - Transaction data
 * @returns Created transaction
 * @throws ValidationError if validation fails
 */
export async function createTransaction(data: TransactionInput) {
  // ...
}
```

### Error Handling

**Always Handle Errors:**
```typescript
try {
  const result = await someOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Operation failed')
}
```

**Specific Error Types:**
```typescript
if (error instanceof ValidationError) {
  // Handle validation error
} else if (error instanceof AuthorizationError) {
  // Handle auth error
} else {
  // Handle unexpected error
}
```

## Testing Conventions

### Unit Tests

**Naming:**
- File: `{Component}.test.tsx` or `{service}.test.ts`
- Test: `describe {Component}`, `it {should do something}`

**Example:**
```typescript
describe('TransactionService', () => {
  it('should create a transaction', async () => {
    const result = await createTransaction(mockData)
    expect(result).toHaveProperty('id')
  })
})
```

### Integration Tests

**API Tests:**
```typescript
describe('POST /api/v1/transactions', () => {
  it('should create a transaction', async () => {
    const response = await fetch('/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify(mockData),
    })
    expect(response.status).toBe(201)
  })
})
```

### E2E Tests

**Playwright:**
```typescript
test('user can create a transaction', async ({ page }) => {
  await page.goto('/transactions/cash-in/new')
  await page.fill('[name="amount"]', '100')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/transactions')
})
```

## Git Conventions

### Branch Naming

**Feature Branches:**
- `feature/{feature-name}`
- Example: `feature/transaction-comments`

**Bugfix Branches:**
- `fix/{bug-description}`
- Example: `fix/balance-calculation-error`

**Hotfix Branches:**
- `hotfix/{hotfix-description}`
- Example: `hotfix/security-patch`

### Commit Messages

**Format:**
```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Example:**
```
feat(transactions): add comment support

- Add comment model
- Add comment API endpoints
- Add comment UI components

Closes #123
```

---

# Conclusion

This architecture document provides a comprehensive blueprint for building O Book as a production-ready, enterprise-grade financial management platform. The architecture follows Domain-Driven Design principles, implements a Modular Monolith pattern, and is designed for scalability, maintainability, and developer experience.

Key architectural decisions:

1. **Modular Monolith**: Provides clear boundaries without operational complexity
2. **Domain-Driven Design**: Aligns technical structure with business domains
3. **Transaction-Centric**: Comments, attachments, and audit logs belong to transactions
4. **API-First**: Enables future mobile app and integrations
5. **Security-First**: Comprehensive authentication, authorization, and audit logging
6. **Performance-Optimized**: Caching, indexing, and query optimization
7. **Scalable**: Clear migration path to microservices if needed

This architecture serves as the single source of truth for all development decisions and should be referenced throughout the development lifecycle.
