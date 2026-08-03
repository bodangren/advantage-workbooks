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

- [ ] Task: Run full test suite (`npm run test:run`) - all tests must pass
- [ ] Task: Run `npm run build` - zero build errors
- [ ] Task: Run `npx tsc --noEmit` - zero TypeScript errors
- [ ] Task: Verify page.tsx is reduced to <200 lines
- [ ] Task: Update `measure/tech-debt.md` - mark lesson editor refactor item as resolved
- [ ] Task: Update `measure/lessons-learned.md` with refactoring insights
- [ ] Task: Run E2E tests to verify no functionality broken
- [ ] Task: Measure — User Manual Verification (Protocol in workflow.md)