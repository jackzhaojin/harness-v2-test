# Requirements: Project Management Dashboard MVP

## Why This Iteration
Build a complete, production-quality project management dashboard that demonstrates modern React best practices. This is a greenfield project establishing a professional SaaS-style application with multiple pages, interactive components, data visualization, and a polished responsive UI with dark/light mode support.

## Scope

### In Scope
- App shell with collapsible sidebar and header navigation
- Dashboard overview with stats, charts, and activity feed
- Projects list with filtering, sorting, pagination, and CRUD modals
- Kanban task board with drag-and-drop functionality
- Team members page with grid layout and filtering
- Settings page with form persistence
- Dark/light theme toggle with localStorage persistence
- Mobile-first responsive design
- Playwright E2E tests for critical flows

### Out of Scope (This Iteration)
- Backend API integration or database connections
- User authentication or authorization
- Real-time collaboration or WebSocket features
- Data export/import functionality
- Internationalization (i18n) or multi-language support
- Offline-first/PWA capabilities
- Unit testing (Playwright E2E only)
- CI/CD pipeline configuration
- Deployment or hosting setup
- Analytics or tracking integration
- Email notifications or external integrations

## User Stories

### Story 1: App Shell & Collapsible Sidebar
As a user, I want a persistent navigation sidebar so I can quickly access all sections of the dashboard.

**Acceptance Criteria:**
- [ ] Sidebar displays navigation items: Dashboard, Projects, Tasks, Team, Settings
- [ ] Each nav item shows an icon (Lucide React) and text label
- [ ] Clicking a nav item navigates to the corresponding page via React Router
- [ ] Active page is visually highlighted in sidebar (different background/text color)
- [ ] Sidebar is collapsible via toggle button (collapses to icons only)
- [ ] Collapsed/expanded state persists to localStorage
- [ ] Sidebar uses semantic `<nav>` and `<aside>` elements

### Story 2: Top Header with Search and User Menu
As a user, I want a header bar so I can search, view notifications, and access my profile.

**Acceptance Criteria:**
- [ ] Header is fixed at top of viewport, spans full width of content area
- [ ] Search input field with placeholder "Search..." and search icon
- [ ] Notifications bell icon with visual indicator (dot) for unread state
- [ ] User avatar thumbnail that opens dropdown on click
- [ ] Dropdown contains: "Profile", "Settings", "Logout" options
- [ ] Clicking outside dropdown closes it
- [ ] All interactive elements have visible focus states

### Story 3: Dark/Light Mode Toggle
As a user, I want to switch between dark and light themes so I can use my preferred viewing mode.

**Acceptance Criteria:**
- [ ] Theme toggle button visible in header (sun/moon icon)
- [ ] Clicking toggle switches between light and dark themes
- [ ] Theme applies to all components (backgrounds, text, borders, shadows)
- [ ] Light mode: gray-50 background, white cards, gray-900 text
- [ ] Dark mode: gray-900 background, gray-800 cards, gray-100 text
- [ ] Selected theme persists to localStorage
- [ ] On initial load, theme is read from localStorage (defaults to light if none)

### Story 4: Mobile Responsive Navigation
As a mobile user, I want the sidebar to become a hamburger menu so I can navigate on small screens.

**Acceptance Criteria:**
- [ ] Below 768px viewport width, sidebar is hidden by default
- [ ] Hamburger menu icon appears in header on mobile
- [ ] Tapping hamburger opens sidebar as full-screen overlay
- [ ] Overlay has semi-transparent backdrop
- [ ] Tapping backdrop or nav item closes the overlay
- [ ] Close button (X) visible in overlay header
- [ ] Tablet (768px-1024px): sidebar shows icons only by default

### Story 5: Dashboard Stats Cards
As a user, I want to see key metrics at a glance so I can understand project status quickly.

**Acceptance Criteria:**
- [ ] Four stat cards displayed in responsive grid (1 col mobile, 2 col tablet, 4 col desktop)
- [ ] Card 1: "Total Projects" with count from mock data
- [ ] Card 2: "Active Tasks" with count of non-done tasks
- [ ] Card 3: "Team Members" with count from mock data
- [ ] Card 4: "Completed This Week" with count of done tasks
- [ ] Each card has icon, label, and large number
- [ ] Cards have hover effect (subtle shadow/scale transition)
- [ ] Clicking card navigates to relevant page (Projects, Tasks, Team)

