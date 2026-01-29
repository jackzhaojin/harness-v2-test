# Task 17: Settings page with profile, notifications, and appearance sections

## Goal
Build the complete Settings page including Profile section (name, email, avatar), Notifications section (three toggles), and Appearance section (theme selector, accent colors). All settings persist to localStorage. Implements Stories 21, 22, 23, and 24.

## Acceptance Criteria
- [ ] Settings page renders at /settings route
- [ ] Profile section with heading and current avatar display
- [ ] Name input field (editable) with current value
- [ ] Email input field (read-only/disabled)
- [ ] Change Avatar button shows Coming soon! toast on click
- [ ] Notifications section with heading
- [ ] Three toggle switches: Email, Push, Slack notifications
- [ ] Toggles show current on/off state visually
- [ ] Default: Email on, Push on, Slack off
- [ ] Appearance section with heading
- [ ] Theme selector: Light, Dark, System options (radio or segmented)
- [ ] System option follows OS prefers-color-scheme
- [ ] Accent color picker with 5 swatches: blue, purple, green, orange, pink
- [ ] Selected accent color applies to primary buttons and accents app-wide
- [ ] Save Changes button at bottom of page
- [ ] Save button shows brief loading state on click
- [ ] Success toast appears: Settings saved!
- [ ] All settings sections save together on Save click
- [ ] Settings persist to localStorage and survive page refresh/browser restart
- [ ] Initial values load from localStorage or use defaults

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
