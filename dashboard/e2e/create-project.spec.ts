import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Create Project Flow', () => {
  const testProjectDir = path.resolve(__dirname, '../../secondary/origins-1-a1');

  test.afterAll(() => {
    // Clean up the created test project directory
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  test('should open the dialog and create a new project', async ({ page }) => {
    await page.goto('/projects');
    
    // Click "New Project" button
    const newProjectBtn = page.getByRole('button', { name: /New Project/i });
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();
    
    // Verify dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: /Create New Workbook Project/i })).toBeVisible();
    
    // Open the Level select (it should say "Select level...")
    const levelSelectTrigger = page.getByRole('combobox').nth(1); // The second combobox is level (first is type)
    await levelSelectTrigger.click();
    
    // Select "1 - Origins"
    const option = page.getByRole('option', { name: '1 - Origins', exact: true });
    await expect(option).toBeVisible();
    await option.click();
    
    // Verify the preview shows the correct path
    await expect(page.locator('text=secondary/origins-1-a1/')).toBeVisible();
    
    // Click Create Project
    const createBtn = page.getByRole('button', { name: 'Create Project' });
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    
    // Verify success message
    await expect(page.locator('text=created successfully!')).toBeVisible();
    
    // The dialog should close automatically after 1.5s
    await expect(dialog).toBeHidden({ timeout: 3000 });
  });
});
