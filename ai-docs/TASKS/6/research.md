The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/6/research.md`. Here's a summary:

## Research Summary: Task 6 — App Shell with Sidebar and Header Navigation

**Task ID**: 6
**Estimated Complexity**: Major — 4 layout component implementations + App.tsx wiring, establishing the structural backbone of the entire UI.

**Current State**: All 4 layout component files (AppShell, Sidebar, Header, MobileNav) exist as empty stubs with placeholder divs. All required infrastructure is in place from prior tasks: SidebarContext (Task 3) with localStorage persistence, useClickOutside and useFocusTrap hooks (Task 3), Avatar/Dropdown/Button UI components (Task 5), React Router with 6 routes in App.tsx.

**Implementation Plan** (bottom-up build order):
1. **Sidebar.tsx** — `<aside>` + `<nav>` with 5 NavLink items (Dashboard, Projects, Tasks, Team, Settings) using Lucide icons. Consumes `useSidebar()` for collapsed state. Responsive widths: 240px expanded / 64px collapsed. Hidden below 768px.
2. **Header.tsx** — Fixed `<header>` with search input (Search icon), notifications bell (with red dot), user avatar opening dropdown menu (Profile/Settings/Logout). Mobile hamburger button visible below 768px.
3. **MobileNav.tsx** — Full-screen overlay with backdrop, same nav items as Sidebar, close (X) button. Uses `useFocusTrap` for accessibility. Closes on nav click, X button, or backdrop click.
4. **AppShell.tsx** — Flex composition: Sidebar (left) + Header+main (right column). Owns `isMobileMenuOpen` state. Renders `<main>` for content area.
5. **App.tsx** — Wrap `<Routes>` with `<AppShell>` inside `<BrowserRouter>`.

**Key Design Decisions**:
- Reuse existing SidebarContext, useClickOutside, useFocusTrap, and Avatar components
- Build lightweight inline user dropdown with `role="menu"` semantics rather than reusing listbox-styled Dropdown component
- Nav items defined as shared constant array (imported by both Sidebar and MobileNav)
- Tablet (768-1024px) defaults to icons-only via initial mount check of viewport width
- NavLink `end` prop on Dashboard route to prevent prefix-matching all routes
- Full dark mode support with `dark:` Tailwind prefixes throughout

**Pitfalls Identified**: Router context requirement (AppShell must be inside BrowserRouter), body scroll lock for mobile overlay, NavLink `end` prop for root route, noUnusedLocals strict checking, semantic ARIA roles for action menu vs. selection dropdown.

```json
{
  "task": "6",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "src/App.tsx",
    "src/main.tsx",
    "src/index.css",
    "src/types/index.ts",
    "src/data/mockData.ts",
    "src/context/SidebarContext.tsx",
    "src/context/ThemeContext.tsx",
    "src/hooks/useClickOutside.ts",
    "src/hooks/useFocusTrap.ts",
    "src/components/layout/AppShell.tsx",
    "src/components/layout/Sidebar.tsx",
    "src/components/layout/Header.tsx",
    "src/components/layout/MobileNav.tsx",
    "src/components/ui/Avatar.tsx",
    "src/components/ui/Dropdown.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Input.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/Projects.tsx",
    "src/pages/Tasks.tsx",
    "src/pages/Team.tsx",
    "src/pages/Settings.tsx",
    "package.json",
    "tsconfig.json",
    "tailwind.config.js"
  ],
  "planSummary": "Implement 4 layout components (Sidebar, Header, MobileNav, AppShell) replacing stubs, then wire AppShell into App.tsx. Sidebar has 5 NavLink items with Lucide icons and collapse toggle via SidebarContext. Header has search input, bell icon with dot, and user avatar dropdown. MobileNav is a full-screen overlay with focus trap. AppShell composes all three with flex layout. Full responsive support: mobile hamburger overlay, tablet icons-only, desktop full sidebar.",
  "scope": {
    "level": "major",
    "rationale": "Cross-cutting architectural change establishing the app's layout foundation. Touches 5 files (4 new component implementations + App.tsx wiring). Every future page renders inside this shell. Integrates multiple contexts, hooks, and UI primitives. Establishes responsive patterns used throughout the app."
  }
}
```