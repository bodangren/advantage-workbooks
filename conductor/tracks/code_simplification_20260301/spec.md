# Spec: Code Simplification & Quality Pass

## Track Type
Chore

## Overview
Review recently changed files for reuse, quality, and efficiency issues, then fix all findings. This is a post-feature simplification pass following the `print_compilation_fixes_20260223` track.

## Scope
Files changed in the prior track:
- `dashboard/lib/workbook-document-wrapper.ts`
- `dashboard/lib/preface-loader.ts`
- `dashboard/app/api/projects/[projectId]/compile/route.ts`
- `dashboard/app/projects/[projectId]/compile/page.tsx`

## Acceptance Criteria
- [ ] No duplicate UI elements in the compile page
- [ ] No confusingly named variables in the compile route
- [ ] Lesson loading is parallelized
- [ ] Project metadata is fetched concurrently with lesson listing
- [ ] Static CSS string computed once at module level, not per call
- [ ] All existing tests continue to pass
