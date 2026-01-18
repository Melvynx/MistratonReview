<api_route_security>

<overview>
API routes use `next-zod-route` with route handlers from `@/lib/zod-route.ts`.
</overview>

<route_handlers>

<public_route>
**Import**: `import { route } from "@/lib/zod-route"`

Use for: Public endpoints (webhooks, public API)

```typescript
export const POST = route
  .input(z.object({ data: z.string() }))
  .handler(async ({ input }) => {
    // No auth - public access
    return { received: true };
  });
```

**Security check**: Verify endpoint should be publicly accessible.
</public_route>

<auth_route>
**Import**: `import { authRoute } from "@/lib/zod-route"`

Use for: User-authenticated endpoints

```typescript
export const GET = authRoute
  .input(z.object({}))
  .handler(async ({ ctx }) => {
    // ctx.user available
    const data = await prisma.userSettings.findUnique({
      where: { userId: ctx.user.id }
    });
    return data;
  });
```

**Security check**:
- Always use `ctx.user.id` for user queries
- Never expose sensitive user fields
</auth_route>

<org_route>
**Import**: `import { orgRoute } from "@/lib/zod-route"`

Use for: Organization-scoped endpoints

```typescript
// Basic org membership
export const GET = orgRoute
  .input(z.object({}))
  .handler(async ({ ctx }) => {
    // ctx.organization available
    return prisma.project.findMany({
      where: { organizationId: ctx.organization.id }
    });
  });

// With role requirement
export const DELETE = orgRoute
  .input(z.object({ projectId: z.string() }))
  .metadata({ roles: ["admin", "owner"] })
  .handler(async ({ input, ctx }) => {
    // Only admin/owner can delete
    await prisma.project.delete({
      where: {
        id: input.projectId,
        organizationId: ctx.organization.id // Always scope to org!
      }
    });
  });

// With permission requirement
export const POST = orgRoute
  .input(z.object({ name: z.string() }))
  .metadata({ permissions: { project: ["create"] } })
  .handler(async ({ input, ctx }) => {
    return prisma.project.create({
      data: {
        name: input.name,
        organizationId: ctx.organization.id
      }
    });
  });
```

**Security check**:
- Always include `organizationId: ctx.organization.id` in queries
- Add metadata for role/permission restricted endpoints
</org_route>

<admin_route>
**Note**: No dedicated `adminRoute` handler exists.

For admin-only API routes, use `route` with manual check:

```typescript
export const GET = route
  .params(z.object({ id: z.string() }))
  .handler(async (req, { params }) => {
    await getRequiredAdmin(); // Manual admin check
    // Admin-only logic here
  });
```
</admin_route>

</route_handlers>

<error_handling>
```typescript
import { ZodRouteError } from "next-zod-route";

// Custom status codes
throw new ZodRouteError({ message: "Not found", status: 404 });
throw new ZodRouteError({ message: "Forbidden", status: 403 });

// ApplicationError returns 400
throw new ApplicationError("Invalid data");
```
</error_handling>

<org_header>
Organization is determined by `x-org-slug` header. Client must send this header for org-scoped routes.

The middleware extracts org from header and validates membership automatically.
</org_header>

<checklist>
- [ ] Uses correct route handler for security level
- [ ] Org routes always scope queries with `ctx.organization.id`
- [ ] Auth routes always scope queries with `ctx.user.id`
- [ ] Destructive endpoints have role/permission metadata
- [ ] Proper error status codes used
- [ ] Input validated with Zod schema
- [ ] No sensitive data in responses
</checklist>

</api_route_security>
