# Task 2: Implement full CRUD operations with keyboard accessibility

## Goal
Build complete todo management functionality including add, complete, and delete operations with full keyboard and screen reader accessibility. Includes in-memory state management, state-driven rendering, and event delegation.

## Acceptance Criteria
- [ ] Input field receives focus on page load
- [ ] Add todo via button click creates new todo at top of list
- [ ] Add todo via Enter key creates new todo at top of list
- [ ] Empty input is blocked (button disabled or ignored)
- [ ] Input field clears after successful add
- [ ] Each todo displays text entered by user
- [ ] Each todo has clickable checkbox on left side
- [ ] Checkbox toggles completion status on click
- [ ] Completed todos show strikethrough text
- [ ] Completed todos use muted/gray color scheme
- [ ] Checkbox shows checked state when completed
- [ ] Each todo has delete button (×) on right side
- [ ] Clicking delete button removes todo immediately (no confirmation)
- [ ] Remaining todos reposition after deletion
- [ ] Empty state reappears when last todo deleted
- [ ] Tab key cycles through all interactive elements in logical order
- [ ] Spacebar toggles checkbox when focused
- [ ] All interactive elements have visible focus indicators
- [ ] ARIA states updated for completed todos (aria-checked)
- [ ] E2E test file created/updated in tests/e2e/todo.spec.ts
- [ ] E2E tests cover: add, complete, un-complete, delete flows
- [ ] All E2E tests pass (regression gate)

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
