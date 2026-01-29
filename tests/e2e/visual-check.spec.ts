import { test, expect } from '@playwright/test';

test('Visual verification of Dashboard layout', async ({ page }) => {
  await page.goto('/');

  // Wait for content to load
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

  // Take screenshot of the full dashboard
  await page.screenshot({ path: 'dashboard-full.png', fullPage: true });

  // Verify the grid layout is correct
  const grid = page.locator('.grid').first();
  const boundingBox = await grid.boundingBox();

  // Grid should exist and be visible
  expect(boundingBox).not.toBeNull();
  expect(boundingBox!.width).toBeGreaterThan(0);

  // Check all 4 cards are visible in viewport
  const cards = page.locator('[role="button"]').filter({ has: page.locator('p.text-sm') });
  for (let i = 0; i < 4; i++) {
    await expect(cards.nth(i)).toBeVisible();
  }

  // Check activity feed is below the cards
  const activityHeader = page.locator('h2:has-text("Recent Activity")');
  await expect(activityHeader).toBeVisible();

  // Verify spacing between sections
  const dashboardTitle = page.locator('h1:has-text("Dashboard")');
  const titleBox = await dashboardTitle.boundingBox();
  const gridBox = await grid.boundingBox();
  const activityBox = await activityHeader.boundingBox();

  // Title should be above grid
  expect(titleBox!.y).toBeLessThan(gridBox!.y);

  // Grid should be above activity feed
  expect(gridBox!.y).toBeLessThan(activityBox!.y);
});
