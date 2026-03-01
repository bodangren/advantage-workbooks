# Plan: Code Simplification & Quality Pass

## Phase 1: Review

- [x] Task: Run `git diff` on recent commits to identify changed files
- [x] Task: Review changed files for code reuse, quality, and efficiency issues
- [x] Task: Produce findings report (no changes yet)

## Phase 2: Fix

- [x] Task: Remove duplicate Print button from card view in `compile/page.tsx`
- [x] Task: Rename `seriesLevel` → `levelNumber` in `compile/route.ts` to eliminate naming clash with `WorkbookDocumentOptions.seriesLevel`
- [x] Task: Parallelize `listLessons` + `readProjectMetadata` in `compile/route.ts` using `Promise.all`
- [x] Task: Parallelize individual lesson reads in `compile/route.ts` using `Promise.all` over `.map`
- [x] Task: Convert `generatePrintStyles()` function to a module-level `PRINT_STYLES` constant in `workbook-document-wrapper.ts`

## Phase 3: Verify

- [x] Task: Run full test suite — confirm all 165 tests pass
