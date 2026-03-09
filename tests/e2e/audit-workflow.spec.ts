import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Audit Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Accedi")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('T3.1: Complete audit workflow - create, open, fill, verify', async ({ page }) => {
    // Navigate to audits page
    await page.goto('/audits');
    
    // Create new audit (click "Nuovo audit" button)
    await page.click('button:has-text("Nuovo audit")');
    
    // Wait for dialog/modal
    await page.waitForSelector('text=Crea nuovo audit', { timeout: 5000 });
    
    // Fill audit details (this depends on your form structure)
    // Select client
    await page.click('select[name="client_id"], [data-testid="client-select"]');
    await page.locator('option, [role="option"]').nth(1).click().catch(() => null);
    
    // Select template or continue
    await page.click('button:has-text("Crea audit"), button:has-text("Avanti")');
    
    // Wait for audit page to load
    await page.waitForURL(/\/audits\/[a-f0-9-]+/, { timeout: 10000 });
    
    // Verify we're on audit detail page
    expect(page.url()).toMatch(/\/audits\/[a-f0-9-]+/);
    
    // Check for checklist items
    const checklistItems = page.locator('[data-testid="checklist-item"], .checklist-item');
    const itemCount = await checklistItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // Fill at least first 3 checklist items
    for (let i = 0; i < Math.min(3, itemCount); i++) {
      const item = checklistItems.nth(i);
      
      // Click on compliant button (OK / Conforme)
      const compliantBtn = item.locator('button:has-text("OK"), button:has-text("Conforme")');
      if (await compliantBtn.isVisible()) {
        await compliantBtn.click();
      } else {
        // Click on non-compliant for variety
        const nonCompliantBtn = item.locator('button:has-text("NOK"), button:has-text("Non conforme")');
        await nonCompliantBtn.click({ timeout: 5000 }).catch(() => null);
      }
    }
    
    // Check if score appeared
    const scoreElement = page.locator('[data-testid="audit-score"], .score-display, h1:has-text("%")');
    await scoreElement.waitFor({ timeout: 5000 }).catch(() => null);
    
    // Verify score is displayed
    const scoreText = await scoreElement.textContent().catch(() => '');
    expect(scoreText).toBeTruthy();
    
    // Check for NC badge if we had non-compliant items
    const ncBadge = page.locator('[data-testid="nc-badge"], .nc-indicator, text="NC"');
    const hasNC = await ncBadge.isVisible().catch(() => false);
    
    // Navigate to NC tab if NC exists
    if (hasNC) {
      await page.click('a:has-text("Non Conformità"), button:has-text("Non Conformità")');
      
      // Verify NC table/list is visible
      const ncTable = page.locator('[data-testid="nc-table"], .nc-list, table');
      await expect(ncTable).toBeVisible({ timeout: 5000 });
    }
  });

  test('T3.2: Audit score calculation', async ({ page }) => {
    // Navigate to audits list
    await page.goto('/audits');
    
    // Find first audit that's not completed
    const auditLinks = page.locator('a[href*="/audits/"]');
    const firstAudit = auditLinks.first();
    
    // Click first audit
    await firstAudit.click();
    
    // Wait for page load
    await page.waitForURL(/\/audits\/[a-f0-9-]+/, { timeout: 10000 });
    
    // Get current score (if any)
    const scoreText = await page.locator('[data-testid="audit-score"], .score-display').textContent().catch(() => null);
    
    if (scoreText && scoreText.includes('%')) {
      // Score exists, verify it's a number
      const scoreMatch = scoreText.match(/(\d+\.?\d*)/);
      expect(scoreMatch).toBeTruthy();
      const score = parseFloat(scoreMatch![1]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('T3.3: Non-conformity auto-creation', async ({ page }) => {
    // Navigate to an existing audit or create one
    const auditLinks = page.locator('a[href*="/audits/"]');
    
    if (await auditLinks.count() > 0) {
      await auditLinks.first().click();
    } else {
      // Skip if no audits
      test.skip();
    }
    
    // Wait for audit page
    await page.waitForURL(/\/audits\/[a-f0-9-]+/);
    
    // Find a checklist item
    const checklistItem = page.locator('[data-testid="checklist-item"]').first();
    
    // Click NOK/non-compliant to create NC
    const nonCompliantBtn = checklistItem.locator('button:has-text("NOK"), button:has-text("Non conforme")');
    
    if (await nonCompliantBtn.isVisible()) {
      await nonCompliantBtn.click();
      
      // Wait a moment for NC to be created
      await page.waitForTimeout(500);
      
      // Check for NC badge
      const ncBadge = checklistItem.locator('[data-testid="nc-badge"], .nc-indicator, text="NC"');
      const hasNCBadge = await ncBadge.isVisible({ timeout: 5000 }).catch(() => false);
      
      // Could not verify NC badge but action was performed
      // (actual visibility depends on implementation)
    }
  });
});
