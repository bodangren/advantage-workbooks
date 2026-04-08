import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe.configure({ mode: 'serial' });

test.describe('Lesson Editor Persistence & AI Features', () => {
  const projectId = 'legend-15.3-c1';
  const lessonId = 'test-lesson_workbook';
  const projectDir = path.resolve(__dirname, `../../secondary/${projectId}`);

  test.beforeAll(async () => {
    // Ensure clean state
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test.afterAll(async () => {
    // Clean up
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('should create a project and lesson for persistence testing', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/projects');
    
    // Create new project
    await page.getByRole('button', { name: /New Project/i }).click();
    
    // Select Secondary type
    const typeSelect = page.getByRole('combobox').first();
    await typeSelect.click();
    await page.getByRole('option', { name: 'Secondary (Grades 7-12)' }).click();
    
    // Select level 15.3 - Legend
    const levelSelect = page.getByRole('combobox').nth(1);
    await levelSelect.click();
    await page.getByRole('option', { name: '15.3 - Legend' }).click();
    
    // Create
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.locator('text=created successfully!')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
    
    // Wait for project card and click it
    const projectCard = page.getByText(projectId, { exact: true });
    await expect(projectCard).toBeVisible({ timeout: 15000 });
    await projectCard.click();
    
    // Add a new lesson
    await page.getByRole('button', { name: /Add Lesson/i }).click();
    await page.getByPlaceholder(/e.g. The Discovery of Fire/i).fill('Test Lesson');
    await page.getByRole('button', { name: 'Create Lesson' }).click();
    
    // Should redirect to lesson editor
    await expect(page).toHaveURL(new RegExp(`.*\\/projects\\/${projectId}\\/lessons\\/${lessonId}`), { timeout: 20000 });
  });

  test('should modify fields, save, and verify persistence after reload', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`/projects/${projectId}/lessons/${lessonId}`);
    
    // 1. Modify Basic Info
    const titleInput = page.getByLabel('Lesson Title');
    await titleInput.fill('Persistence Test Title');
    
    // 2. Modify Pedagogical Connectors
    const connectionInput = page.getByLabel('Connection Question');
    await connectionInput.fill('How does persistence help you learn?');
    
    const grammarInput = page.getByLabel('Grammar Search Term');
    await grammarInput.fill('future perfect');
    
    const discussionInput = page.getByLabel('Discussion Question');
    await discussionInput.fill('Discuss the importance of E2E testing.');
    
    // 3. Save Changes
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.locator('text=Lesson saved successfully!')).toBeVisible();
    
    // 4. Reload Page
    await page.reload();
    
    // 5. Verify fields still have updated values
    await expect(page.getByLabel('Lesson Title')).toHaveValue('Persistence Test Title', { timeout: 10000 });
    await expect(page.getByLabel('Connection Question')).toHaveValue('How does persistence help you learn?');
    await expect(page.getByLabel('Grammar Search Term')).toHaveValue('future perfect');
    await expect(page.getByLabel('Discussion Question')).toHaveValue('Discuss the importance of E2E testing.');
  });

  test('should test AI prompt generation features', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`/projects/${projectId}/lessons/${lessonId}`);
    
    // Find the visual break image section
    await page.getByText('Visual Break Image').first().scrollIntoViewIfNeeded();
    
    // Click Generate Prompt
    const generateBtn = page.getByRole('button', { name: 'Generate Prompt' });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    
    // Verify the prompt textarea is populated
    const promptArea = page.getByLabel('AI Image Prompt (Editable)');
    await expect(promptArea).not.toBeEmpty();
    await expect(promptArea).toContainText('Persistence Test Title');
    
    // Test Auto-Fill Pedagogy button (Magic Wand)
    // NOTE: We might not have a real API key in CI, so we just check if it triggers
    const magicWandBtn = page.getByRole('button', { name: /Auto-Fill Pedagogy/i });
    await expect(magicWandBtn).toBeVisible();
    
    // Intercept the request to avoid actual AI call if it fails
    await page.route('**/api/projects/**/augment', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          lesson: {
            lesson_title: 'Persistence Test Title',
            connection_question: 'AI Generated Connection?',
            grammar_search_term: 'AI Grammar',
            discussion_question: 'AI Discussion?',
            short_answer_hint: 'AI Hint',
            reflection_focus: 'AI Reflection'
          },
          message: 'Lesson pedagogy auto-filled successfully!'
        })
      });
    });
    
    await magicWandBtn.click();
    await expect(page.locator('text=Pedagogical content auto-filled!')).toBeVisible();
    
    // Verify values were updated from mock
    await expect(page.getByLabel('Connection Question')).toHaveValue('AI Generated Connection?');
    await expect(page.getByLabel('Grammar Search Term')).toHaveValue('AI Grammar');
  });

  test('should toggle lesson preview', async ({ page }) => {
    await page.goto(`/projects/${projectId}/lessons/${lessonId}`);
    
    const previewBtn = page.getByRole('button', { name: /Show Preview/i });
    await previewBtn.click();
    
    await expect(page.getByText('Lesson Preview')).toBeVisible();
    await expect(page.locator('iframe[title="Lesson Preview"]')).toBeVisible();
    
    // Close using the X button in the modal
    const closeBtn = page.getByRole('button', { name: '×' });
    await closeBtn.click();
    await expect(page.getByText('Lesson Preview')).toBeHidden();
  });
});
