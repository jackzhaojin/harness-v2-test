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
