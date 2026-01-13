---
paths:
  - "**/*.tsx"
---

# Dialog Manager

Use `dialogManager` from `@/features/dialog-manager/dialog-manager` for global modals.

## Types

```tsx
// Confirmation dialog
dialogManager.confirm({
  title: "Delete Item",
  description: "Are you sure?",
  variant: "destructive", // "default" | "destructive" | "warning"
  action: {
    label: "Delete",
    onClick: async () => await deleteItem(id),
  },
});

// Input dialog
dialogManager.input({
  title: "Rename Item",
  input: { label: "Name", defaultValue: currentName },
  action: {
    label: "Save",
    onClick: async (value) => await renameItem(id, value),
  },
});

// Custom dialog
dialogManager.custom({
  title: "Custom",
  size: "lg", // "sm" | "md" | "lg"
  children: <MyComponent onClose={() => dialogManager.closeAll()} />,
});
```

## Notes

- Action buttons auto-handle loading state during async operations
- Use `dialogManager.close(id)` or `dialogManager.closeAll()` to close
