# Task 14: Task CRUD with forms and detail panel

## Goal
Implement Add Task functionality per column, task editing via slide-over detail panel, and task deletion. Includes form validation and persistence. Implements Stories 16 and 17.

## Acceptance Criteria
- [ ] Add Task button visible at bottom of each column
- [ ] Clicking Add Task opens inline form or modal for new task
- [ ] Form fields: Title (required), Priority dropdown, Assignee dropdown, Due Date picker
- [ ] Default priority is Medium
- [ ] Submitting adds task to that column via DataContext
- [ ] New task appears at bottom of column immediately
- [ ] Cancel closes form without adding task
- [ ] New tasks persist to localStorage
- [ ] Clicking task card opens SlideOver panel from right side
- [ ] Panel shows full task details: title, description, priority, assignee, due date, status
- [ ] Panel has edit mode toggle button
- [ ] In edit mode, fields become editable form inputs
- [ ] Save button in edit mode persists changes to DataContext
- [ ] Delete button in panel removes task with confirmation
- [ ] Close button (X) or clicking outside closes panel
- [ ] Panel has smooth slide animation (300ms)
- [ ] Pressing Escape closes panel

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
