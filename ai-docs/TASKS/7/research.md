The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/7/research.md`. Here's a summary of the findings:

## Research Summary: Task 7 — Dark/Light Theme Toggle

**Scope**: Minor — the vast majority of theme infrastructure already exists.

### Key Findings

1. **ThemeContext is fully implemented** (`src/context/ThemeContext.tsx`) — manages light/dark/system state, persists to localStorage, applies `dark` class to `<html>`, and listens for OS preference changes. Only change needed: default value from `'system'` to `'light'`.

2. **All UI/layout components already have `dark:` Tailwind variants** — Header, Sidebar, MobileNav, Card, Input, Toggle, Button, Badge, Modal, Toast, Avatar, ProgressBar, Dropdown all have comprehensive dark mode styling.

3. **5 placeholder pages have dark mode gaps** — Dashboard, Projects, Tasks, Team, Settings are all minimal placeholders with `text-gray-600` and `text-3xl font-bold` missing `dark:` variants.

4. **Header needs the toggle button** — The right actions area has notifications bell and user avatar. The theme toggle button (Sun/Moon from Lucide) slots in naturally before the bell.

### Implementation Plan (7 files modified, 1 created)
1. Change `ThemeContext.tsx` default: `'system'` → `'light'`
2. Add Sun/Moon toggle button to `Header.tsx`
3. Fix dark mode text classes on 5 placeholder pages
4. Create `tests/e2e/task-7-theme.spec.ts` for E2E validation
5. Run full regression suite (45 existing tests)