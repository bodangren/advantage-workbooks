# Specification: E2E Testing Stabilization Phase 9

## Objective
Address flakiness in E2E tests, add missing coverage for the "Create Project" flow, and improve Playwright's handling of slow Paged.js rendering on large compiled workbooks.

## Requirements
1. Clean up lingering `test-e2e-*` directories in the root workspace that interfere with Playwright test parallelization and UI selection.
2. Update E2E project selectors (`a[href^="/projects/"]`) to explicitly ignore temporary test directories using `:not([href*="test-"])`.
3. Increase test timeouts and locator timeouts to `60000ms` for elements heavily dependent on Paged.js sequentially rendering large (10+ lesson) workbooks, particularly sections located at the end of the document like the Glossary.
4. Add a new E2E test `create-project.spec.ts` to verify the creation flow using the dialog and level selectors.

## Acceptance Criteria
- `npm run test:e2e` (or equivalent Playwright runner) passes 100% reliably.
- Paged.js does not trigger test failures on the glossary due to short 30s timeouts.
- A new project can be created via E2E testing without strict mode violations.