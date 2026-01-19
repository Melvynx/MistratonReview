<client_side_fetch_reference>
<overview>
Complete patterns for client-side data fetching using TanStack Query with orgRoute API endpoints. Includes hooks, API routes, pagination, filtering, search, and optimistic updates.
</overview>

<table_of_contents>
1. Hook Structure Pattern
2. API Route Pattern (orgRoute)
3. Pagination Pattern
4. Search and Filtering
5. Query Keys Convention
6. Mutations with Optimistic Updates
7. Query Invalidation
8. Complete Examples
</table_of_contents>

<hook_structure>
<basic_hook>
Simple hook without pagination:

```typescript
// src/lib/resources/use-tags.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/use-current-org";

async function getTags(orgId: string): Promise<Tag[]> {
  const response = await fetch(`/api/org/${orgId}/tags`);
  if (!response.ok) {
    throw new Error("Failed to fetch tags");
  }
  return response.json();
}

export function useTags() {
  const org = useCurrentOrg();

  return useQuery({
    queryKey: ["tags", org?.id],
    queryFn: async () => getTags(org?.id ?? ""),
    enabled: !!org?.id,
  });
}

export const useRefreshTags = () => {
  const org = useCurrentOrg();
  const queryClient = useQueryClient();

  return async () =>
    queryClient.invalidateQueries({ queryKey: ["tags", org?.id] });
};
```
</basic_hook>

<paginated_hook>
Hook with pagination and search:

```typescript
// src/lib/resources/use-subscribers.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useDebounce } from "@/hooks/use-debounce";

type SubscribersResponse = {
  data: Subscriber[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
};

async function getSubscribers({
  orgId,
  page,
  status,
  query,
}: {
  orgId: string;
  page: number;
  status?: string;
  query?: string;
}): Promise<SubscribersResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", page.toString());
  searchParams.set("limit", "50");
  if (status) searchParams.set("status", status);
  if (query) searchParams.set("query", query);

  const response = await fetch(
    `/api/org/${orgId}/subscribers?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch subscribers");
  }

  return response.json();
}

export function useSubscribers({
  page,
  status = "SUBSCRIBED",
  query: queryProps,
}: {
  page: number;
  status?: string;
  query?: string;
}) {
  const org = useCurrentOrg();
  const query = useDebounce(queryProps, 250);

  return useQuery({
    queryKey: ["subscribers", org?.id, page, status, query],
    queryFn: async () =>
      getSubscribers({
        orgId: org?.id ?? "",
        page,
        status,
        query,
      }),
    enabled: !!org?.id,
    refetchOnWindowFocus: true,
  });
}

export const useRefreshSubscribers = () => {
  const org = useCurrentOrg();
  const queryClient = useQueryClient();

  return async () =>
    queryClient.invalidateQueries({
      queryKey: ["subscribers", org?.id],
    });
};
```
</paginated_hook>

<complex_filters_hook>
Hook with complex filtering (JSON-encoded filters):

```typescript
// src/lib/resources/use-subscribers.ts (advanced)
import { useDebounce } from "@/hooks/use-debounce";
import type { Filter } from "@/features/subscribers/filter.schema";

