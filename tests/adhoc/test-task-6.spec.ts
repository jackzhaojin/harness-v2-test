import { test, expect } from '@playwright/test';

test.describe('Task 6: App Shell with Sidebar and Header Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('smoke: app loads without errors', async ({ page }) => {
    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App should render the shell
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Filter out known benign errors (like favicon 404)
    const realErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('net::')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('sidebar shows 5 nav items with correct labels', async ({ page }) => {
    const nav = page.locator('aside nav');
    await expect(nav).toBeVisible();

    const navLinks = nav.locator('a');
    await expect(navLinks).toHaveCount(5);

    // Verify each label
    const expectedLabels = ['Dashboard', 'Projects', 'Tasks', 'Team', 'Settings'];
    for (const label of expectedLabels) {
      await expect(nav.getByText(label)).toBeVisible();
    }
  });

  test('sidebar uses semantic <nav> and <aside> elements', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
    const asideNav = page.locator('aside nav');
    await expect(asideNav).toHaveAttribute('aria-label', 'Main navigation');
  });

  test('active page has distinct highlight', async ({ page }) => {
    // Dashboard should be active by default
    const dashboardLink = page.locator('aside nav a[href="/"]');
    await expect(dashboardLink).toHaveClass(/bg-blue-50|text-blue-700/);
  });

  test('nav items navigate to correct routes', async ({ page }) => {
    // Click Projects
    await page.locator('aside nav').getByText('Projects').click();
    await expect(page).toHaveURL(/\/projects/);

    // Click Tasks
    await page.locator('aside nav').getByText('Tasks').click();
    await expect(page).toHaveURL(/\/tasks/);

    // Click Team
    await page.locator('aside nav').getByText('Team').click();
    await expect(page).toHaveURL(/\/team/);

    // Click Settings
    await page.locator('aside nav').getByText('Settings').click();
    await expect(page).toHaveURL(/\/settings/);

    // Click Dashboard
    await page.locator('aside nav').getByText('Dashboard').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('sidebar collapse toggle works', async ({ page }) => {
    const sidebar = page.locator('aside');

    // Should start expanded (w-60)
    await expect(sidebar).toHaveClass(/w-60/);

    // Click collapse button
    await page.getByLabel('Collapse sidebar').click();

    // Should now be collapsed (w-16)
    await expect(sidebar).toHaveClass(/w-16/);

    // Click expand button
    await page.getByLabel('Expand sidebar').click();

    // Should be expanded again
    await expect(sidebar).toHaveClass(/w-60/);
  });

  test('header contains search input with placeholder', async ({ page }) => {
    const header = page.locator('header');
    const searchInput = header.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search...');
  });

  test('header contains notification bell with unread dot', async ({ page }) => {
    const bellButton = page.getByRole('button', { name: 'Notifications' });
    await expect(bellButton).toBeVisible();

    // Check for the red dot indicator
    const unreadDot = bellButton.locator('[data-testid="notification-dot"]');
    await expect(unreadDot).toBeVisible();
  });

  test('user avatar opens dropdown with Profile, Settings, Logout', async ({ page }) => {
    // Click user menu
    const userMenuBtn = page.getByLabel('User menu');
    await expect(userMenuBtn).toBeVisible();
    await userMenuBtn.click();

    // Dropdown should appear
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible();

    // Check items
    await expect(dropdown.getByText('Profile')).toBeVisible();
    await expect(dropdown.getByText('Settings')).toBeVisible();
    await expect(dropdown.getByText('Logout')).toBeVisible();
  });

  test('clicking outside dropdown closes it', async ({ page }) => {
    // Open dropdown
    await page.getByLabel('User menu').click();
    await expect(page.locator('[role="menu"]')).toBeVisible();

    // Click outside (on main content)
    await page.locator('main').click();

    // Dropdown should close
    await expect(page.locator('[role="menu"]')).toBeHidden();
  });

  test('mobile: hamburger menu is visible and sidebar is hidden', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Sidebar should be hidden
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();

    // Hamburger should be visible
    const hamburger = page.getByLabel('Open navigation menu');
    await expect(hamburger).toBeVisible();
  });

  test('mobile: hamburger opens full-screen overlay', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Click hamburger
    await page.getByLabel('Open navigation menu').click();

    // Overlay should appear
    const overlay = page.locator('[role="dialog"]');
    await expect(overlay).toBeVisible();

    // All nav items visible in overlay
    const expectedLabels = ['Dashboard', 'Projects', 'Tasks', 'Team', 'Settings'];
    for (const label of expectedLabels) {
      await expect(overlay.getByText(label)).toBeVisible();
    }
  });

  test('mobile: close button closes overlay', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Open
    await page.getByLabel('Open navigation menu').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close via X button
    await page.getByLabel('Close navigation menu').click();
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('mobile: clicking nav item closes overlay and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Open
    await page.getByLabel('Open navigation menu').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click Projects
    await page.locator('[role="dialog"]').getByText('Projects').click();

    // Overlay should close
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    // Should navigate
    await expect(page).toHaveURL(/\/projects/);
  });
});
