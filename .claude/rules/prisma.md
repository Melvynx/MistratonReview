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

## 🔴 CRITICAL - Security Rules

**ALWAYS filter by `organizationId`** when querying/updating/deleting organization-scoped data:

```ts
// ✅ CORRECT - Always include organizationId in where clause
const data = await prisma.member.findMany({
  where: {
    organizationId: org.id, // MANDATORY for security
  },
});

// ❌ WRONG - Missing organizationId allows cross-org data access
const data = await prisma.member.findMany({
  where: { userId: userId },
});
```

**ALWAYS verify user membership** before accessing org data:

```ts
// Use getRequiredCurrentOrg() or getRequiredCurrentOrgCache()
// These verify the user belongs to the organization
const org = await getRequiredCurrentOrg();

// Then use org.id in your queries
const members = await prisma.member.findMany({
  where: { organizationId: org.id },
});
```

## Performance - Use `select` Over `include`

**Prefer `select`** to fetch only needed fields and reduce data transfer:

```ts
// ✅ CORRECT - Select only needed fields
return prisma.member.findMany({
  where: { organizationId: orgId },
  select: {
    id: true,
    role: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    },
  },
});

// ❌ AVOID - include fetches entire related records
return prisma.member.findMany({
  where: { organizationId: orgId },
  include: { user: true }, // Fetches ALL user fields
});
```

## Codebase Patterns

Follow existing patterns in `src/query/`:

```ts
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

// Define reusable select/include objects with satisfies
const memberSelect = {
  id: true,
  role: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.MemberSelect;

// Export return types using Prisma.PromiseReturnType
export type MemberWithUser = Prisma.PromiseReturnType<typeof getMembers>;
```

## Workflow

1. Modify `prisma/schema.prisma` as needed
2. Run `pnpm prisma:generate` to update the client
3. **User will handle migrations manually**
