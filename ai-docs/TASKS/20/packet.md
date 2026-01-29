# Task 20: Demo infrastructure: Playwright config, shared helpers, and data-testid additions

## Goal
Set up the demo system foundation including a demo-specific Playwright configuration, shared helper utilities for pacing/scrolling/viewport/drag-and-drop, and add any missing data-testid attributes to app components for stable demo selectors. This is scaffolding that both demo scripts will build upon. Covers Stories 30, 35, and the data-testid portion of Story 36.

## Acceptance Criteria
- [ ] demo/ directory created at project root with proper structure
- [ ] demo/helpers.ts created with TypeScript-typed utility functions importable by demo scripts
- [ ] pause(page, ms) helper wraps page.waitForTimeout() with descriptive name for demo readability
- [ ] scenicPause(page, ms?) provides default viewer-absorbs-content pause (1500-2000ms)
- [ ] quickPause(page, ms?) provides short transition pause (500-800ms)
- [ ] smoothScroll(page, selector) scrolls element into view with smooth behavior rather than instant jump
- [ ] setViewport(page, width, height) wraps page.setViewportSize() with small delay after resize for React re-render settling
- [ ] Drag-and-drop helper function implements reliable approach for HTML5 native DnD in Playwright (manual mouse event sequence or synthetic dispatch, based on research of Playwright DnD reliability)
- [ ] All helpers are interaction-only utilities with zero test assertions
- [ ] playwright.demo.config.ts created (or existing config extended) with demo-specific settings: headless false, generous timeouts (120s+ for highlights, 600s+ for full tour), retry count 0, minimal reporter
- [ ] Demo config includes webServer setup reusing existing pattern (npm run dev on localhost:5173)
- [ ] Demo config testDir points to demo/ directory so demo specs are discovered correctly
- [ ] Running npm test or npm run test:e2e still only runs tests/e2e/ specs (no interference)
- [ ] npm scripts added to package.json: demo:highlights and demo:full with correct Playwright commands using --config flag for demo config
- [ ] data-testid attributes added to key app components where existing selectors (roles, text, aria) are insufficient — at minimum: stat cards on dashboard, chart containers, sidebar nav links, kanban column containers, column add-task buttons, project table action dropdowns
- [ ] npm run build still succeeds after any app code changes for data-testid additions
- [ ] Existing E2E tests in tests/e2e/ still pass after data-testid additions

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
