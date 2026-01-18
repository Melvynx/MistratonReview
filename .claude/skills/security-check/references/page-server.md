<page_security>

<overview>
Pages and layouts protect content using auth helpers from `@/lib/auth/auth-user.ts` and `@/lib/organizations/get-org.ts`.
</overview>

<auth_helpers>

<get_user>
**Import**: `import { getUser, getRequiredUser } from "@/lib/auth/auth-user"`

```typescript
// Optional - returns user or null
const user = await getUser();
if (user) {
  // Show logged-in content
}

// Required - throws unauthorized() if no user
const user = await getRequiredUser();
// User guaranteed here
```
</get_user>

<get_admin>
**Import**: `import { getRequiredAdmin } from "@/lib/auth/auth-user"`

```typescript
// Validates user.role === "admin", throws if not
const admin = await getRequiredAdmin();
```
</get_admin>

<get_org>
**Import**: `import { getRequiredCurrentOrg, getRequiredCurrentOrgCache } from "@/lib/organizations/get-org"`

```typescript
// Validates org membership, throws if not member
const org = await getRequiredCurrentOrg();

// With role requirement
const org = await getRequiredCurrentOrg({ roles: ["admin", "owner"] });

// With permission requirement
const org = await getRequiredCurrentOrg({
  permissions: { project: ["create"] }
});

// Cached version (use in layouts, reuse in child pages)
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
const org = await getRequiredCurrentOrgCache();
```

**Returns**: `org` object with:
- `id`, `name`, `slug`, `logo`, `metadata`, `createdAt`
- `stripeCustomerId` - Stripe customer ID
- `memberRoles` - Current user's roles in this org
- `subscription` - Active subscription (or null)
- `limits` - Plan limits
- `user` - Current user object
- `email` - Owner's email
</get_org>

<has_permission>
**Import**: `import { hasPermission } from "@/lib/auth/auth-org"`

For conditional UI rendering:

```typescript
const canInvite = await hasPermission({ member: ["create"] });

return (
  <div>
    {canInvite && <InviteMemberButton />}
  </div>
);
```
</has_permission>

</auth_helpers>

<page_patterns>

<public_page>
```typescript
// No auth check needed
export default async function PublicPage() {
  return <div>Public content</div>;
}
```
</public_page>

<authenticated_page>
```typescript
export default async function AccountPage() {
  const user = await getRequiredUser();

  return <div>Welcome {user.name}</div>;
}
```
</authenticated_page>

<org_page>
```typescript
export default async function OrgDashboard() {
  const org = await getRequiredCurrentOrgCache();

  return <div>Org: {org.name}</div>;
}
```
</org_page>

<admin_page>
```typescript
export default async function AdminDashboard() {
  await getRequiredAdmin();

  return <div>Admin only content</div>;
}
```
</admin_page>

<conditional_content>
```typescript
export default async function OrgPage() {
  const org = await getRequiredCurrentOrgCache();
  const canManageUsers = await hasPermission({ users: ["create"] });

  return (
    <div>
      <h1>{org.name}</h1>
      {canManageUsers && <UserManagement />}
    </div>
  );
}
```
</conditional_content>

</page_patterns>

<layout_patterns>

<protected_layout>
Protect all child pages at layout level:

```typescript
// app/(logged-in)/layout.tsx
export default async function LoggedInLayout({ children }) {
  await getRequiredUser();
  return <>{children}</>;
}
```
</protected_layout>

<org_layout>
```typescript
// app/orgs/[orgSlug]/layout.tsx
export default async function OrgLayout({ children }) {
  const org = await getRequiredCurrentOrgCache();

  return (
    <OrgProvider org={org}>
      <OrgSidebar memberRoles={org.memberRoles} />
      {children}
    </OrgProvider>
  );
}
```
</org_layout>

</layout_patterns>

<common_mistakes>
1. **Fetching org data without validation**
   - Wrong: `prisma.org.findUnique({ where: { slug } })`
   - Right: `await getRequiredCurrentOrg()`

2. **Using user ID from params**
   - Wrong: `prisma.user.findUnique({ where: { id: params.userId } })`
   - Right: `const user = await getRequiredUser(); prisma...({ where: { id: user.id } })`

3. **Missing auth in layouts**
   - Child pages assume protection but layout has no auth check

4. **Exposing sensitive data in RSC**
   - Returning full user object to client components
</common_mistakes>

<checklist>
- [ ] Pages accessing user data call `getRequiredUser()` or have protected layout
- [ ] Org pages call `getRequiredCurrentOrg()` or `getRequiredCurrentOrgCache()`
- [ ] Admin pages call `getRequiredAdmin()`
- [ ] Conditional UI uses `hasPermission()` not role checks
- [ ] Layouts protect all child routes appropriately
- [ ] No sensitive data passed to client components
- [ ] Database queries use validated IDs from auth helpers
</checklist>

</page_security>
