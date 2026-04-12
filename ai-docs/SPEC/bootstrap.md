```json
{
  "agent": "spec-when",
  "mode": "bootstrap",
  "action": "generated",
  "output": "SPEC/TASKS.json",
  "taskCount": 2,
  "newTaskIds": ["1", "2"],
  "complexityBreakdown": {
    "small": 0,
    "medium": 1,
    "large": 1
  },
  "handoffNotes": "2 comprehensive tasks ready. T1: Complete UI foundation — all three files (index.html, style.css, app.js) scaffolded with layout, colors, and Playwright test infrastructure (e2eRequired:false — no behavior yet). T2: Full application logic — all 6 behavioral user stories (increment/decrement/reset, keyboard shortcuts, negative color toggle, 10-entry capped history log) delivered in one Sonnet session (e2eRequired:true, E2E tests cover all critical paths). No monolithic test task — E2E tests built inside T2. The three-file CONSTITUTION boundary is respected throughout."
}
```