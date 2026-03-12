import { expect, test } from '@playwright/test';
import { hasE2ECredentials, login } from './helpers/auth';
import { getFirstAuditId } from './helpers/data';

test.describe('Template workflows', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.');
    await login(page);
  });

  test('template library exposes import and creation entry points', async ({ page }) => {
    await page.goto('/templates');

    await expect(page.getByRole('heading', { name: /libreria template audit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /importa excel/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /nuovo template/i })).toBeVisible();

    await page.getByRole('button', { name: /importa excel/i }).click();

    await expect(page.getByText(/import checklist da excel/i)).toBeVisible();
    await expect(page.getByText(/carica un file excel o csv/i)).toBeVisible();
    await expect(page.getByText(/file checklist/i)).toBeVisible();
  });

  test('new template page renders the shared editor', async ({ page }) => {
    await page.goto('/templates/new');

    await expect(page.getByRole('heading', { name: /nuovo template audit/i })).toBeVisible();
    await expect(page.getByPlaceholder(/HACCP Produzione/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /aggiungi domanda/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^crea template$/i })).toBeVisible();
  });

  test('audit detail shows the template workspace', async ({ page }) => {
    const auditId = await getFirstAuditId();

    await page.goto(`/audits/${auditId}?tab=templates`);

    await expect(page.getByText(/^Template attivo$/).first()).toBeVisible();
    await expect(page.getByText(/libreria template/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /cambia template/i })).toBeVisible();
  });
});
