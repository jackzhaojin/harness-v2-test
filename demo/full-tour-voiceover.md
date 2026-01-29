# Full Tour Demo — Voice-Over Narration

> **Total runtime:** ~6:30 – 6:45
> **Script:** `demo/full-tour.spec.ts`
> **Run command:** `npm run demo:full`
> **Timing cues:** `[pause]` = let the demo speak for itself (no narration)

---

## [0:00] Welcome & Introduction

Welcome to the **full tour** of ProjectHub — a complete, production-quality project management dashboard built from the ground up with React 18, TypeScript, and Tailwind CSS. Over the next six and a half minutes, we'll explore **every feature** this application offers: from real-time data visualization and project management, to Kanban task boards with drag-and-drop, team collaboration tools, deep customization options, and a fully responsive layout that adapts from desktop to mobile. Let's dive in.

[pause]

---

## [0:15] Dashboard Deep-Dive — Stat Cards

Here's the dashboard — your command center. At the top, four stat cards display key metrics at a glance: **Total Projects**, **Active Tasks**, **Team Members**, and **Completed Tasks**. Each card features a hover animation with a subtle lift and shadow effect, providing tactile feedback that tells users these elements are interactive.

[pause]

Notice each card is clickable — tapping "Total Projects" navigates directly to the Projects page, creating a natural workflow from overview to detail. This reduces clicks and helps users find what they need without hunting through menus.

---

## [0:35] Dashboard Deep-Dive — Charts & Data Visualization

Scrolling down, we reach the data visualization section powered by **Recharts**. On the left is a task completion trend line chart that tracks team velocity over time. Watch as we hover across the data points — each tooltip reveals the exact value for that time period, letting managers spot trends and anomalies without exporting to a spreadsheet.

[pause]

On the right is a task status distribution chart — a donut visualization that gives an at-a-glance breakdown of to-do, in-progress, and completed work. These charts update dynamically as tasks move through the Kanban board.

---

## [0:50] Dashboard Deep-Dive — Activity Feed

Below the charts, the **activity feed** provides a chronological log of recent team actions — task completions, project updates, new assignments, and status changes. This gives stakeholders a quick "pulse check" on team activity without needing to open individual projects.

[pause]

Now we scroll back to the top and prepare to explore the Projects page in depth.

---

## [1:05] Projects Page — Search, Sort & Filter

Navigating to the **Projects** page via the sidebar, we land on a full-featured data table. Let's start with search — typing "Mobile" into the search bar instantly filters the table in real time, narrowing results with each keystroke. The search is case-insensitive and matches against project names.

[pause]

Clearing the search restores the full list. Now let's explore sorting — clicking the **Name** column header toggles between ascending and descending order. Sort indicators update visually with arrow icons so users always know the active sort direction. We can also sort by **Status**, **Progress**, or **Due Date** — every column is fully sortable.

[pause]

---

## [1:30] Projects Page — Pagination

The table displays **five projects per page** with full pagination controls. The page info text shows "Showing 1-5 of 10 projects" so users always know their position. Clicking **Next** advances to page 2, revealing the remaining projects. **Previous** takes us back. Page numbers are highlighted to show the current page, and boundary buttons are automatically disabled — Previous on the first page, Next on the last.

[pause]

---

## [1:50] Projects Page — Create New Project

Let's create a new project. Clicking **"New Project"** opens a modal dialog with form fields for name, status, team lead, and due date. We'll type "Analytics Dashboard v2" — notice the natural typing animation that makes the demo feel human. We select an **Active** status, set a due date, and submit.

[pause]

There's the **success toast notification** confirming the project was created, and it immediately appears in our table. The modal closes automatically after submission, returning focus to the main content.

---

## [2:15] Projects Page — Edit a Project

Now let's edit an existing project. Clicking the **kebab menu** (three dots) on any row reveals actions: Edit, Archive, and Delete. Selecting **Edit** opens the same modal form, pre-populated with the project's current data. We change the name to "Redesigned Platform" and save.

[pause]

The toast confirms the update, and the table reflects the change immediately — no page refresh needed. All state management happens in React Context, keeping the UI perfectly synchronized.

---

## [2:35] Projects Page — Delete with Confirmation

For destructive actions, safety matters. Clicking **Delete** from the kebab menu opens a **confirmation modal** that displays the project name and a clear warning that this action is permanent. Only after explicitly clicking the red "Delete" button does the project get removed.

[pause]

The success toast confirms deletion, and the row disappears from the table. This two-step confirmation pattern prevents accidental data loss — a critical UX consideration for any production application.

---

## [2:55] Kanban Board — Drag & Drop

Switching to the **Tasks** page reveals our Kanban board with three columns: **To Do**, **In Progress**, and **Done**. Each task card displays the title, priority badge, due date, and assignee avatar.

Now watch the **drag-and-drop** in action — we're picking up a task from To Do and dropping it into In Progress. The card smoothly transitions to its new column, and the column count updates in real time.

[pause]

And again — moving a task from In Progress to Done. The drag interaction uses HTML5 native drag events with a custom mouse-based approach that works reliably across browsers. Column headers reflect the updated task counts instantly.

[pause]

---

## [3:20] Kanban Board — Add a New Task

Let's add a new task. Each column has an **"Add Task"** button at the bottom. Clicking it in the To Do column opens an inline form with fields for title, priority, assignee, and due date. We type "Write integration tests," set priority to **High**, add a due date, and submit.

