I now have a comprehensive understanding of the codebase. Let me write the research output.

---

# Research: Task 14 - Task CRUD with Forms and Detail Panel

**Task ID**: 14
**Researched**: 2026-01-29
**Dependencies**: Task 12 (Kanban Board Layout), Task 13 (Kanban DnD) — both PASSED
**Estimated Complexity**: Major

---

## Relevant Project Context

> This task adds full CRUD capability to the Kanban board: inline "Add Task" per column, a SlideOver detail panel with view/edit modes, and delete with confirmation. It parallels the project CRUD pattern established in Task 11 but uses a slide-over panel instead of modals for the detail/edit view.

**Project Type**: React 18 + TypeScript SPA with Vite, Tailwind CSS, Context-based state management, no backend

**Key Files**:
- `src/types/index.ts` — `Task` interface (id, title, description, status, priority, assignee, dueDate, projectId), `Priority` type, `TaskStatus` type
- `src/context/DataContext.tsx` — Already has `ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK` reducer actions (lines 15-17, 50-68) plus auto-sync to localStorage (lines 112-118)
- `src/context/ToastContext.tsx` — `showToast(message, type)` for success/error feedback
- `src/components/tasks/TaskCard.tsx` — Current card component (article element, draggable, shows title/priority/date/assignee). Currently has NO onClick handler.
- `src/components/tasks/KanbanColumn.tsx` — Column component. Currently renders task cards and handles drag-drop. Has NO "Add Task" button.
- `src/components/tasks/KanbanBoard.tsx` — Board orchestrator. Holds `tasksByStatus` groups and `teamLookup` Map. Currently just renders columns.
- `src/pages/Tasks.tsx` — Minimal page wrapper, just renders `<KanbanBoard />`
- `src/components/ui/SlideOver.tsx` — **Placeholder stub** (lines 1-12): just returns `<div>SlideOver Placeholder</div>`. Needs full implementation.
- `src/components/ui/Modal.tsx` — Fully implemented compound component with portal, focus trap, escape key, backdrop click, animations. Pattern to follow for SlideOver.
- `src/components/ui/Button.tsx` — Button with variants (primary, secondary, outline, ghost) and sizes
- `src/components/ui/Input.tsx` — Input with label, error, helper text support
- `src/components/ui/Select.tsx` — Select with label, options array, error support, custom onChange(value)
- `src/components/projects/ProjectModal.tsx` — Reference pattern for form state management (useState per field, useEffect reset on open, validation, onSave callback)
- `src/pages/Projects.tsx` — Reference pattern for CRUD orchestration (modal state, delete confirmation modal, dispatch + showToast)
- `src/hooks/useFocusTrap.ts` — Focus trap hook, used by Modal, needed for SlideOver
- `src/hooks/useClickOutside.ts` — Click-outside detection hook, available for panel close
- `src/data/mockData.ts` — 17 tasks, 8 team members, 10 projects (for dropdown population)
- `tailwind.config.js` — Has fade-in, fade-out, slide-up, modal-scale-in/out animations. Needs new slide-in-right/slide-out-right keyframes for the SlideOver panel.

**Patterns in Use**:
- **Pattern 1** (Context + useReducer): DataContext already has all 3 task actions (ADD_TASK, UPDATE_TASK, DELETE_TASK) + localStorage auto-sync
- **Pattern 2** (Compound Components): Modal uses this pattern; SlideOver should follow the same approach (SlideOver.Header, SlideOver.Body, SlideOver.Footer)
- **Pattern 6** (Component Variants): Button/Badge use variant props pattern
- **Pattern 7** (Focus Management): useFocusTrap hook available and used by Modal

**Relevant Prior Tasks**:
- **Task 11**: Established project CRUD pattern with Modal for create/edit and delete confirmation. Task 14 follows same orchestration but uses SlideOver for detail/edit view.
- **Task 12**: Built KanbanBoard, KanbanColumn, TaskCard components that Task 14 extends
- **Task 13**: Added drag-and-drop. Task 14 must preserve drag functionality on TaskCard (the onClick for opening panel must not conflict with drag)

---

## Functional Requirements

### Primary Objective
Add complete task CRUD functionality to the Kanban board. Users can create new tasks per column via an inline form or button, click task cards to view full details in a slide-over panel, edit task details in place, and delete tasks with confirmation. All changes persist to localStorage via the existing DataContext infrastructure.

### Acceptance Criteria
From task packet — restated for clarity:

