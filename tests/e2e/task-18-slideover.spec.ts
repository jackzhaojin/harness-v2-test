import { test, expect } from '@playwright/test';

test.describe('Task 18: SlideOver Panel Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tasks page where SlideOver is used
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('appData'));
    await page.goto('/tasks');
    await page.waitForSelector('h1');
  });

  test('SlideOver panel renders via React Portal with role="dialog"', async ({ page }) => {
    // Click a task card to open SlideOver
    const card = page.locator('article').first();
    await card.click();

    // SlideOver should render as a dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Should have aria-modal="true" for accessibility
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Dialog should be rendered as a portal (direct child of body, outside app root)
    const portalContainer = page.locator('body > div[role="presentation"]');
    await expect(portalContainer).toBeVisible();
  });

  test('SlideOver slides in from right side of viewport', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The panel should be on the right side — check its position
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (box && viewport) {
      // Panel right edge should align near the viewport right edge
      const panelRightEdge = box.x + box.width;
      expect(panelRightEdge).toBeGreaterThan(viewport.width - 5);
    }

    // Check the slide-in animation class is applied
    await expect(dialog).toHaveClass(/animate-slide-in-right/);
  });

  test('Semi-transparent backdrop is visible behind panel', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Check backdrop overlay exists with bg-black/50
    const backdrop = page.locator('body > div[role="presentation"] .bg-black\\/50');
    await expect(backdrop).toBeVisible();
  });

  test('Panel has header with title and close button', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Header should contain title text
    await expect(dialog).toContainText('Task Details');

    // Close button with aria-label should exist
    const closeButton = dialog.getByRole('button', { name: /close panel/i });
    await expect(closeButton).toBeVisible();
  });

  test('Panel has scrollable body area for content', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Body area should exist with overflow-y-auto for scrolling
    const bodyArea = dialog.locator('.overflow-y-auto');
    await expect(bodyArea).toBeVisible();
  });

  test('Panel has footer area with action buttons', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Footer should have Delete and Edit buttons
    await expect(dialog.getByRole('button', { name: /delete/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /edit/i })).toBeVisible();
  });

  test('Close button (X) in header closes panel', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click close button
    await dialog.getByRole('button', { name: /close panel/i }).click();

    // Wait for animation to complete (300ms)
    await page.waitForTimeout(400);

    // Panel should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Clicking backdrop closes panel', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click the backdrop (the presentation layer, not the dialog itself)
    // We need to click on the left side of the backdrop where the panel isn't
    const presentationLayer = page.locator('body > div[role="presentation"]');
    const box = await presentationLayer.boundingBox();
    if (box) {
      // Click on the left quarter of the screen (where backdrop is, not panel)
      await page.mouse.click(box.x + 50, box.y + box.height / 2);
    }

    // Wait for animation to complete
    await page.waitForTimeout(400);

    // Panel should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Pressing Escape key closes panel', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Wait for animation to complete
    await page.waitForTimeout(400);

    // Panel should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Focus is trapped inside panel when open', async ({ page }) => {
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Wait for focus trap to activate
    await page.waitForTimeout(100);

    // Verify focus is within the dialog
    const activeElementInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(document.activeElement) ?? false;
    });
    expect(activeElementInDialog).toBe(true);

    // Tab through all focusable elements — focus should stay in dialog
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const stillInDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement) ?? false;
      });
      expect(stillInDialog).toBe(true);
    }
  });

  test('Panel works correctly in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.goto('/settings');
    await page.waitForSelector('h1');

    // Find and click the dark mode toggle
    const themeToggle = page.getByRole('button', { name: /toggle.*theme|dark.*mode|light.*mode/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
    } else {
      // Fallback: Set dark mode via evaluate
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
    }

    // Navigate to tasks
    await page.goto('/tasks');
    await page.waitForSelector('h1');

    // Open a task panel
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify dark mode styles are applied — dialog panel should have dark bg
    const hasDarkBg = await dialog.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const bg = styles.backgroundColor;
      // Dark bg-gray-800 is approximately rgb(31, 41, 55)
      return bg !== 'rgb(255, 255, 255)'; // Not white = dark mode working
    });
    // If dark class is active on html, the panel bg should be dark
    const isDarkMode = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (isDarkMode) {
      expect(hasDarkBg).toBe(true);
    }

    // Panel should still be functional in dark mode
    await expect(dialog).toContainText('Task Details');
    await expect(dialog.getByRole('button', { name: /close panel/i })).toBeVisible();
  });

  test('SlideOver onClose callback is called when panel closes', async ({ page }) => {
    // Open panel
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close panel
    await dialog.getByRole('button', { name: /close panel/i }).click();
    await page.waitForTimeout(400);

    // Panel should be closed (onClose was called, parent cleared selectedTask)
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Open again to verify it can re-open (proves state reset correctly)
    await card.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
