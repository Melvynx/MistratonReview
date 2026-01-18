<e2e_testing_guide>

<overview>
E2E tests in NowTS use Playwright for full browser testing. Tests are located in `e2e/` directory and interact with a real browser and database.
</overview>

<configuration>
**playwright.config.ts settings:**
- Timeout: 70 seconds
- Browser: Chromium (Desktop Chrome)
- Retries: 1
- Workers: 3
- Video: On first retry
- Viewport: 1280x720
- Base URL: From environment
- Global teardown: Cleans test users
</configuration>

<test_utilities>

<auth_helpers>
**Location:** `e2e/utils/auth-test.ts`

**createTestAccount** - Create and sign up a new test user:
```typescript
import { createTestAccount } from "./utils/auth-test";

const userData = await createTestAccount({
  page,
  callbackURL: "/orgs",           // Redirect after signup
  initialUserData: {               // Optional custom data
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePass123",
  },
  admin: true,                     // Optional: make user admin
});

// Returns: { name, email, password }
```

**signInAccount** - Sign in existing user:
```typescript
import { signInAccount } from "./utils/auth-test";

await signInAccount({
  page,
  userData: { email: "user@test.com", password: "password" },
  callbackURL: "/dashboard",
});
```

**signOutAccount** - Sign out current user:
```typescript
import { signOutAccount } from "./utils/auth-test";

await signOutAccount({ page });
```

**getUserEmail** - Generate unique test email:
```typescript
import { getUserEmail } from "./utils/auth-test";

const email = getUserEmail(); // "playwright-test-random@example.com"
```
</auth_helpers>

<retry_helper>
**Location:** `e2e/utils/retry.ts`

Exponential backoff for eventual consistency:

```typescript
import { retry } from "./utils/retry";

const user = await retry(
  async () =>
    prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    }),
  {
    maxAttempts: 5,
    delayMs: 1000,
    backoff: true,  // Exponential backoff
  },
);
```
</retry_helper>

</test_utilities>

<test_patterns>

<pattern name="basic_auth_flow">
**Simple signup and verification:**

```typescript
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { prisma } from "@/lib/prisma";

test("sign up and verify account creation", async ({ page }) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/orgs",
  });

  await page.waitForURL(/\/orgs\/.*/);

  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/orgs\/.*/);

  // Verify database state
  const user = await prisma.user.findUnique({
    where: { email: userData.email },
    include: {
      members: {
        include: { organization: true },
      },
    },
  });

  expect(user).not.toBeNull();
  expect(user?.name).toBe(userData.name);
  expect(user?.members.length).toBeGreaterThan(0);
});
```
</pattern>

<pattern name="organization_workflow">
**Organization member invitation flow:**

```typescript
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount, getUserEmail } from "./utils/auth-test";
import { prisma } from "@/lib/prisma";

test("invite and login as invited user", async ({ page }) => {
  // 1. Create owner account
  const ownerData = await createTestAccount({
    page,
    callbackURL: "/orgs",
  });

  await page.waitForURL(/\/orgs\/.*/, { timeout: 30000 });

  // Extract org slug from URL
  const currentUrl = page.url();
  const orgSlug = currentUrl.split("/orgs/")[1].split("/")[0];

  // 2. Navigate to members and invite
  await page.goto(`/orgs/${orgSlug}/settings/members`);
  await page.getByRole("button", { name: /invite/i }).click();

  const memberEmail = getUserEmail();
  await page.getByLabel("Email").fill(memberEmail);

  // Select role
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Admin" }).click();

  await page.getByRole("button", { name: /invite/i }).click();

  // Wait for dialog to close
  await page
    .getByRole("dialog", { name: /invite teammates/i })
    .waitFor({ state: "hidden", timeout: 10000 });

  // 3. Verify invitation in list
  await page.getByRole("tab", { name: /invitations/i }).click();
  await expect(page.getByText(memberEmail)).toBeVisible();

  // 4. Log out and create invited user account
  await signOutAccount({ page });

  const invitedUserData = {
    email: memberEmail,
    password: "SecurePass123",
    name: "Invited User",
  };

  await createTestAccount({
    page,
    callbackURL: "/account",
    initialUserData: invitedUserData,
  });

  // 5. Accept invitation
  const invitation = await prisma.invitation.findFirst({
    where: { email: memberEmail },
    orderBy: { expiresAt: "desc" },
  });

  await page.goto(`/orgs/accept-invitation/${invitation!.id}`);
  await page.getByRole("button", { name: /accept invitation/i }).click();

  // 6. Verify membership
  await expect(page).toHaveURL(new RegExp(`/orgs/${orgSlug}`));

  await page.goto(`/orgs/${orgSlug}/settings/members`);
  await page.waitForLoadState("networkidle");

  const membersSection = page.getByLabel("Members");
  await expect(membersSection.getByText(ownerData.email)).toBeVisible();
  await expect(membersSection.getByText(memberEmail)).toBeVisible();
});
```
</pattern>