**Story 16: Add Task**
1. **Add Task button per column**: Visible at the bottom of each Kanban column
2. **Form activation**: Clicking Add Task opens an inline form or modal with fields: Title (required), Priority (dropdown, default Medium), Assignee (dropdown), Due Date (date picker)
3. **Form validation**: Title is required, cannot submit empty
4. **Submit behavior**: Adds task to that specific column's status via `dispatch({ type: 'ADD_TASK' })`
5. **Immediate display**: New task appears at the bottom of the column (handled by DataContext array append)
6. **Cancel behavior**: Cancel closes the form without adding a task
7. **Persistence**: New tasks auto-persist via DataContext localStorage sync

**Story 17: Task Detail Panel**
8. **Click to open**: Clicking a task card opens a SlideOver panel from the right side
9. **Full details**: Panel displays title, description, priority, assignee, due date, status
10. **Edit mode toggle**: Button to switch between view and edit modes
11. **Editable fields**: In edit mode, fields become form inputs (reuse Input/Select components)
12. **Save changes**: Save button dispatches `UPDATE_TASK` to DataContext
13. **Delete with confirmation**: Delete button triggers a confirmation dialog, then dispatches `DELETE_TASK`
14. **Close mechanisms**: X button, clicking outside panel, or pressing Escape closes panel
15. **Slide animation**: 300ms smooth slide from right side
16. **Escape key handling**: Pressing Escape closes the panel

### Scope Boundaries
**In Scope**:
- Full implementation of SlideOver UI component (currently a stub)
- TaskForm component for inline add-task in columns
- TaskPanel component for detail/edit slide-over
- Animation keyframes for slide-in/slide-out from right
- Wiring onClick on TaskCard to open panel
- Delete confirmation within the panel (can use existing Modal)
- Toast notifications for create/update/delete success

**Out of Scope**:
- Task filtering or search (future task)
- Subtasks or comments on tasks
- Task reordering within a column (beyond what DnD provides)
- Bulk task operations

---

## Technical Approach

### Implementation Strategy

This task has three main workstreams that build on each other:

**1. SlideOver UI component** (`src/components/ui/SlideOver.tsx`): Replace the existing placeholder with a fully-functional slide-over panel, following the exact same compound component pattern as Modal.tsx. The panel renders via `createPortal` to `document.body`, uses `useFocusTrap`, handles Escape key, supports click-outside (via backdrop), and has 300ms slide animation from the right edge. This requires adding two new Tailwind keyframes (`slide-in-right` and `slide-out-right`) to `tailwind.config.js`. The component should expose `SlideOver.Header`, `SlideOver.Body`, and `SlideOver.Footer` sub-components. The panel should lock body scroll when open (matching Modal behavior).

**2. TaskForm component** (`src/components/tasks/TaskForm.tsx`): A compact inline form that appears at the bottom of each column when "Add Task" is clicked. The form has: Title input (required), Priority select (default: medium), Assignee select (populated from team members), Due Date input (type=date). Form state follows the ProjectModal pattern — individual useState fields, validation check on title, and an onSave callback that constructs a complete Task object with a generated ID and the column's status. The KanbanColumn component needs an "Add Task" button at its bottom and local state to toggle form visibility. The form receives the column's `variant` (status) so new tasks get the correct status.

**3. TaskPanel component** (`src/components/tasks/TaskPanel.tsx`): A slide-over panel that displays full task details with a view/edit toggle. In view mode, it renders read-only detail rows (title, description, priority badge, assignee with avatar, due date, status). An "Edit" button toggles to edit mode where fields become Input/Select form controls (same pattern as ProjectModal). A "Save" button dispatches UPDATE_TASK; a "Cancel" reverts to view mode. A "Delete" button in the panel footer opens a confirmation dialog (reusing the existing Modal component), then dispatches DELETE_TASK and closes the panel. The TaskCard component needs an `onClick` prop/callback, and the KanbanBoard or Tasks page orchestrates the selected-task state. Care must be taken that clicking a card to open the panel does not interfere with drag-start — the click handler should only fire if the card was not dragged (check if the mouse moved minimally between mousedown and mouseup, or simply rely on the fact that dragStart + drag operations prevent click events natively in browsers).

