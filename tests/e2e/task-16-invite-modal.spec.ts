import { test, expect } from '@playwright/test';

test.describe('Team Invite Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/team');
  });

  test('Invite Member button is visible above the team grid', async ({ page }) => {
    const btn = page.getByTestId('invite-member-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Invite Member');
  });

  test('clicking Invite Member opens modal with email input and placeholder', async ({ page }) => {
    await page.getByTestId('invite-member-btn').click();

    // Modal header
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Invite Member')).toBeVisible();

    // Email input with placeholder
    const emailInput = page.getByTestId('invite-email-input');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'colleague@company.com');
  });

  test('submit button is disabled for empty and invalid emails, enabled for valid email', async ({ page }) => {
    await page.getByTestId('invite-member-btn').click();

    const submitBtn = page.getByTestId('invite-submit-btn');
    const emailInput = page.getByTestId('invite-email-input');

    // Disabled when empty
    await expect(submitBtn).toBeDisabled();

    // Disabled for invalid email (no @)
    await emailInput.fill('invalidemail');
    await expect(submitBtn).toBeDisabled();

    // Disabled for incomplete email (no .)
    await emailInput.fill('user@domain');
    await expect(submitBtn).toBeDisabled();

    // Enabled for valid email
    await emailInput.fill('user@domain.com');
    await expect(submitBtn).toBeEnabled();
  });

  test('invalid email shows error styling after blur', async ({ page }) => {
    await page.getByTestId('invite-member-btn').click();

    const emailInput = page.getByTestId('invite-email-input');

    // Type invalid email then blur to trigger touched
    await emailInput.fill('bad-email');
    await emailInput.blur();

    // Error message should appear
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();

    // Input should have aria-invalid
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('submitting valid email shows success toast and closes modal', async ({ page }) => {
    await page.getByTestId('invite-member-btn').click();

    const emailInput = page.getByTestId('invite-email-input');
    await emailInput.fill('test@example.com');
    await page.getByTestId('invite-submit-btn').click();

    // Toast shows success message
    await expect(page.getByText('Invite sent to test@example.com!')).toBeVisible();

    // Modal should close (dialog no longer visible)
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('cancel button closes modal without sending invite', async ({ page }) => {
    await page.getByTestId('invite-member-btn').click();

    // Fill in an email
    await page.getByTestId('invite-email-input').fill('someone@example.com');

    // Cancel
    await page.getByTestId('invite-cancel-btn').click();

    // Modal closes — wait for animation
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // No toast should appear
    await expect(page.getByText('Invite sent to')).not.toBeVisible();
  });

  test('form resets when modal reopens', async ({ page }) => {
    // Open and fill email
    await page.getByTestId('invite-member-btn').click();
    await page.getByTestId('invite-email-input').fill('test@example.com');

    // Cancel to close
    await page.getByTestId('invite-cancel-btn').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Reopen
    await page.getByTestId('invite-member-btn').click();

    // Email field should be empty
    await expect(page.getByTestId('invite-email-input')).toHaveValue('');

    // Submit button should be disabled (empty = invalid)
    await expect(page.getByTestId('invite-submit-btn')).toBeDisabled();
  });
});
