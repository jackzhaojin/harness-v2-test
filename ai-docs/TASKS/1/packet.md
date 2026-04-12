# Task 1: Create UI foundation and test infrastructure

## Goal
Build the complete HTML structure with embedded CSS, set up Playwright E2E testing framework, and implement the empty state display. This establishes the single-file architecture with semantic HTML, modern styling, and responsive design.

## Acceptance Criteria
- [ ] index.html exists with proper HTML5 doctype and structure
- [ ] Semantic HTML elements: header, main, form, ul, li
- [ ] Input field with aria-label='New todo text' and placeholder
- [ ] Add button with type='submit' and aria-label='Add todo'
- [ ] Todo list container with role='list' and aria-label='Todo items'
- [ ] Empty state message visible when no todos (e.g., 'No todos yet')
- [ ] CSS uses custom properties for colors and spacing
- [ ] Mobile-first responsive design with proper breakpoints
- [ ] Clean, modern styling with generous whitespace
- [ ] Visible focus indicators for keyboard navigation
- [ ] Tests directory structure created: tests/e2e/
- [ ] Playwright configuration file at tests/e2e/playwright.config.js
- [ ] Initial E2E test file skeleton at tests/e2e/todo.spec.js

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