### Story 6: Dashboard Charts
As a user, I want to see visual data representations so I can understand trends and distributions.

**Acceptance Criteria:**
- [ ] Line chart showing task completions over past 7 days (Recharts)
- [ ] X-axis shows day labels (Mon, Tue, etc.)
- [ ] Y-axis shows count of completed tasks
- [ ] Pie/donut chart showing tasks by status (To Do, In Progress, Done)
- [ ] Chart segments use distinct colors with legend
- [ ] Charts are responsive (resize with container)
- [ ] Charts adapt colors to current theme (dark/light)
- [ ] Tooltips appear on hover with exact values

### Story 7: Dashboard Activity Feed
As a user, I want to see recent activity so I can stay informed about project changes.

**Acceptance Criteria:**
- [ ] Activity feed section with header "Recent Activity"
- [ ] Displays last 5 activity items from mock data
- [ ] Each item shows: user name/avatar, action description, timestamp
- [ ] Actions formatted as "[User] [action] [target]" (e.g., "Alice completed Homepage design")
- [ ] Timestamps show relative time (e.g., "2 hours ago")
- [ ] Feed has subtle dividers between items
- [ ] "View all" link at bottom (navigates to Tasks page)

### Story 8: Projects Table Display
As a user, I want to see all projects in a table so I can review project details.

**Acceptance Criteria:**
- [ ] Table displays columns: Name, Status, Progress, Team Lead, Due Date, Actions
- [ ] Status shows as colored badge (Active=green, On Hold=yellow, Completed=blue)
- [ ] Progress column shows percentage with visual progress bar
- [ ] Due Date formatted as readable date (e.g., "Feb 15, 2026")
- [ ] Actions column has dropdown menu icon
- [ ] Table has alternating row backgrounds for readability
- [ ] Table is horizontally scrollable on mobile

### Story 9: Projects Table Filtering and Sorting
As a user, I want to search and sort projects so I can find what I need quickly.

**Acceptance Criteria:**
- [ ] Search input above table filters projects by name (case-insensitive)
- [ ] Search is debounced (300ms delay before filtering)
- [ ] Clicking any column header sorts by that column
- [ ] Sort indicator (arrow) shows current sort column and direction
- [ ] Clicking same header toggles ascending/descending
- [ ] Default sort: by name ascending
- [ ] Empty state message when search returns no results

### Story 10: Projects Table Pagination
As a user, I want paginated results so I can navigate through many projects.

**Acceptance Criteria:**
- [ ] Table shows 5 projects per page
- [ ] Pagination controls below table: Previous, page numbers, Next
- [ ] Current page number is highlighted
- [ ] Previous button disabled on first page
- [ ] Next button disabled on last page
- [ ] Page info text shows "Showing X-Y of Z projects"
- [ ] Changing filters/search resets to page 1

### Story 11: Create New Project
As a user, I want to add new projects so I can track new work.

**Acceptance Criteria:**
- [ ] "New Project" button above projects table
- [ ] Clicking opens modal with form
- [ ] Form fields: Name (required), Status (dropdown), Team Lead (dropdown), Due Date (date picker)
- [ ] Status options: Active, On Hold, Completed
- [ ] Team Lead options populated from team mock data
- [ ] Submit button disabled until required fields filled
- [ ] Submitting adds project to table and closes modal
- [ ] New project appears in table (may require resort/refresh)
- [ ] Cancel button closes modal without saving

### Story 12: Edit and Delete Project
As a user, I want to modify or remove projects so I can keep my project list current.

**Acceptance Criteria:**
- [ ] Actions menu contains: Edit, Archive, Delete options
- [ ] Clicking Edit opens modal pre-filled with project data
- [ ] Saving updates project in table
- [ ] Clicking Archive updates status to "Archived" (or removes from active view)
- [ ] Clicking Delete opens confirmation modal
- [ ] Confirmation modal shows project name and warns action is permanent
- [ ] Confirming delete removes project from table
- [ ] Cancel in confirmation modal returns to table without deleting

### Story 13: Kanban Board Layout
As a user, I want to see tasks organized in columns so I can visualize workflow status.

