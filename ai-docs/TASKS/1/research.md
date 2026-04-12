The research is complete. Here is the full output to be saved to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/1/research.md`:

---

# Research: Task 1 - Build Complete UI Foundation with Playwright Test Infrastructure

**Task ID**: 1
**Researched**: 2026-04-11
**Dependencies**: None (first task)
**Estimated Complexity**: Medium

---

## Relevant Project Context

**Project Type**: Vanilla JS counter application — zero-dependency, three-file boundary (index.html, style.css, app.js), browser-native, file:// protocol compatible.

**Key Files**:
- `ai-docs/SPEC/CONSTITUTION.md` — Defines four immutable principles: zero dependencies, three-file boundary, no persistence, keyboard-first
- `ai-docs/SPEC/HOW.md` — Architecture guide with patterns, naming conventions, CSS/HTML conventions, anti-patterns
- `ai-docs/SPEC/TASKS.json` — Two-task plan; Task 1 sets the structural foundation, Task 2 wires all logic
- `tests/e2e/node_modules/` — Playwright dependencies already installed; no config or spec files exist yet

**Patterns in Use** (from HOW.md):
- IIFE Module — all app.js code wrapped in `(function() { 'use strict'; ... })();`
- Centralized State + Render-on-Change — state mutations always call `render()`; no direct DOM writes outside render
- CSS Class Toggle for Visual State — `count--negative` modifier toggled in `render()`, color logic stays in CSS
- CSS Custom Properties on `:root` — `--color-positive`, `--color-negative`, `--color-reset`
- BEM-lite CSS naming — block (`count`, `controls`, `history`), modifier via `--` (`btn--increment`, `btn--decrement`, `btn--reset`)

**Relevant Prior Tasks**: None — this is the inaugural task.

---

## Functional Requirements

### Primary Objective
Task 1 establishes the complete visual skeleton of the counter application across all three source files and installs the Playwright test infrastructure. No interactive logic is wired (that is Task 2's scope), but every visible element — the count display, three action buttons, and history section — must be present, correctly styled, and rendered without any console errors when index.html is opened via the file:// protocol.

### Acceptance Criteria
1. **index.html exists**: Links `style.css` via `<link>` in `<head>` and `app.js` via `<script defer>` correctly
2. **style.css CSS reset**: `*, *::before, *::after { box-sizing: border-box; }` and `body { margin: 0; }` at the top
3. **app.js IIFE + strict mode**: Entire file wrapped in IIFE with `'use strict'` as first statement inside
4. **Zero console errors on load**: No missing references, broken links, or JS exceptions
5. **`#countDisplay` visible, shows "0"**: Element present in DOM with initial text content of `0`
6. **Increment button visible, styled green**: `btn--increment` class, sufficient padding, green color via CSS custom property
7. **Decrement button visible, styled red**: `btn--decrement` class, sufficient padding, red color
8. **Reset button visible, styled gray**: `btn--reset` class, sufficient padding, gray color
9. **`#historyList` visible and empty**: Element present but contains no list items on load
10. **Buttons are easily clickable**: Adequate padding (at minimum 8–12px vertical, 16–24px horizontal)
11. **Single-viewport layout, centered via Flexbox**: No vertical scrollbar on a standard viewport
12. **CSS custom properties defined on `:root`**: `--color-positive`, `--color-negative`, `--color-reset` all declared
13. **History section visually separated**: Uses border, background color, or spacing to distinguish from the controls
14. **Consistent font throughout**: System font stack or single font applied via `body`; no raw browser defaults
15. **`tests/e2e/playwright.config.js` added**: Config file present, compatible with the installed Playwright version
16. **No external network requests**: No CDN fonts, no remote scripts — fully offline

### Scope Boundaries
**In Scope**:
- Creating `index.html`, `style.css`, `app.js` from scratch at the project root
- HTML semantic structure for counter, controls, and history sections
- Full CSS styling — layout, color tokens, button variants, history separation, font
- Minimal app.js scaffold: IIFE + strict mode + DOM element queries + initial `render()` that sets count to `0`
- `tests/e2e/playwright.config.js` file

**Out of Scope**:
- Button click event handlers (Task 2)
- Keyboard shortcut listeners (Task 2)
- History log population logic (Task 2)
- E2E spec test file (Task 2 creates `counter.spec.ts`)

---

## Technical Approach

### Implementation Strategy

The three source files are created at the project root (`/Users/jackjin/dev/harness-v2-test/`), consistent with HOW.md's file structure. `index.html` uses semantic HTML5 with `<main>`, counter `<section>`, and history `<section>`. The `#countDisplay` is the hero element (large font). Three `<button type="button">` elements carry BEM modifier classes. `<ul id="historyList">` is empty. Script tag uses `defer` — no ES module syntax to stay file:// compatible.

`style.css` order: reset → `:root` custom properties → `body` base → layout → count display → button base/variants → history section. Button background colors reference the CSS custom properties. History section uses a distinct visual treatment.

`app.js` at this stage: IIFE scaffold, `'use strict'`, state object (`count: 0, history: []`), DOM refs queried by ID, bare `render()` that sets `countEl.textContent = state.count`, final `render()` call. No event listeners yet.

