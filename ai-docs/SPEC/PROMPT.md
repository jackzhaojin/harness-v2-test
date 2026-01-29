# Project Management Dashboard

> Build a modern project management dashboard with React + Vite + Tailwind CSS

---

## Run Configuration

```yaml
target_dir: /Users/jackjin/dev/harness-v2-test
branch: feature/dashboard-mvp
baseline_branch: main
project_type: web
playwright_testing: true
```

---

## Goal

Build a fully functional project management dashboard with multiple pages, interactive components, and a professional UI. The dashboard should feel like a real SaaS product.

**What success looks like**:
- Clean, modern UI with dark/light mode toggle
- Responsive layout (mobile-first)
- Smooth navigation between pages
- Interactive data tables and charts
- No console errors
- All Playwright tests pass

---

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v6
- **State**: React Context (no external state library needed)

---

## Feature Requirements

### Feature 1: App Shell & Navigation

**Description**: Persistent layout with collapsible sidebar and top header

**Acceptance Criteria**:
- [ ] Collapsible sidebar with icons and labels
- [ ] Sidebar shows: Dashboard, Projects, Tasks, Team, Settings
- [ ] Active page highlighted in sidebar
- [ ] Top header with: search input, notifications bell, user avatar dropdown
- [ ] Dark/light mode toggle in header (persists to localStorage)
- [ ] Mobile: sidebar becomes hamburger menu overlay

### Feature 2: Dashboard Overview Page

**Description**: Main dashboard with stats cards, charts, and recent activity

**Acceptance Criteria**:
- [ ] 4 stat cards: Total Projects, Active Tasks, Team Members, Completed This Week
- [ ] Line chart showing task completion over past 7 days
- [ ] Pie/donut chart showing tasks by status (To Do, In Progress, Done)
- [ ] Recent activity feed (last 5 items with timestamps)
- [ ] Cards have hover effects and are clickable (navigate to relevant page)

### Feature 3: Projects List Page

**Description**: Filterable/sortable table of projects

**Acceptance Criteria**:
- [ ] Table columns: Name, Status, Progress %, Team Lead, Due Date, Actions
- [ ] Status badges with colors (Active=green, On Hold=yellow, Completed=blue)
- [ ] Progress bar visualization in the Progress column
- [ ] Search/filter by project name
- [ ] Sort by any column (click header)
- [ ] Pagination (5 items per page)
- [ ] "New Project" button (opens modal with form)
- [ ] Action menu: Edit, Archive, Delete (confirmation modal for delete)

### Feature 4: Kanban Task Board

**Description**: Drag-and-drop task board with 3 columns

**Acceptance Criteria**:
- [ ] 3 columns: To Do, In Progress, Done
- [ ] Task cards show: title, assignee avatar, priority badge, due date
- [ ] Priority badges: Low (gray), Medium (yellow), High (red)
- [ ] Drag and drop tasks between columns (HTML5 drag API is fine, no library needed)
- [ ] "Add Task" button at bottom of each column
- [ ] Click task card to see details in a slide-over panel
- [ ] Task count shown in column header

### Feature 5: Team Members Page

**Description**: Grid of team member cards

**Acceptance Criteria**:
- [ ] Card grid layout (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- [ ] Each card: avatar, name, role, email, status indicator (online/offline)
- [ ] Search by name
- [ ] Filter by role (dropdown: All, Developer, Designer, Manager)
- [ ] "Invite Member" button (shows toast notification "Invite sent!")

### Feature 6: Settings Page

**Description**: User settings with form inputs

**Acceptance Criteria**:
- [ ] Sections: Profile, Notifications, Appearance
- [ ] Profile: name input, email input (disabled), avatar upload placeholder
- [ ] Notifications: toggle switches for email/push/slack notifications
- [ ] Appearance: theme selector (light/dark/system), accent color picker (5 preset colors)
- [ ] "Save Changes" button (shows success toast)
- [ ] Form state persists to localStorage

---

## Mock Data

Use static mock data (no API calls). Create a `src/data/mockData.ts` file with:

```typescript
// Projects
export const projects = [
  { id: 1, name: "Website Redesign", status: "active", progress: 65, lead: "Alice", dueDate: "2026-02-15" },
  { id: 2, name: "Mobile App v2", status: "active", progress: 30, lead: "Bob", dueDate: "2026-03-01" },
  // ... 8 more projects
];

// Tasks
export const tasks = [
  { id: 1, title: "Design homepage", status: "done", priority: "high", assignee: "Alice", dueDate: "2026-01-25" },
  { id: 2, title: "Implement auth", status: "in-progress", priority: "high", assignee: "Bob", dueDate: "2026-01-28" },
  // ... 15 more tasks
];

// Team members
export const team = [
  { id: 1, name: "Alice Johnson", role: "Designer", email: "alice@example.com", online: true },
  { id: 2, name: "Bob Smith", role: "Developer", email: "bob@example.com", online: true },
  // ... 6 more team members
];

// Activity feed
export const activities = [
  { id: 1, user: "Alice", action: "completed", target: "Homepage design", time: "2 hours ago" },
  // ... 10 more activities
];
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AppShell.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   └── Toast.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── Charts.tsx
│   ├── projects/
│   │   ├── ProjectTable.tsx
│   │   └── ProjectModal.tsx
│   ├── tasks/
│   │   ├── KanbanBoard.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskPanel.tsx
│   └── team/
│       └── MemberCard.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── Tasks.tsx
│   ├── Team.tsx
│   └── Settings.tsx
├── context/
│   └── ThemeContext.tsx
├── data/
│   └── mockData.ts
├── hooks/
│   └── useLocalStorage.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Responsive Breakpoints

- **Mobile**: < 768px (sidebar hidden, hamburger menu)
- **Tablet**: 768px - 1024px (sidebar collapsed to icons)
- **Desktop**: > 1024px (sidebar expanded)

---

## Definition of Done

**Environment**:
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts on localhost:5173
- [ ] `npm run build` succeeds
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)

**Features**:
- [ ] All 6 features implemented per acceptance criteria
- [ ] Responsive at all breakpoints
- [ ] Dark mode toggle works and persists
- [ ] No console errors or warnings

**Testing** (Playwright):
- [ ] Navigate to each page via sidebar
- [ ] Toggle dark mode
- [ ] Search/filter projects table
- [ ] Drag a task between Kanban columns
- [ ] Open and close modals
- [ ] Mobile viewport navigation works

---

## Design Guidelines

**Colors** (Tailwind):
- Primary: `blue-600` / `blue-500` (dark mode)
- Background: `gray-50` / `gray-900` (dark mode)
- Cards: `white` / `gray-800` (dark mode)
- Text: `gray-900` / `gray-100` (dark mode)

**Spacing**:
- Use Tailwind's spacing scale consistently
- Cards: `p-6`, gaps: `gap-4` or `gap-6`
- Page padding: `p-6` or `p-8`

**Typography**:
- Headings: `font-semibold`
- Body: `font-normal`
- Use `text-sm` for secondary info

---

## Notes

- Use semantic HTML (nav, main, aside, section, etc.)
- All interactive elements should have focus states
- Prefer composition over prop drilling (use context sparingly)
- Keep components small and focused
