Now I have all the information I need. Let me write the comprehensive research document.

# Research: Task 19 - Playwright E2E Test Suite

**Task ID**: 19
**Researched**: 2026-01-29
**Dependencies**: Tasks 6-18 (all existing features must be implemented and passing)
**Estimated Complexity**: Major (comprehensive cross-cutting test suite covering all features, 1 new file created)

---

## Relevant Project Context

> This task creates a comprehensive E2E test suite covering all critical user flows across the entire application. It is a consolidation/integration-level testing task — no source code changes, only new test files.

**Project Type**: React 18 + TypeScript SPA with Vite, Tailwind CSS, React Router v6, Context-based state management, Playwright for E2E

**Key Files**:
- `playwright.config.ts` — Already configured: testDir `./tests/e2e`, baseURL `http://localhost:5173`, webServer auto-starts via `npm run dev`, Chromium only, fullyParallel
- `package.json` — Script `"test": "playwright test"`, dependency `@playwright/test: ^1.40.1`. **Note**: No `test:e2e` script currently exists (acceptance criteria says `npm run test:e2e` OR `npx playwright test`)
- `ai-docs/SPEC/HOW.md` — File structure section (lines 115-123) prescribes test file organization in `tests/e2e/` with feature-area naming (navigation.spec.ts, theme.spec.ts, projects.spec.ts, etc.)
- `src/context/ThemeContext.tsx` — Theme toggle adds/removes `dark` class on `document.documentElement`
- `src/components/layout/Header.tsx` — Theme toggle button with `data-testid="theme-toggle"`, aria-label "Switch to dark mode" / "Switch to light mode"
- `src/components/layout/MobileNav.tsx` — Hamburger opens `role="dialog"` overlay, close button has `aria-label="Close navigation menu"`
- `src/components/layout/Sidebar.tsx` — Nav items: Dashboard(/), Projects(/projects), Tasks(/tasks), Team(/team), Settings(/settings)

**Patterns in Use** (from existing 22 E2E test files):
- **Pattern: beforeEach cleanup** — `localStorage.clear()` or `localStorage.removeItem('appData')`, navigate to page, `waitForLoadState('networkidle')` or `waitForSelector('h1')`
- **Pattern: Selector strategy** — Prefer `getByRole`, `getByLabel`, `getByTestId`, `getByText` over CSS selectors
- **Pattern: Debounce waits** — `page.waitForTimeout(400)` after search input fills
- **Pattern: Animation waits** — `page.waitForTimeout(400)` after closing panels/modals (300ms animation + buffer)
- **Pattern: Console error tracking** — `page.on('console', ...)` with filter for benign errors
- **Pattern: Mobile viewport** — `page.setViewportSize({ width: 375, height: 812 })` for iPhone-size testing

**Relevant Prior Tasks**:
- Task 6: App shell, sidebar nav, header, mobile hamburger
- Task 10: Projects table (search, sort, pagination)
- Task 11: Project CRUD (modals, toasts)
- Task 12/13: Kanban board layout + drag-and-drop
- Task 14: Task CRUD + detail panel (SlideOver)
- Task 15: Team page (search, role filter)
- Task 17: Settings page (form, persistence, toast)
- Task 18: SlideOver component (Escape key close, backdrop close)

---

## Functional Requirements

### Primary Objective
Create a comprehensive, consolidated Playwright E2E test suite that covers ALL critical user flows in a single organized test file (or small set of files). This suite serves as the definitive integration test: navigation, theme toggle, projects CRUD, Kanban drag-drop, team filtering, settings persistence, and mobile responsive behavior. The task implements Story 29.

### Acceptance Criteria
From task packet — restated for clarity:
1. **playwright.config.ts** — Already configured (DONE, no changes needed)
2. **Navigation test** — Navigate to each page (Dashboard, Projects, Tasks, Team, Settings) via sidebar links, verifying URL and h1
3. **Dark mode test** — Toggle dark mode via header button, verify `dark` class on `<html>` element
4. **Projects search test** — Type in search input, wait for debounce, verify filtered row count
5. **Projects sort test** — Click column header, verify sort direction changes via `aria-sort` attribute and row order
6. **Project modal test** — Open "New Project" modal via button, verify dialog visible, close via Cancel, verify hidden
7. **Kanban drag test** — Drag a task card between columns, verify it appears in target column
8. **Task detail panel test** — Click a task card to open SlideOver, verify dialog visible, press Escape, verify hidden
9. **Team filter test** — Select a role from dropdown, verify filtered member count changes
10. **Settings save test** — Click save on settings page, verify toast notification "Settings saved!" appears
11. **Mobile hamburger test** — Set mobile viewport, verify sidebar hidden, click hamburger, verify overlay dialog appears
12. **All tests pass** with `npm run test:e2e` or `npx playwright test`
13. **Tests run against dev build** — Already configured via webServer in playwright.config.ts
14. **Test files in tests/e2e/ directory** — Already the configured testDir

