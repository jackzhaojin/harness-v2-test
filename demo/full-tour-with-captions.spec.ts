/**
 * Full Tour Demo with Captions
 *
 * Same comprehensive walkthrough as full-tour.spec.ts but with an on-screen
 * caption overlay that narrates each section in real time. Designed for screen
 * recordings where no separate voice-over is needed.
 *
 * Run: npx playwright test demo/full-tour-with-captions.spec.ts --headed
 *
 * @tags @full-tour-captioned
 */
import { test, type Page } from '@playwright/test';
import {
  pause,
  scenicPause,
  quickPause,
  smoothScroll,
  setViewport,
  dragAndDrop,
} from './helpers';

// ---------------------------------------------------------------------------
// Caption overlay system
// ---------------------------------------------------------------------------

const CAPTION_CSS = [
  'position:fixed',
  'bottom:0',
  'left:0',
  'right:0',
  'z-index:99999',
  'padding:20px 40px 28px',
  'background:linear-gradient(transparent 0%,rgba(0,0,0,0.15) 15%,rgba(0,0,0,0.82) 100%)',
  'color:#fff',
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  'font-size:20px',
  'font-weight:500',
  'line-height:1.4',
  'text-align:center',
  'letter-spacing:0.01em',
  'text-shadow:0 1px 3px rgba(0,0,0,0.5)',
  'pointer-events:none',
  'opacity:0',
  'transition:opacity 0.3s ease',
].join(';');

/** Show caption text. Persists until next show or hide. Re-injects overlay if lost after navigation. */
async function showCaption(page: Page, text: string): Promise<void> {
  await page.evaluate(([t, css]: string[]) => {
    let el = document.getElementById('demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-caption';
      el.style.cssText = css;
      document.body.appendChild(el);
    }
    el.textContent = t;
    el.style.opacity = '1';
  }, [text, CAPTION_CSS]);
  await page.waitForTimeout(300);
}

/** Fade out current caption. */
async function hideCaption(page: Page): Promise<void> {
  await page.evaluate(() => {
    const el = document.getElementById('demo-caption');
    if (el) el.style.opacity = '0';
  });
  await page.waitForTimeout(300);
}

/** Show caption, hold for duration, then fade out. */
async function caption(page: Page, text: string, ms = 3000): Promise<void> {
  await showCaption(page, text);
  await page.waitForTimeout(ms);
  await hideCaption(page);
}

// ---------------------------------------------------------------------------
// Natural-typing helper — types text character by character
// ---------------------------------------------------------------------------
async function naturalType(page: Page, selector: string, text: string): Promise<void> {
  const el = page.locator(selector);
  await el.click();
  for (const char of text) {
    await el.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
}

// ---------------------------------------------------------------------------
// Scroll helpers
// ---------------------------------------------------------------------------
async function scrollMainToTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(600);
}

async function scrollMainToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
}

// ---------------------------------------------------------------------------
// FULL TOUR DEMO WITH CAPTIONS
// ---------------------------------------------------------------------------

