import { test, expect } from '@playwright/test';

test.describe('Lesson Editor Flow', () => {
  test('should navigate to lesson editor and verify fields', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/projects');
    
    // Wait for projects to load
    const projectLink = page.locator('a[href^="/projects/"]').first();
    
    await Promise.race([
      page.waitForSelector('a[href^="/projects/"]'),
      page.waitForSelector('text=No secondary workbook projects found')
    ]);

    const count = await projectLink.count();
    if (count === 0) {
      // If no secondary project, try primary tab
      await page.getByRole('button', { name: /Primary/i }).click();
      await page.waitForSelector('a[href^="/projects/"]');
    }

    // Click the first project
    await page.locator('a[href^="/projects/"]').first().click();
    
    // Check we're on the project details page
    await expect(page).toHaveURL(/.*\/projects\/[^\/]+/);
    
    // Check for "Edit" link on the first lesson
    const editLink = page.getByRole('link', { name: /Edit/i }).first();
    await editLink.click();
    
    // Should be on the editor page
    await expect(page).toHaveURL(/.*\/lessons\/[^\/]+/);
    
    // Verify essential editor elements exist
    await expect(page.getByText('Basic Information')).toBeVisible();
    
    // Verify some form fields
    await expect(page.getByLabel('Lesson Title')).toBeVisible();
    await expect(page.getByLabel('Level Name')).toBeVisible();
    await expect(page.getByLabel('Article Paragraphs')).toBeVisible();
    
    // Verify Save and Preview buttons
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    const previewButton = page.getByRole('button', { name: /Show Preview/i });
    await expect(previewButton).toBeVisible();

    // Interact with form
    const topicInput = page.getByLabel('Lesson Title');
    await topicInput.fill('Updated Lesson Title for E2E');
    
    // Toggle Preview
    await previewButton.click();
    await expect(page.getByRole('button', { name: /Hide Preview/i })).toBeVisible();
    await expect(page.getByText('Lesson Preview')).toBeVisible();
  });
});
