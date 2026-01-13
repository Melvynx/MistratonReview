---
paths:
  - "prisma/**/*"
---

# Prisma

Database layer using Prisma ORM with PostgreSQL.

## Commands

```bash
# Generate Prisma client after schema changes
pnpm prisma:generate   # ✅ Claude can run this

# Generate better-auth Prisma schema
pnpm better-auth:migrate
```

## Migration Rules

🔴 **CRITICAL - NEVER run migrations:**

- ~~`pnpm prisma:deploy`~~ - **NEVER** - User handles migrations
- ~~`pnpm prisma:migrate`~~ - **NEVER** - User handles migrations

Claude can modify `schema.prisma` and run `prisma:generate`, but **NEVER run migrations**. User handles migrations manually to avoid conflicts.

## Schema Location

- `prisma/schema.prisma` - Database schema definition

## Usage Patterns

- Organization-based data access patterns
- Database hooks for user creation setup
- All models should follow existing naming conventions in schema

## Workflow

1. Modify `prisma/schema.prisma` as needed
2. Run `pnpm prisma:generate` to update the client
3. **User will handle migrations manually**
