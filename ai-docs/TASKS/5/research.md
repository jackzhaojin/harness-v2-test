I now have a thorough understanding of the codebase. Let me write the research document.

# Research: Task 5 - Modal and Toast notification systems

**Task ID**: 5
**Researched**: 2026-01-29
**Dependencies**: Task 3 (ToastContext, useFocusTrap), Task 4 (UI component library patterns)
**Estimated Complexity**: Major

---

## Relevant Project Context

> Both target files are stubs with placeholder implementations. The state management (ToastContext) and accessibility hooks (useFocusTrap) are fully implemented from Task 3.

**Project Type**: React 18 + TypeScript + Vite project management dashboard (SPA)

**Key Files**:
- `src/components/ui/Modal.tsx` — Stub with placeholder div; needs full compound component implementation
- `src/components/ui/Toast.tsx` — Stub with placeholder div; needs full notification component with animations
- `src/context/ToastContext.tsx` — Fully implemented in Task 3; provides `toasts` array, `showToast`, `removeToast`
- `src/hooks/useFocusTrap.ts` — Fully implemented in Task 3; returns a `RefObject<HTMLDivElement>` when `isActive` is true
- `src/hooks/useClickOutside.ts` — Fully implemented in Task 3; calls handler on mousedown/touchstart outside ref
- `src/App.tsx` — Provider hierarchy already includes `ToastProvider`; Toast rendering needs to be added
- `SPEC/HOW.md` — Pattern 2 (Compound Components) and Pattern 7 (Focus Management) are directly relevant
- `tailwind.config.js` — Currently has no custom animations; will need keyframe definitions for toast slide-up and fade-out
- `src/index.css` — Currently only contains Tailwind directives; no custom CSS

**Patterns in Use**:
- Pattern 2: Compound Components for complex UI (Modal) — parent provides context, children consume it via `createContext`/`useContext`
- Pattern 6: Component variants with Tailwind class composition — `baseStyles` + `variants` Record pattern
- Pattern 7: Accessible Focus Management — `useFocusTrap` hook for keyboard trap in modals

**Relevant Prior Tasks**:
- Task 3: Established `ToastContext` with queue management (add/remove/auto-dismiss at 3s), `useFocusTrap` hook with Tab/Shift+Tab wrapping, and `useClickOutside` hook
- Task 4: Established UI component patterns — named exports, `[Component]Props` interfaces, `baseStyles` + `variants` Record approach, dark mode support via `dark:` prefix, focus ring conventions (`focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900`)

---

## Functional Requirements

### Primary Objective
Implement two critical shared UI components: a Modal dialog with compound pattern (Header/Body/Footer) and a Toast notification renderer that consumes the existing ToastContext. Both render via React Portal to `document.body`. The Modal provides accessible overlay dialogs with focus trapping and keyboard dismiss. The Toast system displays stacking notifications with type-based icons, auto-dismiss, and enter/exit animations. These components are foundational — consumed by ProjectModal, InviteModal, confirmation dialogs, settings save, and team invite flows in later tasks.

### Acceptance Criteria
From task packet — restated for clarity:

**Modal:**
1. **Centered overlay**: Modal renders centered on viewport with a semi-transparent backdrop (`bg-black/50`)
2. **Compound pattern**: Exposes `Modal.Header`, `Modal.Body`, `Modal.Footer` as sub-components
3. **Header close button**: `Modal.Header` includes an X button (Lucide `X` icon) in the top-right corner
4. **Backdrop dismiss**: Clicking the backdrop overlay closes the modal (unless a future `preventBackdropClose` prop is added)
5. **Escape key dismiss**: Pressing Escape key closes the modal
6. **Focus trap**: Focus is trapped inside the modal when open — Tab cycles through focusable elements within the modal
7. **Smooth animation**: Fade-in/out animation on open/close (200-300ms duration)
8. **Scrollable body**: `Modal.Body` scrolls if content overflows the viewport height
9. **React Portal**: Renders to `document.body` via `createPortal`

**Toast:**
10. **Position**: Appears in the bottom-right corner of the viewport
11. **Type icons**: Shows colored icon per type — success (green, check-circle), error (red, alert-circle or x-circle), info (blue, info icon)
12. **Close button**: Each toast has an X button for manual dismiss
13. **Auto-dismiss**: Toasts auto-dismiss after 3 seconds (handled by ToastContext, already implemented)
14. **Stacking**: Multiple toasts stack vertically with newest at bottom
15. **Animations**: Enter animation (slide up from bottom) and exit animation (fade out)
16. **React Portal**: Renders to `document.body` via `createPortal`

