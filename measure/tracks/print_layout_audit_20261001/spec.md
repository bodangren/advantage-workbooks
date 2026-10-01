# Spec: Print layout audit, Primary workbook template

File changed: `dashboard/templates/primary_template.html` (CSS and small HTML wrappers only). No JSON, renderer, or wrapper change.

Method: compile lessons with `renderMultipleLessons` and `wrapWorkbookDocument`, paginate with Paged.js (`paged.polyfill.js` from node_modules) in system Chrome through Playwright, print to PDF with background graphics, convert pages to PNG, and read them. Scratch files: `/tmp/claude-1000/print-audit/`. Inputs: `e12_workbook.json`, a copy with 20 vocabulary items (`long_vocab.json`), a copy with test images (`images.json`), and all 14 lessons of `origins-3.1-a0` and `origins-2-a0`.

## Defects fixed

1. Vocabulary table, write-in column collapses on a continuation page. Where: Step 2 "Key Vocabulary", `.vocab-table`. Cause: table had automatic layout, the write-in cells held only empty divs, and Paged.js clones the table for the next page. The cloned part had no content width to size the column. Evidence: `long_before.pdf` pages 7 to 9 (column about 30 px wide). Fix: `table-layout: fixed`, `<colgroup>` 42%/58%, same widths on `th`/`td` by `nth-child`, `min-width` and fixed row height on the write-in cell, `tr { break-inside: avoid }`, `thead { display: table-header-group }`. After: `long_after.pdf` pages 7 to 9 keep both columns. Lessons with 10 to 15 words in `origins-3.1-a0` lesson 1 (page 6 to 7) also verified.
2. Section headings orphaned at page bottom (Collect Vocabulary, Collect Sentences, Comprehension Check, Guided Response, Sentence Practice). Cause: Paged.js ignores `break-after: avoid`. Fix: `.keep-section` on small sections, and `.keep-together` wrappers that hold the heading with the first block in Steps 7, 9, 10. After: `long_after.pdf` pages 11 to 16.
3. Boxes split across pages (tip boxes, collection boxes, short-answer box, reflection, homework, answer key, language question boxes, score box, word bank, QR boxes, planner, writing prompt). Fix: `break-inside: avoid` in the shared group rule. The old rule existed only in `@media print`, which Paged.js does not use for layout.
4. Article paragraph split across pages (`.paragraph`). Fix: `break-inside: avoid` outside the print media block. Paragraphs are short in A0 books.
5. Guided Writing heading could start at the page foot and the writing box could start low. Fix: `.guided-writing-step { break-before: page }`. Evidence: `long_after.pdf` page 17 starts at the top.
6. Tick boxes did not print. `<span class="checkbox">` had no base style (only a print override), so self-check lists, performance check, and reflection scale had no visible box. Fix: base `.checkbox` style (14 px square). Evidence: `long_after.pdf` pages 13, 14, 17.
7. Reading marking key (`.marking-legend`) had no style and printed as stacked loose lines. Fix: compact flex row. Evidence: `img.pdf` page 11.
8. Thai text overflow risk in translation, match definitions, and table cells. Fix: `overflow-wrap: anywhere` and `line-break: loose`. No clipping found in Thai samples before or after.

## Checked, no defect found

Article with hero and inline images (`images.json` page 11), vocabulary and writing-prompt images, QR codes, vocabulary match, fill in blanks with word bank, sentence order, sentence completion, Thai translation, lesson numbering (sequential in both books), Origins 2 and Origins 3.1 full books (no content overflow reported by a script that compares every element box with its page content box).

## Open (outside the allowed file list, or needs a decision)

- O1. Paged.js does not repeat the table header on a continuation page, even with `display: table-header-group`. The column width is now safe, so this is a comfort issue only. Fix would need a Paged.js hook (`Paged.Handler`) in `lib/document-wrapper`.
- O2. "Preface" page prints an empty heading when no preface text exists for the CEFR level (`origins-3.1-a0`, page 2). Fix in `lib/document-wrapper/sections/preface.ts`: skip the section when the text is empty. Not edited (out of scope).
- O3. "My Learning Reflection" (self-assessment) splits across two pages (`book31.pdf` pages 265 to 266). Needs a `break-inside: avoid` in `lib/document-wrapper/sections/self-assessment.ts` or `styles.ts`.
- O4. `@media print` rules in the template (`.section.phase-3`, `.read-article-step` `break-before: page`, `font-size: 12pt`) apply only after Paged.js lays out the pages, so they do not control layout. They had no visible effect in test prints. Daniel should decide whether to delete them or move them to screen CSS. Moving them would change page counts of books already printed, so it was not done.
- O5. Some pages are half empty because of keep-together rules (for example Guided Response, `long_after.pdf` page 14). This is the cost of no split boxes. Accept or tune.
- O6. Vocabulary table row height: the write-in cell has two 6 mm lines. This is enough for a short word or sentence. A drawing needs more space. Daniel to decide.
