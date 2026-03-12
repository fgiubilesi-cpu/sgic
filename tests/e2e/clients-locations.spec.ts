import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth';

test.describe('Clients workspace', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');
    await login(page);
  });

  test('clients list loads and allows opening a client workspace', async ({ page }) => {
    await page.goto('/clients');

    await expect(page.getByRole('heading', { name: 'Clienti' })).toBeVisible();
    await expect(page.getByText(/Esplora clienti/i)).toBeVisible();

    const openClientButton = page.getByRole('link', { name: /apri scheda/i }).first();
    await expect(openClientButton).toBeVisible();
    await openClientButton.click();

    await expect(page).toHaveURL(/\/clients\/.+/);
    await expect(page.getByRole('button', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /documenti/i })).toBeVisible();
  });
});
