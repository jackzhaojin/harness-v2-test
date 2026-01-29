# Task 5.3: Fix - Clicking backdrop does not close modal

## Goal
Modal closes when clicking the semi-transparent backdrop overlay

## Context
- Parent task: 5
- Evidence: Playwright test: dialog still visible after clicking (5,5). elementFromPoint returns bg-black/50 child div, not presentation parent
- Attempt number: 3

## Previous Attempts
### Attempt 1
- Issue: Modal backdrop click does not close modal
- What was tried: See previous task folder
### Attempt 2
- Issue: Clicking backdrop does not close modal
- What was tried: See previous task folder

## Acceptance Criteria
- [ ] Clicking backdrop closes modal (unless prevented)
- [ ] Regression tests still pass

## Required Checks
- [ ] Original failing check now passes
