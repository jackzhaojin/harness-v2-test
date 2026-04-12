# Simple Counter App

## Problem

Build a simple, functional counter web application that runs in a browser. Pure HTML/CSS/JS, no frameworks, no build tools.

## Requirements

1. **index.html** with:
   - A large display showing the current count (starting at 0)
   - An "Increment" button (+1)
   - A "Decrement" button (-1)
   - A "Reset" button (back to 0)
   - A history log showing the last 10 actions

2. **style.css** with:
   - Clean, modern styling
   - Centered layout with proper spacing
   - Distinct button colors (green for increment, red for decrement, gray for reset)
   - Visual distinction when count is negative vs positive

3. **app.js** with:
   - Counter state management
   - Increment, decrement, and reset operations
   - History tracking (append each action with timestamp)
   - Keyboard shortcuts (Up arrow = increment, Down arrow = decrement, R = reset)

## Definition of Done

- [ ] All three files (index.html, style.css, app.js) exist and are linked correctly
- [ ] Counter displays and starts at 0
- [ ] Increment button increases count by 1
- [ ] Decrement button decreases count by 1
- [ ] Reset button sets count back to 0
- [ ] History log shows recent actions with timestamps
- [ ] Keyboard shortcuts work (Up, Down, R)
- [ ] App loads without console errors
- [ ] Styling looks presentable (not default browser styles)
- [ ] Negative numbers display differently from positive
