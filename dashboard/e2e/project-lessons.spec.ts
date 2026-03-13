import { test, expect } from '@playwright/test';

test.describe('Project and Lesson Flows', () => {
  test('should load projects and navigate to lesson preview', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/projects');
    
    // Wait for projects to load (either secondary or primary)
    // Click on a project card - we look for links that match /projects/
    const projectLink = page.locator('a[href^="/projects/"]:not([href*="test-"])').first();
    
    // Check if there are any projects; if not, we skip the rest of the test
    // We wait briefly for either the project link or a 'No projects found' text
    await Promise.race([
      page.waitForSelector('a[href^="/projects/"]:not([href*="test-"])'),
      page.waitForSelector('text=No secondary workbook projects found')
    ]);

    const count = await projectLink.count();
    if (count === 0) {
      // If no secondary project, try primary tab
      await page.getByRole('button', { name: /Primary/i }).click();
      await page.waitForSelector('a[href^="/projects/"]:not([href*="test-"])');
    }

    // Now click the first project
    await page.locator('a[href^="/projects/"]:not([href*="test-"])').first().click();
    
    // Should be on the project details page
    await expect(page).toHaveURL(/.*\/projects\/[^\/]+/);
    
    // Check for "Compile All" button to verify page loaded
    await expect(page.getByRole('link', { name: /Compile All/i })).toBeVisible();

    // Check for "Preview" link on the first lesson
    const previewLink = page.getByRole('link', { name: /Preview/i }).first();
    await previewLink.click();
    
    // Should be on the preview page
    await expect(page).toHaveURL(/.*\/preview/);
    
    // Verify there's an iframe (the preview uses an iframe for Paged.js)
    await expect(page.locator('iframe')).toBeVisible();
  });
});