# Project Constitution

## Mission
Provide a lightweight, self-contained browser counter with action history so users can track increments and decrements without any setup or dependencies.

## Immutable Principles
1. Zero dependencies — no frameworks, no build tools, no npm; the app runs by opening index.html directly in a browser
2. Three-file boundary — all code lives in exactly index.html, style.css, and app.js; no additional source files
3. No backend, no persistence — state lives only in memory for the current session; nothing is stored to localStorage, cookies, or a server
4. Keyboard-first interactivity — Up arrow, Down arrow, and R must work at all times as first-class controls alongside the buttons

## Vibe / Style Guide
- Tone: Clean and functional — utility over decoration, every element earns its place
- Complexity: Minimal — the entire UI fits on a single screen with no scrolling required
- UX Priority: Immediate clarity — the count is the hero element; everything else is supporting cast
- Visual feedback: Positive counts are visually distinct from negative counts (color or style shift) so state is readable at a glance

## Constraints
- Pure HTML/CSS/JS only — no TypeScript, no preprocessors, no polyfill libraries
- Must load without a dev server (file:// protocol compatible)
- No console errors on load or during normal operation
- History log is capped at the last 10 actions (no unbounded growth)
- Must not require an internet connection after the file is on disk

## Out of Scope
- Persistent state across page reloads
- User accounts or profiles
- Multiple independent counters
- Step size configuration (increment/decrement by values other than 1)
- Export or share functionality
- Animations or sound effects
- Mobile app packaging (PWA, Cordova, etc.)
- Unit tests or CI pipeline
