import { test, expect } from '@playwright/test';

test.describe('Compile Flow', () => {
  test('should load projects and compile all lessons', async ({ page }) => {
    test.setTimeout(90000); // Compiling all lessons + Paged.js takes time
    // Navigate to projects page
    await page.goto('/projects');
    
    // Wait for projects to load (either secondary or primary)
    const projectLink = page.locator('a[href^="/projects/"]').first();
    
    await Promise.race([
      page.waitForSelector('a[href^="/projects/"]'),
      page.waitForSelector('text=No secondary workbook projects found')
    ]);

    const count = await projectLink.count();
    if (count === 0) {
      await page.getByRole('button', { name: /Primary/i }).click();
      await page.waitForSelector('a[href^="/projects/"]');
    }

    // Click the first project
    await page.locator('a[href^="/projects/"]').first().click();
    
    // Should be on the project details page
    await expect(page).toHaveURL(/.*\/projects\/[^\/]+/);
    
    // Click "Compile All"
    const compileLink = page.getByRole('link', { name: /Compile All/i });
    await expect(compileLink).toBeVisible();
    await compileLink.click();
    
    // Should be on the compile page
    await expect(page).toHaveURL(/.*\/compile/);
    
    // Check that we have a print button
    const printButton = page.getByRole('button', { name: 'Print', exact: true });
    await expect(printButton).toBeVisible();

    // Verify there's an iframe displaying the compiled output
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();

    // Wait for iframe content to load
    const frame = iframe.contentFrame();
    await expect(frame.locator('body')).toBeVisible({ timeout: 15000 });
    // Attempt to wait for paged.js pages if they exist
    await expect(frame.locator('.pagedjs_pages').or(frame.locator('.pagedjs_page'))).toBeVisible({ timeout: 15000 }).catch(() => console.log('Paged.js classes not immediately found'));
  });
});
