The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/9/research.md`. Here's a summary of the findings:

## Research Summary: Task 9 - Dashboard Charts with Recharts Integration

**Scope**: Minor — localized change (2 new files, 1 modified file, 1 test file)

### Key Findings

1. **Recharts v2.10.3 is already installed** as a dependency in `package.json` — no installation needed.

2. **Two new component files** to create in `src/components/dashboard/`:
   - `TaskCompletionChart.tsx` — Line chart showing task completions over 7 days (Mon–Sun)
   - `TaskStatusChart.tsx` — Pie/donut chart showing task distribution by status (To Do: 7, In Progress: 6, Done: 4)

3. **One file to modify**: `src/pages/Dashboard.tsx` — add a responsive `grid-cols-1 lg:grid-cols-2` section below ActivityFeed containing both chart components.

4. **Theme adaptation**: Use `useTheme()` + check `document.documentElement.classList.contains('dark')` to resolve actual dark/light state, then pass hex color values to Recharts components (Recharts requires inline color strings, not Tailwind classes).

5. **Data source**: Both charts derive data from `useData().state.tasks` (DataContext). Pie chart groups by status; line chart generates a deterministic 7-day distribution from done tasks.

6. **Color scheme**: Pie segments use semantic colors matching existing Badge conventions (gray/amber/emerald for todo/in-progress/done). Line chart uses blue stroke. All colors have lighter dark-mode variants.

7. **Naming strategy**: Component names (`TaskCompletionChart`, `TaskStatusChart`) avoid collision with Recharts' own `LineChart`/`PieChart` exports.

8. **Existing tests**: 19 task-8 dashboard tests + 3 smoke tests must not regress. New E2E test file will verify chart rendering, labels, legends, tooltips, and no console errors.