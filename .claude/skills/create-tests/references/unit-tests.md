<unit_testing_guide>

<overview>
Unit tests in NowTS use Vitest with React Testing Library. Tests are located in `__tests__/` directory and use `happy-dom` environment for lightweight DOM simulation.
</overview>

<configuration>
**vitest.config.mjs settings:**
- Environment: `happy-dom`
- Global setup: `test/vitest.setup.ts`
- Path aliases: `@/`, `@email/`, `@app/`, `@test/`
- Test pattern: `__tests__/**/*.[jt]s?(x)`
</configuration>

<test_setup_helper>
Always use the `setup()` helper from `@test/setup`:

```typescript
import { setup } from "@test/setup";
import { screen, waitFor } from "@testing-library/react";

const { user } = setup(<MyComponent />);

// user = userEvent instance for interactions
// screen = RTL screen queries
```

The helper wraps components with `QueryClientProvider` and provides `userEvent.setup()`.
</test_setup_helper>

<global_mocks>
Available mocks in `test/vitest.setup.ts`:

**localStorage**
```typescript
// Full mock implementation with get/set/remove/clear
localStorage.setItem("key", "value");
localStorage.getItem("key"); // "value"
```

**Prisma**
```typescript
import { prisma } from "@/lib/prisma";
import { mockDeep } from "vitest-mock-extended";

// prisma is a deep mock
prisma.user.findUnique.mockResolvedValue({ id: "1", name: "Test" });
```

**Auth**
```typescript
import { getUser, getRequiredUser } from "@/lib/auth/auth-user";
import { getCurrentOrg, getRequiredCurrentOrg } from "@/lib/organizations/get-org";

// Mock return values
vi.mocked(getUser).mockResolvedValue({ id: "1", email: "test@test.com" });
vi.mocked(getCurrentOrg).mockResolvedValue({ id: "org1", slug: "test-org" });
```

**Toast**
```typescript
import { toast } from "sonner";

// Verify toast calls
expect(toast.success).toHaveBeenCalledWith("Success message");
expect(toast.error).toHaveBeenCalledWith("Error message");
```

**URL Search Params**
```typescript
// Helper to create mock search params
createTestSearchParams({ page: "1", search: "test" });
```
</global_mocks>

<test_patterns>

<pattern name="utility_functions">
**Simple utility tests - no special setup needed:**

```typescript
import { describe, expect, it } from "vitest";
import { formatId, generateSlug } from "@/lib/id";

describe("id utilities", () => {
  describe("formatId", () => {
    it("should replace spaces with hyphens", () => {
      expect(formatId("hello world")).toBe("hello-world");
    });

    it("should remove special characters", () => {
      expect(formatId("hello@world!")).toBe("helloworld");
    });
  });

  describe("generateSlug", () => {
    it("should format the input string and append a random ID", () => {
      const slug = generateSlug("Hello World");
      expect(slug).toMatch(/^hello-world-[a-f0-9]{4}$/);
    });
  });
});
```
</pattern>

<pattern name="schema_validation">
**Zod schema validation tests:**

```typescript
import { describe, expect, it } from "vitest";
import { AuthPermissionSchema, type AuthPermission } from "@/lib/auth-permissions";

describe("AuthPermissionSchema", () => {
  it("should validate valid permission objects", () => {
    const validPermissions: AuthPermission = {
      project: ["create"],
    };

    const result = AuthPermissionSchema.safeParse(validPermissions);
    expect(result.success).toBe(true);
  });

  it("should refuse invalid permission objects", () => {
    const invalidPermissions = {
      project: ["create", "invalid"],
    };

    const result = AuthPermissionSchema.safeParse(invalidPermissions);
    expect(result.success).toBe(false);
  });
});
```
</pattern>

<pattern name="server_actions">
**Server action tests with resolveActionResult:**

```typescript
import { describe, expect, it } from "vitest";
import { resolveActionResult } from "@/lib/actions/actions-utils";

describe("resolveActionResult", () => {
  it("should resolve with data for successful action", async () => {
    const actionData = { id: "123" };
    const actionPromise = Promise.resolve({
      data: actionData,
      serverError: undefined,
      validationError: undefined,
    });

    const result = await resolveActionResult(actionPromise);
    expect(result).toEqual(actionData);
  });

  it("should reject with serverError for failed action", async () => {
    const serverError = "Server error occurred";
    const actionPromise = Promise.resolve({
      data: undefined,
      serverError,
      validationError: undefined,
    });

    await expect(resolveActionResult(actionPromise)).rejects.toThrow(serverError);
  });

  it("should reject with formatted validation errors", async () => {
    const validationErrors = {
      fieldErrors: {
        name: ["Name is required"],
        email: ["Invalid email format"],
      },
    };

    const actionPromise = Promise.resolve({
      data: undefined,
      serverError: undefined,
      validationErrors,
    });

    await expect(resolveActionResult(actionPromise)).rejects.toThrow();
  });
});
```
</pattern>

<pattern name="component_testing">
**Component tests with setup helper:**

```typescript
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setup } from "@test/setup";

const TestComponent = ({ onSubmit = vi.fn() }) => {
  return (
    <form onSubmit={onSubmit}>
      <input data-testid="name-input" />
      <button data-testid="submit-button">Submit</button>
    </form>
  );
};

describe("TestComponent", () => {
  it("should handle user interactions", async () => {
    const onSubmit = vi.fn();
    const { user } = setup(<TestComponent onSubmit={onSubmit} />);

    const nameInput = screen.getByTestId("name-input");
    await user.type(nameInput, "John Doe");

    const submitButton = screen.getByTestId("submit-button");
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalled();
  });
});
```
</pattern>

