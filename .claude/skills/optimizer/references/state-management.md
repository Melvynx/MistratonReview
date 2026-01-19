<state_management_reference>
<overview>
Complete patterns for client-side state management using Zustand. Covers store creation, persistence, selectors, and integration with React components.
</overview>

<table_of_contents>
1. Store Creation Pattern
2. Store Actions Pattern
3. Accessing Store Outside React
4. Selectors and Performance
5. Persistence with localStorage
6. Dialog Store Pattern
7. Global State Patterns
8. Anti-Patterns
</table_of_contents>

<store_creation>
<basic_store>
Simple Zustand store:

```typescript
// src/stores/my-store.ts
"use client";

import { create } from "zustand";

type MyStore = {
  // State
  value: string;
  count: number;

  // Actions
  setValue: (value: string) => void;
  increment: () => void;
  reset: () => void;
};

export const useMyStore = create<MyStore>((set) => ({
  // Initial state
  value: "",
  count: 0,

  // Actions
  setValue: (value) => set({ value }),
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ value: "", count: 0 }),
}));
```
</basic_store>

<dialog_store>
Dialog queue management store (from NowTS):

```typescript
// src/features/dialog-manager/dialog-store.ts
"use client";

import { create } from "zustand";

type DialogStore = {
  dialogs: Dialog[];
  activeDialog: Dialog | undefined;
  addDialog: (config: DialogConfig) => string;
  removeDialog: (id: string) => void;
  setLoading: (id: string, loading: boolean) => void;
  clear: () => void;
};

export const useDialogStore = create<DialogStore>((set, get) => ({
  dialogs: [],

  get activeDialog() {
    return get().dialogs[0];
  },

  addDialog: (config) => {
    const dialog = DialogFactory.fromConfig(config);
    set((state) => ({ dialogs: [...state.dialogs, dialog] }));
    return dialog.id;
  },

  removeDialog: (id) =>
    set((state) => ({
      dialogs: state.dialogs.filter((d) => d.id !== id),
    })),

  setLoading: (id, loading) =>
    set((state) => ({
      dialogs: state.dialogs.map((d) =>
        d.id === id ? { ...d, loading } : d
      ),
    })),

  clear: () => set({ dialogs: [] }),
}));
```
</dialog_store>

<org_context_store>
Organization context hydration store:

```typescript
// src/hooks/use-current-org.ts
"use client";

import { create } from "zustand";
import { getPlanLimits } from "@/lib/plans";

type CurrentOrgStore = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  subscription: Subscription | null;
  limits: PlanLimits;
} | null;

export const useCurrentOrg = create<CurrentOrgStore>(() => null);

// Setter function (called from OrgProvider)
export function setCurrentOrg(org: Organization) {
  useCurrentOrg.setState({
    id: org.id,
    slug: org.slug,
    name: org.name,
    image: org.image,
    subscription: org.subscription,
    limits: getPlanLimits(org.subscription?.plan),
  });
}

export function clearCurrentOrg() {
  useCurrentOrg.setState(null);
}
```
</org_context_store>
</store_creation>

<accessing_outside_react>
Access store state and actions outside React components:

```typescript
// Using getState() for server actions or utilities
import { useDialogStore } from "./dialog-store";

// Get current state
const currentDialogs = useDialogStore.getState().dialogs;

// Call actions
useDialogStore.getState().addDialog({ ... });
useDialogStore.getState().removeDialog(id);

// Example: handleDialogAction helper
export async function handleDialogAction(
  dialogId: string,
  action: () => Promise<void>
) {
  const store = useDialogStore.getState();

  try {
    store.setLoading(dialogId, true);
    await action();
    store.removeDialog(dialogId);
  } catch (error) {
    store.setLoading(dialogId, false);
    toast.error(error instanceof Error ? error.message : "Error");
  }
}
```
</accessing_outside_react>

<selectors_performance>
Use selectors to prevent unnecessary re-renders:

<wrong>
Subscribing to entire store:

```typescript
// BAD - re-renders on ANY store change
function Component() {
  const store = useMyStore();
  return <div>{store.value}</div>;
}
```
</wrong>

<right>
Subscribe only to needed state:

```typescript
// GOOD - only re-renders when value changes
function Component() {
  const value = useMyStore((state) => state.value);
  return <div>{value}</div>;
}

// Multiple values - use shallow comparison
import { shallow } from "zustand/shallow";

function Component() {
  const { value, count } = useMyStore(
    (state) => ({ value: state.value, count: state.count }),
    shallow
  );
  return <div>{value}: {count}</div>;
}
```
</right>

<actions_only>
Actions are stable - can destructure without selector:

```typescript
// Actions don't cause re-renders
function Component() {
  const { setValue, increment } = useMyStore.getState();
  // OR use in selector (actions are stable references)
  const increment = useMyStore((state) => state.increment);

  return <button onClick={increment}>+</button>;
}
```
</actions_only>
</selectors_performance>

<persistence>
Persist store to localStorage:

```typescript
// src/stores/preferences-store.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferencesStore = {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  setTheme: (theme: PreferencesStore["theme"]) => void;
  toggleSidebar: () => void;
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarOpen: true,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "preferences", // localStorage key
      partialize: (state) => ({
        // Only persist specific fields
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
```

<hydration_handling>
Handle hydration mismatch for persisted stores:

