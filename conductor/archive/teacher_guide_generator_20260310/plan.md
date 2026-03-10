# Implementation Plan: Teacher Guide Generation

## Phase 1: Core Logic & Types
- [ ] Open `dashboard/lib/workbook-document-wrapper.ts`.
- [ ] Add `TeacherGuideEntry` interface.
- [ ] Add `teacherGuide?: TeacherGuideEntry[]` and `includeTeacherGuide?: boolean` to `WorkbookDocumentOptions`.
- [ ] Create `generateTeacherGuideSection(guideEntries, theme)` returning formatted HTML.
- [ ] Update `getPrintStyles()` to include CSS for the `.section-teacher-guide`, `.tg-lesson-page`, etc.
- [ ] Call `generateTeacherGuideSection` in `wrapWorkbookDocument` and include its output before or after the Answer Key.

## Phase 2: API Integration
- [ ] Open `dashboard/app/api/projects/[projectId]/compile/route.ts`.
- [ ] Extract `includeTeacherGuide` from searchParams.
- [ ] Map `loadedLessons` to `TeacherGuideEntry` objects:
  - Extract lesson title, genre, article type, vocabulary, writing prompt.
- [ ] Pass `teacherGuide` and `includeTeacherGuide` into `wrapWorkbookDocument`.

## Phase 3: Frontend UI
- [ ] Open `dashboard/app/projects/[projectId]/compile/page.tsx`.
- [ ] Add `includeTeacherGuide` state (default `true`).
- [ ] Add a checkbox for "Teacher's Guide" in the compilation settings.
- [ ] Update `useEffect` queryParams to include `includeTeacherGuide`.

## Phase 4: Testing & Verification
- [ ] Open `dashboard/__tests__/workbook-document-wrapper.test.ts`.
- [ ] Add tests for `includeTeacherGuide` rendering the section.
- [ ] Run `vitest run` to ensure tests pass.
- [ ] Run `npm run build` inside `dashboard/` to verify no TypeScript errors.
