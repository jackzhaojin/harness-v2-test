# Task 13: Kanban drag-and-drop with persistence

## Goal
Implement HTML5 native drag-and-drop for moving task cards between columns, including visual feedback during drag, drop zone highlighting, and localStorage persistence of task positions.

## Acceptance Criteria
- [ ] Task cards show grab cursor on hover
- [ ] Dragging task shows visual feedback (reduced opacity on source card)
- [ ] Drag ghost/preview visible while dragging
- [ ] Drop zones highlight when dragging task over valid column
- [ ] Dropping task moves it to new column immediately
- [ ] Task appears at bottom of target column after drop
- [ ] Column task counts update after move
- [ ] Task status in DataContext updates to match column (todo/in-progress/done)
- [ ] Moved task position persists after page refresh
- [ ] Invalid drop (outside columns) returns card to original position
- [ ] Drag works correctly in both light and dark modes
- [ ] Touch devices: basic touch support (if feasible with HTML5 API)

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
