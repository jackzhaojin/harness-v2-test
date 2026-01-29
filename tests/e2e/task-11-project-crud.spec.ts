import { test, expect } from '@playwright/test';

test.describe('Task 11: Project CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean mock data state
    await page.goto('/projects');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // --- Smoke ---

  test('App loads at /projects without console errors', async ({ page }) => {
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
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  // --- New Project Button ---

  test('New Project button is visible above the projects table', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new project/i });
    await expect(newButton).toBeVisible();
  });

  // --- Create Modal ---

  test('Clicking New Project opens modal with form', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('New Project');
  });

  test('Form fields: Name, Status, Team Lead, Due Date', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const dialog = page.getByRole('dialog');

    // Name input
    await expect(dialog.locator('label', { hasText: 'Name' })).toBeVisible();
    await expect(dialog.locator('input[placeholder="Enter project name"]')).toBeVisible();

    // Status dropdown
    await expect(dialog.locator('label', { hasText: 'Status' })).toBeVisible();
    const statusSelect = dialog.locator('select#status');
    await expect(statusSelect).toBeVisible();

    // Team Lead dropdown
    await expect(dialog.locator('label', { hasText: 'Team Lead' })).toBeVisible();
    const teamLeadSelect = dialog.locator('select#team-lead');
    await expect(teamLeadSelect).toBeVisible();

    // Due Date input
    await expect(dialog.locator('label', { hasText: 'Due Date' })).toBeVisible();
    await expect(dialog.locator('input[type="date"]')).toBeVisible();
  });

  test('Status options: Active, On Hold, Completed', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const statusSelect = page.getByRole('dialog').locator('select#status');
    const options = statusSelect.locator('option');
    const optionTexts: string[] = [];
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) optionTexts.push(text);
    }
    expect(optionTexts).toContain('Active');
    expect(optionTexts).toContain('On Hold');
    expect(optionTexts).toContain('Completed');
  });

  test('Team Lead options populated from team members', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const teamLeadSelect = page.getByRole('dialog').locator('select#team-lead');
    const options = teamLeadSelect.locator('option');
    const count = await options.count();
    // Should have at least 8 team members (possibly + 1 for placeholder)
    expect(count).toBeGreaterThanOrEqual(8);
    // Check a known team member name
    await expect(teamLeadSelect).toContainText('Sarah Chen');
  });

  test('Submit button disabled until Name field is filled', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const dialog = page.getByRole('dialog');
    const submitBtn = dialog.getByRole('button', { name: /create project/i });
    await expect(submitBtn).toBeDisabled();

    // Type a name
    await dialog.locator('input[placeholder="Enter project name"]').fill('Test Project');
    await expect(submitBtn).toBeEnabled();
  });

  test('Submitting adds project and closes modal', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const dialog = page.getByRole('dialog');

    // Fill in the name
    await dialog.locator('input[placeholder="Enter project name"]').fill('My New Project');

    // Submit
    await dialog.getByRole('button', { name: /create project/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Toast should appear
    await expect(page.getByText('Project created successfully')).toBeVisible();
  });

  test('New project appears in table after creation', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[placeholder="Enter project name"]').fill('Zebra Project');
    await dialog.getByRole('button', { name: /create project/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Search for the new project
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('Zebra');
    await page.waitForTimeout(400);

    // Should find the new project
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr').first()).toContainText('Zebra Project');
  });

  test('Cancel button closes modal without saving', async ({ page }) => {
    const initialRowCount = await page.locator('tbody tr').count();

    await page.getByRole('button', { name: /new project/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[placeholder="Enter project name"]').fill('Should Not Save');
    await dialog.getByRole('button', { name: /cancel/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Row count should not change
    const afterRowCount = await page.locator('tbody tr').count();
    expect(afterRowCount).toBe(initialRowCount);
  });

  // --- Actions Dropdown ---

  test('Actions dropdown contains Edit, Archive, Delete options', async ({ page }) => {
    // Click the first kebab menu
    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();

    // Check dropdown items
    const menu = page.locator('[role="listbox"]');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Edit')).toBeVisible();
    await expect(menu.getByText('Archive')).toBeVisible();
    await expect(menu.getByText('Delete')).toBeVisible();
  });

  // --- Edit Flow ---

  test('Clicking Edit opens modal pre-filled with project data', async ({ page }) => {
    // Get the name of the first project in the table
    const firstProjectName = await page.locator('tbody tr').first().locator('td').first().textContent();

    // Click the first kebab menu
    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Edit').click();

    // Modal should open with "Edit Project" heading
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Edit Project');

    // Name field should be pre-filled
    const nameInput = dialog.locator('input[placeholder="Enter project name"]');
    const nameVal = await nameInput.inputValue();
    expect(nameVal).toBe(firstProjectName?.trim());
  });

  test('Saving Edit updates project and shows toast', async ({ page }) => {
    // Open edit for first project
    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Edit').click();

    const dialog = page.getByRole('dialog');
    const nameInput = dialog.locator('input[placeholder="Enter project name"]');
    await nameInput.fill('Updated Project Name');
    await dialog.getByRole('button', { name: /save changes/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Toast should appear
    await expect(page.getByText('Project updated successfully')).toBeVisible();

    // Search for the updated name
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill('Updated Project Name');
    await page.waitForTimeout(400);
    await expect(page.locator('tbody tr').first()).toContainText('Updated Project Name');
  });

  // --- Archive Flow ---

  test('Clicking Archive updates project status', async ({ page }) => {
    // Get first project name
    const firstProjectName = await page.locator('tbody tr').first().locator('td').first().textContent();

    // Click archive
    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Archive').click();

    // Toast should appear
    await expect(page.getByText(/archived successfully/i)).toBeVisible();

    // Find the project by search and check its badge
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill(firstProjectName?.trim() ?? '');
    await page.waitForTimeout(400);

    const archivedBadge = page.locator('tbody').getByText('Archived');
    await expect(archivedBadge).toBeVisible();
  });

  // --- Delete Flow ---

  test('Clicking Delete opens confirmation modal', async ({ page }) => {
    const firstProjectName = await page.locator('tbody tr').first().locator('td').first().textContent();

    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Delete').click();

    // Confirmation modal should appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Delete Project');
    // Should show project name
    await expect(dialog).toContainText(firstProjectName?.trim() ?? '');
    // Should show permanent warning
    await expect(dialog).toContainText('permanent');
  });

  test('Cancel in confirmation returns without deleting', async ({ page }) => {
    const initialRowCount = await page.locator('tbody tr').count();

    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Delete').click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /cancel/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Row count should not change
    const afterRowCount = await page.locator('tbody tr').count();
    expect(afterRowCount).toBe(initialRowCount);
  });

  test('Confirming delete removes project and shows toast', async ({ page }) => {
    const firstProjectName = await page.locator('tbody tr').first().locator('td').first().textContent();

    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Delete').click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^delete$/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Toast should appear
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();

    // Project should no longer be in the table
    const searchInput = page.getByLabel('Search projects');
    await searchInput.fill(firstProjectName?.trim() ?? '');
    await page.waitForTimeout(400);

    // Either no rows or row doesn't contain the deleted name
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      const firstRowText = await rows.first().textContent();
      // If there's a row, it should be the empty state or a different project
      if (firstRowText && !firstRowText.includes('No projects found')) {
        expect(firstRowText).not.toContain(firstProjectName?.trim());
      }
    }
  });

  // --- Toast Notifications ---

  test('Toast shows on create', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[placeholder="Enter project name"]').fill('Toast Test');
    await dialog.getByRole('button', { name: /create project/i }).click();
    await expect(page.getByText('Project created successfully')).toBeVisible();
  });

  test('Toast shows on edit', async ({ page }) => {
    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Edit').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Project updated successfully')).toBeVisible();
  });

  test('Toast shows on archive', async ({ page }) => {
    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Archive').click();
    await expect(page.getByText(/archived successfully/i)).toBeVisible();
  });

  test('Toast shows on delete', async ({ page }) => {
    const firstKebab = page.locator('tbody button[aria-label^="Actions for"]').first();
    await firstKebab.click();
    await page.locator('[role="listbox"]').getByText('Delete').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^delete$/i }).click();
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
  });
});