**Acceptance Criteria:**
- [ ] Three columns displayed: "To Do", "In Progress", "Done"
- [ ] Columns have distinct headers with column name and task count
- [ ] Columns are equal width on desktop, stack vertically on mobile
- [ ] Each column has scrollable content area if many tasks
- [ ] Empty columns show placeholder text "No tasks"
- [ ] Columns have subtle background color differentiation

### Story 14: Task Cards Display
As a user, I want to see task details on cards so I can understand each task at a glance.

**Acceptance Criteria:**
- [ ] Task cards show: title, assignee avatar, priority badge, due date
- [ ] Priority badges: Low (gray), Medium (yellow), High (red)
- [ ] Assignee shown as small circular avatar with tooltip for name
- [ ] Due date formatted as short date (e.g., "Jan 28")
- [ ] Overdue tasks show due date in red
- [ ] Cards have white/gray-800 background with subtle shadow
- [ ] Cards have hover state (elevated shadow)

### Story 15: Drag and Drop Tasks
As a user, I want to drag tasks between columns so I can update task status.

**Acceptance Criteria:**
- [ ] Task cards are draggable (cursor changes on hover)
- [ ] Dragging shows visual feedback (reduced opacity, drag ghost)
- [ ] Drop zones highlight when dragging over valid column
- [ ] Dropping task moves it to new column
- [ ] Task appears at bottom of target column
- [ ] Column task counts update after move
- [ ] Task status updates to match column (To Do/In Progress/Done)
- [ ] Position persists after page refresh (localStorage)

### Story 16: Add New Task
As a user, I want to add tasks to columns so I can create new work items.

**Acceptance Criteria:**
- [ ] "Add Task" button at bottom of each column
- [ ] Clicking opens inline form or modal for new task
- [ ] Form fields: Title (required), Priority (dropdown), Assignee (dropdown), Due Date (date picker)
- [ ] Default priority is "Medium"
- [ ] Submitting adds task to that column
- [ ] New task appears at bottom of column
- [ ] Cancel or clicking away closes form without adding
- [ ] New tasks persist to localStorage

### Story 17: Task Detail Panel
As a user, I want to view and edit task details so I can manage task information.

**Acceptance Criteria:**
- [ ] Clicking task card opens slide-over panel from right
- [ ] Panel shows full task details: title, description, priority, assignee, due date, status
- [ ] Panel has edit mode toggle
- [ ] In edit mode, fields become editable
- [ ] Save button persists changes
- [ ] Close button (X) or clicking outside closes panel
- [ ] Panel has smooth slide animation (300ms)
- [ ] Keyboard: Escape closes panel

### Story 18: Team Members Grid
As a user, I want to see all team members so I can find and contact colleagues.

**Acceptance Criteria:**
- [ ] Members displayed in card grid layout
- [ ] Responsive: 1 column mobile, 2 columns tablet, 3 columns desktop
- [ ] Each card shows: avatar (large), name, role, email, online status indicator
- [ ] Online status: green dot for online, gray dot for offline
- [ ] Email is clickable mailto link
- [ ] Cards have consistent height regardless of content
- [ ] Cards have hover effect (subtle shadow/border)

### Story 19: Team Members Filtering
As a user, I want to search and filter team members so I can find specific people.

**Acceptance Criteria:**
- [ ] Search input filters by name (case-insensitive, real-time)
- [ ] Role dropdown filter with options: All, Developer, Designer, Manager
- [ ] Filters can be combined (search + role)
- [ ] Empty state message when no members match filters
- [ ] Filter state does not persist (resets on page navigation)
- [ ] Result count shown (e.g., "Showing 3 of 8 members")

### Story 20: Invite Team Member
As a user, I want to invite new members so I can grow my team.

**Acceptance Criteria:**
- [ ] "Invite Member" button above team grid
- [ ] Clicking shows modal with email input
- [ ] Email field has validation (basic email format)
- [ ] Submit button disabled for invalid email
- [ ] Submitting shows success toast "Invite sent to [email]!"
- [ ] Modal closes after successful submission
- [ ] (No actual member added - just UI demonstration)

### Story 21: Settings Profile Section
As a user, I want to manage my profile so I can keep my information current.

