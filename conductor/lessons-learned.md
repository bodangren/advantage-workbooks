## Lessons Learned

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or condense entries that are no longer relevant to near-term planning.

### Architecture & Design
<!-- Decisions made that future tracks should be aware of -->

- (YYYY-MM-DD, track_id) Example: Chose X over Y because of Z constraint

### Recurring Gotchas
<!-- Problems encountered repeatedly; save future tracks from the same pain -->

- (YYYY-MM-DD, track_id) Example: Always check for null before accessing config values
- (2026-03-09, papercuts_fixes_20260309) Next.js printing: When printing a Paged.js output rendered within an iframe on a Next.js page, calling `window.print()` will print the Next.js outer UI. Always use `iframeRef.current.contentWindow.print()` to print only the Paged.js layout.
- (2026-03-10, refactor_cleanup_20260310) Next.js Image Component: `next/image` does not work well with local `blob:` Object URLs in preview components. Use standard `<img>` and bypass ESLint warnings via `eslint-disable-next-line @next/next/no-img-element`.
- (2026-03-10, certificate_of_completion_20260310) Vitest HTML checks: When testing HTML generated from templates that contains complex dynamically injected CSS blocks alongside the required class names, use structural or exact tag checks (`<div class="section-certificate">`) rather than just `toContain('section-certificate')` to avoid false positives matching against the CSS `<style>` block itself.
- (2026-03-10, teacher_guide_generator_20260310) URLSearchParams boolean conversion: When passing boolean toggles via query parameters in Next.js API routes, remember they are received as strings. Use `searchParams.get('param') !== 'false'` or `=== 'true'` explicitly rather than relying on truthy checks.
- (2026-03-10, self_assessment_generator_20260310) Paged.js page breaks: For newly appended sections that need to be pushed to a new printed page, ensure you apply `break-before: right;` if you want it strictly on the right side, or just `break-after: page;` on the preceding element.

### Patterns That Worked Well
<!-- Approaches worth repeating -->

- (YYYY-MM-DD, track_id) Example: Writing acceptance criteria before implementation caught scope creep early

### Planning Improvements
<!-- Notes on where estimates were wrong and why -->

- (YYYY-MM-DD, track_id) Example: Underestimated integration testing time by 2x
