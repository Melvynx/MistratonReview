---
paths:
  - "**/*.{ts,tsx}"
---

# Authentication

## Server-Side (RSC, Server Actions, API Routes)

```ts
import { getUser, getRequiredUser } from "@/lib/auth/auth-user";
import { getCurrentOrg, getRequiredCurrentOrg } from "@/lib/organizations/get-org";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";

// Optional user (returns null if not authenticated)
const user = await getUser();

// Required user (throws if not authenticated)
const user = await getRequiredUser();

// Organization helpers
const org = await getCurrentOrg(); // Optional - returns null
const org = await getRequiredCurrentOrg(); // Required - throws
const org = await getRequiredCurrentOrgCache(); // Cached for RSC
```

## Client-Side (React Components)

```tsx
import { useSession } from "@/lib/auth/auth-client";

function MyComponent() {
  const session = useSession();

  if (session.isPending) return <Loading />;
  if (!session.data?.user) return <LoginPrompt />;

  return <div>Hello {session.data.user.name}</div>;
}
```

## Page Protection

```tsx
// Protected page
export default async function ProtectedPage() {
  const user = await getRequiredUser();
  return <Dashboard user={user} />;
}

// Organization-scoped page
export default async function OrgPage() {
  const org = await getRequiredCurrentOrgCache();
  return <OrgDashboard org={org} />;
}
```
