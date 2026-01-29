TASKS.json has been written successfully. Here's the summary:

---

## Task Breakdown Summary

**Mode**: extend | **New Tasks**: 3 (IDs 20-22) | **All existing tasks** (1-19 + subtasks): preserved as-is

### New Tasks

| ID | Title | Complexity | Dependencies | Stories Covered |
|----|-------|-----------|-------------|-----------------|
| **20** | Demo infrastructure: Playwright config, shared helpers, and data-testid additions | Large | 19 | 30, 35, partial 36 |
| **21** | Highlights demo script with voice-over and app bug fixes | Large | 20 | 31, 32, partial 36 |
| **22** | Full tour demo script with voice-over document | Large | 21 | 33, 34 |

### Design Decisions

1. **Grouped by priority order** per WHY_WHAT: "Highlights demo first → highlights voice-over → full tour demo → full tour voice-over." Task 20 is foundational scaffolding, Task 21 delivers the first working demo end-to-end (highest priority), Task 22 extends to comprehensive coverage.

2. **Bug fixes (Story 36) split across tasks 20 and 21**: Data-testid additions (proactive, pre-demo) go in Task 20; runtime bug fixes discovered during actual demo scripting go in Task 21 (where they'll be discovered).

3. **Voice-overs bundled with their demo scripts** rather than separate tasks — they're small enough to include and logically belong together (the timestamps can only be written once the demo runtime is known).

4. **All tasks are `e2eRequired: false`** — these are demo scripts and infrastructure, not user-facing app features.

5. **Linear dependency chain** (20 → 21 → 22): Each task builds on the prior. The full tour reuses highlights' helpers, config, and pattern knowledge.

```json
{
  "agent": "spec-when",
  "mode": "extend",
  "action": "appended",
  "output": "SPEC/TASKS.json",
  "taskCount": 3,
  "newTaskIds": ["20", "21", "22"],
  "complexityBreakdown": {
    "small": 0,
    "medium": 0,
    "large": 3
  },
  "handoffNotes": "3 large tasks appended (IDs 20-22) for demo enhancement iteration. T20: Demo infrastructure (Playwright demo config, shared helpers with pacing/DnD/viewport utilities, data-testid additions to app components). T21: Highlights demo (~2-3 min) + voice-over markdown + app bug fixes found during scripting. T22: Full tour demo (~5-7 min) + voice-over markdown covering all pages/features. All e2eRequired:false — demos are showcases, not tests. Linear dependency chain respects priority order from WHY_WHAT."
}
```