The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/21/research.md`. Here's a summary of the findings:

## Research Summary for Task 21

### What This Task Creates
1. **`demo/highlights.spec.ts`** — A ~2-3 minute Playwright demo script showcasing the app's best features at human-viewable pace
2. **`demo/highlights-voiceover.md`** — Timestamped narration document with `[pause]` markers

### Key Infrastructure Already Exists
- `demo/helpers.ts` — Shared utilities (pause, scenicPause, smoothScroll, setViewport, dragAndDrop) are ready
- `playwright.demo.config.ts` — Demo config (headed mode, video recording, 10-min timeout) is ready
- `package.json` — `demo:highlights` npm script already defined with `--grep @highlights`

### Demo Flow (6 sections, ~3 minutes)
1. **Dashboard Landing** (0:00-0:20) — Stats hover, scenic pause
2. **Charts Section** (0:20-0:50) — Smooth scroll to line + pie charts
3. **Projects Page** (0:50-1:30) — Search, sort, New Project modal form fill
4. **Kanban Board** (1:30-2:10) — Two drag-and-drop operations (To Do→In Progress, In Progress→Done)
5. **Dark Mode** (2:10-2:40) — Toggle dark, navigate Dashboard, toggle back
6. **Responsive Resize** (2:40-3:00) — Shrink to mobile, expand to desktop

### Selector Strategy (All Stable)
- Rich `data-testid` coverage: sidebar nav items, kanban columns, stat cards, charts, theme toggle
- `aria-label` attributes on search inputs, columns, task cards
- No fragile CSS selectors needed

### Potential Bug Fixes
- **Toast duration**: Currently 3s auto-dismiss may be too fast for demo viewing — may need increase to ~4.5s
- **Drag-and-drop in headed mode**: May need manual mouse sequence (helper exists) vs Playwright's `dragTo()`
- **Viewport mismatch**: Config defaults to 720px height; script must set 800px explicitly

### Scope: Major
Two new files with complex multi-feature sequencing, timing requirements, and potential app source modifications for toast timing.