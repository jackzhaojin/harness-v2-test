The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/8/research.md`. Here's a summary:

## Research Summary: Task 8 - Dashboard Page with Stats Cards and Activity Feed

**Scope**: Minor — 1 file modified (Dashboard.tsx), 2 new components created, 1 test file, no architecture changes.

### Key Findings

**Files to Create**:
- `src/components/dashboard/StatCard.tsx` — Reusable clickable stat card with icon, label, numeric value, and navigation via `useNavigate()`
- `src/components/dashboard/ActivityFeed.tsx` — Activity feed showing last 5 items with Avatar, formatted action text, relative timestamps, and "View all" link
- `tests/e2e/task-8-dashboard.spec.ts` — E2E tests for all 16 acceptance criteria

**File to Modify**:
- `src/pages/Dashboard.tsx` — Replace 10-line placeholder with full implementation

**Integration Points**:
- `useData()` from DataContext for projects/tasks/team counts
- `activities` imported directly from `mockData.ts` (not in DataContext)
- Existing `Card` and `Avatar` UI components reused
- `useNavigate()` and `Link` from react-router-dom for navigation
- Lucide icons: `FolderKanban`, `CheckSquare`, `Users`, `CheckCircle`/`TrendingUp`

**Critical Regression Risks**:
- Must preserve `<h1>` containing "Dashboard" text (existing smoke test depends on it)
- localStorage may have stale data — E2E tests should account for this
- TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`) requires clean imports