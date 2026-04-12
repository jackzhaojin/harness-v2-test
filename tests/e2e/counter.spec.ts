import { test, expect } from '@playwright/test';
import * as path from 'path';

const INDEX_PATH = 'file://' + path.resolve(__dirname, '../../index.html');

test('counter: increment via button and ArrowUp key', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(INDEX_PATH);

  const countDisplay = page.locator('#countDisplay');

  // Click Increment
  await page.locator('.btn--increment').click();
  await expect(countDisplay).toHaveText('1');

  // Press ArrowUp
  await page.keyboard.press('ArrowUp');
  await expect(countDisplay).toHaveText('2');

  // History entries present
  await expect(page.locator('#historyList li')).toHaveCount(2);

  expect(consoleErrors).toHaveLength(0);
});

test('counter: decrement via button and ArrowDown key', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(INDEX_PATH);

  const countDisplay = page.locator('#countDisplay');

  // Click Decrement from 0
  await page.locator('.btn--decrement').click();
  await expect(countDisplay).toHaveText('-1');

  // Press ArrowDown
  await page.keyboard.press('ArrowDown');
  await expect(countDisplay).toHaveText('-2');

  // History entries present
  await expect(page.locator('#historyList li')).toHaveCount(2);

  expect(consoleErrors).toHaveLength(0);
});

test('counter: reset via button and R key', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(INDEX_PATH);

  const countDisplay = page.locator('#countDisplay');

  // Increment a few times, then reset via button
  await page.locator('.btn--increment').click();
  await page.locator('.btn--increment').click();
  await page.locator('.btn--increment').click();
  await expect(countDisplay).toHaveText('3');

  await page.locator('.btn--reset').click();
  await expect(countDisplay).toHaveText('0');

  // Increment then reset via R key
  await page.locator('.btn--increment').click();
  await expect(countDisplay).toHaveText('1');
  await page.keyboard.press('r');
  await expect(countDisplay).toHaveText('0');

  // Also test uppercase R
  await page.locator('.btn--increment').click();
  await page.keyboard.press('R');
  await expect(countDisplay).toHaveText('0');

  expect(consoleErrors).toHaveLength(0);
});

test('counter: negative color toggle via CSS class', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(INDEX_PATH);

  const countDisplay = page.locator('#countDisplay');

  // Initial: count = 0, class is 'count' only
  await expect(countDisplay).toHaveClass('count');

  // Decrement below 0: class should include 'count--negative'
  await page.locator('.btn--decrement').click();
  await expect(countDisplay).toHaveClass('count count--negative');

  // Increment back to 0: class should revert to 'count' only
  await page.locator('.btn--increment').click();
  await expect(countDisplay).toHaveClass('count');

  expect(consoleErrors).toHaveLength(0);
});

test('counter: history log capped at 10 entries, newest-first', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(INDEX_PATH);

  // Perform 11 increment actions
  for (let i = 0; i < 11; i++) {
    await page.locator('.btn--increment').click();
  }

  // History must have exactly 10 entries
  const items = page.locator('#historyList li');
  await expect(items).toHaveCount(10);

  // Newest entry (first <li>) should show count of 11
  const firstItem = items.first();
  const firstText = await firstItem.textContent();
  expect(firstText).toContain('11');

  // Oldest visible entry (last <li>) should show count of 2 (action 2, since action 1 was dropped)
  const lastItem = items.last();
  const lastText = await lastItem.textContent();
  expect(lastText).toContain('2');

  expect(consoleErrors).toHaveLength(0);
});

test('counter: no console errors during all button clicks and keyboard shortcuts', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(INDEX_PATH);

  // Exercise all buttons
  await page.locator('.btn--increment').click();
  await page.locator('.btn--decrement').click();
  await page.locator('.btn--reset').click();

  // Exercise all keyboard shortcuts
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('r');
  await page.keyboard.press('R');

  expect(consoleErrors).toHaveLength(0);
});
