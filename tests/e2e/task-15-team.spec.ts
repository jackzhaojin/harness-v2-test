import { test, expect } from '@playwright/test';

test.describe('Team Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh mock data
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/team');
  });

  test('renders at /team route with heading and all 8 member cards', async ({ page }) => {
    // Page heading
    await expect(page.locator('h1')).toContainText('Team');

    // All 8 team members should be rendered
    const cards = page.locator('[class*="grid"] > div');
    await expect(cards).toHaveCount(8);

    // Result count should show 8 of 8
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 8 of 8 members');
  });

  test('member cards display avatar, name, role badge, email mailto link, and online status', async ({ page }) => {
    // Check first member - Sarah Chen (manager, online)
    // Name is visible
    await expect(page.getByText('Sarah Chen')).toBeVisible();

    // Role badge (use span locator to avoid matching <option> in the select dropdown)
    await expect(page.locator('span', { hasText: 'Manager' }).first()).toBeVisible();

    // Email as mailto link
    const emailLink = page.locator('a[href="mailto:sarah.chen@company.com"]');
    await expect(emailLink).toBeVisible();

    // Online status text
    await expect(page.locator('p', { hasText: 'Online' }).first()).toBeVisible();

    // Check an offline member - Emily Watson (designer, offline)
    await expect(page.getByText('Emily Watson')).toBeVisible();
    await expect(page.locator('span', { hasText: 'Designer' }).first()).toBeVisible();
    const emilyEmail = page.locator('a[href="mailto:emily.watson@company.com"]');
    await expect(emilyEmail).toBeVisible();
  });

  test('search input filters members by name (case-insensitive, real-time)', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search members...');
    await expect(searchInput).toBeVisible();

    // Search for "sarah" (lowercase)
    await searchInput.fill('sarah');

    // Wait for debounce
    await page.waitForTimeout(400);

    // Only Sarah Chen should be visible
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 1 of 8 members');
    await expect(page.getByText('Sarah Chen')).toBeVisible();

    // Other members should not be visible
    await expect(page.getByText('Marcus Rodriguez')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(400);
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 8 of 8 members');
  });

  test('role dropdown filters members by role and can be combined with search', async ({ page }) => {
    // Select Developer role (4 developers: Marcus, James, Alex, David)
    const roleSelect = page.locator('select');
    await roleSelect.selectOption('developer');

    await expect(page.getByTestId('team-result-count')).toContainText('Showing 4 of 8 members');
    await expect(page.getByText('Marcus Rodriguez')).toBeVisible();
    await expect(page.getByText('Sarah Chen')).not.toBeVisible();

    // Combine with search: search "alex" within developers
    const searchInput = page.getByPlaceholder('Search members...');
    await searchInput.fill('alex');
    await page.waitForTimeout(400);

    await expect(page.getByTestId('team-result-count')).toContainText('Showing 1 of 8 members');
    await expect(page.getByText('Alex Turner')).toBeVisible();
    await expect(page.getByText('Marcus Rodriguez')).not.toBeVisible();

    // Reset role to all
    await roleSelect.selectOption('');
    await page.waitForTimeout(400);
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 1 of 8 members');
    await expect(page.getByText('Alex Turner')).toBeVisible();
  });

  test('empty state message shown when no members match filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search members...');

    // Search for nonsense string
    await searchInput.fill('zzzzzznotamember');
    await page.waitForTimeout(400);

    // Result count shows 0
    await expect(page.getByTestId('team-result-count')).toContainText('Showing 0 of 8 members');

    // Empty state message is displayed
    await expect(page.getByText('No team members match your filters.')).toBeVisible();
  });
});
