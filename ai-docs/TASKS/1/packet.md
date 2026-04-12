# Task 1: Build complete UI foundation with Playwright test infrastructure

## Goal
Create all three source files (index.html, style.css, app.js) with the full UI layout, styling, and basic structural scaffolding. Set up Playwright E2E test infrastructure. The app shell must load without errors and display the counter area, buttons, and history section — even before logic is wired.

## Acceptance Criteria
- [ ] index.html exists and links style.css and app.js correctly
- [ ] style.css exists with a CSS reset block (box-sizing, body margin: 0)
- [ ] app.js exists with an IIFE wrapper and 'use strict'
- [ ] Page loads in a browser via file:// protocol without any console errors
- [ ] Count display element (#countDisplay) is visible and shows '0'
- [ ] Increment button (btn--increment) is visible and styled green
- [ ] Decrement button (btn--decrement) is visible and styled red
- [ ] Reset button (btn--reset) is visible and styled gray
- [ ] History log section (#historyList) is visible and empty on load
- [ ] All three buttons have sufficient padding and are easy to click
- [ ] Layout is centered (Flexbox) and fits within a single viewport with no scrolling
- [ ] CSS custom properties (--color-positive, --color-negative, --color-reset) defined on :root
- [ ] History log is visually separated from controls (border, spacing, or background)
- [ ] Consistent font applied throughout; no default browser styles visible
- [ ] tests/e2e/ directory created and playwright.config.js (or equivalent) added
- [ ] No external network requests are made (fully offline-capable)

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
