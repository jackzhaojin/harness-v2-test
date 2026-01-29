The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/4/research.md`. Here's a summary:

## Research Summary: Task 4 - Reusable UI Component Library

**Task ID**: 4  
**Estimated Complexity**: Major  
**Dependencies**: Tasks 1-3 (scaffolding, types/data, context/hooks)

### Current State
All 12 UI component files exist as stubs with placeholder implementations (`<button>Button Placeholder</button>` etc.) and minimal props interfaces. No components are imported by any other files yet. All custom hooks and contexts from Task 3 are fully implemented and available.

### Implementation Plan (bottom-up build order)
1. **Badge** — Simplest; pure presentational, 5 color variants (green/yellow/blue/red/gray)
2. **ProgressBar** — Pure presentational with ARIA attributes, percentage bar fill
3. **Card** — Container with configurable padding and shadow variants
4. **Input** — Form input with label, placeholder, error state, dark mode, focus ring
5. **Select** — Native select with options array, placeholder, controlled value
6. **Toggle** — Accessible switch with `role="switch"`, `aria-checked`, keyboard handlers (Space/Enter)
7. **Button** — 4 variants, 3 sizes, loading state with `Loader2` icon from lucide-react, focus ring, disabled state
8. **Avatar** — Image with initials fallback, 3 sizes, optional online status dot
9. **Dropdown** — Most complex; integrates `useClickOutside` from Task 3, manages open state, positioned menu, Escape key close, keyboard navigation

### Key Design Decisions
- HOW.md Pattern 6 (variant class composition): `baseStyles` + `variants` record + `sizes` record, concatenated via template literals
- All interactive components get `focus:outline-none focus:ring-2 focus:ring-offset-2` with `dark:focus:ring-offset-gray-900`
- Props interfaces extend native HTML attribute types for pass-through (e.g., `ButtonProps extends React.ButtonHTMLAttributes`)
- Named exports following HOW.md convention (stubs currently use `export default`)
- Modal, SlideOver, Toast stubs left unchanged (out of scope)

### Scope
- **9 files modified** (the 9 in-scope component stubs)
- **3 files untouched** (Modal, SlideOver, Toast)
- **0 files created** (except optional test HTML page)
- **0 dependency changes** (lucide-react already available)