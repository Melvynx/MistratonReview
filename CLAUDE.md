# CLAUDE.md

This file provides guidance to AI Agents.

## About the project <NAME>

If you read this, ask question about the project to fill this part. You need to describe what is the purpose of the project, main feature and goals.

## Important Files

- `src/lib/auth.ts` - Authentication configuration
- `src/features/dialog-manager/` - Global dialog system
- `src/lib/actions/actions-utils.ts` - Server action utilities
- `src/features/form/tanstack-form.tsx` - TanStack Form components (useForm, Form, field components)
- `src/site-config.ts` - Site configuration
- `src/lib/actions/safe-actions.ts` - All Server Action SHOULD use this logic
- `src/lib/zod-route.ts` - See `.claude/rules/api-routes.md` for detailed patterns

### Database Schemas

- `prisma/schema/schema.prisma` - Main database schema
- `prisma/schema/better-auth.prisma` - Better Auth schema (auto-generated)

## TypeScript imports

Always use TypeScript path aliases instead of relative imports:

- `@/*` → `./src/*` (e.g., `@/components/ui/button`)
- `@email/*` → `./emails/*` (e.g., `@email/welcome`)
- `@app/*` → `./app/*` (e.g., `@app/api/route`)

## Workflow modification

🚨 **CRITICAL RULE - ALWAYS FOLLOW THIS** 🚨

**BEFORE editing any files, you MUST Read at least 3 files** that will help you to understand how to make a coherent and consistency.

This is **NON-NEGOTIABLE**. Do not skip this step under any circumstances. Reading existing files ensures:

- Code consistency with project patterns
- Proper understanding of conventions
- Following established architecture
- Avoiding breaking changes

**Types of files you MUST read:**

1. **Similar files**: Read files that do similar functionality to understand patterns and conventions
2. **Imported dependencies**: Read the definition/implementation of any imports you're not 100% sure how to use correctly - understand their API, types, and usage patterns

**Steps to follow:**

1. Read at least 3 relevant existing files (similar functionality + imported dependencies)
2. Understand the patterns, conventions, and API usage
3. Only then proceed with creating/editing files