[pause]

The toast confirms creation, and the new task card appears at the bottom of the To Do column. The form collapses automatically, keeping the interface clean.

---

## [3:40] Kanban Board — Task Detail Panel (SlideOver)

Clicking any task card opens the **SlideOver detail panel** — a slide-in panel from the right side that overlays the main content with a semi-transparent backdrop. This panel displays the full task details: title, status, priority, due date, assignee, and description.

[pause]

The panel is built as a **React Portal** rendered outside the app's DOM tree, with focus trapping for accessibility and multiple close mechanisms — the X button, clicking the backdrop, or pressing Escape.

---

## [3:55] Kanban Board — Edit Task in Panel

From the detail panel, we click **Edit** to switch to edit mode. All fields become editable — we change the title to "Updated task title" and save. The panel switches back to view mode with the updated data, and a toast confirms the change.

[pause]

Now we close the panel and return to the full Kanban board view.

---

## [4:15] Team Page — Search & Filter

Navigating to the **Team** page displays all eight team members in a responsive grid layout. Each card shows the member's avatar, name, role badge, email (as a mailto link), and online/offline status with a colored indicator dot.

Let's search for a specific member — typing "Sarah" filters the grid to show only matching results. The result count updates to "Showing 1 of 8 members." Clearing the search restores all members.

[pause]

The **role dropdown** provides another filter dimension. Selecting "Developer" narrows the grid to show only developers. These filters can be combined — search within a specific role for powerful, instant team discovery.

[pause]

---

## [4:40] Team Page — Invite a Member

Clicking **"Invite Member"** opens a modal with an email input field. The submit button is intelligently disabled until a valid email format is entered — this prevents sending invitations to malformed addresses. We type "new.member@company.com" and submit.

[pause]

The **success toast** confirms the invitation was sent, and the modal closes automatically. In a production environment, this would trigger a backend email notification to the invitee.

---

## [5:00] Settings Page — Profile

The **Settings** page is organized into three clear sections: Profile, Notifications, and Appearance. Starting with Profile — we see the user's avatar, an editable name field, and a read-only email. Let's change the name to "Alex Johnson," typing at a natural pace.

[pause]

---

## [5:15] Settings Page — Notifications

Scrolling to the **Notifications** section, we find toggle switches for Email, Push, and Slack notifications. Each toggle has a smooth animation and clear on/off state. Let's turn **Slack** on, briefly toggle **Email** off and back on, and flip **Push** — demonstrating the responsive toggle behavior.

[pause]

---

## [5:30] Settings Page — Appearance & Theme

The **Appearance** section offers theme selection with three options: Light, Dark, and System (which follows OS preference). Clicking **Dark** instantly transforms the entire interface to a beautiful dark color scheme — every component, card, chart, and form element adapts perfectly.

[pause]

Switching back to **Light** is just as seamless. Below the theme selector, **accent color swatches** let users personalize the dashboard's primary color — purple, green, orange, pink, or the default blue. Watch as we click through each option — the accent color updates throughout the interface in real time.

[pause]

---

## [5:50] Settings Page — Save Changes

Finally, clicking **"Save Changes"** triggers a loading state on the button (showing a spinner for realism), then displays a **success toast** confirming all settings have been persisted to localStorage. These preferences survive page refreshes and browser restarts.

[pause]

---

## [6:05] Responsive Showcase — Tablet

Now let's demonstrate the responsive design. We're resizing the browser from 1280px desktop down to **900px tablet** width. Watch the sidebar — it automatically collapses to an **icons-only** mode, preserving navigation while maximizing content space. The main content area expands to fill the available width, and grid layouts reflow appropriately.

[pause]

---

## [6:15] Responsive Showcase — Mobile

Shrinking further to **375px mobile** width, the sidebar disappears entirely and a **hamburger menu icon** appears in the header. Tapping it opens a full-screen navigation overlay with all five menu items. Selecting "Projects" navigates to the page and automatically closes the overlay.

[pause]

We open the menu again and navigate to Tasks — the Kanban board adapts to the narrow viewport with stacked columns. Every page in the application is fully functional at mobile width.

[pause]

---

## [6:30] Responsive Showcase — Back to Desktop

Resizing back to **1280px desktop**, the full sidebar returns with text labels, and the multi-column layout restores. We navigate back to the Dashboard for our closing shot.

[pause]

---

## [6:35] Outro

That's the **complete tour** of ProjectHub. Let's recap everything we've seen:

- **Dashboard** with interactive stat cards, Recharts data visualization with hover tooltips, and a real-time activity feed
- **Projects** with full-text search, multi-column sorting, pagination, and complete CRUD operations — create, edit, and delete with confirmation modals and toast notifications
- **Kanban** task board with fluid drag-and-drop between columns, inline task creation, and a SlideOver detail panel with edit capabilities
- **Team** management with search, role-based filtering, and member invitation via email validation
- **Settings** with profile editing, notification toggles, theme switching (light/dark/system), and accent color personalization — all persisted to localStorage
- **Responsive design** that adapts seamlessly from desktop to tablet (icons-only sidebar) to mobile (hamburger menu overlay)

All built with **React 18**, **TypeScript** with strict mode, **Tailwind CSS**, and **Recharts** — zero external state management libraries, no backend required. Every interaction is tested with a comprehensive **Playwright** E2E test suite.

Thank you for watching the full tour.
