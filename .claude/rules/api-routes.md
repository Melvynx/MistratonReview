---
paths:
  - "app/**/route.ts"
---

# API Routes

**CRITICAL**: All API routes MUST use `@/lib/zod-route.ts`

ALWAYS read `src/lib/zod-route.ts` before creating routes.

## Usage

```ts
import { route, authRoute, orgRoute } from "@/lib/zod-route";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { ApplicationError } from "@/lib/errors/application-error";

// Public route
export const POST = route
  .params(z.object({ id: z.string() })) // URL params
  .body(z.object({ name: z.string() })) // Request body
  .query(z.object({ page: z.number().optional() })) // Search params
  .handler(async (req, { params, body, query }) => {
    return { success: true };
  });

// Authenticated route (ctx.user available)
export const GET = authRoute
  .params(z.object({ id: z.string() }))
  .handler(async (req, { params, ctx }) => {
    return { data: ctx.user };
  });

// Organization route (ctx.organization available)
export const POST = orgRoute
  .metadata({ permissions: { users: ["create"] } })
  .body(z.object({ email: z.string().email() }))
  .handler(async (req, { body, ctx }) => {
    return { success: true };
  });
```

## Error Handling

```ts
// Custom status code
throw new ZodRouteError("Not found", 404);

// 400 error
throw new ApplicationError("Invalid operation");
```
