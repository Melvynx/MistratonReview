# Step 2: Implementation Plan

## Implementation Plan: Slug-Based Routing with Middleware Headers

### Overview

Use middleware to extract and validate organization slug from URL, then store it in request headers (`x-org-slug`). This eliminates props drilling and simplifies all page code while maintaining multi-tab support. Each request becomes self-contained with explicit org context.

### Key Architecture Changes

**Current flow (Session-Based):**
1. Middleware extracts slug → checks session.activeOrganizationId → calls setActiveOrganization → redirects
2. Pages drill orgSlug through props → pass to getRequiredCurrentOrg
3. All tabs share same session state → conflicts

**New flow (Header-Based):**
1. Middleware extracts slug → validates user membership → sets `x-org-slug` header → continues (no redirect)
2. Pages call getRequiredCurrentOrg() with no params → reads slug from headers automatically
3. Each tab has independent context via URL

**Benefits:**
- ✅ Zero props drilling (headers auto-propagate)
- ✅ No session state manipulation
- ✅ No unnecessary redirects (faster)
- ✅ Cleaner page code (no params to pass)
- ✅ Headers automatically available in server components and server actions
- ✅ Multi-tab support out of the box

---

## File Changes

### 1. `proxy.ts` (MAJOR SIMPLIFICATION)

**Current behavior:** Lines 40-67 validate session, check activeOrganisation, and call switchActiveOrganization with redirect

**Changes needed:**
- **Line 40-54**: Update validateSession call to not fetch activeOrganisation
- **Line 53-55**: Remove activeOrganisation comparison logic
- **Line 67**: Replace `switchActiveOrganization(request, org.id)` with setting header

**New implementation (lines 40-68):**
```typescript
const sessionData = await validateSession(request);
if (!sessionData) return NextResponse.next();

const { session } = sessionData; // No activeOrganisation needed

if (slug === "default") {
  const firstOrg = await getFirstUserOrganization(session.session.userId);
  if (firstOrg?.slug) {
    return buildOrgRedirectUrl(request, firstOrg.slug);
  }
  return redirectToOrgList(request);
}

const org = await findUserOrganization(slug, session.session.userId);

if (!org) {
  return redirectToOrgList(request);
}

if (org.slug && slug !== org.slug) {
  return buildOrgRedirectUrl(request, org.slug);
}

// NEW: Set header instead of switching active org
const response = NextResponse.next();
response.headers.set('x-org-slug', org.slug ?? slug);
return response;
```

**Why:** Eliminates session mutation and redirect, making requests faster and stateless

---

### 2. `src/lib/auth/proxy-utils.ts` (CLEANUP)

**Changes:**

**A. Update validateSession (lines 40-55):**
- Remove `auth.api.getFullOrganization()` call
- Remove `activeOrganisation` from return type
- Just return session

```typescript
export const validateSession = async (request: NextRequest) => {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!sessionCookie) return null;

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.session) return null;

  return session; // Just return session, no activeOrganisation
};
```

**Why:** We no longer need activeOrganisation - slug from URL is the source of truth

**B. Delete switchActiveOrganization (lines 132-142):**
- Remove entire function
- No longer used anywhere

**Why:** We're not setting active organization anymore

---

### 3. `src/lib/organizations/get-org.ts` (MAJOR REFACTOR)

**Add helper to read slug from headers:**
```typescript
import { headers } from "next/headers";

/**
 * Retrieves organization slug from request headers set by middleware.
 * Returns null if not in an organization context.
 */
const getOrgSlugFromHeaders = async (): Promise<string | null> => {
  const headersList = await headers();
  return headersList.get('x-org-slug');
};
```

**Refactor getOrg() function (lines 56-130):**
- Remove all `auth.api.setActiveOrganization` calls (lines 65-70, 87-92, 115-118)
- Remove session.activeOrganizationId check (lines 59-61)
- Remove params parameter entirely
- Read slug from headers instead
- Use Better Auth's `getFullOrganization({ query: { organizationSlug } })` to get org data
- Keep `getFullOrg()` helper for Prisma queries with members

