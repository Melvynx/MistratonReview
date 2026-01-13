# APEX Task: 01-refactor-org-slug-routing

**Created:** 2026-01-13
**Task:** Refactor organization context to use slug-based routing instead of session-based setActiveOrganization

## Flags
- Auto mode: false
- Examine mode: false
- Save mode: true (retroactively enabled)
- Test mode: false
- Economy mode: false
- Branch mode: false
- PR mode: false

## User Request

Refactor the organization context management system to use slug-based routing with middleware headers instead of session-based `setActiveOrganization`. This will enable multi-tab support where each tab can independently work with different organizations without conflicts.

## Architecture Overview

### Current Architecture (Session-Based)
- Middleware extracts slug → checks session activeOrganizationId → calls setActiveOrganization → redirects
- Pages drill orgSlug through props → pass to getRequiredCurrentOrg
- All tabs share the same session.activeOrganizationId causing conflicts

### Target Architecture (Slug-Based with Headers)
- Middleware extracts slug → validates user membership → sets `x-org-slug` header → continues (no redirect)
- Pages call getRequiredCurrentOrg() with no params → reads slug from headers automatically
- Each tab maintains independent context via URL

### Key Benefits
- ✅ Zero props drilling
- ✅ No session state manipulation
- ✅ No unnecessary redirects (faster)
- ✅ Cleaner page code
- ✅ Multi-tab support out of the box

## Acceptance Criteria

- [ ] AC1: Remove all calls to setActiveOrganization (both client and server-side)
- [ ] AC2: Update getRequiredCurrentOrg() to read slug from headers instead of params
- [ ] AC3: Pass organizationSlug explicitly to Better Auth API calls
- [ ] AC4: Remove OrgAutoSelect component (no longer needed)
- [ ] AC5: Update Zustand store initialization to not depend on session sync
- [ ] AC6: Verify multi-tab support - different orgs in different tabs work independently
- [ ] AC7: Maintain backward compatibility with existing org-scoped pages
- [ ] AC8: Update org switching flow in org-list.tsx to use direct navigation only

## Progress Tracking

| Step | Name | Status | Started | Completed |
|------|------|--------|---------|-----------|
| 01 | Analyze | ✅ Complete | 2026-01-13 | 2026-01-13 |
| 02 | Plan | ✅ Complete | 2026-01-13 | 2026-01-13 |
| 03 | Execute | ⏳ Pending | - | - |
| 04 | Validate | ⏳ Pending | - | - |

## Notes

- Better Auth organization plugin already supports explicit `organizationSlug` parameters
- Industry best practice: URL-based routing is standard for multi-tenant SaaS
- Session-based active org is a known anti-pattern for multi-tab scenarios
