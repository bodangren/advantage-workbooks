import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test('should navigate to projects page from home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Workbook Dashboard/);
    
    // Click on the Projects link/card
    const projectsLink = page.getByRole('link', { name: /Projects/i }).first();
    await projectsLink.click();
    
    // Should be on the projects page
    await expect(page).toHaveURL(/.*\/projects/);
    await expect(page.getByRole('heading', { name: 'Workbook Projects' })).toBeVisible();
  });

  test('should see project tabs', async ({ page }) => {
    await page.goto('/projects');
    
    const secondaryTab = page.getByRole('button', { name: /Secondary/i });
    const primaryTab = page.getByRole('button', { name: /Primary/i });
    
    await expect(secondaryTab).toBeVisible();
    await expect(primaryTab).toBeVisible();
  });
});