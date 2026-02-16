# Code Conventions

## TypeScript

- Use `type` over `interface` (enforced by ESLint)
- Prefer functional components with TypeScript types
- No enums - use maps instead
- Strict TypeScript configuration
- Prefer using `??` than `||`

## React/Next.js

- Prefer React Server Components over client components
- Use `"use client"` only for Web API access in small components
- Wrap client components in `Suspense` with fallback
- Use dynamic loading for non-critical components
- **ALWAYS use the global `PageProps<"/route/path">` type for page components** - NEVER create local `PageProps` type definitions
  - Example: `export default async function MyPage(props: PageProps<"/admin/users">) {}`

## Styling

- Mobile-first approach with TailwindCSS
- Use Shadcn/UI components from `src/components/ui/`
- Custom components in `src/components/nowts/`
- Use the shared typography components in `@/components/nowts/typography.tsx` for paragraphs and headings (instead of creating custom `p`, `h1`, `h2`, etc.)
- For spacing, prefer utility layouts like `flex flex-col gap-4` for vertical spacing and `flex gap-4` for horizontal spacing (instead of `space-y-4`)
- Prefer the card container `@/components/ui/card.tsx` for styled wrappers rather than adding custom styles directly to `<div>` elements

## State Management

- Use `nuqs` for URL search parameter state
- Zustand for global state (see dialog-store.ts)
- TanStack Query for server state

## Forms and Server Actions

**CRITICAL**: Use TanStack Form for ALL forms - ~~React Hook Form~~ is deprecated

- See `.claude/rules/tanstack-form.md` for detailed patterns
- Server actions in `.action.ts` files
- Use `resolveActionResult` helper for mutations

## Authentication

- See `.claude/rules/authentication.md` for detailed patterns

## Database

- Prisma ORM with PostgreSQL
- Database hooks for user creation setup
- Organization-based data access patterns

## Dialog System

- See `.claude/rules/dialog-manager.md` for detailed patterns

## API Requests

- All API Request SHOULD use `@/lib/up-fetch.ts` and NEVER use `fetch`
