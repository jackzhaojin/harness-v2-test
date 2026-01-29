# Task 5.2: Fix Modal backdrop click not closing modal (still broken after 5.1)

**Parent Task**: 5
**Created By**: Validate agent (attempt 2)

## Problem

Clicking the semi-transparent backdrop overlay outside the modal dialog does NOT close the modal. The acceptance criterion "Clicking backdrop closes modal (unless prevented)" continues to fail after attempt 2. Task 5.1 identified this same issue but the fix was not applied.

## Root Cause

In `src/components/ui/Modal.tsx` (line 146), the backdrop overlay div:

```tsx
<div className="absolute inset-0 bg-black/50" aria-hidden="true" />
```

covers the entire backdrop area. The `handleBackdropClick` handler (line 127-131) checks:

```tsx
const handleBackdropClick = (e: React.MouseEvent): void => {
  if (e.target === e.currentTarget) {
    handleClose();
  }
};
```

When a user clicks the visible backdrop, `e.target` is always the overlay `<div>` (the bg-black/50 child), never the `[role="presentation"]` parent (`e.currentTarget`). Therefore `e.target === e.currentTarget` is always `false` for backdrop clicks.

## Fix

Add `pointer-events-none` to the overlay div so clicks pass through to the parent:

```tsx
<div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden="true" />
```

This is a one-line change on line 146 of `src/components/ui/Modal.tsx`.

## Acceptance Criteria

- [ ] Clicking the backdrop (outside the modal dialog) closes the modal
- [ ] Clicking inside the modal dialog does NOT close the modal
- [ ] All original parent task criteria still pass

## Context from Validation

**Playwright test evidence:**
```
Error: expect(locator).not.toBeVisible() failed
Locator: locator('[role="dialog"]')
Expected: not visible
Received: visible

Element at click position (5,5): {"tag":"DIV","className":"absolute inset-0 bg-black/50","ariaHidden":"true"}
Dialog still visible after clicking backdrop: true
```

**15 of 16 acceptance criteria pass.** Only backdrop click fails.

## Previous Attempts

- Attempt 1: Identified the same bug in validation, created Task 5.1 with detailed analysis
- Attempt 2: Bug persists - the `pointer-events-none` fix from Task 5.1 was not applied to Modal.tsx
