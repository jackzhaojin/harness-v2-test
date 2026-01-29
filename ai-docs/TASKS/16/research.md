## Research Complete: Task 16 - Team Member Invite Modal

### Summary

**Scope**: Minor — 1 new component, 1 modified page file, 1 new E2E test file. No architecture changes.

### Plan

1. **Create `src/components/team/InviteModal.tsx`** — New invite modal component following the established `ProjectModal` pattern:
   - Uses compound `Modal` (Modal.Header, Modal.Body, Modal.Footer)
   - Single email `Input` field with `error` prop for validation styling
   - Basic email validation: must contain `@` and `.`, non-empty
   - "Touched" state guard to prevent showing errors immediately on open
   - `useEffect` on `isOpen` resets form state when modal reopens
   - Submit calls `showToast('Invite sent to {email}!', 'success')` then `onClose()`
   - Cancel button calls `onClose()` directly
   - No `DataContext` interaction (UI demo only)

2. **Modify `src/pages/Team.tsx`** — Add "Invite Member" button in the page header:
   - Add `useState` for `isInviteModalOpen`
   - Add button with `UserPlus` or `Plus` icon in header row (following `Projects.tsx` layout pattern)
   - Render `InviteModal` with `isOpen`/`onClose` props

3. **Create `tests/e2e/task-16-invite-modal.spec.ts`** — 5 E2E tests covering all acceptance criteria

### Key Patterns Reused
- **ProjectModal** (Task 11): Compound Modal usage, form reset via `useEffect`, cancel/submit pattern
- **Projects.tsx**: Header layout with action button, toast integration
- **Input component**: Built-in `error` prop for red border + error message display
- **ToastContext**: `showToast(message, 'success')` for confirmation feedback

### Risk Assessment
Very low. Only adds new UI to an existing page — no existing components modified, no state mutations, no data changes.