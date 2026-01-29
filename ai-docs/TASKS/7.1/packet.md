# Task 7.1: Fix dark mode background color and add system theme selector

**Parent Task**: 7
**Created By**: Validate agent (attempt 1)

## Problem

Task 7 validation failed due to two issues:
1. Dark mode background color uses gray-950 instead of specified gray-900
2. No UI exists in Settings page to select "system" theme option

## Root Cause

### Issue 1: Wrong background color
The AppShell component uses `dark:bg-gray-950` but the acceptance criteria specifies `dark:bg-gray-900`. This is a simple class name mismatch.

### Issue 2: Missing system theme selector
While the ThemeContext fully supports 'system' theme mode and respects OS preferences (prefers-color-scheme), there is no user-facing UI to select this option:
- Settings page is currently just a placeholder
- Header toggle only cycles between light and dark modes
- Users cannot access the system theme feature

## Acceptance Criteria

- [ ] AppShell background in dark mode is `dark:bg-gray-900` (not gray-950)
- [ ] Settings page has theme preference selector UI
- [ ] Theme selector offers three options: Light, Dark, System
- [ ] Selecting "System" theme follows OS prefers-color-scheme
- [ ] Theme preference is saved to localStorage
- [ ] Current theme selection is visually indicated in Settings
- [ ] All original Task 7 acceptance criteria still pass
- [ ] Build completes without errors
- [ ] No console errors when switching themes

## Context from Validation

### Evidence - Issue 1 (Background Color)
**File:** `/Users/jackjin/dev/harness-v2-test/src/components/layout/AppShell.tsx`
**Line:** 22
**Current:** `<div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">`
**Expected:** `<div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">`

### Evidence - Issue 2 (Missing System Theme UI)
**File:** `/Users/jackjin/dev/harness-v2-test/src/pages/Settings.tsx`
**Current:** Empty placeholder with just heading
**Expected:** Theme preference selector with radio buttons or segmented control for Light/Dark/System options

**ThemeContext already supports:**
- Type definition includes 'system' (ThemeContext.tsx line 4)
- OS preference detection via matchMedia (ThemeContext.tsx lines 26-29)
- Dynamic listener for OS theme changes (ThemeContext.tsx lines 42-56)

**What's missing:**
- UI controls in Settings page to select theme preference
- Visual indication of current theme selection

## Implementation Guidance

### Fix 1: Background Color (Simple)
Change AppShell.tsx line 22 from `dark:bg-gray-950` to `dark:bg-gray-900`

### Fix 2: System Theme Selector (Moderate)
Add theme preference selector in Settings page:
1. Import `useTheme` hook
2. Create radio button group or segmented control with three options
3. Wire up to `setTheme` function
4. Visually indicate current selection
5. Follow existing component patterns (use Card, consistent spacing)

**Suggested UI pattern:**
```tsx
<Card>
  <h2>Theme Preference</h2>
  <div role="radiogroup">
    <label>
      <input type="radio" value="light" checked={theme === 'light'} onChange={...} />
      Light
    </label>
    <label>
      <input type="radio" value="dark" checked={theme === 'dark'} onChange={...} />
      Dark
    </label>
    <label>
      <input type="radio" value="system" checked={theme === 'system'} onChange={...} />
      System (follows OS preference)
    </label>
  </div>
</Card>
```

## Previous Attempts

None - This is the first attempt to fix these issues identified in Task 7 validation.
