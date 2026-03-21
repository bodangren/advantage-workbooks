import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe.configure({ mode: 'serial' });

test.describe('Project Management Flow', () => {
  const projectId = 'phonics-1.1-pre-a1';
  const testProjectDir = path.resolve(__dirname, `../../primary/${projectId}`);

  test.afterAll(() => {
    // Clean up the created test project directory
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  test('should create a primary project and add a lesson', async ({ page }) => {
    test.setTimeout(120000);
    
    await page.goto('/projects');
    
    // Create new primary project
    await page.getByRole('button', { name: /New Project/i }).click();
    
    // Select Primary type
    const typeSelect = page.getByRole('combobox').first();
    await typeSelect.click();
    await page.getByRole('option', { name: 'Primary (Grades 3-6)' }).click();
    
    // Select level 1.1 - Phonics
    const levelSelect = page.getByRole('combobox').nth(1);
    await levelSelect.click();
    await page.getByRole('option', { name: '1.1 - Phonics' }).click();
    
    // Create
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.locator('text=created successfully!')).toBeVisible();
    
    // Wait for dialog to hide
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
    
    // Navigate to primary tab
    await page.locator('button:has-text("Primary")').click();
    
    // Wait for project card to be visible
    const projectCard = page.getByText(projectId, { exact: true });
    await expect(projectCard).toBeVisible({ timeout: 15000 });
    await projectCard.click();
    
    // Should be on project page
    await expect(page).toHaveURL(new RegExp(`.*\\/projects\\/${projectId}`));
    
    // Add a new lesson
    await page.getByRole('button', { name: /Add Lesson/i }).click();
    await page.getByPlaceholder(/e.g. The Discovery of Fire/i).fill('Test Lesson Title');
    
    // Wait for button to be enabled
    const createLessonBtn = page.getByRole('button', { name: 'Create Lesson' });
    await expect(createLessonBtn).toBeEnabled();
    
    // Intercept the POST request to see if it succeeds
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes(`/api/projects/${projectId}/lessons`) && res.request().method() === 'POST'),
      createLessonBtn.click(),
    ]);
    
    expect(response.status()).toBe(200);
    const lessonData = await response.json();
    expect(lessonData.id).toBe('test-lesson-title_workbook');
    
    // Should redirect to the new lesson editor
    await expect(page).toHaveURL(/.*\/lessons\/test-lesson-title_workbook/, { timeout: 20000 });
    
    // The heading is the lesson ID
    await expect(page.getByRole('heading', { name: 'test-lesson-title_workbook' })).toBeVisible();
    
    // Go back to project page
    await page.goto(`/projects/${projectId}`);
    
    // Wait for the GET lessons request to finish
    await page.waitForResponse(res => res.url().includes(`/api/projects/${projectId}/lessons`) && res.request().method() === 'GET');
    
    // Verify the lesson is listed
    // In improved listLessons, 'test-lesson-title_workbook' becomes 'Test Lesson Title'
    await expect(page.locator(`text=Test Lesson Title`)).toBeVisible({ timeout: 20000 });
  });

  test('should update project settings', async ({ page }) => {
    test.setTimeout(60000);
    
    // Navigate to the test project
    await page.goto('/projects');
    await page.locator('button:has-text("Primary")').click();
    
    // Wait for project card
    const projectCard = page.getByText(projectId, { exact: true });
    await expect(projectCard).toBeVisible({ timeout: 15000 });
    await projectCard.click();
    
    // Open settings
    await page.getByRole('button', { name: /Workbook Settings/i }).click();
    
    // Check current level (should be 1.1)
    await expect(page.getByRole('combobox', { name: 'Workbook Level' })).toContainText('1.1 - Phonics');
    
    // Change to 1.2 - Phonics
    await page.getByRole('combobox', { name: 'Workbook Level' }).click();
    await page.getByRole('option', { name: '1.2 - Phonics' }).click();
    
    // Intercept the PUT request
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes(`/api/projects/${projectId}/metadata`) && res.request().method() === 'PUT'),
      page.getByRole('button', { name: 'Save Changes' }).click(),
    ]);
    
    expect(response.status()).toBe(200);
    
    // Verify metadata updated on the project page
    await expect(page.locator('text=Phonics 1.2 • Pre-A1')).toBeVisible({ timeout: 15000 });
  });
});
