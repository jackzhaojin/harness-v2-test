import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start with defaults
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/settings');
  });

  test('renders settings page with all three sections', async ({ page }) => {
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await expect(page.getByTestId('profile-section')).toBeVisible();
    await expect(page.getByTestId('notifications-section')).toBeVisible();
    await expect(page.getByTestId('appearance-section')).toBeVisible();

    // Check section headings
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  });

  test('Profile section shows avatar, editable name, disabled email', async ({ page }) => {
    // Avatar is visible
    await expect(page.getByTestId('profile-avatar')).toBeVisible();

    // Name input is editable with default value
    const nameInput = page.getByTestId('profile-name-input');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('Sarah Chen');
    await expect(nameInput).toBeEnabled();

    // Email input is disabled
    const emailInput = page.getByTestId('profile-email-input');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue('sarah.chen@company.com');
    await expect(emailInput).toBeDisabled();
  });

  test('Change Avatar button shows Coming soon toast', async ({ page }) => {
    await page.getByTestId('change-avatar-btn').click();
    await expect(page.getByText('Coming soon!')).toBeVisible();
  });

  test('Notification toggles show correct defaults (email on, push on, slack off)', async ({ page }) => {
    // Email toggle — on
    const emailToggle = page.getByTestId('notification-toggle-email').getByRole('switch');
    await expect(emailToggle).toHaveAttribute('aria-checked', 'true');

    // Push toggle — on
    const pushToggle = page.getByTestId('notification-toggle-push').getByRole('switch');
    await expect(pushToggle).toHaveAttribute('aria-checked', 'true');

    // Slack toggle — off
    const slackToggle = page.getByTestId('notification-toggle-slack').getByRole('switch');
    await expect(slackToggle).toHaveAttribute('aria-checked', 'false');
  });

  test('Notification toggles can be toggled on/off', async ({ page }) => {
    const slackToggle = page.getByTestId('notification-toggle-slack').getByRole('switch');
    await expect(slackToggle).toHaveAttribute('aria-checked', 'false');

    // Turn on Slack
    await slackToggle.click();
    await expect(slackToggle).toHaveAttribute('aria-checked', 'true');

    // Turn off Slack
    await slackToggle.click();
    await expect(slackToggle).toHaveAttribute('aria-checked', 'false');
  });

  test('Appearance section has theme selector with Light, Dark, System options', async ({ page }) => {
    await expect(page.getByTestId('theme-option-light')).toBeVisible();
    await expect(page.getByTestId('theme-option-dark')).toBeVisible();
    await expect(page.getByTestId('theme-option-system')).toBeVisible();
  });

  test('Accent color swatches are visible and selectable', async ({ page }) => {
    const colors = ['blue', 'purple', 'green', 'orange', 'pink'];
    for (const color of colors) {
      await expect(page.getByTestId(`accent-color-${color}`)).toBeVisible();
    }

    // Select purple accent
    await page.getByTestId('accent-color-purple').click();

    // The purple swatch should now show check icon
    const purpleCheck = page.getByTestId('accent-color-purple').locator('svg');
    await expect(purpleCheck).toBeVisible();
  });

  test('Save Changes button shows loading state and success toast', async ({ page }) => {
    const saveBtn = page.getByTestId('save-settings-btn');
    await expect(saveBtn).toBeVisible();

    // Click save
    await saveBtn.click();

    // Button should show loading state
    await expect(saveBtn).toHaveAttribute('aria-busy', 'true');

    // Success toast appears
    await expect(page.getByText('Settings saved!')).toBeVisible({ timeout: 5000 });
  });

  test('Settings persist to localStorage after save and survive page refresh', async ({ page }) => {
    // Change name
    const nameInput = page.getByTestId('profile-name-input');
    await nameInput.clear();
    await nameInput.fill('John Doe');

    // Toggle Slack on
    const slackToggle = page.getByTestId('notification-toggle-slack').getByRole('switch');
    await slackToggle.click();

    // Select green accent
    await page.getByTestId('accent-color-green').click();

    // Save
    await page.getByTestId('save-settings-btn').click();
    await expect(page.getByText('Settings saved!')).toBeVisible({ timeout: 5000 });

    // Refresh the page
    await page.reload();

    // Verify persistence
    await expect(page.getByTestId('profile-name-input')).toHaveValue('John Doe');

    const slackToggleAfter = page.getByTestId('notification-toggle-slack').getByRole('switch');
    await expect(slackToggleAfter).toHaveAttribute('aria-checked', 'true');

    // Green accent check icon should be visible
    const greenCheck = page.getByTestId('accent-color-green').locator('svg');
    await expect(greenCheck).toBeVisible();
  });
});
