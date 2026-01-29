I now have a comprehensive understanding of the entire codebase. Let me compile the research document.

# Research: Task 11 — Project CRUD Operations with Modals

**Task ID**: 11
**Researched**: 2026-01-29
**Dependencies**: Task 10 (Projects table), Task 5 (Modal + Toast systems), Task 3 (DataContext), Task 4 (UI component library)
**Estimated Complexity**: Major

---

## Relevant Project Context

**Project Type**: React 18 + TypeScript + Vite SPA — Project Management Dashboard

**Key Files**:
- `src/context/DataContext.tsx` — Already has ADD_PROJECT, UPDATE_PROJECT, DELETE_PROJECT reducer actions (lines 12–14, 30–48)
- `src/context/ToastContext.tsx` — Toast system with `showToast(message, type)` API (line 30)
- `src/components/ui/Modal.tsx` — Compound Modal component with Header/Body/Footer sub-components, portal-based, animated, focus-trapped
- `src/components/ui/Button.tsx` — Button with variants (primary/secondary/outline/ghost) and sizes (sm/md/lg)
- `src/components/ui/Input.tsx` — Form input with label/error/helper text support
- `src/components/ui/Select.tsx` — Dropdown select with label/options/placeholder/error support
- `src/components/ui/Dropdown.tsx` — Dropdown menu with items/icons, keyboard navigation, click-outside close
- `src/components/projects/ProjectsTable.tsx` — Table with action dropdowns (currently View/Edit/Delete, handler is a placeholder on line 80–82)
- `src/components/projects/ProjectFilters.tsx` — Search input bar, currently standalone
- `src/pages/Projects.tsx` — Page layout orchestrating filters, table, and pagination
- `src/hooks/useProjectTable.ts` — Custom hook for filtering, sorting, pagination
- `src/types/index.ts` — Project interface with fields: id, name, status, progress, teamLead, dueDate, createdAt
- `src/data/mockData.ts` — 10 projects, 8 team members (team leads use `tm-1` through `tm-8` IDs)

**Patterns in Use**:
- Pattern 1: Context + useReducer for domain state (DataContext)
- Pattern 2: Compound Components for Modal (Modal.Header / Modal.Body / Modal.Footer)
- Pattern 6: Component variants via Tailwind class composition (Button, Badge)
- Pattern 7: Accessible focus management (useFocusTrap in Modal)
- Toast integration: `showToast(message, 'success' | 'error' | 'info')` from `useToast()`

**Relevant Prior Tasks**:
- Task 3: Established DataContext with all project CRUD reducer actions
- Task 4: Created the reusable UI component library (Button, Input, Select, Modal, Dropdown, Toast)
- Task 5: Built and fixed the Modal and Toast notification systems
- Task 10: Built the Projects table with display, filtering, sorting, and pagination. Left the action handler as a placeholder explicitly for Task 11 (line 80–82: `// Placeholder — functional action handling deferred to Task 11`)

---

## Functional Requirements

### Primary Objective
Implement full Create, Edit, and Delete (plus Archive) functionality for projects on the Projects page. This involves creating a `ProjectModal` form component for new/edit operations, a delete confirmation modal, wiring the existing action dropdown in the table to these modals, adding a "New Project" button above the table, and showing toast notifications on successful operations. This transforms the Projects page from a read-only display into a fully interactive CRUD interface.

### Acceptance Criteria
From task packet — restated for clarity:

**Create Flow**:
1. **New Project button visible** above the projects table
2. **Clicking New Project opens modal** with a form
3. **Form fields**: Name (required), Status dropdown, Team Lead dropdown, Due Date picker
4. **Status options**: Active, On Hold, Completed
5. **Team Lead options** populated from team members in DataContext
6. **Submit button disabled** until Name field is filled
7. **Submitting adds project** to DataContext (via ADD_PROJECT dispatch) and closes modal
8. **New project appears in table** after creation
9. **Cancel button closes modal** without saving

**Edit Flow**:
10. **Actions dropdown contains**: Edit, Archive, Delete options
11. **Clicking Edit opens modal** pre-filled with existing project data
12. **Saving Edit updates project** in DataContext (via UPDATE_PROJECT dispatch)

**Archive Flow**:
13. **Clicking Archive** updates project status to "archived" (direct UPDATE_PROJECT dispatch, no modal)

**Delete Flow**:
14. **Clicking Delete opens confirmation modal**
15. **Confirmation shows project name** and permanent warning
16. **Confirming delete removes project** from DataContext (via DELETE_PROJECT dispatch)
17. **Cancel in confirmation** returns without deleting

**Cross-cutting**:
18. **Toast notifications** on successful create/edit/delete/archive

### Scope Boundaries
**In Scope**:
- New `ProjectModal.tsx` component for create/edit with form validation
- Delete confirmation modal (can be inline in Projects.tsx or a small dedicated component)
- Wiring existing action dropdown handlers in `ProjectsTable.tsx`
- Adding "New Project" button to `Projects.tsx` (in the area between the heading and filters)
- Updating the ACTION_ITEMS array to include Archive option
- Toast notifications for all CRUD operations
- Generating unique IDs for new projects (e.g., `proj-{timestamp}`)
- Setting reasonable defaults for new projects (progress: 0, createdAt: today)

