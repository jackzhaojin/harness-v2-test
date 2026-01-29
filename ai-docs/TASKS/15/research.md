I now have a thorough understanding of the codebase. Let me write the research output.

# Research: Task 15 - Team Members Page with Grid and Filtering

**Task ID**: 15
**Researched**: 2026-01-29
**Dependencies**: None (Team page route exists at `/team` as a placeholder)
**Estimated Complexity**: Minor-to-moderate (1 page modified, 3 new component files, 1 new hook file, 1 new test file)

---

## Relevant Project Context

> Team page currently renders at `/team` but is a placeholder (`src/pages/Team.tsx` — "Team page placeholder"). This task replaces the placeholder with a fully functional team members grid with search and role filtering.

**Project Type**: React 18 + TypeScript SPA with Vite, Tailwind CSS, and Context-based state management

**Key Files**:
- `src/pages/Team.tsx` — Placeholder page to be replaced (lines 1-10)
- `src/types/index.ts` — `TeamMember` interface with `id`, `name`, `email`, `role`, `avatar`, `isOnline` (lines 31-38); `TeamRole` type: `'developer' | 'designer' | 'manager'` (line 5)
- `src/data/mockData.ts` — 8 team members with mixed roles (4 developers, 2 designers, 2 managers) and online statuses (5 online, 3 offline) (lines 4-69)
- `src/context/DataContext.tsx` — `useData()` hook providing `state.team` as `TeamMember[]` (line 8, line 127-133)
- `src/components/ui/Avatar.tsx` — Reusable Avatar with `showStatus` and `isOnline` props, supports `sm`/`md`/`lg` sizes (lines 1-80)
- `src/components/ui/Card.tsx` — Reusable Card with `padding` and `shadow` props, dark mode support (lines 1-40)
- `src/components/ui/Badge.tsx` — Reusable Badge with color variants (lines 1-40)
- `src/components/ui/Input.tsx` — Reusable form Input (lines 1-62)
- `src/components/ui/Select.tsx` — Reusable Select dropdown with `options`, `value`, `onChange` signature (lines 1-82)
- `src/hooks/useDebounce.ts` — Existing debounce hook (300ms standard) (lines 1-23)
- `ai-docs/SPEC/HOW.md` — Architecture patterns and conventions

**Patterns in Use**:
- **Pattern 1** (Context + useReducer): `useData()` provides `state.team` — the team member array. Read-only access for this task (no mutations needed).
- **Pattern 5** (Render Props / custom hook for filtering): `useProjectTable` in `src/hooks/useProjectTable.ts` demonstrates the exact pattern — separating filter/sort logic into a custom hook with `useMemo` for derived data, `useDebounce` for search.
- **Pattern 6** (Component Variants): Badge and Avatar already have variant styling with Tailwind.
- **Tailwind Conventions**: Mobile-first with `md:` and `lg:` breakpoints, `dark:` prefix for all color utilities.

**Relevant Prior Tasks**:
- Tasks 10-11: Established the Projects page with table, search filtering (via `useProjectTable` hook), and CRUD. The filtering pattern (custom hook + `useMemo`) should be replicated for team members.
- Tasks 12-14: Established Kanban board with task cards. Card hover effects pattern (`hover:shadow-md transition-shadow duration-200`) already in use.

---

## Functional Requirements

### Primary Objective
Build the Team page with a responsive card grid layout displaying all team members from the DataContext. Each member card shows a large avatar, name, role, email (as mailto link), and online status indicator. Users can filter by text search (name) and role dropdown, with combined filtering, result count display, and an empty state message.

### Acceptance Criteria
From task packet — restated for clarity:
1. **Team page renders at /team route**: Replace the existing placeholder page with the full implementation
2. **Responsive card grid layout**: CSS Grid with 1 column on mobile (< md), 2 columns on tablet (md), 3 columns on desktop (lg)
3. **Member card content**: Large avatar (using existing `Avatar` component with `lg` size + `showStatus`), full name, role (capitalized), email as clickable `mailto:` link, online/offline status dot
4. **Online status indicator**: Green dot for online, gray dot for offline — already implemented in `Avatar` component's `showStatus` + `isOnline` props
5. **Email is clickable mailto link**: `<a href="mailto:...">` element
6. **Cards have consistent height**: Use `h-full` on cards or CSS grid `auto-rows` to normalize heights
7. **Cards have hover effect**: Shadow or border change on hover (e.g., `hover:shadow-md transition-shadow`)
8. **Search input filters by name**: Case-insensitive, real-time (debounced 300ms per HOW.md convention)
9. **Role dropdown filter**: Options "All", "Developer", "Designer", "Manager" — maps to `TeamRole` union plus "all"
10. **Combined filters**: Both search and role applied together via `useMemo`
11. **Empty state message**: When no members match filters, show a friendly message
12. **Filter state resets on page navigation**: Using local `useState` (not persisted) — React unmounts the page on route change, so this is automatic
13. **Result count**: "Showing X of Y members" text
14. **Dark mode support**: All cards and filters must use `dark:` variants

