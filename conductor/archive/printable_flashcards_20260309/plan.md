# Implementation Plan: Printable Vocabulary Flashcards

1. **Update `dashboard/lib/workbook-document-wrapper.ts`**
   - Add `includeFlashcards?: boolean` to `WorkbookDocumentOptions`.
   - Create a `generateFlashcardsSection(glossary?: GlossaryEntry[], theme?: ThemeColors): string` function.
     - Generate a grid of cards. Each card has a `fc-front` and `fc-back` side by side.
     - Front contains the word. Back contains phonetic and definition.
     - Wrapper `div.flashcard` with dashed border.
   - Inject the flashcard CSS into `getPrintStyles`:
     - `.section-flashcards` styling (break before, page layout).
     - `.flashcard-grid` (CSS grid, 2 columns).
     - `.flashcard` (border, flex layout).
   - Call `generateFlashcardsSection` at the end of `wrapWorkbookDocument`.

2. **Update Compilation Route (`dashboard/app/api/projects/[projectId]/compile/route.ts`)**
   - No direct changes needed if we just reuse `glossary` inside `wrapWorkbookDocument` and assume `includeFlashcards: true` or infer from `glossary`. Wait, we will pass `includeFlashcards: true` in the `options` passed to `wrapWorkbookDocument`.

3. **Verify Layout and Build**
   - Run Next.js build.
   - Run tests.

4. **Commit and Archive**
   - Commit all code changes.
   - Archive the track folder.
   - Update README.md with the new feature.
