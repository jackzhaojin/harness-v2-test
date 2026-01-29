import { test, expect } from '@playwright/test';

test.describe('Task 8: Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean mock data state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard renders at / route', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('four stat cards are visible', async ({ page }) => {
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active Tasks')).toBeVisible();
    await expect(page.getByText('Team Members')).toBeVisible();
    await expect(page.getByText('Completed This Week')).toBeVisible();
  });

  test('stat cards display correct counts from data', async ({ page }) => {
    // Total Projects: 10 projects in mock data
    const projectCard = page.locator('[aria-label*="Total Projects"]');
    await expect(projectCard).toBeVisible();
    await expect(projectCard).toContainText('10');

    // Active Tasks: tasks with status !== 'done' = 13 (17 total - 4 done)
    const activeTasksCard = page.locator('[aria-label*="Active Tasks"]');
    await expect(activeTasksCard).toBeVisible();
    await expect(activeTasksCard).toContainText('13');

    // Team Members: 8 in mock data
    const teamCard = page.locator('[aria-label*="Team Members"]');
    await expect(teamCard).toBeVisible();
    await expect(teamCard).toContainText('8');

    // Completed This Week: tasks with status === 'done' = 4
    const completedCard = page.locator('[aria-label*="Completed This Week"]');
    await expect(completedCard).toBeVisible();
    await expect(completedCard).toContainText('4');
  });

  test('each stat card has an icon', async ({ page }) => {
    // Check that SVG icons are present inside each stat card
    const statCards = page.locator('[role="button"][aria-label*="Click to view"]');
    const count = await statCards.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      const svg = statCards.nth(i).locator('svg');
      await expect(svg).toBeVisible();
    }
  });

  test('clicking Total Projects card navigates to /projects', async ({ page }) => {
    const card = page.locator('[aria-label*="Total Projects"]');
    await card.click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test('clicking Active Tasks card navigates to /tasks', async ({ page }) => {
    const card = page.locator('[aria-label*="Active Tasks"]');
    await card.click();
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('clicking Team Members card navigates to /team', async ({ page }) => {
    const card = page.locator('[aria-label*="Team Members"]');
    await card.click();
    await expect(page).toHaveURL(/\/team/);
  });

  test('clicking Completed This Week card navigates to /tasks', async ({ page }) => {
    const card = page.locator('[aria-label*="Completed This Week"]');
    await card.click();
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('stat cards have hover effect classes', async ({ page }) => {
    const card = page.locator('[aria-label*="Total Projects"]');
    // Check that the card has transition classes for hover effects
    const classValue = await card.getAttribute('class');
    expect(classValue).toContain('hover:shadow-lg');
    expect(classValue).toContain('hover:scale-');
    expect(classValue).toContain('transition-all');
  });

  test('Recent Activity header is visible', async ({ page }) => {
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });

  test('activity feed shows 5 items', async ({ page }) => {
    const activityItems = page.locator('ul[role="list"] li');
    await expect(activityItems).toHaveCount(5);
  });

  test('activity items display user name and action text', async ({ page }) => {
    // First activity: Marcus Rodriguez completed task "API documentation update"
    const firstItem = page.locator('ul[role="list"] li').first();
    await expect(firstItem).toContainText('Marcus Rodriguez');
    await expect(firstItem).toContainText('completed');
    await expect(firstItem).toContainText('API documentation update');
  });

  test('activity items display relative timestamps', async ({ page }) => {
    const firstItem = page.locator('ul[role="list"] li').first();
    await expect(firstItem).toContainText('2 minutes ago');
  });

  test('activity items have user avatars', async ({ page }) => {
    const activityItems = page.locator('ul[role="list"] li');
    const count = await activityItems.count();
    expect(count).toBe(5);

    for (let i = 0; i < count; i++) {
      // Check for either img avatar or initials avatar
      const item = activityItems.nth(i);
      const hasImg = await item.locator('img').count();
      const hasInitials = await item.locator('[role="img"]').count();
      expect(hasImg + hasInitials).toBeGreaterThan(0);
    }
  });

  test('feed items have dividers between them', async ({ page }) => {
    // The ul has divide-y class for subtle dividers
    const ul = page.locator('ul[role="list"]');
    const classValue = await ul.getAttribute('class');
    expect(classValue).toContain('divide-y');
  });

  test('View all link navigates to tasks page', async ({ page }) => {
    const viewAllLink = page.getByText('View all');
    await expect(viewAllLink).toBeVisible();
    await viewAllLink.click();
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('responsive grid: 4 columns on desktop', async ({ page }) => {
    // Check the grid container has responsive column classes
    const grid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    await expect(grid).toBeVisible();
  });

  test('no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});