**Acceptance Criteria:**
- [ ] Profile section with heading and avatar display
- [ ] Name input field (editable)
- [ ] Email input field (disabled/read-only)
- [ ] Avatar placeholder with "Change Avatar" button (shows toast "Coming soon!")
- [ ] Initial values loaded from localStorage or defaults
- [ ] Form values persist on save

### Story 22: Settings Notifications Section
As a user, I want to control notification preferences so I receive relevant alerts.

**Acceptance Criteria:**
- [ ] Notifications section with heading
- [ ] Three toggle switches: Email notifications, Push notifications, Slack notifications
- [ ] Toggles show current state (on/off)
- [ ] Toggling updates state visually immediately
- [ ] Toggle states persist to localStorage on save
- [ ] Default: Email on, Push on, Slack off

### Story 23: Settings Appearance Section
As a user, I want to customize the app appearance so it suits my preferences.

**Acceptance Criteria:**
- [ ] Appearance section with heading
- [ ] Theme selector: Light, Dark, System (radio buttons or segmented control)
- [ ] "System" option follows OS preference
- [ ] Accent color picker with 5 preset color swatches
- [ ] Colors: blue, purple, green, orange, pink
- [ ] Selected color applies to primary buttons and accents
- [ ] Selections persist to localStorage on save

### Story 24: Settings Form Persistence
As a user, I want my settings to persist so I don't have to reconfigure each visit.

**Acceptance Criteria:**
- [ ] "Save Changes" button at bottom of settings page
- [ ] Button shows loading state briefly on click
- [ ] Success toast appears "Settings saved!"
- [ ] All settings sections save together
- [ ] Settings survive page refresh and browser restart
- [ ] Unsaved changes warning if navigating away (optional enhancement)

### Story 25: Toast Notification System
As a user, I want feedback messages so I know when actions succeed or fail.

**Acceptance Criteria:**
- [ ] Toast component appears in bottom-right corner
- [ ] Toast shows message text and optional icon
- [ ] Toast types: success (green), error (red), info (blue)
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Toast has close button for manual dismiss
- [ ] Multiple toasts stack vertically
- [ ] Toast has enter/exit animation

### Story 26: Modal Component System
As a user, I want modal dialogs so I can perform focused actions.

**Acceptance Criteria:**
- [ ] Modal displays centered on screen with backdrop overlay
- [ ] Backdrop click closes modal (unless explicitly prevented)
- [ ] Modal has header, body, and footer sections
- [ ] Close button (X) in header corner
- [ ] Keyboard: Escape closes modal
- [ ] Focus trapped inside modal when open
- [ ] Smooth fade-in animation on open
- [ ] Scrollable body if content overflows

### Story 27: Reusable UI Components
As a developer, I want reusable UI components so I can build consistently.

**Acceptance Criteria:**
- [ ] Button component with variants: primary, secondary, outline, ghost
- [ ] Button sizes: sm, md, lg
- [ ] Button states: default, hover, active, disabled, loading
- [ ] Card component with padding and shadow variants
- [ ] Badge component with color variants (status colors)
- [ ] Input component with label, placeholder, error state
- [ ] All components support dark mode styling
- [ ] All components have TypeScript props interface

### Story 28: Mock Data Setup
As a developer, I want realistic mock data so I can demonstrate all features.

**Acceptance Criteria:**
- [ ] mockData.ts exports: projects (10 items), tasks (15+ items), team (8 members), activities (10 items)
- [ ] Projects have varied statuses and progress values
- [ ] Tasks distributed across all three statuses
- [ ] Tasks have varied priorities and assignees
- [ ] Team members have varied roles and online states
- [ ] Activities cover different action types
- [ ] All data uses consistent IDs and references
- [ ] TypeScript types defined for all data structures

### Story 29: Playwright E2E Tests
As a developer, I want automated tests so I can verify critical functionality.

**Acceptance Criteria:**
- [ ] Test: Navigate to each page via sidebar (5 pages)
- [ ] Test: Toggle dark mode and verify theme changes
- [ ] Test: Search projects table and verify filtered results
- [ ] Test: Sort projects table by clicking column headers
- [ ] Test: Open and close project modal
- [ ] Test: Drag task between Kanban columns
- [ ] Test: Open task detail panel and close with Escape
- [ ] Test: Filter team members by role
- [ ] Test: Save settings and verify toast appears
- [ ] Test: Mobile viewport - hamburger menu opens sidebar

