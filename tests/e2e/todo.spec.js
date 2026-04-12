// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * E2E Test Suite for Todo List Application
 * 
 * This test file covers the core user stories:
 * 1. Add New Todo
 * 2. Mark Complete
 * 3. Delete Todo
 * 4. View List
 * 5. Keyboard Accessibility
 */

test.describe('Todo App - Core Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
  });

  // ========================================
  // Smoke Tests
  // ========================================
  
  test('app loads without errors', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Todo/i);
    
    // Verify no console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Give time for any errors to surface
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('empty state is visible when no todos', async ({ page }) => {
    // Verify empty state message is visible
    await expect(page.getByText('No todos yet')).toBeVisible();
    await expect(page.getByText('Add a todo above to get started')).toBeVisible();
  });

  // ========================================
  // Add Todo Tests
  // ========================================

  test('adds a new todo via button click', async ({ page }) => {
    const todoText = 'Buy groceries';
    
    // Fill input and click add
    await page.fill('[aria-label="New todo text"]', todoText);
    await page.click('button[aria-label="Add todo"]');
    
    // Verify todo appears in list (use .todo-item span to avoid sr-only text)
    await expect(page.locator('.todo-item span').filter({ hasText: todoText })).toBeVisible();
    
    // Verify empty state is hidden
    await expect(page.getByText('No todos yet')).not.toBeVisible();
  });

  test('adds a new todo via Enter key', async ({ page }) => {
    const todoText = 'Walk the dog';
    
    // Fill input and press Enter
    await page.fill('[aria-label="New todo text"]', todoText);
    await page.press('[aria-label="New todo text"]', 'Enter');
    
    // Verify todo appears (use .todo-item span to avoid sr-only text)
    await expect(page.locator('.todo-item span').filter({ hasText: todoText })).toBeVisible();
  });

  test('empty input is blocked', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[aria-label="Add todo"]');
    
    // Verify empty state is still visible
    await expect(page.getByText('No todos yet')).toBeVisible();
  });

  test('input is focused on page load', async ({ page }) => {
    // Verify input has focus
    await expect(page.locator('[aria-label="New todo text"]')).toBeFocused();
  });

  // ========================================
  // Mark Complete Tests
  // ========================================

  test('toggles todo completion', async ({ page }) => {
    const todoText = 'Complete me';
    
    // Add a todo
    await page.fill('[aria-label="New todo text"]', todoText);
    await page.press('[aria-label="New todo text"]', 'Enter');
    
    // Click checkbox to complete
    await page.click('input[type="checkbox"]');
    
    // Verify strikethrough style (completed class)
    const todoItem = page.locator('.todo-item').first();
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('can toggle back to incomplete', async ({ page }) => {
    const todoText = 'Toggle me';
    
    // Add and complete
    await page.fill('[aria-label="New todo text"]', todoText);
    await page.press('[aria-label="New todo text"]', 'Enter');
    await page.click('input[type="checkbox"]');
    
    // Toggle back
    await page.click('input[type="checkbox"]');
    
    // Verify completed class is removed
    const todoItem = page.locator('.todo-item').first();
    await expect(todoItem).not.toHaveClass(/completed/);
  });

  // ========================================
  // Delete Todo Tests
  // ========================================

  test('deletes a todo', async ({ page }) => {
    const todoText = 'Delete me';
    
    // Add a todo
    await page.fill('[aria-label="New todo text"]', todoText);
    await page.press('[aria-label="New todo text"]', 'Enter');
    
    // Click delete button
    await page.click('button.delete');
    
    // Verify todo is removed and empty state shows
    await expect(page.getByText(todoText)).not.toBeVisible();
    await expect(page.getByText('No todos yet')).toBeVisible();
  });

  test('can add multiple todos', async ({ page }) => {
    const todos = ['First', 'Second', 'Third'];
    
    for (const text of todos) {
      await page.fill('[aria-label="New todo text"]', text);
      await page.press('[aria-label="New todo text"]', 'Enter');
    }
    
    // Verify all todos are visible (use .todo-item span to avoid sr-only text)
    for (const text of todos) {
      await expect(page.locator('.todo-item span').filter({ hasText: text })).toBeVisible();
    }
    
    // Verify correct count
    await expect(page.locator('.todo-item')).toHaveCount(3);
  });

  // ========================================
  // Accessibility Tests
  // ========================================

  test('keyboard navigation works', async ({ page }) => {
    const todoText = 'Keyboard test';
    
    // Add todo using keyboard only
    await page.fill('[aria-label="New todo text"]', todoText);
    await page.press('[aria-label="New todo text"]', 'Enter');
    
    // Tab to checkbox and interact
    await page.press('[aria-label="New todo text"]', 'Tab'); // to Add button
    await page.press('button[aria-label="Add todo"]', 'Tab'); // to checkbox
    await page.press('input[type="checkbox"]', 'Space');
    
    // Verify todo is marked complete
    const todoItem = page.locator('.todo-item').first();
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('ARIA labels are present', async ({ page }) => {
    // Verify input has aria-label
    const input = page.locator('[aria-label="New todo text"]');
    await expect(input).toHaveAttribute('aria-label', 'New todo text');
    
    // Verify add button has aria-label
    const addBtn = page.locator('button[aria-label="Add todo"]');
    await expect(addBtn).toHaveAttribute('aria-label', 'Add todo');
    
    // Verify list has aria-label
    const list = page.locator('[aria-label="Todo items"]');
    await expect(list).toHaveAttribute('role', 'list');
  });

  test('ARIA checked state updates when toggling todo', async ({ page }) => {
    const todoText = 'ARIA test';
    
    // Add a todo
    await page.fill('[aria-label="New todo text"]', todoText);
    await page.press('[aria-label="New todo text"]', 'Enter');
    
    // Get checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    
    // Verify initial aria-checked state is false
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    
    // Click to complete
    await checkbox.click();
    
    // Verify aria-checked is now true
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    
    // Click again to un-complete
    await checkbox.click();
    
    // Verify aria-checked is false again
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });
});

test.describe('Todo App - Responsive Design', () => {
  
  test('renders correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
    
    // Verify form is visible and accessible
    await expect(page.locator('#todo-form')).toBeVisible();
    await expect(page.locator('[aria-label="New todo text"]')).toBeVisible();
    
    // Test adding a todo on mobile
    await page.fill('[aria-label="New todo text"]', 'Mobile todo');
    await page.click('button[aria-label="Add todo"]');
    
    await expect(page.locator('.todo-item span').filter({ hasText: 'Mobile todo' })).toBeVisible();
  });

  test('renders correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('file://' + path.resolve(__dirname, '../../index.html'));
    
    // Verify container has appropriate width
    const container = page.locator('.container');
    const box = await container.boundingBox();
    
    // Container should be constrained
    expect(box?.width).toBeLessThanOrEqual(768);
  });
});
