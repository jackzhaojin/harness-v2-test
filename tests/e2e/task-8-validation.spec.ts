import { test, expect } from '@playwright/test';

test.describe('Task 8: Dashboard Page Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('AC1: Dashboard page renders at / route', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('AC2: Four stat cards in responsive grid', async ({ page }) => {
    await page.goto('/');

    // Check for exactly 4 stat cards
    const statCards = page.locator('[role="button"]').filter({ has: page.locator('p.text-sm') });
    await expect(statCards).toHaveCount(4);

    // Mobile: 1 column (verify grid-cols-1)
    await page.setViewportSize({ width: 375, height: 667 });
    const grid = page.locator('.grid').first();
    await expect(grid).toHaveClass(/grid-cols-1/);

    // Tablet: 2 columns (verify sm:grid-cols-2)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(grid).toHaveClass(/sm:grid-cols-2/);

    // Desktop: 4 columns (verify lg:grid-cols-4)
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(grid).toHaveClass(/lg:grid-cols-4/);
  });

  test('AC3: Card 1 - Total Projects with count from DataContext', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[role="button"]').filter({ hasText: 'Total Projects' });
    await expect(card).toBeVisible();

    // Verify count (should be 10 from mock data)
    await expect(card.locator('p.text-2xl')).toHaveText('10');
  });

  test('AC4: Card 2 - Active Tasks showing count of non-done tasks', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[role="button"]').filter({ hasText: 'Active Tasks' });
    await expect(card).toBeVisible();

    // From mock data: total 17 tasks, 4 done, so 13 active
    await expect(card.locator('p.text-2xl')).toHaveText('13');
  });

  test('AC5: Card 3 - Team Members with count from DataContext', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[role="button"]').filter({ hasText: 'Team Members' });
    await expect(card).toBeVisible();

    // Verify count (should be 8 from mock data)
    await expect(card.locator('p.text-2xl')).toHaveText('8');
  });

  test('AC6: Card 4 - Completed This Week showing done tasks count', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[role="button"]').filter({ hasText: 'Completed This Week' });
    await expect(card).toBeVisible();

    // From mock data: 4 tasks with status 'done'
    await expect(card.locator('p.text-2xl')).toHaveText('4');
  });

  test('AC7: Each card displays icon, label text, and large number', async ({ page }) => {
    await page.goto('/');

    const cards = [
      { label: 'Total Projects', value: '10' },
      { label: 'Active Tasks', value: '13' },
      { label: 'Team Members', value: '8' },
      { label: 'Completed This Week', value: '4' },
    ];

    for (const { label, value } of cards) {
      const card = page.locator('[role="button"]').filter({ hasText: label });

      // Check icon exists (svg inside the colored bg div)
      await expect(card.locator('svg')).toBeVisible();

      // Check label text
      await expect(card.locator('p.text-sm')).toHaveText(label);

      // Check large number (text-2xl)
      await expect(card.locator('p.text-2xl')).toHaveText(value);
    }
  });

  test('AC8: Cards have hover effect (shadow/scale transition)', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[role="button"]').filter({ hasText: 'Total Projects' });

    // Check for transition classes
    await expect(card).toHaveClass(/transition-all/);
    await expect(card).toHaveClass(/hover:shadow-lg/);
    await expect(card).toHaveClass(/hover:scale-\[1\.02\]/);
  });

  test('AC9: Clicking stat card navigates to relevant page', async ({ page }) => {
    await page.goto('/');

    // Test Total Projects -> /projects
    await page.locator('[role="button"]').filter({ hasText: 'Total Projects' }).click();
    await expect(page).toHaveURL('/projects');

    // Go back to dashboard
    await page.goto('/');

    // Test Active Tasks -> /tasks
    await page.locator('[role="button"]').filter({ hasText: 'Active Tasks' }).click();
    await expect(page).toHaveURL('/tasks');

    // Go back to dashboard
    await page.goto('/');

    // Test Team Members -> /team
    await page.locator('[role="button"]').filter({ hasText: 'Team Members' }).click();
    await expect(page).toHaveURL('/team');

    // Go back to dashboard
    await page.goto('/');

    // Test Completed This Week -> /tasks
    await page.locator('[role="button"]').filter({ hasText: 'Completed This Week' }).click();
    await expect(page).toHaveURL('/tasks');
  });

  test('AC10: Activity feed section with Recent Activity header', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible();
  });

  test('AC11: Displays last 5 activities from mock data', async ({ page }) => {
    await page.goto('/');

    // Find the activity list
    const activityList = page.locator('[role="list"]');
    const activityItems = activityList.locator('li');

    // Should show exactly 5 activities
    await expect(activityItems).toHaveCount(5);
  });

  test('AC12: Each activity shows user avatar, formatted action text, relative timestamp', async ({ page }) => {
    await page.goto('/');

    const activityList = page.locator('[role="list"]');
    const firstActivity = activityList.locator('li').first();

    // Check avatar exists
    await expect(firstActivity.locator('img[alt*="avatar"]')).toBeVisible();

    // Check action text format (should include user name, action, and target)
    const actionText = firstActivity.locator('p.text-sm').first();
    await expect(actionText).toBeVisible();

    // Check timestamp exists
    await expect(firstActivity.locator('p.text-xs')).toBeVisible();
  });

  test('AC13: Action format - [User] [action] [target]', async ({ page }) => {
    await page.goto('/');

    const activityList = page.locator('[role="list"]');
    const firstActivity = activityList.locator('li').first();

    // First activity should be Marcus Rodriguez completed task "API documentation update"
    const actionText = await firstActivity.locator('p.text-sm').first().textContent();

    // Should contain user name (Marcus Rodriguez), action (completed), and target
    expect(actionText).toContain('Marcus Rodriguez');
    expect(actionText).toContain('completed');
    expect(actionText).toContain('API documentation update');
  });

  test('AC14: Timestamps show relative time', async ({ page }) => {
    await page.goto('/');

    const activityList = page.locator('[role="list"]');
    const timestamps = activityList.locator('p.text-xs');

    // Check first timestamp
    const firstTimestamp = await timestamps.first().textContent();

    // Should be relative time format from mock data (e.g., "2 minutes ago")
    expect(firstTimestamp).toMatch(/ago|yesterday|day/i);
  });

  test('AC15: Feed items have subtle dividers between them', async ({ page }) => {
    await page.goto('/');

    // The activity list should have divide-y class for dividers
    const activityList = page.locator('[role="list"]');
    await expect(activityList).toHaveClass(/divide-y/);
  });

  test('AC16: View all link at bottom navigates to Tasks page', async ({ page }) => {
    await page.goto('/');

    const viewAllLink = page.locator('a:has-text("View all")');
    await expect(viewAllLink).toBeVisible();

    await viewAllLink.click();
    await expect(page).toHaveURL('/tasks');
  });

  test('AC17: Smoke - App loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for content to load
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Check no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
