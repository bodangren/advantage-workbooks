# Specification: Printable Vocabulary Flashcards Generator

## Overview
As per the product definition ("Reproducible Resources: Flashcard templates, graphic organizers"), this feature adds an automated printable vocabulary flashcards section at the end of compiled workbooks. It reuses the aggregated glossary data to generate easy-to-cut-out-and-fold flashcards for students.

## Requirements
1. **Flashcards Layout:**
   - Display a grid of flashcards at the end of the workbook.
   - Each card should be foldable: one side has the vocabulary word, the other has the phonetic spelling and definition.
   - Include dashed lines indicating where to cut and fold.
2. **Integration:**
   - Update `workbook-document-wrapper.ts` to include a `generateFlashcardsSection` function.
   - Add appropriate print CSS to format the flashcards in a grid (e.g., 2 or 3 columns of foldable cards).
   - Ensure page breaks inside flashcards are avoided (`break-inside: avoid;`).
3. **Toggle/Option:**
   - Extend `WorkbookDocumentOptions` with an `includeFlashcards` option (defaulting to true if a glossary is present, or explicit). Let's make it automatic based on the presence of glossary data.

## UI/UX
- Flashcards will appear as the final section of the printed PDF.
- They will be styled with dashed borders for cutting and a light center line for folding.
