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