`playwright.config.js` lives in `tests/e2e/` co-located with node_modules. Since the app runs file://, `baseURL` should be omitted or left for spec files to handle via `page.goto('file://...')`.

### Files to Modify
| File | Changes |
|------|---------|
| *(none)* | All files are new |

### Files to Create
| File | Purpose |
|------|---------|
| `index.html` | HTML entry point — semantic layout, IDs, script/stylesheet links |
| `style.css` | All visual styles — reset, CSS vars, layout, button variants, history |
| `app.js` | IIFE scaffold with strict mode, DOM refs, initial state, bare render() |
| `tests/e2e/playwright.config.js` | Playwright runner configuration |

### Code Patterns to Follow
- **IIFE wrapper**: `(function() { 'use strict'; var state = { count: 0, history: [] }; ... })();` — state declared first, DOM refs next, action functions, render functions, event listeners, then init `render()` call.
- **CSS organization**: Reset → custom props → body → layout → count → controls/buttons → history.
- **BEM-lite**: `btn` block + `btn--increment` / `btn--decrement` / `btn--reset` modifiers; `count` block (Task 2 will add `count--negative` dynamically); `history` block for the log section.
- **No inline styles or handlers**: All in their respective files.

### Integration Points
- `index.html` relative paths `./style.css` and `./app.js` work on file:// (same directory)
- `app.js` queries `document.getElementById('countDisplay')` and `document.getElementById('historyList')` — IDs must match exactly
- `playwright.config.js` sets `testDir: '.'` so Task 2's `counter.spec.ts` is auto-discovered

---

## Testing Strategy

### Smoke Test
- [ ] Open `index.html` via `file://` in a browser — zero console errors
- [ ] Page renders fully within a single viewport (no scrollbar)

### Functional Tests
- [ ] `#countDisplay` visible and text is `0`
- [ ] Increment button (green), Decrement button (red), Reset button (gray) all visible
- [ ] Buttons have comfortable click targets (padding visible in DevTools)
- [ ] `#historyList` present with zero `<li>` children
- [ ] Flexbox centering: content is horizontally centered
- [ ] DevTools `:root` shows `--color-positive`, `--color-negative`, `--color-reset`
- [ ] History section has visible visual separation from button group
- [ ] Consistent font (no Times New Roman / default serif visible)

### Regression Check
- [ ] No pre-existing source files — greenfield creation, regression risk is zero

### E2E Test Recommendations

**Is this task user-facing?** Structurally yes, but `e2eRequired: false` in TASKS.json — no spec file needed for Task 1.

The Playwright config file is the E2E infrastructure deliverable. Actual specs are Task 2's responsibility (`counter.spec.ts`). Manual smoke test covers all Task 1 criteria.

**Existing E2E tests to preserve**: None — `tests/e2e/` contains only `node_modules/`, no spec files.

**Regression risk assessment**: None. Only new files are created.

---

## Considerations

### Potential Pitfalls
- **ES modules blocked on file://**:  Do not use `type="module"` on the script tag — browser CORS policy blocks ES module imports on `file://`. Use plain `<script defer>` only.
- **Playwright config location**: `playwright.config.js` must be in `tests/e2e/` (co-located with `node_modules/`) so the Playwright CLI can discover it without additional path flags.
- **`type="button"` on all buttons**: Without this, buttons inside any ancestor `<form>` default to `type="submit"` and trigger page reload. Declare `type="button"` explicitly on all three.
- **Viewport overflow**: History section will hold up to 10 entries in Task 2. Use `max-height` + `overflow-y: auto` on the history list so the layout never breaks single-viewport constraint even after Task 2.
- **Fourth file prohibition**: `playwright.config.js` lives under `tests/`, not the source root — it does not violate the CONSTITUTION's three-file source boundary.

### Edge Cases
- **`#countDisplay` init**: app.js `render()` must use `textContent`, not `innerHTML` or an attribute, so it works correctly when Task 2 begins updating it with numeric values including negatives.
- **History ID casing**: HTML attribute is `id="historyList"` (camelCase); JS variable should be `historyEl` (consistent with HOW.md conventions). These are different — don't conflate them.
- **`file://` and relative paths**: On Windows, `file:///C:/path/index.html` can behave differently. Relative paths (`./style.css`, `./app.js`) are universally safe across OS.

---

```json
{
  "task": "1",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/TASKS.json",
    "ai-docs/SPEC/PROGRESS_LOG.md",
    "PROMPT.md",
    "tests/e2e/"
  ],
  "planSummary": "Create three new source files (index.html, style.css, app.js) at the project root following HOW.md patterns (IIFE, BEM-lite CSS, CSS custom properties, Flexbox centering, semantic HTML), plus a playwright.config.js in tests/e2e/. App.js is a bare scaffold (state, DOM refs, render() → sets count to 0) with no event logic. All acceptance criteria are structural/visual — zero console errors, correct element IDs, button colors, empty history list, single-viewport layout.",
  "scope": {
    "level": "major",
    "rationale": "Creates all three core source files from scratch plus test infrastructure — establishes the entire application foundation. While no architectural ambiguity exists (HOW.md is prescriptive), the file surface and lines-of-code footprint are significant for a first task."
  }
}
```