async function getSubscribers({
  orgId,
  filters,
  page,
  status,
  query,
}: {
  orgId: string;
  filters: Filter[];
  page: number;
  status?: string;
  query?: string;
}): Promise<SubscribersResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", page.toString());
  searchParams.set("limit", "50");
  searchParams.set("filters", JSON.stringify(filters));
  if (status) searchParams.set("status", status);
  if (query) searchParams.set("query", query);

  const response = await fetch(
    `/api/org/${orgId}/subscribers?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch subscribers");
  }

  return response.json();
}

export function useSubscribers({
  filters: filtersProps,
  page,
  status = "SUBSCRIBED",
  query: queryProps,
}: {
  filters: Filter[];
  page: number;
  status?: string;
  query?: string;
}) {
  const org = useCurrentOrg();

  // Debounce search query and filters
  const query = useDebounce(queryProps, 250);
  const filters = useDebounce(filtersProps, 250);

  return useQuery({
    queryKey: ["subscribers", org?.id, filters, page, status, query],
    queryFn: async () =>
      getSubscribers({
        orgId: org?.id ?? "",
        filters,
        page,
        status,
        query,
      }),
    enabled: !!org?.id,
    refetchOnWindowFocus: true,
  });
}
```
</complex_filters_hook>
</hook_structure>

<api_route_pattern>
<basic_route>
Simple orgRoute GET endpoint:

```typescript
// app/api/org/[orgId]/tags/route.ts
import { orgRoute } from "@/lib/safe-route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = orgRoute.handler(async (req, { ctx }) => {
  const tags = await prisma.tag.findMany({
    where: {
      organizationId: ctx.organization.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(tags);
});
```
</basic_route>

<paginated_route>
Paginated orgRoute with Zod query validation:

```typescript
// app/api/org/[orgId]/subscribers/route.ts
import { orgRoute } from "@/lib/safe-route";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/prisma-client";
import { NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
  status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED", "ALL"]).optional(),
  query: z.string().optional(),
});

export const GET = orgRoute
  .query(QuerySchema)
  .handler(async (req, { ctx, query }) => {
    const page = Number(query.page);
    const limit = Number(query.limit);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SubscriberWhereInput = {
      organizationId: ctx.organization.id,
      ...(query.status && query.status !== "ALL"
        ? { status: query.status }
        : {}),
      ...(query.query
        ? {
            OR: [
              { email: { contains: query.query, mode: "insensitive" } },
              { name: { contains: query.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    // Parallel queries for count and data
    const [total, subscribers] = await Promise.all([
      prisma.subscriber.count({ where }),
      prisma.subscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: subscribers,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    });
  });
```
</paginated_route>

<complex_filters_route>
Route with complex JSON filter parsing:

```typescript
// app/api/org/[orgId]/subscribers/route.ts (advanced)
import { orgRoute } from "@/lib/safe-route";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/prisma-client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { filterSchema } from "@/features/subscribers/filter.schema";
import { filtersToWhere } from "@/features/subscribers/filter-to-where";

const QuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
  filters: z.string().optional(), // JSON-encoded filters
  status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED", "ALL"]).optional(),
  query: z.string().optional(),
});

export const GET = orgRoute
  .query(QuerySchema)
  .handler(async (req, { ctx, query }) => {
    const page = Number(query.page);
    const limit = Number(query.limit);
    const skip = (page - 1) * limit;

    // Parse and validate JSON filters
    const parsedFilters = query.filters ? JSON.parse(query.filters) : [];
    const filters = z.array(filterSchema).parse(parsedFilters);

    // Convert filters to Prisma where clause
    const filtersQuery = await filtersToWhere(filters);

    const where: Prisma.SubscriberWhereInput = {
      organizationId: ctx.organization.id,
      ...(query.status && query.status !== "ALL"
        ? { status: query.status }
        : {}),
      ...filtersQuery,
      ...(query.query
        ? {
            OR: [
              { email: { contains: query.query, mode: "insensitive" } },
              { name: { contains: query.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, subscribers] = await Promise.all([
      prisma.subscriber.count({ where }),
      prisma.subscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          tags: {
            select: {
              tag: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: subscribers,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    });
  });
```
</complex_filters_route>

<post_route>
POST endpoint with body validation:

```typescript
// app/api/org/[orgId]/tags/route.ts
import { orgRoute } from "@/lib/safe-route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const TagSchema = z.object({
  name: z.string().min(1).max(50),
});

export const POST = orgRoute
  .body(TagSchema)
  .handler(async (req, { body, ctx }) => {
    const tag = await prisma.tag.create({
      data: {
        name: body.name,
        organizationId: ctx.organization.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      tag,
    });
  });
```
</post_route>
</api_route_pattern>

<query_keys_convention>
<format>
Query keys follow this pattern: `[resourceName, orgId, ...params]`

```typescript
// Simple resource
queryKey: ["tags", org?.id]

// Paginated resource
queryKey: ["subscribers", org?.id, page]

// With filters
queryKey: ["subscribers", org?.id, page, status, query]

// Complex filters
queryKey: ["subscribers", org?.id, filters, page, status, query]

// Single resource by ID
queryKey: ["subscriber", org?.id, subscriberId]

// Nested resource
queryKey: ["workflow-steps", workflowId, org?.id]
```
</format>

<invalidation>
Invalidate by prefix to refresh related queries:

```typescript
// Invalidate all subscribers queries
queryClient.invalidateQueries({ queryKey: ["subscribers", org?.id] });

// Invalidate specific page
queryClient.invalidateQueries({
  queryKey: ["subscribers", org?.id, page, status],
});
```
</invalidation>
</query_keys_convention>

<mutations_pattern>
<basic_mutation>
Mutation with query invalidation:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/use-current-org";

async function createTag(orgId: string, name: string): Promise<Tag> {
  const response = await fetch(`/api/org/${orgId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Failed to create tag");
  }

  return response.json();
}

export function useCreateTagMutation(params: {
  onSuccess?: (tag: Tag) => void;
}) {
  const org = useCurrentOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => createTag(org?.id ?? "", name),
    onSuccess: (data) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["tags", org?.id] });
      params.onSuccess?.(data.tag);
    },
  });
}
```
</basic_mutation>

<optimistic_update>
Mutation with optimistic update:

```typescript
export const useOptimisticWorkflowSteps = (props: { workflowId: string }) => {
  const queryClient = useQueryClient();
  const org = useCurrentOrg();

  return async (steps: WorkflowStep[]) => {
    // Immediately update cache
    queryClient.setQueryData(
      ["workflow-steps", props.workflowId, org?.id],
      steps
    );
  };
};

export function useUpdateWorkflowStepsMutation(workflowId: string) {
  const org = useCurrentOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (steps: WorkflowStep[]) =>
      updateWorkflowSteps(org?.id ?? "", workflowId, steps),

    onMutate: async (newSteps) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["workflow-steps", workflowId, org?.id],
      });

      // Snapshot previous value
      const previousSteps = queryClient.getQueryData([
        "workflow-steps",
        workflowId,
        org?.id,
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ["workflow-steps", workflowId, org?.id],
        newSteps
      );

      // Return context for rollback
      return { previousSteps };
    },

    onError: (err, newSteps, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["workflow-steps", workflowId, org?.id],
        context?.previousSteps
      );
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["workflow-steps", workflowId, org?.id],
      });
    },
  });
}
```
</optimistic_update>
</mutations_pattern>

<url_state_with_nuqs>
Use nuqs for URL-persisted query parameters:

```typescript
// src/features/subscribers/use-subscribers-search-params.ts
import { useQueryState, parseAsInteger, parseAsStringEnum } from "nuqs";
import { debounce } from "@/lib/debounce";

const shallowOption = { shallow: false } as const;

export function useSubscribersPage() {
  return useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions(shallowOption)
  );
}

export function useSubscribersStatus() {
  return useQueryState(
    "status",
    parseAsStringEnum(["SUBSCRIBED", "UNSUBSCRIBED", "ALL"])
      .withDefault("SUBSCRIBED")
      .withOptions(shallowOption)
  );
}

export function useSubscribersQuery() {
  return useQueryState("query", {
    defaultValue: "",
    ...shallowOption,
    limitUrlUpdates: debounce(500),
  });
}

// Usage in component
function SubscribersPage() {
  const [page, setPage] = useSubscribersPage();
  const [status] = useSubscribersStatus();
  const [query] = useSubscribersQuery();

  const { data, isLoading } = useSubscribers({ page, status, query });

  return (
    <Pagination
      page={page}
      pageCount={data?.meta.pageCount ?? 1}
      onPageChange={setPage}
    />
  );
}
```
</url_state_with_nuqs>

<response_structure>
Standard response format for paginated endpoints:

```typescript
type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;     // Total record count
    page: number;      // Current page (1-indexed)
    limit: number;     // Items per page
    pageCount: number; // Total pages
  };
};
```

Usage in hook:
```typescript
const { data } = useSubscribers({ page });

// Access data
const subscribers = data?.data ?? [];
const total = data?.meta.total ?? 0;
const pageCount = data?.meta.pageCount ?? 1;
```
</response_structure>

<complete_example>
Full implementation from hook to API route:

**Hook:**
```typescript
// src/lib/resources/use-images.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/use-current-org";

type ImagesResponse = {
  data: Image[];
  meta: { total: number; page: number; limit: number; pageCount: number };
};

async function getImages(
  orgId: string,
  page = 1,
  limit = 12,
  query?: string
): Promise<ImagesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", page.toString());
  searchParams.set("limit", limit.toString());
  if (query) searchParams.set("query", query);

  const response = await fetch(
    `/api/org/${orgId}/images?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch images");
  }

  return response.json();
}

export function useImages(page = 1, limit = 12, query?: string) {
  const org = useCurrentOrg();

  return useQuery({
    queryKey: ["images", org?.id, page, limit, query],
    queryFn: async () => getImages(org?.id ?? "", page, limit, query),
    enabled: !!org?.id,
  });
}

export const useRefreshImages = () => {
  const org = useCurrentOrg();
  const queryClient = useQueryClient();

  return async () =>
    queryClient.invalidateQueries({ queryKey: ["images", org?.id] });
};
```

**API Route:**
```typescript
// app/api/org/[orgId]/images/route.ts
import { orgRoute } from "@/lib/safe-route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export const GET = orgRoute
  .query(
    z.object({
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("12"),
      query: z.string().optional(),
    })
  )
  .handler(async (req, { query, ctx }) => {
    const page = Number(query.page);
    const limit = Number(query.limit);
    const skip = (page - 1) * limit;

    const where = {
      organizationId: ctx.organization.id,
      ...(query.query
        ? {
            OR: [
              { name: { contains: query.query, mode: "insensitive" as const } },
              { url: { contains: query.query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.image.count({ where }),
    ]);

    return NextResponse.json({
      data: images,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    });
  });
```

**Component Usage:**
```typescript
function ImageGallery() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, error } = useImages(page, 12, debouncedQuery);
  const refreshImages = useRefreshImages();

  if (isLoading) return <ImageGridSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <ImageGrid images={data?.data ?? []} />
      <Pagination
        page={page}
        pageCount={data?.meta.pageCount ?? 1}
        onPageChange={setPage}
      />
    </>
  );
}
```
</complete_example>
</client_side_fetch_reference>
