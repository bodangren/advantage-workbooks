# Implementation Plan

1. **Cleanup**: Remove `test-e2e-*` and `test-project-*` folders from the root directory.
2. **Selector Robustness**: Use `sed` to update all Playwright test files in `dashboard/e2e/` to use `a[href^="/projects/"]:not([href*="test-"])`.
3. **Timeout Adjustments**: Modify `dashboard/e2e/compile-sections.spec.ts` to increase locator timeout to 60000ms and total test timeout to 120000ms.
4. **Create Project Test**: Write `dashboard/e2e/create-project.spec.ts` to navigate to `/projects`, open the New Project dialog, select "1 - Origins", and submit, verifying the creation. Fix any strict mode selector violations.
5. **Verification**: Run `npx playwright test`, `npm run lint`, and `npx vitest run`.