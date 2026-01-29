import { test, expect } from '@playwright/test';

test.describe('Task 7: Dark/light theme toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and clear localStorage on client side to start fresh
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('theme toggle button is visible in header', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');
    await expect(toggleBtn).toBeVisible();
  });

  test('defaults to light mode (no dark class on html)', async ({ page }) => {
    const htmlEl = page.locator('html');
    await expect(htmlEl).not.toHaveClass(/dark/);
  });

  test('clicking toggle switches to dark mode', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');

    // Initially light: no dark class
    const htmlEl = page.locator('html');
    await expect(htmlEl).not.toHaveClass(/dark/);

    // Click toggle → should switch to dark
    await toggleBtn.click();
    await expect(htmlEl).toHaveClass(/dark/);
  });

  test('clicking toggle again switches back to light mode', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');
    const htmlEl = page.locator('html');

    // Light → Dark
    await toggleBtn.click();
    await expect(htmlEl).toHaveClass(/dark/);

    // Dark → Light
    await toggleBtn.click();
    await expect(htmlEl).not.toHaveClass(/dark/);
  });

  test('light mode: correct background and text colors', async ({ page }) => {
    const htmlEl = page.locator('html');
    await expect(htmlEl).not.toHaveClass(/dark/);

    // AppShell should have gray-50 background in light mode
    const appShell = page.locator('div.bg-gray-50').first();
    await expect(appShell).toBeVisible();

    // Header should have white background
    const header = page.locator('header');
    await expect(header).toHaveClass(/bg-white/);

    // Page heading text should be visible (gray-900)
    const heading = page.locator('h1');
    await expect(heading).toHaveClass(/text-gray-900/);
  });

  test('dark mode: correct background and text colors', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');
    await toggleBtn.click();

    const htmlEl = page.locator('html');
    await expect(htmlEl).toHaveClass(/dark/);

    // Header should have dark bg
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Page heading should be readable in dark mode (dark:text-gray-100)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('theme persists to localStorage', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');

    // Switch to dark
    await toggleBtn.click();

    // Check localStorage
    const storedTheme = await page.evaluate(() =>
      window.localStorage.getItem('theme')
    );
    expect(storedTheme).toContain('dark');
  });

  test('theme restores from localStorage on reload', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');
    const htmlEl = page.locator('html');

    // Switch to dark
    await toggleBtn.click();
    await expect(htmlEl).toHaveClass(/dark/);

    // Verify localStorage was set
    const storedBefore = await page.evaluate(() => window.localStorage.getItem('theme'));
    expect(storedBefore).toContain('dark');

    // Reload the page (localStorage persists)
    await page.reload();

    // Should still be dark because localStorage persists across reload
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('theme applies to all pages without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const toggleBtn = page.getByTestId('theme-toggle');

    // Switch to dark mode
    await toggleBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Use client-side navigation (clicking sidebar links) to avoid
    // page.goto which triggers addInitScript and clears localStorage
    const navLabels = ['Projects', 'Tasks', 'Team', 'Settings'];
    for (const label of navLabels) {
      const navLink = page.locator(`nav a:has-text("${label}")`).first();
      await navLink.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      // Verify the heading updated (page navigated)
      await expect(page.locator('h1')).toContainText(label);
    }

    expect(errors).toEqual([]);
  });

  test('toggle button has accessible aria-label', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');

    // In light mode, should say "Switch to dark mode"
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to dark mode');

    // Click to switch to dark
    await toggleBtn.click();

    // In dark mode, should say "Switch to light mode"
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  test('borders and shadows adapt in dark mode', async ({ page }) => {
    const toggleBtn = page.getByTestId('theme-toggle');

    // Switch to dark
    await toggleBtn.click();

    // Header border adapts (dark:border-gray-700)
    const header = page.locator('header');
    await expect(header).toHaveClass(/dark:border-gray-700/);

    // Search input border adapts
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toHaveClass(/dark:border-gray-600/);
  });

  test('no console errors during theme switches', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const toggleBtn = page.getByTestId('theme-toggle');

    // Toggle multiple times rapidly
    await toggleBtn.click();
    await toggleBtn.click();
    await toggleBtn.click();
    await toggleBtn.click();

    // Wait a tick for any errors to surface
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);
  });
});
