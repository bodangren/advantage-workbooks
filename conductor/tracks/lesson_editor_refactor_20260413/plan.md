# Implementation Plan: Lesson Editor Refactoring

## Phase 1: Setup & BasicInfoEditor Extraction

- [ ] Task: Run existing test suite (`npm run test:run`) to establish baseline
- [ ] Task: Create `dashboard/components/lesson-editor/` directory structure
- [ ] Task: Create `dashboard/components/lesson-editor/types.ts` with shared interfaces extracted from page.tsx
- [ ] Task: Write failing unit tests for `BasicInfoEditor` component
- [ ] Task: Implement `BasicInfoEditor.tsx` by extracting from page.tsx
- [ ] Task: Refactor page.tsx to import and use BasicInfoEditor
- [ ] Task: Verify tests pass and coverage maintained

## Phase 2: ArticleEditor & VocabularyEditor Extraction

- [ ] Task: Write failing unit tests for `ArticleEditor` component
- [ ] Task: Implement `ArticleEditor.tsx` extracting article paragraph handling
- [ ] Task: Write failing unit tests for `VocabularyEditor` component
- [ ] Task: Implement `VocabularyEditor.tsx` extracting vocabulary list handling
- [ ] Task: Refactor page.tsx to use both editors
- [ ] Task: Verify tests pass and coverage maintained

## Phase 3: PedagogicalConnectorsEditor & ComprehensionQuestionsEditor Extraction

- [ ] Task: Write failing unit tests for `PedagogicalConnectorsEditor`
- [ ] Task: Implement `PedagogicalConnectorsEditor.tsx`
- [ ] Task: Write failing unit tests for `ComprehensionQuestionsEditor`
- [ ] Task: Implement `ComprehensionQuestionsEditor.tsx`
- [ ] Task: Refactor page.tsx to use both editors
- [ ] Task: Verify tests pass and coverage maintained

## Phase 4: WritingPromptEditor & LessonReflectionEditor Extraction

- [ ] Task: Write failing unit tests for `WritingPromptEditor`
- [ ] Task: Implement `WritingPromptEditor.tsx`
- [ ] Task: Write failing unit tests for `LessonReflectionEditor`
- [ ] Task: Implement `LessonReflectionEditor.tsx`
- [ ] Task: Refactor page.tsx to use both editors
- [ ] Task: Verify tests pass and coverage maintained

## Phase 5: Final Verification & Cleanup

- [ ] Task: Run full test suite (`npm run test:run`) - all tests must pass
- [ ] Task: Run `npm run build` - zero build errors
- [ ] Task: Run `npx tsc --noEmit` - zero TypeScript errors
- [ ] Task: Verify page.tsx is reduced to <200 lines
- [ ] Task: Update `conductor/tech-debt.md` - mark lesson editor refactor item as resolved
- [ ] Task: Update `conductor/lessons-learned.md` with refactoring insights
- [ ] Task: Run E2E tests to verify no functionality broken
- [ ] Task: Conductor — User Manual Verification (Protocol in workflow.md)