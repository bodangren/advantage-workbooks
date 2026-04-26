# Implementation Plan: E2E Testing & Visual Stabilization Phase 10

## Phase 1: Foundation & Security
- [ ] Create `dashboard/lib/constants.ts` and migrate `SECONDARY_LEVELS` and `PRIMARY_LEVELS` from `CreateProjectDialog.tsx`.
- [ ] Update `ProjectSettingsDialog.tsx` to use these shared constants and correctly handle `primary` vs `secondary` types.
- [ ] Run `npm audit fix` in `dashboard/`.
- [ ] Manually update `flatted` and `next` in `dashboard/package.json` if `npm audit fix` isn't enough.

## Phase 2: Lesson Creation API
- [ ] Implement `POST` in `dashboard/app/api/projects/[projectId]/lessons/route.ts` that uses `writeLesson` from `lib/filesystem`.
- [ ] Ensure the API validates input and generates a unique `lessonId` (e.g., from the lesson title slugified).

## Phase 3: Lesson Creation UI
- [ ] Create `dashboard/components/create-lesson-dialog.tsx`.
- [ ] Update `dashboard/app/projects/[projectId]/page.tsx` to use this dialog instead of the console log.

## Phase 4: Expansion & Verification
- [ ] Add `dashboard/e2e/project-settings.spec.ts` for project metadata updates.
- [ ] Add lesson creation tests to `dashboard/e2e/project-lessons.spec.ts`.
- [ ] Final visual check of Paged.js templates for any remaining papercuts.
- [ ] Run all E2E tests and ensure a full project build.