### State Orchestration
The Tasks page (or KanbanBoard) becomes the orchestrator for panel state, following the Projects page pattern:
- `selectedTask: Task | null` — which task is open in the panel
- `isAddingInColumn: TaskStatus | null` — which column has the add form open (only one at a time, or per-column local state)
- The SlideOver panel is rendered conditionally based on `selectedTask`
- Toast notifications via `useToast()` for all CRUD operations

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/ui/SlideOver.tsx` | Full implementation replacing placeholder — portal, compound component, animations, focus trap, escape key, body scroll lock |
| `tailwind.config.js` | Add `slide-in-right` and `slide-out-right` keyframe and animation entries (300ms duration) |
| `src/components/tasks/TaskCard.tsx` | Add `onClick` prop to TaskCardProps, attach click handler to the article element |
| `src/components/tasks/KanbanColumn.tsx` | Add "Add Task" button at bottom of column, optional inline TaskForm rendering, pass `onTaskClick` callback to TaskCard |
| `src/components/tasks/KanbanBoard.tsx` | Lift selected-task state here (or in Tasks page), pass `onTaskClick` down to columns, render TaskPanel |
| `src/pages/Tasks.tsx` | May need to host panel state if KanbanBoard doesn't; import and render TaskPanel conditionally |

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/tasks/TaskForm.tsx` | Inline form for adding a new task to a column (fields: title, priority, assignee, due date) |
| `src/components/tasks/TaskPanel.tsx` | Slide-over panel for viewing/editing/deleting a task |
| `tests/e2e/task-14-task-crud.spec.ts` | E2E tests for add, edit, delete task workflows |

### Code Patterns to Follow
From `SPEC/HOW.md`:
- **Pattern 1 (Context + useReducer)**: Use existing `ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK` dispatches from DataContext. Persistence is automatic.
- **Pattern 2 (Compound Components)**: SlideOver should follow Modal's compound component pattern with Context for onClose propagation and sub-components (Header, Body, Footer).
- **Pattern 7 (Focus Management)**: SlideOver must use `useFocusTrap` when open, matching the Modal implementation.
- **ProjectModal pattern**: TaskForm and TaskPanel edit mode should follow the same form state pattern — individual useState per field, useEffect to reset on open/edit, validation computed as derived state, onSave constructs full object.
- **Projects page pattern**: Delete confirmation uses a nested Modal within or alongside the panel, with "Are you sure?" text and Cancel/Delete buttons.

### Integration Points
- **DataContext dispatch**: `ADD_TASK` (payload: Task), `UPDATE_TASK` (payload: Task), `DELETE_TASK` (payload: string id) — all already defined and working
- **ToastContext**: `showToast('Task created', 'success')`, etc.
- **Team members**: Available via `state.team` from DataContext, needed for assignee dropdown options
- **TaskCard onClick**: Must coexist with existing `draggable` + `onDragStart`/`onDragEnd` handlers. Browser native behavior ensures that a successful drag operation suppresses the click event, so adding an onClick should be safe without additional conflict resolution.
- **SlideOver portal**: Rendered to `document.body` to escape any overflow clipping from the Kanban layout

---

## Testing Strategy

### Smoke Test
- App loads without console errors at /tasks route
- Existing Kanban board renders with columns and cards
- Navigation to all routes works

### Functional Tests (E2E)
- Click "Add Task" in a column → form appears with Title, Priority, Assignee, Due Date fields
- Submit with empty title → form does not submit (button disabled or validation error)
- Fill in title + submit → new task card appears in column
- New task persists after page reload
- Cancel add form → form closes, no task added
- Click a task card → SlideOver panel opens from right with task details visible
- Panel shows title, description, priority, assignee, due date, status
- Click Edit → fields become editable inputs
- Modify title, click Save → panel shows updated title, card updates in column
- Click Delete → confirmation dialog appears
- Confirm Delete → task removed from column, panel closes
- Press Escape → panel closes
- Click outside panel → panel closes

### Regression Check
- Drag-and-drop still works (Task 13 tests should pass)
- Kanban board layout unchanged (Task 12 tests should pass)
- All existing smoke tests pass

### E2E Test Recommendations

- **Is this task user-facing?** Yes — core CRUD interactions for the task management feature
- **Recommended test file**: `tests/e2e/task-14-task-crud.spec.ts`
- **Recommended test scenarios** (5-8 focused tests):
  1. Add Task button visible at bottom of each column
  2. Add task form shows required fields, title validation prevents empty submit
  3. Create a new task — appears in correct column and persists after reload
  4. Click task card opens slide-over panel with full details
  5. Edit mode toggle — fields become editable, save persists changes
  6. Delete task with confirmation — task removed from column
  7. Panel close mechanisms — Escape key and close button both work
  8. Cancel add form closes without creating a task
- **Existing E2E tests to preserve** (must continue passing):
  - `tests/e2e/smoke.spec.ts`
  - `tests/e2e/task-12-kanban.spec.ts`
  - `tests/e2e/task-13-kanban-dnd.spec.ts`
  - All other existing test files (17 total)