**New implementation:**
```typescript
const getOrg = async () => {
  const user = await getSession();

  if (!user) {
    return null;
  }

  const orgSlug = await getOrgSlugFromHeaders();

  if (!orgSlug) {
    logger.warn("No organization slug found in headers");
    return null;
  }

  try {
    // Use Better Auth to get organization by slug
    const authOrg = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationSlug: orgSlug }
    });

    if (!authOrg) {
      logger.warn(`Organization not found for slug: ${orgSlug}`);
      return null;
    }

    // Fetch full data with specific members from Prisma
    return getFullOrg(authOrg.id, user.session.userId);
  } catch (err) {
    logger.error("Error fetching organization", err);
    return null;
  }
};
```

**Why:** Eliminates session state dependency, uses explicit slug from middleware

**Update OrgParams type (lines 12-17):**
- Remove `currentOrgId` field
- Remove `currentOrgSlug` field
- Keep only `roles` and `permissions` fields

```typescript
type OrgParams = {
  roles?: AuthRole[];
  permissions?: AuthPermission;
};
```

**Update getCurrentOrg() (line 132):**
- Change signature to accept only OrgParams (no slug param)
- Pass params to getOrg for role/permission checking

```typescript
export const getCurrentOrg = async (params?: OrgParams) => {
  const user = await getSession();

  if (!user) {
    return null;
  }

  const org = await getOrg(); // No params needed

  if (!org) {
    return null;
  }

  // ... rest of role and permission checking logic unchanged ...
};
```

**Update getRequiredCurrentOrg() (line 206):**
- Signature stays same (already takes optional OrgParams)
- No changes to implementation

**Why:** Maintains clean API for pages - they just call with permissions, no slug needed

---

### 4. `src/lib/react/cache.ts` (NO CHANGES)

**Current code is already compatible:**
```typescript
export const getRequiredCurrentOrgCache = cache(
  async (params?: OrgParams) => getRequiredCurrentOrg(params)
);
```

**Why:** Signature already matches new getRequiredCurrentOrg - no updates needed

---

### 5. `app/orgs/[orgSlug]/layout.tsx` (NO CHANGES)

**Current code is already compatible:**
```typescript
const LayoutPage = async () => {
  const org = await getRequiredCurrentOrgCache();
  return <InjectCurrentOrgStore org={{...}} />;
};
```

**Why:** Already calls with no params - headers auto-propagate, no changes needed

---

### 6. All 15 Organization Pages (NO CHANGES NEEDED)

**Files:**
- `app/orgs/[orgSlug]/(navigation)/_navigation/org-navigation.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/members/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/danger/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/usage/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/plan/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/payment/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/layout.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/billing/success/page.tsx`
- `app/orgs/[orgSlug]/(navigation)/settings/billing/cancel/page.tsx`

**Current usage pattern:**
```typescript
const org = await getRequiredCurrentOrgCache({ permissions: ... });
```

**Why no changes:** This pattern already works - headers automatically available, no props drilling

---

### 7. `app/orgs/[orgSlug]/(navigation)/_navigation/org-auto-select.tsx` (DELETE FILE)

**Action:** Delete this file entirely

**Why:**
- No longer needed - we don't sync session-based active organization
- Middleware handles slug validation
- Client-side setActive calls removed

**Impact:** Check imports in other files and remove references

---

### 8. `app/orgs/[orgSlug]/(navigation)/_navigation/org-list.tsx` (SIMPLIFY)

**Changes:**
- **Line 36**: Remove `<OrgAutoSelect />` component import and usage
- **Line 42-51**: Remove form with `setActiveOrganization` server action
- Replace with simple Link navigation

**New implementation:**
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Remove OrgAutoSelect import

