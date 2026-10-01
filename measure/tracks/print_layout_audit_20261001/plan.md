# Plan: print_layout_audit_20261001

## Phase 1: Reproduce and fix the known bug
- [x] Build a scratch pipeline (compile, Paged.js, PDF, PNG) in `/tmp/claude-1000/print-audit/`
- [x] Reproduce the collapsed write-in column on a 20-word vocabulary table
- [x] Fix with fixed layout, colgroup, cell widths, row break rules
- [x] Verify on a table that splits over three pages

## Phase 2: Audit all lesson sections
- [x] Orphaned headings: keep-together wrappers
- [x] Split boxes: break-inside rules for Paged.js
- [x] Tick boxes and marking key styles
- [x] Guided Writing starts on a new page
- [x] Thai line breaking and overflow rules
- [x] Image layout (hero, inline, vocabulary, writing prompt) checked with test images
- [x] Full-book overflow check on Origins 2 and Origins 3.1

## Phase 3: Verify
- [x] `npx vitest run` template-renderer, e2e-integration, workbook-document-wrapper (77 tests pass)
- [x] ESLint: no TypeScript file changed

## Open
- [ ] O1 Repeat table header on continuation pages (Paged.js hook)
- [ ] O2 Empty Preface page (`sections/preface.ts`)
- [ ] O3 Self-assessment page split (`sections/self-assessment.ts`)
- [ ] O4 Decide on dead `@media print` break rules
- [ ] O5 Decide on half-empty pages from keep-together
- [ ] O6 Decide on write-in cell height
- [ ] Re-run a full print preview in the dashboard UI with the real Primary books before 2026-10-24
