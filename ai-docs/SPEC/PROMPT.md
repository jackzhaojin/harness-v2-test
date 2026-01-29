# Dashboard Demo Enhancement

> Add an automated demo system: a Playwright headful script that showcases every feature of the dashboard, paired with a voice-over script with timing cues.

---

## Run Configuration

```yaml
target_dir: /Users/jackjin/dev/harness-v2-test
branch: feature/dashboard-mvp
baseline_branch: feature/dashboard-mvp
project_type: web
playwright_testing: true
```

---

## Goal

Create an automated demo system that drives the dashboard through all its features in a real browser, showing off the work the agent built. The demo is intended for showing to others — it runs headful (visible browser) at a natural pace with deliberate pauses at key moments.

**Two scripts, built in order:**

1. **Highlights Demo** (~2-3 minutes) — the priority. Covers the most visually impressive features. Build this first, get it working, then move on.
2. **Full Tour Demo** (~5-7 minutes) — comprehensive walkthrough of every feature. Built after highlights is stable.

Each script has a paired voice-over markdown document with timestamps/timing cues so a human presenter (or future TTS) can narrate alongside the automated browser.

**What success looks like:**
- `npm run demo:highlights` launches a visible browser and drives through the highlights demo end-to-end without errors
- `npm run demo:full` launches a visible browser and drives through the full tour end-to-end without errors
- Voice-over markdown files have clear timing cues matching the script actions
- If any app feature is broken or doesn't work as expected during demo development, fix the app code (this is an enhancement, not just a test)

---

## Project Context

### Existing Project

- [x] **Existing project** — Enhancing/modifying

The dashboard is a fully built React + Vite + Tailwind CSS project management dashboard with:
- App shell with collapsible sidebar and header
- Dark/light theme toggle (persists to localStorage)
- Dashboard page with stat cards, line chart, donut chart, activity feed
- Projects page with filterable/sortable table, pagination, CRUD modals
- Kanban task board with drag-and-drop between columns
- Task CRUD with forms and detail panel
- Team members page with grid, search, role filtering
- Team member invite modal
- Settings page with profile, notifications, appearance sections
- SlideOver panel component
- Playwright E2E test suite

---

## Research Requirements

**IMPORTANT**: Before writing any demo scripts, the research phase MUST investigate Playwright best practices for building demo/showcase automation (not just testing). This is a different use case than typical E2E testing and has its own pitfalls. Dedicate thorough research cycles here — getting the foundation right will save rework on both the highlights and full tour scripts.

### Topics to Research

1. **Playwright headful demo patterns** — How do teams use Playwright for product demos, walkthroughs, and automated showcases? What config options matter (`slowMo`, `headless: false`, viewport size, `launchOptions`)? What's the recommended way to structure a "demo" vs a "test"?

2. **Drag-and-drop reliability** — Playwright's native drag-and-drop (`page.dragAndDrop()`, `locator.dragTo()`) is notoriously flaky with HTML5 DnD and React. Research the most reliable approach:
   - Native Playwright drag API vs manual mouse event sequences (`mouse.move`, `mouse.down`, `mouse.up`)
   - Dispatching synthetic `dragstart`/`dragover`/`drop` events via `page.evaluate()`
   - Known issues with `dataTransfer` in Playwright's drag simulation
   - What actually works in 2025-2026 Playwright versions

3. **Pacing and visual timing** — What pause durations look natural for a human viewer? Research `page.waitForTimeout()` vs `slowMo` config vs custom timing helpers. How do teams handle "scenic pauses" where you want the viewer to absorb what's on screen?

4. **Viewport resizing for responsive demos** — Best practices for `page.setViewportSize()` during a running test. Does it cause layout thrashing? Should you use smooth transitions or instant resize? Any gotchas with React re-renders during resize?

5. **Selector strategy for demos** — Demos need stable selectors that won't break on minor UI changes, but also need to target specific visual elements (e.g., "the third stat card" or "the donut chart"). Research the right balance of `data-testid`, `getByRole()`, `getByText()`, and CSS selectors for demo scripts specifically.

6. **Playwright config for demos** — Recommended `playwright.config.ts` settings for demo use cases: timeouts (generous since we have intentional pauses), reporter settings (minimal — we don't need test reports), retry policy (0 retries — if a demo fails it needs fixing, not retrying).

### Research Output

The research agent should produce a concrete recommendations section that the build agent can follow. Not just "here are some options" — pick the best approach for each topic and explain why. Include code snippets for the recommended patterns (e.g., a reusable drag-and-drop helper, a timing/pause helper, the Playwright config block).

---

## Requirements

### Requirement 1: Highlights Demo Script

**Description**: A Playwright headful script that showcases the most visually impressive features at a natural pace.

**Demo sequence** (approximate — adjust based on what looks best):
1. Open app at localhost, pause to show dashboard landing
2. Hover over stat cards (show hover effects)
3. Scroll to charts section, pause on line chart and donut chart
4. Click sidebar → Projects page
5. Use search/filter on projects table
6. Sort by a column
7. Click "New Project" → fill modal → submit
8. Click sidebar → Tasks (Kanban board)
9. Drag a task card from "To Do" to "In Progress"
10. Drag another task from "In Progress" to "Done"
11. Toggle dark mode via header
12. Pause to show dark mode across the current page
13. Navigate back to Dashboard in dark mode
14. Toggle back to light mode
15. Resize browser to mobile width, show responsive sidebar collapse
16. Resize back to desktop

**Acceptance Criteria**:
- [ ] Script runs headful (visible browser) via `npx playwright test demo/highlights.spec.ts --headed --project=chromium`
- [ ] npm script `demo:highlights` wired up in package.json
- [ ] Browser opens at 1280x800 desktop resolution
- [ ] Each action has a visible pause (500ms-2000ms depending on importance) so a viewer can follow
- [ ] Script completes without errors or timeouts
- [ ] If any feature doesn't work during scripting (e.g., drag-drop fails, modal doesn't open), fix the app code
- [ ] Script uses stable selectors (data-testid, aria roles, text content) — no fragile CSS selectors