## Success Metrics
- All 6 features implemented per acceptance criteria in prompt
- TypeScript compiles without errors (`npx tsc --noEmit`)
- `npm run build` succeeds without errors
- No console errors or warnings in any view
- Responsive at all breakpoints (320px to 1920px)
- Dark mode toggle works and persists correctly
- All Playwright E2E tests pass
- Page transitions feel smooth (< 100ms)
- All interactive elements have visible focus states

## Dependencies
- Node.js 18+ and npm
- React 18 with TypeScript
- Vite as build tool
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization
- React Router v6 for navigation
- Playwright for E2E testing
- Modern browser with localStorage support

---

## Iteration: 2026-01-29 - Dashboard Demo Enhancement

### Why This Iteration
Create an automated demo system that showcases the fully-built dashboard to stakeholders and other viewers. The dashboard MVP is complete with all features implemented (Stories 1-29). This iteration adds Playwright headful scripts that drive the browser at a natural pace through the app's features, paired with voice-over narration documents with timing cues. The demos serve as a living showcase: if any feature is found broken during demo development, the app code gets fixed as part of this enhancement.

**Priority order:** Highlights demo first (get it working end-to-end), then highlights voice-over, then full tour demo, then full tour voice-over.

### Scope

#### In Scope
- Highlights demo script (~2-3 minutes) covering the most visually impressive features
- Full tour demo script (~5-7 minutes) covering every dashboard feature comprehensively
- Voice-over markdown documents with timestamps/timing cues for both demos
- Shared demo helper utilities (pause, scroll, viewport resize, drag-and-drop)
- Demo-specific Playwright configuration (generous timeouts, no retries, headful)
- npm scripts for running demos (`demo:highlights`, `demo:full`)
- Bug fixes for any app features found broken during demo development
- Adding `data-testid` attributes to app components where needed for stable demo selectors

#### Out of Scope (This Iteration)
- Text-to-speech (TTS) integration or audio generation
- Video recording of demo runs
- Demo scripts for browsers other than Chromium
- Automated screenshot capture during demos
- New app features (only fix broken existing features)
- Changes to visual design or layout beyond bug fixes
- Modifications to existing E2E test suite (in `tests/e2e/`) unless fixing genuine bugs
- CI/CD integration for demo scripts

### Research Requirements

Before building any demo scripts, thorough research is required on the following topics. The research phase must produce concrete, actionable recommendations (not just options) with code snippets.

**Research Topic 1: Playwright Headful Demo Patterns**
How teams use Playwright for product demos and automated showcases (distinct from testing). Recommended config options (`slowMo`, `headless: false`, viewport, `launchOptions`). How to structure a "demo" vs a "test" — assertions should be minimal (only "can I interact with this element"), not visual assertions.

**Research Topic 2: Drag-and-Drop Reliability in Playwright**
The app uses HTML5 native drag API (no libraries, per Constitution constraints). Playwright's native `page.dragAndDrop()` / `locator.dragTo()` is notoriously flaky with HTML5 DnD and React. Research: native Playwright drag API vs manual mouse event sequences (`mouse.move`, `mouse.down`, `mouse.up`) vs dispatching synthetic `dragstart`/`dragover`/`drop` events via `page.evaluate()`. Known issues with `dataTransfer` in Playwright's drag simulation. Recommend the most reliable approach for 2025-2026 Playwright versions.

**Research Topic 3: Pacing and Visual Timing**
What pause durations look natural for a human viewer? `page.waitForTimeout()` vs `slowMo` config vs custom timing helpers. How to implement "scenic pauses" where the viewer absorbs what's on screen. Recommended pause ranges for different action types (navigation, hover, form fill, transition).

**Research Topic 4: Viewport Resizing for Responsive Demos**
Best practices for `page.setViewportSize()` during a running script. Layout thrashing concerns. Smooth transitions vs instant resize. Gotchas with React re-renders during resize.

**Research Topic 5: Selector Strategy for Demos**
Demos need stable selectors that won't break on minor UI changes, but also need to target specific visual elements. Right balance of `data-testid`, `getByRole()`, `getByText()`, and CSS selectors for demo scripts specifically.

