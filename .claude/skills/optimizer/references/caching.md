<caching_reference>
<overview>
Complete patterns for Next.js caching using "use cache" directive, cacheTag, cacheLife, and revalidateTag. Covers page caching, function caching, cache invalidation, and React.cache() for request deduplication.
</overview>

<table_of_contents>
1. "use cache" Directive
2. Cache Life Configuration
3. Cache Tags and Invalidation
4. React.cache() for Request Deduplication
5. Cache Tag Patterns
6. Complete Examples
7. Anti-Patterns
</table_of_contents>

<use_cache_directive>
<local_cache>
Local cache (server-side only):

```typescript
// app/docs/layout.tsx
import { cacheLife } from "next/cache";

export default async function DocsLayout({ children }) {
  "use cache";
  cacheLife("hours");

  const docsTree = await getDocsTree();

  return (
    <div className="flex">
      <DocsNav tree={docsTree} />
      {children}
    </div>
  );
}
```
</local_cache>

<remote_cache>
Remote cache (CDN/edge):

```typescript
// app/c/[captureId]/page.tsx
import { cacheLife, cacheTag } from "next/cache";

export default async function CapturePage({ params }) {
  "use cache: remote";
  cacheLife(CAPTURE_PAGE_CACHE_LIFE);
  cacheTag(CAPTURE_PAGE_CACHE_TAGS.capturePage(params.captureId));

  const page = await getCapturePage(params.captureId);

  return <CapturePageRenderer page={page} />;
}
```
</remote_cache>

<function_cache>
Cache async functions:

```typescript
// src/lib/organizations/org-limit.ts
export async function getEmailsSentToday(orgId: string): Promise<number> {
  "use cache: remote";
  cacheLife("minutes");

  const count = await prisma.emailLog.count({
    where: {
      organizationId: orgId,
      createdAt: { gte: startOfDay(new Date()) },
    },
  });

  return count;
}

export async function getOrgSubscription(orgId: string) {
  "use cache: remote";
  cacheLife("minutes");

  return prisma.subscription.findFirst({
    where: { organizationId: orgId },
    include: { plan: true },
  });
}
```
</function_cache>
</use_cache_directive>

<cache_life_config>
<predefined_values>
Predefined cache life values:

```typescript
import { cacheLife } from "next/cache";

// Short-lived (real-time data)
cacheLife("seconds"); // ~15 seconds
cacheLife("minutes"); // ~60 seconds

// Medium-lived (dashboard stats)
cacheLife("hours"); // ~43,200 seconds (12 hours)

// Long-lived (immutable content)
cacheLife("days"); // ~86,400 seconds (1 day)
cacheLife("max"); // Indefinite cache
```
</predefined_values>

<custom_config>
Custom cache life configuration:

```typescript
// src/lib/cache/capture-page-cache.ts
export const CAPTURE_PAGE_CACHE_LIFE = {
  stale: 86400,     // Serve stale for 24 hours
  revalidate: 86400, // Revalidate after 24 hours
  expire: 86400,     // Expire after 24 hours
} as const;

// Usage
import { cacheLife } from "next/cache";

async function MyComponent() {
  "use cache: remote";
  cacheLife(CAPTURE_PAGE_CACHE_LIFE);
  // ...
}
```
</custom_config>

<when_to_use>
**Cache life by use case:**

| Use Case | Cache Life | Example |
|----------|------------|---------|
| Real-time stats | `"minutes"` | Dashboard subscriber count |
| Admin stats | `"hours"` | MRR calculations |
| Public pages | custom (24h) | Capture pages |
| Immutable content | `"max"` | Email renders |
| Webhook data | `"days"` | Email tracking |
</when_to_use>
</cache_life_config>

<cache_tags_invalidation>
<tag_definition>
Define cache tags centrally:

```typescript
// src/lib/cache/capture-page-cache.ts
export const CAPTURE_PAGE_CACHE_TAGS = {
  capturePage: (captureId: string) => `capture-page-${captureId}`,
} as const;

// src/lib/cache/workflow-stats-cache.ts
export const WORKFLOW_STATS_CACHE_TAGS = {
  workflowStats: (orgId: string) => `workflow-stats-${orgId}`,
} as const;
```
</tag_definition>

<tagging_content>
Tag cached content:

```typescript
import { cacheTag, cacheLife } from "next/cache";

export default async function CampaignPage({ params }) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag(`campaign-${params.campaignId}`);

  const campaign = await getCampaign(params.campaignId);

  // Tag nested dependencies too
  campaign.snippetIds.forEach((snippetId) => {
    cacheTag(`snippet-${snippetId}`);
  });

  return <CampaignRenderer campaign={campaign} />;
}
```
</tagging_content>

<invalidation>
Invalidate cache in server actions:

