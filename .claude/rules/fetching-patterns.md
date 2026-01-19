# Fetching Patterns Decision Guide

This rule helps AI choose between server-side fetching (Server Components) and client-side fetching (TanStack Query).

## Decision Matrix

### Use Client-Side Fetching (TanStack Query) When:

1. **Fast navigation is critical** - Data should be cached and instantly available on revisit
2. **Data updates frequently** - Real-time or near-real-time updates needed
3. **User interacts with data** - Filtering, searching, pagination with instant feedback
4. **Optimistic updates** - User actions should reflect immediately before server confirms

### Use Server-Side Fetching (Server Components) When:

1. **Data doesn't need to be fast** - Initial page load can wait for data
2. **Feature is not a core feature** - Secondary pages, settings, admin panels
3. **Data doesn't update frequently** - Static or rarely changing content
4. **SEO matters** - Content needs to be in initial HTML for crawlers

## Implementation Patterns

### Server-Side (Server Components)

```typescript
// app/[orgSlug]/settings/page.tsx
export default async function SettingsPage(props: PageProps<"/[orgSlug]/settings">) {
  const settings = await prisma.settings.findFirst({
    where: { organizationId: org.id },
  });

  return <SettingsForm defaultValues={settings} />;
}
```

**CRITICAL**: Server Components are the default. Use them unless you have a specific reason for client-side fetching.

### Client-Side (TanStack Query)

See `.claude/skills/optimizer/references/client-side-fetch.md` for complete patterns including:

- Hook structure with `useQuery`
- API routes with `orgRoute`
- Pagination and filtering
- Mutations with optimistic updates
- Query key conventions

## Quick Reference

| Scenario | Fetching Method | Reason |
|----------|-----------------|--------|
| Dashboard with live stats | Client | Frequent updates |
| User profile page | Server | Rarely changes |
| Email list with pagination | Client | Fast navigation, filtering |
| Settings page | Server | Not core, static |
| Real-time notifications | Client | Frequent updates |
| Blog post content | Server | SEO, static |
| Search results | Client | Interactive, fast feedback |
| Onboarding flow | Server | One-time, not core |

## NEVER Do

- **NEVER** use `fetch` directly in client components - use TanStack Query hooks
- **NEVER** create client components just for data fetching if data is static
- **NEVER** skip loading states for client-side fetches
