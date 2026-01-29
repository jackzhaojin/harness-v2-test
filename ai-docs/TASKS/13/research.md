I now have a thorough understanding of the entire codebase. Let me write the research output.

# Research: Task 13 - Kanban Drag-and-Drop with Persistence

**Task ID**: 13
**Researched**: 2026-01-29
**Dependencies**: Task 12 (Kanban Board Layout and Task Card Display) — PASSED
**Estimated Complexity**: Minor-to-moderate (3 files modified, 0 new source files, 1 new test file)

---

## Relevant Project Context

> This task adds drag-and-drop interaction to the existing Kanban board built in Task 12.

**Project Type**: React 18 + TypeScript SPA with Vite, Tailwind CSS, and Context-based state management

**Key Files**:
- `src/components/tasks/TaskCard.tsx` — Task card component (needs drag source handlers)
- `src/components/tasks/KanbanColumn.tsx` — Column component (needs drop target handlers)
- `src/components/tasks/KanbanBoard.tsx` — Board orchestrator (already connects to DataContext)
- `src/context/DataContext.tsx` — App state with `MOVE_TASK` action already implemented (line 18, lines 70-78)
- `src/types/index.ts` — `TaskStatus` type: `'todo' | 'in-progress' | 'done'` (line 2)
- `ai-docs/SPEC/HOW.md` — Pattern 3 (lines 227-287) prescribes exact HTML5 DnD approach

**Patterns in Use**:
- **Pattern 1** (Context + useReducer): DataContext already has `MOVE_TASK` action and auto-syncs to localStorage via `useEffect` on line 112-118
- **Pattern 3** (HTML5 Native Drag and Drop): HOW.md provides the exact blueprint — `dataTransfer.setData('taskId', ...)`, `effectAllowed = 'move'`, `dropEffect = 'move'`, `ring-2 ring-blue-500` for drop zone highlighting
- **Pattern 4** (localStorage sync): DataContext already syncs entire state to `localStorage.setItem('appData', ...)` on every state change — persistence is free

**Relevant Prior Tasks**:
- **Task 12**: Built KanbanBoard, KanbanColumn, and TaskCard. All three components exist and are tested. This task adds interaction behavior to those existing components.

---

## Functional Requirements

### Primary Objective
Add HTML5 native drag-and-drop capability to the Kanban board so users can move task cards between columns (To Do, In Progress, Done). When a card is dropped into a new column, its status updates in DataContext, which automatically persists to localStorage. Visual feedback during the drag operation (opacity reduction on source card, ring highlight on target column) provides clear user affordance.

### Acceptance Criteria
From task packet — restated for clarity:
1. **Grab cursor**: Task cards show `cursor-grab` on hover, `cursor-grabbing` while actively dragging
2. **Drag opacity**: Source card reduces to 50% opacity during drag via `opacity-50` class
3. **Drag ghost**: Browser-native drag ghost/preview visible (HTML5 default behavior)
4. **Drop zone highlight**: Columns show `ring-2 ring-blue-500` when a dragged task hovers over them
5. **Immediate move**: Dropping a task moves it to the new column immediately (React state update)
6. **Bottom placement**: Task appears at the bottom of the target column (natural append via array push)
7. **Count update**: Column task count badges update after move (automatic since Badge shows `tasks.length`)
8. **Status sync**: Task status in DataContext updates to match column (`todo`/`in-progress`/`done`)
9. **Persistence**: Moved task position persists after page refresh (automatic via DataContext localStorage sync)
10. **Invalid drop recovery**: Card returns to original position on invalid drop (HTML5 default + `dragEnd` cleanup)
11. **Theme compatibility**: Works in both light and dark modes (Tailwind `ring-blue-500` and `opacity-50` are theme-neutral)
12. **Touch support**: Best-effort; HTML5 Drag API does not natively support touch — note this as a known limitation

### Scope Boundaries
**In Scope**:
- Adding drag handlers to TaskCard (`draggable`, `onDragStart`, `onDragEnd`)
- Adding drop handlers to KanbanColumn (`onDragOver`, `onDragLeave`, `onDrop`)
- Adding `isDragOver` state to KanbanColumn for visual feedback
- Connecting KanbanColumn to DataContext dispatch for `MOVE_TASK`
- E2E tests for drag-and-drop behavior and persistence
- Passing the column status value from KanbanBoard into KanbanColumn

**Out of Scope**:
- Reordering tasks within a single column (acceptance criteria only require moving between columns)
- Touch-specific drag-and-drop polyfills (HTML5 API limitation acknowledged)
- Keyboard-based task movement (would be a future accessibility enhancement)
- Drag-and-drop animations beyond opacity/ring (no spring physics, no Framer Motion)

---

## Technical Approach

### Implementation Strategy

The implementation follows HOW.md Pattern 3 exactly. Three existing files need modification; no new source files are created.