**Out of Scope**:
- Drag-and-drop reordering of projects
- Bulk operations / multi-select
- Project detail page / view modal (View action can remain as a no-op or be removed)
- Form validation beyond "Name required" (no server-side validation)
- Undo/redo operations

---

## Technical Approach

### Implementation Strategy

The implementation follows a clear separation of concerns: the `ProjectModal` component owns the form state and presentation, `Projects.tsx` orchestrates which modal is visible and handles dispatch calls, and `ProjectsTable.tsx` communicates action selection upward via callbacks.

**Step 1 — Create ProjectModal component**: Build `src/components/projects/ProjectModal.tsx` as a form modal using the existing `Modal` compound component (Modal.Header, Modal.Body, Modal.Footer). The modal will accept an optional `project` prop — when present, it pre-fills the form (edit mode); when absent, it starts blank (create mode). Form fields are Name (Input component), Status (Select component with Active/On Hold/Completed options), Team Lead (Select component populated from team members), and Due Date (native date input via the Input component with `type="date"`). The submit button is disabled when the name field is empty. On submit, the modal calls an `onSave` callback with the constructed `Project` object.

**Step 2 — Wire up Projects.tsx as orchestrator**: The Projects page will own the modal state: `isModalOpen`, `editingProject` (null for create, Project object for edit), `isDeleteConfirmOpen`, and `deletingProject`. It will pass action callbacks to `ProjectsTable` via new props. On action selection (edit/archive/delete), the table calls the parent's handler. For create/edit, Projects.tsx dispatches ADD_PROJECT or UPDATE_PROJECT, shows a toast, and closes the modal. For archive, it dispatches UPDATE_PROJECT with status "archived" directly (no modal). For delete confirmation, it dispatches DELETE_PROJECT upon confirm.

**Step 3 — Update ProjectsTable**: Change the `handleActionSelect` placeholder to accept a per-project action handler callback from the parent. Update ACTION_ITEMS to replace "View" with "Archive" (or add Archive alongside Edit and Delete). Pass the project reference so the parent knows which project was acted upon.

**Step 4 — Delete confirmation modal**: Implement as a simple inline Modal usage within Projects.tsx (not a separate component) — it shows "Are you sure you want to delete {project.name}? This action cannot be undone." with Cancel and Delete buttons. Delete button could be styled with a danger/destructive variant (red color).

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/Projects.tsx` | Add modal state management, "New Project" button, ProjectModal rendering, delete confirmation modal, action handlers for edit/archive/delete, toast calls |
| `src/components/projects/ProjectsTable.tsx` | Change `handleActionSelect` to accept per-project callback from parent; update ACTION_ITEMS to include Archive (replace View); pass project context to action handler |
| `src/components/projects/ProjectFilters.tsx` | Potentially add "New Project" button alongside the search input (or this may be done at the Projects.tsx level above the filters) |

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/projects/ProjectModal.tsx` | Create/Edit project form modal — uses Modal compound component, Input, Select. Accepts optional project for pre-fill, team members for dropdown, onSave callback |
| `tests/e2e/task-11-project-crud.spec.ts` | E2E tests covering all acceptance criteria |

### Code Patterns to Follow
From `SPEC/HOW.md` (described in prose):

- **Pattern 1 (Context + useReducer)**: Use the existing dispatch actions ADD_PROJECT, UPDATE_PROJECT, DELETE_PROJECT from DataContext. The reducer already handles all three operations immutably.
- **Pattern 2 (Compound Components)**: Use Modal.Header, Modal.Body, Modal.Footer for both the ProjectModal form and the delete confirmation dialog.
- **Pattern 6 (Component Variants)**: Use Button variant="primary" for submit, variant="outline" for cancel, and potentially a custom red-styled button for delete confirmation (or variant="primary" with a className override for red).
- **Toast Integration**: Call `showToast('Project created successfully', 'success')` etc. after successful dispatches.
- **Component Structure Convention**: Follow the standard ordering — imports, types, constants, component function. Props interface named `ProjectModalProps`.

### Integration Points

1. **DataContext dispatch**: `Projects.tsx` calls `dispatch({ type: 'ADD_PROJECT', payload: newProject })`, `dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject })`, `dispatch({ type: 'DELETE_PROJECT', payload: projectId })`
2. **ToastContext**: `Projects.tsx` calls `showToast()` after each successful CRUD operation
3. **ProjectsTable → Projects.tsx**: New prop `onAction: (project: Project, action: string) => void` replaces the internal placeholder handler. The table's Dropdown `onSelect` calls this with the project reference.
4. **ProjectModal → Projects.tsx**: `onSave: (project: Project) => void` and `onClose: () => void` callbacks
5. **Team members**: From `state.team` in DataContext, mapped to Select options as `{ label: member.name, value: member.id }`
6. **ID generation**: New projects get a unique ID like `proj-${Date.now()}` to avoid collisions with existing `proj-1` through `proj-10`

