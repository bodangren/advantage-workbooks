## Lessons Learned

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or condense entries that are no longer relevant to near-term planning.

### Architecture & Design
<!-- Decisions made that future tracks should be aware of -->

- (YYYY-MM-DD, track_id) Example: Chose X over Y because of Z constraint

### Recurring Gotchas
<!-- Problems encountered repeatedly; save future tracks from the same pain -->

- (2026-03-12, e2e_testing_and_visual_stabilization_phase_4_20260312) Playwright selectors with shadcn/ui: The `CardTitle` component is rendered as a `div` without an implicit heading role. Avoid `getByRole('heading')` for card titles; use `getByText()` or explicit locators instead.
- (2026-03-13, e2e_testing_and_visual_stabilization_phase_5_20260313) Playwright strict mode: Avoid using `getByText('Some Field', { exact: true })` for section titles if a form label or select dropdown with the exact same text exists on the page. Relying on `getByLabel` is a more robust way to ensure both visibility and interactability without triggering strict mode violations.

- (2026-03-11, goal_setting_worksheet_20260311) Adding new compilation sections: When adding new UI toggles for generated sections, ensure the toggle flag is correctly wired through the frontend state, URL search params, the API route parser, and the `WorkbookDocumentOptions` type to prevent testing discrepancies.
- (YYYY-MM-DD, track_id) Example: Always check for null before accessing config values
- (2026-03-09, papercuts_fixes_20260309) Next.js printing: When printing a Paged.js output rendered within an iframe on a Next.js page, calling `window.print()` will print the Next.js outer UI. Always use `iframeRef.current.contentWindow.print()` to print only the Paged.js layout.
- (2026-03-10, refactor_cleanup_20260310) Next.js Image Component: `next/image` does not work well with local `blob:` Object URLs in preview components. Use standard `<img>` and bypass ESLint warnings via `eslint-disable-next-line @next/next/no-img-element`.
- (2026-03-10, certificate_of_completion_20260310) Vitest HTML checks: When testing HTML generated from templates that contains complex dynamically injected CSS blocks alongside the required class names, use structural or exact tag checks (`<div class="section-certificate">`) rather than just `toContain('section-certificate')` to avoid false positives matching against the CSS `<style>` block itself.
- (2026-03-10, teacher_guide_generator_20260310) URLSearchParams boolean conversion: When passing boolean toggles via query parameters in Next.js API routes, remember they are received as strings. Use `searchParams.get('param') !== 'false'` or `=== 'true'` explicitly rather than relying on truthy checks.
- (2026-03-10, self_assessment_generator_20260310) Paged.js page breaks: For newly appended sections that need to be pushed to a new printed page, ensure you apply `break-before: right;` if you want it strictly on the right side, or just `break-after: page;` on the preceding element.
- (2026-03-10, refactor_document_wrapper_20260310) Code splitting: When a central compiler file like `workbook-document-wrapper.ts` becomes too large, separating it into distinct modules (types, utils, individual generators) dramatically improves maintainability without altering output behavior, provided you re-export types correctly.
- (2026-03-11, refactor_cleanup_20260311) Thematic consistency: When generating printable HTML sections, always utilize the provided `ThemeColors` to ensure visual consistency across the workbook. Avoid unused parameters which trigger ESLint warnings.
- (2026-03-11, e2e_testing_and_visual_stabilization_20260311) Paged.js page rules: When rendering single templates via an iframe alongside a global document wrapper, remove explicit `@page` definitions in the individual templates to avoid conflicting with the primary wrapper's layout and ensure consistency.
- (2026-03-11, e2e_testing_and_visual_stabilization_20260311) Playwright testing: Ensure `e2e` directories or `.spec.ts` files are explicitly excluded in `vitest.config.ts` to prevent Vitest from attempting to run E2E suites which causes build failures.
- (2026-03-11, spelling_practice_generator_20260311) Paged.js tracing text: When generating spelling practice pages, use a light gray color (e.g. `#e0e0e0`) and fall back to standard sans-serif if tracing fonts aren't guaranteed to be installed on the print system.

### Patterns That Worked Well
<!-- Approaches worth repeating -->

- (YYYY-MM-DD, track_id) Example: Writing acceptance criteria before implementation caught scope creep early
- (2026-03-11, e2e_testing_and_visual_stabilization_20260311) Playwright iframe testing: When verifying content inside an iframe, always extract the frame using `.contentFrame()` before applying `.locator()` to ensure expectations resolve correctly.
- (2026-03-12, e2e_testing_and_visual_stabilization_phase_2_20260312) Playwright checkbox toggling: When unchecking inputs that trigger Paged.js layout rebuilds, verify the checkbox state using `not.toBeChecked()` and wait for the `iframe` to be visible again.
- (2026-03-12, e2e_testing_and_visual_stabilization_phase_3_20260312) Playwright iframe reloading: When actions completely unmount and remount an iframe (like toggling sections triggering a fetch/loading state), wait for the `iframe` to be visible again *before* getting its `contentFrame()` to avoid race conditions with detached DOM elements.

### Planning Improvements
<!-- Notes on where estimates were wrong and why -->

- (YYYY-MM-DD, track_id) Example: Underestimated integration testing time by 2x
