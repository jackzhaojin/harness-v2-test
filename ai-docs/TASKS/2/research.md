The research document has been written. Here is the output for the harness to save to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/2/research.md`:

---

# Research: Task 2 - Implement Full Counter Logic with Keyboard Shortcuts, Visual State, and History Log

**Task ID**: 2
**Researched**: 2026-04-11
**Dependencies**: Task 1 (complete — UI foundation, scaffolded app.js, passing E2E smoke tests)
**Estimated Complexity**: Minor (all code goes in one file; patterns are explicitly specified in HOW.md)

---

## Relevant Project Context

**Project Type**: Vanilla JS counter application — zero-dependency, three-file boundary (index.html, style.css, app.js), browser file:// protocol.

**Key Files**:
- `app.js` — Current scaffold (~30 lines); contains state object, DOM refs, render functions; **missing all action functions and event listeners**
- `index.html` — Complete; key IDs: `#countDisplay`, `#historyList`; button classes: `.btn--increment`, `.btn--decrement`, `.btn--reset`
- `style.css` — Complete; `.count` (positive/zero, green) and `.count--negative` (red) already defined
- `ai-docs/SPEC/HOW.md` — All five implementation patterns explicitly defined (lines 29–115); code organization order specified (lines 126–134)
- `ai-docs/SPEC/CONSTITUTION.md` — Hard constraints: no dependencies, three-file boundary, no persistence, keyboard-first
- `tests/e2e/smoke-task-1.spec.js` — 4 passing tests; must not regress

**Patterns in Use** (from HOW.md):
- Pattern 1: IIFE Module — all code inside `(function() { 'use strict'; ... })()`
- Pattern 2: Centralized State + Render-on-Change — action functions mutate `state`, then call `render()`; no direct DOM mutation elsewhere
- Pattern 3: Keyboard Delegation — single `document.addEventListener('keydown', ...)` handles all shortcuts
- Pattern 4: Capped History Log (FIFO) — `unshift` new entries, slice to max 10
- Pattern 5: CSS Class Toggle — `countEl.className` toggled between `'count'` and `'count count--negative'` in `render()`

**Relevant Prior Tasks**:
- Task 1: Established index.html structure, style.css, the app.js IIFE scaffold, Playwright config, and 4 passing smoke tests.

---

## Functional Requirements

### Primary Objective
Task 2 wires up all user-facing behavior into the existing app.js scaffold: increment/decrement/reset actions (button and keyboard), the positive-vs-negative color toggle on the count display, and the capped 10-entry history log with HH:MM:SS timestamps. Together with Task 1's UI foundation, this delivers a fully functional counter application.

### Acceptance Criteria
1. **Button Increment**: Clicking `.btn--increment` increases count by exactly 1, updates `#countDisplay` immediately
2. **Keyboard Up**: Pressing `ArrowUp` also increments count by 1
3. **Button Decrement**: Clicking `.btn--decrement` decreases count by exactly 1
4. **Keyboard Down**: Pressing `ArrowDown` also decrements count by 1
5. **No Lower Bound**: Count can go below zero (unbounded)
6. **Button Reset**: Clicking `.btn--reset` sets count to exactly 0
7. **Keyboard R**: Pressing `r` or `R` resets count to 0
8. **Focus-Independent Shortcuts**: Keyboard shortcuts work without any element focused
9. **Positive Color**: Class `count` (only) when count >= 0 — renders green
10. **Negative Color**: Classes `count count--negative` when count < 0 — renders red
11. **Immediate Toggle**: Color/class change happens immediately when count crosses zero
12. **History Newest-First**: Each action prepends a new entry to the top of the history list
13. **History Entry Format**: Each entry shows action name, timestamp (HH:MM:SS), and resulting count value
14. **History Cap**: History never exceeds 10 entries; oldest removed when limit exceeded
15. **History Empty on Load**: No placeholder entries on initial page load
16. **No Console Errors**: No errors thrown during any interaction
17. **DOM Mutations in Render Only**: All DOM changes exclusively inside `render()` and `renderHistory()`
18. **E2E Test File**: `tests/e2e/counter.spec.ts` created
19. **Regression Gate**: All existing tests in `smoke-task-1.spec.js` continue to pass

### Scope Boundaries
**In Scope**: Adding 4 action functions + 5 event listeners to `app.js`; creating `tests/e2e/counter.spec.ts`

**Out of Scope**: Changes to `index.html` or `style.css`; any persistence; any new source files beyond the test file

---

## Technical Approach

### Implementation Strategy

The existing `app.js` scaffold has the correct skeleton: IIFE wrapper, state object, DOM refs, and both render functions. Task 2 only inserts the missing middle section — action functions and event listeners — following the HOW.md code organization order (state → DOM refs → action functions → render functions → event listeners → initialization).

`addHistory(action, count)` is a helper that reads current time via `new Date().toTimeString().slice(0, 8)`, unshifts a `{action, count, time}` object onto `state.history`, then slices to 10. Each of `increment`, `decrement`, and `reset` mutates `state.count`, calls `addHistory` with the action label and new count, then calls `render()`. Three `querySelector`-based click listeners wire up the buttons; one `document.addEventListener('keydown')` handles all three keyboard shortcuts. The existing `render()` initialization call at the bottom remains unchanged.

