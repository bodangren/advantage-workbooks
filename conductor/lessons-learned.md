## Lessons Learned

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or condense entries that are no longer relevant to near-term planning.

### Architecture & Design
<!-- Decisions made that future tracks should be aware of -->

- (2026-03-22, e2e_testing_and_visual_stabilization_phase_11_20260322) Playwright strict mode: getByText can often match multiple elements (e.g., a label and its section header). Use .first() or more specific locators to avoid strict mode violations.
- (2026-03-22, e2e_testing_and_visual_stabilization_phase_11_20260322) Overlapping UI: When a modal with fixed inset-0 is open, it will intercept pointer events for buttons underneath it, even if they are logically part of the same flow. Use the modal's own close controls (e.g., "×") to dismiss it in E2E tests.
- (2026-03-22, e2e_testing_and_visual_stabilization_phase_10_20260322) Shared Level Constants: Consolidating primary and secondary workbook levels into a single `lib/constants.ts` ensures UI consistency across creation and settings dialogs and prevents duplicate maintenance effort.

### Recurring Gotchas
<!-- Problems encountered repeatedly; save future tracks from the same pain -->

- (2026-03-22, e2e_testing_and_visual_stabilization_phase_10_20260322) Playwright redirects: When testing flows that redirect to a new page (e.g. after creating a lesson), ensure you use `await expect(page).toHaveURL()` with a sufficient timeout (at least 15000ms) to account for filesystem operations and server-side processing.
- (2026-03-22, e2e_testing_and_visual_stabilization_phase_10_20260322) Lesson naming conventions: Files in workbook projects MUST end with `_workbook.json` or start with `content_` to be recognized by `listLessons`. The `POST` API should strictly enforce this naming to ensure newly created lessons appear in the dashboard.
- (2026-03-22, e2e_testing_and_visual_stabilization_phase_10_20260322) Next.js Version Crashing: Updating Next.js beyond `16.1.6` (e.g. `16.2.1`) may trigger `bmi2` CPU instruction panics in environments with older/virtualized CPUs. Version `16.1.7` was found to be a stable middle ground that fixes vulnerabilities without causing panics.
- (2026-03-14, e2e_testing_and_visual_stabilization_phase_9_20260314) Paged.js rendering times: Rendering a full workbook with 14+ lessons using Paged.js can take upwards of 45-60 seconds. When testing visibility of elements located at the very end of the document (like a Glossary), always increase the Playwright locator timeout to at least 60000ms.
- (2026-03-14, e2e_testing_and_visual_stabilization_phase_8_20260314) Paged.js page splits: When asserting visibility of Paged.js rendered sections with Playwright, always use `.first()` if the element might be split across multiple printed pages to prevent strict mode violations.
- (2026-03-13, e2e_testing_and_visual_stabilization_phase_6_20260313) Playwright test timeouts: When testing Paged.js heavy operations like compiling an entire workbook project, the default 30,000ms Playwright timeout is often insufficient. Always use `test.setTimeout(90000)` or similar for such tests.
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
- (2026-03-13, e2e_testing_and_visual_stabilization_phase_7_20260313) Dynamic iframes: Avoid using `.contentFrame()` for dynamic iframes as it evaluates synchronously and may reference a detached DOM node if the iframe remounts. Always use `page.frameLocator('iframe')` so Playwright resolves the iframe lazily and handles remounts gracefully.
- (2026-03-12, e2e_testing_and_visual_stabilization_phase_2_20260312) Playwright checkbox toggling: When unchecking inputs that trigger Paged.js layout rebuilds, verify the checkbox state using `not.toBeChecked()` and wait for the `iframe` to be visible again.
- (2026-04-08, ai_content_orchestration_20260408) Gemini structured output: Using `responseMimeType: "application/json"` with `zodToJsonSchema` to embed the full Zod schema in the prompt ensures Gemini returns valid JSON that passes `Schema.safeParse()`. This pattern (from ai-augmentor.ts) is reusable for any structured output from Gemini.

### Planning Improvements
<!-- Notes on where estimates were wrong and why -->

- (YYYY-MM-DD, track_id) Example: Underestimated integration testing time by 2x
