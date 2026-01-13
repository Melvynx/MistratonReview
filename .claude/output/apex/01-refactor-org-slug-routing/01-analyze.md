# Step 1: Analysis

## Codebase Context

### Related Files Found

| File | Lines | Contains |
|------|-------|----------|
| `proxy.ts` | 18-68 | Middleware that extracts slug, validates session, calls switchActiveOrganization |
| `src/lib/auth/proxy-utils.ts` | 26-38 | extractOrgSlug helper function |
| `src/lib/auth/proxy-utils.ts` | 40-55 | validateSession - fetches session and activeOrganisation |
| `src/lib/auth/proxy-utils.ts` | 57-93 | findUserOrganization - validates user membership with Redis caching |
| `src/lib/auth/proxy-utils.ts` | 132-142 | switchActiveOrganization - calls auth.api.setActiveOrganization and redirects |
| `src/lib/organizations/get-org.ts` | 56-130 | Core getOrg() logic that calls setActiveOrganization |
| `src/lib/organizations/get-org.ts` | 206-214 | getRequiredCurrentOrg() - main entry point used in 12+ pages |
| `src/lib/react/cache.ts` | 4-6 | getRequiredCurrentOrgCache() - cached RSC wrapper |
| `app/orgs/[orgSlug]/use-current-org.tsx` | 38-67 | Zustand store for client-side org context |
| `app/orgs/[orgSlug]/(navigation)/_navigation/org-auto-select.tsx` | 18-42 | Client component that calls setActive() on navigation |
| `app/orgs/[orgSlug]/layout.tsx` | 28-39 | Layout that injects org into Zustand store |
| `app/orgs/route.ts` | 40-45 | Calls setActiveOrganization before redirect |

### Current Architecture Pattern

**Session-Based Flow:**
1. User navigates to `/orgs/[orgSlug]`
2. Middleware extracts slug from URL (`proxy.ts:33`)
3. Middleware validates session and gets activeOrganisation (`proxy.ts:40`)
4. If slug doesn't match activeOrganisation, calls `switchActiveOrganization` (`proxy.ts:67`)
5. `switchActiveOrganization` calls `auth.api.setActiveOrganization` and redirects (`proxy-utils.ts:132-142`)
6. `OrgAutoSelect` component also calls `authClient.organization.setActive()` on mount
7. Server-side `getRequiredCurrentOrg()` reads `session.activeOrganizationId`
8. If mismatch, calls `auth.api.setActiveOrganization()` again to sync
9. Returns org data to page

**Multi-Tab Problem:**
- All tabs share the same HTTP session state
- Tab A shows Org "acme", Tab B shows Org "beta"
- When either tab navigates, middleware sets the active org in shared session
- Other tabs now operate on wrong organization silently
- This causes:
  - Hidden data leakage (viewing wrong org data)
  - Form submissions to wrong org
  - User confusion (URL says org-a but data is org-b)

### Files Using setActiveOrganization

**Server-Side (6 locations):**
1. `proxy-utils.ts:136` - In switchActiveOrganization helper
2. `app/orgs/route.ts:40-45` - Initial org redirect
3. `app/orgs/[orgSlug]/(navigation)/_navigation/org-list.tsx:44-51` - Org switcher form
4. `src/lib/organizations/get-org.ts:65-70` - By organizationId param
5. `src/lib/organizations/get-org.ts:87-92` - By organizationSlug param
6. `src/lib/organizations/get-org.ts:115-118` - Fallback to first org

**Client-Side (1 location):**
7. `app/orgs/[orgSlug]/(navigation)/_navigation/org-auto-select.tsx:31-33` - Auto-select on mount

### Pages Using getRequiredCurrentOrg (16 files)