test('@full-tour-captioned Project Management Dashboard — Full Tour with Captions', async ({ page }) => {
  // =========================================================================
  // SETUP: Desktop viewport at 1280×800, clear localStorage for clean state
  // =========================================================================
  await setViewport(page, 1280, 800);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');

  // =========================================================================
  // SECTION 1: Dashboard Deep-Dive
  // =========================================================================

  await caption(page, 'Welcome to ProjectHub — a complete project management dashboard.', 4000);

  // --- 1a. Stat cards ---
  await showCaption(page, 'Interactive stat cards show key metrics at a glance.');
  const statCards = [
    '[data-testid="stat-total-projects"]',
    '[data-testid="stat-active-tasks"]',
    '[data-testid="stat-team-members"]',
    '[data-testid="stat-completed-tasks"]',
  ];
  for (const card of statCards) {
    await page.hover(card);
    await quickPause(page, 600);
  }
  await pause(page, 1000);

  // Click stat card to show navigation
  await showCaption(page, 'Each card links directly to its detail page.');
  const firstStatCard = page.locator(statCards[0]);
  const firstStatLink = firstStatCard.locator('a').first();
  if (await firstStatLink.isVisible().catch(() => false)) {
    await firstStatLink.click();
    await scenicPause(page, 1500);
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForLoadState('networkidle');
    await pause(page, 800);
  }
  await hideCaption(page);

  // --- 1b. Charts with tooltip hover ---
  await showCaption(page, 'Data visualization powered by Recharts — hover for exact values.');
  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 2000);

  const chartsSection = page.locator('[data-testid="dashboard-charts"]');
  const chartsBBox = await chartsSection.boundingBox();
  if (chartsBBox) {
    for (let i = 0; i < 6; i++) {
      const x = chartsBBox.x + chartsBBox.width * 0.08 + (chartsBBox.width * 0.38 * i) / 5;
      const y = chartsBBox.y + chartsBBox.height * 0.4;
      await page.mouse.move(x, y);
      await pause(page, 500);
    }
  }
  await scenicPause(page, 2000);
  await hideCaption(page);

  // --- 1c. Activity feed ---
  await showCaption(page, 'The activity feed logs recent team actions in real time.');
  await scrollMainToBottom(page);
  await scenicPause(page, 3000);
  await hideCaption(page);

  await scrollMainToTop(page);

  // =========================================================================
  // TRANSITION → Projects
  // =========================================================================
  await caption(page, 'Next up — the Projects page.', 2500);

  // =========================================================================
  // SECTION 2: Projects — CRUD + Pagination
  // =========================================================================

  // --- 2a. Navigate to Projects ---
  await page.click('[data-testid="nav-projects"]');
  await page.waitForLoadState('networkidle');

  await showCaption(page, 'A full data table with search, sorting, and pagination.');
  await scenicPause(page, 2500);
  await hideCaption(page);

  // --- 2b. Search ---
  await showCaption(page, 'Real-time search filters as you type.');
  await naturalType(page, 'input[aria-label="Search projects"]', 'Mobile');
  await scenicPause(page, 1500);

  const searchInput = page.locator('input[aria-label="Search projects"]');
  await searchInput.clear();
  await page.waitForTimeout(400);
  await hideCaption(page);
  await pause(page, 600);

  // --- 2b. Sort ---
  await showCaption(page, 'Every column header is sortable.');
  await page.click('th:has-text("Name")');
  await pause(page, 800);
  await page.click('th:has-text("Name")');
  await pause(page, 800);
  await page.click('th:has-text("Status")');
  await scenicPause(page, 1000);
  await page.click('th:has-text("Name")');
  await hideCaption(page);
  await pause(page, 500);

  // --- 2c. Pagination ---
  await showCaption(page, 'Pagination keeps large datasets manageable.');
  await page.getByText('Next').click();
  await scenicPause(page, 1200);
  await page.getByText('Previous').click();
  await scenicPause(page, 1000);
  await hideCaption(page);

  // --- 2d. Create new project ---
  await showCaption(page, 'Creating a new project with a modal form.');
  await page.getByRole('button', { name: /new project/i }).click();
  await pause(page, 800);

  const projNameInput = page.locator('input[placeholder="Enter project name"]');
  await projNameInput.click();
  await pause(page, 300);
  for (const char of 'Analytics Dashboard v2') {
    await projNameInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 500);

  const statusSelect = page.getByRole('dialog').locator('select#status');
  await statusSelect.selectOption('Active');
  await pause(page, 400);

  const dateInput = page.locator('input[type="date"]');
  await dateInput.fill('2025-06-30');
  await pause(page, 600);

  await page.click('button[type="submit"]:has-text("Create Project")');
  await showCaption(page, 'Success — the new project appears in the table instantly.');
  await scenicPause(page, 2500);
  await hideCaption(page);

  // --- 2e. Edit an existing project ---
  await showCaption(page, 'The kebab menu reveals Edit, Archive, and Delete.');
  const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
  await firstKebab.click();
  await pause(page, 600);

  await page.locator('[role="listbox"]').getByText('Edit').click();
  await pause(page, 800);

  const editNameInput = page.getByRole('dialog').locator('input[placeholder="Enter project name"]');
  await editNameInput.clear();
  await pause(page, 300);
  for (const char of 'Redesigned Platform') {
    await editNameInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 400);

  await page.getByRole('dialog').getByRole('button', { name: /save changes/i }).click();
  await showCaption(page, 'Changes save instantly — no page refresh needed.');
  await scenicPause(page, 2000);
  await hideCaption(page);

  // --- 2f. Delete with confirmation ---
  await showCaption(page, 'Destructive actions require two-step confirmation.');
  const deleteKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
  await deleteKebab.click();
  await pause(page, 600);
  await page.locator('[role="listbox"]').getByText('Delete').click();
  await pause(page, 800);
  await scenicPause(page, 1200);

  const confirmDialog = page.getByRole('dialog');
  await confirmDialog.getByRole('button', { name: /^delete$/i }).click();
  await scenicPause(page, 2000);
  await hideCaption(page);

  // =========================================================================
  // TRANSITION → Kanban
  // =========================================================================
  await caption(page, 'Next — the Kanban task board.', 2500);

  // =========================================================================
  // SECTION 3: Kanban — DnD + Task CRUD + SlideOver
  // =========================================================================

  // --- 3a. Navigate to Tasks ---
  await page.click('[data-testid="nav-tasks"]');
  await page.waitForLoadState('networkidle');

  await showCaption(page, 'Three columns — To Do, In Progress, and Done.');
  await scenicPause(page, 2500);
  await hideCaption(page);

  // --- 3b. Drag To Do → In Progress ---
  const todoCards = page.locator('[data-testid="kanban-column-todo"] article[draggable="true"]');
  const todoCount = await todoCards.count();

  if (todoCount > 0) {
    await showCaption(page, 'Dragging a task from To Do to In Progress.');
    await dragAndDrop(
      page,
      '[data-testid="kanban-column-todo"] article[draggable="true"]:first-of-type',
      '[data-testid="kanban-column-in-progress"]',
      { steps: 15, holdMs: 150 },
    );
    await scenicPause(page, 1800);
  }

  // Drag In Progress → Done
  const ipCards = page.locator('[data-testid="kanban-column-in-progress"] article[draggable="true"]');
  const ipCount = await ipCards.count();

  if (ipCount > 0) {
    await showCaption(page, 'And from In Progress to Done.');
    await dragAndDrop(
      page,
      '[data-testid="kanban-column-in-progress"] article[draggable="true"]:first-of-type',
      '[data-testid="kanban-column-done"]',
      { steps: 15, holdMs: 150 },
    );
    await scenicPause(page, 1800);
  }
  await hideCaption(page);

  // --- 3c. Add a new task ---
  await showCaption(page, 'Adding a new task with the inline form.');
  await page.getByTestId('add-task-todo').click();
  await pause(page, 600);

  const taskForm = page.getByTestId('task-form');
  const taskTitleInput = taskForm.locator('input[placeholder="Enter task title"]');
  await taskTitleInput.click();
  await pause(page, 300);
  for (const char of 'Write integration tests') {
    await taskTitleInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 400);

  const prioritySelect = taskForm.locator('select#priority');
  await prioritySelect.selectOption('high');
  await pause(page, 400);

  const taskDateInput = taskForm.locator('input[type="date"]');
  await taskDateInput.fill('2025-07-15');
  await pause(page, 400);

  await taskForm.getByRole('button', { name: /add task/i }).click();
  await scenicPause(page, 2000);
  await hideCaption(page);

  // --- 3d. Click task card → SlideOver ---
  await showCaption(page, 'Clicking a card opens the detail panel.');
  const taskCard = page.locator('[data-testid="kanban-column-todo"] article').first();
  await taskCard.click();
  await pause(page, 800);

  const detailPanel = page.getByRole('dialog');
  await scenicPause(page, 3000);
  await hideCaption(page);

  // --- 3e. Edit task in panel ---
  await showCaption(page, 'Editing the task directly from the panel.');
  await detailPanel.getByRole('button', { name: /edit/i }).click();
  await pause(page, 600);

  const editForm = detailPanel.getByTestId('task-edit-form');
  const titleEditInput = editForm.locator('input#title');
  await titleEditInput.clear();
  await pause(page, 200);
  for (const char of 'Updated task title') {
    await titleEditInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 400);

  await detailPanel.getByRole('button', { name: /save changes/i }).click();
  await scenicPause(page, 1800);
  await hideCaption(page);

  // --- 3f. Close panel ---
  await detailPanel.getByRole('button', { name: /close panel/i }).click();
  await page.waitForTimeout(400);
  await pause(page, 800);

  // =========================================================================
  // TRANSITION → Team
  // =========================================================================
  await caption(page, 'Next — the Team page.', 2500);

  // =========================================================================
  // SECTION 4: Team Page — Search / Filter / Invite
  // =========================================================================

  // --- 4a. Navigate to Team ---
  await page.click('[data-testid="nav-team"]');
  await page.waitForLoadState('networkidle');

  await showCaption(page, 'All team members in a responsive grid layout.');
  await scenicPause(page, 2500);
  await hideCaption(page);

  // --- 4b. Search members ---
  await showCaption(page, 'Search and role filters narrow results instantly.');
  const teamSearchInput = page.getByPlaceholder('Search members...');
  await teamSearchInput.click();
  await pause(page, 300);
  for (const char of 'Sarah') {
    await teamSearchInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await page.waitForTimeout(400);
  await scenicPause(page, 1500);

  await teamSearchInput.clear();
  await page.waitForTimeout(400);
  await pause(page, 600);

  // --- 4c. Filter by role ---
  const roleSelect = page.locator('select').first();
  await roleSelect.selectOption('developer');
  await scenicPause(page, 1500);

  await roleSelect.selectOption('');
  await page.waitForTimeout(400);
  await hideCaption(page);
  await pause(page, 600);

  // --- 4d. Invite Member ---
  await showCaption(page, 'Inviting a member — with email validation.');
  await page.getByTestId('invite-member-btn').click();
  await pause(page, 800);

  const inviteEmailInput = page.getByTestId('invite-email-input');
  await inviteEmailInput.click();
  await pause(page, 300);
  for (const char of 'new.member@company.com') {
    await inviteEmailInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(50 + Math.random() * 60);
  }
  await pause(page, 500);

  await page.getByTestId('invite-submit-btn').click();
  await scenicPause(page, 2000);
  await hideCaption(page);

  // =========================================================================
  // TRANSITION → Settings
  // =========================================================================
  await caption(page, 'Next — Settings.', 2000);

  // =========================================================================
  // SECTION 5: Settings Page — All Sections
  // =========================================================================

  // --- 5a. Navigate to Settings ---
  await page.click('[data-testid="nav-settings"]');
  await page.waitForLoadState('networkidle');

  await showCaption(page, 'Profile, Notifications, and Appearance — all in one place.');
  await scenicPause(page, 2500);
  await hideCaption(page);

  // --- 5b. Profile ---
  await showCaption(page, 'Updating the display name.');
  const profileNameInput = page.getByTestId('profile-name-input');
  await profileNameInput.clear();
  await pause(page, 300);
  for (const char of 'Alex Johnson') {
    await profileNameInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 600);
  await hideCaption(page);

  // --- 5c. Notifications ---
  await showCaption(page, 'Toggle switches for each notification channel.');
  await smoothScroll(page, '[data-testid="notifications-section"]');
  await pause(page, 600);

  const slackToggle = page.getByTestId('notification-toggle-slack').getByRole('switch');
  await slackToggle.click();
  await quickPause(page, 500);

  const emailToggle = page.getByTestId('notification-toggle-email').getByRole('switch');
  await emailToggle.click();
  await quickPause(page, 500);
  await emailToggle.click();
  await quickPause(page, 500);

  const pushToggle = page.getByTestId('notification-toggle-push').getByRole('switch');
  await pushToggle.click();
  await quickPause(page, 500);
  await pushToggle.click();
  await pause(page, 600);
  await hideCaption(page);

  // --- 5d. Appearance — theme ---
  await smoothScroll(page, '[data-testid="appearance-section"]');
  await pause(page, 600);

  await showCaption(page, 'Dark mode transforms the entire interface.');
  await page.getByTestId('theme-option-dark').click();
  await scenicPause(page, 2000);

  await page.getByTestId('theme-option-light').click();
  await scenicPause(page, 1000);
  await hideCaption(page);

  // --- 5e. Accent colors ---
  await showCaption(page, 'Accent colors personalize the dashboard.');
  const accentColors = ['purple', 'green', 'orange', 'pink', 'blue'];
  for (const color of accentColors) {
    await page.getByTestId(`accent-color-${color}`).click();
    await quickPause(page, 500);
  }
  await pause(page, 600);
  await hideCaption(page);

  // --- 5f. Save ---
  await showCaption(page, 'All preferences persist to localStorage.');
  await page.getByTestId('save-settings-btn').click();
  await scenicPause(page, 2500);
  await hideCaption(page);

  // =========================================================================
  // TRANSITION → Responsive
  // =========================================================================
  await caption(page, 'Now let\'s see the responsive design in action.', 3000);

  // =========================================================================
  // SECTION 6: Responsive Showcase — Full Mobile Experience
  // =========================================================================

  // Navigate to dashboard for the showcase
  await page.click('[data-testid="nav-dashboard"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1500);

  // --- 6a. Tablet breakpoint ---
  await showCaption(page, 'Tablet width — the sidebar collapses to icons.');
  await setViewport(page, 900, 800);
  await scenicPause(page, 2500);

  // Hover sidebar icons
  const sidebar = page.locator('aside');
  const sidebarVisible = await sidebar.isVisible().catch(() => false);
  if (sidebarVisible) {
    const navItems = ['nav-dashboard', 'nav-projects', 'nav-tasks', 'nav-team', 'nav-settings'];
    for (const item of navItems) {
      const navEl = page.getByTestId(item);
      if (await navEl.isVisible().catch(() => false)) {
        await navEl.hover();
        await quickPause(page, 500);
      }
    }
    await pause(page, 800);
  }

  await showCaption(page, 'Tables and Kanban adapt at tablet width.');
  await page.click('[data-testid="nav-projects"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 2000);

  await page.click('[data-testid="nav-tasks"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 2000);
  await hideCaption(page);

  // --- 6b. Transition to mobile ---
  await showCaption(page, 'Stepping down through breakpoints to mobile.');
  await setViewport(page, 768, 800);
  await scenicPause(page, 1500);
  await setViewport(page, 600, 800);
  await scenicPause(page, 1500);
  await setViewport(page, 375, 800);
  await showCaption(page, 'Mobile layout — hamburger menu replaces the sidebar.');
  await scenicPause(page, 3000);

  // --- 6c. Mobile full page tour ---

  // Helper to navigate via hamburger in mobile view
  async function mobileNavigateTo(pageName: string) {
    const hamburgerBtn = page.getByLabel('Open navigation menu');
    if (await hamburgerBtn.isVisible().catch(() => false)) {
      await hamburgerBtn.click();
      await pause(page, 800);
      const mobileNav = page.locator('[role="dialog"]');
      await mobileNav.getByText(pageName).click();
      await page.waitForLoadState('networkidle');
    }
  }

  // Mobile: Dashboard
  await mobileNavigateTo('Dashboard');
  await showCaption(page, 'Dashboard — stats and charts adapt to mobile.');
  await scenicPause(page, 3000);
  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 2500);
  await scrollMainToBottom(page);
  await scenicPause(page, 2500);
  await scrollMainToTop(page);
  await pause(page, 1000);

  // Mobile: Projects
  await mobileNavigateTo('Projects');
  await showCaption(page, 'The data table scrolls horizontally on mobile.');
  await scenicPause(page, 3000);
  await page.evaluate(() => {
    const table = document.querySelector('table');
    const wrapper = table?.closest('[class*="overflow"]') || table?.parentElement;
    if (wrapper) wrapper.scrollTo({ left: 300, behavior: 'smooth' });
  });
  await scenicPause(page, 2000);
  await page.evaluate(() => {
    const table = document.querySelector('table');
    const wrapper = table?.closest('[class*="overflow"]') || table?.parentElement;
    if (wrapper) wrapper.scrollTo({ left: 0, behavior: 'smooth' });
  });
  await pause(page, 1000);

  // Mobile: Tasks
  await mobileNavigateTo('Tasks');
  await showCaption(page, 'Kanban columns stack vertically on small screens.');
  await scenicPause(page, 3000);
  await smoothScroll(page, '[data-testid="kanban-column-in-progress"]');
  await scenicPause(page, 2500);
  await smoothScroll(page, '[data-testid="kanban-column-done"]');
  await scenicPause(page, 2500);
  await scrollMainToTop(page);
  await pause(page, 1000);

  // Mobile: Team
  await mobileNavigateTo('Team');
  await showCaption(page, 'Team cards go full-width in a single column.');
  await scenicPause(page, 3000);
  await scrollMainToBottom(page);
  await scenicPause(page, 2500);
  await scrollMainToTop(page);
  await pause(page, 1000);

  // Mobile: Settings
  await mobileNavigateTo('Settings');
  await showCaption(page, 'All settings work perfectly at mobile size.');
  await scenicPause(page, 3000);
  await scrollMainToBottom(page);
  await scenicPause(page, 2500);
  await scrollMainToTop(page);
  await pause(page, 1000);

  // --- 6d. Dark mode at mobile ---
  await showCaption(page, 'Dark mode works at every viewport size.');
  const mobileThemeToggle = page.getByTestId('theme-toggle');
  if (await mobileThemeToggle.isVisible().catch(() => false)) {
    await mobileThemeToggle.click();
    await scenicPause(page, 3000);
  }

  await mobileNavigateTo('Dashboard');
  await scenicPause(page, 3000);
  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 2500);
  await scrollMainToBottom(page);
  await scenicPause(page, 2000);
  await scrollMainToTop(page);

  // Toggle back to light
  const mobileThemeToggleBack = page.getByTestId('theme-toggle');
  if (await mobileThemeToggleBack.isVisible().catch(() => false)) {
    await mobileThemeToggleBack.click();
    await pause(page, 800);
  }
  await hideCaption(page);

  // --- 6e. Step back up to desktop ---
  await showCaption(page, 'Returning to desktop — the full layout restores.');
  await setViewport(page, 600, 800);
  await scenicPause(page, 1200);
  await setViewport(page, 768, 800);
  await scenicPause(page, 1200);
  await setViewport(page, 900, 800);
  await scenicPause(page, 1500);
  await setViewport(page, 1280, 800);
  await scenicPause(page, 3000);
  await hideCaption(page);

  // Navigate back to Dashboard for final shot
  await page.click('[data-testid="nav-dashboard"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1500);

  // =========================================================================
  // SECTION 7: Outro
  // =========================================================================

  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 1500);
  await scrollMainToTop(page);

  await caption(
    page,
    'That\'s ProjectHub — React 18, TypeScript, Tailwind CSS. No backend required. Thanks for watching.',
    5000,
  );
});
