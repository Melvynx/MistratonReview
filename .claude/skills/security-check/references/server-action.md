<server_action_security>

<overview>
Server actions use `next-safe-action` with four action clients from `@/lib/actions/safe-actions.ts`.
</overview>

<action_clients>

<public_action>
**Import**: `import { action } from "@/lib/actions/safe-actions"`

Use for: Public operations with no auth required (contact forms, public data fetch)

```typescript
export const publicAction = action
  .schema(z.object({ email: z.string().email() }))
  .action(async ({ parsedInput }) => {
    // No ctx.user available
    return { success: true };
  });
```

**Security check**: Verify no sensitive data is accessed or modified.
</public_action>

<auth_action>
**Import**: `import { authAction } from "@/lib/actions/safe-actions"`

Use for: User-specific operations (update profile, user settings)

```typescript
export const updateProfile = authAction
  .schema(z.object({ name: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user available - authenticated user
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { name: parsedInput.name }
    });
  });
```

**Security check**:
- Always use `ctx.user.id` for user-specific queries
- Never trust client-provided user IDs
</auth_action>

<org_action>
**Import**: `import { orgAction } from "@/lib/actions/safe-actions"`

Use for: Organization-scoped operations (team data, org settings)

```typescript
// Basic org membership check
export const getOrgData = orgAction
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    // ctx.org available - validated org membership
    return prisma.project.findMany({
      where: { organizationId: ctx.org.id }
    });
  });

// With role requirement
export const adminOnlyAction = orgAction
  .schema(z.object({}))
  .metadata({ roles: ["admin", "owner"] })
  .action(async ({ ctx }) => {
    // Only admins/owners reach here
  });

// With permission requirement
export const manageSubscription = orgAction
  .schema(z.object({ planId: z.string() }))
  .metadata({ permissions: { subscription: ["manage"] } })
  .action(async ({ ctx }) => {
    // Only users with subscription:manage permission
  });
```

**Security check**:
- Always use `ctx.org.id` for org-scoped queries
- Add `metadata.roles` for role-restricted actions
- Add `metadata.permissions` for permission-restricted actions
</org_action>

<admin_action>
**Import**: `import { adminAction } from "@/lib/actions/safe-actions"`

Use for: System admin operations (user management, system settings)

```typescript
export const deleteUser = adminAction
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user.role === "admin" guaranteed
    await prisma.user.delete({ where: { id: parsedInput.userId } });
  });
```

**Security check**: Verify action truly requires system-wide admin access.
</admin_action>

</action_clients>

<available_permissions>
From `@/lib/auth/auth-permissions.ts`:

```typescript
{
  project: ["create", "share", "update", "delete"],
  subscription: ["manage"],
  users: ["create", "delete"],
  member: ["create", "update", "delete"]  // from better-auth defaults
}
```

Roles: `member`, `admin`, `owner` (owner has all permissions)

**Role capabilities**:
- `member`: Can create projects and users
- `admin`: Can create/update projects, manage subscriptions, delete users
- `owner`: Full access to all permissions

**Note**: `isInRoles()` uses AND logic - user must have ALL specified roles.
</available_permissions>

<checklist>
- [ ] Uses correct action client for security level
- [ ] Org actions use `ctx.org.id` not client-provided orgId
- [ ] Auth actions use `ctx.user.id` not client-provided userId
- [ ] Destructive/sensitive actions have role/permission metadata
- [ ] No sensitive data in return values (passwords, tokens)
- [ ] Input validated with Zod schema
</checklist>

</server_action_security>
