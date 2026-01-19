<nuqs_reference>
<overview>
URL state management with nuqs. Use for filters, pagination, tabs, and any state that should persist in URL.
</overview>

<when_to_use>
| State Type | Use nuqs | Use Zustand |
|------------|----------|-------------|
| Filters, search, pagination | Yes | No |
| Shareable/bookmarkable state | Yes | No |
| UI preferences (theme, sidebar) | No | Yes |
| Form state | No | TanStack Form |
</when_to_use>

<client_side>
<basic>
```typescript
"use client";
import { useQueryState, parseAsInteger } from "nuqs";

function MyComponent() {
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  return <Pagination page={page} onPageChange={setPage} />;
}
```
</basic>

<search_with_debounce>
```typescript
import { useQueryState } from "nuqs";
import { debounce } from "nuqs";

function SearchInput() {
  const [query, setQuery] = useQueryState("query", {
    defaultValue: "",
    shallow: false,
    limitUrlUpdates: debounce(500), // Wait 500ms before updating URL
  });

  return <Input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```
</search_with_debounce>

<enum_filter>
```typescript
import { useQueryState, parseAsStringEnum } from "nuqs";

const statuses = ["ACTIVE", "ARCHIVED", "ALL"] as const;

function StatusFilter() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum(statuses)
      .withDefault("ACTIVE")
      .withOptions({ shallow: false, clearOnDefault: true })
  );

  return <Select value={status} onValueChange={setStatus} />;
}
```
</enum_filter>

<multiple_params>
```typescript
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

function Filters() {
  const [{ page, query, status }, setParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      query: parseAsString.withDefault(""),
      status: parseAsString.withDefault("ALL"),
    },
    { shallow: false, throttleMs: 500 }
  );

  // Update multiple at once
  const resetFilters = () => setParams({ page: 1, query: "", status: "ALL" });
}
```
</multiple_params>

<custom_parser>
For complex types (arrays, objects):

```typescript
import { useQueryState } from "nuqs";
import type { Filter } from "./types";

function useFilters(defaultFilters: Filter[] = []) {
  return useQueryState<Filter[]>("filters", {
    defaultValue: defaultFilters,
    parse: (value) => JSON.parse(value || "[]"),
    serialize: (value) => JSON.stringify(value),
    shallow: false,
  });
}
```
</custom_parser>
</client_side>

<server_side>
For Server Components, use `createSearchParamsCache`:

```typescript
// app/dashboard/search-params.ts
import { createSearchParamsCache, parseAsInteger, parseAsIsoDate } from "nuqs/server";

export const dashboardSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  from: parseAsIsoDate.withDefault(subDays(new Date(), 30)),
  to: parseAsIsoDate.withDefault(new Date()),
});

// app/dashboard/page.tsx
import { dashboardSearchParams } from "./search-params";

export default async function DashboardPage({ searchParams }) {
  const { page, from, to } = await dashboardSearchParams.parse(searchParams);

  const data = await fetchData({ page, from, to });
  return <Dashboard data={data} />;
}
```
</server_side>

<common_parsers>
| Parser | Use For | Example |
|--------|---------|---------|
| `parseAsString` | Text search | `?query=hello` |
| `parseAsInteger` | Pagination | `?page=2` |
| `parseAsStringEnum` | Status filters | `?status=ACTIVE` |
| `parseAsIsoDate` | Date ranges | `?from=2024-01-01` |
| `parseAsBoolean` | Toggles | `?showArchived=true` |
| `parseAsJson` | Complex objects | `?filters={...}` |
</common_parsers>

<options>
| Option | Purpose |
|--------|---------|
| `shallow: false` | Persist changes (use this always) |
| `clearOnDefault: true` | Remove param when value equals default |
| `limitUrlUpdates: debounce(ms)` | Delay URL updates for inputs |
| `throttleMs` | Throttle for `useQueryStates` |
</options>

<patterns>
<extracted_hooks>
Extract reusable hooks for repeated patterns:

```typescript
// src/hooks/use-pagination.ts
export function usePagination() {
  return useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );
}

// src/hooks/use-search.ts
export function useSearch() {
  return useQueryState("query", {
    defaultValue: "",
    shallow: false,
    limitUrlUpdates: debounce(300),
  });
}
```
</extracted_hooks>
</patterns>

<anti_patterns>
```typescript
// BAD - Missing shallow: false (changes won't persist)
const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

// BAD - No debounce on search input (too many URL updates)
const [query, setQuery] = useQueryState("query");

// BAD - Using nuqs for non-URL state
const [isOpen, setIsOpen] = useQueryState("sidebar"); // Use Zustand instead
```
</anti_patterns>
</nuqs_reference>
