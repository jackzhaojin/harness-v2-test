import { test, expect } from '@playwright/test';

test.describe('Task 14: Task CRUD with Forms and Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to get fresh mock data
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('appData'));
    await page.goto('/tasks');
    await page.waitForSelector('h1');
  });

  // --- Add Task Button ---

  test('Add Task button visible at bottom of each column', async ({ page }) => {
    await expect(page.getByTestId('add-task-todo')).toBeVisible();
    await expect(page.getByTestId('add-task-in-progress')).toBeVisible();
    await expect(page.getByTestId('add-task-done')).toBeVisible();

    // All buttons should contain "Add Task" text
    await expect(page.getByTestId('add-task-todo')).toContainText('Add Task');
    await expect(page.getByTestId('add-task-in-progress')).toContainText('Add Task');
    await expect(page.getByTestId('add-task-done')).toContainText('Add Task');
  });

  // --- Add Task Form ---

  test('Clicking Add Task opens inline form with required fields', async ({ page }) => {
    await page.getByTestId('add-task-todo').click();

    const form = page.getByTestId('task-form');
    await expect(form).toBeVisible();

    // Title input
    await expect(form.locator('label', { hasText: 'Title' })).toBeVisible();
    await expect(form.locator('input[placeholder="Enter task title"]')).toBeVisible();

    // Priority select
    await expect(form.locator('label', { hasText: 'Priority' })).toBeVisible();

    // Assignee select
    await expect(form.locator('label', { hasText: 'Assignee' })).toBeVisible();

    // Due Date input
    await expect(form.locator('label', { hasText: 'Due Date' })).toBeVisible();
  });

  test('Default priority is Medium in add task form', async ({ page }) => {
    await page.getByTestId('add-task-todo').click();
    const form = page.getByTestId('task-form');
    const prioritySelect = form.locator('select#priority');
    await expect(prioritySelect).toHaveValue('medium');
  });

  test('Cancel closes form without adding task', async ({ page }) => {
    // Count existing tasks in To Do column
    const todoColumn = page.locator('[aria-label="To Do column"]');
    const initialCount = await todoColumn.locator('article').count();

    await page.getByTestId('add-task-todo').click();
    const form = page.getByTestId('task-form');
    await expect(form).toBeVisible();

    // Fill title but cancel
    await form.locator('input[placeholder="Enter task title"]').fill('Should Not Be Added');
    await form.getByRole('button', { name: /cancel/i }).click();

    // Form should be gone
    await expect(page.getByTestId('task-form')).not.toBeVisible();

    // Task count should be the same
    const afterCount = await todoColumn.locator('article').count();
    expect(afterCount).toBe(initialCount);
  });

  test('Create new task — appears in correct column', async ({ page }) => {
    const todoColumn = page.locator('[aria-label="To Do column"]');
    const initialCount = await todoColumn.locator('article').count();

    // Click Add Task
    await page.getByTestId('add-task-todo').click();
    const form = page.getByTestId('task-form');

    // Fill in title
    await form.locator('input[placeholder="Enter task title"]').fill('My Brand New Task');

    // Submit
    await form.getByRole('button', { name: /add task/i }).click();

    // Form should close
    await expect(page.getByTestId('task-form')).not.toBeVisible();

    // New task should appear
    const afterCount = await todoColumn.locator('article').count();
    expect(afterCount).toBe(initialCount + 1);

    // The new card should be visible
    await expect(todoColumn.locator('article', { hasText: 'My Brand New Task' })).toBeVisible();

    // Toast should confirm
    await expect(page.getByText('Task created')).toBeVisible();
  });

  test('New task persists after page reload', async ({ page }) => {
    // Create a task
    await page.getByTestId('add-task-todo').click();
    const form = page.getByTestId('task-form');
    await form.locator('input[placeholder="Enter task title"]').fill('Persistent Task');
    await form.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByTestId('task-form')).not.toBeVisible();

    // Reload
    await page.reload();
    await page.waitForSelector('h1');

    // Task should still be there
    const todoColumn = page.locator('[aria-label="To Do column"]');
    await expect(todoColumn.locator('article', { hasText: 'Persistent Task' })).toBeVisible();
  });

  // --- Task Detail Panel ---

  test('Clicking task card opens slide-over panel with task details', async ({ page }) => {
    // Click a known task card
    const card = page.locator('article', { hasText: 'Implement authentication API' });
    await card.click();

    // SlideOver panel should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Task Details');

    // Should show task details
    await expect(dialog).toContainText('Implement authentication API');
    await expect(dialog).toContainText('Priority');
    await expect(dialog).toContainText('Status');
    await expect(dialog).toContainText('Due Date');
    await expect(dialog).toContainText('Assignee');
  });

  test('Edit mode toggle — fields become editable, save persists changes', async ({ page }) => {
    // Click a task card
    const card = page.locator('article', { hasText: 'Implement authentication API' });
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click Edit button
    await dialog.getByRole('button', { name: /edit/i }).click();

    // Should show edit form
    const editForm = dialog.getByTestId('task-edit-form');
    await expect(editForm).toBeVisible();

    // Modify the title
    const titleInput = editForm.locator('input#title');
    await titleInput.clear();
    await titleInput.fill('Updated Auth API');

    // Save
    await dialog.getByRole('button', { name: /save changes/i }).click();

    // Should switch back to view mode with updated title
    await expect(dialog.getByTestId('task-detail-view')).toBeVisible();
    await expect(dialog).toContainText('Updated Auth API');

    // Toast should confirm
    await expect(page.getByText('Task updated')).toBeVisible();
  });

  test('Delete task with confirmation removes task from column', async ({ page }) => {
    const todoColumn = page.locator('[aria-label="To Do column"]');
    const initialCount = await todoColumn.locator('article').count();

    // Click a task card in the To Do column
    const card = todoColumn.locator('article').first();
    const taskTitle = await card.locator('h3').textContent();
    await card.click();

    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();

    // Click Delete
    await panel.getByRole('button', { name: /delete/i }).click();

    // Confirmation modal should appear
    const confirmDialog = page.getByRole('dialog').filter({ hasText: 'Delete Task' });
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(taskTitle?.trim() ?? '');

    // Confirm delete
    await confirmDialog.getByRole('button', { name: /^delete$/i }).click();

    // Panel should close
    await page.waitForTimeout(400);

    // Task should be removed
    const afterCount = await todoColumn.locator('article').count();
    expect(afterCount).toBe(initialCount - 1);

    // Toast should confirm
    await expect(page.getByText('Task deleted')).toBeVisible();
  });

  test('Panel close mechanisms — close button and Escape key', async ({ page }) => {
    // Click a task card
    const card = page.locator('article').first();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close via X button
    await dialog.getByRole('button', { name: /close panel/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Reopen
    await card.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
