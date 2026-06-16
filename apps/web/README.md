# O Book Web Application

Internal bookkeeping and financial management platform for Octapus.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run the development server:
```bash
npm run dev
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css       # Global styles
│   │   └── login/            # Login page
│   │       └── page.tsx
│   ├── lib/                   # Utility functions
│   │   └── utils.ts
│   └── modules/               # Feature modules
│       └── authentication/    # Authentication module
│           ├── components/    # Auth components
│           │   ├── Button.tsx
│           │   ├── Checkbox.tsx
│           │   ├── LoginForm.tsx
│           │   ├── LoginCard.tsx
│           │   └── PINInput.tsx
│           ├── types/         # TypeScript types
│           │   └── auth.types.ts
│           └── validators/    # Zod schemas
│               └── auth.validator.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React
- **State Management**: Zustand
- **Server State**: TanStack Query
- **Authentication**: NextAuth.js (planned)

## Features

- 4-digit PIN authentication
- Glass-morphism design
- Fully responsive layout
- Form validation with Zod
- Auto-tabbing PIN input
- Loading states and animations
- Modern, premium financial dashboard style

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Coding Standards

- TypeScript Strict Mode enabled
- No `any` types
- Use async/await
- Keep functions small and reusable
- Follow the project architecture rules

## Authentication Module

The authentication module handles user login via 4-digit PIN:

### Components

- **PINInput**: 4-digit PIN input with auto-tabbing
- **Checkbox**: Custom checkbox component
- **Button**: Reusable button with loading states
- **LoginForm**: Login form with validation
- **LoginCard**: Complete login card with header

### Validation

Uses Zod for form validation:
- PIN must be exactly 4 digits
- PIN must contain only numbers

## Responsive Design

The login page is fully responsive across:
- Mobile devices (< 640px)
- Tablets (640px - 1024px)
- Laptops (1024px - 1280px)
- Desktop screens (> 1280px)

## Design System

### Colors

Custom color palette based on Material Design 3:
- Primary: #5427e6
- Secondary: #613ed3
- Tertiary: #5f44a1
- Surface: #fcf9f8
- Error: #ba1a1a

### Typography

Font: Geist (Google Fonts)
- Headline LG: 32px
- Title MD: 20px
- Body LG: 16px
- Body MD: 14px
- Label SM: 12px

### Components

Glass-morphism panels with backdrop blur, custom border radius (squircle), and subtle shadows.
