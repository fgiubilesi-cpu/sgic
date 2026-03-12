import { expect, test } from '@playwright/test';
import { E2E_PASSWORD, hasE2ECredentials, login } from './helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(({ page }) => page.goto('/login'));

  test('user can login with configured credentials', async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');

    await login(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('user sees validation feedback with invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill(E2E_PASSWORD || 'invalid-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
