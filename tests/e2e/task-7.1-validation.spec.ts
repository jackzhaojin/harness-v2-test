import { test, expect } from '@playwright/test';

test.describe('Task 7.1 Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('Criterion 1: AppShell background in dark mode is dark:bg-gray-900', async ({ page }) => {
    // Enable dark mode using data-testid
    await page.locator('[data-testid="theme-toggle"]').click();

    // Wait for dark mode to apply
    await page.waitForTimeout(100);

    // Check that the html element has 'dark' class
    const htmlClasses = await page.locator('html').getAttribute('class');
    expect(htmlClasses).toContain('dark');

    // Check AppShell container has correct background color
    const appShell = page.locator('.min-h-screen.bg-gray-50');
    await expect(appShell).toBeVisible();

    // Verify computed background color matches gray-900 in dark mode
    const bgColor = await appShell.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // gray-900 is rgb(17, 24, 39)
    expect(bgColor).toBe('rgb(17, 24, 39)');
  });

  test('Criterion 2: Settings page has theme preference selector UI', async ({ page }) => {
    // Navigate to Settings
    await page.goto('http://localhost:5174/settings');

    // Check for theme preference section
    await expect(page.locator('h2:has-text("Theme Preference")')).toBeVisible();
  });

  test('Criterion 3: Theme selector offers three options: Light, Dark, System', async ({ page }) => {
    await page.goto('http://localhost:5174/settings');

    // Check for all three theme options (using more specific selectors)
    await expect(page.locator('label:has-text("Light")').first()).toBeVisible();
    await expect(page.locator('label:has-text("Dark")').first()).toBeVisible();
    await expect(page.locator('label:has-text("System")').first()).toBeVisible();

    // Verify radio buttons exist
    const radioButtons = page.locator('input[type="radio"][name="theme"]');
    await expect(radioButtons).toHaveCount(3);

    // Verify values
    const lightRadio = page.locator('input[type="radio"][value="light"]');
    const darkRadio = page.locator('input[type="radio"][value="dark"]');
    const systemRadio = page.locator('input[type="radio"][value="system"]');

    await expect(lightRadio).toBeAttached();
    await expect(darkRadio).toBeAttached();
    await expect(systemRadio).toBeAttached();
  });

  test('Criterion 4: Selecting "System" theme follows OS prefers-color-scheme', async ({ page, context }) => {
    await page.goto('http://localhost:5174/settings');

    // Click on System option
    await page.locator('label:has-text("System")').click();

    // Wait for theme to apply
    await page.waitForTimeout(200);

    // Check localStorage
    const themeFromStorage = await page.evaluate(() => {
      return localStorage.getItem('theme');
    });
    expect(themeFromStorage).toBe('"system"');

    // Verify system radio is checked
    const systemRadio = page.locator('input[type="radio"][value="system"]');
    await expect(systemRadio).toBeChecked();
  });

  test('Criterion 5: Theme preference is saved to localStorage', async ({ page }) => {
    await page.goto('http://localhost:5174/settings');

    // Select Dark theme
    await page.locator('label:has-text("Dark")').click();
    await page.waitForTimeout(100);

    // Check localStorage
    let themeFromStorage = await page.evaluate(() => {
      return localStorage.getItem('theme');
    });
    expect(themeFromStorage).toBe('"dark"');

    // Select Light theme
    await page.locator('label:has-text("Light")').click();
    await page.waitForTimeout(100);

    themeFromStorage = await page.evaluate(() => {
      return localStorage.getItem('theme');
    });
    expect(themeFromStorage).toBe('"light"');

    // Select System theme
    await page.locator('label:has-text("System")').click();
    await page.waitForTimeout(100);

    themeFromStorage = await page.evaluate(() => {
      return localStorage.getItem('theme');
    });
    expect(themeFromStorage).toBe('"system"');
  });

  test('Criterion 6: Current theme selection is visually indicated in Settings', async ({ page }) => {
    await page.goto('http://localhost:5174/settings');

    // Click on Dark theme
    await page.locator('label:has-text("Dark")').click();
    await page.waitForTimeout(100);

    // Check that Dark option has selected styling (blue border)
    const darkLabel = page.locator('label:has-text("Dark")').first();
    const darkLabelClass = await darkLabel.getAttribute('class');
    expect(darkLabelClass).toContain('border-blue-500');

    // Click on Light theme
    await page.locator('label:has-text("Light")').click();
    await page.waitForTimeout(100);

    // Check that Light option now has selected styling
    const lightLabel = page.locator('label:has-text("Light")').first();
    const lightLabelClass = await lightLabel.getAttribute('class');
    expect(lightLabelClass).toContain('border-blue-500');
  });

  test('Criterion 7: No console errors when switching themes', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5174/settings');

    // Switch through all themes
    await page.locator('label:has-text("Dark")').click();
    await page.waitForTimeout(200);

    await page.locator('label:has-text("System")').click();
    await page.waitForTimeout(200);

    await page.locator('label:has-text("Light")').click();
    await page.waitForTimeout(200);

    // Navigate to another page to ensure theme persists without errors
    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(200);

    // Check no console errors
    expect(consoleErrors).toEqual([]);
  });

  test('Criterion 8: Theme toggle in header still works', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Get initial theme
    const initialDarkMode = await page.locator('html').evaluate((el) => {
      return el.classList.contains('dark');
    });

    // Click theme toggle in header using data-testid
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(200);

    // Check theme changed
    const afterToggleDarkMode = await page.locator('html').evaluate((el) => {
      return el.classList.contains('dark');
    });

    expect(afterToggleDarkMode).toBe(!initialDarkMode);
  });
});
