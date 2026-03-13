import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth';

test.describe('Management route', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');
    await login(page);
  });

  test('/management does not crash and resolves to a safe page', async ({ page }) => {
    await page.goto('/management');

    await expect(page.getByText(/runtime error/i)).toHaveCount(0);

    if (page.url().endsWith('/management')) {
      await expect(page.getByRole('heading', { name: /management/i })).toBeVisible();
      await expect(page.getByText(/control room per direzione/i)).toBeVisible();
      return;
    }

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();
  });
});