### Scope Boundaries
**In Scope**:
- Creating a new comprehensive E2E test file: `tests/e2e/task-19-comprehensive-e2e.spec.ts`
- Optionally adding `"test:e2e"` script to package.json if it doesn't exist (for `npm run test:e2e` support)
- One smoke test: app loads without errors

**Out of Scope**:
- Modifying any source files (this is a test-only task)
- Modifying existing E2E test files (they remain as-is)
- Modifying playwright.config.ts (already properly configured)
- Adding new browser projects (Firefox, WebKit) — Chromium-only is fine

---

## Technical Approach

### Implementation Strategy

This task creates a single comprehensive test file organized by feature area using nested `test.describe()` blocks. Each describe block covers one acceptance criterion. The tests should reuse the same patterns observed across the 22 existing test files (selector strategies, beforeEach cleanup, wait patterns).

The test file structure follows a logical user journey: start with smoke (app loads), navigation (visit all pages), theme toggle (header control), then page-specific flows (projects, kanban, team, settings), and finally mobile responsive behavior.

Key design decisions:
- **Single file vs. multiple files**: HOW.md suggests separate files by feature area (navigation.spec.ts, theme.spec.ts, etc.), but the acceptance criteria says "comprehensive test suite" and many of these are quick single-test verifications. A single file with describe blocks for each area is the pragmatic approach that matches the consolidated nature of this task. The file name should be `task-19-comprehensive-e2e.spec.ts` (matching existing naming convention).
- **Test independence**: Each test within a describe block should be independent — use `beforeEach` with localStorage cleanup so tests don't depend on execution order.
- **Minimal redundancy**: Where existing test files already cover a scenario in detail (e.g., task-10 has 30 projects table tests), the Task 19 suite provides a focused "smoke-level" test for each area — just enough to confirm the critical path works.

### Files to Modify
| File | Changes |
|------|---------|
| `package.json` | Add `"test:e2e": "playwright test"` script (if missing, per acceptance criteria) |

### Files to Create
| File | Purpose |
|------|---------|
| `tests/e2e/task-19-comprehensive-e2e.spec.ts` | Comprehensive E2E suite covering all 11 acceptance criteria |

### Code Patterns to Follow
From existing test files and HOW.md:

**Test structure pattern**: Each describe block uses `test.beforeEach` for page navigation and localStorage cleanup. Tests use Playwright's built-in locator strategies (getByRole, getByLabel, getByTestId, getByText) with explicit waits for debounced inputs and animations.

**Smoke test pattern**: Track console errors via `page.on('console', ...)`, filter benign errors (favicon 404, network errors), assert zero real errors.

**Navigation pattern**: Click sidebar links via `page.locator('aside nav').getByText('PageName').click()`, assert URL via `expect(page).toHaveURL(/\/route/)`.

**Theme toggle pattern**: Click `page.getByTestId('theme-toggle')`, assert `document.documentElement.classList.contains('dark')` via `page.evaluate()`.

**Search/filter pattern**: Fill input, `waitForTimeout(400)` for debounce, assert filtered element count.

**Modal open/close pattern**: Click trigger button, assert `page.getByRole('dialog')` visible, click Cancel or press Escape, assert dialog not visible.

**Drag-and-drop pattern**: Use `taskCard.dragTo(targetColumn)` with column identified by `aria-label`.

**Mobile pattern**: `page.setViewportSize({ width: 375, height: 812 })`, then `page.goto('/')`, assert sidebar hidden, hamburger visible via `getByLabel('Open navigation menu')`.

### Integration Points
- No new source code integration — tests only interact with the running app via browser automation
- The webServer config in `playwright.config.ts` auto-starts the dev server before test execution
- Tests read/clear localStorage to control app state
- All test selectors map to existing HTML structure, ARIA attributes, and `data-testid` attributes already in the codebase

---

## Testing Strategy

### Smoke Test
- App loads at `/` without console errors
- All 5 routes render their page heading

### Functional Tests (mapped 1:1 to acceptance criteria)
1. **Navigation**: Click each sidebar link (Dashboard, Projects, Tasks, Team, Settings), verify URL changes and h1 content
2. **Theme toggle**: Click theme toggle in header, verify `dark` class appears on `<html>`, click again, verify `dark` class removed
3. **Projects search**: Navigate to `/projects`, type search term, wait for debounce, verify filtered row count is less than total
4. **Projects sort**: Click a column header (e.g., "Name"), verify `aria-sort` attribute changes direction
5. **Project modal open/close**: Click "New Project" button, verify dialog visible with form, click Cancel, verify dialog hidden
6. **Kanban drag**: Navigate to `/tasks`, drag a task card from "To Do" to "In Progress" column, verify card appears in target
7. **Task detail panel**: Click a task card, verify SlideOver dialog appears, press Escape, verify dialog dismisses
8. **Team filter**: Navigate to `/team`, select "developer" from role dropdown, verify member count changes from 8 to 4
9. **Settings save**: Navigate to `/settings`, click Save Changes button, verify "Settings saved!" toast appears
10. **Mobile hamburger**: Set viewport to 375x812, navigate to `/`, verify sidebar hidden, click hamburger, verify overlay dialog visible

