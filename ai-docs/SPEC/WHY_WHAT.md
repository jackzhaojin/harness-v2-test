# Requirements: Simple Counter App v1

## Why This Iteration
Build a minimal, self-contained browser-based counter application that runs by opening a single HTML file. The app gives users a clear, immediate way to track increments and decrements with a visible action history — no setup, no dependencies, no server required.

## Scope
### In Scope
- Single-screen counter display with current count
- Increment, decrement, and reset controls (buttons)
- Keyboard shortcuts for all three operations
- Action history log (last 10 entries with timestamps)
- Visual distinction between positive and negative counts
- Clean, modern styling with distinct button colors

### Out of Scope (This Iteration)
- Persistent state across page reloads (no localStorage)
- Multiple independent counters
- Step size configuration (always ±1)
- Export, share, or copy functionality
- Animations or sound effects
- Mobile app packaging (PWA, etc.)
- Unit tests or CI pipeline
- User accounts or profiles

## User Stories

### Story 1: View the Counter
As a user, I want to see the current count displayed prominently so I know my count at a glance.

**Acceptance Criteria:**
- [ ] Page loads and displays the count value `0` in a large, legible element
- [ ] The count element is visually the dominant element on the page (largest font)
- [ ] The full UI fits within a single viewport with no scrolling required
- [ ] The page loads without any console errors (file:// protocol compatible)
- [ ] No external network requests are made (fully offline-capable)

### Story 2: Increment the Count
As a user, I want to increase the count by 1 so I can track upward progress.

**Acceptance Criteria:**
- [ ] An "Increment" button labeled "+" or "Increment" is visible on the page
- [ ] Clicking the Increment button increases the displayed count by exactly 1
- [ ] Pressing the Up arrow key also increases the count by exactly 1
- [ ] The count display updates immediately upon button click or keypress
- [ ] The Increment button is styled in green (distinct from other buttons)

### Story 3: Decrement the Count
As a user, I want to decrease the count by 1 so I can correct overcounts or track downward changes.

**Acceptance Criteria:**
- [ ] A "Decrement" button labeled "−" or "Decrement" is visible on the page
- [ ] Clicking the Decrement button decreases the displayed count by exactly 1
- [ ] Pressing the Down arrow key also decreases the count by exactly 1
- [ ] The count display updates immediately upon button click or keypress
- [ ] The Decrement button is styled in red (distinct from other buttons)
- [ ] Count can go below zero (no lower-bound restriction)

### Story 4: Reset the Count
As a user, I want to reset the count to 0 so I can start a fresh counting session.

**Acceptance Criteria:**
- [ ] A "Reset" button labeled "Reset" is visible on the page
- [ ] Clicking the Reset button sets the displayed count to exactly `0`
- [ ] Pressing the `R` key also resets the count to `0`
- [ ] The count display updates immediately upon button click or keypress
- [ ] The Reset button is styled in gray (distinct from Increment and Decrement)

### Story 5: Distinguish Positive vs. Negative Count
As a user, I want the count to look different when negative so I can tell at a glance whether I'm above or below zero.

**Acceptance Criteria:**
- [ ] When the count is `0` or positive, the count text displays in the default/positive color
- [ ] When the count is negative (below `0`), the count text changes to a visually distinct color or style (e.g., red text, different weight)
- [ ] The visual change happens immediately when the count crosses zero in either direction
- [ ] The distinction is perceivable without relying on color alone (or color difference is obvious enough for utility use)

### Story 6: View Action History
As a user, I want to see a log of my recent actions so I can review what I've done.

**Acceptance Criteria:**
- [ ] A history log section is visible on the page below or beside the counter controls
- [ ] Each action (increment, decrement, reset) appends a new entry to the top of the log
- [ ] Each log entry displays the action name and a timestamp (at minimum HH:MM:SS)
- [ ] Each log entry shows the resulting count value after the action
- [ ] The history log shows a maximum of 10 entries; older entries are removed when the limit is exceeded
- [ ] The log is empty on page load (no placeholder entries)

### Story 7: Use Keyboard Shortcuts
As a user, I want keyboard shortcuts for all actions so I can operate the counter without using a mouse.

**Acceptance Criteria:**
- [ ] Pressing the Up arrow key increments the count by 1 at all times while the page is focused
- [ ] Pressing the Down arrow key decrements the count by 1 at all times while the page is focused
- [ ] Pressing the `R` key (case-insensitive) resets the count to 0 at all times while the page is focused
- [ ] Keyboard shortcuts function without requiring focus on any specific element
- [ ] No console errors are thrown when keyboard shortcuts are used

### Story 8: View Clean, Modern Styling
As a user, I want the app to look polished and uncluttered so I can focus on the counter without distraction.

**Acceptance Criteria:**
- [ ] Layout is centered horizontally and vertically (or top-centered with comfortable spacing)
- [ ] No default browser styles are visible (buttons, body margin, fonts are overridden)
- [ ] Buttons have sufficient padding and spacing so they are easy to click/tap
- [ ] All three buttons are visually distinct by color: green (increment), red (decrement), gray (reset)
- [ ] The history log is visually separated from the counter controls (border, spacing, or background)
- [ ] The app uses a consistent font and color palette throughout

## Success Metrics
- All three files (`index.html`, `style.css`, `app.js`) exist and are correctly linked
- Opening `index.html` in a browser with no server starts a fully functional counter
- Zero console errors on load and during normal operation
- Every defined keyboard shortcut works immediately on page load
- History log never exceeds 10 entries regardless of how many actions are performed

## Dependencies
- A modern browser with ES5+ JavaScript support (no polyfills required)
- No internet connection needed after files are on disk
- No build tools, package managers, or dev server required
