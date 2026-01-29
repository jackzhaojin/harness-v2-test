import { test, expect } from '@playwright/test';

test.describe('Task 6.1: Tablet viewport sidebar icons-only by default', () => {
  test.beforeEach(async ({ context }) => {
    // Clear localStorage so we test default behavior (no persisted user preference)
    await context.clearCookies();
  });

  test('tablet (900px): sidebar shows icons only (collapsed w-16) by default', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 900, height: 768 });
    // Clear localStorage before navigation
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('sidebar-collapsed'));
    // Reload to apply fresh state
    await page.reload();
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Sidebar should be collapsed (w-16) at tablet viewport
    await expect(sidebar).toHaveClass(/w-16/);

    // Text labels should NOT be visible
    await expect(sidebar.getByText('Dashboard')).toBeHidden();
  });

  test('tablet (768px boundary): sidebar collapsed at lower boundary', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('sidebar-collapsed'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/w-16/);
  });

  test('desktop (1024px): sidebar expanded by default', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('sidebar-collapsed'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/w-60/);

    // Text labels should be visible at desktop
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
  });

  test('desktop (1280px): sidebar expanded by default', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('sidebar-collapsed'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/w-60/);
  });

  test('tablet: user can manually expand sidebar (toggle overrides default)', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 768 });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('sidebar-collapsed'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside');

    // Should start collapsed at tablet
    await expect(sidebar).toHaveClass(/w-16/);

    // User manually expands
    await page.getByLabel('Expand sidebar').click();

    // Should now be expanded
    await expect(sidebar).toHaveClass(/w-60/);
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
  });

  test('tablet: user can manually collapse after expanding', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 768 });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('sidebar-collapsed'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside');

    // Start collapsed at tablet
    await expect(sidebar).toHaveClass(/w-16/);

    // User expands
    await page.getByLabel('Expand sidebar').click();
    await expect(sidebar).toHaveClass(/w-60/);

    // User collapses again
    await page.getByLabel('Collapse sidebar').click();
    await expect(sidebar).toHaveClass(/w-16/);
  });
});