```typescript
// src/features/capture-page/_actions/capture-page.action.ts
import { revalidateTag, revalidatePath } from "next/cache";

export const publishCapturePageAction = orgAction
  .schema(PublishSchema)
  .action(async ({ parsedInput, ctx }) => {
    // 1. Update database FIRST
    await prisma.capturePage.update({
      where: { id: parsedInput.capturePageId },
      data: { published: true },
    });

    // 2. THEN invalidate cache
    revalidateTag(
      CAPTURE_PAGE_CACHE_TAGS.capturePage(parsedInput.capturePageId),
      "max" // CRITICAL: Always use "max" for stale-while-revalidate
    );

    // 3. Also revalidate path if needed
    revalidatePath(`/c/${parsedInput.capturePageId}`, "max");

    return { success: true };
  });
```
</invalidation>

<critical_pattern>
**CRITICAL: Always use "max" argument:**

```typescript
// GOOD - Proper invalidation with "max"
revalidateTag("posts", "max");
revalidatePath("/posts", "max");

// BAD - Missing "max" can cause stale data issues
revalidateTag("posts");
revalidatePath("/posts");
```
</critical_pattern>
</cache_tags_invalidation>

<react_cache>
<request_deduplication>
Use React.cache() for request-level deduplication:

```typescript
// src/lib/react/cache.ts
import { cache } from "react";
import { getCurrentOrg, getRequiredCurrentOrg } from "@/lib/organizations/get-org";
import { getRequiredUser } from "@/lib/auth/auth-user";

// Cached versions of frequently-called functions
export const getCurrentOrgCache = cache(getCurrentOrg);
export const getRequiredCurrentOrgCache = cache(getRequiredCurrentOrg);
export const getRequiredUserCache = cache(getRequiredUser);

// Derived cached values
export const getOrgSlug = cache(async () => {
  const org = await getRequiredCurrentOrg();
  return org.slug;
});
```
</request_deduplication>

<usage>
Usage in components:

```typescript
// Multiple components call same function - only one DB query
async function Header() {
  const user = await getRequiredUserCache();
  return <UserAvatar user={user} />;
}

async function Sidebar() {
  const user = await getRequiredUserCache(); // Deduplicated!
  return <UserMenu user={user} />;
}

async function Content() {
  const org = await getRequiredCurrentOrgCache(); // Also deduplicated
  return <OrgContent org={org} />;
}
```
</usage>

<when_to_use_react_cache>
**Use React.cache() for:**
- Auth lookups (getUser, getCurrentOrg)
- Frequently accessed data within a request
- Functions called from multiple components

**Do NOT use React.cache() for:**
- Cross-request caching (use "use cache" instead)
- Data that changes during request
- Side effects
</when_to_use_react_cache>
</react_cache>

<cache_tag_patterns>
<naming_convention>
Cache tag naming convention:

```typescript
// Format: resource-type-identifier
const tags = {
  // Single resource
  campaign: (id: string) => `campaign-${id}`,
  capturePage: (id: string) => `capture-page-${id}`,
  snippet: (id: string) => `snippet-${id}`,

  // Organization-scoped resources
  workflowStats: (orgId: string) => `workflow-stats-${orgId}`,
  subscriberCount: (orgId: string) => `subscriber-count-${orgId}`,

  // List resources
  campaigns: (orgId: string) => `campaigns-${orgId}`,
  subscribers: (orgId: string) => `subscribers-${orgId}`,
};
```
</naming_convention>

<multi_level_tagging>
Multi-level tagging for complex data:

```typescript
// Campaign page depends on campaign AND snippets
async function getCampaignForSending(campaignId: string) {
  "use cache: remote";
  cacheLife("hours");

  // Tag with campaign
  cacheTag(`campaign-${campaignId}`);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { snippets: true },
  });

  // Also tag with each snippet (invalidate if snippet changes)
  campaign?.snippets.forEach((snippet) => {
    cacheTag(`snippet-${snippet.id}`);
  });

  return campaign;
}
```
</multi_level_tagging>

<invalidation_cascade>
Cascade invalidation:

```typescript
// When snippet is updated, invalidate related campaigns
export const updateSnippetAction = orgAction
  .schema(UpdateSnippetSchema)
  .action(async ({ parsedInput }) => {
    // Update snippet
    await prisma.snippet.update({
      where: { id: parsedInput.id },
      data: parsedInput,
    });

    // Invalidate snippet tag (cascades to campaigns using this snippet)
    revalidateTag(`snippet-${parsedInput.id}`, "max");

    return { success: true };
  });
```
</invalidation_cascade>
</cache_tag_patterns>

<complete_examples>
<public_page_caching>
Complete public page with caching:

```typescript
// app/c/[captureId]/page.tsx
import { cacheLife, cacheTag } from "next/cache";
import { CAPTURE_PAGE_CACHE_LIFE, CAPTURE_PAGE_CACHE_TAGS } from "@/lib/cache/capture-page-cache";

type Props = { params: Promise<{ captureId: string }> };

export default async function CapturePage(props: Props) {
  "use cache: remote";

  const { captureId } = await props.params;

  cacheLife(CAPTURE_PAGE_CACHE_LIFE);
  cacheTag(CAPTURE_PAGE_CACHE_TAGS.capturePage(captureId));

  const capturePage = await prisma.capturePage.findUnique({
    where: { id: captureId, published: true },
    include: { organization: true },
  });

  if (!capturePage) {
    notFound();
  }

  return <CapturePageRenderer page={capturePage} />;
}
```
</public_page_caching>

<dashboard_stats_caching>
Dashboard stats with minute-level caching:

```typescript
// app/orgs/[orgSlug]/_components/subscriber-count-stats.tsx
import { cacheLife } from "next/cache";

type Props = { orgId: string };

export async function SubscriberCountStats({ orgId }: Props) {
  "use cache: remote";
  cacheLife("minutes");

  const [total, active, unsubscribed] = await Promise.all([
    prisma.subscriber.count({ where: { organizationId: orgId } }),
    prisma.subscriber.count({
      where: { organizationId: orgId, status: "SUBSCRIBED" },
    }),
    prisma.subscriber.count({
      where: { organizationId: orgId, status: "UNSUBSCRIBED" },
    }),
  ]);

  return (
    <StatsGrid>
      <StatCard label="Total" value={total} />
      <StatCard label="Active" value={active} />
      <StatCard label="Unsubscribed" value={unsubscribed} />
    </StatsGrid>
  );
}
```
</dashboard_stats_caching>

<cache_definition_file>
Cache configuration file:

```typescript
// src/lib/cache/capture-page-cache.ts
import type { CacheLife } from "next/cache";

export const CAPTURE_PAGE_CACHE_LIFE: CacheLife = {
  stale: 86400,     // 24 hours
  revalidate: 86400,
  expire: 86400,
} as const;

export const CAPTURE_PAGE_CACHE_TAGS = {
  capturePage: (captureId: string) => `capture-page-${captureId}`,
} as const;

// src/lib/cache/workflow-stats-cache.ts
export const WORKFLOW_STATS_CACHE_LIFE: CacheLife = {
  stale: 43200,     // 12 hours
  revalidate: 43200,
  expire: 43200,
} as const;

export const WORKFLOW_STATS_CACHE_TAGS = {
  workflowStats: (orgId: string) => `workflow-stats-${orgId}`,
} as const;
```
</cache_definition_file>
</complete_examples>

<anti_patterns>
<wrong>
Invalidating before database update:

```typescript
// BAD - Race condition! Cache might refetch old data
export async function updateCampaign(data) {
  revalidateTag(`campaign-${data.id}`, "max"); // DON'T DO THIS FIRST

  await prisma.campaign.update({
    where: { id: data.id },
    data,
  });
}
```
</wrong>
<right>
Always update database first:

```typescript
// GOOD - Update THEN invalidate
export async function updateCampaign(data) {
  await prisma.campaign.update({
    where: { id: data.id },
    data,
  });

  revalidateTag(`campaign-${data.id}`, "max"); // After update
}
```
</right>

<wrong>
Missing "max" argument:

```typescript
// BAD - May not fully invalidate with stale-while-revalidate
revalidateTag("posts");
revalidatePath("/posts");
```
</wrong>
<right>
Always use "max":

```typescript
// GOOD - Full invalidation
revalidateTag("posts", "max");
revalidatePath("/posts", "max");
```
</right>

<wrong>
Caching user-specific data:

```typescript
// BAD - User-specific data shouldn't be cached publicly
async function UserDashboard({ userId }) {
  "use cache: remote"; // NO! This is user-specific

  const data = await getUserData(userId);
  return <Dashboard data={data} />;
}
```
</wrong>
<right>
Only cache public or org-scoped data:

```typescript
// GOOD - Public page can be cached
async function PublicPage({ pageId }) {
  "use cache: remote";
  cacheTag(`page-${pageId}`);

  const page = await getPublicPage(pageId);
  return <PageRenderer page={page} />;
}
```
</right>
</anti_patterns>

<decision_tree>
**When to use which caching approach:**

| Data Type | Approach | Cache Life |
|-----------|----------|------------|
| Public pages | `"use cache: remote"` + tags | hours/days |
| Dashboard stats | `"use cache: remote"` | minutes |
| Admin calculations | `"use cache: remote"` | hours |
| Immutable records | `"use cache"` | max |
| Request deduplication | `React.cache()` | request-scoped |
| User-specific data | No cache / TanStack Query | none |
| Real-time data | No cache | none |
</decision_tree>

<success_criteria>
- "use cache" directive at top of function/component
- cacheLife() called immediately after directive
- cacheTag() called for invalidatable content
- Cache tags defined in central config files
- Database updates BEFORE cache invalidation
- "max" argument used with revalidateTag/revalidatePath
- React.cache() used for request deduplication
- No caching of user-specific data with remote cache
</success_criteria>
</caching_reference>
