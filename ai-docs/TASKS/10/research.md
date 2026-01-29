Now I have all the information needed. Let me compile the comprehensive research document:

# Research: Task 10 - Projects Table with Display, Filtering, Sorting, and Pagination

**Task ID**: 10
**Researched**: 2026-01-29
**Dependencies**: Tasks 8, 9 (both passed — Dashboard page, charts, UI components, and data layer all operational)
**Estimated Complexity**: Major

---

## Relevant Project Context

> This is a React 18 + TypeScript SPA (project management dashboard) using Tailwind CSS, React Router v6, Vite, and Context+useReducer for state management. No backend — all data sourced from mock data persisted in localStorage.

**Project Type**: React 18 + TypeScript project management dashboard SPA

**Key Files**:
- `src/pages/Projects.tsx` — Current placeholder (10 lines), will become the main Projects page
- `src/types/index.ts` — `Project` and `ProjectStatus` type definitions
- `src/data/mockData.ts` — 10 mock projects with varied statuses/progress, 8 team members
- `src/context/DataContext.tsx` — `useData()` hook providing `state.projects` and `state.team`
- `src/hooks/useDebounce.ts` — Generic debounce hook (already implemented)
- `src/components/ui/Badge.tsx` — Status badge with `green | yellow | blue | red | gray` variants
- `src/components/ui/ProgressBar.tsx` — Progress bar with percentage display, color variants
- `src/components/ui/Dropdown.tsx` — Keyboard-accessible dropdown with custom trigger support
- `src/components/ui/Input.tsx` — Form input with label/error/helperText
- `ai-docs/SPEC/HOW.md` — Architecture patterns (Pattern 5 = table sorting/filtering hook)

**Patterns in Use**:
- Pattern 1: Context + useReducer for domain state (DataContext)
- Pattern 5: Render props / custom hook for table sorting/filtering (`useProjectTable`)
- Pattern 6: Component variants via Tailwind class composition (Badge, Button, etc.)
- Mobile-first responsive design with `md:` and `lg:` breakpoints
- Dark mode via `dark:` Tailwind prefix (class-based strategy)
- Lucide React for all icons

**Relevant Prior Tasks**:
- Task 8: Established Dashboard page pattern (page component consumes `useData()`, renders sub-components)
- Task 9: Added chart components, demonstrated integration of new sections into existing pages
- Both tasks passed validation and build checks — all 18 + 13 E2E tests passing

---

## Functional Requirements

### Primary Objective
Build the Projects page (`/projects`) with a full-featured data table that displays project information across six columns (Name, Status, Progress, Team Lead, Due Date, Actions), includes debounced search filtering by project name, clickable column header sorting with directional indicators, and pagination with 5 items per page. This is the first "feature page" with complex interaction patterns (search, sort, paginate) and establishes the table pattern that may be reused across the app.

### Acceptance Criteria
From task packet — restated for clarity:

1. **Route rendering**: Projects page renders at `/projects` route (route already exists in App.tsx)
2. **Table columns**: Name, Status, Progress, Team Lead, Due Date, Actions
3. **Status badges**: Colored Badge component — Active=green, On Hold=yellow, Completed=blue (Archived=gray inferred from Badge variants)
4. **Progress column**: Percentage value with visual ProgressBar component
5. **Due Date formatting**: Readable date format (e.g., "Feb 15, 2026") — note: mock data uses ISO format like "2024-03-15"
6. **Actions column**: Dropdown menu icon (kebab/three-dot icon) — uses Dropdown component with custom trigger
7. **Alternating row backgrounds**: Striped table rows for readability (even/odd Tailwind classes)
8. **Mobile horizontal scroll**: Table scrollable on small viewports via `overflow-x-auto` wrapper
9. **Search input**: Above table, filters projects by name (case-insensitive)
10. **Debounced search**: 300ms delay before filtering applies (using existing `useDebounce` hook)
11. **Column header sorting**: Clicking header sorts by that column
12. **Sort indicators**: Arrow icon shows current sort column and direction (ascending/descending)
13. **Toggle sort direction**: Clicking same header toggles between asc/desc
14. **Default sort**: Name ascending on initial load
15. **Empty state**: Message displayed when search returns no results
16. **Pagination size**: 5 projects per page (10 total projects = 2 pages default)
17. **Pagination controls**: Previous button, numbered page buttons, Next button
18. **Current page highlight**: Active page number visually distinguished
19. **Boundary controls**: Previous disabled on page 1, Next disabled on last page
20. **Page info text**: "Showing X-Y of Z projects" below or near pagination
21. **Search resets pagination**: Changing search query resets to page 1

