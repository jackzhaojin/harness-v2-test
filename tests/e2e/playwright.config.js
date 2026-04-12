// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

/**
 * Playwright configuration for the counter app.
 * Tests open index.html via file:// — no dev server required.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: '.',                           // tests/e2e/ — spec files live here
  testMatch: ['**/*.spec.js', '**/*.spec.ts'],
  timeout: 30000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: path.resolve(__dirname, '../../playwright-report') }]],

  use: {
    /* Base URL is not set — spec files use page.goto('file://...') directly */
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
