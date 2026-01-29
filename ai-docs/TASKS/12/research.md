The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/12/research.md`. Here's a summary:

## Research Summary: Task 12 — Kanban Board Layout and Task Card Display

**Scope**: Minor — 3 new files + 1 modified file, localized to the tasks feature area

### Key Findings

1. **Tasks.tsx is currently a placeholder** — just a heading and "Tasks page placeholder" text. Route is already wired at `/tasks` in `App.tsx`.

2. **Three new component files** to create in `src/components/tasks/`:
   - **KanbanBoard.tsx** — Container that reads `useData().state.tasks`, groups by status into 3 arrays, builds a team member lookup map, renders responsive 3-column grid
   - **KanbanColumn.tsx** — Single column with header (name + count badge), scrollable task list, empty state placeholder, subtle background color differentiation
   - **TaskCard.tsx** — Card showing title, assignee avatar (small, circular, with tooltip), priority badge (reusing existing Badge component), and formatted due date with overdue detection

3. **One file to modify**: `src/pages/Tasks.tsx` — replace placeholder with page title + KanbanBoard import

4. **Existing UI components to reuse**: Badge (variants: gray/yellow/red for low/medium/high priority), Avatar (size="sm", with src and name props), Card patterns (white/gray-800 with shadow)

5. **Data**: 17 mock tasks distributed as 7 todo / 6 in-progress / 4 done. Assignees reference team member IDs (`tm-1` through `tm-8`) requiring a lookup map.

6. **All dates are overdue** (mock data uses 2024 dates in a 2026 context) — this is expected behavior, not a bug.

7. **Responsive design**: Mobile-first with `grid-cols-1` default, `lg:grid-cols-3` for desktop. Columns need scrollable content areas via `overflow-y-auto` with constrained height.

8. **No architectural changes needed** — follows existing patterns from DataContext, Badge, Avatar, and the Dashboard/Projects page implementations.