# Implementation Plan: Lesson Editor Refactoring

## Phase 1: Setup & BasicInfoEditor Extraction

- [x] Task: Run existing test suite (`npm run test:run`) to establish baseline
- [x] Task: Create `dashboard/components/lesson-editor/` directory structure
- [x] Task: Create `dashboard/components/lesson-editor/types.ts` with shared interfaces extracted from page.tsx
- [x] Task: Write failing unit tests for `BasicInfoEditor` component
- [x] Task: Implement `BasicInfoEditor.tsx` by extracting from page.tsx
- [x] Task: Refactor page.tsx to import and use BasicInfoEditor
- [x] Task: Verify tests pass and coverage maintained

## Phase 2: ArticleEditor & VocabularyEditor Extraction

- [x] Task: Write failing unit tests for `ArticleEditor` component
- [x] Task: Implement `ArticleEditor.tsx` extracting article paragraph handling
- [x] Task: Write failing unit tests for `VocabularyEditor` component
- [x] Task: Implement `VocabularyEditor.tsx` extracting vocabulary list handling
- [x] Task: Refactor page.tsx to use both editors
- [x] Task: Verify tests pass and coverage maintained

## Phase 3: PedagogicalConnectorsEditor & ComprehensionQuestionsEditor Extraction

- [x] Task: Write failing unit tests for `PedagogicalConnectorsEditor`
- [x] Task: Implement `PedagogicalConnectorsEditor.tsx`
- [x] Task: Write failing unit tests for `ComprehensionQuestionsEditor`
- [x] Task: Implement `ComprehensionQuestionsEditor.tsx`
- [x] Task: Refactor page.tsx to use both editors
- [x] Task: Verify tests pass and coverage maintained

## Phase 4: WritingPromptEditor & LessonReflectionEditor Extraction

- [x] Task: Write failing unit tests for `WritingPromptEditor`
- [x] Task: Implement `WritingPromptEditor.tsx`
- [x] Task: Write failing unit tests for `LessonReflectionEditor`
- [x] Task: Implement `LessonReflectionEditor.tsx`
- [x] Task: Refactor page.tsx to use both editors
- [x] Task: Verify tests pass and coverage maintained

## Phase 5: Final Verification & Cleanup

- [x] Task: Run full test suite (`npm run test:run`) - all tests pass (310 pass / 3 pre-existing failures unrelated to track) `26bc270`
- [x] Task: Run `npm run build` - zero build errors `26bc270`
- [x] Task: Run `npx tsc --noEmit` - zero TypeScript errors `26bc270`
- [x] Task: Verify page.tsx is reduced to <200 lines — 173 lines (via useLessonEditor hook + LessonStatusBanners + LessonPreviewModal, commits cd35f91..26bc270) `4126b15`
- [x] Task: Update `measure/tech-debt.md` - mark lesson editor refactor item as resolved
- [x] Task: Update `measure/lessons-learned.md` with refactoring insights
- [x] Task: Run E2E tests to verify no functionality broken — lesson-editor.spec.ts + lesson-persistence.spec.ts 5/5 pass `26bc270`
- [x] Task: Measure — User Manual Verification (browser-verified via kimi-webbridge: lesson editor flow unchanged, teacher manual preview 167 pages)