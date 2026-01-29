import { test, expect } from '@playwright/test';

test.describe('Task 5.1: Modal backdrop click closes modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Component Showcase page where Modal is demonstrated
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
    // Click "Open Modal" button
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    // Wait for modal to appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Get the presentation backdrop div
    const backdrop = page.locator('[role="presentation"]');
    await expect(backdrop).toBeVisible();

    // Click the backdrop at coordinates far from the center where the dialog is
    const backdropBox = await backdrop.boundingBox();
    expect(backdropBox).not.toBeNull();

    if (backdropBox) {
      // Click near the top-left corner, well outside the dialog
      await page.mouse.click(
        backdropBox.x + 10,
        backdropBox.y + 10
      );
    }

    // Modal should close (animate out then disappear)
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('clicking inside modal dialog does NOT close it', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Click inside the modal dialog content body
    const modalBody = modal.locator('div').first();
    await modalBody.click();

    // Wait to ensure no close animation starts
    await page.waitForTimeout(500);

    // Modal should still be visible
    await expect(modal).toBeVisible();
  });

  test('Escape key still closes the modal', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('close button (X) still closes the modal', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const closeButton = modal.locator('button[aria-label="Close"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('backdrop overlay has pointer-events-none', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: 'Open Modal' });
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Check that the overlay div has pointer-events: none
    const overlay = page.locator('[role="presentation"] > [aria-hidden="true"]');
    const pointerEvents = await overlay.evaluate(el => {
      return window.getComputedStyle(el).pointerEvents;
    });
    expect(pointerEvents).toBe('none');

    // Cleanup
    await page.keyboard.press('Escape');
  });
});
