# Implementation Plan: E2E Testing & Visual Stabilization Phase 11

## Phase 1: Preparation & Linting Fixes
1.  [ ] **Linting Cleanup:** Remove the unused `Plus` import in `dashboard/app/projects/[projectId]/page.tsx`.
2.  [ ] **Coverage Cleanup:** Remove the unnecessary eslint-disable in `dashboard/coverage/block-navigation.js`.
3.  [ ] **Verify Linting:** Run `npm run lint` in the `dashboard` directory to ensure all warnings are resolved.

## Phase 2: Enhanced E2E Testing
1.  [ ] **Create Persistence Test:** Implement `dashboard/e2e/lesson-persistence.spec.ts` to test saving and reloading changes in the lesson editor.
2.  [ ] **Test AI Features:** Add tests for the "Auto-Fill Pedagogy" button and "Generate Prompt" button in `lesson-persistence.spec.ts`.
3.  [ ] **Verify Persistence:** Ensure that after saving, a page reload shows the updated values.

## Phase 3: Visual Audit & Stabilization
1.  [ ] **Audit Lesson Editor:** Manually review (simulated) the `LessonEditor` component for any visual inconsistencies.
2.  [ ] **Standardize Tailwind:** Ensure consistent spacing and font sizes across the editor's cards and input fields.
3.  [ ] **Final E2E Run:** Run all Playwright tests to ensure no regressions.

## Phase 4: Finalization
1.  [ ] **Type Check:** Run `npx tsc --noEmit` to ensure type safety.
2.  [ ] **Production Build:** Run `npm run build` to ensure the application builds correctly.
3.  [ ] **Archive Track:** Move the track to `conductor/archive/` and update `conductor/tracks.md`.
