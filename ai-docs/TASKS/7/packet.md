# Task 7: Dark/light theme toggle with full application theming

## Goal
Implement the theme toggle functionality in the header and apply dark mode styling throughout the entire application. Theme selection (light/dark/system) persists to localStorage and respects OS preferences when set to system.

## Acceptance Criteria
- [ ] Theme toggle button visible in header with sun/moon icon
- [ ] Clicking toggle cycles between light and dark modes
- [ ] Light mode: gray-50 background, white cards, gray-900 text
- [ ] Dark mode: gray-900 background, gray-800 cards, gray-100 text
- [ ] Theme applies to all existing components (sidebar, header, cards, inputs)
- [ ] Selected theme persists to localStorage
- [ ] On initial load, theme reads from localStorage (defaults to light)
- [ ] System option in Settings follows OS prefers-color-scheme
- [ ] Theme changes apply immediately without page refresh
- [ ] All text maintains readable contrast in both themes
- [ ] Borders, shadows, and dividers adapt to theme
- [ ] Charts will adapt colors when implemented (foundation ready)

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