### Scope Boundaries
**In Scope**:
- Full table display with all 6 columns
- Search filtering (name only, debounced)
- Multi-column sorting with direction toggle
- Pagination with controls and info text
- Responsive design (mobile horizontal scroll)
- Dark mode support
- Accessibility (semantic table, keyboard-accessible headers, ARIA attributes)
- Actions column with kebab icon and dropdown menu (placeholder actions — view, edit, delete labels)

**Out of Scope**:
- Project CRUD modals (Task 11)
- Functional delete/edit/view actions (Task 11)
- Status filter dropdown (not in acceptance criteria — only name search)
- Server-side pagination/sorting (all client-side)
- Drag-and-drop row reordering

---

## Technical Approach

### Implementation Strategy

The implementation follows Pattern 5 from HOW.md: extract all table logic (search, sort, pagination) into a custom `useProjectTable` hook, keeping the UI components purely presentational. The Projects page orchestrates the components, and each sub-component (table, filters, pagination) handles only its own visual rendering.

The core data flow is: `useData().state.projects` → `useProjectTable` hook (filter → sort → paginate) → presentational table component. The hook manages four pieces of state: `search` (raw string), `sortKey` (column key), `sortDir` (asc/desc), and `page` (current page number). It uses `useDebounce` for the search term and `useMemo` for the derived filtered/sorted/paginated data.

The team lead column requires resolving `teamLead` (a string ID like "tm-1") to the team member's name from `state.team`. This lookup should be done at render time in the table row, not in the sort/filter logic, except when sorting by team lead — in that case, the sort comparator needs access to the team member lookup map.

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/projects/ProjectsTable.tsx` | Main table component — renders `<table>` with sortable headers, project rows, alternating backgrounds |
| `src/components/projects/ProjectFilters.tsx` | Search input above the table with search icon |
| `src/components/projects/Pagination.tsx` | Pagination controls: Prev, page numbers, Next, info text |
| `src/hooks/useProjectTable.ts` | Custom hook encapsulating filter/sort/page logic (per HOW.md Pattern 5) |
| `tests/e2e/task-10-projects-table.spec.ts` | E2E tests for all acceptance criteria |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/Projects.tsx` | Replace placeholder with full implementation — imports `useData`, `useProjectTable`, renders heading + `ProjectFilters` + `ProjectsTable` + `Pagination` |

### Component Architecture

The page structure will be:

**Projects.tsx** (page)
- Page heading ("Projects")
- `ProjectFilters` — search input with magnifying glass icon
- Scroll wrapper (`overflow-x-auto`) containing `ProjectsTable`
  - `<table>` with `<thead>` (sortable column headers) and `<tbody>` (project rows)
  - Each row renders: Name (text), Status (Badge), Progress (ProgressBar + percentage), Team Lead (name string), Due Date (formatted), Actions (Dropdown with kebab trigger)
  - Empty state message when no results
- `Pagination` — page controls + info text

### useProjectTable Hook Design

The hook accepts `projects` array and `pageSize` (default 5). It manages:

- **search / setSearch**: Raw search string (controlled input)
- **debouncedSearch**: Via `useDebounce(search, 300)`
- **sortKey / sortDir**: Current sort column and direction
- **page / setPage**: Current page number

Derived values (all `useMemo`):
- **filtered**: Projects where name includes debouncedSearch (case-insensitive)
- **sorted**: Filtered projects sorted by sortKey in sortDir order
- **paginated**: Slice of sorted for current page
- **totalCount**: `filtered.length`
- **totalPages**: `Math.ceil(filtered.length / pageSize)`

The hook also exposes a `toggleSort(key)` function that either changes sortKey (resetting dir to 'asc') or toggles sortDir if already sorting by that key.

A `useEffect` resets page to 1 whenever `debouncedSearch` changes.

### Sorting Considerations

The sortable columns and their sort types:
- **Name**: String comparison (locale-aware via `localeCompare`)
- **Status**: String comparison (alphabetical — active, archived, completed, on-hold)
- **Progress**: Numeric comparison
- **Team Lead**: Requires team member name lookup, then string comparison
- **Due Date**: Date string comparison (ISO format "YYYY-MM-DD" sorts correctly as strings)
- **Actions**: Not sortable

