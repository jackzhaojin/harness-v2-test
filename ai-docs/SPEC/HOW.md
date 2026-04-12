# Architecture

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Browser (ES5+) | No server needed; file:// protocol compatible; per CONSTITUTION constraint |
| Framework | Vanilla JavaScript | Zero-dependency mandate; no npm, no build tools; CONSTITUTION Principle 1 |
| Styling | Plain CSS (style.css) | No preprocessors; single file; CONSTITUTION Principle 2 |
| Storage | None (in-memory only) | CONSTITUTION Principle 3 explicitly prohibits localStorage, cookies, server |
| Testing | Playwright MCP | E2E functional testing for browser-based interaction |

## File Structure

```
project/
├── index.html      # Entry point — links style.css and app.js; minimal markup scaffold
├── style.css       # All visual styles — layout, colors, button variants, history log
├── app.js          # All application logic — state, event handlers, render, keyboard
└── tests/
    ├── adhoc/      # Task-specific one-off test scripts
    └── e2e/        # Reusable end-to-end test suites
```

> **Three-file boundary** (CONSTITUTION Principle 2): No additional source files may be created. All logic lives in exactly these three files.

## Design Patterns

### Pattern 1: IIFE Module
- **When to use**: Organizing all app code without a build tool or module system
- **Implementation**: Wrap everything in `(function() { 'use strict'; ... })();` to avoid global namespace pollution while keeping a single file constraint
- **Example**:
```javascript
(function () {
  'use strict';

  // --- State ---
  var state = {
    count: 0,
    history: []   // max 10 entries
  };

  // --- DOM refs ---
  // --- Event handlers ---
  // --- Render ---

})();
```

### Pattern 2: Centralized State + Render-on-Change
- **When to use**: Every user action (increment, decrement, reset) and keyboard event must keep UI in sync with data
- **Implementation**: Mutations go through dedicated action functions that update `state`, then always call `render()`. Never touch the DOM directly outside `render()`.
- **Example**:
```javascript
function increment() {
  state.count += 1;
  addHistory('Increment', state.count);
  render();
}

function render() {
  countEl.textContent = state.count;
  countEl.className = state.count < 0 ? 'count count--negative' : 'count';
  renderHistory();
}
```

### Pattern 3: Keyboard Delegation via `document.addEventListener`
- **When to use**: Keyboard shortcuts (Up, Down, R) must work at all times regardless of focused element
- **Implementation**: Attach a single `keydown` listener to `document`. Guard with `e.key` checks. This avoids focus-dependency and satisfies CONSTITUTION Principle 4.
- **Example**:
```javascript
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowUp')   { increment(); }
  if (e.key === 'ArrowDown') { decrement(); }
  if (e.key === 'r' || e.key === 'R') { reset(); }
});
```

### Pattern 4: Capped History Log (FIFO, max 10)
- **When to use**: Every action appends to the history; must never exceed 10 entries
- **Implementation**: `unshift` new entries onto `state.history`, then slice to 10. Rebuild the history list in `renderHistory()` from scratch each time.
- **Example**:
```javascript
function addHistory(action, resultingCount) {
  var now = new Date();
  var ts = now.toTimeString().slice(0, 8); // HH:MM:SS
  state.history.unshift({ action: action, count: resultingCount, time: ts });
  if (state.history.length > 10) {
    state.history = state.history.slice(0, 10);
  }
}

function renderHistory() {
  historyEl.innerHTML = state.history.map(function (entry) {
    return '<li>' + entry.time + ' — ' + entry.action + ' → ' + entry.count + '</li>';
  }).join('');
}
```

### Pattern 5: CSS Class Toggle for Visual State
- **When to use**: Count color must change immediately when crossing zero (positive vs. negative visual distinction)
- **Implementation**: A single modifier class (`count--negative`) is toggled on the count element during `render()`. All color logic lives in CSS, not JS.
- **Example**:
```css
.count {
  color: #2d6a4f;   /* positive / zero */
}
.count--negative {
  color: #c0392b;   /* negative */
}
```
```javascript
countEl.className = state.count < 0 ? 'count count--negative' : 'count';
```

## Conventions

### Naming
- **Files**: lowercase, no hyphens needed given three-file boundary (`index.html`, `style.css`, `app.js`)
- **Functions**: camelCase (`increment`, `decrement`, `reset`, `addHistory`, `render`, `renderHistory`)
- **Variables**: camelCase (`state`, `countEl`, `historyEl`)
- **CSS classes**: BEM-lite — block (`count`, `controls`, `history`), modifier with `--` (`count--negative`, `btn--increment`, `btn--decrement`, `btn--reset`)
- **IDs**: camelCase for JS DOM queries (`countDisplay`, `historyList`)

### Code Organization (within app.js)
1. `'use strict';` + IIFE wrapper open
2. State object declaration
3. DOM element references (queried once at top)
4. Action functions (`increment`, `decrement`, `reset`, `addHistory`)
5. Render functions (`render`, `renderHistory`)
6. Event listeners (button click handlers, then `document` keydown)
7. Initialization call (`render()` on load to set initial state)
8. IIFE wrapper close

### HTML Conventions
- Semantic elements where appropriate (`<button>`, `<ul>`, `<li>`, `<header>`, `<main>`, `<section>`)
- `<script src="app.js" defer></script>` at end of `<head>` or bottom of `<body>` to ensure DOM is ready
- No inline `onclick` or `style` attributes — all behavior in `app.js`, all styles in `style.css`

### CSS Conventions
- CSS custom properties (`--color-positive`, `--color-negative`, `--color-reset`) defined on `:root` for easy theming
- Reset block at top: `*, *::before, *::after { box-sizing: border-box; }` + `body { margin: 0; }`
- Layout via Flexbox for centering
- Button styles scoped to modifier classes (`btn--increment`, etc.) not element-level selectors

## Integration Points

- **index.html → style.css**: `<link rel="stylesheet" href="style.css">` in `<head>`
- **index.html → app.js**: `<script src="app.js" defer></script>` — loads after DOM parse
- **app.js ↔ DOM**: `app.js` queries elements by ID on init; all DOM mutations happen exclusively inside `render()` and `renderHistory()`
- **State flow**: User action (button click or keypress) → action function mutates `state` → `render()` reflects `state` to DOM → no intermediate layers

## Anti-Patterns (Avoid)

- **Direct DOM mutation outside render()**: Always go through state → render cycle. Bypassing this causes the UI to drift from state.
- **Inline event handlers in HTML** (`onclick="..."`, `onkeydown="..."`): Violates separation of concerns; all event wiring belongs in `app.js`.
- **Global variables outside IIFE**: Any `var` at the top level of `app.js` pollutes `window`. Keep everything inside the IIFE.
- **localStorage, sessionStorage, or cookies**: Explicitly prohibited by CONSTITUTION Principle 3. State is intentionally ephemeral.
- **`history.push` instead of `unshift`**: History must display newest-first (top of log). Always `unshift` and slice, never `push`.
- **Dynamic `<script>` or `<link>` injection**: No runtime loading of external resources. App must be fully offline after files are on disk (CONSTITUTION constraint).
- **`console.log` left in production code**: CONSTITUTION and success metrics require zero console errors *and* no noise on load or during normal operation.
- **Adding a fourth source file**: CONSTITUTION Principle 2 sets a hard three-file boundary.
