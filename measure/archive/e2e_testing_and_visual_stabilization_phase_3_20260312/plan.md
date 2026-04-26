# Plan: E2E Testing & Visual Stabilization Phase 3

1. **Fix Playwright Flakiness:** Update `e2e/compile-sections.spec.ts` to wait for the iframe to reappear properly before attempting to access its content frame after checking/unchecking sections.
2. **Audit Template Print Styles:** Search `dashboard/templates` for `@media print` rules containing `@page` blocks.
3. **Remove Conflicting Rules:** Remove `@page` blocks from `primary_template.html` and `secondary_template.html` to allow the global document wrapper to control Paged.js page size and margins.
4. **Validation:**
    - Run `npx playwright test` to verify E2E suite passes.
    - Run `npm run test --run` to verify Vitest suite passes.
    - Run `npm run build` to verify production build.
5. **Finalize:** Commit changes, push, update tech-debt and lessons-learned, and archive the track.