1. `app/orgs/[orgSlug]/(navigation)/_navigation/org-navigation.tsx:17`
2. `app/orgs/[orgSlug]/(navigation)/settings/members/page.tsx`
3. `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/usage/page.tsx`
4. `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/plan/page.tsx`
5. `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/page.tsx`
6. `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/layout.tsx`
7. `src/lib/organizations/get-org.ts`
8. `app/orgs/[orgSlug]/layout.tsx`
9. `src/lib/react/cache.ts`
10. `src/lib/actions/safe-actions.ts`
11. `app/orgs/[orgSlug]/(navigation)/settings/page.tsx`
12. `app/orgs/[orgSlug]/(navigation)/settings/danger/page.tsx`
13. `app/orgs/[orgSlug]/(navigation)/settings/billing/success/page.tsx`
14. `app/orgs/[orgSlug]/(navigation)/settings/billing/cancel/page.tsx`
15. `app/orgs/[orgSlug]/(navigation)/settings/billing/(tabs)/payment/page.tsx`
16. `test/vitest.setup.ts`

### Better Auth Organization Plugin Capabilities

**Key Discovery:** The plugin already supports explicit org parameters!

```typescript
// Supported: Explicit slug-based lookup
await auth.api.getFullOrganization({
  headers: await headers(),
  query: { organizationSlug: slug }
});

// vs Current pattern (session-based)
await auth.api.getFullOrganization();  // Uses session.activeOrganizationId
```

**Supported Endpoints:**
- `getFullOrganization` - accepts `organizationSlug` or `organizationId` in query
- `getMembership` - accepts explicit org parameters for stateless backend
- `hasPermission` - needs verification if it accepts explicit org parameters
- All mutation endpoints accept `organizationId` in body

## Documentation Insights

### Better Auth Patterns
- **Query params for reads**: `getFullOrganization({ query: { organizationSlug } })`
- **Body params for mutations**: `inviteMember({ email, role })`
- **Stateless backend support**: `getMembership` enables explicit org context
- **Default behavior**: Falls back to `session.activeOrganizationId` if no explicit params

### Industry Best Practices (from web research)
- **URL-based routing is standard** for multi-tenant SaaS
- **Path-based slugs** (`/orgs/slug`) preferred over subdomains for local dev
- **Session-based active org is anti-pattern** for multi-tab scenarios
- **Resolve tenant at request edge** (middleware) and propagate explicitly
- **Multi-tab state**: Use localStorage + storage events OR BroadcastChannel API for sync
- **Tab isolation**: sessionStorage is tab-isolated, localStorage is shared
- **HTTP sessions shared**: All tabs on same domain share same session cookies

## Patterns Observed

### Middleware Pattern
- Middleware runs on every `/orgs/*` request
- Extracts slug from URL path
- Validates user has membership in org
- Currently: Sets activeOrganizationId in session and redirects
- Redis caching used for org membership lookups (60s TTL)

### Caching Strategy
- `getRequiredCurrentOrgCache()` uses React cache() for RSC deduplication
- `findUserOrganization()` uses Redis cache for membership validation
- Cache keys: `org-member:{slug}:{userId}` and `user-first-org:{userId}`

### Organization Data Flow
1. Middleware validates access and slug
2. Layout fetches full org data via getRequiredCurrentOrgCache()
3. Layout injects org into Zustand store for client components
4. Child pages reuse cached org data (same request)
5. Client components read from Zustand store

## Inferred Acceptance Criteria

Based on "Refactor organization context to use slug-based routing with middleware headers":

- [ ] AC1: Remove all calls to `setActiveOrganization` (both client and server-side)
- [ ] AC2: Update `getRequiredCurrentOrg()` to read slug from `x-org-slug` header instead of params
- [ ] AC3: Pass `organizationSlug` explicitly to Better Auth API calls
- [ ] AC4: Remove `OrgAutoSelect` component (no longer needed)
- [ ] AC5: Update Zustand store initialization to not depend on session sync
- [ ] AC6: Verify multi-tab support - different orgs in different tabs work independently
- [ ] AC7: Maintain backward compatibility with existing org-scoped pages
- [ ] AC8: Update org switching flow to use direct navigation only (no setActive calls)

---

## Step Complete

**Status:** ✓ Complete
**Files analyzed:** 16+ files
**setActiveOrganization calls found:** 7 locations
**Next:** step-02-plan.md
**Timestamp:** 2026-01-13T12:00:00Z
