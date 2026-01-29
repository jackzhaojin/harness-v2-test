The file has been written with 633 lines. Here's the handoff summary:

```json
{
  "agent": "spec-what",
  "mode": "extend",
  "action": "appended",
  "output": "SPEC/WHY_WHAT.md",
  "storyCount": 7,
  "totalCriteria": 53,
  "handoffNotes": "Requirements defined for Dashboard Demo Enhancement iteration. 7 new stories (30-36) appended covering: shared demo helpers, highlights demo script, highlights voice-over, full tour demo script, full tour voice-over, Playwright demo configuration, and app bug fixes for demo readiness. Includes 6 research topics that must be completed before implementation. Priority order: highlights demo → highlights voice-over → full tour → full tour voice-over. All stories reference existing MVP features (Stories 1-29) as dependencies. Ready for HOW agent."
}
```

**Summary of what was written:**

The existing `WHY_WHAT.md` (29 stories from the MVP iteration) was preserved in full, and a new **Iteration: 2026-01-29 - Dashboard Demo Enhancement** section was appended with:

- **7 new stories (Stories 30-36):**
  - **Story 30**: Demo Shared Helpers (10 criteria) — reusable pause, scroll, viewport, drag-and-drop utilities
  - **Story 31**: Highlights Demo Script (13 criteria) — 2-3 min headful Playwright demo of top features
  - **Story 32**: Highlights Voice-Over Script (9 criteria) — timestamped narration markdown
  - **Story 33**: Full Tour Demo Script (12 criteria) — 5-7 min comprehensive walkthrough of every feature
  - **Story 34**: Full Tour Voice-Over Script (9 criteria) — detailed timestamped narration for full tour
  - **Story 35**: Demo Playwright Configuration (9 criteria) — separate config, timeouts, npm scripts, no interference with E2E suite
  - **Story 36**: App Bug Fixes for Demo Readiness (10 criteria) — fix broken features, add data-testid, ensure existing tests still pass

- **6 research topics** that must be completed before implementation (headful patterns, drag-and-drop reliability, pacing/timing, viewport resizing, selector strategy, Playwright config)

- **Clear scope boundaries**: in-scope vs out-of-scope, constraints, file structure, dependencies, and success metrics specific to this iteration