For team lead sorting, a `teamMap` (Record of id → TeamMember) should be constructed once via `useMemo` from `state.team`, passed to the hook or used in the comparator.

### Date Formatting

Due dates in mock data are ISO strings like "2024-03-15". Format to readable using `Intl.DateTimeFormat` or a simple function:
- `new Date('2024-03-15').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` → "Mar 15, 2024"

### Actions Dropdown

Use the existing `Dropdown` component with a custom trigger (kebab icon from Lucide — `MoreVertical` or `MoreHorizontal`). Dropdown items: "View", "Edit", "Delete" (all placeholder actions for Task 10; functional behavior deferred to Task 11). The dropdown should use `align="right"` to prevent overflow on the rightmost column.

### Code Patterns to Follow
From `SPEC/HOW.md`:

- **Pattern 5 (Table sorting/filtering)**: Extract all data logic into `useProjectTable` custom hook. The page component and table component remain purely presentational.
- **Pattern 6 (Component variants)**: Use Tailwind class composition with Record types for status-to-variant mappings.
- **Anti-pattern avoidance**: No `any` types. No business logic in components (all in hook). No inline object creation in JSX. Use `useMemo` for expensive operations.
- **Component structure**: Imports → Types → Constants → Component → Export.
- **TypeScript conventions**: Explicit return types on all exported functions. Interface over type for object shapes. Named `Props` interfaces.

### Integration Points
- `useData()` from DataContext provides `state.projects` and `state.team`
- `useDebounce` from hooks provides debounced search value
- `Badge` component for status rendering (variant mapping: active→green, on-hold→yellow, completed→blue, archived→gray)
- `ProgressBar` component for progress visualization
- `Dropdown` component for actions menu
- `Input` component could be used for search, or a custom styled input with search icon for better UX
- Lucide icons: `Search` (for search input), `MoreVertical` (for kebab menu), `ChevronUp`/`ChevronDown` or `ArrowUp`/`ArrowDown` (for sort indicators), `ChevronLeft`/`ChevronRight` (for pagination)

---

## Testing Strategy

### Smoke Test
- App loads without console errors at `/projects`
- TypeScript compilation passes (`tsc --noEmit`)
- Vite production build succeeds

### Functional Tests
Tests should follow the established pattern (Playwright, `test.describe` block, `beforeEach` with localStorage clear):

**Display Tests:**
- Projects page renders at `/projects` with heading
- Table displays with all 6 column headers visible
- All 10 projects visible across pages (5 on page 1, 5 on page 2)
- Status badges show correct colors (Active=green, On Hold=yellow, Completed=blue)
- Progress bars render with percentage values
- Due dates display in readable format (e.g., "Mar 15, 2024")
- Team lead names display (not IDs)
- Actions dropdown (kebab icon) visible in each row
- Table has alternating row backgrounds

**Search Tests:**
- Search input is visible above the table
- Typing a project name filters the table
- Search is case-insensitive
- Empty state message appears when no results match
- Clearing search shows all projects again

**Sort Tests:**
- Default sort is by Name ascending
- Clicking column header sorts by that column
- Sort indicator arrow is visible on active sort column
- Clicking same header toggles direction
- Sorting works for Name, Status, Progress, Due Date columns

**Pagination Tests:**
- Pagination controls visible below table
- Shows 5 projects per page
- Page 1 is highlighted by default
- "Showing 1-5 of 10 projects" text visible
- Clicking Next goes to page 2, showing remaining projects
- Previous is disabled on first page
- Next is disabled on last page
- Page info updates correctly ("Showing 6-10 of 10 projects")

**Search + Pagination Integration:**
- Searching resets to page 1
- Pagination adjusts to filtered result count

### Regression Check
- All Task 8 dashboard tests (18) still pass
- All Task 9 chart tests (13) still pass
- Smoke tests (3) still pass
- Navigation to `/projects` via sidebar still works

---

## Considerations

### Potential Pitfalls

1. **Team lead ID resolution**: The `teamLead` field stores an ID ("tm-1"), not a name. Must build a lookup map from `state.team` and resolve at render time. If a team member ID is not found, show a fallback (the raw ID or "Unknown").