export function OrgList() {
  const orgs = useQuery(...);

  return (
    <div>
      {orgs.data?.map((org) => (
        <Link key={org.id} href={`/orgs/${org.slug}`}>
          <Button variant="ghost" className="w-full justify-start">
            <Avatar>
              <AvatarImage src={org.logo ?? undefined} />
              <AvatarFallback>{org.name[0]}</AvatarFallback>
            </Avatar>
            <span>{org.name}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
```

**Why:** Direct navigation is simpler and works with slug-based routing - no session update needed

---

### 9. `app/orgs/route.ts` (SIMPLIFY)

**Changes:**
- **Lines 40-45**: Remove `auth.api.setActiveOrganization` call
- Keep redirect logic to first org slug

**New implementation:**
```typescript
export async function GET() {
  const user = await getRequiredUser();

  const firstMembership = await prisma.member.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      organization: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!firstMembership?.organization.slug) {
    return Response.json({ error: "No organization found" }, { status: 404 });
  }

  // Direct redirect - no setActiveOrganization needed
  return redirect(`/orgs/${firstMembership.organization.slug}`);
}
```

**Why:** Middleware will handle slug validation and header setting on redirect

---

### 10. `app/orgs/[orgSlug]/(navigation)/_navigation/orgs-select.tsx` (VERIFY ONLY)

**Action:** Read file and verify it doesn't use setActiveOrganization

**Expected:** Should already use Link navigation only (line 67-79 per analysis)

**If uses setActiveOrganization:** Update to Link navigation pattern like org-list.tsx

---

### 11. `src/lib/actions/safe-actions.ts` (INVESTIGATE & UPDATE)

**Action:**
1. Read file to check if it uses `getRequiredCurrentOrg`
2. If yes, verify it works with no params (should automatically read from headers)
3. Test that server actions receive headers correctly

**Expected:** Server actions automatically have access to request headers, should work without changes

**If manual org param passing:** Remove and rely on headers

---

### 12. `test/vitest.setup.ts` (UPDATE TEST HELPER)

**Action:** Update mock implementation of `getRequiredCurrentOrg` to match new signature

**Changes:**
- Mock should accept only OrgParams (no orgSlug param)
- Mock should return test org data without needing slug

**New mock:**
```typescript
vi.mock("@/lib/react/cache", () => ({
  getRequiredCurrentOrgCache: vi.fn(async (params?: OrgParams) => ({
    id: "test-org-id",
    slug: "test-org",
    name: "Test Organization",
    // ... other required fields
  })),
}));
```

---

## Testing Strategy

### Manual Multi-Tab Testing

**Test scenario 1: Independent tab contexts**
- [ ] Open Tab 1: Navigate to `/orgs/org-a/settings`
- [ ] Open Tab 2: Navigate to `/orgs/org-b/settings`
- [ ] Verify Tab 1 shows Org A data
- [ ] Verify Tab 2 shows Org B data
- [ ] Navigate within Tab 1 (e.g., to `/orgs/org-a/members`)
- [ ] Switch back to Tab 2 - verify still shows Org B (unchanged)
- [ ] Refresh Tab 2 - verify still shows Org B

**Test scenario 2: Organization switching**
- [ ] Open Tab 1 at `/orgs/org-a/settings`
- [ ] Click org switcher dropdown
- [ ] Select Org B
- [ ] Verify URL changes to `/orgs/org-b/settings`
- [ ] Verify page shows Org B data

**Test scenario 3: Form submissions**
- [ ] Open Tab 1: `/orgs/org-a/settings/members`
- [ ] Open Tab 2: `/orgs/org-b/settings/members`
- [ ] In Tab 1, invite a new member
- [ ] Verify member added to Org A only
- [ ] Check Tab 2 - verify Org B members unchanged

### Edge Cases

- [ ] **Invalid slug:** Navigate to `/orgs/invalid-slug` → redirects to `/orgs`
- [ ] **No membership:** Try accessing org without membership → redirects to `/orgs`
- [ ] **Missing header:** Direct server action call without middleware → proper error handling
- [ ] **Slug change:** Update org slug in settings → URL updates, context maintained
- [ ] **Reserved slug:** Access `/orgs/api` or other reserved → handled correctly

### Automated Tests

**Update existing tests (4 files):**
- [ ] `__tests__/org-navigation-links.test.ts` - Verify navigation link generation
- [ ] `e2e/org-details-update.spec.ts` - Verify org context correct during updates
- [ ] `e2e/org-slug-update.spec.ts` - Verify slug changes work correctly
- [ ] `e2e/organization-members.spec.ts` - Verify member management in correct org

**New test file:**
- [ ] `e2e/multi-tab-org-isolation.spec.ts` - Test multi-tab independence:
  - Open two browser contexts with different orgs
  - Verify each maintains correct context independently
  - Verify navigation in one doesn't affect other
  - Verify form submissions go to correct org

---

## Acceptance Criteria Mapping

- [ ] AC1: Remove all setActiveOrganization calls → **Files: 1 (proxy.ts), 2 (proxy-utils.ts), 8 (org-list.tsx), 9 (route.ts)**
- [ ] AC2: Slug from headers, not params → **File: 3 (get-org.ts)**
- [ ] AC3: Pass organizationSlug to Better Auth → **File: 3 (get-org.ts) - uses query param**
- [ ] AC4: Remove OrgAutoSelect component → **Files: 7 (delete file), 8 (remove usage)**
- [ ] AC5: No session sync needed → **File: 1 (proxy.ts) - no more switchActiveOrganization**
- [ ] AC6: Multi-tab support → **Testing strategy above**
- [ ] AC7: Backward compatibility → **Files 4-6: No changes needed, headers auto-propagate**
- [ ] AC8: Simplified org switching → **File: 8 (org-list.tsx) - direct Link navigation**

---

## Risks & Considerations

### 1. Headers-only approach
**Risk:** Pages can't override org context
- **Mitigation:** This is intentional - URL is single source of truth
- **Benefit:** Prevents accidental context mismatch between URL and data

### 2. Server actions org context
**Risk:** Actions need headers to get org slug
- **Check:** Server actions automatically receive request headers in Next.js
- **Benefit:** No props drilling in actions either
- **Verification:** Test file upload, form submission actions

### 3. Middleware performance
**Risk:** Extra header set on every org request
- **Impact:** Negligible (just setting one header string)
- **Benefit:** Eliminates redirect call (net performance gain)
- **Measurement:** Compare before/after with Chrome DevTools timing

### 4. Permission checking
**Risk:** Verify `auth.api.hasPermission` works without activeOrganizationId
- **Investigation needed:** Does hasPermission accept explicit org parameter?
- **Fallback:** May need to pass organizationId explicitly if needed
- **Test:** Permission checks in settings/billing pages

### 5. Better Auth compatibility
**Risk:** Plugin might require activeOrganizationId for some operations
- **Mitigation:** All endpoints support explicit organizationSlug parameter
- **Verification:** Test all org operations (members, invitations, etc.)
- **Fallback:** Can still pass explicit ID if slug doesn't work

### 6. Redis cache invalidation
**Risk:** Cached org membership data might be stale
- **Current:** 60s TTL on `findUserOrganization` cache
- **Impact:** User added to org might not see it for up to 60s
- **Acceptable:** This is existing behavior, not changed by refactor

### 7. First-time org selection
**Risk:** `/orgs` route needs org slug but has none
- **Current:** Handled by redirecting to first org slug (keep this)
- **No change needed:** Middleware only runs on `/orgs/[slug]/*` paths

### 8. Race conditions during refactor
**Risk:** Partial updates will break the app
- **Mitigation:** Update files in dependency order:
  1. Core utilities first (proxy-utils.ts, get-org.ts)
  2. Middleware next (proxy.ts)
  3. Then pages (they should just work)
- **Testing:** Test after each major file change

---

## Implementation Order

**Phase 1: Core refactoring (Breaking changes)**
1. Update `src/lib/auth/proxy-utils.ts` - validateSession signature
2. Update `src/lib/organizations/get-org.ts` - remove setActive, read from headers
3. Update `proxy.ts` - set header instead of switchActiveOrganization
4. Run type check - will show all files that need updates

**Phase 2: Cleanup (Remove old code)**
5. Delete `proxy-utils.ts` → switchActiveOrganization function
6. Delete `org-auto-select.tsx` file
7. Update `org-list.tsx` - remove OrgAutoSelect usage, simplify switching
8. Update `app/orgs/route.ts` - remove setActiveOrganization

**Phase 3: Verification (Check all pages)**
9. Verify all 15 org pages work (should need no changes)
10. Update `safe-actions.ts` if needed
11. Update `test/vitest.setup.ts` mocks

**Phase 4: Testing**
12. Run `pnpm ts` - verify type safety
13. Run `pnpm test:ci` - verify unit tests pass
14. Run `pnpm test:e2e:ci` - verify e2e tests pass
15. Manual multi-tab testing
16. Add new multi-tab e2e test

---

## Step Complete

**Status:** ✓ Complete
**Files planned:** 12 files (3 major refactors, 4 simplifications, 1 delete, 4 verifications)
**Tests planned:** 5 test files (4 updates, 1 new)
**Next:** step-03-execute.md
**Timestamp:** 2026-01-13T12:30:00Z
