The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/20/research.md`. Here's a summary of the findings:

## Research Summary: Task 20

**Complexity**: Major (cross-cutting: ~12 files across config, new directory, and multiple component modules)

### Three Deliverables

1. **Demo Infrastructure (`demo/` directory)**
   - `demo/helpers.ts` — 6 TypeScript utility functions: `pause`, `scenicPause`, `quickPause`, `smoothScroll`, `setViewport`, and a drag-and-drop helper using the manual mouse sequence pattern from Task 13
   - `playwright.demo.config.ts` at project root — headless: false, 600s timeout, retries: 0, list reporter, testDir: `./demo`, webServer reused from existing config
   - npm scripts: `demo:highlights` and `demo:full` using `--config` flag

2. **data-testid Additions** (~17 new attributes across ~10 files)
   - **StatCard**: New `testId` prop forwarded to Card (which already spreads `...props`)
   - **Dashboard**: stat cards, charts section wrapper
   - **Sidebar**: `aside`, nav links (derived from navItems paths)
   - **KanbanColumn/Board**: column section elements, board grid container
   - **ProjectsTable**: table container, action trigger buttons per row
   - **Chart components**: Card wrappers

3. **No Interference Guarantee**
   - Existing `playwright.config.ts` points to `./tests/e2e` — demo specs never included in test runs
   - data-testid is inert (no behavior/style/accessibility impact)
   - Build and full regression must pass

### Key Design Decisions
- Config file placed at root (matches existing `playwright.config.ts` convention)
- DnD helper uses manual `page.mouse` sequence (proven reliable in Task 13)
- UI components (Card, Badge, Button) already spread `...props` so data-testid forwarding is automatic — only StatCard needs a new prop
- Sidebar nav testids derived from path: `/` → `nav-dashboard`, `/projects` → `nav-projects`, etc.