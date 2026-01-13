---
paths:
  - "**/{proxy,middleware}.ts"
---

# Next.js

## Middleware

🔴 **CRITICAL**: `middleware.ts` is **DEPRECATED**. The middleware file is now named `proxy.ts`.

- **NEVER** create or use `middleware.ts`
- **ALWAYS** use `proxy.ts` for middleware logic

## revalidateTag / revalidatePath

**ALWAYS** pass the second argument `'max'` for stale-while-revalidate behavior:

```typescript
revalidateTag("posts", "max");
revalidatePath("/posts", "max");
```