### Requirement 2: Highlights Voice-Over Script

**Description**: A markdown document with timestamped narration cues that a presenter can read alongside the demo.

**Acceptance Criteria**:
- [ ] File at `demo/highlights-voiceover.md`
- [ ] Each section matches a demo action with approximate timestamp
- [ ] Format: `## [0:00] Section Title` followed by narration text
- [ ] Narration explains what's happening and why it's impressive
- [ ] Total duration matches the demo script runtime (~2-3 min)
- [ ] Includes intro ("Welcome to...") and outro ("That concludes...")

### Requirement 3: Full Tour Demo Script

**Description**: A comprehensive Playwright headful script that walks through every feature the agent built.

**Demo sequence** — covers everything in the highlights plus:
- Dashboard: click stat cards, interact with activity feed
- Projects: pagination, edit project, delete with confirmation modal
- Kanban: add a task via "Add Task", click task card for detail panel/SlideOver
- Team: search by name, filter by role, click "Invite Member" (toast notification)
- Settings: change profile name, toggle notification switches, change theme, change accent color, save changes (toast)
- Responsive: show tablet breakpoint (sidebar icons-only), mobile breakpoint (hamburger)

**Acceptance Criteria**:
- [ ] Script runs headful via `npx playwright test demo/full-tour.spec.ts --headed --project=chromium`
- [ ] npm script `demo:full` wired up in package.json
- [ ] Builds on same patterns as highlights script (shared helpers for pause, scroll, etc.)
- [ ] All features work end-to-end — fix any bugs found
- [ ] Script completes without errors
- [ ] Longer pauses at transition points between pages

### Requirement 4: Full Tour Voice-Over Script

**Description**: Comprehensive narration script for the full tour.

**Acceptance Criteria**:
- [ ] File at `demo/full-tour-voiceover.md`
- [ ] Covers every feature with timing cues
- [ ] Same format as highlights voice-over
- [ ] Total duration matches full tour runtime (~5-7 min)

---

## File Structure

```
demo/
├── highlights.spec.ts          # Playwright highlights demo
├── highlights-voiceover.md     # Voice-over script for highlights
├── full-tour.spec.ts           # Playwright full tour demo
├── full-tour-voiceover.md      # Voice-over script for full tour
└── helpers.ts                  # Shared utilities (pause, scroll, viewport helpers)
```

---

## Development Commands

```bash
# Run highlights demo (headful)
npm run demo:highlights

# Run full tour demo (headful)
npm run demo:full

# Dev server must be running first
npm run dev
```

Wire up in package.json:
```json
{
  "scripts": {
    "demo:highlights": "npx playwright test demo/highlights.spec.ts --headed --project=chromium",
    "demo:full": "npx playwright test demo/full-tour.spec.ts --headed --project=chromium"
  }
}
```

---

## Validation Strategy

### 1. Highlights Demo
```bash
npm run dev &
sleep 3
npm run demo:highlights
# Must complete without errors or timeouts
```

### 2. Full Tour Demo
```bash
npm run dev &
sleep 3
npm run demo:full
# Must complete without errors or timeouts
```

### 3. Bug Fixes
- If any app feature breaks during demo scripting, the app code must be fixed
- The fix is part of this enhancement, not a separate task

---

## Definition of Done

**Demo Scripts**:
- [ ] Highlights demo runs end-to-end without errors
- [ ] Full tour demo runs end-to-end without errors
- [ ] Both use stable, maintainable selectors
- [ ] Pause durations feel natural for a viewer

**Voice-Over Scripts**:
- [ ] Highlights voice-over has timing cues matching demo
- [ ] Full tour voice-over has timing cues matching demo
- [ ] Narration is clear and explains feature value

**App Fixes** (if needed):
- [ ] Any broken features discovered during demo development are fixed
- [ ] Existing E2E tests still pass after fixes

**Priority Order**:
1. Highlights demo script (get it working first)
2. Highlights voice-over
3. Full tour demo script
4. Full tour voice-over

---

## Constraints

### What the Agent CAN Do

- Create demo scripts in `demo/` directory
- Add npm scripts to package.json
- Fix app bugs discovered during demo development
- Add `data-testid` attributes to components if needed for stable selectors
- Install Playwright dependencies if needed

### What the Agent CANNOT Do

- Push to remote repository
- Modify the E2E test suite (`tests/e2e/`) unless fixing a genuine bug
- Add new app features (only fix broken ones)
- Change the visual design or layout

---

## Notes

- The dev server (`npm run dev`) must be running for the demo scripts to work
- Playwright test timeout should be generous (120s+) since demos have intentional pauses
- Use `page.waitForTimeout()` for demo pauses — this is one case where explicit waits are correct
- The demo scripts are NOT tests — they should never assert/fail on visual details, only on "can I interact with this element"
- If drag-and-drop doesn't work reliably with Playwright's native drag API, use `page.dispatchEvent()` with HTML5 drag events as a fallback
