import { defineConfig, devices } from '@playwright/test';

/**
 * Demo-specific Playwright configuration.
 *
 * Runs demo scripts in headed mode with generous timeouts and zero retries
 * so the viewer can watch the automated walkthrough in real time.
 *
 * Usage:
 *   npx playwright test --config=playwright.demo.config.ts
 */
export default defineConfig({
  testDir: './demo',

  /* Demo scripts are sequential showcases — no parallelism needed */
  fullyParallel: false,
  workers: 1,

  /* Never retry demo runs — failures should be immediately visible */
  retries: 0,

  /* Forbid .only — demos should always run fully */
  forbidOnly: true,

  /* Generous timeouts for demo pacing */
  timeout: 600_000,        // 10 minutes per spec (full tour)
  expect: {
    timeout: 120_000,      // 2 minutes for any assertion/highlight
  },

  /* Minimal reporter — demos aren't CI test suites */
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',

    /* Headed mode so the viewer can watch */
    headless: false,

    /* Record video for review */
    video: 'on',

    /* No tracing overhead for demos */
    trace: 'off',

    /* Default desktop viewport */
    viewport: { width: 1280, height: 720 },

    /* Slow down actions slightly for visual clarity */
    actionTimeout: 30_000,
  },

  projects: [
    {
      name: 'demo',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Reuse the same dev server pattern as the main config */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
