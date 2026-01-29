# Task 19: Playwright E2E test suite

## Goal
Create comprehensive Playwright E2E tests covering all critical user flows: navigation, theme toggle, projects CRUD, Kanban drag-drop, team filtering, settings persistence, and mobile responsive behavior. Implements Story 29.

## Acceptance Criteria
- [ ] playwright.config.ts configured with appropriate settings
- [ ] Test: Navigate to each page via sidebar (Dashboard, Projects, Tasks, Team, Settings)
- [ ] Test: Toggle dark mode and verify theme class changes on html element
- [ ] Test: Search projects table and verify filtered results count
- [ ] Test: Sort projects table by clicking column headers
- [ ] Test: Open and close project create/edit modal
- [ ] Test: Drag task between Kanban columns and verify move
- [ ] Test: Open task detail panel and close with Escape key
- [ ] Test: Filter team members by role dropdown
- [ ] Test: Save settings and verify toast notification appears
- [ ] Test: Mobile viewport - hamburger menu opens sidebar overlay
- [ ] All tests pass with npm run test:e2e or npx playwright test
- [ ] Tests run against development build
- [ ] Test files organized in tests/e2e/ directory

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
