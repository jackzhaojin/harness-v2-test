/**
 * Highlights Demo Script
 *
 * A ~2-3 minute automated walkthrough showcasing the most visually impressive
 * features of the Project Management Dashboard. Designed to be watched in
 * headed mode at 1280x800 resolution with natural pacing.
 *
 * Run: npm run demo:highlights
 *
 * @tags @highlights
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
// HIGHLIGHTS DEMO
// ---------------------------------------------------------------------------

test('@highlights Project Management Dashboard — Highlights Tour', async ({ page }) => {
  // =========================================================================
  // SETUP: Desktop viewport at 1280x800
  // =========================================================================
  await setViewport(page, 1280, 800);

  // =========================================================================
  // SECTION 1: Dashboard Landing (0:00 - 0:25)
  // =========================================================================
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 2000); // Let the dashboard fully render

  // Hover over stat cards to show interactivity
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

  // =========================================================================
  // SECTION 2: Charts Section (0:25 - 0:50)
  // =========================================================================

  // Smooth scroll to the charts section
  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 2000); // Let viewer absorb charts

  // Hover over the line chart area to trigger tooltips
  const chartsSection = page.locator('[data-testid="dashboard-charts"]');
  const chartsBBox = await chartsSection.boundingBox();
  if (chartsBBox) {
    // Move across the first chart (left half) to trigger line chart tooltips
    for (let i = 0; i < 5; i++) {
      const x = chartsBBox.x + (chartsBBox.width * 0.1) + (chartsBBox.width * 0.35 * i) / 4;
      const y = chartsBBox.y + chartsBBox.height * 0.4;
      await page.mouse.move(x, y);
      await pause(page, 300);
    }
  }
  await scenicPause(page, 1500);

  // Scroll down more to show activity feed
  await smoothScroll(page, 'main');
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
  });
  await scenicPause(page, 1500);

  // Scroll back to top
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await pause(page, 800);

  // =========================================================================
  // SECTION 3: Projects Page (0:50 - 1:30)
  // =========================================================================

  // Navigate to Projects via sidebar
  await page.click('[data-testid="nav-projects"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1500);

  // Search for a project
  const searchInput = page.locator('input[aria-label="Search projects"]');
  await searchInput.click();
  await pause(page, 400);

  // Type search query character by character
  await naturalType(page, 'input[aria-label="Search projects"]', 'Website');
  await scenicPause(page, 1200); // Show filtered results

  // Clear search
  await searchInput.clear();
  await pause(page, 600);

  // Sort by clicking Name column header
  await page.click('th:has-text("Name")');
  await pause(page, 800);
  await page.click('th:has-text("Name")'); // Toggle sort direction
  await pause(page, 800);

  // Sort by Status
  await page.click('th:has-text("Status")');
  await scenicPause(page, 1000);

  // Click New Project button to open modal
  await page.click('button:has-text("New Project")');
  await pause(page, 800);

  // Fill form fields at natural typing pace
  const nameInput = page.locator('input[placeholder="Enter project name"]');
  await nameInput.click();
  await pause(page, 300);
  for (const char of 'Analytics Dashboard v2') {
    await nameInput.press(char === ' ' ? 'Space' : char);
    await page.waitForTimeout(60 + Math.random() * 80);
  }
  await pause(page, 500);

  // Set due date
  const dateInput = page.locator('input[type="date"]');
  await dateInput.fill('2025-06-30');
  await pause(page, 600);

  // Submit the form
  await page.click('button[type="submit"]:has-text("Create Project")');
  await scenicPause(page, 2000); // Toast visible, new project in list

  // =========================================================================
  // SECTION 4: Kanban Board — Drag & Drop (1:30 - 2:10)
  // =========================================================================

  // Navigate to Tasks via sidebar
  await page.click('[data-testid="nav-tasks"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 1500);

  // Drag first task from To Do → In Progress
  const todoColumn = page.locator('[data-testid="kanban-column-todo"]');
  const inProgressColumn = page.locator('[data-testid="kanban-column-in-progress"]');
  const doneColumn = page.locator('[data-testid="kanban-column-done"]');

  // Get first task card in To Do
  const todoCards = todoColumn.locator('article[draggable="true"]');
  const todoCount = await todoCards.count();

  if (todoCount > 0) {
    // Drag #1: To Do → In Progress
    await dragAndDrop(
      page,
      '[data-testid="kanban-column-todo"] article[draggable="true"]:first-of-type',
      '[data-testid="kanban-column-in-progress"]',
      { steps: 15, holdMs: 150 },
    );
    await scenicPause(page, 1500);
  }

  // Drag #2: In Progress → Done
  const ipCards = inProgressColumn.locator('article[draggable="true"]');
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

  // =========================================================================
  // SECTION 5: Dark Mode Toggle (2:10 - 2:40)
  // =========================================================================

  // Toggle to dark mode
  await page.click('[data-testid="theme-toggle"]');
  await scenicPause(page, 1500);

  // Navigate to Dashboard in dark mode
  await page.click('[data-testid="nav-dashboard"]');
  await page.waitForLoadState('networkidle');
  await scenicPause(page, 2000);

  // Scroll through dashboard in dark mode
  await smoothScroll(page, '[data-testid="dashboard-charts"]');
  await scenicPause(page, 1500);

  // Scroll back to top
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await pause(page, 800);

  // Toggle back to light mode
  await page.click('[data-testid="theme-toggle"]');
  await scenicPause(page, 1500);

  // =========================================================================
  // SECTION 6: Responsive Resize (2:40 - 3:00)
  // =========================================================================

  // Resize to mobile viewport
  await setViewport(page, 375, 800);
  await scenicPause(page, 2000); // Show sidebar collapse

  // Resize to tablet
  await setViewport(page, 768, 800);
  await scenicPause(page, 1200);

  // Resize back to desktop
  await setViewport(page, 1280, 800);
  await scenicPause(page, 1500);

  // =========================================================================
  // OUTRO
  // =========================================================================
  // Final scenic pause on dashboard for closing shot
  await scenicPause(page, 2000);
});
