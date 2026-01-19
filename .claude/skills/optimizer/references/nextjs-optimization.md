<nextjs_optimization_reference>
<overview>
Next.js performance optimization patterns combining Vercel best practices with NowTS patterns. Covers Server Components, Suspense, dynamic imports, parallel data fetching, and bundle optimization.
</overview>

<table_of_contents>
1. Server vs Client Components
2. Suspense and Streaming
3. Dynamic Imports
4. Parallel Data Fetching
5. Bundle Size Optimization
6. Re-render Optimization
7. Provider Patterns
</table_of_contents>

<server_vs_client>
<default_server>
**Default to Server Components:**

```typescript
// app/users/page.tsx - Server Component (default)
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany();

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```
</default_server>

<client_when_needed>
**Use Client Components only for:**
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect)
- Third-party libraries requiring client

```typescript
// src/components/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle
    </button>
  );
}
```
</client_when_needed>

<push_client_down>
**Push client boundary down:**

```typescript
// GOOD - Only button is client component
// app/page.tsx (Server)
export default async function Page() {
  const data = await fetchData();
  return (
    <div>
      <h1>{data.title}</h1>
      <InteractiveButton /> {/* Client */}
    </div>
  );
}

// src/components/interactive-button.tsx
"use client";
export function InteractiveButton() {
  return <button onClick={() => {}}>Click</button>;
}
```
</push_client_down>
</server_vs_client>

<suspense_streaming>
<basic_suspense>
Wrap async components in Suspense:

```typescript
// app/dashboard/page.tsx
import { Suspense } from "react";
import { DashboardStats } from "./dashboard-stats";
import { StatsLoadingSkeleton } from "./stats-loading-skeleton";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <DashboardStats />
      </Suspense>
    </div>
  );
}

// Async component
async function DashboardStats() {
  const stats = await fetchStats(); // Slow query
  return <StatsDisplay stats={stats} />;
}
```
</basic_suspense>

<parallel_suspense>
Multiple Suspense boundaries for parallel loading:

```typescript
export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* These load in parallel, stream as ready */}
      <Suspense fallback={<CardSkeleton />}>
        <RevenueCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <UsersCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <OrdersCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <TrafficCard />
      </Suspense>
    </div>
  );
}
```
</parallel_suspense>

<auth_suspense>
Auth button with Suspense (from NowTS):

```typescript
// src/features/auth/auth-button.tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthButton() {
  return (
    <Suspense fallback={<Skeleton className="h-9 w-20" />}>
      <AuthButtonSuspended />
    </Suspense>
  );
}

async function AuthButtonSuspended() {
  const user = await getUser();

  if (!user) {
    return <SignInButton />;
  }

  return <UserMenu user={user} />;
}
```
</auth_suspense>
</suspense_streaming>

<dynamic_imports>
<basic_dynamic>
Dynamic import for code splitting:

```typescript
import dynamic from "next/dynamic";

// Load heavy component only when needed
const HeavyEditor = dynamic(() => import("@/components/heavy-editor"), {
  loading: () => <EditorSkeleton />,
  ssr: false, // Disable SSR for client-only components
});

export default function EditorPage() {
  return <HeavyEditor />;
}
```
</basic_dynamic>

<conditional_dynamic>
Load component conditionally:

```typescript
import dynamic from "next/dynamic";

const AdminPanel = dynamic(() => import("@/components/admin-panel"));

export default function Page({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      <MainContent />
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```
</conditional_dynamic>

<global_dialog>
Dynamic dialogs (from NowTS):

```typescript
// src/features/global-dialog/global-dialog.tsx
import dynamic from "next/dynamic";

const OrgPlanDialog = dynamic(
  () =>
    import("./org-plan-dialog").then((mod) => ({
      default: mod.OrgPlanDialog,
    })),
  { ssr: false }
);

const DialogTypeMap: Record<DialogType, React.ComponentType> = {
  "org-plan": OrgPlanDialog,
};

export function GlobalDialog() {
  const openDialog = useGlobalDialogStore((s) => s.openDialog);

  if (!openDialog) return null;

  const DialogComponent = DialogTypeMap[openDialog];
  return <DialogComponent />;
}
```
</global_dialog>

<defer_analytics>
Defer third-party scripts:

```typescript
// Load analytics after hydration
const Analytics = dynamic(() => import("@/components/analytics"), {
  ssr: false,
});

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```
</defer_analytics>
</dynamic_imports>

<parallel_fetching>
<promise_all>
Use Promise.all for independent queries:

```typescript
// GOOD - Parallel fetching
export default async function DashboardPage() {
  const [users, orders, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { amount: true } }),
  ]);

  return <Dashboard users={users} orders={orders} revenue={revenue} />;
}

// BAD - Sequential fetching (waterfall)
export default async function DashboardPage() {
  const users = await prisma.user.count();
  const orders = await prisma.order.count(); // Waits for users
  const revenue = await prisma.order.aggregate(...); // Waits for orders

  return <Dashboard users={users} orders={orders} revenue={revenue} />;
}
```
</promise_all>

