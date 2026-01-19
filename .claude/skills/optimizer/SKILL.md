---
name: optimizer
description: This skill should be used when the user asks to "optimize", "improve performance", "add caching", "use TanStack Query", "add state management", "use cache", "add URL state", or mentions Zustand, TanStack Form, nuqs, client-side fetching, optimistic updates, React Query, cacheTag, or revalidateTag. Provides best practices for state management, URL state, data fetching, forms, caching, and Next.js optimization.
---

<objective>
Guide optimal patterns for NowTS application development. Covers Zustand for state management, TanStack Query for client-side data fetching with optimistic updates, TanStack Form for form handling, Next.js caching with "use cache" directive, and performance optimization. For advanced Next.js patterns, also use the `vercel-react-best-practices` skill.
</objective>

<quick_start>
<decision_tree>
**Choose the right tool:**

| Need | Solution | Reference |
|------|----------|-----------|
| Shared state between components | Zustand store | `references/state-management.md` |
| LocalStorage persistence | Zustand with persist | `references/state-management.md` |
| URL state (filters, pagination) | nuqs | `references/nuqs.md` |
| Client-side data fetching | TanStack Query hooks | `references/client-side-fetch.md` |
| Optimistic updates | TanStack Query mutations | `references/client-side-fetch.md` |
| Form handling | TanStack Form | `references/forms.md` |
| Server data on page load | Server Components | `references/nextjs-optimization.md` |
| Public page caching | "use cache: remote" + cacheTag | `references/caching.md` |
| Function result caching | "use cache" + cacheLife | `references/caching.md` |
| Cache invalidation | revalidateTag with "max" | `references/caching.md` |
| Request deduplication | React.cache() | `references/caching.md` |
</decision_tree>

<zustand_quick>
Create a store for shared client state:

```typescript
"use client";

import { create } from "zustand";

type MyStore = {
  value: string;
  setValue: (value: string) => void;
};

export const useMyStore = create<MyStore>((set) => ({
  value: "",
  setValue: (value) => set({ value }),
}));
```
</zustand_quick>

<tanstack_query_quick>
Fetch data client-side with caching:

```typescript
export function useMyData() {
  const org = useCurrentOrg();

  return useQuery({
    queryKey: ["my-data", org?.id],
    queryFn: async () => fetchData(org?.id ?? ""),
    enabled: !!org?.id,
  });
}
```
</tanstack_query_quick>

<tanstack_form_quick>
Handle forms with validation:

```typescript
const form = useForm({
  schema: MySchema,
  defaultValues: { field: "" },
  onSubmit: async (values) => {
    mutation.mutate(values);
  },
});

<Form form={form}>
  <form.AppField name="field">
    {(field) => <field.Input />}
  </form.AppField>
  <form.SubmitButton>Submit</form.SubmitButton>
</Form>
```
</tanstack_form_quick>

<caching_quick>
Cache public pages or expensive functions:

```typescript
// Page with remote caching
export default async function PublicPage({ params }) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag(`page-${params.pageId}`);

  const data = await fetchData(params.pageId);
  return <PageRenderer data={data} />;
}

// Invalidate in server actions (AFTER database update)
await prisma.page.update({ ... });
revalidateTag(`page-${pageId}`, "max"); // Always use "max"
```
</caching_quick>
</quick_start>

<core_principles>
<zustand_when>
**Use Zustand when:**
- Sharing state between multiple components
- Persisting state to localStorage
- Global UI state (dialogs, sidebars, preferences)
- Caching client-side computed values
- State needs to be accessed outside React components

**Do NOT use Zustand for:**
- Server data (use TanStack Query)
- URL state (use nuqs)
- Form state (use TanStack Form)
</zustand_when>

<tanstack_query_when>
**Use TanStack Query when:**
- Fetching data client-side after page load
- Data needs caching and automatic refetching
- Implementing optimistic updates
- Managing loading/error states
- Data is shared across multiple components

**Do NOT use TanStack Query for:**
- Initial page data (use Server Components)
- One-time fetches that don't need caching
- Data that doesn't change
</tanstack_query_when>

<tanstack_form_when>
**ALWAYS use TanStack Form for forms:**
- Provides consistent validation with Zod
- Handles loading states automatically
- Integrates with mutations
- Pre-configured field components available

**Import from:** `@/features/form/tanstack-form`
</tanstack_form_when>

<server_vs_client>
**Server Components (default):**
- Initial page data
- SEO-critical content
- Auth checks
- Database queries

**Client Components:**
- Interactive UI (forms, buttons)
- Browser APIs
- Real-time updates
- User preferences
</server_vs_client>
</core_principles>

<anti_patterns>
<wrong>
Using useState for shared state:
```typescript
// BAD - state duplicated in each component
const [isOpen, setIsOpen] = useState(false);
```
</wrong>
<right>
Use Zustand for shared state:
```typescript
// GOOD - single source of truth
const isOpen = useDialogStore((s) => s.isOpen);
```
</right>

<wrong>
Fetching in useEffect:
```typescript
// BAD - no caching, no loading state
useEffect(() => {
  fetch("/api/data").then(setData);
}, []);
```
</wrong>
<right>
Use TanStack Query:
```typescript
// GOOD - caching, loading, error handling
const { data, isLoading } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
});
```
</right>

<wrong>
Custom form state:
```typescript
// BAD - reinventing the wheel
const [value, setValue] = useState("");
const [error, setError] = useState("");
```
</wrong>
<right>
Use TanStack Form:
```typescript
// GOOD - validation, error handling built-in
const form = useForm({ schema: MySchema });
```
</right>
</anti_patterns>

<reference_guides>
Load these files for detailed patterns:

- **`references/client-side-fetch.md`** - TanStack Query hooks, API routes, pagination, optimistic updates
- **`references/state-management.md`** - Zustand store patterns and persistence
- **`references/nuqs.md`** - URL state for filters, pagination, search with parsers and debounce
- **`references/forms.md`** - TanStack Form patterns, validation, auto-save
- **`references/caching.md`** - "use cache", cacheTag, cacheLife, revalidateTag, React.cache()
- **`references/nextjs-optimization.md`** - Server Components, Suspense, dynamic imports

**External skill:** For additional advanced patterns (eliminating waterfalls, bundle optimization, re-render optimization), also use the `vercel-react-best-practices` skill.
</reference_guides>

<success_criteria>
- Zustand used for shared client state, not server data
- TanStack Query used for client-side fetching with proper query keys
- TanStack Form used for ALL forms with Zod validation
- Server Components used for initial data loading
- Client Components only where necessary
- Proper loading and error states
- Query invalidation after mutations
- "use cache" for public pages with appropriate cacheLife
- Cache tags defined centrally and invalidated with "max" argument
- React.cache() used for request-level deduplication
</success_criteria>
