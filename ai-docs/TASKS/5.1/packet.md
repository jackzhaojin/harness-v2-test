# Task 5.1: Fix Modal backdrop click not closing modal

**Parent Task**: 5
**Created By**: Validate agent (attempt 1)

## Problem

Clicking the semi-transparent backdrop overlay outside the modal dialog does NOT close the modal. The acceptance criterion "Clicking backdrop closes modal (unless prevented)" fails.

## Root Cause

In `src/components/ui/Modal.tsx`, the Modal component has this DOM structure:

```tsx
{/* [role="presentation"] - has the click handler */}
<div onClick={handleBackdropClick} role="presentation" className="fixed inset-0 z-50 flex items-center justify-center p-4 ...">
  {/* Absolute overlay - covers entire area, intercepts ALL clicks */}
  <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
  {/* Modal dialog */}
  <div role="dialog" ...>{children}</div>
</div>
```

The `handleBackdropClick` handler checks `if (e.target === e.currentTarget)` to determine if the click was on the backdrop (not inside the modal content). However, the `<div className="absolute inset-0 bg-black/50">` child element covers the entire backdrop area. When a user clicks on the visible backdrop, `e.target` is always this overlay `<div>`, never the `[role="presentation"]` parent (`e.currentTarget`). Therefore `e.target === e.currentTarget` is always `false` for backdrop clicks, and `handleClose()` is never called.

## Fix Approach

The simplest fix is to add `pointer-events-none` to the overlay div so clicks pass through it to the parent:

```tsx
<div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden="true" />
```

This way `e.target` will be the `[role="presentation"]` div itself (since the overlay won't capture the event), and `e.target === e.currentTarget` will correctly be `true`.

Alternatively, the click handler could be updated to also check if the target is the overlay div:
```tsx
const handleBackdropClick = (e: React.MouseEvent): void => {
  if (e.target === e.currentTarget || (e.target as HTMLElement).getAttribute('aria-hidden') === 'true') {
    handleClose();
  }
};
```

The `pointer-events-none` approach is cleaner and more idiomatic.

## Acceptance Criteria

- [ ] Clicking the backdrop (outside the modal dialog) closes the modal
- [ ] Clicking inside the modal dialog does NOT close the modal
- [ ] All original parent task criteria still pass (escape key, focus trap, animations, compound components, etc.)

## Context from Validation

**Test output** (Playwright):
```
Error: expect(received).toBe(expected) // Object.is equality
Expected: false
Received: true
  (isStillVisible was true after clicking backdrop)
```

**Console log**: "Backdrop click did not close modal - e.target is overlay child, not presentation div"

**Verified**: The overlay `<div className="absolute inset-0 bg-black/50">` intercepts all mouse clicks in the backdrop area. Adding `pointer-events-none` to this div resolves the issue.

## Previous Attempts

- Attempt 1: Modal was built with the compound component pattern per SPEC/HOW.md. The backdrop click handler followed the standard `e.target === e.currentTarget` pattern from the spec, but the implementation added an extra overlay div for the semi-transparent background that blocks click propagation.
