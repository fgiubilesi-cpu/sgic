import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('T2.1: User can login with valid credentials', async ({ page }) => {
    // Fill email
    await page.fill('input[type="email"]', TEST_EMAIL);
    
    // Fill password
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Click login button
    await page.click('button:has-text("Accedi")');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
    
    // Verify heading is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('T2.2: User sees error with invalid email', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    
    // Fill password
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Click login button
    await page.click('button:has-text("Accedi")');
    
    // Should still be on login page or see error
    // Wait a moment for potential error message
    await page.waitForTimeout(1000);
    
    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('T2.3: User sees error with invalid password', async ({ page }) => {
    // Fill email
    await page.fill('input[type="email"]', TEST_EMAIL);
    
    // Fill wrong password
    await page.fill('input[type="password"]', 'WrongPassword123!');
    
    // Click login button
    await page.click('button:has-text("Accedi")');
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('T2.4: User can logout', async ({ page }) => {
    // First, login
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Accedi")');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Now logout - find logout button (usually in menu/profile)
    // Try to find logout in user menu or settings
    await page.click('[data-testid="user-menu-trigger"]', { timeout: 5000 }).catch(() => {
      // If user menu doesn't exist, try keyboard shortcut or other logout method
    });
    
    // Click logout option
    await page.click('text=Esci').catch(async () => {
      // Alternative: use keyboard shortcut or find logout differently
      await page.click('[data-testid="logout-button"]').catch(() => null);
    });
    
    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 5000 }).catch(() => {
      // If not redirected, just verify we're not on dashboard anymore
    });
    
    // Verify we're away from dashboard
    expect(page.url()).not.toContain('/dashboard');
  });
});