### Files to Modify
| File | Changes |
|------|---------|
| `app.js` | Insert 4 action functions (`increment`, `decrement`, `reset`, `addHistory`) and 5 event listener registrations (3 button clicks + 1 `document` keydown); no structural changes to existing code |

### Files to Create
| File | Purpose |
|------|---------|
| `tests/e2e/counter.spec.ts` | E2E test suite covering all user-facing counter behavior |

### Code Patterns to Follow
- **IIFE**: All new functions/listeners added inside the existing IIFE wrapper
- **Centralized Render**: Action functions follow: mutate `state.count` → call `addHistory` → call `render()`. No DOM access in action functions.
- **Keyboard Delegation**: Single `keydown` listener on `document`; checks `e.key` for `'ArrowUp'`, `'ArrowDown'`, `'r'`, `'R'`
- **History FIFO**: `unshift` (not `push`) + `slice(0, 10)`; timestamp via `toTimeString().slice(0, 8)`
- **CSS Class Toggle**: Already correct in scaffold's `render()` — no changes needed

### Integration Points
- Action functions call `addHistory(label, state.count)` then `render()` — complete action chain
- Button click listeners use `querySelector('.btn--increment')` etc. → call corresponding action
- `keydown` on `document` maps key names to action functions
- `renderHistory()` already called inside `render()` — no additional wiring needed

---

## Testing Strategy

### Smoke Test
- App loads without console errors; count shows "0"; buttons visible; history empty (0 `<li>` elements)

### Functional Tests
- Increment button → count +1, history entry added at top
- Decrement button → count -1, history entry added
- Reset button → count = 0, history entry added
- ArrowUp key → increments count
- ArrowDown key → decrements count
- R/r key → resets count to 0
- Count class is `count` when >= 0; `count count--negative` when < 0
- After 11 actions → history has exactly 10 entries, newest first

### Regression Check
- All 4 `smoke-task-1.spec.js` tests continue to pass (layout, colors, custom properties, initial state)

### E2E Test Recommendations

**Is this task user-facing?** Yes — all user stories 2–7 delivered here.

**Recommended test file**: `tests/e2e/counter.spec.ts`

**Recommended test scenarios**:
1. **Increment via button and keyboard**: Click Increment → count = 1; ArrowUp → count = 2; history entries present
2. **Decrement via button and keyboard**: Click Decrement from 0 → count = -1; ArrowDown → count = -2
3. **Reset via button and keyboard**: Increment a few times, Reset → count = 0; increment, press R → count = 0
4. **Negative color toggle**: Decrement below 0 → verify `.count--negative` class; increment back to 0 → verify class absent
5. **History log cap**: Perform 11 actions → verify exactly 10 `<li>` entries; newest entry is first
6. **No console errors during interaction**: All buttons + all shortcuts → zero console errors

**Existing E2E tests to preserve**: `tests/e2e/smoke-task-1.spec.js` — 4 tests; unaffected by app.js behavior additions

**Regression risk assessment**: Low. Smoke tests check static initial state (count=0, empty history, button colors, layout) — none change with Task 2 additions. Only risk is an introduced JS error breaking page load, mitigated by preserving the existing IIFE structure.

---

## Considerations

### Potential Pitfalls
- **`history` naming conflict**: Global `window.history` API exists; always access via `state.history` (already done in scaffold). Never declare `var history` bare inside the IIFE.
- **ArrowUp scroll interference**: Arrow keys may scroll the page if the layout overflows. Layout is fixed-height so this is likely safe, but verify during testing.
- **TypeScript test file + CommonJS config**: Playwright config uses `require()` (CJS). Confirm Playwright handles `.spec.ts` natively (it does in Playwright ≥ 1.20 with built-in TS transpilation) — or keep the test file as JavaScript-compatible TS (no TS-only imports).
- **Call order in action functions**: `addHistory` must be called before `render()` so `renderHistory()` inside `render()` sees the updated array.

### Edge Cases
- **Reset from zero**: Still adds a "Reset → 0" history entry (no special casing)
- **Rapid key presses**: Each press independently increments/decrements/logs — no debouncing needed
- **History cap at exactly 10**: `slice(0, 10)` correctly drops oldest on the 11th action
- **Case-insensitive R**: Both `e.key === 'r'` and `e.key === 'R'` must be checked — HOW.md pattern already shows this dual check

---

```json
{
  "task": "2",
  "role": "research",
  "filesReviewed": [
    "app.js",
    "index.html",
    "style.css",
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/WHY_WHAT.md",
    "ai-docs/SPEC/TASKS.json",
    "ai-docs/SPEC/STATUS.json",
    "ai-docs/SPEC/PROGRESS_LOG.md",
    "ai-docs/TASKS/1/research.md",
    "ai-docs/TASKS/1/validate_attempt_1.md",
    "tests/e2e/smoke-task-1.spec.js",
    "tests/e2e/playwright.config.js"
  ],
  "planSummary": "Insert four action functions (increment, decrement, reset, addHistory) and five event listeners (3 button clicks + 1 document keydown) into the existing app.js scaffold between the DOM refs and render sections, strictly following HOW.md patterns. Create tests/e2e/counter.spec.ts with 6 focused E2E scenarios. No changes needed to index.html or style.css.",
  "scope": {
    "level": "minor",
    "rationale": "All changes are localized to a single existing file (app.js) with clearly prescribed patterns from HOW.md. The only new file is a test file. No architecture changes, no new modules, no HTML/CSS modifications required."
  }
}
```