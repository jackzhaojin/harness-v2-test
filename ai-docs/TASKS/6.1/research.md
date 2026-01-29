## Research Summary: Task 6.1 - Fix tablet viewport sidebar to show icons-only by default

### Key Findings

**Root Cause**: The `SidebarContext` uses `useLocalStorage('sidebar-collapsed', false)` which always defaults to expanded. There is zero viewport-awareness — the sidebar shows `w-60` (expanded) at all screen sizes where it's visible (768px+).

**Approach**: Two-file fix (minor scope):

1. **New file: `src/hooks/useMediaQuery.ts`** — A generic, reusable hook wrapping `window.matchMedia` with proper event listener cleanup. Follows the same pattern already used in `ThemeContext.tsx`.

2. **Modified file: `src/context/SidebarContext.tsx`** — Integrate a `useMediaQuery('(min-width: 768px) and (max-width: 1023px)')` call to detect tablet viewports. Add a `useRef<boolean>(false)` for `hasUserToggled` to track explicit user interaction. A `useEffect` watches the media query result: when tablet is detected and user hasn't toggled, auto-collapse; when desktop is detected and user hasn't toggled, auto-expand. The toggle/setCollapsed functions set `hasUserToggled = true` so user intent always wins.

**No changes needed** to `Sidebar.tsx`, `AppShell.tsx`, or any existing tests.

**E2E Safety**: All 14 existing tests run at Desktop Chrome default (1280x720 = desktop width), so the "sidebar collapse toggle works" test that expects `w-60` on initial load will continue to pass since 1280px > 1024px.

**Breakpoint Precision**: Using `max-width: 1023px` (not 1024px) to align with Tailwind's `lg:` breakpoint which activates at >= 1024px, ensuring 1024px is treated as desktop.