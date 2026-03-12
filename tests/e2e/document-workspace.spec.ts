import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth';

test.describe('Client document workspace', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');
    await login(page);
  });

  test('documents tab exposes operational archive controls', async ({ page }) => {
    await page.goto('/clients');

    const openClientButton = page.getByRole('link', { name: /apri scheda/i }).first();
    await expect(openClientButton).toBeVisible();
    await openClientButton.click();

    await expect(page).toHaveURL(/\/clients\/.+/);

    await page.getByRole('button', { name: /documenti/i }).click();

    await expect(page.getByText(/archivio documentale/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /da validare/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /scaduti/i })).toBeVisible();
    await expect(page.getByPlaceholder(/titolo, descrizione o nome file/i)).toBeVisible();

    await page.getByRole('button', { name: /contratti/i }).click();
    await expect(page.getByText(/documenti visibili su/i)).toBeVisible();
  });
});
