/**
 * Full Tour Demo Script
 *
 * A comprehensive ~5-7 minute automated walkthrough showcasing **every** feature
 * of the Project Management Dashboard. Designed to be watched in headed mode at
 * 1280×800 desktop resolution with natural pacing and longer pauses between
 * major sections.
 *
 * Run: npm run demo:full
 *
 * @tags @full-tour
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
// Natural-typing helper — types text character by character
// ---------------------------------------------------------------------------
async function naturalType(page: Page, selector: string, text: string): Promise<void> {
  const el = page.locator(selector);
  await el.click();
  for (const char of text) {
    await el.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80); // 60-140ms per char
  }
}

// ---------------------------------------------------------------------------
// Scroll main content to top helper
// ---------------------------------------------------------------------------
async function scrollMainToTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(600);
}

// ---------------------------------------------------------------------------
// Scroll main content to bottom helper
// ---------------------------------------------------------------------------
async function scrollMainToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
}

// ---------------------------------------------------------------------------
// FULL TOUR DEMO
// ---------------------------------------------------------------------------

test('@full-tour Project Management Dashboard — Full Tour', async ({ page }) => {
  // =========================================================================
  // SETUP: Desktop viewport at 1280×800, clear localStorage for clean state
  // =========================================================================
  await setViewport(page, 1280, 800);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');

  // =========================================================================
  // SECTION 1: Dashboard Deep-Dive (0:00 – 0:50)
  // =========================================================================

  // --- 1a. Stat cards ---
  await scenicPause(page, 2500); // Let viewer absorb full dashboard

  // Hover and click each stat card to show navigation
  const statCards = [
    '[data-testid="stat-total-projects"]',
    '[data-testid="stat-active-tasks"]',
    '[data-testid="stat-team-members"]',
    '[data-testid="stat-completed-tasks"]',
  ];
  for (const card of statCards) {
    await page.hover(card);
    await quickPause(page, 500);
  }
  await pause(page, 800);

  // Click the first stat card (Total Projects) to navigate
  const firstStatCard = page.locator(statCards[0]);
  const firstStatLink = firstStatCard.locator('a').first();
  if (await firstStatLink.isVisible().catch(() => false)) {
    await firstStatLink.click();
    await scenicPause(page, 1200);
    // Navigate back to dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForLoadState('networkidle');
    await pause(page, 800);
  }

  // --- 1b. Charts with tooltip hover ---
  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 2000);

  // Sweep across the line chart to trigger tooltips
  const chartsSection = page.locator('[data-testid="dashboard-charts"]');
  const chartsBBox = await chartsSection.boundingBox();
  if (chartsBBox) {
    for (let i = 0; i < 6; i++) {
      const x = chartsBBox.x + chartsBBox.width * 0.08 + (chartsBBox.width * 0.38 * i) / 5;
      const y = chartsBBox.y + chartsBBox.height * 0.4;
      await page.mouse.move(x, y);
      await pause(page, 350);
    }
  }
  await scenicPause(page, 1500);

  // --- 1c. Activity feed ---
  await scrollMainToBottom(page);
  await scenicPause(page, 2000); // Let viewer read the activity feed

  // Scroll back to top
  await scrollMainToTop(page);

  // =========================================================================
  // TRANSITION PAUSE → Projects
  // =========================================================================
  await pause(page, 2500);

  // =========================================================================
  // SECTION 2: Projects Extended — CRUD + Pagination (0:50 – 2:20)
  // =========================================================================

  // --- 2a. Navigate to Projects ---
  await page.click('[data-testid="nav-projects"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1800);

  // --- 2b. Search / Filter / Sort ---
  // Type a search query
  await naturalType(page, 'input[aria-label="Search projects"]', 'Mobile');
  await scenicPause(page, 1200);

  // Clear search
  const searchInput = page.locator('input[aria-label="Search projects"]');
  await searchInput.clear();
  await pause(page, 600);
  // Wait for debounce to settle
  await page.waitForTimeout(400);

  // Sort by clicking Name header (toggle direction)
  await page.click('th:has-text("Name")');
  await pause(page, 800);
  await page.click('th:has-text("Name")'); // Toggle to desc
  await pause(page, 800);

  // Sort by Status
  await page.click('th:has-text("Status")');
  await scenicPause(page, 1000);

  // Reset sort to Name asc for consistent pagination demo
  await page.click('th:has-text("Name")');
  await pause(page, 500);

  // --- 2c. Pagination — navigate multiple pages ---
  // Page 1 → Page 2
  await page.getByText('Next').click();
  await scenicPause(page, 1200);

  // Page 2 → back to Page 1
  await page.getByText('Previous').click();
  await scenicPause(page, 1000);

  // --- 2d. Create new project via modal ---
  await page.getByRole('button', { name: /new project/i }).click();
  await pause(page, 800);

  // Fill form at natural typing pace
  const projNameInput = page.locator('input[placeholder="Enter project name"]');
  await projNameInput.click();
  await pause(page, 300);
  for (const char of 'Analytics Dashboard v2') {
    await projNameInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 500);

  // Select status
  const statusSelect = page.getByRole('dialog').locator('select#status');
  await statusSelect.selectOption('Active');
  await pause(page, 400);

  // Set due date
  const dateInput = page.locator('input[type="date"]');
  await dateInput.fill('2025-06-30');
  await pause(page, 600);

  // Submit
  await page.click('button[type="submit"]:has-text("Create Project")');
  await scenicPause(page, 2000); // Toast visible

  // --- 2e. Edit an existing project ---
  // Open the first project's actions kebab
  const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
  await firstKebab.click();
  await pause(page, 600);

  // Click Edit
  await page.locator('[role="listbox"]').getByText('Edit').click();
  await pause(page, 800);

  // Change name
  const editNameInput = page.getByRole('dialog').locator('input[placeholder="Enter project name"]');
  await editNameInput.clear();
  await pause(page, 300);
  for (const char of 'Redesigned Platform') {
    await editNameInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 400);

  // Save changes
  await page.getByRole('dialog').getByRole('button', { name: /save changes/i }).click();
  await scenicPause(page, 1800); // Toast visible

  // --- 2f. Delete a project with confirmation modal ---
  const deleteKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
  await deleteKebab.click();
  await pause(page, 600);
  await page.locator('[role="listbox"]').getByText('Delete').click();
  await pause(page, 800);

  // Confirmation modal is open
  await scenicPause(page, 1200);

  // Confirm delete
  const confirmDialog = page.getByRole('dialog');
  await confirmDialog.getByRole('button', { name: /^delete$/i }).click();
  await scenicPause(page, 2000); // Toast visible, row removed

  // =========================================================================
  // TRANSITION PAUSE → Kanban
  // =========================================================================
  await pause(page, 2500);

  // =========================================================================
  // SECTION 3: Kanban Extended — DnD + Task CRUD + SlideOver (2:20 – 3:40)
  // =========================================================================

  // --- 3a. Navigate to Tasks (Kanban) ---
  await page.click('[data-testid="nav-tasks"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1800);

  // --- 3b. Drag tasks between columns ---
  // Drag To Do → In Progress
  const todoCards = page.locator('[data-testid="kanban-column-todo"] article[draggable="true"]');
  const todoCount = await todoCards.count();

  if (todoCount > 0) {
    await dragAndDrop(
      page,
      '[data-testid="kanban-column-todo"] article[draggable="true"]:first-of-type',
      '[data-testid="kanban-column-in-progress"]',
      { steps: 15, holdMs: 150 },
    );
    await scenicPause(page, 1500);
  }

  // Drag In Progress → Done
  const ipCards = page.locator('[data-testid="kanban-column-in-progress"] article[draggable="true"]');
  const ipCount = await ipCards.count();

  if (ipCount > 0) {
    await dragAndDrop(
      page,
      '[data-testid="kanban-column-in-progress"] article[draggable="true"]:first-of-type',
      '[data-testid="kanban-column-done"]',
      { steps: 15, holdMs: 150 },
    );
    await scenicPause(page, 1500);
  }

  // --- 3c. Add a new task via Add Task button ---
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

  // Select priority
  const prioritySelect = taskForm.locator('select#priority');
  await prioritySelect.selectOption('high');
  await pause(page, 400);

  // Set due date
  const taskDateInput = taskForm.locator('input[type="date"]');
  await taskDateInput.fill('2025-07-15');
  await pause(page, 400);

  // Submit the task
  await taskForm.getByRole('button', { name: /add task/i }).click();
  await scenicPause(page, 1800); // Toast visible, new card in column

  // --- 3d. Click task card → open SlideOver detail panel ---
  const taskCard = page.locator('[data-testid="kanban-column-todo"] article').first();
  await taskCard.click();
  await pause(page, 800);

  // SlideOver panel is open
  const detailPanel = page.getByRole('dialog');
  await scenicPause(page, 2000); // Let viewer read task details

  // --- 3e. Edit task details in panel ---
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

  // Save
  await detailPanel.getByRole('button', { name: /save changes/i }).click();
  await scenicPause(page, 1500); // Toast visible

  // --- 3f. Close panel ---
  await detailPanel.getByRole('button', { name: /close panel/i }).click();
  await page.waitForTimeout(400); // Animation
  await pause(page, 800);

  // =========================================================================
  // TRANSITION PAUSE → Team
  // =========================================================================
  await pause(page, 2500);

  // =========================================================================
  // SECTION 4: Team Page — Search / Filter / Invite (3:40 – 4:30)
  // =========================================================================

  // --- 4a. Navigate to Team ---
  await page.click('[data-testid="nav-team"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1800);

  // --- 4b. Search members by name ---
  const teamSearchInput = page.getByPlaceholder('Search members...');
  await teamSearchInput.click();
  await pause(page, 300);
  for (const char of 'Sarah') {
    await teamSearchInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await page.waitForTimeout(400); // debounce
  await scenicPause(page, 1200); // Show filtered result

  // Clear search
  await teamSearchInput.clear();
  await page.waitForTimeout(400); // debounce
  await pause(page, 600);

  // --- 4c. Filter by role dropdown ---
  const roleSelect = page.locator('select').first();
  await roleSelect.selectOption('developer');
  await scenicPause(page, 1200); // Show filtered grid

  // Reset role filter
  await roleSelect.selectOption('');
  await page.waitForTimeout(400);
  await pause(page, 600);

  // --- 4d. Invite Member ---
  await page.getByTestId('invite-member-btn').click();
  await pause(page, 800);

  // Fill email
  const inviteEmailInput = page.getByTestId('invite-email-input');
  await inviteEmailInput.click();
  await pause(page, 300);
  for (const char of 'new.member@company.com') {
    await inviteEmailInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(50 + Math.random() * 60);
  }
  await pause(page, 500);

  // Submit
  await page.getByTestId('invite-submit-btn').click();
  await scenicPause(page, 2000); // Toast visible, modal closes

  // =========================================================================
  // TRANSITION PAUSE → Settings
  // =========================================================================
  await pause(page, 2500);

  // =========================================================================
  // SECTION 5: Settings Page — All Sections (4:30 – 5:30)
  // =========================================================================

  // --- 5a. Navigate to Settings ---
  await page.click('[data-testid="nav-settings"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1800);

  // --- 5b. Profile — change name ---
  const profileNameInput = page.getByTestId('profile-name-input');
  await profileNameInput.clear();
  await pause(page, 300);
  for (const char of 'Alex Johnson') {
    await profileNameInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 600);

  // --- 5c. Notifications — toggle switches ---
  // Scroll to notification section
  await smoothScroll(page, '[data-testid="notifications-section"]');
  await pause(page, 600);

  // Toggle Slack notification on (default is off)
  const slackToggle = page.getByTestId('notification-toggle-slack').getByRole('switch');
  await slackToggle.click();
  await quickPause(page, 500);

  // Toggle email notification off then back on
  const emailToggle = page.getByTestId('notification-toggle-email').getByRole('switch');
  await emailToggle.click();
  await quickPause(page, 500);
  await emailToggle.click();
  await quickPause(page, 500);

  // Toggle push notification
  const pushToggle = page.getByTestId('notification-toggle-push').getByRole('switch');
  await pushToggle.click();
  await quickPause(page, 500);
  await pushToggle.click();
  await pause(page, 600);

  // --- 5d. Appearance — theme ---
  await smoothScroll(page, '[data-testid="appearance-section"]');
  await pause(page, 600);

  // Switch to dark theme
  await page.getByTestId('theme-option-dark').click();
  await scenicPause(page, 1500); // Let viewer see dark mode

  // Switch back to light
  await page.getByTestId('theme-option-light').click();
  await scenicPause(page, 1000);

  // --- 5e. Accent color ---
  const accentColors = ['purple', 'green', 'orange', 'pink', 'blue'];
  for (const color of accentColors) {
    await page.getByTestId(`accent-color-${color}`).click();
    await quickPause(page, 400);
  }
  await pause(page, 600);

  // --- 5f. Save Changes ---
  await page.getByTestId('save-settings-btn').click();
  await scenicPause(page, 2000); // Loading state + success toast

  // =========================================================================
  // TRANSITION PAUSE → Responsive
  // =========================================================================
  await pause(page, 2500);

  // =========================================================================
  // SECTION 6: Responsive Showcase (5:30 – 6:20)
  // =========================================================================

  // Navigate back to dashboard for the showcase
  await page.click('[data-testid="nav-dashboard"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1500);

  // --- 6a. Tablet breakpoint (~900px) — sidebar collapses to icons ---
  await setViewport(page, 900, 800);
  await scenicPause(page, 2000); // Show collapsed sidebar

  // Hover over icon-only sidebar items
  const sidebar = page.locator('aside');
  const sidebarVisible = await sidebar.isVisible().catch(() => false);
  if (sidebarVisible) {
    await sidebar.hover();
    await pause(page, 600);
  }

  // --- 6b. Mobile breakpoint (~375px) — hamburger menu ---
  await setViewport(page, 375, 800);
  await scenicPause(page, 2000); // Show mobile layout

  // Open hamburger menu
  const hamburger = page.getByLabel('Open navigation menu');
  const hamburgerVisible = await hamburger.isVisible().catch(() => false);
  if (hamburgerVisible) {
    await hamburger.click();
    await scenicPause(page, 1500); // Show mobile nav overlay

    // Navigate via mobile menu to Projects
    const mobileDialog = page.locator('[role="dialog"]');
    await mobileDialog.getByText('Projects').click();
    await page.waitForLoadState('networkidle');
    await scenicPause(page, 1500);

    // Re-open hamburger and navigate to Tasks
    const hamburgerAgain = page.getByLabel('Open navigation menu');
    const hamburgerAgainVisible = await hamburgerAgain.isVisible().catch(() => false);
    if (hamburgerAgainVisible) {
      await hamburgerAgain.click();
      await pause(page, 800);
      const mobileDialogAgain = page.locator('[role="dialog"]');
      await mobileDialogAgain.getByText('Tasks').click();
      await page.waitForLoadState('networkidle');
      await scenicPause(page, 1200);
    }
  }

  // --- 6c. Resize back to desktop ---
  await setViewport(page, 1280, 800);
  await scenicPause(page, 2000); // Sidebar expands back

  // Navigate back to Dashboard for final shot
  await page.click('[data-testid="nav-dashboard"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1500);

  // =========================================================================
  // SECTION 7: Outro (6:20 – 6:40)
  // =========================================================================

  // Scroll slowly through the dashboard one final time
  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 1500);
  await scrollMainToTop(page);

  // Final scenic pause on dashboard for closing shot
  await scenicPause(page, 3000);
});