<pattern name="admin_access">
**Admin dashboard tests:**

```typescript
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount, signInAccount } from "./utils/auth-test";

test.describe("admin", () => {
  test("verify admin dashboard access", async ({ page }) => {
    // Create admin user
    const user = await createTestAccount({
      page,
      callbackURL: "/orgs",
      admin: true,  // Makes user admin in database
    });

    await signOutAccount({ page });

    // Sign in as admin
    await signInAccount({
      page,
      userData: { email: user.email, password: user.password },
      callbackURL: "/admin",
    });

    await page.goto("/admin");

    // Verify admin navigation
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Organizations" })).toBeVisible();

    await page.getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL("/admin/users");

    await page.getByRole("link", { name: "Organizations" }).click();
    await expect(page).toHaveURL("/admin/organizations");
  });
});
```
</pattern>

<pattern name="form_interactions">
**Form filling and submission:**

```typescript
test("fill and submit form", async ({ page }) => {
  await page.goto("/form-page");

  // Fill text inputs
  await page.getByLabel("Name").fill("John Doe");
  await page.getByLabel("Email").fill("john@example.com");

  // Fill password fields
  await page.locator('input[name="password"]').fill("SecurePass123");

  // Select from dropdown
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Option 1" }).click();

  // Check checkbox
  await page.getByLabel("I agree").check();

  // Submit
  await page.getByRole("button", { name: /submit/i }).click();

  // Verify success
  await expect(page.getByText("Success")).toBeVisible();
});
```
</pattern>

<pattern name="navigation_verification">
**URL and navigation testing:**

```typescript
test("navigation flow", async ({ page }) => {
  await page.goto("/start");

  // Click navigation
  await page.getByRole("link", { name: "Dashboard" }).click();

  // Verify URL
  await expect(page).toHaveURL("/dashboard");

  // Wait for specific URL pattern
  await page.waitForURL(/\/dashboard\/.*/);

  // Verify URL contains parameter
  const url = page.url();
  expect(url).toContain("/dashboard/");
});
```
</pattern>

<pattern name="database_verification">
**Direct database state checks:**

```typescript
import { prisma } from "@/lib/prisma";
import { retry } from "./utils/retry";

test("verify database state", async ({ page }) => {
  // ... perform actions ...

  // Use retry for eventual consistency
  const record = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({
        where: { email: "test@example.com" },
      }),
    { maxAttempts: 5, delayMs: 1000, backoff: true },
  );

  expect(record.name).toBe("Expected Name");

  // Verify relations
  const userWithRelations = await prisma.user.findUnique({
    where: { email: "test@example.com" },
    include: {
      members: {
        include: { organization: true },
      },
    },
  });

  expect(userWithRelations?.members.length).toBeGreaterThan(0);
});
```
</pattern>

<pattern name="dialog_interactions">
**Modal and dialog handling:**

```typescript
test("dialog interaction", async ({ page }) => {
  await page.goto("/page-with-dialog");

  // Open dialog
  await page.getByRole("button", { name: "Open Dialog" }).click();

  // Verify dialog appeared
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Dialog Title")).toBeVisible();

  // Fill dialog form
  await page.getByPlaceholderText("Enter value").fill("Test input");

  // Confirm dialog
  await page.getByRole("button", { name: "Confirm" }).click();

  // Wait for dialog to close
  await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 10000 });
});
```
</pattern>

