# Task 12: Kanban board layout and task card display

## Goal
Build the Tasks page with three-column Kanban layout (To Do, In Progress, Done) and task cards displaying title, assignee avatar, priority badge, and due date. Implements Stories 13 and 14.

## Acceptance Criteria
- [ ] Tasks page renders at /tasks route
- [ ] Three columns displayed: To Do, In Progress, Done
- [ ] Column headers show column name and task count badge
- [ ] Columns are equal width on desktop (>1024px)
- [ ] Columns stack vertically on mobile (<768px)
- [ ] Each column has scrollable content area for many tasks
- [ ] Empty columns show No tasks placeholder text
- [ ] Columns have subtle background color differentiation
- [ ] Task cards show: title, assignee avatar, priority badge, due date
- [ ] Priority badges: Low (gray), Medium (yellow), High (red)
- [ ] Assignee shown as small circular avatar with tooltip for name
- [ ] Due date formatted as short date (e.g., Jan 28)
- [ ] Overdue tasks show due date in red text
- [ ] Cards have white (light) / gray-800 (dark) background with shadow
- [ ] Cards have hover state with elevated shadow
- [ ] Tasks correctly sorted into columns based on status from DataContext

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
