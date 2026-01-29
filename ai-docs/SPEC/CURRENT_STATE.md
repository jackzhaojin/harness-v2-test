CONSTITUTION (/Users/jackjin/dev/harness-v2-test/ai-docs/SPEC/CONSTITUTION.md)
# Project Constitution

## Mission
Deliver a polished, production-quality project management dashboard that demonstrates modern React best practices while providing an intuitive, responsive user experience for managing projects, tasks, and team collaboration.

## Immutable Principles
1. **Type safety is non-negotiable** - TypeScript strict mode, no `any` types, all data structures explicitly typed
2. **Mobile-first responsive design** - Every component must work flawlessly from 320px to 4K screens
3. **Zero runtime errors** - No console errors, no unhandled exceptions, graceful degradation for edge cases
4. **Accessibility by default** - Semantic HTML, keyboard navigation, focus states on all interactive elements
5. **Component isolation** - Each component is self-contained, testable, and reusable without prop drilling
6. **Performance matters** - No unnecessary re-renders, lazy loading where appropriate, smooth 60fps interactions

## Vibe / Style Guide
- **Tone**: Professional and polished, feels like a real SaaS product you'd pay for
- **Complexity**: Sophisticated UI, simple implementation - leverage Tailwind's utility classes over custom CSS
- **UX Priority**: Clarity and respo

