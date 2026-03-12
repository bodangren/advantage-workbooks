# E2E Testing & Visual Stabilization Phase 5

## Objective
Continue stabilizing the UI and standardizing CSS usage. The primary goals of this phase are:
1. Extract the numerous inline styles from `primary_template.html` and `secondary_template.html` into unified CSS blocks.
2. Add E2E tests for the lesson editor's tab navigation (Vocabulary, Comprehension, Writing, Images).

## Requirements
1. **Template CSS Standardization**:
   - Locate elements with `style="..."` in `dashboard/templates/primary_template.html` and `dashboard/templates/secondary_template.html`.
   - Move these styles into the `<style>` block at the top of the templates by assigning appropriate class names.
2. **E2E Testing**:
   - Enhance `lesson-editor.spec.ts` to navigate through the editor tabs.
   - Verify that fields within the different tabs (e.g., Vocabulary, Comprehension questions) become visible when the corresponding tab is clicked.
3. **Validation**:
   - The Next.js build must pass.
   - Vitest unit tests must pass.
   - Playwright E2E tests must pass.
