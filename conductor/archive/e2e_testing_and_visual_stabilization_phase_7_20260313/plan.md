# Plan: E2E Testing & Visual Stabilization Phase 7

## Step 1: Research
- Run `npx playwright test` to identify flaky or failing tests.
- Investigate timeouts related to `locator('iframe').contentFrame().locator('body')` in `compile.spec.ts` and `compile-sections.spec.ts`.

## Step 2: Implementation
- In `compile-sections.spec.ts`: Add `Promise.all` with `page.waitForResponse(/.*\/api\/projects\/.*\/compile.*/)` when toggling compile checkboxes to ensure we actually wait for the recompile to trigger and finish.
- Change `iframe.contentFrame().locator('body')` to use `page.frameLocator('iframe').locator('body')` in both `compile-sections.spec.ts` and `compile.spec.ts`. Playwright's `frameLocator` is explicitly designed for dynamic iframes and resolves lazily, preventing detached DOM node errors.
- Increase timeouts for Paged.js generation from `15000ms` to `30000ms` for extra stability in slow CI environments.

## Step 3: Verification
- Run `npx playwright test e2e/compile-sections.spec.ts --repeat-each 3` to verify the flakiness is gone.
- Run `npx playwright test e2e/compile.spec.ts --repeat-each 3` to ensure stability.
- Run the entire E2E suite (`npx playwright test`).
- Run `npm run test -- --run` and `npm run build` to confirm no regressions.

## Step 4: Finalize
- Archive this track.
- Update `conductor/tracks.md`.
- Update `conductor/lessons-learned.md` with findings about `frameLocator` vs `contentFrame`.