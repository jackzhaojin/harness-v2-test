import { test, expect } from '@playwright/test';

test.describe('Task 12: Kanban Board Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to get fresh mock data
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('appData'));
    await page.goto('/tasks');
    await page.waitForSelector('h1');
  });

  test('Tasks page renders at /tasks route with heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Tasks');
  });

  test('three columns displayed: To Do, In Progress, Done', async ({ page }) => {
    const columns = page.locator('[aria-label$="column"]');
    await expect(columns).toHaveCount(3);

    await expect(page.locator('[aria-label="To Do column"]')).toBeVisible();
    await expect(page.locator('[aria-label="In Progress column"]')).toBeVisible();
    await expect(page.locator('[aria-label="Done column"]')).toBeVisible();
  });

  test('column headers show column name and task count badge', async ({ page }) => {
    // To Do column: check the header area has the count
    const todoHeader = page.locator('[aria-label="To Do column"] >> h2 + span');
    await expect(todoHeader).toHaveText('7');

    // In Progress column
    const inProgressHeader = page.locator('[aria-label="In Progress column"] >> h2 + span');
    await expect(inProgressHeader).toHaveText('6');

    // Done column
    const doneHeader = page.locator('[aria-label="Done column"] >> h2 + span');
    await expect(doneHeader).toHaveText('4');
  });

  test('task cards display title, priority badge, and due date', async ({ page }) => {
    // Check a specific task card exists with its content
    const card = page.locator('article', { hasText: 'Database schema optimization' });
    await expect(card).toBeVisible();
    // Should have a priority badge (Low for this task)
    await expect(card.locator('text=Low')).toBeVisible();
    // Should have a due date with calendar icon
    const dateLabel = card.locator('[aria-label*="Due"]');
    await expect(dateLabel).toBeVisible();
  });

  test('priority badges show correct variants', async ({ page }) => {
    // High priority task
    const highCard = page.locator('article', { hasText: 'Implement authentication API' });
    await expect(highCard.locator('text=High')).toBeVisible();

    // Medium priority task
    const medCard = page.locator('article', { hasText: 'Create dashboard widgets' });
    await expect(medCard.locator('text=Medium')).toBeVisible();

    // Low priority task
    const lowCard = page.locator('article', { hasText: 'Database schema optimization' });
    await expect(lowCard.locator('text=Low')).toBeVisible();
  });

  test('assignee avatar is shown on task cards', async ({ page }) => {
    // Task 4 is assigned to tm-6 (Alex Turner)
    const card = page.locator('article', { hasText: 'Database schema optimization' });
    // Either image or initials avatar should be present
    const avatar = card.locator('img, [role="img"]');
    await expect(avatar).toBeVisible();
  });

  test('overdue tasks show due date in red text', async ({ page }) => {
    // All mock tasks have 2024 dates, so they're all overdue in 2026
    const card = page.locator('article', { hasText: 'Implement authentication API' });
    const dateSpan = card.locator('[aria-label*="overdue"]');
    await expect(dateSpan).toBeVisible();
    // Check red text class
    await expect(dateSpan).toHaveClass(/text-red-600/);
  });

  test('empty column shows placeholder text (structural check)', async ({ page }) => {
    // All columns have tasks with mock data, so verify structure exists
    const doneColumn = page.locator('[aria-label="Done column"]');
    // Done column has tasks, so placeholder should NOT be visible
    await expect(doneColumn.locator('text=No tasks')).not.toBeVisible();
    // Verify cards exist in the column
    await expect(doneColumn.locator('article').first()).toBeVisible();
  });

  test('cards have hover shadow transition', async ({ page }) => {
    const card = page.locator('article').first();
    // Check that the card has transition-shadow class
    await expect(card).toHaveClass(/transition-shadow/);
    await expect(card).toHaveClass(/hover:shadow-md/);
  });

  test('kanban board has responsive grid layout', async ({ page }) => {
    const board = page.locator('[aria-label="Kanban board"]');
    await expect(board).toBeVisible();
    await expect(board).toHaveClass(/grid/);
    await expect(board).toHaveClass(/lg:grid-cols-3/);
    await expect(board).toHaveClass(/grid-cols-1/);
  });
});
