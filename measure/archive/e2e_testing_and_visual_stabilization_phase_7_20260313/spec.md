# Specification: E2E Testing & Visual Stabilization Phase 7

## Context
The directive strictly forbids new features and focuses entirely on stabilizing the UI, E2E tests, and ensuring layout consistency. Previous phases (Phase 3 & 6) identified and partially fixed flakiness in Paged.js print tests. However, issues remained around how Playwright interacts with dynamically remounting iframes during the compilation process, particularly when recompiling after toggling settings.

## Goals
1. Identify flakiness in the E2E test suite related to dynamic iframes.
2. Update Playwright locators to correctly wait for React rendering and network request completion.
3. Ensure no false positives or race conditions occur when evaluating `contentFrame` and `body`.

## Acceptance Criteria
- Playwright tests run reliably without timing out or failing on `contentFrame().locator('body')`.
- Toggling checkboxes on the compile page properly waits for the newly compiled preview.
- All E2E tests pass (`npx playwright test`).
- Full test suite and build succeed (`npm run test` and `npm run build`).