### Scope Boundaries
**In Scope**:
- Full implementation of `Modal.tsx` with compound pattern and all accessibility features
- Full implementation of `Toast.tsx` as the visual renderer that consumes `ToastContext`
- Adding a `ToastContainer` (or inline rendering) that is mounted globally to render all active toasts
- Custom Tailwind keyframe animations in `tailwind.config.js` for toast slide-up and fade-out
- Wiring the Toast renderer into the application (likely inside `App.tsx` or within the `ToastProvider`)
- Adding Modal and Toast sections to the `ComponentShowcase.tsx` page for verification

**Out of Scope**:
- Modifying `ToastContext.tsx` logic (already complete from Task 3; auto-dismiss timing is correct)
- Implementing the `SlideOver.tsx` component (separate stub, likely a future task)
- Creating domain-specific modals like `ProjectModal.tsx` or `InviteModal.tsx` (future tasks)
- Adding `prefers-reduced-motion` media query support (nice-to-have, not in acceptance criteria)

---

## Technical Approach

### Implementation Strategy

**Modal Component** — Implement as a compound component following HOW.md Pattern 2. The root `Modal` function accepts `isOpen`, `onClose`, and `children` props. When `isOpen` is true, it renders a React Portal to `document.body` containing: (a) a fixed full-screen backdrop with semi-transparent black background, and (b) a centered content panel. An internal `ModalContext` (using `createContext`) shares `onClose` with sub-components. The component integrates the existing `useFocusTrap` hook (passing `isOpen`) to trap keyboard focus. An `useEffect` listens for Escape keydown events and calls `onClose`. Backdrop click is handled via an `onClick` on the backdrop div that checks `e.target === e.currentTarget` to avoid closing when clicking inside the modal content. Animation is achieved with Tailwind transition classes and a brief state transition: the component mounts with opacity-0 and transitions to opacity-100 over 200ms. For unmount animation, a `useEffect`-based exit delay or CSS animation approach will be used.

**Toast Renderer** — Implement as a standalone component that uses `useToast()` to read the `toasts` array and renders them via Portal in a fixed container in the bottom-right corner. Each individual toast displays the message, a type-specific Lucide icon (CheckCircle for success, XCircle or AlertCircle for error, Info for info), and an X close button. The toast type determines the accent color (green/red/blue) applied as a left border or icon color. Enter animation uses a CSS `animate-slide-up` keyframe. Exit animation uses `animate-fade-out`. The container stacks toasts vertically using flexbox column with gap spacing, newest at bottom (matching the array order since `showToast` appends to the end).

**Global Toast Mounting** — The `ToastContainer` (or a renamed exported component) needs to be rendered once in the component tree, inside the `ToastProvider` scope. The cleanest approach is to render it inside `App.tsx` alongside the `Routes`, or embed it within the `ToastProvider` itself. Since the `ToastProvider` is already implemented and working, the least-disruptive approach is to add a `<ToastContainer />` render call inside `App.tsx`, just after the `BrowserRouter` block but still within `ToastProvider`.

**Animation Strategy** — Tailwind's default configuration does not include slide-up or fade-out keyframes. Custom keyframes need to be added to `tailwind.config.js` under `theme.extend.keyframes` and corresponding animation utility classes under `theme.extend.animation`. For the Modal, standard Tailwind `transition-opacity duration-200` suffices for the backdrop and content fade. For Toast enter, a `slideUp` keyframe (translateY(100%) to translateY(0) + opacity 0 to 1). For Toast exit, this is trickier because removal from the array happens instantly. One approach: add an `isExiting` flag to the Toast interface (requires minor ToastContext modification) — but since modifying ToastContext is out of scope, an alternative is to use CSS `animation-fill-mode: forwards` with the animation triggered by a local state within the individual toast item component, using a timer that matches or slightly precedes the 3s auto-dismiss.

