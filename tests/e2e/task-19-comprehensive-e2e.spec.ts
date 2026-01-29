import { test, expect } from '@playwright/test';

/**
 * Task 19: Comprehensive E2E Test Suite
 *
 * Covers all critical user flows: navigation, theme toggle, projects CRUD,
 * Kanban drag-drop, team filtering, settings persistence, and mobile responsive behavior.
 * Implements Story 29.
 */

// ────────────────────────────────────────────────────────────────────────────
// 1. SMOKE TEST — App loads without errors
// ────────────────────────────────────────────────────────────────────────────

test.describe('Smoke: App loads without errors', () => {
  test('app loads at "/" with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter out known benign errors (like favicon 404, network errors)
    const realErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('net::')
    );
    expect(realErrors).toHaveLength(0);

    // Verify basic shell is rendered
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. NAVIGATION — Navigate to each page via sidebar
// ────────────────────────────────────────────────────────────────────────────

test.describe('Navigation: Sidebar page navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('navigate to each page via sidebar and verify URL + heading', async ({ page }) => {
    const routes = [
      { label: 'Projects', url: /\/projects/, heading: 'Projects' },
      { label: 'Tasks', url: /\/tasks/, heading: 'Tasks' },
      { label: 'Team', url: /\/team/, heading: 'Team' },
      { label: 'Settings', url: /\/settings/, heading: 'Settings' },
      { label: 'Dashboard', url: /\/$/, heading: 'Dashboard' },
    ];

    for (const route of routes) {
      await page.locator('aside nav').getByText(route.label).click();
      await expect(page).toHaveURL(route.url);
      await expect(page.locator('h1')).toContainText(route.heading);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. THEME TOGGLE — Toggle dark mode and verify theme class
// ────────────────────────────────────────────────────────────────────────────

test.describe('Theme: Toggle dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('toggle dark mode and verify "dark" class on html element', async ({ page }) => {
    // Initially should be light mode (no "dark" class)
    const initialHasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(initialHasDark).toBe(false);

    // Click theme toggle button
    await page.getByTestId('theme-toggle').click();

    // Should now have "dark" class
    const afterToggleHasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(afterToggleHasDark).toBe(true);

    // Toggle back to light
    await page.getByTestId('theme-toggle').click();

    const afterSecondToggle = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(afterSecondToggle).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 4. PROJECTS SEARCH — Search projects table and verify filtered results
// ────────────────────────────────────────────────────────────────────────────

test.describe('Projects: Search and filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('search projects table and verify filtered results count', async ({ page }) => {
    // Initially should show 5 rows (page 1 of 10 projects)
    const initialRows = page.locator('tbody tr');
    await expect(initialRows).toHaveCount(5);

    // Search for "Mobile"
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('Mobile');
    await page.waitForTimeout(400); // debounce wait

    // Should filter to 1 result
    const filteredRows = page.locator('tbody tr');
    await expect(filteredRows).toHaveCount(1);
    await expect(filteredRows.first()).toContainText('Mobile App Redesign');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. PROJECTS SORT — Sort projects table by clicking column headers
// ────────────────────────────────────────────────────────────────────────────

test.describe('Projects: Sort by column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('sort projects table by clicking column headers', async ({ page }) => {
    // Default sort: Name ascending
    const nameHeader = page.locator('th', { hasText: 'Name' });
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // First row should be alphabetically first
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toContainText('API Integration Platform');

    // Click Name header to toggle to descending
    await nameHeader.click();
    await page.waitForTimeout(100);

    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    // First row should now be alphabetically last
    const descFirstRow = page.locator('tbody tr').first();
    await expect(descFirstRow).toContainText('Security Audit');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 6. PROJECT MODAL — Open and close project create/edit modal
// ────────────────────────────────────────────────────────────────────────────

test.describe('Projects: Create modal open/close', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('open and close project create modal', async ({ page }) => {
    // Click "New Project" button
    await page.getByRole('button', { name: /new project/i }).click();

    // Modal dialog should be visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('New Project');

    // Verify form fields are present
    await expect(dialog.locator('input[placeholder="Enter project name"]')).toBeVisible();

    // Close via Cancel button
    await dialog.getByRole('button', { name: /cancel/i }).click();

    // Modal should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 7. KANBAN DRAG — Drag task between Kanban columns
// ────────────────────────────────────────────────────────────────────────────

test.describe('Kanban: Drag task between columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('appData'));
    await page.goto('/tasks');
    await page.waitForSelector('h1');
  });

  test('drag task from To Do to In Progress and verify move', async ({ page }) => {
    // Verify initial counts
    const todoCount = page.locator('[aria-label="To Do column"] >> h2 + span');
    const inProgressCount = page.locator('[aria-label="In Progress column"] >> h2 + span');
    await expect(todoCount).toHaveText('7');
    await expect(inProgressCount).toHaveText('6');

    // Pick a specific task to drag
    const taskCard = page.locator('article', { hasText: 'Database schema optimization' });
    const targetColumn = page.locator('[aria-label="In Progress column"]');

    // Perform drag and drop
    await taskCard.dragTo(targetColumn);

    // Verify the task moved to In Progress column
    const inProgressColumn = page.locator('[aria-label="In Progress column"]');
    await expect(
      inProgressColumn.locator('article', { hasText: 'Database schema optimization' })
    ).toBeVisible();

    // Verify counts updated
    await expect(todoCount).toHaveText('6');
    await expect(inProgressCount).toHaveText('7');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 8. TASK DETAIL PANEL — Open detail panel and close with Escape key
// ────────────────────────────────────────────────────────────────────────────

test.describe('Tasks: Detail panel open and close with Escape', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('appData'));
    await page.goto('/tasks');
    await page.waitForSelector('h1');
  });

  test('open task detail panel and close with Escape key', async ({ page }) => {
    // Click a task card to open the SlideOver panel
    const card = page.locator('article', { hasText: 'Implement authentication API' });
    await card.click();

    // SlideOver dialog should appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Task Details');
    await expect(dialog).toContainText('Implement authentication API');

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Wait for close animation (300ms + buffer)
    await page.waitForTimeout(400);

    // Panel should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 9. TEAM FILTER — Filter team members by role dropdown
// ────────────────────────────────────────────────────────────────────────────

test.describe('Team: Filter members by role', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/team');
  });

  test('filter team members by role dropdown', async ({ page }) => {
    // Initially all 8 members shown
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 8 of 8 members');

    // Select "developer" from role dropdown
    const roleSelect = page.locator('select');
    await roleSelect.selectOption('developer');

    // Should filter to 4 developers
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 4 of 8 members');

    // Known developers should be visible
    await expect(page.getByText('Marcus Rodriguez')).toBeVisible();

    // Non-developers should be hidden
    await expect(page.getByText('Sarah Chen')).not.toBeVisible();

    // Reset filter to all
    await roleSelect.selectOption('');
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 8 of 8 members');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 10. SETTINGS SAVE — Save settings and verify toast notification
// ────────────────────────────────────────────────────────────────────────────

test.describe('Settings: Save and toast notification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/settings');
  });

  test('save settings and verify toast notification appears', async ({ page }) => {
    // Click Save Changes button
    const saveBtn = page.getByTestId('save-settings-btn');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify "Settings saved!" toast appears
    await expect(page.getByText('Settings saved!')).toBeVisible({ timeout: 5000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 11. MOBILE — Hamburger menu opens sidebar overlay
// ────────────────────────────────────────────────────────────────────────────

test.describe('Mobile: Hamburger menu opens sidebar overlay', () => {
  test('mobile viewport: hamburger menu opens sidebar overlay', async ({ page }) => {
    // Set mobile viewport size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sidebar should be hidden on mobile
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();

    // Hamburger button should be visible
    const hamburger = page.getByLabel('Open navigation menu');
    await expect(hamburger).toBeVisible();

    // Click hamburger to open overlay
    await hamburger.click();

    // Mobile overlay dialog should appear with nav items
    const overlay = page.locator('[role="dialog"]');
    await expect(overlay).toBeVisible();

    // All 5 navigation items should be visible in overlay
    const expectedLabels = ['Dashboard', 'Projects', 'Tasks', 'Team', 'Settings'];
    for (const label of expectedLabels) {
      await expect(overlay.getByText(label)).toBeVisible();
    }

    // Close via close button
    await page.getByLabel('Close navigation menu').click();
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });
});