WHY_WHAT (/Users/jackjin/dev/harness-v2-test/ai-docs/SPEC/WHY_WHAT.md)
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
- Unit testing (Playwright E2E 

HOW (/Users/jackjin/dev/harness-v2-test/ai-docs/SPEC/HOW.md)
# Architecture

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Browser (ES2020+) | Modern SPA, no server-side rendering needed |
| Framework | React 18 + TypeScript | Constitution mandates React 18 + TS, strict mode for type safety |
| Build Tool | Vite | Constitution constraint, fast HMR, optimized production builds |
| Styling | Tailwind CSS | Constitution constraint, utility-first enables rapid UI development |
| Routing | React Router v6 | Industry standard for React SPAs, declarative routing |
| State | React Context + useState/useReducer | Constitution prohibits external state management |
| Charts | Recharts | Constitution constraint for data visualization |
| Icons | Lucide React | Constitution constraint, consistent icon library |
| Storage | localStorage | Constitution constraint, no backend/API |
| Testing | Playwright | Constitution mandates E2E testing for critical flows |

## File Structure

```
project/
├── index.html                    # Vite entry point
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript strict configuration
├── tailwind.config.js        

Existing tasks (24):
1 - Project scaffolding with Vite, React, TypeScript, and Tailwind [complete]
2 - Type definitions and mock data setup [complete]
3 - Core context providers and custom hooks [complete]
4 - Reusable UI component library [complete]
5 - Modal and Toast notification systems [complete]
6 - App shell with sidebar and header navigation [complete]
7 - Dark/light theme toggle with full application theming [complete]
8 - Dashboard page with stats cards and activity feed [complete]
9 - Dashboard charts with Recharts integration [complete]
10 - Projects table with display, filtering, sorting, and pagination [complete]
11 - Project CRUD operations with modals [complete]
12 - Kanban board layout and task card display [complete]
13 - Kanban drag-and-drop with persistence [complete]
14 - Task CRUD with forms and detail panel [complete]
15 - Team members page with grid and filtering [complete]
16 - Team member invite modal [complete]
17 - Settings page with profile, notifications, and appearance sections [complete]
18 - SlideOver panel component [complete]
19 - Playwright E2E test suite [complete]
5.3 - Fix: Clicking backdrop does not close modal [complete]
5.1 - Fix Modal backdrop click not closing modal [complete]
5.2 - Fix Modal backdrop click not closing modal (still broken after 5.1) [complete]
6.1 - Fix tablet viewport sidebar to show icons-only by default [complete]
7.1 - Fix dark mode background color and add system theme selector [complete]

File tree (depth 2)
📄 .DS_Store
📄 .gitignore
📂 ai-docs
  📄 .DS_Store
  📂 SPEC
    📄 bootstrap_handoff.json
    📄 bootstrap.md
    📄 CONSTITUTION.md
    📄 CURRENT_STATE.md
    📄 HOW.md
    📄 PROGRESS_LOG.md
    📄 PROMPT.md
    📄 STATUS.json
    📄 TASKS.json
    📄 TASKS.md
    📄 WHY_WHAT.md
  📂 TASKS
    📂 1
    📂 10
    📂 11
    📂 12
    📂 13
    📂 14
    📂 15
    📂 16
    📂 17
    📂 18
    📂 19
    📂 2
    📂 3
    📂 4
    📂 5
    📂 5.1
    📂 5.2
    📂 5.3
    📂 6
    📂 6.1
    📂 7
    📂 7.1
    📂 8
    📂 9
📄 dashboard-full.png
📂 dist
  📂 assets
    📄 index-BLvXnYp4.js
    📄 index-kKKVT2mj.css
  📄 index.html
  📄 vite.svg
📄 harness-run.log
📄 index.html
📄 package-lock.json
📄 package.json
📂 playwright-report
  📄 index.html
📄 playwright.config.ts
📄 postcss.config.js
📂 public
  📄 vite.svg
📂 src
  📄 App.tsx
  📂 components
    📂 dashboard
    📂 layout
    📂 projects
    📂 settings
    📂 tasks
    📂 team
    📂 ui
  📂 context
    📄 DataContext.tsx
    📄 SidebarContext.tsx
    📄 ThemeContext.tsx
    📄 ToastContext.tsx
  📂 data
    📄 mockData.ts
  📂 hooks
    📄 useClickOutside.ts
    📄 useDebounce.ts
    📄 useFocusTrap.ts
    📄 useLocalStorage.ts
    📄 useMediaQuery.ts
    📄 useProjectTable.ts
    📄 useTeamFilter.ts
  📄 index.css
  📄 main.tsx
  📂 pages
    📄 ComponentShowcase.tsx
    📄 Dashboard.tsx
    📄 Projects.tsx
    📄 Settings.tsx
    📄 Tasks.tsx
    📄 Team.tsx
  📂 types
    📄 index.ts
📄 tailwind.config.js
📂 test-results
  📄 .last-run.json
📂 tests
  📂 adhoc
    📄 test-task-2-verify-data.ts
    📄 test-task-3.html
    📄 test-task-4.html
    📄 test-task-5.1.spec.ts
    📄 test-task-6.spec.ts
    📄 verify-contexts.tsx
  📂 e2e
    📄 .gitkeep
    📄 smoke.spec.ts
    📄 task-10-projects-table.spec.ts
    📄 task-11-project-crud.spec.ts
    📄 task-12-kanban.spec.ts
    📄 task-13-kanban-dnd.spec.ts
    📄 task-14-task-crud.spec.ts
    📄 task-15-team.spec.ts
    📄 task-16-invite-modal.spec.ts
    📄 task-17-settings.spec.ts
    📄 task-18-slideover.spec.ts
    📄 task-19-comprehensive-e2e.spec.ts
    📄 task-6-appshell.spec.ts
    📄 task-6.1-tablet-sidebar.spec.ts
    📄 task-7.1-validation.spec.ts

package.json (name: project-management-dashboard, scripts: dev, build, lint, preview, test, test:e2e)

package.json excerpt (/Users/jackjin/dev/harness-v2-test/package.json)
{
  "name": "project-management-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "playwright test",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "lucide-react": "^0.303.0",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.1",
    "@typ

CODE: index.html (/Users/jackjin/dev/harness-v2-test/index.html)
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Management Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>


CODE: package-lock.json (/Users/jackjin/dev/harness-v2-test/package-lock.json)
{
  "name": "project-management-dashboard",
  "version": "0.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "project-management-dashboard",
      "version": "0.0.0",
      "dependencies": {
        "lucide-react": "^0.303.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.21.0",
        "recharts": "^2.10.3"
      },
      "devDependencies": {
        "@playwright/test": "^1.40.1",
        "@types/react": "^18.2.43",
        "@types/react-dom": "^18.2.17",
        "@typescript-eslint/eslint-plugin": "^6.14.0",
        "@typescript-eslint/parser": "^6.14.0",
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.16",
        "eslint": "^8.55.0",
        "eslint-plugin-react-hooks": "^4.6

CODE: playwright.config.ts (/Users/jackjin/dev/harness-v2-test/playwright.config.ts)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});


CODE: dist/index.html (/Users/jackjin/dev/harness-v2-test/dist/index.html)
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Management Dashboard</title>
    <script type="module" crossorigin src="/assets/index-BLvXnYp4.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-kKKVT2mj.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>


CODE: App.tsx (/Users/jackjin/dev/harness-v2-test/src/App.tsx)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import { ToastContainer } from './components/ui/Toast';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Settings from './pages/Settings';
import ComponentShowcase from './pages/ComponentShowcase';

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ToastProvider>
          <DataProvider>
            <

CODE: index.css (/Users/jackjin/dev/harness-v2-test/src/index.css)
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Accent color custom properties — default blue */
:root {
  --accent-primary: 59 130 246;
  --accent-hover: 37 99 235;
  --accent-ring: 59 130 246;
}


CODE: main.tsx (/Users/jackjin/dev/harness-v2-test/src/main.tsx)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


CODE: context/DataContext.tsx (/Users/jackjin/dev/harness-v2-test/src/context/DataContext.tsx)
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Project, Task, TeamMember } from '../types';
import { projects as mockProjects, tasks as mockTasks, teamMembers as mockTeamMembers } from '../data/mockData';

interface DataState {
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
}

type DataAction =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { taskId: string; newStatus: 'todo' | 'in-progress' | 'done' } };

interface DataContextValue {
  state: DataState;
  dispatch: (act

CODE: data/mockData.ts (/Users/jackjin/dev/harness-v2-test/src/data/mockData.ts)
import type { Project, Task, TeamMember, Activity } from '../types';

// Team members (8 members with varied roles and online states)
export const teamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'manager',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isOnline: true,
  },
  {
    id: 'tm-2',
    name: 'Marcus Rodriguez',
    email: 'marcus.rodriguez@company.com',
    role: 'developer',
    avatar: 'https://i.pravatar.cc/150?img=2',
    isOnline: true,
  },
  {
    id: 'tm-3',
    name: 'Emily Watson',
    email: 'emily.watson@company.com',
    role: 'designer',
    avatar: 'https://i.pravatar.cc/150?img=3',
    isOnline: false,
  },
  {
    id: 'tm-4',
    name: 'James Kim',
    email: 'james.kim@company.com',
  