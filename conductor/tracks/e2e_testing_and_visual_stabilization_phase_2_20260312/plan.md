# Implementation Plan

- [ ] **Step 1: Write E2E Tests for New Sections**
  - Create a new Playwright test `dashboard/e2e/compile-sections.spec.ts` or update `compile.spec.ts` to test toggling and rendering of all new sections.
- [ ] **Step 2: Paged.js Print Layout Audit**
  - Verify that `break-before: right`, `break-after: page`, and related page structure rules in `styles.ts` work seamlessly together without causing blank pages or cut-off content.
- [ ] **Step 3: CSS/Tailwind Standardization**
  - Search for hardcoded styles in Dashboard React components and replace them with Tailwind utility classes where appropriate.
- [ ] **Step 4: Validation**
  - Run `npm run test:run` and `npx playwright test`. Ensure a successful production build with `npm run build`.