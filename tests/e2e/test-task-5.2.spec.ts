import { test, expect } from '@playwright/test';

test.describe('Task 5.2: Verify modal backdrop click fix (duplicate of 5.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');
  });

  test('smoke test - app loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('HMR'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('clicking backdrop closes the modal', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Click at top-left corner of backdrop, far outside the dialog
    const backdrop = page.locator('[role="presentation"]');
    const backdropBox = await backdrop.boundingBox();
    expect(backdropBox).not.toBeNull();

    if (backdropBox) {
      await page.mouse.click(
        backdropBox.x + 5,
        backdropBox.y + 5
      );
    }

    // Modal should close
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('clicking inside modal dialog does NOT close it', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Click inside the modal body
    await modal.click();
    await page.waitForTimeout(500);

    // Modal should remain visible
    await expect(modal).toBeVisible();
  });

  test('pointer-events-none is applied to backdrop overlay', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Verify the overlay div has pointer-events: none
    const overlay = page.locator('[role="presentation"] > [aria-hidden="true"]');
    const pointerEvents = await overlay.evaluate(el => {
      return window.getComputedStyle(el).pointerEvents;
    });
    expect(pointerEvents).toBe('none');

    // Verify the overlay has the correct classes
    const className = await overlay.getAttribute('class');
    expect(className).toContain('pointer-events-none');
    expect(className).toContain('bg-black/50');

    await page.keyboard.press('Escape');
  });

  test('all modal close methods work together', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });

    // Test 1: Escape key
    await openModalBtn.click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });

    // Test 2: Close button
    await openModalBtn.click();
    await expect(modal).toBeVisible({ timeout: 3000 });
    const closeButton = modal.locator('button[aria-label="Close"]');
    await closeButton.click();
    await expect(modal).toBeHidden({ timeout: 3000 });

    // Test 3: Backdrop click
    await openModalBtn.click();
    await expect(modal).toBeVisible({ timeout: 3000 });
    const backdrop = page.locator('[role="presentation"]');
    const box = await backdrop.boundingBox();
    if (box) {
      await page.mouse.click(box.x + 5, box.y + 5);
    }
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});
