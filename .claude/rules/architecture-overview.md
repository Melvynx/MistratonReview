# Architecture Overview

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with organization support
- **Forms**: TanStack Form with Zod validation (~~React Hook Form~~ deprecated)
- **Email**: React Email with Resend
- **Payments**: Stripe integration
- **Testing**: Vitest for unit tests, Playwright for e2e
- **Package Manager**: pnpm

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `src/components/` - UI components (Shadcn/UI in `ui/`, custom in `nowts/`)
- `src/features/` - Feature-specific components and logic
- `src/lib/` - Utilities, configurations, and services
- `src/hooks/` - Custom React hooks
- `emails/` - Email templates using React Email
- `prisma/` - Database schema and migrations
- `e2e/` - End-to-end tests
- `__tests__/` - Unit tests

## Key Features

- **Multi-tenant Organizations**: Full organization management with roles and permissions
- **Authentication**: Email/password, magic links, OAuth (GitHub, Google)
- **Billing**: Stripe subscriptions with plan management
- **Dialog System**: Global dialog manager for modals and confirmations
- **Forms**: TanStack Form with Zod validation and server actions
- **Email System**: Transactional emails with React Email
