All tasks complete. Here's the summary:

---

# Build Attempt 1: Task 20 — Demo Infrastructure

## Implementation

### Created Files
1. **`demo/helpers.ts`** — 6 TypeScript-typed utility functions:
   - `pause(page, ms)` — wraps `page.waitForTimeout()` with descriptive name
   - `scenicPause(page, ms?)` — viewer-absorbs-content pause (default 1800ms)
   - `quickPause(page, ms?)` — short transition pause (default 600ms)
   - `smoothScroll(page, selector)` — smooth scroll into view with animation delay
   - `setViewport(page, width, height)` — viewport resize with React re-render settling delay
   - `dragAndDrop(page, source, target, options?)` — reliable HTML5 DnD via manual mouse sequence

2. **`playwright.demo.config.ts`** — Demo-specific Playwright config:
   - `headless: false` for live viewing
   - `timeout: 600_000` (10 min per spec)
   - `expect.timeout: 120_000` (2 min for highlights)
   - `retries: 0`, `reporter: 'list'`
   - `testDir: './demo'` — isolated from test suite
   - `webServer` reuses existing `npm run dev` on localhost:5173

3. **`demo/.gitkeep`** — directory placeholder

### Modified Files
4. **`package.json`** — Added `demo:highlights` and `demo:full` npm scripts
5. **`src/components/dashboard/StatCard.tsx`** — Added `testId` prop → `data-testid`
6. **`src/pages/Dashboard.tsx`** — Stat cards get testIds, charts section gets `data-testid="dashboard-charts"`
7. **`src/components/dashboard/TaskCompletionChart.tsx`** — `data-testid="chart-task-completion"`
8. **`src/components/dashboard/TaskStatusChart.tsx`** — `data-testid="chart-task-status"`
9. **`src/components/layout/Sidebar.tsx`** — `data-testid="sidebar"` on aside, `data-testid="nav-{page}"` on nav links
10. **`src/components/tasks/KanbanBoard.tsx`** — `data-testid="kanban-board"`
11. **`src/components/tasks/KanbanColumn.tsx`** — `data-testid="kanban-column-{variant}"`
12. **`src/components/projects/ProjectsTable.tsx`** — `data-testid="projects-table"`, `data-testid="project-actions-{id}"`

## Testing

### Build Check ✅
`npm run build` — TypeScript compilation + Vite build succeeded (2259 modules, 1.55s)

### Smoke Test ✅
3/3 smoke tests pass — app loads, navigation works, no console errors

### E2E Regression ✅
235/243 pass. 8 pre-existing failures in `task-7.1-validation.spec.ts` (hardcodes port 5174 — not caused by Task 20)

### Demo Isolation ✅
- Default `playwright test` finds 243 tests in `tests/e2e/` only
- `--config=playwright.demo.config.ts` finds 0 tests in `./demo` (expected — no demo specs yet)

## Handoff

```json
{
  "task": "20",
  "role": "build",
  "attempt": 1,
  "result": "pass",
  "filesModified": [
    "package.json",
    "src/components/dashboard/StatCard.tsx",
    "src/pages/Dashboard.tsx",
    "src/components/dashboard/TaskCompletionChart.tsx",
    "src/components/dashboard/TaskStatusChart.tsx",
    "src/components/layout/Sidebar.tsx",
    "src/components/tasks/KanbanBoard.tsx",
    "src/components/tasks/KanbanColumn.tsx",
    "src/components/projects/ProjectsTable.tsx"
  ],
  "filesCreated": [
    "demo/helpers.ts",
    "demo/.gitkeep",
    "playwright.demo.config.ts",
    "ai-docs/TASKS/20/test-results.md"
  ],
  "checksRun": [
    {"name": "build", "command": "npm run build", "pass": true},
    {"name": "smoke", "command": "npx playwright test tests/e2e/smoke.spec.ts --reporter=list", "pass": true},
    {"name": "e2e-regression", "command": "npx playwright test tests/e2e/ --reporter=list", "pass": true, "notes": "235/243 pass; 8 pre-existing failures in task-7.1-validation.spec.ts (hardcoded port 5174)"},
    {"name": "demo-isolation", "command": "npx playwright test --list", "pass": true, "notes": "243 tests from tests/e2e/ only; demo dir excluded"}
  ],
  "artifacts": ["/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/20/test-results.md"],
  "handoffNotes": "Demo infrastructure scaffolding complete: demo/helpers.ts with 6 typed utility functions, playwright.demo.config.ts with headed/generous-timeout settings, npm scripts for highlights and full-tour demos, and 20+ data-testid attributes across dashboard stat cards, charts, sidebar nav links, kanban board/columns, and projects table. All helpers are interaction-only with zero test assertions. Build passes, smoke passes, E2E regression unaffected. Demo config is fully isolated from test suite."
}
```