**Research Topic 6: Playwright Config for Demos**
Recommended `playwright.config.ts` settings for demo use cases: generous timeouts (120s+, since demos have intentional pauses), minimal reporter (not test reports), retry policy (0 retries — if a demo fails it needs fixing, not retrying). Whether to add a separate Playwright config file or extend the existing one.

### User Stories

### Story 30: Demo Shared Helpers
As a demo developer, I want reusable helper utilities so that both demo scripts use consistent pacing, scrolling, and interaction patterns.

**Acceptance Criteria:**
- [ ] Helper file created at `demo/helpers.ts`
- [ ] `pause(ms: number)` helper wraps `page.waitForTimeout()` with a descriptive name for demo readability
- [ ] `scenicPause(page, ms?: number)` provides a default "viewer absorbs content" pause (1500-2000ms)
- [ ] `quickPause(page, ms?: number)` provides a short transition pause (500-800ms)
- [ ] `smoothScroll(page, selector: string)` scrolls an element into view with smooth behavior rather than instant jump
- [ ] `setViewport(page, width: number, height: number)` wraps `page.setViewportSize()` with a small delay after resize for React re-render
- [ ] `highlightElement(page, selector: string)` optionally adds a brief visual highlight (border/shadow) to draw viewer attention to an element before interacting — or is omitted if research shows this is unnecessary
- [ ] Drag-and-drop helper function that implements the most reliable approach per research (native API, manual mouse events, or synthetic dispatch)
- [ ] All helpers are TypeScript typed and importable by both demo scripts
- [ ] Helpers do NOT include test assertions — they are interaction utilities only

### Story 31: Highlights Demo Script
As a presenter, I want a Playwright headful script that showcases the most visually impressive dashboard features at a natural pace so I can demo the product to stakeholders.

**Acceptance Criteria:**
- [ ] Script located at `demo/highlights.spec.ts`
- [ ] Script runs headful (visible browser) via `npx playwright test demo/highlights.spec.ts --headed --project=chromium`
- [ ] npm script `demo:highlights` wired up in `package.json` with command: `npx playwright test demo/highlights.spec.ts --headed --project=chromium`
- [ ] Browser opens at 1280x800 desktop resolution
- [ ] Demo sequence covers (in approximate order):
  - Opens app at localhost, pauses to show dashboard landing page
  - Hovers over stat cards to show hover effects
  - Scrolls to charts section, pauses on line chart and donut chart
  - Navigates to Projects page via sidebar click
  - Uses search/filter on projects table
  - Sorts table by clicking a column header
  - Clicks "New Project" button, fills modal form fields, submits
  - Navigates to Tasks (Kanban board) via sidebar click
  - Drags a task card from "To Do" column to "In Progress" column
  - Drags another task card from "In Progress" to "Done" column
  - Toggles dark mode via header theme button
  - Pauses to show dark mode across the current page
  - Navigates back to Dashboard page in dark mode
  - Toggles back to light mode
  - Resizes browser to mobile viewport width, shows responsive sidebar collapse
  - Resizes back to desktop width
