# Task 6.1: Fix tablet viewport sidebar to show icons-only by default

**Parent Task**: 6
**Created By**: Validate agent (attempt 1)

## Problem

The acceptance criterion "Tablet (768-1024px): sidebar shows icons only by default" is NOT met. At tablet viewports (768px-1024px), the sidebar displays in fully expanded mode (w-60) with text labels visible instead of icons-only collapsed mode (w-16).

## Root Cause

The Sidebar component in `src/components/layout/Sidebar.tsx` uses `hidden md:flex` to show the sidebar at 768px+, but it relies solely on the SidebarContext `isCollapsed` state (default: `false` = expanded). There is no responsive logic to automatically collapse the sidebar to icons-only mode at tablet viewports (768-1024px). The sidebar needs to detect the viewport width and default to collapsed mode between 768px and 1024px.

## Acceptance Criteria

- [ ] At tablet viewports (768px-1024px), sidebar shows icons only (collapsed/w-16) by default
- [ ] At desktop viewports (>1024px), sidebar remains expanded (w-60) by default (existing behavior)
- [ ] User can still manually toggle sidebar collapse/expand at any viewport
- [ ] The manual toggle state should take precedence over the responsive default when user explicitly toggles
- [ ] All original parent task criteria still pass (14 existing E2E tests)

## Context from Validation

**Test evidence at 900px tablet viewport:**
```
Tablet sidebar class: hidden md:flex flex-col h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 w-60
Dashboard label visible at 900px: true
```

The sidebar class at 900px is `w-60` (expanded) and the "Dashboard" text label is visible. The criterion requires the sidebar to show icons only (collapsed to `w-16`) at tablet viewports.

**Implementation approach suggestions:**
1. Add a `useMediaQuery` or `useWindowSize` hook to detect viewport width
2. In SidebarContext or Sidebar component, when viewport is between 768px-1024px (`md` but not `lg`), default `isCollapsed` to `true`
3. Use Tailwind's `lg:` breakpoint (1024px) to differentiate tablet from desktop
4. Consider: The existing `useLocalStorage` persistence should still work, but responsive defaults should apply when no explicit user preference is stored

## Previous Attempts

- Attempt 1 (build): Built complete app shell with sidebar, header, mobile nav. All features work correctly except the tablet-specific responsive behavior for sidebar auto-collapse.