**TaskCard modifications**: The `<article>` element becomes draggable. Two handlers are added: `onDragStart` stores the task ID in `dataTransfer` and adds an `opacity-50` class to the element; `onDragEnd` removes the opacity class. The `cursor-grab` class is added to the base styles, and `active:cursor-grabbing` provides feedback during the drag. Rather than using direct DOM classList manipulation (which the anti-patterns section warns against), a React state `isDragging` boolean will conditionally apply the `opacity-50` class. However, HOW.md Pattern 3 explicitly uses `classList.add/remove` for the drag opacity — this is acceptable here because `dragEnd` fires after the browser's internal drag completes, and React state update would cause a re-render during drag that may conflict with the browser's ghost element. The safer approach is to follow HOW.md exactly and use `e.currentTarget.classList` for the opacity toggle.

**KanbanColumn modifications**: The column's `<section>` element receives `onDragOver` (calls `preventDefault` to allow drop, sets `dropEffect = 'move'`, and sets `isDragOver = true`), `onDragLeave` (sets `isDragOver = false`), and `onDrop` (reads task ID from `dataTransfer`, dispatches `MOVE_TASK`, resets `isDragOver`). A `useState<boolean>(false)` hook tracks `isDragOver`, and the section element conditionally applies `ring-2 ring-blue-500 ring-inset` when true. The column needs access to `dispatch` from DataContext and its own `status` (currently called `variant`, which already maps 1:1 to `TaskStatus`). To avoid changing the prop name (since tests reference `variant`), the column can use `variant` directly as the status value in the `MOVE_TASK` payload since `variant` is typed as `'todo' | 'in-progress' | 'done'` which matches `TaskStatus` exactly.

**Persistence is automatic**: DataContext already syncs to localStorage on every state change (line 112-118). The `MOVE_TASK` reducer case already exists (lines 70-78). No additional persistence work is needed.

