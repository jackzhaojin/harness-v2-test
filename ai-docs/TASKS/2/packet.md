# Task 2: Implement full counter logic with keyboard shortcuts, visual state, and history log

## Goal
Wire up all application behavior: increment, decrement, reset actions; keyboard shortcuts (Up/Down/R); positive-vs-negative color toggle on the count display; and the capped 10-entry action history log with timestamps. Every user-facing story (Stories 2–7) is delivered in this single task.

## Acceptance Criteria
- [ ] Clicking Increment button increases count by exactly 1 and updates display immediately
- [ ] Pressing Up arrow key also increments count by exactly 1
- [ ] Clicking Decrement button decreases count by exactly 1 and updates display immediately
- [ ] Pressing Down arrow key also decrements count by exactly 1
- [ ] Count can go below zero (no lower-bound restriction)
- [ ] Clicking Reset button sets count to exactly 0 and updates display immediately
- [ ] Pressing R (case-insensitive) also resets count to 0
- [ ] All keyboard shortcuts work without requiring focus on any specific element
- [ ] Count text uses positive/default color when count >= 0 (CSS class 'count')
- [ ] Count text changes to visually distinct negative color when count < 0 (CSS class 'count--negative')
- [ ] Color/class toggle happens immediately when count crosses zero in either direction
- [ ] Each action appends a new entry to the TOP of the history log (newest-first)
- [ ] Each log entry shows action name, timestamp (HH:MM:SS), and resulting count value
- [ ] History log never exceeds 10 entries; oldest entries are removed when limit is exceeded
- [ ] History log is empty on page load (no placeholder entries)
- [ ] No console errors are thrown during any button click or keyboard shortcut use
- [ ] All DOM mutations happen exclusively inside render() and renderHistory() (no direct DOM access elsewhere)
- [ ] E2E test file created in tests/e2e/counter.spec.ts covering: increment, decrement, reset, keyboard shortcuts, negative color toggle, and history log cap
- [ ] All existing E2E tests still pass (regression gate)

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
