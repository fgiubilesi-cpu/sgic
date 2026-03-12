import type { Page } from '@playwright/test';

export const E2E_EMAIL = process.env.E2E_EMAIL ?? '';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';

export function hasE2ECredentials() {
  return E2E_EMAIL.trim() !== '' && E2E_PASSWORD.trim() !== '';
}

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}