- **Regression risk assessment**:
  - **TaskCard.tsx changes** (adding onClick): Could break drag-and-drop if click interferes with drag. Low risk due to browser native behavior (drag suppresses click), but Task 13 E2E tests should be run as regression.
  - **KanbanColumn.tsx changes** (adding button + form): Could affect column layout/scrolling. Task 12 E2E tests should be run as regression.
  - **SlideOver.tsx rewrite**: No existing code depends on the placeholder. No regression risk.

---

## Considerations

### Potential Pitfalls
- **Drag vs. Click conflict on TaskCard**: Adding onClick to a draggable element. In practice, HTML5 DnD suppresses click if a drag occurs (dragstart fires, click does not). This should work natively, but if issues arise, a "drag threshold" approach (tracking mouse delta between mousedown/mouseup) would be needed. The build agent should verify Task 13 DnD tests still pass.
- **SlideOver animation timing**: The acceptance criteria specifies 300ms slide animation. The existing Modal uses 200ms. Need to add new 300ms Tailwind animation keyframes. The animate-out must use `forwards` fill mode to keep the panel off-screen until unmounted.
- **Body scroll lock conflict**: Both Modal (delete confirmation) and SlideOver could be open simultaneously (delete confirmation dialog inside the panel). Need to ensure body scroll lock doesn't double-apply or improperly release. The simplest approach: let each component independently set `overflow: hidden` on mount and restore on unmount — since both set the same value, no conflict.
- **ID generation for new tasks**: Use `task-${Date.now()}` pattern (matching ProjectModal's `proj-${Date.now()}` approach) to ensure uniqueness.
- **Default values for new task**: Priority defaults to 'medium', status comes from the column's variant, assignee defaults to first team member (or empty), dueDate and description can be empty strings initially. The Task interface requires all fields including `projectId` — for new tasks, default to the first project or an empty string.

### Edge Cases
- **Empty columns with Add Task**: The "No tasks" placeholder and the "Add Task" button should both be visible in empty columns. The Add Task button goes after the scrollable area (in the column footer), not inside the task list.
- **Long task descriptions**: Panel should handle long text with overflow scrolling in the body area.
- **No team members**: Assignee dropdown should gracefully handle the edge case of no team members (impossible with mock data, but defensive programming).
- **Rapid add/delete**: DataContext reducer handles these atomically, and localStorage sync is debounced by React's batching. No special handling needed.
- **Panel open during drag**: If user starts dragging while panel is open, the panel should remain open (no interference). The drag events are on the card, not the panel.

---

```json
{
  "task": "14",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "src/types/index.ts",
    "src/context/DataContext.tsx",
    "src/context/ToastContext.tsx",
    "src/components/tasks/TaskCard.tsx",
    "src/components/tasks/KanbanColumn.tsx",
    "src/components/tasks/KanbanBoard.tsx",
    "src/components/ui/SlideOver.tsx",
    "src/components/ui/Modal.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Select.tsx",
    "src/components/ui/Badge.tsx",
    "src/components/ui/Avatar.tsx",
    "src/components/projects/ProjectModal.tsx",
    "src/pages/Projects.tsx",
    "src/pages/Tasks.tsx",
    "src/hooks/useFocusTrap.ts",
    "src/hooks/useClickOutside.ts",
    "src/data/mockData.ts",
    "src/index.css",
    "tailwind.config.js"
  ],
  "planSummary": "Three-part implementation: (1) Replace SlideOver stub with full compound component (portal, focus trap, Escape, backdrop click, 300ms slide animation via new Tailwind keyframes). (2) Create TaskForm inline component for add-task per column with title/priority/assignee/dueDate fields, rendered inside KanbanColumn with an Add Task button. (3) Create TaskPanel detail slide-over with view/edit toggle and delete confirmation. Modify TaskCard to accept onClick, KanbanColumn to render add button/form and pass onTaskClick, KanbanBoard (or Tasks page) to orchestrate selected-task state. All reducer actions (ADD_TASK, UPDATE_TASK, DELETE_TASK) and localStorage persistence already exist in DataContext. 3 new files, 4-5 modified files.",
  "scope": {
    "level": "major",
    "rationale": "Cross-cutting change touching 5+ files across UI layer (new SlideOver component), task components (TaskCard, KanbanColumn, KanbanBoard), page orchestration (Tasks.tsx), and build config (tailwind.config.js). Creates 3 new source files. Introduces two new user-facing interaction patterns (inline form + slide-over panel) that span multiple components. However, no architecture changes — all patterns follow established Modal/ProjectModal precedent and existing DataContext actions."
  }
}
```