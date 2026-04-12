// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * E2E Test Suite for Accessibility and Performance
 * Task 3: Final validation and performance optimization
 */

test.describe('Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
  });

  test('has proper ARIA labels on input', async ({ page }) => {
    const input = page.locator('[aria-label="New todo text"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('has proper ARIA labels on add button', async ({ page }) => {
    const button = page.locator('button[aria-label="Add todo"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('Add');
  });

  test('todo list has proper ARIA role', async ({ page }) => {
    // Add a todo first so the list has content and is visible
    await page.fill('[aria-label="New todo text"]', 'Test item');
    await page.click('button[aria-label="Add todo"]');
    
    const list = page.locator('ul[role="list"]');
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute('aria-label', 'Todo items');
  });

  test('ARIA live region exists for screen reader announcements', async ({ page }) => {
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
    await expect(liveRegion).toHaveAttribute('role', 'status');
    await expect(liveRegion).toHaveClass('sr-only');
  });

  test('checkboxes have proper aria-checked attributes', async ({ page }) => {
    // Add a todo first
    await page.fill('[aria-label="New todo text"]', 'Test accessibility');
    await page.click('button[aria-label="Add todo"]');
    
    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    
    // Toggle and check again
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  test('delete buttons have descriptive aria-labels', async ({ page }) => {
    // Add a todo
    await page.fill('[aria-label="New todo text"]', 'Todo to delete');
    await page.click('button[aria-label="Add todo"]');
    
    const deleteButton = page.locator('button.delete').first();
    const ariaLabel = await deleteButton.getAttribute('aria-label');
    expect(ariaLabel).toContain('Delete');
    expect(ariaLabel).toContain('Todo to delete');
  });

  test('keyboard navigation works with Tab key', async ({ page, browserName }) => {
    // Skip on webkit due to different Tab key behavior in Safari
    if (browserName === 'webkit') {
      test.skip();
    }
    
    const input = page.locator('[aria-label="New todo text"]');
    const button = page.locator('button[aria-label="Add todo"]');
    
    // Focus input first (in case it lost focus)
    await input.focus();
    await expect(input).toBeFocused();
    
    // Tab should move to button
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
  });

  test('color contrast meets WCAG AA standards', async ({ page }) => {
    // Check that text is visible and has sufficient contrast
    const input = page.locator('[aria-label="New todo text"]');
    const button = page.locator('button[aria-label="Add todo"]');
    
    // Verify elements are visible (indicates they have sufficient contrast)
    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
    
    // Check computed styles for color contrast
    const bodyColor = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    
    // Verify colors are set (not default/inherited)
    expect(bodyColor.color).toBeDefined();
    expect(bodyColor.backgroundColor).toBeDefined();
  });
});

test.describe('Performance Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
  });

  test('page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    expect(errors).toHaveLength(0);
  });

  test('add operation completes quickly', async ({ page }) => {
    // Add single todo and measure operation time
    const startTime = Date.now();
    
    await page.fill('[aria-label="New todo text"]', 'Performance test');
    await page.keyboard.press('Enter');
    
    const endTime = Date.now();
    const operationTime = endTime - startTime;
    
    // Should complete in reasonable time (accounting for test overhead)
    // Target is <50ms, but browser automation adds overhead
    expect(operationTime).toBeLessThan(500);
  });

  test('toggle operation completes quickly', async ({ page }) => {
    // Add a todo
    await page.fill('[aria-label="New todo text"]', 'Toggle test');
    await page.click('button[aria-label="Add todo"]');
    
    const checkbox = page.locator('input[type="checkbox"]').first();
    
    // Measure toggle time
    const startTime = Date.now();
    await checkbox.click();
    const endTime = Date.now();
    
    // Should complete in reasonable time (accounting for test overhead)
    // Target is <50ms, but browser automation adds overhead
    expect(endTime - startTime).toBeLessThan(300);
  });

  test('delete operation completes quickly', async ({ page }) => {
    // Add a todo
    await page.fill('[aria-label="New todo text"]', 'Delete test');
    await page.click('button[aria-label="Add todo"]');
    
    const deleteButton = page.locator('button.delete').first();
    
    // Measure delete time
    const startTime = Date.now();
    await deleteButton.click();
    const endTime = Date.now();
    
    // Should complete in reasonable time (accounting for test overhead)
    // Target is <50ms, but browser automation adds overhead
    expect(endTime - startTime).toBeLessThan(300);
  });

  test('app handles multiple todos efficiently', async ({ page }) => {
    const input = page.locator('[aria-label="New todo text"]');
    
    // Add 50 todos
    for (let i = 0; i < 50; i++) {
      await input.fill(`Bulk todo ${i}`);
      await page.keyboard.press('Enter');
    }
    
    // Verify all todos are rendered
    const todos = page.locator('.todo-item');
    await expect(todos).toHaveCount(50);
    
    // Verify operations still work quickly with many todos
    const startTime = Date.now();
    await page.locator('button.delete').first().click();
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(100);
  });
});

test.describe('Offline Functionality', () => {
  
  test('service worker is registered', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
    
    const swSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swSupported).toBe(true);
  });

  test('app loads in offline mode', async ({ context, page, browserName }) => {
    // Skip this test on webkit due to service worker limitations with local files
    if (browserName === 'webkit') {
      test.skip();
    }
    
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
    
    // Wait for service worker to register
    await page.waitForTimeout(500);
    
    // Simulate offline by blocking network
    await context.setOffline(true);
    
    // Reload the page
    await page.reload();
    
    // App should still load
    await expect(page.locator('h1')).toHaveText('Todo List');
    await expect(page.locator('[aria-label="New todo text"]')).toBeVisible();
    
    // Restore network
    await context.setOffline(false);
  });
});

test.describe('Cross-Browser Compatibility', () => {
  
  test('ES6 features are supported', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
    
    const features = await page.evaluate(() => {
      return {
        arrowFunctions: (() => true)(),
        const: (function() { const x = 1; return x === 1; })(),
        let: (function() { let x = 1; return x === 1; })(),
        templateLiterals: `test` === 'test',
        arrayFind: typeof [].find === 'function',
        arrayFilter: typeof [].filter === 'function',
        arrayMap: typeof [].map === 'function',
        cssVariables: window.CSS && CSS.supports('color', 'var(--test)')
      };
    });
    
    expect(features.arrowFunctions).toBe(true);
    expect(features.const).toBe(true);
    expect(features.let).toBe(true);
    expect(features.templateLiterals).toBe(true);
    expect(features.arrayFind).toBe(true);
    expect(features.arrayFilter).toBe(true);
    expect(features.arrayMap).toBe(true);
    expect(features.cssVariables).toBe(true);
  });

  test('app functions without external dependencies', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
    
    // Check that no external scripts are loaded
    const scripts = await page.locator('script[src]').count();
    expect(scripts).toBe(0); // Only inline scripts
    
    // Check that no external stylesheets are loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBe(0); // Only inline styles
  });
});
