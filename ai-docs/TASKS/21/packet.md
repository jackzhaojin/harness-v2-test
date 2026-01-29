# Task 21: Highlights demo script with voice-over and app bug fixes

## Goal
Build the ~2-3 minute highlights demo Playwright script that showcases the most visually impressive dashboard features at a natural pace, plus the companion voice-over narration document with timing cues. Fix any app bugs discovered during demo development (broken interactions, modals not opening, drag-drop failures, theme toggle issues). Covers Stories 31, 32, and the runtime bug-fix portion of Story 36.

## Acceptance Criteria
- [ ] demo/highlights.spec.ts created as a Playwright test file using shared helpers from demo/helpers.ts
- [ ] Script opens app at localhost at 1280x800 desktop resolution
- [ ] Demo sequence includes: dashboard landing with scenic pause, hover over stat cards, scroll to charts section with pauses on line and donut charts
- [ ] Demo navigates to Projects page via sidebar click, uses search/filter on projects table, sorts table by clicking a column header
- [ ] Demo clicks New Project button, fills modal form fields at natural typing pace, submits the form
- [ ] Demo navigates to Tasks (Kanban board) via sidebar, drags a task from To Do to In Progress column, drags another from In Progress to Done
- [ ] Demo toggles dark mode via header theme button, pauses to show dark mode, navigates to Dashboard in dark mode, toggles back to light mode
- [ ] Demo resizes browser to mobile viewport width showing responsive sidebar collapse, then resizes back to desktop
- [ ] Each action has appropriate pause (500ms-2000ms) so a human viewer can follow along
- [ ] Total demo runtime is approximately 2-3 minutes
- [ ] Script runs end-to-end without errors or timeouts via: npm run demo:highlights
- [ ] Script uses stable selectors (data-testid, aria roles, text content) — no fragile CSS-only selectors
- [ ] demo/highlights-voiceover.md created with timestamped narration sections in format ## [M:SS] Section Title
- [ ] Voice-over covers all demo actions: dashboard stats/charts, projects search/sort/create, Kanban drag-drop, dark mode, responsive resize
- [ ] Voice-over includes intro (## [0:00] Welcome) and outro sections with natural speaking cadence
- [ ] Voice-over timing cues include [pause] markers where presenter should let demo speak for itself
- [ ] Any app features that fail during demo scripting are fixed in app source code (drag-drop, modals, theme toggle, responsive layout)
- [ ] Toast notifications remain visible long enough during demo pacing to be seen by viewer
- [ ] Existing E2E tests in tests/e2e/ still pass after any app code fixes
- [ ] npm run build still succeeds after any app code fixes

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
