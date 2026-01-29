Research complete. Here's a summary of my findings:

## Research Summary: Task 7.1

**Estimated Complexity**: Minor — two localized fixes, no architectural changes.

### Two Independent Fixes

1. **Background Color Fix (Trivial)**: Single class name change in `AppShell.tsx` line 22 — replace `dark:bg-gray-950` with `dark:bg-gray-900`. One-token edit.

2. **Settings Theme Selector (Moderate)**: Replace the `Settings.tsx` placeholder page with a theme preference selector UI featuring:
   - Three styled radio card options: Light (Sun icon), Dark (Moon icon), System (Monitor icon)
   - Uses existing `useTheme()` hook — ThemeContext already fully supports all three modes including system OS detection
   - Uses existing `Card` component for consistent styling
   - Visual highlight on the active selection (matching existing NavLink active state pattern)
   - Accessible: `role="radiogroup"` + `role="radio"` with `aria-checked`
   - Mobile responsive: vertical stack on small screens, horizontal row on larger

### Key Findings
- **ThemeContext already complete**: Supports `'light' | 'dark' | 'system'`, OS preference detection via `matchMedia`, and dynamic listener for OS theme changes. No modifications needed.
- **localStorage persistence already handled**: `useLocalStorage` hook in ThemeContext automatically persists theme preference.
- **Existing test compatibility**: Task 7 E2E test navigates to Settings expecting `h1` with "Settings" text — must be preserved.
- **Files to modify**: 2 (AppShell.tsx, Settings.tsx)
- **Files to create**: 1 (E2E test spec)

The full research has been saved to `/ai-docs/TASKS/7.1/research.md`.