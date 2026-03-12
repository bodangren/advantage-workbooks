import { test, expect } from '@playwright/test';

test.describe('Compile Flow - Sections Toggling', () => {
  test('should allow toggling compilation sections', async ({ page }) => {
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
    
    // Open settings panel
    const settingsButton = page.getByTitle('Compilation Settings');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();
    
    // Verify all checkboxes exist and are checked by default
    const sections = [
      'Progress Tracker',
      'Vocabulary Flashcards',
      "Teacher's Guide",
      'Self-Assessment',
      'Spelling Practice',
      'Goal Setting',
      'Certificate'
    ];

    for (const section of sections) {
      const checkbox = page.getByLabel(section);
      await expect(checkbox).toBeVisible();
      await expect(checkbox).toBeChecked();
    }

    // Uncheck one and ensure it triggers re-compile (iframe should reload)
    // We can't easily detect iframe reload directly without observing network, 
    // but we can ensure the checkbox can be unchecked.
    const goalSettingCheckbox = page.getByLabel('Goal Setting');
    await goalSettingCheckbox.uncheck();
    await expect(goalSettingCheckbox).not.toBeChecked();
    
    // Wait for compile to finish after unchecking
    await expect(page.locator('iframe')).toBeVisible({ timeout: 15000 });

    // Re-check it
    await goalSettingCheckbox.check();
    await expect(goalSettingCheckbox).toBeChecked();

    // Verify iframe loads again
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible({ timeout: 15000 });
    
    const frame = iframe.contentFrame();
    await expect(frame.locator('body')).toBeVisible({ timeout: 15000 });
  });
});
