# Implementation Plan

## Step 1: Standardize Template CSS
1.  **Extract Inline Styles in `primary_template.html`:**
    -   Identify elements using `style="..."` (e.g., `tip-box` backgrounds, column widths on tables, `article-image-box` margins/floats, `qr-code` dimensions, `checkbox` sizing).
    -   Create corresponding CSS classes in the `<style>` block.
    -   Update the HTML tags to use the new classes and remove the inline styles.
2.  **Extract Inline Styles in `secondary_template.html`:**
    -   Perform the same extraction for the secondary template.
    -   Ensure consistent class names are used across both templates where applicable.

## Step 2: Expand Lesson Editor E2E Tests
1.  **Update `lesson-editor.spec.ts`:**
    -   Add test interactions to click on the various editor tabs: "Vocabulary", "Comprehension", "Writing", "Images".
    -   Assert that content specific to each tab (like "Vocabulary Items", "Comprehension Questions") appears on the page.

## Step 3: Validation and CI
1.  **Run formatting and linting:** Ensure no regressions.
2.  **Run unit tests:** Validate compilation is unaffected.
3.  **Run E2E tests:** Verify that testing works.
4.  **Final Build:** Confirm a clean Next.js build.
