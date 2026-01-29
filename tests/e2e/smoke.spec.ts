import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('app loads without errors', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads and has the Dashboard heading
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('navigation to all routes works', async ({ page }) => {
    // Dashboard
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Projects
    await page.goto('/projects');
    await expect(page.locator('h1')).toContainText('Projects');

    // Tasks
    await page.goto('/tasks');
    await expect(page.locator('h1')).toContainText('Tasks');

    // Team
    await page.goto('/team');
    await expect(page.locator('h1')).toContainText('Team');

    // Settings
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait a bit for any delayed errors
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});
