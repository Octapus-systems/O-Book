---
trigger: always_on
---

# ------------------------------------------------------------

# PROJECT OVERVIEW

# ------------------------------------------------------------

O Book is an internal bookkeeping and financial management platform built for Octapus.

The platform is used to manage:

* Cash In
* Cash Out
* Transaction History
* Multi-Currency Balances
* Attachments
* Transaction Comments
* Audit Logs
* Excel Imports
* Financial Reports

This application is for internal company use only.

The system prioritizes:

* Transparency
* Accountability
* Financial Accuracy
* Auditability
* Simplicity

# ------------------------------------------------------------

# TECH STACK

# ------------------------------------------------------------

* Monorepo Tool      : Turborepo
* Frontend          : Next.js 15 (App Router)
* Backend           : Next.js API Routes (Node.js Runtime)
* Database          : PostgreSQL
* ORM               : Prisma ORM
* Language          : TypeScript (Strict Mode)
* Styling           : Tailwind CSS
* UI Components     : Shadcn/UI
* Authentication    : NextAuth.js
* State Management  : Zustand
* Server State      : TanStack Query
* Form Handling     : React Hook Form + Zod
* Excel Processing  : ExcelJS + XLSX

# ------------------------------------------------------------

# USER ROLES

# ------------------------------------------------------------

Admin

* Full Access
* Manage Users
* Manage Cashbooks
* Import Transactions
* Edit/Delete Any Transaction
* View Audit Logs

Accountant

* View All Transactions
* Add Transactions
* Upload Attachments
* Add Comments

CEO

* View All Transactions
* Add Transactions
* Add Comments

Partner

* View All Transactions
* Add Transactions
* Add Comments

# ------------------------------------------------------------

# ARCHITECTURE RULES

# ------------------------------------------------------------

* Use Modular Monolith Architecture
* Keep features grouped by business domain
* Never create separate modules for comments or attachments
* Comments belong inside Transactions
* Attachments belong inside Transactions
* Audit history belongs inside Transactions
* Currency handling belongs inside Transactions

Correct Structure:

Transaction Module
├── Cash In
├── Cash Out
├── Comments
├── Attachments
├── Audit Logs
├── Currency Handling
├── Categories
└── Filters

# ------------------------------------------------------------

# CORE MODULES

# ------------------------------------------------------------

Authentication Module
User Module
Dashboard Module
Cashbook Module
Transaction Module
Import Module
Report Module
Settings Module

# ------------------------------------------------------------

# DATABASE RULES

# ------------------------------------------------------------

Use PostgreSQL with Prisma ORM.

Primary Models:

* User
* Role
* Cashbook
* Transaction
* TransactionComment
* TransactionAttachment
* Category
* PaymentMethod
* AuditLog

Never create unnecessary tables.

Comments must always belong to a transaction.

Attachments must always belong to a transaction.

Audit logs must always reference the related transaction.

# ------------------------------------------------------------

# API RULES

# ------------------------------------------------------------

All APIs must live inside:

app/api/v1/

Always version APIs.

Valid methods:

GET
POST
PUT
PATCH
DELETE

Success Response:

{
"success": true,
"message": "Operation successful",
"data": {}
}

Error Response:

{
"success": false,
"message": "Operation failed",
"error": "ERROR_CODE"
}

Always:

* Validate input using Zod
* Use try/catch
* Check permissions
* Return typed responses

# ------------------------------------------------------------

# AUTHENTICATION RULES

# ------------------------------------------------------------

Use NextAuth.js.

Login Method:

* 4 Digit PIN

Session Strategy:

* JWT

Never use social login providers.

Protect all routes.

# ------------------------------------------------------------

# UI RULES

# ------------------------------------------------------------

Design Style:

* Modern
* Premium
* Professional
* Clean
* Financial Dashboard Style

Dashboard should resemble modern accounting software.

Prioritize:

* Balance visibility
* Quick transaction entry
* Financial reporting
* Mobile responsiveness

# ------------------------------------------------------------

# CODING STANDARDS

# ------------------------------------------------------------

* TypeScript Strict Mode
* No any types
* Use async/await
* Use Prisma ORM only
* Use React Server Components where possible
* Use Server Actions when appropriate
* Never hardcode values
* Use environment variables
* Keep functions small and reusable

# ------------------------------------------------------------

# THINGS TO NEVER DO

# ------------------------------------------------------------

* Never use MongoDB
* Never use Mongoose
* Never create separate Comment Modules
* Never create separate Attachment Modules
* Never skip validation
* Never expose sensitive data
* Never bypass role checks
* Never use raw SQL when Prisma can handle it
* Never create APIs outside /api/v1

# ------------------------------------------------------------

# PRODUCT PHILOSOPHY

# ------------------------------------------------------------

O Book should feel like a premium internal version of CashBook.

Focus on:

* Fast transaction management
* Clear financial visibility
* Strong audit trail
* Team collaboration through transaction comments
* Simplicity over unnecessary complexity
* Scalability for future accounting features
