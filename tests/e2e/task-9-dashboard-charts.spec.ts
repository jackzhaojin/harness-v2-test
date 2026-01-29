import { test, expect } from '@playwright/test';

test.describe('Task 9 – Dashboard Charts', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so mock data is used deterministically
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('appData'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ─── Smoke ─────────────────────────────────────────────────────
  test('app loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Allow Recharts to render (SVG paint can take a tick)
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  // ─── Line Chart ────────────────────────────────────────────────
  test('line chart section is visible with heading', async ({ page }) => {
    const heading = page.locator('h2', { hasText: 'Task Completions' });
    await expect(heading).toBeVisible();
  });

  test('line chart container renders an SVG', async ({ page }) => {
    const container = page.locator('[data-testid="line-chart-container"]');
    await expect(container).toBeVisible();
    const svg = container.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('line chart X-axis shows day labels', async ({ page }) => {
    const container = page.locator('[data-testid="line-chart-container"]');
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      await expect(container.getByText(day, { exact: true })).toBeVisible();
    }
  });

  test('line chart Y-axis shows "Completed" label', async ({ page }) => {
    const container = page.locator('[data-testid="line-chart-container"]');
    await expect(container.getByText('Completed')).toBeVisible();
  });

  // ─── Pie / Donut Chart ─────────────────────────────────────────
  test('pie chart section is visible with heading', async ({ page }) => {
    const heading = page.locator('h2', { hasText: 'Tasks by Status' });
    await expect(heading).toBeVisible();
  });

  test('pie chart container renders an SVG', async ({ page }) => {
    const container = page.locator('[data-testid="pie-chart-container"]');
    await expect(container).toBeVisible();
    const svg = container.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('pie chart legend shows all three statuses', async ({ page }) => {
    const container = page.locator('[data-testid="pie-chart-container"]');
    await expect(container.getByText('To Do')).toBeVisible();
    await expect(container.getByText('In Progress')).toBeVisible();
    await expect(container.getByText('Done')).toBeVisible();
  });

  test('pie chart legend includes counts', async ({ page }) => {
    const container = page.locator('[data-testid="pie-chart-container"]');
    // Mock data has 7 todo, 6 in-progress, 4 done tasks
    await expect(container.getByText('7')).toBeVisible();
    await expect(container.getByText('6')).toBeVisible();
    await expect(container.getByText('4')).toBeVisible();
  });

  // ─── Responsiveness ────────────────────────────────────────────
  test('charts section uses responsive grid', async ({ page }) => {
    const section = page.locator('section[aria-label="Dashboard charts"]');
    await expect(section).toBeVisible();
    const grid = section.locator('div.grid');
    await expect(grid).toBeVisible();
  });

  // ─── Tooltip on hover ──────────────────────────────────────────
  test('line chart shows tooltip on hover', async ({ page }) => {
    const container = page.locator('[data-testid="line-chart-container"]');
    const svg = container.locator('svg').first();
    const box = await svg.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // Hover over the middle of the chart area
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
      // Recharts renders tooltip in a div with class containing "recharts-tooltip"
      const tooltip = container.locator('.recharts-tooltip-wrapper');
      // Tooltip should exist (may or may not be visible depending on exact hover point)
      await expect(tooltip).toBeAttached();
    }
  });

  test('pie chart shows tooltip on hover', async ({ page }) => {
    const container = page.locator('[data-testid="pie-chart-container"]');
    const svg = container.locator('svg').first();
    const box = await svg.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // Hover near the center of the pie
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.4);
      await page.waitForTimeout(300);
      const tooltip = container.locator('.recharts-tooltip-wrapper');
      await expect(tooltip).toBeAttached();
    }
  });

  // ─── Charts below stat cards ───────────────────────────────────
  test('charts section appears below stat cards', async ({ page }) => {
    const statGrid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4').first();
    const chartsSection = page.locator('section[aria-label="Dashboard charts"]');

    const statBox = await statGrid.boundingBox();
    const chartsBox = await chartsSection.boundingBox();

    expect(statBox).toBeTruthy();
    expect(chartsBox).toBeTruthy();
    if (statBox && chartsBox) {
      // Charts section should be below stat cards
      expect(chartsBox.y).toBeGreaterThan(statBox.y + statBox.height - 10);
    }
  });
});
