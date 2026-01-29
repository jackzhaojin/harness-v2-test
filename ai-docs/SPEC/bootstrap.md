I have created a comprehensive task breakdown for the Project Management Dashboard MVP. Here's the summary:

## Task Breakdown Summary

I created **19 comprehensive tasks** that cover all 29 user stories from the requirements, grouped by feature area for efficient Sonnet sessions:

| Task | Title | Complexity | Dependencies |
|------|-------|------------|--------------|
| 1 | Project scaffolding (Vite, React, TS, Tailwind) | Medium | - |
| 2 | Type definitions and mock data | Medium | 1 |
| 3 | Core context providers and hooks | Large | 2 |
| 4 | Reusable UI component library | Large | 1 |
| 5 | Modal and Toast notification systems | Medium | 3, 4 |
| 6 | App shell with sidebar and header | Large | 3, 4 |
| 7 | Dark/light theme toggle | Medium | 6 |
| 8 | Dashboard stats cards and activity feed | Medium | 6, 7 |
| 9 | Dashboard charts (Recharts) | Medium | 8 |
| 10 | Projects table (display, filter, sort, paginate) | Large | 6, 7 |
| 11 | Project CRUD operations with modals | Medium | 5, 10 |
| 12 | Kanban board layout and task cards | Medium | 6, 7 |
| 13 | Kanban drag-and-drop with persistence | Medium | 12 |
| 14 | Task CRUD with forms and detail panel | Large | 5, 13 |
| 15 | Team members page with grid and filtering | Medium | 6, 7 |
| 16 | Team member invite modal | Small | 5, 15 |
| 17 | Settings page (profile, notifications, appearance) | Large | 5, 6, 7 |
| 18 | SlideOver panel component | Medium | 3, 4 |
| 19 | Playwright E2E test suite | Large | 11, 14, 16, 17 |

### Key Design Decisions:

1. **Foundation First**: Tasks 1-5 establish the complete infrastructure (scaffolding, types, contexts, UI library, modals/toasts)

2. **Grouped Related Stories**: Multiple user stories combined into single tasks (e.g., Task 10 combines Stories 8, 9, 10 for projects table)

3. **Self-Testable**: Every task produces visible, verifiable output - no tasks that "just set up data models"

4. **Proper Dependencies**: No circular references; foundation tasks unlock page-specific work

5. **E2E Tests Last**: Task 19 runs after all features are complete to test the full integrated application

```json
{
  "agent": "spec-when",
  "mode": "bootstrap",
  "action": "generated",
  "output": "SPEC/TASKS.json",
  "taskCount": 19,
  "newTaskIds": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
  "complexityBreakdown": {
    "small": 1,
    "medium": 11,
    "large": 7
  },
  "handoffNotes": "19 tasks covering all 29 user stories. Foundation tasks (1-5) establish infrastructure. Page tasks (6-17) build features incrementally. Task 18 adds SlideOver component. Task 19 adds comprehensive E2E tests. Dependency chain ensures proper build order with parallel tracks for Projects (10-11) and Tasks/Kanban (12-14) pages."
}
```