- [ ] Each action has a visible pause (500ms-2000ms depending on action importance) so a viewer can follow along
- [ ] Total demo runtime is approximately 2-3 minutes
- [ ] Script completes end-to-end without errors or timeouts
- [ ] Script uses stable selectors (`data-testid`, aria roles, text content) — no fragile CSS-only selectors
- [ ] Script uses shared helpers from `demo/helpers.ts`
- [ ] If any app feature does not work during demo scripting (e.g., drag-drop fails, modal doesn't open, theme toggle broken), the app code is fixed as part of this story

### Story 32: Highlights Voice-Over Script
As a presenter, I want a timestamped narration document so I can speak alongside the automated highlights demo and explain each feature to the audience.

**Acceptance Criteria:**
- [ ] File located at `demo/highlights-voiceover.md`
- [ ] Document opens with an introduction section: `## [0:00] Welcome` with narration text (e.g., "Welcome to the Project Management Dashboard...")
- [ ] Each subsequent section matches a demo action with approximate timestamp in format `## [M:SS] Section Title`
- [ ] Narration text under each section explains what's happening on screen and why it's impressive or useful
- [ ] Sections cover all actions from the highlights demo sequence (stat cards, charts, projects table, search/filter/sort, new project modal, Kanban drag-and-drop, dark mode toggle, responsive resize)
- [ ] Document ends with an outro section (e.g., "That concludes our highlights tour...")
- [ ] Total timestamps span approximately 2-3 minutes, matching the demo script runtime
- [ ] Narration text is written in natural speaking cadence — short sentences, pauses indicated, conversational tone
- [ ] Timing cues include notes for natural pauses (e.g., "[pause]" or "[let viewer absorb]") where the presenter should stay silent and let the demo speak for itself

### Story 33: Full Tour Demo Script
As a presenter, I want a comprehensive Playwright headful script that walks through every dashboard feature so I can give a complete product tour to stakeholders.

**Acceptance Criteria:**
- [ ] Script located at `demo/full-tour.spec.ts`
- [ ] Script runs headful via `npx playwright test demo/full-tour.spec.ts --headed --project=chromium`
- [ ] npm script `demo:full` wired up in `package.json` with command: `npx playwright test demo/full-tour.spec.ts --headed --project=chromium`
- [ ] Browser opens at 1280x800 desktop resolution
- [ ] Demo builds on same shared helpers as highlights script (`demo/helpers.ts`)
- [ ] Demo sequence covers everything in highlights PLUS:
  - **Dashboard deep-dive**: clicks stat cards (showing navigation), interacts with activity feed, hovers chart tooltips
  - **Projects extended**: pagination (navigate pages), edit an existing project (open edit modal, change fields, save), delete a project with confirmation modal
  - **Kanban extended**: adds a new task via "Add Task" button (fills form, submits), clicks a task card to open detail panel/SlideOver, edits task details in the panel
  - **Team page**: searches team members by name, filters by role dropdown, clicks "Invite Member" button (fills email, submits, shows toast notification)
  - **Settings page**: changes profile name field, toggles notification switches (email/push/slack), changes theme in appearance section, selects an accent color, clicks "Save Changes" button (shows success toast)
  - **Responsive showcase**: shows tablet breakpoint (sidebar collapses to icons-only), shows mobile breakpoint (hamburger menu appears), opens hamburger menu, navigates via mobile menu, resizes back to desktop
- [ ] Longer pauses (2000-3000ms) at transition points between major page sections
- [ ] Total demo runtime is approximately 5-7 minutes
- [ ] All features work end-to-end — any bugs found are fixed in app code
- [ ] Script completes without errors or timeouts
- [ ] Script uses stable selectors consistent with highlights script patterns
- [ ] Playwright test timeout is set to at least 600000ms (10 minutes) to accommodate intentional pauses

### Story 34: Full Tour Voice-Over Script
As a presenter, I want a comprehensive timestamped narration document so I can deliver a detailed product walkthrough alongside the full tour demo.

**Acceptance Criteria:**
- [ ] File located at `demo/full-tour-voiceover.md`
- [ ] Document opens with a detailed introduction section: `## [0:00] Welcome` that sets context for the full tour
- [ ] Each section uses format `## [M:SS] Section Title` with narration text underneath
- [ ] Covers every feature demonstrated in the full tour script with matching timestamps
- [ ] Includes page-transition narration (e.g., "Now let's move to the Projects page where we manage all our active projects...")
- [ ] Feature explanations are more detailed than highlights version — explains the user benefit, the interaction model, and any sophisticated UX touches
- [ ] Document ends with a comprehensive outro summarizing all features covered
- [ ] Total timestamps span approximately 5-7 minutes, matching the full tour demo runtime
- [ ] Narration includes "[pause]" cues for scenic moments and page transitions
- [ ] Sections are grouped by page/feature area with clear headers for easy navigation during a live presentation

### Story 35: Demo Playwright Configuration
As a demo developer, I want proper Playwright configuration for demo scripts so that demos run reliably with appropriate timeouts and settings distinct from the E2E test suite.

**Acceptance Criteria:**
- [ ] Demo scripts are discoverable by Playwright — either via a separate config file (`playwright.demo.config.ts`) or by configuring the existing `playwright.config.ts` to include the `demo/` directory when run with the demo npm scripts
- [ ] Test timeout is generous: at least 120000ms (2 minutes) for highlights, at least 600000ms (10 minutes) for full tour, to accommodate intentional pauses
- [ ] `headless: false` is either the default for demo runs or enforced via the `--headed` CLI flag in npm scripts
- [ ] Viewport defaults to 1280x800 for demo scripts
- [ ] Retry count is 0 for demo scripts — if a demo fails, it needs fixing, not retrying
- [ ] Reporter is minimal for demo runs (no HTML test report generation needed)
- [ ] `webServer` config starts the Vite dev server automatically (reuses existing config pattern: `npm run dev` on `http://localhost:5173`)
- [ ] Demo scripts do NOT interfere with existing E2E test suite — running `npm test` or `npm run test:e2e` still runs only the `tests/e2e/` specs
- [ ] npm scripts in `package.json` are correctly wired:
  - `"demo:highlights": "npx playwright test demo/highlights.spec.ts --headed --project=chromium"`
  - `"demo:full": "npx playwright test demo/full-tour.spec.ts --headed --project=chromium"`

### Story 36: App Bug Fixes for Demo Readiness
As a presenter, I want all dashboard features to work correctly during the demo so the automated walkthrough runs without errors or visual glitches.

**Acceptance Criteria:**
- [ ] Any feature that fails or behaves unexpectedly during demo script development is fixed in the app source code
- [ ] Drag-and-drop on the Kanban board works reliably when driven by Playwright (if the HTML5 DnD implementation has issues with programmatic interaction, fix the app's drag handling or add necessary event listeners)
- [ ] All modals (project CRUD, task form, invite member) open and close correctly when triggered programmatically
- [ ] Theme toggle produces visible changes on all pages when triggered in sequence
- [ ] Responsive layout transitions (desktop → tablet → mobile → desktop) render correctly when viewport is resized programmatically
- [ ] `data-testid` attributes are added to key interactive elements where existing selectors (roles, text, aria) are insufficient for stable demo targeting
- [ ] Toast notifications appear and are visible during demo pacing (not auto-dismissed before viewer can see them)
- [ ] Existing E2E tests in `tests/e2e/` still pass after any app code fixes
- [ ] `npm run build` still succeeds after any app code fixes
- [ ] No new console errors introduced by app fixes

### Success Metrics (This Iteration)
- `npm run demo:highlights` launches a visible browser and completes the highlights demo end-to-end without errors
- `npm run demo:full` launches a visible browser and completes the full tour demo end-to-end without errors
- Both demos run at a natural pace with deliberate pauses — a human viewer can follow every action
- Voice-over documents have clear timing cues that align with actual demo runtime
- All app features work correctly during both demos (no broken interactions)
- Existing E2E test suite (`npm run test:e2e`) still passes after any app code changes
- `npm run build` still succeeds
- Demo scripts use stable selectors that won't break on minor UI changes

### Dependencies (This Iteration)
- **Internal (existing features required):** All MVP features from Stories 1-29 must be implemented and functional — dashboard, projects, Kanban, team, settings, dark mode, responsive layout, modals, toasts, SlideOver
- **External:** Playwright (`@playwright/test` already installed), Chromium browser, Vite dev server (`npm run dev`)
- **Playwright config:** Existing `playwright.config.ts` with `testDir: './tests/e2e'` and `webServer` config pointing to `http://localhost:5173`
- **No new npm dependencies required** — demos use only Playwright APIs already available

### File Structure

```
demo/
├── helpers.ts                  # Shared utilities (pause, scroll, viewport, drag-and-drop helpers)
├── highlights.spec.ts          # Playwright highlights demo (~2-3 min)
├── highlights-voiceover.md     # Voice-over script for highlights demo
├── full-tour.spec.ts           # Playwright full tour demo (~5-7 min)
└── full-tour-voiceover.md      # Voice-over script for full tour demo
```

### Constraints
- Demo scripts are NOT tests — they should never assert/fail on visual details, only on "can I interact with this element"
- Use `page.waitForTimeout()` for demo pauses — this is one case where explicit waits are correct
- The dev server (`npm run dev`) must be running for demos to work (handled by Playwright `webServer` config)
- Build highlights demo first, get it working, then build full tour
- Do not modify the existing E2E test suite (`tests/e2e/`) unless fixing a genuine bug
- Do not add new app features — only fix broken existing features
- Do not change the visual design or layout
- Do not push to remote repository