<pattern name="wait_patterns">
**Proper waiting strategies:**

```typescript
test("waiting patterns", async ({ page }) => {
  // Wait for URL
  await page.waitForURL(/\/expected-path/);
  await page.waitForURL("/exact-path", { timeout: 30000 });

  // Wait for network idle
  await page.waitForLoadState("networkidle");

  // Wait for element state
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("Loading").waitFor({ state: "detached" });

  // Wait for element visibility
  await expect(page.getByText("Content")).toBeVisible({ timeout: 10000 });

  // Manual timeout (use sparingly)
  await page.waitForTimeout(2000);
});
```
</pattern>

</test_patterns>

<organization_logic>
**Handling organization context in tests:**

1. **Extract org slug from URL after login:**
```typescript
const currentUrl = page.url();
const orgSlug = currentUrl.split("/orgs/")[1].split("/")[0];
```

2. **Navigate to org-specific pages:**
```typescript
await page.goto(`/orgs/${orgSlug}/settings`);
await page.goto(`/orgs/${orgSlug}/settings/members`);
```

3. **Verify org membership:**
```typescript
const user = await prisma.user.findUnique({
  where: { email: userData.email },
  include: {
    members: {
      include: { organization: true },
    },
  },
});

const userOrg = user?.members[0].organization;
expect(userOrg?.slug).toBe(orgSlug);
```

4. **Test multi-user org workflows:**
```typescript
// Create owner, perform actions
const ownerData = await createTestAccount({ page, callbackURL: "/orgs" });
// ... owner actions ...

// Sign out and create/sign in as member
await signOutAccount({ page });
const memberData = await createTestAccount({ page });
// ... member actions ...
```
</organization_logic>

<global_teardown>
**Test data cleanup (automatic):**

The `e2e/global-teardown.ts` automatically cleans test users:

```typescript
async function globalTeardown() {
  const count = await prisma.user.deleteMany({
    where: {
      email: { contains: "playwright-test-" },
    },
  });
  console.info(`Cleanup ${count} test users`);
}
```

Test emails should use `getUserEmail()` which generates `playwright-test-*` emails.
</global_teardown>

<locators>
**Recommended Playwright locators:**

```typescript
// By role (preferred - accessible)
page.getByRole("button", { name: "Submit" })
page.getByRole("link", { name: "Dashboard" })
page.getByRole("textbox", { name: "Email" })
page.getByRole("combobox")
page.getByRole("option", { name: "Option" })
page.getByRole("tab", { name: "Settings" })
page.getByRole("dialog")

// By label (form fields)
page.getByLabel("Email")
page.getByLabel("Password")

// By text
page.getByText("Welcome")
page.getByText(/partial match/i)

// By placeholder
page.getByPlaceholderText("Enter email")

// By name attribute
page.locator('input[name="password"]')

// By test ID (fallback)
page.getByTestId("submit-button")

// Nested locators
page.getByLabel("Members").getByText(email)
page.getByText(email).locator("..").locator("..")
```
</locators>

<best_practices>
1. **Use auth helpers** - `createTestAccount`, `signInAccount`, `signOutAccount`
2. **Generate unique emails** - Use `getUserEmail()` for cleanup
3. **Wait properly** - Use `waitForURL`, `waitForLoadState`, not arbitrary timeouts
4. **Verify database state** - Use Prisma directly with retry for consistency
5. **Extract org slug** - Parse URL after login for org-specific navigation
6. **Handle dialogs** - Wait for state changes, not arbitrary delays
7. **Use accessible locators** - Prefer `getByRole`, `getByLabel` over CSS selectors
8. **Test full user journeys** - Not just isolated actions
</best_practices>

<debugging>
**Debug failing tests:**

```bash
# Run with headed browser
pnpm test:e2e

# Run specific test file
npx playwright test e2e/signup.spec.ts

# Run with debug mode
npx playwright test --debug

# View test report
npx playwright show-report
```

Videos are automatically captured on first retry for failed tests.
</debugging>

</e2e_testing_guide>
