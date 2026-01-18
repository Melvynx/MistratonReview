---
name: security-check
description: This skill should be used when reviewing server actions, API routes, or pages for security. Use when the user asks to "security check", "review security", "audit code", or mentions authentication, authorization, permissions, or access control validation.
---

<objective>
Validate security patterns in NowTS codebase. Ensures server actions, API routes, and pages follow proper authentication and authorization patterns using Better Auth.
</objective>

<quick_start>
When reviewing code for security:

1. **Identify the code type** - Server action (.action.ts), API route (route.ts), or page (page.tsx)
2. **Read the appropriate reference** - Load the matching reference file
3. **Check against patterns** - Validate the code follows required security patterns
4. **Report issues** - List any security violations found

<workflow>
1. Read `references/server-action.md` when reviewing `.action.ts` files
2. Read `references/api-route.md` when reviewing `app/api/` routes
3. Read `references/page-server.md` when reviewing pages or layouts
4. Read `references/prisma-query.md` when reviewing ANY Prisma queries (CRITICAL)
</workflow>
</quick_start>

<security_levels>
Four security levels in this codebase:

| Level | Server Action | API Route | Description |
|-------|--------------|-----------|-------------|
| Public | `action` | `route` | No auth required |
| Authenticated | `authAction` | `authRoute` | User must be logged in |
| Organization | `orgAction` | `orgRoute` | User must be org member |
| Admin | `adminAction` | - | User must have admin role |
</security_levels>

<common_violations>
**Critical issues to check:**

1. Missing auth - Public action/route handling sensitive data
2. Missing org validation - Org-scoped data without `orgAction`/`orgRoute`
3. Missing permission check - Action modifies resources without permission metadata
4. Direct database access - Bypassing auth helpers
5. Exposed user data - Returning sensitive fields
6. **Missing org filter in Prisma queries** - Cross-tenant data leak risk
</common_violations>

<reference_guides>
Load these files based on what you're reviewing:

- **`references/server-action.md`** - Server action security patterns
- **`references/api-route.md`** - API route security patterns
- **`references/page-server.md`** - Page and layout security patterns
- **`references/prisma-query.md`** - Prisma query org filtering (CRITICAL for multi-tenant)
</reference_guides>

<success_criteria>
- All server actions use appropriate action client (action/authAction/orgAction/adminAction)
- All API routes use appropriate route handler (route/authRoute/orgRoute)
- All org-scoped actions include roles/permissions metadata when needed
- All pages/layouts call auth functions before rendering protected content
- No sensitive data exposed in responses
- **All Prisma queries on org-scoped data filter by organizationId**
</success_criteria>
