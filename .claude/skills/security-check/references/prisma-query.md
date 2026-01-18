<prisma_query_security>

<overview>
**CRITICAL**: All Prisma queries accessing org-scoped data MUST filter by `organizationId`. Without this, any organization can access any other organization's data.

Multi-tenant models in this codebase:
- `Member` → `organizationId`
- `Invitation` → `organizationId`
- `Subscription` → `referenceId` (points to organization.id)
</overview>

<secure_patterns>

<server_action_pattern>
**Always use `ctx.org.id` from orgAction**:

```typescript
export const getProjects = orgAction
  .schema(z.object({}))
  .action(async ({ ctx: { org } }) => {
    // ✅ SECURE: org.id from validated context
    return prisma.project.findMany({
      where: { organizationId: org.id },
    });
  });
```

**For updates, always include org filter in where clause**:

```typescript
export const updateProject = orgAction
  .schema(z.object({ projectId: z.string(), name: z.string() }))
  .action(async ({ parsedInput, ctx: { org } }) => {
    // ✅ SECURE: Double filter prevents cross-tenant access
    return prisma.project.update({
      where: {
        id: parsedInput.projectId,
        organizationId: org.id,  // CRITICAL: Always include this
      },
      data: { name: parsedInput.name },
    });
  });
```
</server_action_pattern>

<api_route_pattern>
**Always use `ctx.organization.id` from orgRoute**:

```typescript
export const GET = orgRoute
  .handler(async (req, { ctx }) => {
    // ✅ SECURE: organization.id from validated context
    return prisma.member.findMany({
      where: { organizationId: ctx.organization.id },
    });
  });
```
</api_route_pattern>

<page_pattern>
**Always get org from `getRequiredCurrentOrgCache()` first**:

```typescript
export default async function MembersPage() {
  const org = await getRequiredCurrentOrgCache();

  // ✅ SECURE: org.id from validated helper
  const members = await prisma.member.findMany({
    where: { organizationId: org.id },
  });

  return <MembersList members={members} />;
}
```
</page_pattern>

<query_function_pattern>
**Query functions should receive orgId as parameter**:

```typescript
// src/query/org/get-org-projects.ts
export const getOrgProjects = async (orgId: string) => {
  // ✅ Caller must validate org membership
  return prisma.project.findMany({
    where: { organizationId: orgId },
  });
};

// Usage in page (after org validation)
const org = await getRequiredCurrentOrgCache();
const projects = await getOrgProjects(org.id);
```
</query_function_pattern>

</secure_patterns>

<dangerous_patterns>

<never_trust_user_input>
**NEVER use orgId from user input without validation**:

```typescript
// ❌ VULNERABLE: User can pass any orgId
export const getProjects = authAction
  .schema(z.object({ orgId: z.string() }))
  .action(async ({ parsedInput }) => {
    return prisma.project.findMany({
      where: { organizationId: parsedInput.orgId },
    });
  });

// ✅ SECURE: Use orgAction which validates membership
export const getProjects = orgAction
  .schema(z.object({}))
  .action(async ({ ctx: { org } }) => {
    return prisma.project.findMany({
      where: { organizationId: org.id },
    });
  });
```
</never_trust_user_input>

<never_skip_org_filter>
**NEVER query org-scoped data without org filter**:

```typescript
// ❌ VULNERABLE: Returns ALL projects across ALL orgs
const projects = await prisma.project.findMany({
  where: { status: "active" },
});

// ✅ SECURE: Scoped to current org
const org = await getRequiredCurrentOrgCache();
const projects = await prisma.project.findMany({
  where: {
    organizationId: org.id,
    status: "active",
  },
});
```
</never_skip_org_filter>

<never_update_without_org_filter>
**NEVER update/delete without org filter**:

```typescript
// ❌ VULNERABLE: Can delete ANY project by ID
await prisma.project.delete({
  where: { id: projectId },
});

// ✅ SECURE: Can only delete project in user's org
await prisma.project.delete({
  where: {
    id: projectId,
    organizationId: org.id,
  },
});
```
</never_update_without_org_filter>

</dangerous_patterns>

<special_cases>

<unique_id_lookups>
**Unique ID lookups (invitations, tokens)**:

When looking up by a cryptographically random unique ID, org filter may not be needed IF:
1. The ID is globally unique and unguessable
2. The ID was generated securely (UUID v4, cuid, etc.)
3. Additional validation happens after lookup

```typescript
// ✅ ACCEPTABLE: Invitation ID is cryptographically random
const invitation = await prisma.invitation.findUnique({
  where: { id: invitationId },
});

// Still validate after lookup
if (invitation.email !== currentUserEmail) {
  throw new Error("Not your invitation");
}
```
</unique_id_lookups>

<admin_routes>
**Admin routes can query across orgs**:

```typescript
// ✅ ACCEPTABLE: Admin-only, intentionally cross-org
export const listAllOrgs = adminAction
  .action(async () => {
    return prisma.organization.findMany();
  });
```
</admin_routes>

<subscription_queries>
**Subscriptions use `referenceId` instead of `organizationId`**:

```typescript
// ✅ CORRECT: Subscription links via referenceId
const subscription = await prisma.subscription.findFirst({
  where: {
    referenceId: org.id,  // referenceId = organization.id
    status: "active",
  },
});
```
</subscription_queries>

</special_cases>

<checklist>
**For every Prisma query, verify:**

- [ ] Uses `ctx.org.id` (server action) or `ctx.organization.id` (API route) or validated `org.id` (page)
- [ ] Never uses user-provided orgId without orgAction/orgRoute validation
- [ ] Update/delete queries include `organizationId` in where clause
- [ ] findMany queries always filter by organizationId
- [ ] Admin queries are protected by adminAction
- [ ] Unique ID lookups have post-lookup validation if needed

**Quick reference - where does org.id come from?**

| Context | Get org from | Trust level |
|---------|-------------|-------------|
| Server action | `ctx.org.id` (orgAction) | ✅ Validated |
| API route | `ctx.organization.id` (orgRoute) | ✅ Validated |
| Page/Layout | `getRequiredCurrentOrgCache()` | ✅ Validated |
| Query function | Parameter (caller validates) | ⚠️ Caller must validate |
</checklist>

<common_mistakes>

**Mistake 1: Using authAction instead of orgAction**
```typescript
// ❌ authAction doesn't validate org membership
export const getOrgData = authAction.action(...)

// ✅ orgAction validates org membership
export const getOrgData = orgAction.action(...)
```

**Mistake 2: Forgetting org filter on related queries**
```typescript
// ❌ Gets ALL members, not just org members
const projects = await prisma.project.findMany({
  where: { organizationId: org.id },
  include: { members: true },  // Gets ALL members!
});

// ✅ Filter related data too
const projects = await prisma.project.findMany({
  where: { organizationId: org.id },
  include: {
    members: {
      where: { organizationId: org.id },
    },
  },
});
```

**Mistake 3: Not filtering in count queries**
```typescript
// ❌ Counts ALL projects
const count = await prisma.project.count();

// ✅ Counts only org projects
const count = await prisma.project.count({
  where: { organizationId: org.id },
});
```
</common_mistakes>

</prisma_query_security>