**Revised exit animation approach** — Since auto-dismiss is managed by ToastContext's `setTimeout(removeToast, 3000)`, and modifying the context is out of scope, the Toast component can use a local `useEffect` with a timer set to ~2700ms (slightly before removal) to apply an exit animation class. When the timer fires, the toast starts fading out over 300ms, and then gets removed from the array by the context at 3000ms. This creates a smooth exit without needing to change ToastContext.

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/ui/Modal.tsx` | Replace stub with full compound component implementation — ModalContext, Modal root with Portal/backdrop/focus-trap/Escape handling, Modal.Header, Modal.Body, Modal.Footer sub-components |
| `src/components/ui/Toast.tsx` | Replace stub with ToastContainer (renders portal with fixed positioning) and individual ToastItem components consuming useToast() |
| `src/App.tsx` | Add import and render of the Toast container component inside the provider tree |
| `tailwind.config.js` | Add custom keyframes and animation utilities for `slideUp` and `fadeOut` |
| `src/pages/ComponentShowcase.tsx` | Add Modal and Toast demo sections for visual verification |

### Files to Create
| File | Purpose |
|------|---------|
| `tests/adhoc/test-task-5.html` | Optional: manual verification instructions for all acceptance criteria |

### Code Patterns to Follow
From `SPEC/HOW.md`:

- **Pattern 2 (Compound Components)**: The Modal uses an internal `ModalContext` created via `createContext`. The root `Modal` function wraps children in a `ModalContext.Provider` providing `{ isOpen, onClose }`. Sub-components (`Modal.Header`, `Modal.Body`, `Modal.Footer`) are assigned as properties on the `Modal` function object. Each sub-component calls `useContext(ModalContext)` to access `onClose` (needed by Header's close button). The non-null assertion pattern (`useContext(ModalContext)!`) follows the HOW.md example.

- **Pattern 7 (Focus Management)**: The Modal integrates `useFocusTrap(isOpen)` which returns a ref to be attached to the modal's content container div. When `isOpen` is true, the hook auto-focuses the first focusable element and traps Tab/Shift+Tab navigation within the container.

- **Pattern 6 (Variant Classes)**: The Toast component uses a `variants` Record keyed by toast type (`success`, `error`, `info`) to map to corresponding Tailwind color classes for border/icon coloring, following the same `Record<NonNullable<...>, string>` pattern used by Button, Badge, etc.

- **Component Structure Convention**: Imports first, then interfaces/types, then constants, then component function, then sub-components. Named exports plus default export. Props interfaces named `ModalProps`, `ToastItemProps`, etc.

- **Accessibility**: Modal gets `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the header. Close buttons get `aria-label="Close"`. Focus ring conventions follow existing pattern (`focus:outline-none focus:ring-2 focus:ring-offset-2`).

### Integration Points
- **Modal** consumes `useFocusTrap` from `src/hooks/useFocusTrap.ts` — already returns `RefObject<HTMLDivElement>`
- **Modal** uses `createPortal` from `react-dom` — already a dependency
- **Toast** consumes `useToast()` from `src/context/ToastContext.tsx` — provides `toasts`, `removeToast`
- **Toast** uses `createPortal` from `react-dom`
- **Toast icons** use Lucide React icons: `CheckCircle`, `XCircle` (or `AlertCircle`), `Info`, and `X` — all available from `lucide-react`
- **App.tsx** needs to render the `ToastContainer` component once, within the `ToastProvider` scope

---

## Testing Strategy

### Smoke Test
- App loads without console errors after all changes (`npm run dev`)
- TypeScript compilation passes (`npx tsc --noEmit`)
- Production build succeeds (`npm run build`)
- Existing routes still render (Dashboard, Projects, Tasks, Team, Settings, ComponentShowcase)

### Functional Tests
**Modal:**
- Open modal and verify it renders centered with semi-transparent backdrop
- Verify Modal.Header, Modal.Body, Modal.Footer all render correctly
- Verify close button (X) appears in Modal.Header
- Click backdrop and verify modal closes
- Press Escape and verify modal closes
- Verify focus is trapped within modal (Tab cycles through modal elements only)
- Verify fade-in animation is visible on open
- Verify body scrolls if content is very long
- Verify modal renders via Portal (check document.body for the portal node)

**Toast:**
- Trigger `showToast('message', 'success')` and verify toast appears bottom-right
- Verify success toast has green icon (CheckCircle)
- Verify error toast has red icon (XCircle)
- Verify info toast has blue icon (Info)
- Verify close button (X) dismisses toast immediately
- Wait 3 seconds and verify toast auto-dismisses
- Trigger multiple toasts and verify they stack vertically
- Verify enter animation (slide up) is visible
- Verify exit animation (fade out) occurs before removal

### Regression Check
- ComponentShowcase page still loads with all existing component sections
- No TypeScript errors introduced in existing files
- ToastContext behavior unchanged (same API: `showToast`, `removeToast`, `toasts`)
- App.tsx provider hierarchy preserved

---

## Considerations

### Potential Pitfalls

- **TypeScript strict mode**: `noUnusedLocals` and `noUnusedParameters` are enabled. All imports, variables, and parameters must be used. The `_props` pattern in current stubs handles unused params; make sure to remove the underscore prefix when props are actually consumed.

- **Compound component typing**: Assigning `Modal.Header`, `Modal.Body`, `Modal.Footer` as properties on the function requires careful TypeScript typing. The function needs to be declared first, then the sub-components assigned. One common approach is to use `Object.assign` or to define Modal as a const then add properties. Alternatively, declare the function, then assign sub-components directly (TypeScript allows this with function declarations).

- **React StrictMode double-mount**: `main.tsx` uses `<React.StrictMode>`. Effects run twice in dev. The `useFocusTrap` and Escape key listeners must handle cleanup properly (return cleanup functions). The existing `useFocusTrap` implementation already handles this correctly.

