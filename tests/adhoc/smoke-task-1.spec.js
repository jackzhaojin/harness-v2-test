const { test, expect } = require('@playwright/test');
const path = require('path');

const INDEX_PATH = 'file://' + path.resolve(__dirname, '../../index.html');

test('smoke: page loads without errors and all elements visible', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(INDEX_PATH);

  // Count display shows 0
  const countDisplay = page.locator('#countDisplay');
  await expect(countDisplay).toBeVisible();
  await expect(countDisplay).toHaveText('0');

  // Buttons visible
  await expect(page.locator('.btn--increment')).toBeVisible();
  await expect(page.locator('.btn--decrement')).toBeVisible();
  await expect(page.locator('.btn--reset')).toBeVisible();

  // History list present and empty
  const historyList = page.locator('#historyList');
  await expect(historyList).toBeAttached();
  await expect(historyList.locator('li')).toHaveCount(0);

  // No console errors
  expect(consoleErrors).toHaveLength(0);
});

test('functional: button colors are correct', async ({ page }) => {
  await page.goto(INDEX_PATH);

  // Check increment button is green-ish
  const incBtn = page.locator('.btn--increment');
  const incBg = await incBtn.evaluate(el => getComputedStyle(el).backgroundColor);
  // #2d6a4f = rgb(45, 106, 79)
  expect(incBg).toBe('rgb(45, 106, 79)');

  // Check decrement button is red-ish
  const decBtn = page.locator('.btn--decrement');
  const decBg = await decBtn.evaluate(el => getComputedStyle(el).backgroundColor);
  // #c0392b = rgb(192, 57, 43)
  expect(decBg).toBe('rgb(192, 57, 43)');

  // Check reset button is gray-ish
  const resetBtn = page.locator('.btn--reset');
  const resetBg = await resetBtn.evaluate(el => getComputedStyle(el).backgroundColor);
  // #6c757d = rgb(108, 117, 125)
  expect(resetBg).toBe('rgb(108, 117, 125)');
});

test('functional: CSS custom properties defined on :root', async ({ page }) => {
  await page.goto(INDEX_PATH);

  const props = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      positive: style.getPropertyValue('--color-positive').trim(),
      negative: style.getPropertyValue('--color-negative').trim(),
      reset:    style.getPropertyValue('--color-reset').trim(),
    };
  });

  expect(props.positive).toBeTruthy();
  expect(props.negative).toBeTruthy();
  expect(props.reset).toBeTruthy();
});

test('functional: layout is centered and fits viewport without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(INDEX_PATH);

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(scrollHeight).toBeLessThanOrEqual(viewportHeight + 10); // 10px tolerance

  // Content is centered (app card mid-point close to viewport center)
  const app = page.locator('.app');
  const box = await app.boundingBox();
  const vpMidX = 1280 / 2;
  const appMidX = box.x + box.width / 2;
  expect(Math.abs(appMidX - vpMidX)).toBeLessThan(5);
});