<pattern name="form_testing">
**Form validation tests (using useZodForm from ui/form):**

```typescript
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setup } from "@test/setup";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const mockSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.email("Please enter a valid email"),
});

type FormValues = z.infer<typeof mockSchema>;

const TestForm = ({
  onSubmit = vi.fn(),
  submitOnBlur = false,
}: {
  onSubmit?: (values: FormValues) => void;
  submitOnBlur?: boolean;
}) => {
  const form = useZodForm({
    schema: mockSchema,
    defaultValues: { name: "", email: "" },
  });

  return (
    <Form form={form} onSubmit={onSubmit} submitOnBlur={submitOnBlur}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input data-testid="name-input" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input data-testid="email-input" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </Form>
  );
};

describe("Form validation", () => {
  it("should show validation errors", async () => {
    const onSubmit = vi.fn();
    const { user } = setup(<TestForm onSubmit={onSubmit} />);

    // Try to submit with empty fields
    await user.click(screen.getByTestId("submit-button"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
  });

  it("should submit with valid data", async () => {
    const onSubmit = vi.fn();
    const { user } = setup(<TestForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId("name-input"), "John Doe");
    await user.type(screen.getByTestId("email-input"), "john@example.com");
    await user.click(screen.getByTestId("submit-button"));

    await waitFor(
      () => {
        expect(onSubmit).toHaveBeenCalledWith(
          { name: "John Doe", email: "john@example.com" },
          expect.anything(),
        );
      },
      { timeout: 500 },
    );
  }, 500);

  it("should auto-disable fields during async submission", async () => {
    const slowSubmit = vi.fn().mockImplementation(
      async () => new Promise((resolve) => setTimeout(resolve, 50)),
    );

    const { user } = setup(<TestForm onSubmit={slowSubmit} />);

    await user.type(screen.getByTestId("name-input"), "John Doe");
    await user.type(screen.getByTestId("email-input"), "john@example.com");
    await user.click(screen.getByTestId("submit-button"));

    // Check disabled state during submission
    expect(screen.getByTestId("name-input")).toBeDisabled();
    expect(screen.getByTestId("submit-button")).toBeDisabled();

    await waitFor(
      () => {
        expect(screen.getByTestId("name-input")).not.toBeDisabled();
      },
      { timeout: 500 },
    );
  }, 500);
});
```
</pattern>

<pattern name="store_testing">
**Zustand store tests:**

```typescript
import { describe, expect, it, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setup } from "@test/setup";
import { useDialogStore, dialogManager } from "@/features/dialog-manager";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function DialogManagerWrapper() {
  const activeDialog = useDialogStore((state) => state.activeDialog);
  return activeDialog ? <DialogComponent dialog={activeDialog} /> : null;
}

describe("Dialog Manager", () => {
  beforeEach(() => {
    // Reset store state before each test
    useDialogStore.setState({ dialogs: [], activeDialog: null });
    vi.clearAllMocks();
  });

  it("should render confirm dialog and handle action", async () => {
    const actionFn = vi.fn().mockResolvedValue(undefined);

    dialogManager.confirm({
      title: "Confirmation Dialog",
      description: "Please confirm this action",
      action: {
        label: "Confirm",
        onClick: actionFn,
      },
    });

    const { user } = setup(<DialogManagerWrapper />);

    expect(screen.getByText("Confirmation Dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(actionFn).toHaveBeenCalled();

    await waitFor(() => {
      expect(useDialogStore.getState().activeDialog).toBeNull();
    });
  });
});
```
</pattern>

<pattern name="async_testing">
**Testing async operations:**

```typescript
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setup } from "@test/setup";

describe("Async Component", () => {
  it("should disable inputs during async submission", async () => {
    const slowSubmit = vi.fn().mockImplementation(
      async () => new Promise((resolve) => setTimeout(resolve, 50)),
    );

    const { user } = setup(<AsyncForm onSubmit={slowSubmit} />);

    await user.type(screen.getByTestId("input"), "value");
    await user.click(screen.getByTestId("submit"));

    // Check disabled state during submission
    expect(screen.getByTestId("input")).toBeDisabled();
    expect(screen.getByTestId("submit")).toBeDisabled();

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByTestId("input")).not.toBeDisabled();
      },
      { timeout: 500 },
    );
  }, 500);
});
```
</pattern>

</test_patterns>

<best_practices>
1. **Use setup() helper** - Provides QueryClient and userEvent
2. **Use screen queries** - Prefer over destructured render results
3. **Reset state in beforeEach** - For store/stateful tests
4. **Mock external dependencies** - Use vi.mock() at top of file
5. **Test user interactions** - Use userEvent (user.type, user.click)
6. **Handle async properly** - Use waitFor with timeout
7. **Test edge cases** - Invalid inputs, errors, loading states
8. **Keep tests focused** - One behavior per test
</best_practices>

<common_queries>
```typescript
// By test ID (preferred for stability)
screen.getByTestId("submit-button")

// By role (accessible queries)
screen.getByRole("button", { name: "Submit" })
screen.getByRole("textbox", { name: "Email" })

// By text
screen.getByText("Welcome")
screen.getByText(/partial match/i)

// By label
screen.getByLabelText("Email")

// Query variants
screen.queryByText("May not exist") // returns null if not found
screen.findByText("Async content")  // returns promise
```
</common_queries>

</unit_testing_guide>
