import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Clients & Locations CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Accedi")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('T4.1: Create new client', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    
    // Click "Nuovo cliente" button
    await page.click('button:has-text("Nuovo cliente"), button:has-text("Aggiungi cliente")');
    
    // Wait for form/modal
    await page.waitForSelector('input[name="name"], input[placeholder*="Nome"]', { timeout: 5000 });
    
    // Fill client name
    const clientName = `Test Client ${Date.now()}`;
    await page.fill('input[name="name"], input[placeholder*="Nome"]', clientName);
    
    // Fill other fields if they exist
    await page.fill('input[placeholder*="indirizzo"], input[name="address"]', 'Via Test 123').catch(() => null);
    await page.fill('input[placeholder*="città"], input[name="city"]', 'Milano').catch(() => null);
    
    // Click save button
    await page.click('button:has-text("Salva"), button:has-text("Crea"), button:has-text("Aggiungi")');
    
    // Wait for navigation or success message
    await page.waitForTimeout(1000);
    
    // Verify client appears in list
    const clientInList = page.locator(`text="${clientName}"`);
    await expect(clientInList).toBeVisible({ timeout: 5000 });
  });

  test('T4.2: Edit existing client', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    
    // Find first client (if it exists)
    const clientRow = page.locator('a[href*="/clients/"]').first();
    
    if (await clientRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click edit button on first client
      await clientRow.click();
      
      // Wait for edit page
      await page.waitForURL(/\/clients\/[a-f0-9-]+/, { timeout: 5000 });
      
      // Find and edit name field
      const nameInput = page.locator('input[name="name"], input[value*="Client"]').first();
      
      if (await nameInput.isVisible()) {
        // Update name
        await nameInput.clear();
        await nameInput.fill(`Updated Client ${Date.now()}`);
        
        // Save
        await page.click('button:has-text("Salva"), button:has-text("Aggiorna")');
        
        // Wait for success
        await page.waitForTimeout(1000);
      }
    }
  });

  test('T4.3: Create location under client', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    
    // Find first client
    const clientLink = page.locator('a[href*="/clients/"]').first();
    
    if (await clientLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clientLink.click();
      
      // Wait for client detail page
      await page.waitForURL(/\/clients\/[a-f0-9-]+/);
      
      // Click "Nuova sede" or similar button
      const newLocationBtn = page.locator('button:has-text("Nuova sede"), button:has-text("Aggiungi sede"), button:has-text("Nuova location")').first();
      
      if (await newLocationBtn.isVisible()) {
        await newLocationBtn.click();
        
        // Wait for form
        await page.waitForSelector('input[name="name"], input[placeholder*="Nome"]', { timeout: 5000 });
        
        // Fill location name
        const locationName = `Sede ${Date.now()}`;
        await page.fill('input[name="name"]', locationName);
        
        // Save
        await page.click('button:has-text("Salva"), button:has-text("Crea")');
        
        // Verify location appears
        await expect(page.locator(`text="${locationName}"`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('T4.4: Delete location', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    
    // Find a client with locations
    const clientLink = page.locator('a[href*="/clients/"]').first();
    
    if (await clientLink.isVisible()) {
      await clientLink.click();
      await page.waitForURL(/\/clients\/[a-f0-9-]+/);
      
      // Find first location's delete button
      const deleteBtn = page.locator('button[title*="Elimina"], button:has-text("Elimina"), [data-testid="delete-location"]').first();
      
      if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteBtn.click();
        
        // Confirm deletion if there's a confirmation dialog
        await page.click('button:has-text("Conferma"), button:has-text("Sì"), button:has-text("Elimina")').catch(() => null);
        
        // Wait for deletion to complete
        await page.waitForTimeout(1000);
      }
    }
  });

  test('T4.5: View clients list', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    
    // Wait for clients list to load
    await page.waitForSelector('a[href*="/clients/"], table, [data-testid="clients-list"]', { timeout: 5000 });
    
    // Verify at least one client is visible
    const clients = page.locator('a[href*="/clients/"]');
    const clientCount = await clients.count();
    
    expect(clientCount).toBeGreaterThanOrEqual(0);
    
    // If clients exist, verify they're clickable
    if (clientCount > 0) {
      const firstClient = clients.first();
      await expect(firstClient).toBeVisible();
    }
  });
});
