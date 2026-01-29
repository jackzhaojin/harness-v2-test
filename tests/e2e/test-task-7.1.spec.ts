import { test, expect } from '@playwright/test';

test.describe('Task 7.1: Dark mode bg fix & system theme selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('AppShell uses dark:bg-gray-900 (not gray-950)', async ({ page }) => {
    // The root layout div should have the correct dark class
    const appShell = page.locator('div.bg-gray-50').first();
    await expect(appShell).toBeVisible();

    // Verify the class includes dark:bg-gray-900
    await expect(appShell).toHaveClass(/dark:bg-gray-900/);

    // Ensure gray-950 is NOT present
    const classAttr = await appShell.getAttribute('class');
    expect(classAttr).not.toContain('gray-950');
  });

  test('Settings page has theme preference selector with 3 options', async ({ page }) => {
    // Navigate to Settings
    const settingsLink = page.locator('nav a:has-text("Settings")').first();
    await settingsLink.click();

    // Verify heading
    await expect(page.locator('h1')).toContainText('Settings');

    // Verify radiogroup exists
    const radioGroup = page.locator('[role="radiogroup"]');
    await expect(radioGroup).toBeVisible();

    // Verify all three options exist
    const lightRadio = page.locator('input[type="radio"][value="light"]');
    const darkRadio = page.locator('input[type="radio"][value="dark"]');
    const systemRadio = page.locator('input[type="radio"][value="system"]');

    await expect(lightRadio).toBeAttached();
    await expect(darkRadio).toBeAttached();
    await expect(systemRadio).toBeAttached();

    // Verify labels are visible
    await expect(page.getByText('Light', { exact: true })).toBeVisible();
    await expect(page.getByText('Dark', { exact: true })).toBeVisible();
    await expect(page.getByText('System', { exact: true })).toBeVisible();
  });

  test('current theme is visually indicated (light selected by default)', async ({ page }) => {
    const settingsLink = page.locator('nav a:has-text("Settings")').first();
    await settingsLink.click();

    // Light radio should be checked by default
    const lightRadio = page.locator('input[type="radio"][value="light"]');
    await expect(lightRadio).toBeChecked();

    // Dark and system should not be checked
    const darkRadio = page.locator('input[type="radio"][value="dark"]');
    const systemRadio = page.locator('input[type="radio"][value="system"]');
    await expect(darkRadio).not.toBeChecked();
    await expect(systemRadio).not.toBeChecked();

    // The selected card should have blue border styling
    const lightCard = page.locator('label:has(input[value="light"])');
    await expect(lightCard).toHaveClass(/border-blue-500/);
  });

  test('selecting Dark in Settings switches to dark mode', async ({ page }) => {
    const settingsLink = page.locator('nav a:has-text("Settings")').first();
    await settingsLink.click();

    const htmlEl = page.locator('html');
    await expect(htmlEl).not.toHaveClass(/dark/);

    // Click the Dark option card
    const darkLabel = page.locator('label:has(input[value="dark"])');
    await darkLabel.click();

    // HTML should now have dark class
    await expect(htmlEl).toHaveClass(/dark/);

    // Dark radio should be checked
    const darkRadio = page.locator('input[type="radio"][value="dark"]');
    await expect(darkRadio).toBeChecked();
  });

  test('selecting System in Settings applies system theme', async ({ page }) => {
    const settingsLink = page.locator('nav a:has-text("Settings")').first();
    await settingsLink.click();

    // Click the System option card
    const systemLabel = page.locator('label:has(input[value="system"])');
    await systemLabel.click();

    // System radio should be checked
    const systemRadio = page.locator('input[type="radio"][value="system"]');
    await expect(systemRadio).toBeChecked();

    // localStorage should contain "system"
    const storedTheme = await page.evaluate(() =>
      window.localStorage.getItem('theme')
    );
    expect(storedTheme).toContain('system');
  });

  test('theme preference is saved to localStorage via Settings', async ({ page }) => {
    const settingsLink = page.locator('nav a:has-text("Settings")').first();
    await settingsLink.click();

    // Select dark
    const darkLabel = page.locator('label:has(input[value="dark"])');
    await darkLabel.click();

    const storedTheme = await page.evaluate(() =>
      window.localStorage.getItem('theme')
    );
    expect(storedTheme).toContain('dark');

    // Reload and navigate back - should still be dark
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('no console errors when switching themes via Settings', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const settingsLink = page.locator('nav a:has-text("Settings")').first();
    await settingsLink.click();

    // Switch through all three options
    await page.locator('label:has(input[value="dark"])').click();
    await page.waitForTimeout(100);
    await page.locator('label:has(input[value="system"])').click();
    await page.waitForTimeout(100);
    await page.locator('label:has(input[value="light"])').click();
    await page.waitForTimeout(100);

    expect(errors).toEqual([]);
  });
});
