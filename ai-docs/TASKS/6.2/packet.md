# Task 6.2: Fix tablet viewport sidebar to auto-collapse to icons-only mode

**Parent Task**: 6
**Created By**: Validate agent (attempt 2)

## Problem

The acceptance criterion "Tablet (768-1024px): sidebar shows icons only by default" is NOT met. At tablet viewports (768px-1024px), the sidebar displays in fully expanded mode (`w-60`) with text labels visible instead of icons-only collapsed mode (`w-16`). Task 6.1 was created for this same issue but was never built/executed.

## Root Cause

The Sidebar component (`src/components/layout/Sidebar.tsx`) uses `hidden md:flex` to show at 768px+ and toggles between `w-16`/`w-60` based solely on `isCollapsed` from SidebarContext (default: `false` = expanded). There is **no responsive logic** to detect tablet viewport and auto-collapse.

The SidebarContext (`src/context/SidebarContext.tsx`) uses `useLocalStorage('sidebar-collapsed', false)` with a default of `false` (expanded), and has no viewport awareness.

## Acceptance Criteria

- [ ] At tablet viewports (768px-1024px), sidebar shows icons only (collapsed/w-16) by default
- [ ] At desktop viewports (>1024px), sidebar remains expanded (w-60) by default (existing behavior)
- [ ] User can still manually toggle sidebar collapse/expand at any viewport
- [ ] All original parent task criteria still pass

## Recommended Implementation

**Option A: CSS-only approach (Recommended — simplest and most robust)**

In `Sidebar.tsx`, replace the dynamic `isCollapsed ? 'w-16' : 'w-60'` with responsive Tailwind classes:

```tsx
// Sidebar.tsx - change className to use responsive breakpoints
className={`hidden md:flex flex-col h-screen sticky top-0 ... transition-all duration-300 ${
  isCollapsed ? 'w-16' : 'md:w-16 lg:w-60'
}`}
```

This would make the sidebar icons-only at `md` (768px) and expanded at `lg` (1024px). The `isCollapsed` toggle would still override for explicit user preference.

However, this CSS approach alone doesn't handle the text/label visibility properly since that's controlled by `{!isCollapsed && <span>...}`. A hybrid approach is needed.

**Option B: Media query hook approach (More complete)**

1. Create a `useMediaQuery` hook (or add to existing hooks):
```ts
// hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
```

2. In `SidebarContext.tsx`, use the hook to set responsive default:
```ts
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
// When on tablet and no explicit user preference stored, default to collapsed
```

3. The sidebar will then automatically be `isCollapsed=true` at tablet widths, showing only icons.

## Context from Validation

**Playwright test output at 900px tablet viewport:**
```
Tablet sidebar class: hidden md:flex flex-col h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 w-60
```

Expected: `w-16` (collapsed/icons-only)
Actual: `w-60` (fully expanded with text labels)

**Files to modify:**
- `src/context/SidebarContext.tsx` — Add viewport-aware default
- `src/components/layout/Sidebar.tsx` — May need responsive class adjustments
- `src/hooks/useMediaQuery.ts` — New hook (if Option B)

## Previous Attempts

- Attempt 1 (validate): Identified the issue, created Task 6.1
- Task 6.1: Created but never built/executed
- Attempt 2 (validate): Confirmed issue persists. Same failure. Created this Task 6.2 with detailed implementation guidance.