---

## Testing Strategy

### Smoke Test
- App loads without console errors at /projects route
- Existing table display and pagination still work correctly

### Functional Tests — Create
- "New Project" button is visible above the projects table
- Clicking "New Project" opens a modal with form fields
- Modal shows Name input, Status dropdown, Team Lead dropdown, Due Date picker
- Status dropdown has options: Active, On Hold, Completed
- Team Lead dropdown is populated with team member names
- Submit button is disabled when Name field is empty
- Typing a name enables the submit button
- Submitting the form closes the modal
- New project appears in the table after creation
- Toast notification shows on successful creation
- Cancel button closes the modal without adding a project

### Functional Tests — Edit
- Actions dropdown includes "Edit" option
- Clicking Edit opens modal pre-filled with project data
- Editing and saving updates the project in the table
- Toast notification shows on successful edit

### Functional Tests — Archive
- Actions dropdown includes "Archive" option
- Clicking Archive changes project status to "Archived" (badge update)
- Toast notification shows on successful archive

### Functional Tests — Delete
- Actions dropdown includes "Delete" option
- Clicking Delete opens a confirmation modal
- Confirmation modal shows the project name and a warning
- Clicking Cancel closes confirmation without deleting
- Clicking Confirm removes the project from the table
- Toast notification shows on successful delete

### Regression Check
- All 30 task-10-projects-table tests still pass (table display, search, sort, pagination)
- Smoke tests pass
- Task-9 dashboard charts tests pass
- Task-8 dashboard tests pass

---

## Considerations

### Potential Pitfalls

1. **ProjectsTable callback refactoring**: Currently `handleActionSelect` is internal and doesn't know which project is being acted upon. The refactoring must pass the project to the action handler. This is the key interface change — the `Dropdown`'s `onSelect` in each row needs to close over the specific `project` for that row.

2. **Modal state management complexity**: Projects.tsx will manage multiple pieces of modal state (create modal open, edit modal open with project, delete confirm open with project). Use clear state variables to avoid confusion — a single `modalMode: 'create' | 'edit' | null` plus `selectedProject: Project | null` may be cleaner than multiple booleans.

3. **Select component onChange typing**: The existing Select component's `onChange` returns a `string` value. For status, this needs to be cast back to `ProjectStatus` type safely. For team lead, the value is the member ID string which maps directly.

4. **Pagination after mutation**: After adding or deleting a project, the pagination counts change. The `useProjectTable` hook already derives totals from the projects array reactively, so this should work automatically via re-render triggered by DataContext state change.

5. **Action dropdown items**: The current ACTION_ITEMS array includes "View" which is not in the acceptance criteria. It should be replaced with "Archive" (with an `Archive` icon from lucide-react).

### Edge Cases

1. **Empty name validation**: Ensure the submit button properly disables not just for empty string but also for whitespace-only input (trim before validation).
2. **Delete last project on a page**: If the user deletes the last project on page 2, the pagination hook's existing `page > totalPages` guard (line 127-129 in useProjectTable.ts) will automatically reset to the last valid page.
3. **Archiving an already-archived project**: The Archive action should still work (idempotent), just updating the status to "archived" again. Optionally, the Archive option could be hidden for already-archived projects.
4. **Duplicate project names**: No uniqueness constraint is specified, so duplicates should be allowed.
5. **Default values for new project**: Progress starts at 0, createdAt is set to today's date in ISO format, status defaults to "active", teamLead defaults to first team member or empty.

---

```json
{
  "task": "11",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/PROMPT.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "ai-docs/SPEC/PROGRESS_LOG.md",
    "src/types/index.ts",
    "src/data/mockData.ts",
    "src/context/DataContext.tsx",
    "src/context/ToastContext.tsx",
    "src/pages/Projects.tsx",
    "src/components/projects/ProjectsTable.tsx",
    "src/components/projects/ProjectFilters.tsx",
    "src/components/projects/Pagination.tsx",
    "src/components/ui/Modal.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Select.tsx",
    "src/components/ui/Dropdown.tsx",
    "src/components/ui/Toast.tsx",
    "src/hooks/useProjectTable.ts",
    "tests/e2e/task-10-projects-table.spec.ts",
    "tailwind.config.js"
  ],
  "planSummary": "Create ProjectModal.tsx form component using existing Modal/Input/Select UI components. Update Projects.tsx to orchestrate modal state (create/edit/delete) with DataContext dispatch and toast notifications. Refactor ProjectsTable.tsx action handler to pass project context via callback prop. Replace View action with Archive. Add 'New Project' button above the table. Implement delete confirmation as an inline Modal. All reducer actions (ADD_PROJECT, UPDATE_PROJECT, DELETE_PROJECT) already exist in DataContext.",
  "scope": {
    "level": "major",
    "rationale": "Creates a new component (ProjectModal.tsx), modifies 2-3 existing components with significant interface changes (ProjectsTable callback refactoring, Projects.tsx modal orchestration), involves multiple interconnected UI flows (create/edit/delete/archive), and requires comprehensive E2E testing across all CRUD operations."
  }
}
```