<api_route_parallel>
Parallel queries in API routes:

```typescript
// app/api/org/[orgId]/stats/route.ts
export const GET = orgRoute.handler(async (req, { ctx }) => {
  const [total, active, revenue] = await Promise.all([
    prisma.subscriber.count({ where: { organizationId: ctx.organization.id } }),
    prisma.subscriber.count({
      where: { organizationId: ctx.organization.id, status: "SUBSCRIBED" },
    }),
    prisma.payment.aggregate({
      where: { organizationId: ctx.organization.id },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({ total, active, revenue: revenue._sum.amount });
});
```
</api_route_parallel>

<defer_await>
Move await into branches:

```typescript
// GOOD - Defer await until needed
async function processUser(userId: string, action: string) {
  const userPromise = getUser(userId); // Start fetch immediately

  if (action === "simple") {
    return { status: "ok" }; // No await needed
  }

  const user = await userPromise; // Only await when needed
  return processComplexAction(user);
}
```
</defer_await>
</parallel_fetching>

<bundle_optimization>
<barrel_imports>
Avoid barrel file imports:

```typescript
// BAD - Imports entire barrel file
import { Button, Card, Dialog } from "@/components/ui";

// GOOD - Direct imports
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
```
</barrel_imports>

<conditional_features>
Load features conditionally:

```typescript
// Load heavy feature only when activated
async function useFeature(featureKey: string) {
  if (!isFeatureEnabled(featureKey)) {
    return null;
  }

  // Import only when needed
  const { FeatureComponent } = await import(`@/features/${featureKey}`);
  return FeatureComponent;
}
```
</conditional_features>

<preload_hover>
Preload on hover for perceived speed:

```typescript
import Link from "next/link";

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      onMouseEnter={() => {
        // Prefetch page on hover
        router.prefetch(href);
      }}
    >
      {children}
    </Link>
  );
}
```
</preload_hover>
</bundle_optimization>

<rerender_optimization>
<memo_expensive>
Memoize expensive components:

```typescript
import { memo } from "react";

const ExpensiveList = memo(function ExpensiveList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <ExpensiveItem key={item.id} item={item} />
      ))}
    </ul>
  );
});
```
</memo_expensive>

<primitive_deps>
Use primitive dependencies:

```typescript
// BAD - Object reference changes on every render
useEffect(() => {
  fetchData(options);
}, [options]); // options = { page: 1, limit: 10 }

// GOOD - Primitive values are stable
useEffect(() => {
  fetchData({ page, limit });
}, [page, limit]);
```
</primitive_deps>

<functional_setstate>
Use functional setState for stable callbacks:

```typescript
// BAD - Callback changes when count changes
const increment = () => setCount(count + 1);

// GOOD - Callback is stable
const increment = useCallback(() => setCount((c) => c + 1), []);
```
</functional_setstate>

<lazy_state_init>
Lazy state initialization:

```typescript
// BAD - Expensive computation on every render
const [items] = useState(computeExpensiveList());

// GOOD - Computation only on mount
const [items] = useState(() => computeExpensiveList());
```
</lazy_state_init>

<transitions>
Use startTransition for non-urgent updates:

```typescript
import { startTransition } from "react";

function SearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setQuery(e.target.value); // Urgent - update input immediately

    startTransition(() => {
      setResults(search(e.target.value)); // Non-urgent - can be delayed
    });
  };

  return <input value={query} onChange={handleChange} />;
}
```
</transitions>
</rerender_optimization>

<provider_patterns>
<root_providers>
Provider setup (from NowTS):

```typescript
// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make new client
    return makeQueryClient();
  }
  // Browser: reuse client
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```
</root_providers>

<layout_usage>
Usage in root layout:

```typescript
// app/layout.tsx
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NuqsAdapter>
          <Providers>
            <Suspense>{children}</Suspense>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
```
</layout_usage>
</provider_patterns>

<additional_skills>
For detailed Vercel best practices patterns, use the `vercel-react-best-practices` skill which covers:

- Eliminating waterfalls (async-parallel, async-defer-await)
- Bundle size optimization (bundle-barrel-imports, bundle-dynamic-imports)
- Server-side performance (server-cache-react, server-parallel-fetching)
- Client-side data fetching patterns
- Re-render optimization techniques
- JavaScript performance patterns
</additional_skills>

<success_criteria>
- Server Components used by default
- Client Components only where browser APIs needed
- Suspense boundaries with proper fallbacks
- Dynamic imports for heavy/conditional components
- Promise.all for parallel data fetching
- Direct imports (no barrel files)
- Memoization for expensive computations
- Stable callback references
- Proper provider setup with Query Client singleton
</success_criteria>
</nextjs_optimization_reference>