2. **Sort stability for equal values**: When two projects have the same sort value (e.g., same status), the sort should be stable. Using `Array.prototype.sort` is not guaranteed stable in all engines; consider a secondary sort key (name) for tie-breaking.

3. **Date parsing**: Mock dates use ISO "YYYY-MM-DD" format. Direct string comparison works for sorting (lexicographic order matches chronological). For display, use `Intl.DateTimeFormat` to avoid timezone issues — construct the date as UTC to prevent off-by-one day errors.

4. **Dropdown overflow**: The actions dropdown in the last column and last rows could overflow the table container. Use `align="right"` on the Dropdown and ensure the scroll container doesn't clip the dropdown (may need `overflow-visible` on the cell or portal rendering — the existing Dropdown uses `absolute` positioning within its container, which the `overflow-x-auto` wrapper might clip). Worst case, the dropdown is clipped on mobile scroll — acceptable for MVP.

5. **localStorage state pollution**: Tests must clear localStorage before each run (established pattern from Task 8 tests). The DataContext falls back to mock data when localStorage is empty, ensuring consistent test data.

6. **ProgressBar in table cells**: The ProgressBar component includes a label/value header above the bar. In the table, use `showValue` to display the percentage alongside a compact bar. The bar width needs a minimum width constraint so very small progress values are still visible.

### Edge Cases

1. **Empty search results**: Display a descriptive empty state message ("No projects found matching your search") inside the table body with a `colspan` spanning all columns.

2. **Single page of results**: When filtered results are 5 or fewer, pagination should still render but with only page 1 and both Previous/Next disabled.

3. **All projects filtered out**: "Showing 0-0 of 0 projects" — ensure the pagination info text handles zero gracefully.

4. **Rapid search input**: Debounce ensures filtering only runs after 300ms of inactivity. The `useDebounce` hook handles cleanup of intermediate timeouts.

5. **Sort direction persistence across column changes**: When switching sort columns, direction resets to ascending (standard UX pattern).

### Data Snapshot

10 projects with the following distribution:
- **Active**: 5 projects (proj-1, 2, 5, 7, 10)
- **On Hold**: 2 projects (proj-3, 8)
- **Completed**: 2 projects (proj-4, 9)
- **Archived**: 1 project (proj-6)

Default page 1 (sorted by name ascending): API Integration Platform, Customer Portal v2.0, Design System v3, E-commerce Analytics Dashboard, Internal Tools Migration. Page 2: Marketing Website Refresh, Mobile App Redesign, Payment Gateway Integration, Performance Optimization Sprint, Security Audit & Compliance.

Team leads are only tm-1 (Sarah Chen) and tm-7 (Rachel Green) across all 10 projects.

---

```json
{
  "task": "10",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "ai-docs/TASKS/9/build_attempt_1.md",
    "ai-docs/TASKS/9/research.md",
    "ai-docs/TASKS/9/build_attempt_1_handoff.json",
    "ai-docs/TASKS/9/test-results.md",
    "src/pages/Projects.tsx",
    "src/pages/Dashboard.tsx",
    "src/App.tsx",
    "src/types/index.ts",
    "src/data/mockData.ts",
    "src/context/DataContext.tsx",
    "src/hooks/useDebounce.ts",
    "src/components/ui/Badge.tsx",
    "src/components/ui/ProgressBar.tsx",
    "src/components/ui/Dropdown.tsx",
    "src/components/ui/Input.tsx",
    "tests/e2e/task-8-dashboard.spec.ts"
  ],
  "planSummary": "Build the Projects page by creating 4 new files (useProjectTable hook, ProjectsTable, ProjectFilters, Pagination components) and modifying Projects.tsx. The hook encapsulates all search/sort/pagination logic using useDebounce and useMemo. The table uses existing Badge, ProgressBar, and Dropdown components. Search is debounced at 300ms, sorting supports all data columns with direction toggle, and pagination shows 5 items per page with full navigation controls. E2E tests will cover all 21 acceptance criteria.",
  "scope": {
    "level": "major",
    "rationale": "5 new files created, 1 file modified, establishes the table/sort/filter/paginate pattern for the first time in the app, introduces a new custom hook with complex state management, and requires comprehensive E2E testing (~25+ tests). Cross-cutting concerns: data resolution (team lead IDs → names), date formatting, responsive design, accessibility (table semantics, ARIA sort attributes)."
  }
}
```