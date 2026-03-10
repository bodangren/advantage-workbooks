# Implementation Plan

1. **Create Directory Structure**:
   - Create `dashboard/lib/document-wrapper/`.
   - Create `dashboard/lib/document-wrapper/types.ts` for interfaces (`TocEntry`, `GlossaryEntry`, etc.).
   - Create `dashboard/lib/document-wrapper/utils.ts` for `escapeHtml` and `getThemeColors`.
   - Create `dashboard/lib/document-wrapper/styles.ts` for `getPrintStyles`.
   - Create `dashboard/lib/document-wrapper/sections/` for individual section generators (e.g. `title-page.ts`, `preface.ts`, `toc.ts`, `progress-tracker.ts`, `glossary.ts`, `answer-key.ts`, `flashcards.ts`, `teacher-guide.ts`, `self-assessment.ts`, `certificate.ts`).

2. **Move Code**:
   - Move types to `types.ts`.
   - Move `escapeHtml` and `getThemeColors` to `utils.ts`.
   - Move `getPrintStyles` to `styles.ts`.
   - Move each section generator to its respective file in `sections/`.

3. **Refactor `workbook-document-wrapper.ts`**:
   - Make it re-export types so we don't break existing imports.
   - Import all generators, `getPrintStyles`, and `getThemeColors`.
   - Retain the `wrapWorkbookDocument` function, utilizing the imported generators.

4. **Verify Implementation**:
   - Run tests (`npm run test` or `vitest`).
   - Run linting and type checking (`npm run lint`, `tsc` or `npm run build`).

5. **Finalize**:
   - Update `conductor/tech-debt.md` to mark the item as resolved.
   - Archive track.
   - Update `README.md`.