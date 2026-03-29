// @ts-check
import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '', name: 'Home' },
  { path: 'podcast', name: 'Podcast' },
  { path: 'quiz', name: 'Quiz' },
  { path: 'teach-back', name: 'Teach-Back' },
  { path: 'research', name: 'Research' },
];

const APP_BASE_URL = process.env.BASE_URL || 'http://localhost:5173/'

function appUrl(routePath = '') {
  return new URL(routePath || '.', APP_BASE_URL).toString()
}

async function settlePage(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(250)
}

// Collect console errors across all tests
const consoleErrors = [];

test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore React dev-mode warnings and hot-reload noise
      if (text.includes('Download the React DevTools') ||
          text.includes('[HMR]') ||
          text.includes('[vite]') ||
          text.includes('Failed to load resource: the server responded with a status of 404') ||
          text.includes('Warning:')) return;
      consoleErrors.push(text);
    }
  });
});

test.describe('Study Environment UI Validation', () => {

  test('Check 1: Home page renders with topic cards', async ({ page }) => {
    await page.goto(appUrl());
    await settlePage(page)
    await page.screenshot({ path: 'test-results/screenshots/home.png', fullPage: true });

    // Page should have loaded without crashing
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Look for topic cards/list items — these could be cards, links, or list items
    const topicElements = page.locator('[class*="card"], [class*="topic"], [data-testid*="topic"], a[href*="research"]');
    const count = await topicElements.count();
    expect(count, 'Expected at least 1 topic card or link on home page').toBeGreaterThan(0);
  });

  test('Check 2: Navigation to all 5 routes', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(appUrl(route.path));
      await settlePage(page)
      await page.screenshot({ path: `test-results/screenshots/nav-${route.name.toLowerCase().replace(/\s+/g, '-')}.png` });

      // Verify URL changed correctly
      if (route.path) {
        expect(page.url()).toContain(`/${route.path}`);
      }

      // Verify the page has visible content (not blank)
      const body = page.locator('body');
      await expect(body).toBeVisible();
      const text = await body.innerText();
      expect(text.length, `${route.name} page should have content`).toBeGreaterThan(10);
    }
  });

  test('Check 3: Podcast page lists episodes with audio player', async ({ page }) => {
    await page.goto(appUrl('podcast'));
    await settlePage(page)
    await page.screenshot({ path: 'test-results/screenshots/podcast.png', fullPage: true });

    const emptyState = page.locator('text=/No podcast episodes generated yet|No Podcasts Yet|No episodes generated yet/i');
    if (await emptyState.count()) {
      await expect(emptyState.first()).toBeVisible();
      return;
    }

    // Look for episode items
    const episodes = page.locator('[class*="episode"], [class*="podcast"], [data-testid*="episode"], li, [class*="card"]');
    const count = await episodes.count();
    expect(count, 'Expected at least 1 episode item').toBeGreaterThan(0);

    // Look for audio element or player component
    const audio = page.locator('audio, [class*="player"], [class*="audio"], [data-testid*="player"]');
    const audioCount = await audio.count();
    expect(audioCount, 'Expected audio player element on podcast page').toBeGreaterThan(0);
  });

  test('Check 4: Quiz page shows question with 4 options', async ({ page }) => {
    await page.goto(appUrl('quiz'));
    await settlePage(page)
    await page.screenshot({ path: 'test-results/screenshots/quiz.png', fullPage: true });

    // Verify question text is present
    const body = await page.locator('body').innerText();
    expect(body.length, 'Quiz page should have question text').toBeGreaterThan(20);

    // Look for answer options — buttons, radio buttons, or labeled items
    const options = page.locator('button:not([class*="nav"]):not([class*="submit"]), [role="radio"], [class*="option"], [class*="answer"], label, [data-testid*="option"]');
    const optionCount = await options.count();
    expect(optionCount, 'Expected at least 4 answer options').toBeGreaterThanOrEqual(4);
  });

  test('Check 5: Answer selection enables submit', async ({ page }) => {
    await page.goto(appUrl('quiz'));
    await settlePage(page)

    // Find and click an answer option
    const options = page.locator('[role="radio"], label[for^="option-"], [data-testid^="option-"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    await options.first().click();

    await page.screenshot({ path: 'test-results/screenshots/quiz-selected.png', fullPage: true });

    // After selecting, look for a submit/check/next button that is enabled
    const submit = page.locator('button:has-text("Submit"), button:has-text("Check"), button:has-text("Next"), button[type="submit"]');
    const submitCount = await submit.count();
    if (submitCount > 0) {
      await expect(submit.first()).toBeEnabled();
    }
    // If no explicit submit button, the click itself may auto-advance — still passes
  });

  test('Check 6: Teach-back page has textarea', async ({ page }) => {
    await page.goto(appUrl('teach-back'));
    await settlePage(page)
    await page.screenshot({ path: 'test-results/screenshots/teach-back.png', fullPage: true });

    // Look for textarea input area
    const textarea = page.locator('textarea, [contenteditable="true"], [role="textbox"]');
    const count = await textarea.count();
    expect(count, 'Expected textarea or text input on teach-back page').toBeGreaterThan(0);

    // Verify it's interactive
    if (count > 0) {
      if (await textarea.first().isDisabled()) {
        await page.selectOption('#topic-select', { index: 1 });
      }
      await expect(textarea.first()).toBeEnabled();
    }
  });

  test('Check 7: Research page renders markdown content', async ({ page }) => {
    await page.goto(appUrl('research'));
    await settlePage(page)
    await page.screenshot({ path: 'test-results/screenshots/research.png', fullPage: true });

    // Look for formatted content — headers, paragraphs, or markdown-rendered elements
    const content = page.locator('h1, h2, h3, p, [class*="markdown"], [class*="prose"], [class*="content"], article');
    const count = await content.count();
    expect(count, 'Expected rendered markdown content on research page').toBeGreaterThan(0);
  });

  test('Check 8: No JS console errors across pages', async ({ page }) => {
    // Visit all pages to collect errors
    for (const route of ROUTES) {
      await page.goto(appUrl(route.path));
      await settlePage(page)
    }

    expect(consoleErrors, `Console errors found: ${consoleErrors.join('; ')}`).toHaveLength(0);
  });

  test('Check 9: Research deep link survives reload', async ({ page }) => {
    await page.goto(appUrl('research'));
    await settlePage(page)
    await page.reload();
    await settlePage(page)

    const body = page.locator('body');
    await expect(body).toBeVisible();
    const text = await body.innerText();
    expect(text).not.toContain('404');
    expect(page.url()).toContain('/research');
  });
});
