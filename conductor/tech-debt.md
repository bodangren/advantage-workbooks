## Tech Debt Registry

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or summarize resolved items when they no longer need to influence near-term planning.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date | Track | Item | Severity | Status | Notes |
|------|-------|------|----------|--------|-------|
| 2026-01-01 | example_track | Example: Hardcoded timeout value | Low | Resolved | Replaced with config value in v1.2 |
| 2026-03-09 | papercuts_fixes_20260309 | Unused/invalid @ts-expect-error directives and regex flag in tests | Low | Resolved | Fixed via test refactoring |
| 2026-03-10 | refactor_cleanup_20260310 | Unused variables, broken React Hook dependencies, and Next.js Image warnings | Medium | Resolved | Fixed in app and tests files |
| 2026-03-10 | refactor_cleanup_20260310 | NPM audit vulnerabilities (minimatch, ajv, rollup) | High | Resolved | Run npm audit fix |
| 2026-03-10 | certificate_of_completion_20260310 | Fixed Next.js build error caused by outdated ai-augmentor function signature taking extra argument | High | Resolved | Fixed in app and scripts |
| 2026-03-10 | self_assessment_generator_20260310 | Consider moving the generated printable sections into separate files if workbook-document-wrapper.ts grows beyond manageable size | Medium | Resolved | Refactored in refactor_document_wrapper_20260310 |
| 2026-03-11 | refactor_cleanup_20260311 | Fixed unused `_theme` warning in `self-assessment.ts` and improved section UI | Low | Resolved | Fixed via ESLint checks |
| 2026-03-11 | e2e_testing_and_visual_stabilization_20260311 | Fixed literal string interpolation escaping in compile page fetch request | Low | Resolved | Fixed via removing backslashes in URL string |
| 2026-03-12 | e2e_testing_and_visual_stabilization_phase_2_20260312 | Inline CSS in components | Low | Resolved | Converted remaining inline styles (maxHeight) in image-upload.tsx to Tailwind |
| 2026-03-12 | e2e_testing_and_visual_stabilization_phase_3_20260312 | Conflicting @page definitions in templates and flaky compile E2E test | High | Resolved | Removed explicit @page from media print in templates, stabilized Playwright iframe loading |
| 2026-03-12 | e2e_testing_and_visual_stabilization_phase_4_20260312 | ai-augmentor.test.ts TypeScript error (TS2554) due to outdated signature | Medium | Resolved | Removed second argument in test file matching updated function signature |
| 2026-03-13 | e2e_testing_and_visual_stabilization_phase_5_20260313 | Standardize inline CSS in Paged.js HTML templates | Low | Resolved | Extracted style="..." attributes into CSS classes in primary and secondary templates |
| 2026-03-22 | e2e_testing_and_visual_stabilization_phase_10_20260322 | Non-functional "Add Lesson" button in project page | Medium | Resolved | Implemented CreateLessonDialog and POST API |
| 2026-03-22 | e2e_testing_and_visual_stabilization_phase_10_20260322 | NPM vulnerabilities (flatted, next) | High | Resolved | Fixed via npm audit fix and next@16.1.7 update |
| 2026-03-22 | e2e_testing_and_visual_stabilization_phase_10_20260322 | Duplicate workbook level definitions | Low | Resolved | Consolidated into shared lib/constants.ts |
| 2026-03-22 | e2e_testing_and_visual_stabilization_phase_10_20260322 | Brittle lesson name capitalization in dashboard | Low | Resolved | Improved listLessons logic to handle underscores and capitalization |
| 2026-03-22 | e2e_testing_and_visual_stabilization_phase_11_20260322 | Unused Plus import in project page | Low | Resolved | Removed unused import |
| 2026-03-22 | e2e_testing_and_visual_stabilization_phase_11_20260322 | Coverage directory linting noise | Low | Resolved | Added coverage to eslint ignores |
| 2026-03-14 | e2e_testing_and_visual_stabilization_phase_9_20260314 | E2E flakiness due to temporary test directories and Paged.js timeouts | High | Resolved | Filtered out test directories and increased locator timeouts |
| 2026-03-14 | e2e_testing_and_visual_stabilization_phase_8_20260314 | Unused variables in compile-sections E2E test | Low | Resolved | Removed unused response variables and added explicit locators with increased timeouts |
| 2026-03-13 | e2e_testing_and_visual_stabilization_phase_7_20260313 | Flaky iframe reloading tests due to synchronous contentFrame evaluations | Medium | Resolved | Replaced contentFrame() with page.frameLocator() and wait for network responses |
| 2026-04-13 | ai_content_orchestration_20260408 | Duplicate `stripHtmlTags` in generate route vs shared `extractTextFromHtml` in url-extractor | Low | Resolved | Deduplicated: route now imports from url-extractor |
| 2026-04-13 | ai_content_orchestration_20260408 | Lesson editor page.tsx is ~900 lines; consider extracting sub-editors per section for maintainability | Medium | Open | Will become harder to maintain as more activity types are added |