**dragLeave edge case**: When dragging over child elements within the column, `dragLeave` fires spuriously. To handle this, the `onDragLeave` handler should check if the related target is still within the column boundary. Alternatively, using `onDragOver` to continuously set `isDragOver = true` naturally counteracts brief `dragLeave` flickers. The simpler approach (relying on continuous `dragOver` to keep the state true) is preferred, with `onDragLeave` checking `e.currentTarget.contains(e.relatedTarget as Node)` to avoid false negatives.

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/tasks/TaskCard.tsx` | Add `draggable` attribute, `onDragStart` handler (set taskId in dataTransfer, add opacity-50), `onDragEnd` handler (remove opacity-50), `cursor-grab active:cursor-grabbing` classes |
| `src/components/tasks/KanbanColumn.tsx` | Import `useState` and `useData`, add `isDragOver` state, add `onDragOver`/`onDragLeave`/`onDrop` handlers on section element, conditionally apply `ring-2 ring-blue-500` class, use `variant` as status for `MOVE_TASK` dispatch |
| `src/components/tasks/KanbanBoard.tsx` | No changes needed — `variant` already passed to KanbanColumn, and `variant` values already match `TaskStatus` |

### Files to Create
| File | Purpose |
|------|---------|
| `tests/e2e/task-13-kanban-dnd.spec.ts` | E2E tests for drag-and-drop behavior and persistence |

### Code Patterns to Follow
From `SPEC/HOW.md` Pattern 3 (described in prose):
- **Drag source**: Set `draggable` on the card element, use `dataTransfer.setData('taskId', task.id)` and `effectAllowed = 'move'` in dragStart, toggle opacity via classList
- **Drop target**: Call `preventDefault()` in dragOver to allow drops, set `dropEffect = 'move'`, track `isDragOver` with local state, dispatch `MOVE_TASK` on drop with taskId and newStatus
- **Visual feedback**: `opacity-50` on drag source, `ring-2 ring-blue-500` on drop target
- **Cleanup**: Remove opacity in `dragEnd`, reset `isDragOver` in both `drop` and `dragLeave`

### Integration Points
- **DataContext dispatch**: KanbanColumn will call `useData()` to get `dispatch`, then dispatch `{ type: 'MOVE_TASK', payload: { taskId, newStatus: variant } }` — the `MOVE_TASK` case already exists at DataContext line 70
- **localStorage persistence**: Automatic via DataContext's `useEffect` at line 112 — no integration work needed
- **Task count badges**: Already reactive — `Badge` renders `{tasks.length}` which updates when DataContext state changes cause the `tasksByStatus` memo in KanbanBoard to recompute

---

## Testing Strategy

### Smoke Test
- App loads at `/tasks` without console errors
- All three columns render with correct headings and task counts

### Functional Tests
- Drag a task card from "To Do" column to "In Progress" column — task appears in "In Progress"
- Verify column counts update after drag (e.g., To Do decreases by 1, In Progress increases by 1)
- Drag a task from "In Progress" to "Done" — task appears in "Done"
- After moving a task, refresh the page — task remains in its new column (persistence check)
- Task cards have `cursor-grab` CSS style
- Task cards have `draggable` attribute set to true
- Drop zone highlighting: verify ring class appears on column during dragover (Playwright can dispatch dragover events)

### Regression Check
- Existing Task 12 kanban layout tests still pass (column display, card content, responsive grid)
- Smoke tests still pass
- All existing task cards still display correctly after adding draggable attribute

### E2E Test Recommendations

- **Is this task user-facing?** Yes
- **Recommended test file**: `tests/e2e/task-13-kanban-dnd.spec.ts`
- **Recommended test scenarios** (5 focused tests):
  1. **Task cards are draggable**: Verify all task cards have `draggable="true"` attribute and `cursor-grab` style
  2. **Drag task between columns**: Use Playwright's `dragTo` API to move a task from "To Do" to "In Progress", verify it appears in the target column and column counts update
  3. **Drag task to Done column**: Move a task to "Done", verify status transition and count update
  4. **Persistence after refresh**: Move a task, reload the page, verify the task remains in its new column
  5. **Drop zone visual feedback**: Dispatch dragover event on a column and verify the ring highlight class is applied
- **Existing E2E tests to preserve**:
  - `tests/e2e/smoke.spec.ts` — must continue passing
  - `tests/e2e/task-12-kanban.spec.ts` — all 10 tests must continue passing (note: some count-specific assertions like "To Do = 7" may need adjustment if tests don't clear localStorage, but existing tests already clear localStorage in beforeEach)
  - All other 14 existing test files must remain unaffected
- **Regression risk assessment**: 
  - **Task 12 count tests**: The task-12 tests clear localStorage in `beforeEach` (line 7), so they always start with fresh mock data — no regression risk from drag-and-drop changes
  - **TaskCard structure**: Adding `draggable` attribute and `cursor-grab` class to the `<article>` element should not break any existing test selectors (tests use `article` tag, `aria-label`, and text content — none of which change)
  - **KanbanColumn structure**: Adding drag/drop handlers and conditional ring class to the `<section>` element does not change the DOM structure — existing tests using `aria-label$="column"` selectors will continue to work

---

## Considerations

### Potential Pitfalls
- **dragLeave flicker**: When dragging over child elements inside a column, `dragLeave` fires when moving between children. Mitigate by checking `e.currentTarget.contains(e.relatedTarget as Node)` before setting `isDragOver = false`
- **Same-column drop**: If a user drops a task back into its own column, the `MOVE_TASK` dispatch will fire but produce no visible change (status stays the same). This is harmless but could be optimized by checking if `newStatus === task.status` before dispatching — however, this optimization is not strictly necessary
- **Playwright drag-and-drop**: Playwright's `dragTo` method should work for HTML5 DnD. If it doesn't reliably work, fall back to using `page.dispatchEvent` to manually fire drag events in sequence
- **classList manipulation in React**: HOW.md Pattern 3 uses `classList.add/remove` for opacity during drag — this is a deliberate pattern choice because React state updates during drag can interfere with the browser's drag ghost rendering. Follow the pattern as prescribed.

### Edge Cases
- **Dropping outside any column**: HTML5 DnD default behavior — the `dragEnd` event fires on the source element, and the opacity-50 class is removed. No state change occurs. The card stays in its original column.
- **Rapid successive drags**: Each drag operation is independent — `dataTransfer` carries only the current task ID. No stale state risk because `dispatch` always uses the latest state via the reducer.
- **Empty column drop**: Dropping into an empty column should work identically — the drop handler is on the column `<section>` element, not on individual task cards, so it works regardless of column content.
- **Touch devices**: HTML5 Drag and Drop API does not work on touch devices. This is a known limitation per the acceptance criteria ("if feasible with HTML5 API"). A comment noting this limitation should be added. No polyfill is needed per the Constitution's "no external libraries for drag" constraint.

---

```json
{
  "task": "13",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "src/components/tasks/TaskCard.tsx",
    "src/components/tasks/KanbanColumn.tsx",
    "src/components/tasks/KanbanBoard.tsx",
    "src/context/DataContext.tsx",
    "src/types/index.ts",
    "src/pages/Tasks.tsx",
    "tests/e2e/task-12-kanban.spec.ts",
    "tests/e2e/smoke.spec.ts"
  ],
  "planSummary": "Add HTML5 native drag-and-drop to existing Kanban components following HOW.md Pattern 3. TaskCard gets draggable + drag handlers with opacity feedback. KanbanColumn gets drop handlers with ring highlight and dispatches existing MOVE_TASK action. Persistence is automatic via DataContext localStorage sync. Only 2 source files modified (TaskCard.tsx, KanbanColumn.tsx), 1 new E2E test file created.",
  "scope": {
    "level": "minor",
    "rationale": "Localized change to 2 existing components (TaskCard, KanbanColumn). No new source files, no architecture changes. MOVE_TASK action and localStorage persistence already exist in DataContext. Implementation follows exact pattern prescribed in HOW.md Pattern 3."
  }
}
```