# Task 6: App shell with sidebar and header navigation

## Goal
Build the main application layout including the collapsible sidebar with navigation items, top header with search and user menu, and mobile responsive hamburger menu overlay. Implements Stories 1, 2, and 4.

## Acceptance Criteria
- [ ] AppShell component wraps all pages with sidebar and header
- [ ] Sidebar displays nav items: Dashboard, Projects, Tasks, Team, Settings with Lucide icons
- [ ] Each nav item links to corresponding route via React Router NavLink
- [ ] Active page highlighted with distinct background/text color
- [ ] Sidebar collapse toggle button shrinks to icons-only mode
- [ ] Collapsed/expanded state persists via SidebarContext to localStorage
- [ ] Sidebar uses semantic <nav> and <aside> elements
- [ ] Header fixed at top, spans content area width
- [ ] Header contains search input with search icon and placeholder text
- [ ] Header contains notifications bell icon with unread dot indicator
- [ ] Header contains user avatar that opens dropdown menu on click
- [ ] Dropdown contains Profile, Settings, Logout options
- [ ] Clicking outside dropdown closes it (useClickOutside)
- [ ] Below 768px: sidebar hidden, hamburger icon in header
- [ ] Mobile: hamburger opens full-screen overlay with backdrop
- [ ] Mobile overlay has close (X) button and closes on nav item click
- [ ] Tablet (768-1024px): sidebar shows icons only by default

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
