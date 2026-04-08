# Track: Advanced Layout & Component Customization

## Overview

Today the workbook compiler produces a fixed sequence of sections for every lesson: article, vocabulary list, comprehension questions, vocab-match, vocab-fill, sentence order, writing prompt, and the automatically generated back-matter (flashcards, spelling practice, self-assessment, teacher guide). Content authors cannot reorder these sections, remove unwanted activities from specific lessons, or add new activity types without modifying Handlebars templates directly.

This track introduces a **Section Builder** — a drag-and-drop interface inside the lesson editor that lets a content author visually compose the activity sequence for each lesson. It also adds three new printable activity types that can be dragged in:

- **Crossword Puzzle** — auto-generated from the lesson's vocabulary list.
- **Word Search Grid** — auto-generated from the lesson's vocabulary list.
- **Match-the-Image** — a matching activity where students draw lines between images and their corresponding vocabulary words (images sourced from existing `article_images` in the lesson JSON).

The Section Builder operates on a new optional `section_order` array in the `WorkbookLesson` schema. If `section_order` is absent, the compiler falls back to the current fixed order (backward compatibility preserved).

## Functional Requirements

### 1. Schema Extension
- Add an optional `section_order` field to `WorkbookLessonSchema` in `dashboard/lib/workbook-schema.ts`:
  ```typescript
  section_order: z.array(z.enum([
    "article", "vocabulary", "comprehension", "vocab_match",
    "vocab_fill", "sentence_order", "writing_prompt",
    "crossword", "word_search", "match_the_image"
  ])).optional()
  ```
- All existing lesson JSON files without this field remain valid (Zod `.optional()` ensures backward compat).
- Update `zod-to-json-schema` output used in any AI prompts that embed the schema.

### 2. Section Builder UI (`SectionBuilder` Component)
- Create `dashboard/components/SectionBuilder.tsx` — a Client Component rendered inside the lesson editor page (`dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx`).
- The builder shows two columns:
  - **Active Sections (left):** The ordered list of sections currently in `section_order` (or the default order if not set). Each section is a draggable card showing an icon and label.
  - **Available Sections (right):** A palette of section types not yet in the active list (or all types if the author wants duplicates — duplicates are not supported in this track).
- Drag-and-drop is implemented using the HTML5 `draggable` attribute and `dragstart`/`dragover`/`drop` events (no external DnD library, consistent with the approach in the Interactive Digital Export track).
- Dragging a card from the palette to the active list inserts it at the drop position.
- Dragging within the active list reorders sections.
- A trash-can icon on each active section card removes it from the active list.
- Changes are applied immediately to the in-memory lesson state and saved to disk/Supabase when the author clicks the existing "Save" button in the lesson editor.

### 3. Compiler Integration
- Update `dashboard/lib/template-renderer.ts` (or the workbook compiler entry point) to honor `section_order` when compiling a lesson.
- If `section_order` is present, render only the specified sections in the specified order.
- If `section_order` is absent, use the existing default order unchanged.
- For new section types (`crossword`, `word_search`, `match_the_image`), the compiler calls the appropriate generator before rendering the Handlebars template for that section.

### 4. Crossword Generator (`lib/activities/crossword-generator.ts`)
- Export `generateCrossword(vocabulary: VocabularyItem[]): CrosswordGrid`.
- Implements a simplified crossword placement algorithm: start with the longest word placed horizontally, then attempt to interlock subsequent words at shared letters. Make up to 50 placement attempts per word; skip words that cannot be placed.
- Output type `CrosswordGrid`: `{ grid: string[][], clues_across: { number, word, clue }[], clues_down: { number, word, clue }[], width: number, height: number }`.
- `clue` is derived from `vocabulary.definition` (truncated to 60 characters if longer).
- The grid is rendered in a Handlebars template `dashboard/templates/crossword.hbs` using an HTML table with fixed-width cells, bold border cells, and numbered entry cells. Empty cells render as black-filled `<td class="black">`.

### 5. Word Search Generator (`lib/activities/word-search-generator.ts`)
- Export `generateWordSearch(vocabulary: VocabularyItem[], gridSize?: number): WordSearchGrid`.
- Default `gridSize` is `15` (15×15). Place words horizontally and vertically (no diagonals in this version). Fill remaining cells with random uppercase letters.
- Output type `WordSearchGrid`: `{ grid: string[][], words: string[] }`.
- The grid renders in `dashboard/templates/word-search.hbs` as an HTML table with monospace font, letter-spaced cells. A word list is printed below the grid.

### 6. Match-the-Image Activity (`lib/activities/match-image-generator.ts`)
- Export `generateMatchImageActivity(lesson: WorkbookLesson): MatchImageActivity | null`.
- Returns `null` if the lesson has fewer than 3 `article_images` or fewer than 3 vocabulary items.
- Selects up to 6 image+vocabulary pairs. Each pair is `{ image_url: string, word: string }`.
- Rendered by `dashboard/templates/match-the-image.hbs`: two columns — left column shows numbered images (small, ~60px tall), right column shows lettered vocabulary words in shuffled order. Students draw lines on the printed page to match them.

### 7. Section Builder Preview
- When the author reorders sections in the Section Builder, the lesson preview iframe (if visible) should re-compile to reflect the new order. This is achieved by debouncing a `section_order` change event (500ms) and re-triggering the existing compile-and-render flow.

## Non-Functional Requirements

- **Backward Compatibility:** All existing lesson JSON files without `section_order` must compile identically to today's output. This is verified by a regression test.
- **No External DnD Library:** Drag-and-drop is vanilla HTML5 API only, consistent with project conventions.
- **No New CSS Frameworks:** Use existing Tailwind classes. New Handlebars templates use plain CSS consistent with existing templates.
- **Test Coverage:** >80% on `crossword-generator.ts`, `word-search-generator.ts`, `match-image-generator.ts`, and `SectionBuilder.tsx` component tests.
- **TypeScript Strict:** Zero `tsc` errors on all new files.

## Acceptance Criteria

- [ ] `WorkbookLessonSchema` has the optional `section_order` field and `npm run test:run` still passes.
- [ ] Opening the lesson editor shows the Section Builder panel with all existing sections listed in the active column.
- [ ] Dragging a section card within the active column reorders it. After saving, the saved JSON reflects the new order.
- [ ] Dragging "Crossword" from the palette into the active list and compiling produces a workbook page with a printed crossword grid and across/down clues.
- [ ] Dragging "Word Search" from the palette and compiling produces a 15×15 letter grid with vocabulary words hidden inside.
- [ ] Dragging "Match-the-Image" from the palette and compiling produces a two-column matching activity (only if the lesson has sufficient images).
- [ ] Removing a section from the active list and compiling omits that section from the compiled workbook.
- [ ] A lesson with no `section_order` compiles identically to the pre-track output (regression test passes).
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run test:run` all pass with zero errors.
- [ ] `npm run build` succeeds.

## Out of Scope

- Diagonal word placement in word search.
- Duplicate section types in a single lesson (e.g., two crossword sections).
- Drag-and-drop between different lesson editors (reordering applies to one lesson at a time).
- Custom activity templates uploaded by the user.
- Crossword answer key generation (letters are shown in the Teacher Guide section, which already exists).