### Regression Check
- All 22 existing E2E test files must continue passing
- The 8 pre-existing failures in `task-7.1-validation.spec.ts` (hardcoded port 5174) are known and excluded from pass criteria

### E2E Test Recommendations

- **Is this task user-facing?** Yes — this IS the E2E testing task itself
- **Recommended test file**: `tests/e2e/task-19-comprehensive-e2e.spec.ts`
- **Recommended test scenarios** (11 tests matching acceptance criteria):
  1. Smoke: App loads without console errors
  2. Navigate to each page via sidebar
  3. Toggle dark mode and verify `dark` class on html
  4. Search projects table and verify filtered results
  5. Sort projects table by clicking column header
  6. Open and close project create modal
  7. Drag task between Kanban columns
  8. Open task detail panel and close with Escape
  9. Filter team members by role dropdown
  10. Save settings and verify toast notification
  11. Mobile viewport: hamburger menu opens sidebar overlay
- **Existing E2E tests to preserve**: All 22 existing files must continue passing (except the 8 known failures in task-7.1-validation.spec.ts)
- **Regression risk assessment**: ZERO risk — this task only creates new test files and does not modify any source code. Existing tests cannot break.

---

## Considerations

### Potential Pitfalls
- **Missing `test:e2e` script**: The acceptance criteria mentions `npm run test:e2e` but package.json only has `"test": "playwright test"`. Need to add `"test:e2e": "playwright test"` script. This is a trivial one-line change.
- **Drag-and-drop reliability**: The `dragTo()` API can be flaky in CI. The existing task-13 tests prove it works in this codebase, so follow the same pattern. Use `taskCard.dragTo(targetColumn)` which is the established approach.
- **Theme toggle aria-label changes**: The theme toggle button's aria-label changes between "Switch to dark mode" and "Switch to light mode" depending on current state. Use `data-testid="theme-toggle"` for reliable selection.
- **Debounce timing**: Search filters use 300ms debounce. Existing tests consistently use `waitForTimeout(400)` for safety margin. Follow this pattern.
- **Animation timing**: SlideOver/Modal close animations take ~300ms. Existing tests use `waitForTimeout(400)` after close operations. Follow this pattern.

### Edge Cases
- **localStorage interference between tests**: Each test block's `beforeEach` must clear localStorage to prevent cross-test contamination. Use `page.evaluate(() => localStorage.clear())` as the standard pattern.
- **Viewport reset**: The mobile test changes viewport size. If tests run in parallel (fullyParallel: true), this is fine since each test gets its own browser context. If running sequentially within a describe block, ensure viewport is only set where needed.
- **Theme state leaking**: The dark mode test modifies the theme. Since `beforeEach` clears localStorage, the theme will reset to light on the next test. But verify via explicit assertion, not assumption.

---

```json
{
  "task": "19",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "playwright.config.ts",
    "package.json",
    "tsconfig.json",
    "src/context/ThemeContext.tsx",
    "src/components/layout/Header.tsx",
    "src/components/layout/MobileNav.tsx",
    "src/components/layout/Sidebar.tsx",
    "src/App.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/Projects.tsx",
    "src/pages/Tasks.tsx",
    "src/pages/Team.tsx",
    "src/pages/Settings.tsx",
    "tests/e2e/smoke.spec.ts",
    "tests/e2e/task-6-appshell.spec.ts",
    "tests/e2e/task-6.1-tablet-sidebar.spec.ts",
    "tests/e2e/task-10-projects-table.spec.ts",
    "tests/e2e/task-11-project-crud.spec.ts",
    "tests/e2e/task-12-kanban.spec.ts",
    "tests/e2e/task-13-kanban-dnd.spec.ts",
    "tests/e2e/task-14-task-crud.spec.ts",
    "tests/e2e/task-15-team.spec.ts",
    "tests/e2e/task-17-settings.spec.ts",
    "tests/e2e/task-18-slideover.spec.ts"
  ],
  "planSummary": "Create a single comprehensive E2E test file (tests/e2e/task-19-comprehensive-e2e.spec.ts) with 11 tests covering all acceptance criteria: smoke, navigation, dark mode toggle, projects search/sort/modal, Kanban drag-drop, task detail panel with Escape close, team role filtering, settings save with toast, and mobile hamburger menu. Add test:e2e script to package.json. No source code modifications — test-only task following established patterns from 22 existing test files.",
  "scope": {
    "level": "minor",
    "rationale": "Test-only task creating 1 new test file and adding 1 script to package.json. Zero source code changes. All test patterns are already established across 22 existing E2E files. No architecture changes. Low risk, high coverage consolidation."
  }
}
```