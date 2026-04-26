# Spelling Practice Generator Specification

## Objective
Add an automated "Spelling Practice" section to compiled workbooks. This feature generates pages where students can practice spelling the vocabulary words from each lesson using a classic "Look, Trace, Write, Check" or similar grid method.

## Requirements
- Parse vocabulary from each lesson during the workbook compilation process.
- Create a new template section `spelling-practice.ts` that outputs an HTML grid with the words.
- Add an `includeSpellingPractice` toggle in the compilation UI (`PrintPreview` page) that defaults to true.
- Pass `spellingPractice` options to the `wrapWorkbookDocument` and `template-renderer` functions.
- Write CSS styles for the new section in `styles.ts` ensuring it fits well within Paged.js printed layouts (e.g. forced page breaks where necessary, readable font size for tracing/writing).

## Data Structure
Use the existing `GlossaryEntry` interface to pass vocabulary. 
A new `SpellingPracticeEntry` interface should be added to `types.ts` grouping vocabulary by lesson title.

## Visual Design
- Header for the section: "Spelling Practice".
- For each lesson: A subheader with the lesson title.
- A grid/table: 
  - Column 1: "Word" (printed normally)
  - Column 2: "Trace" (printed light gray for tracing over)
  - Column 3: "Write" (blank lines for writing)
  - Column 4: "Cover & Write" (blank lines for writing)