- **Portal and event bubbling**: Events from Portal-rendered elements still bubble through the React tree (not the DOM tree). This is standard React Portal behavior and is actually desirable — it means a toast close click will bubble up through the React component hierarchy, not the DOM hierarchy.

- **Toast exit animation timing**: The 300ms fade-out animation needs to start at ~2700ms, which is before the 3000ms context-level removal. A local `useEffect` timer within each toast item can handle this. Edge case: if the user manually dismisses (clicks X), the fade-out should trigger immediately, then call `removeToast` after the animation completes (or immediately — since the removal causes unmount, the simpler approach is to just call `removeToast` immediately and skip the exit animation for manual dismiss, or use `onAnimationEnd`).

- **Modal animation on close**: The modal also needs a close animation (fade out). Since `isOpen=false` causes the portal to unmount, a delayed unmount pattern is needed. One approach: maintain an internal `isVisible` state that stays `true` during the exit animation, with a `useEffect` that transitions to invisible then unmounts after the animation duration. Alternatively, always render the portal but control visibility with opacity/pointer-events classes.

- **z-index stacking**: Both Modal and Toast render to `document.body` via Portal. The Toast container should have a higher z-index than the Modal backdrop to ensure toasts are visible even when a modal is open. Suggested: Modal backdrop at `z-50`, Toast container at `z-[100]` or similar.

### Edge Cases

- **Multiple modals**: The current design supports only one modal at a time (standard behavior). If two modals are rendered simultaneously, they would stack based on render order. This is acceptable for the MVP scope.

- **Empty toast message**: If `showToast('', 'info')` is called, the toast would render with just an icon and close button. This is acceptable — no special handling needed.

- **Rapid toast creation**: If many toasts are created quickly, they all stack and auto-dismiss independently. The fixed container should use `overflow-auto` or `max-h-screen` to prevent overflow beyond viewport.

- **Modal with no focusable elements**: If a modal has no buttons or inputs (unlikely but possible), `useFocusTrap` handles this gracefully — `firstElement?.focus()` is a no-op if `focusableElements` is empty.

- **Body scroll lock**: When a modal is open, the page body should not scroll. This can be achieved by adding `overflow: hidden` to `document.body` when the modal opens and removing it when it closes. This should be handled in a `useEffect` within the Modal component.

---

## Implementation Build Order

1. **tailwind.config.js** — Add custom keyframe animations (`slideUp`, `fadeOut`, `fadeIn`) and animation utilities first, since both components depend on them
2. **Modal.tsx** — Implement full compound component with ModalContext, Portal, backdrop, focus trap, Escape handling, animations, compound sub-components (Header, Body, Footer)
3. **Toast.tsx** — Implement ToastContainer and ToastItem with Portal, useToast integration, type-based icons/colors, enter/exit animations
4. **App.tsx** — Add Toast container render within provider tree
5. **ComponentShowcase.tsx** — Add Modal and Toast demo sections
6. **Smoke test** — Run `npx tsc --noEmit` and `npm run build` to verify

---

```json
{
  "task": "5",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "ai-docs/SPEC/PROMPT.md",
    "ai-docs/SPEC/PROGRESS_LOG.md",
    "ai-docs/TASKS/4/research.md",
    "ai-docs/TASKS/3/build_attempt_1.md",
    "ai-docs/TASKS/3/research.md",
    "src/components/ui/Modal.tsx",
    "src/components/ui/Toast.tsx",
    "src/components/ui/SlideOver.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Card.tsx",
    "src/components/ui/Badge.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Toggle.tsx",
    "src/components/ui/Dropdown.tsx",
    "src/context/ToastContext.tsx",
    "src/hooks/useFocusTrap.ts",
    "src/hooks/useClickOutside.ts",
    "src/App.tsx",
    "src/main.tsx",
    "src/types/index.ts",
    "src/index.css",
    "src/pages/ComponentShowcase.tsx",
    "tailwind.config.js",
    "tsconfig.json",
    "package.json"
  ],
  "planSummary": "Implement Modal (compound component with Portal, backdrop, focus trap, Escape key, fade animation, scrollable body, Header/Body/Footer sub-components) and Toast renderer (Portal-based container consuming ToastContext, type-specific icons/colors, slide-up enter and fade-out exit animations, stacking in bottom-right corner). Add custom Tailwind keyframe animations. Wire Toast container into App.tsx. Add demos to ComponentShowcase. 5 files modified, 0-1 files created.",
  "scope": {
    "level": "major",
    "rationale": "Two complex interactive components with animations, portals, compound patterns, accessibility (focus trap, ARIA), and cross-cutting integration (Tailwind config, App.tsx, context consumption). Touches 5 files including config. Both components are foundational and consumed by multiple downstream tasks (ProjectModal, InviteModal, Settings save, etc.)."
  }
}
```