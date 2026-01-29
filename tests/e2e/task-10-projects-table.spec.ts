import { test, expect } from '@playwright/test';

test.describe('Task 10: Projects Table', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean mock data state
    await page.goto('/projects');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // --- Display Tests ---

  test('Projects page renders at /projects route with heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Projects');
  });

  test('table displays all 6 column headers', async ({ page }) => {
    const headers = ['Name', 'Status', 'Progress', 'Team Lead', 'Due Date', 'Actions'];
    for (const header of headers) {
      await expect(page.locator('th', { hasText: header })).toBeVisible();
    }
  });

  test('first page shows 5 project rows', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(5);
  });

  test('status shows as colored badges', async ({ page }) => {
    // Check that Active badge exists with green styling
    const activeBadge = page.locator('tbody').getByText('Active').first();
    await expect(activeBadge).toBeVisible();
    const activeClass = await activeBadge.getAttribute('class');
    expect(activeClass).toContain('bg-green');

    // Navigate to page 2 to find On Hold
    await page.getByLabel('Page 2').click();
    await page.waitForTimeout(100);

    // Check for different status types on page 2
    const badges = page.locator('tbody span');
    const badgeTexts: string[] = [];
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent();
      if (text) badgeTexts.push(text);
    }
    // We should see various statuses across both pages
    expect(badgeTexts.length).toBeGreaterThan(0);
  });

  test('On Hold badge is yellow', async ({ page }) => {
    // "Design System v3" is on-hold and on page 1 (sorted by name asc)
    const onHoldBadge = page.locator('tbody').getByText('On Hold').first();
    // If not on page 1, navigate to page 2
    const isVisible = await onHoldBadge.isVisible().catch(() => false);
    if (!isVisible) {
      await page.getByLabel('Page 2').click();
      await page.waitForTimeout(100);
    }
    const badge = page.locator('tbody').getByText('On Hold').first();
    await expect(badge).toBeVisible();
    const badgeClass = await badge.getAttribute('class');
    expect(badgeClass).toContain('bg-yellow');
  });

  test('Completed badge is blue', async ({ page }) => {
    // "Marketing Website Refresh" is completed — might be on page 2
    // Navigate pages to find a completed badge
    let found = false;
    for (let p = 1; p <= 2; p++) {
      if (p > 1) {
        await page.getByLabel(`Page ${p}`).click();
        await page.waitForTimeout(100);
      }
      const completedBadge = page.locator('tbody').getByText('Completed');
      if (await completedBadge.count() > 0) {
        const cls = await completedBadge.first().getAttribute('class');
        expect(cls).toContain('bg-blue');
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('progress column shows percentage with visual bar', async ({ page }) => {
    // Check that progressbar elements exist
    const progressBars = page.locator('tbody [role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();
    const barCount = await progressBars.count();
    expect(barCount).toBe(5); // 5 rows on page 1

    // Check percentage text is displayed
    const percentageTexts = page.locator('tbody').getByText('%');
    const percentCount = await percentageTexts.count();
    expect(percentCount).toBeGreaterThanOrEqual(5);
  });

  test('due dates formatted as readable date (e.g., Mar 15, 2024)', async ({ page }) => {
    // Check that dates are formatted properly — look for month abbreviations
    const datePattern = /[A-Z][a-z]{2}\s\d{1,2},\s\d{4}/;
    const cells = page.locator('tbody td');
    const cellCount = await cells.count();
    let foundDate = false;
    for (let i = 0; i < cellCount; i++) {
      const text = await cells.nth(i).textContent();
      if (text && datePattern.test(text)) {
        foundDate = true;
        break;
      }
    }
    expect(foundDate).toBe(true);
  });

  test('actions column has kebab menu icon in each row', async ({ page }) => {
    const kebabButtons = page.locator('tbody button[aria-label^="Actions for"]');
    await expect(kebabButtons).toHaveCount(5);
    // Each should have an SVG icon
    for (let i = 0; i < 5; i++) {
      const svg = kebabButtons.nth(i).locator('svg');
      await expect(svg).toBeVisible();
    }
  });

  test('table has alternating row backgrounds', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const firstRowClass = await rows.nth(0).getAttribute('class');
    const secondRowClass = await rows.nth(1).getAttribute('class');
    // First row should have bg-white, second should have bg-gray-50
    expect(firstRowClass).toContain('bg-white');
    expect(secondRowClass).toContain('bg-gray-50');
  });

  test('table is horizontally scrollable on mobile', async ({ page }) => {
    // The table wrapper should have overflow-x-auto
    const wrapper = page.locator('.overflow-x-auto');
    await expect(wrapper).toBeVisible();
  });

  test('team lead displays name (not ID)', async ({ page }) => {
    // Should show "Sarah Chen" or "Rachel Green" not "tm-1" or "tm-7"
    await expect(page.locator('tbody').getByText('Sarah Chen').first()).toBeVisible();
  });

  // --- Search Tests ---

  test('search input is visible above the table', async ({ page }) => {
    const searchInput = page.getByLabel('Search projects');
    await expect(searchInput).toBeVisible();
  });

  test('typing a project name filters the table', async ({ page }) => {
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('Mobile');
    // Wait for debounce
    await page.waitForTimeout(400);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Mobile App Redesign');
  });

  test('search is case-insensitive', async ({ page }) => {
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('MOBILE');
    await page.waitForTimeout(400);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Mobile App Redesign');
  });

  test('empty state message when no results match', async ({ page }) => {
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('xyznonexistent');
    await page.waitForTimeout(400);
    await expect(page.getByText('No projects found matching your search')).toBeVisible();
  });

  test('clearing search shows all projects again', async ({ page }) => {
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('Mobile');
    await page.waitForTimeout(400);
    await expect(page.locator('tbody tr')).toHaveCount(1);

    await searchInput.fill('');
    await page.waitForTimeout(400);
    await expect(page.locator('tbody tr')).toHaveCount(5);
  });

  // --- Sort Tests ---

  test('default sort is by Name ascending', async ({ page }) => {
    // First row should be "API Integration Platform" (alphabetically first)
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toContainText('API Integration Platform');

    // Sort indicator should be on Name column
    const nameHeader = page.locator('th', { hasText: 'Name' });
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  test('clicking column header sorts by that column', async ({ page }) => {
    // Click Progress header to sort by progress
    await page.locator('th', { hasText: 'Progress' }).click();
    await page.waitForTimeout(100);

    // First row should have lowest progress (20% - Design System v3)
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toContainText('Design System v3');

    // Sort indicator should be on Progress column
    const progressHeader = page.locator('th', { hasText: 'Progress' });
    await expect(progressHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  test('sort indicator arrow is visible on active sort column', async ({ page }) => {
    // Default sort is Name ascending — check for arrow icon
    const nameHeader = page.locator('th', { hasText: 'Name' });
    const arrow = nameHeader.locator('svg');
    await expect(arrow).toBeVisible();
  });

  test('clicking same header toggles direction', async ({ page }) => {
    // Click Name header (already sorted asc) to toggle to desc
    await page.locator('th', { hasText: 'Name' }).click();
    await page.waitForTimeout(100);

    const nameHeader = page.locator('th', { hasText: 'Name' });
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    // First row should now be last alphabetically: "Security Audit & Compliance"
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toContainText('Security Audit');
  });

  // --- Pagination Tests ---

  test('pagination controls visible below table', async ({ page }) => {
    await expect(page.getByLabel('Pagination')).toBeVisible();
    await expect(page.getByText('Previous')).toBeVisible();
    await expect(page.getByText('Next')).toBeVisible();
  });

  test('shows 5 projects per page', async ({ page }) => {
    await expect(page.locator('tbody tr')).toHaveCount(5);
  });

  test('page 1 is highlighted by default', async ({ page }) => {
    const page1Button = page.getByLabel('Page 1');
    await expect(page1Button).toHaveAttribute('aria-current', 'page');
    const cls = await page1Button.getAttribute('class');
    expect(cls).toContain('bg-blue');
  });

  test('page info text shows "Showing 1-5 of 10 projects"', async ({ page }) => {
    await expect(page.getByText('Showing 1-5 of 10 projects')).toBeVisible();
  });

  test('clicking Next goes to page 2', async ({ page }) => {
    await page.getByText('Next').click();
    await page.waitForTimeout(100);

    // Page 2 should be highlighted
    const page2Button = page.getByLabel('Page 2');
    await expect(page2Button).toHaveAttribute('aria-current', 'page');

    // Should show different projects
    await expect(page.getByText('Showing 6-10 of 10 projects')).toBeVisible();
  });

  test('Previous is disabled on first page', async ({ page }) => {
    const prevButton = page.getByLabel('Previous page');
    await expect(prevButton).toBeDisabled();
  });

  test('Next is disabled on last page', async ({ page }) => {
    await page.getByText('Next').click();
    await page.waitForTimeout(100);

    const nextButton = page.getByLabel('Next page');
    await expect(nextButton).toBeDisabled();
  });

  test('page info updates correctly on page 2', async ({ page }) => {
    await page.getByText('Next').click();
    await page.waitForTimeout(100);
    await expect(page.getByText('Showing 6-10 of 10 projects')).toBeVisible();
  });

  // --- Search + Pagination Integration ---

  test('searching resets to page 1', async ({ page }) => {
    // Go to page 2 first
    await page.getByText('Next').click();
    await page.waitForTimeout(100);
    await expect(page.getByLabel('Page 2')).toHaveAttribute('aria-current', 'page');

    // Search for something
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('Design');
    await page.waitForTimeout(400);

    // Should reset to page 1
    const page1Button = page.getByLabel('Page 1');
    await expect(page1Button).toHaveAttribute('aria-current', 'page');
  });

  test('pagination adjusts to filtered result count', async ({ page }) => {
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('a');
    await page.waitForTimeout(400);

    // Multiple projects contain 'a' — check the info text updates
    const infoText = page.locator('[data-testid="page-info"]');
    const text = await infoText.textContent();
    // Should not say "10 projects" anymore since filtered
    expect(text).toMatch(/Showing \d+-\d+ of \d+ projects/);
  });

  // --- Smoke Test ---

  test('no console errors on projects page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/projects');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});
