The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/22/research.md`. Here's a summary of the findings:

## Research Summary — Task 22: Full Tour Demo Script with Voice-Over Document

### What This Task Does
Creates a comprehensive ~5-7 minute Playwright demo (`demo/full-tour.spec.ts`) and companion voice-over narration (`demo/full-tour-voiceover.md`) that walks through every feature of the Project Management Dashboard.

### Key Findings

1. **All infrastructure already exists** from Task 21:
   - `demo/helpers.ts` — Shared utilities (pause, scenicPause, smoothScroll, setViewport, dragAndDrop)
   - `playwright.demo.config.ts` — Demo config with 600s timeout, headed mode, video recording
   - `package.json` already has `demo:full` script using `--grep @full-tour`

2. **Complete selector inventory compiled** — 50+ selectors across all pages proven stable from existing E2E tests (tasks 10-18)

3. **Demo structure planned** — 8 major sections:
   - Dashboard deep-dive (~50s)
   - Projects CRUD + pagination (~90s)
   - Kanban + SlideOver panel (~80s)
   - Team search/filter/invite (~50s)
   - Settings all sections (~60s)
   - Responsive showcase (~50s)
   - Outro (~20s)
   - **Total: ~6:40** (within 5-7 min target)

4. **Scope**: Major — 2 new files only, no source modifications, but ~350-400 lines of orchestrated Playwright interactions + ~200 lines of timestamped narration

5. **Key pitfalls identified**: Timing sensitivity, pagination state after search, toast auto-dismiss timing, mobile hamburger visibility threshold, delete affecting pagination flow