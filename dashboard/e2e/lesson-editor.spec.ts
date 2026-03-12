import { test, expect } from '@playwright/test';

test.describe('Lesson Editor Flow', () => {
  test('should navigate to lesson editor and verify all pedagogical fields', async ({ page }) => {
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
    
    // 1. Verify Basic Information & Article fields
    await expect(page.getByText('Basic Information')).toBeVisible();
    await expect(page.getByLabel('Lesson Title')).toBeVisible();
    await expect(page.getByLabel('Level Name')).toBeVisible();
    await expect(page.getByLabel('Article Paragraphs')).toBeVisible();
    
    // 2. Verify Vocabulary fields
    await expect(page.getByLabel('Vocabulary Items')).toBeVisible();

    // 3. Verify Pedagogical Connectors
    await expect(page.getByText('Pedagogical Connectors')).toBeVisible();
    await expect(page.getByLabel('Connection Question')).toBeVisible();
    await expect(page.getByLabel('Grammar Search Term')).toBeVisible();
    await expect(page.getByLabel('Discussion Question')).toBeVisible();

    // 4. Verify Comprehension Questions
    await expect(page.getByText('Comprehension Questions')).toBeVisible();
    await expect(page.getByLabel('Questions')).toBeVisible();
    await expect(page.getByLabel('Short Answer Question')).toBeVisible();

    // 5. Verify Writing Prompt
    await expect(page.getByLabel('Writing Prompt')).toBeVisible();
    await expect(page.getByLabel('Writing Plan Prompts')).toBeVisible();
    await expect(page.getByLabel('Writing Sentence Frames')).toBeVisible();

    // 6. Verify Lesson Reflection
    await expect(page.getByText('Lesson Reflection')).toBeVisible();
    await expect(page.getByLabel('Reflection Focus')).toBeVisible();

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