### Scope Boundaries
**In Scope**:
- Team page layout with header, filters, result count, and grid
- TeamGrid component for the responsive CSS grid container
- MemberCard component for individual team member cards
- TeamFilters component with search input and role dropdown
- Custom `useTeamFilter` hook for filtering logic
- E2E tests for the Team page

**Out of Scope**:
- InviteModal (listed in HOW.md file structure but not part of Task 15 acceptance criteria — likely a future task)
- Editing or adding team members (read-only display)
- Team member click/detail view
- Sorting team members

---

## Technical Approach

### Implementation Strategy

The approach follows the established project patterns closely. A new custom hook `useTeamFilter` will encapsulate the search + role filtering logic (mirroring `useProjectTable`'s structure but without sorting/pagination since the dataset is small). The hook uses `useDebounce` for the search input and `useMemo` for filtered results.

Three new components will be created in `src/components/team/`: `TeamGrid.tsx` (responsive grid container), `MemberCard.tsx` (individual member card), and `TeamFilters.tsx` (search input + role dropdown). The existing `src/pages/Team.tsx` placeholder will be replaced to compose these components.

MemberCard will reuse the existing `Avatar` component (with `size="lg"`, `showStatus={true}`) and the existing `Card` component for the card container. The role will be displayed as a `Badge` component with appropriate color variants (blue for Developer, green for Designer, yellow for Manager). Email will be a styled `mailto:` anchor tag. The grid uses Tailwind's `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` for responsive layout. Cards use `h-full` within the grid to ensure consistent heights across rows.

### Files to Modify
| File | Changes |
|------| --------|
| `src/pages/Team.tsx` | Replace placeholder with full Team page composing TeamFilters, result count text, TeamGrid with MemberCards |

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useTeamFilter.ts` | Custom hook encapsulating search (debounced) + role filter logic, returns filtered members, counts, and filter state setters |
| `src/components/team/TeamGrid.tsx` | Responsive grid container using CSS Grid (1/2/3 columns) |
| `src/components/team/MemberCard.tsx` | Individual team member card with Avatar, name, role badge, email mailto link, online status |
| `src/components/team/TeamFilters.tsx` | Search input (with Search icon) + Role dropdown, side-by-side layout |
| `tests/e2e/task-15-team.spec.ts` | E2E tests for team page rendering, filtering, and empty state |

### Code Patterns to Follow
From `SPEC/HOW.md` (prose descriptions only):

- **Pattern 5 (Custom Hook for Filtering)**: The `useTeamFilter` hook will follow the same structure as `useProjectTable` — `useState` for search and roleFilter, `useDebounce` on the search string, `useMemo` to derive the filtered array. Returns an object with `filteredMembers`, `totalCount`, `search`, `setSearch`, `roleFilter`, `setRoleFilter`.
- **Pattern 6 (Component Variants)**: MemberCard will use the existing `Badge` component with color variants to distinguish roles (Developer → blue, Designer → green, Manager → yellow).
- **Tailwind Conventions**: Mobile-first responsive using `md:` and `lg:` breakpoints. Dark mode via `dark:` prefix on all colors. Transitions via `transition-shadow duration-200`.
- **Component Structure Convention**: Imports → Types/Interfaces → Constants → Component function → default export (if needed).

### Integration Points
- `useData()` from `DataContext` provides `state.team` as the data source
- Existing `Avatar` component provides avatar rendering with online status indicator (green/gray dot)
- Existing `Card` component provides the card container with dark mode styles
- Existing `Badge` component provides role display with color variants
- Existing `useDebounce` hook provides search debouncing
- No new data mutations or DataContext changes required — purely read-only consumption

---

## Testing Strategy

### Smoke Test
- App loads without console errors at the `/team` route
- Existing navigation to all routes still works

### Functional Tests
- Team page heading is visible
- All 8 team members render as cards in a grid
- Each card displays: avatar image (or initials), name, role, email link, status dot
- Email link has correct `mailto:` href
- Online members show green status indicator, offline show gray
- Search input filters members by name in real-time (case-insensitive)
- Role dropdown filters by role
- Combined search + role filter works correctly
- Empty state message appears when no members match
- Result count text displays correctly (e.g., "Showing 3 of 8 members")

### Regression Check
- Dashboard page still loads correctly
- Projects page and table still work
- Tasks/Kanban board still works
- Sidebar navigation to all routes functions correctly

### E2E Test Recommendations

- **Is this task user-facing?** Yes
- **Recommended test file**: `tests/e2e/task-15-team.spec.ts`
- **Recommended test scenarios** (5 focused tests):
  1. Team page renders at /team route with heading and all member cards
  2. Member cards display avatar, name, role, email mailto link, and online status
  3. Search input filters members by name (case-insensitive, real-time)
  4. Role dropdown filters members by role and can be combined with search
  5. Empty state message shown when no members match filters, with result count
- **Existing E2E tests to preserve**: All 18 existing test files must continue passing, particularly:
  - `tests/e2e/smoke.spec.ts` — Core app loading
  - `tests/e2e/task-6-appshell.spec.ts` — Navigation including /team route
- **Regression risk assessment**: Low — this task only modifies `src/pages/Team.tsx` (replacing placeholder) and creates new files. No shared components or state are modified. The only risk is if navigation tests check for specific Team page content (the current placeholder text), which would need updating in the test expectations.

---

## Considerations

### Potential Pitfalls
- **Avatar image loading**: The mock data uses `i.pravatar.cc` URLs which may fail in testing. The existing `Avatar` component already handles image errors with fallback initials — no additional work needed.
- **Select component API**: The existing `Select` component expects `options: SelectOption[]` with `{label, value}` shape and `onChange: (value: string) => void`. The "All" option should have `value: ""` (empty string) to naturally represent "no filter".
- **Filter reset on navigation**: Since `useState` is used (not persisted), filters reset automatically when the component unmounts on route change. No extra work needed.
- **Card height consistency**: Using `h-full` on Card within a CSS grid with `auto-rows` will ensure cards stretch to fill the tallest card in each row.

### Edge Cases
- **Empty search with role filter**: Should show all members of that role
- **Search with "All" role**: Should show all members matching the search text
- **No matching results**: Must show empty state message (not a blank grid)
- **Single character search**: Should still filter (debounced, not minimum length)
- **Special characters in search**: Should not cause regex errors (using `includes()` not regex)
- **All members offline/online**: Status indicator should still render correctly for uniform states

---

```json
{
  "task": "15",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "src/types/index.ts",
    "src/context/DataContext.tsx",
    "src/data/mockData.ts",
    "src/App.tsx",
    "src/pages/Team.tsx",
    "src/pages/Projects.tsx",
    "src/pages/Tasks.tsx",
    "src/components/ui/Avatar.tsx",
    "src/components/ui/Card.tsx",
    "src/components/ui/Badge.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Select.tsx",
    "src/components/projects/ProjectFilters.tsx",
    "src/hooks/useDebounce.ts",
    "src/hooks/useProjectTable.ts"
  ],
  "planSummary": "Replace Team.tsx placeholder with full team page. Create 3 new components (TeamGrid, MemberCard, TeamFilters) in src/components/team/ and 1 new custom hook (useTeamFilter) in src/hooks/. TeamGrid provides responsive CSS grid (1/2/3 cols). MemberCard reuses existing Avatar (lg + showStatus), Card, and Badge components. TeamFilters has search input with Search icon + role Select dropdown. useTeamFilter hook encapsulates debounced search + role filtering via useMemo, following useProjectTable pattern. Only 1 existing file modified (Team.tsx). Read-only data consumption from DataContext — no mutations needed.",
  "scope": {
    "level": "minor",
    "rationale": "Localized change to 1 existing file (Team.tsx placeholder replacement). 4 new files created but all follow established patterns (useProjectTable for hook, ProjectFilters for filter UI, Card/Avatar/Badge for card components). No architecture changes, no shared state modifications, no new dependencies. Data is read-only from existing DataContext. All new components are isolated to the team/ directory."
  }
}
```