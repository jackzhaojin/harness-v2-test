The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/17/research.md`. Here's a summary of the key findings:

## Research Summary — Task 17: Settings Page

### Current State
The Settings page (`src/pages/Settings.tsx`) exists with only a theme selector (Light/Dark/System radio cards). It's 119 lines using `useTheme()` from ThemeContext. Route `/settings` and sidebar nav item are already wired.

### Implementation Plan
**3 new sub-components** following HOW.md's prescribed file structure:
1. **`ProfileSection.tsx`** — Avatar (lg size, Sarah Chen default), editable name Input, disabled email Input, "Change Avatar" Button showing "Coming soon!" info toast
2. **`NotificationsSection.tsx`** — 3 Toggle switches (Email=on, Push=on, Slack=off defaults) using existing Toggle UI component
3. **`AppearanceSection.tsx`** — Migrated theme selector + new 5-swatch accent color picker (blue, purple, green, orange, pink)

### Key Architecture Decisions
- **Hybrid save strategy**: Theme changes remain instant (via ThemeContext), while profile/notifications/accent are batched to Save button
- **Persistence**: 3 new localStorage keys via `useLocalStorage` hook — `settings-profile`, `settings-notifications`, `settings-accent-color`
- **Accent colors**: CSS custom properties on `:root` for app-wide application
- **Types to add**: `AccentColor` union, `NotificationSettings` interface, `UserProfile` interface

### Scope Assessment: **Major**
- 4 new files (3 components + 1 E2E test)
- 3 modified files (Settings.tsx rewrite, types/index.ts, index.css)
- New app-wide concern (accent color CSS custom properties)
- All existing UI components (Toggle, Input, Button, Avatar, Card, Toast) are ready to use — no new primitives needed