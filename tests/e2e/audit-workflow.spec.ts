import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth';

test.describe('Audit explorer', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');
    await login(page);
  });

  test('audits page loads with toolbar and results', async ({ page }) => {
    await page.goto('/audits');

    await expect(page.getByRole('heading', { name: 'Audit Operations' })).toBeVisible();
    await expect(page.getByText(/Audit Explorer/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /new audit/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search title, client or location/i)).toBeVisible();
  });
});