```typescript
// Use useEffect to wait for hydration
function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const theme = usePreferencesStore((s) => s.theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-9 w-9" />;
  }

  return <ThemeButton theme={theme} />;
}
```
</hydration_handling>
</persistence>

<global_dialog_pattern>
Simple global dialog type tracker:

```typescript
// src/features/global-dialog/global-dialog.store.ts
"use client";

import { create } from "zustand";

type DialogType = "org-plan" | "upgrade" | "settings";

type GlobalDialogStore = {
  openDialog: DialogType | null;
  setOpenDialog: (dialog: DialogType | null) => void;
};

const useGlobalDialogStore = create<GlobalDialogStore>((set) => ({
  openDialog: null,
  setOpenDialog: (openDialog) => set({ openDialog }),
}));

// Helper functions
export function openGlobalDialog(dialog: DialogType) {
  useGlobalDialogStore.getState().setOpenDialog(dialog);
}

export function closeGlobalDialog() {
  useGlobalDialogStore.getState().setOpenDialog(null);
}

// Component usage
function GlobalDialog() {
  const openDialog = useGlobalDialogStore((s) => s.openDialog);

  if (!openDialog) return null;

  const DialogComponent = DialogTypeMap[openDialog];
  return <DialogComponent />;
}
```
</global_dialog_pattern>

<debug_panel_store>
Development-only debug utilities:

```typescript
// src/features/debug/debug-panel-store.ts
"use client";

import { create } from "zustand";

type DebugAction = {
  id: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
};

type DebugInfo = {
  id: string;
  label: string;
  value: string | number | boolean | null;
};

type DebugPanelStore = {
  actions: DebugAction[];
  infos: DebugInfo[];
  addAction: (action: DebugAction) => void;
  removeAction: (id: string) => void;
  addInfo: (info: DebugInfo) => void;
  updateInfo: (id: string, value: DebugInfo["value"]) => void;
  removeInfo: (id: string) => void;
};

export const useDebugPanelStore = create<DebugPanelStore>((set) => ({
  actions: [],
  infos: [],

  addAction: (action) =>
    set((state) => {
      // Deduplicate by ID
      const exists = state.actions.some((a) => a.id === action.id);
      if (exists) return state;
      return { actions: [...state.actions, action] };
    }),

  removeAction: (id) =>
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== id),
    })),

  addInfo: (info) =>
    set((state) => {
      const exists = state.infos.some((i) => i.id === info.id);
      if (exists) return state;
      return { infos: [...state.infos, info] };
    }),

  updateInfo: (id, value) =>
    set((state) => ({
      infos: state.infos.map((i) =>
        i.id === id ? { ...i, value } : i
      ),
    })),

  removeInfo: (id) =>
    set((state) => ({
      infos: state.infos.filter((i) => i.id !== id),
    })),
}));
```
</debug_panel_store>

<hydrating_from_server>
Hydrate client store from server data:

```typescript
// src/features/organization/org-provider.tsx
"use client";

import { useEffect } from "react";
import { setCurrentOrg } from "@/hooks/use-current-org";

type OrgProviderProps = {
  org: Organization;
};

export function OrgProvider({ org }: OrgProviderProps) {
  useEffect(() => {
    setCurrentOrg(org);
  }, [org]);

  return null; // No rendering, just hydration
}

// Usage in layout
// app/orgs/[orgSlug]/layout.tsx
export default async function OrgLayout({ children }: Props) {
  const org = await getRequiredCurrentOrg();

  return (
    <>
      <OrgProvider org={org} />
      {children}
    </>
  );
}
```
</hydrating_from_server>

<anti_patterns>
<wrong>
Using Zustand for server data:

```typescript
// BAD - use TanStack Query for server data
const useUsersStore = create((set) => ({
  users: [],
  fetchUsers: async () => {
    const users = await fetch("/api/users");
    set({ users });
  },
}));
```
</wrong>
<right>
Use TanStack Query for server data:

```typescript
// GOOD - TanStack Query for server data
function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

// Zustand for client-only state
const useUIStore = create((set) => ({
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
}));
```
</right>

<wrong>
Storing URL state in Zustand:

```typescript
// BAD - URL state should be in URL
const useFiltersStore = create((set) => ({
  page: 1,
  search: "",
  setPage: (page) => set({ page }),
}));
```
</wrong>
<right>
Use nuqs for URL state:

```typescript
// GOOD - nuqs for URL state
function usePagination() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  return { page, setPage };
}
```
</right>

<wrong>
Not using selectors:

```typescript
// BAD - subscribes to entire store
function Counter() {
  const store = useCountStore();
  return <span>{store.count}</span>;
}
```
</wrong>
<right>
Use selectors:

```typescript
// GOOD - only subscribes to count
function Counter() {
  const count = useCountStore((s) => s.count);
  return <span>{count}</span>;
}
```
</right>
</anti_patterns>

<when_to_use_zustand>
**Use Zustand for:**
- UI state shared between components (dialogs, sidebars, modals)
- User preferences (theme, language, display settings)
- Cached client-side computed values
- Global application state (current org, selected items)
- State accessed outside React (in utilities, helpers)

**Do NOT use Zustand for:**
- Server data (use TanStack Query)
- URL state (use nuqs)
- Form state (use TanStack Form)
- Single-component state (use useState)
- Prop drilling avoidance (use Context or composition)
</when_to_use_zustand>
</state_management_reference>
