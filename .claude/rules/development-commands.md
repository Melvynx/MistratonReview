# Development Commands

## Core Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application
- `pnpm start` - Start production server
- `pnpm ts` - Run TypeScript type checking
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm lint:ci` - Run ESLint without auto-fix for CI
- `pnpm clean` - Run lint, type check, and format code
- `pnpm format` - Format code with Prettier

## Testing Commands

**CRITICAL - ALWAYS use CI commands for testing (non-interactive mode):**

- **ALWAYS run `pnpm test:ci`** - Run unit tests in CI mode (located in `__tests__/`)
- **ALWAYS run `pnpm test:e2e:ci`** - Run e2e tests in CI mode (headless) (located in `e2e/`)

**NEVER run these interactive commands:**

- **NEVER** `pnpm test` - Interactive mode (not compatible with Claude Code)
- **NEVER** `pnpm test:e2e` - Interactive mode (not compatible with Claude Code)

## Database Commands

- `pnpm prisma:seed` - Seed the database
- `pnpm better-auth:migrate` - Generate better-auth Prisma schema

## Development Tools

- `pnpm email` - Email development server
- `pnpm stripe-webhooks` - Listen for Stripe webhooks
- `pnpm knip` - Run knip for unused code detection
