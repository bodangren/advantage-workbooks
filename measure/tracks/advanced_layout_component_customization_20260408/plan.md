# Implementation Plan: Advanced Layout & Component Customization

## Phase 1: Schema Extension & Backward Compatibility Guard

- [ ] Task: Open `dashboard/lib/workbook-schema.ts` and add the optional `section_order` field as specified in the spec. Run `npx tsc --noEmit` to confirm no type errors. Run `npm run test:run` to confirm existing tests still pass.
- [ ] Task: Write a regression Vitest test in `dashboard/lib/__tests__/section-order-compat.test.ts`. Load a fixture `WorkbookLesson` without `section_order` and assert `WorkbookLessonSchema.safeParse()` returns `success: true`. Load one with all valid `section_order` values and assert the same. Load one with an invalid section type string and assert `success: false`. Confirm tests pass.
- [ ] Task: Update any AI prompt in `lib/ai-augmentor.ts` or `lib/lesson-generator.ts` that embeds the Zod-derived JSON schema to regenerate from the updated `workbook-schema.ts`. Run `npm run lint` and `npx tsc --noEmit`. Fix all errors.
- [ ] Task: Measure — User Manual Verification 'Phase 1: Schema Extension & Backward Compatibility Guard' (Protocol in workflow.md)

## Phase 2: Activity Generators

- [ ] Task: Write failing Vitest tests for `dashboard/lib/activities/crossword-generator.ts` in `dashboard/lib/activities/__tests__/crossword-generator.test.ts`. Use a fixture vocabulary of 8 words. Assert: `generateCrossword` returns a `CrosswordGrid`; `grid` has `height` rows each of length `width`; `clues_across` and `clues_down` are non-empty arrays; every word in `clues_across`/`clues_down` appears in the grid (scan rows/columns). Also assert: with 0 vocabulary items, function throws or returns an empty grid gracefully. Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/lib/activities/crossword-generator.ts`. Use the interlocking placement algorithm (longest word horizontal first, subsequent words attempt to share letters, max 50 tries per word). Confirm tests pass (Green).
- [ ] Task: Write failing Vitest tests for `dashboard/lib/activities/word-search-generator.ts`. Assert: `generateWordSearch` returns a `WordSearchGrid`; `grid` is a 15×15 array of single uppercase letters; every word in `words` appears in the grid (horizontal or vertical); filling is uppercase alpha only. Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/lib/activities/word-search-generator.ts`. Place words top-to-bottom or left-to-right (try both orientations, skip if no fit after 20 attempts). Fill remaining cells with `String.fromCharCode(65 + Math.floor(Math.random() * 26))`. Confirm tests pass (Green).
- [ ] Task: Write failing Vitest tests for `dashboard/lib/activities/match-image-generator.ts`. Assert: returns `null` when fewer than 3 images or vocabulary items; returns a `MatchImageActivity` with up to 6 pairs when sufficient data exists; the `words` list in returned data is shuffled (run 10 times and assert it is not always in original order, probabilistic). Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/lib/activities/match-image-generator.ts`. Select up to 6 pairs from `lesson.article_images` and `lesson.vocabulary` (zip by index up to min length, cap at 6). Shuffle the words array using Fisher-Yates. Confirm tests pass (Green).
- [ ] Task: Run `npm run test:run`. Verify >80% coverage on all three generator files. Fix gaps.
- [ ] Task: Measure — User Manual Verification 'Phase 2: Activity Generators' (Protocol in workflow.md)

## Phase 3: Handlebars Templates for New Activity Types

- [ ] Task: Create `dashboard/templates/crossword.hbs`. Render the crossword grid as an HTML `<table>` with fixed-size cells (use inline style or existing CSS classes). Black cells have `class="black"`. Numbered entry cells display the clue number in a `<sup>`. Print an "Across" and "Down" clue list below the grid. Visually verify by compiling a test lesson with a crossword section.
- [ ] Task: Create `dashboard/templates/word-search.hbs`. Render the letter grid as an HTML `<table>` with monospace font. Print the word list below in two columns. Visually verify.
- [ ] Task: Create `dashboard/templates/match-the-image.hbs`. Render two columns: left column has numbered images (use `<img>` with `src="{{image_url}}"`, constrained height), right column has lettered vocabulary words. Add an instruction line "Draw a line to match each image with the correct word." Visually verify.
- [ ] Task: Update `dashboard/lib/template-renderer.ts` (or the compile entry point) to: (a) check if `section_order` is present on a lesson; (b) if present, render only the listed sections in order, calling the appropriate generator for `crossword`, `word_search`, and `match_the_image` before rendering their templates; (c) if absent, use the existing fixed order unchanged.
- [ ] Task: Write Vitest tests for the updated `template-renderer.ts` logic: (a) with `section_order: ["article", "crossword"]` — assert only those two sections appear in the output HTML; (b) with no `section_order` — assert output matches the existing fixed-order output (use a snapshot or check for presence of all default sections). Confirm tests pass.
- [ ] Task: Run `npm run test:run`, `npm run lint`, and `npx tsc --noEmit`. Fix all errors.
- [ ] Task: Measure — User Manual Verification 'Phase 3: Handlebars Templates for New Activity Types' (Protocol in workflow.md)

## Phase 4: Section Builder UI

- [ ] Task: Write failing component tests (using `@testing-library/react`) for `dashboard/components/SectionBuilder.tsx`. Use a mock `section_order` prop and an `onChange` callback. Assert: active sections list renders in the correct order; dragging is testable via firing `dragstart`/`drop` events on elements; clicking the trash icon removes the section and calls `onChange` with the updated array; palette shows sections not in the active list. Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/components/SectionBuilder.tsx`. Use HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`). Maintain a local `useState` copy of `section_order` and call the `onChange` prop after each mutation. Use `lucide-react` icons (`GripVertical` for drag handle, `Trash2` for remove, `Plus` for add from palette). Style with Tailwind classes consistent with existing dashboard components. Confirm component tests pass (Green).
- [ ] Task: Integrate `SectionBuilder` into the lesson editor page (`dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx`). Read `section_order` from the lesson state (or derive the default order if absent). Pass changes back to the lesson state so they are included in the next "Save" action. Wire the debounced preview re-compile on `section_order` change (500ms `useEffect` with `AbortController`).
- [ ] Task: Run `npm run test:run`. Verify >80% coverage on `SectionBuilder.tsx`. Fix coverage gaps.
- [ ] Task: Manually run the development server. Open a lesson editor. Reorder sections in the builder. Click Save. Reload the page — confirm the order is persisted. Add a Crossword from the palette, save, and compile — confirm the crossword appears in the compiled output.
- [ ] Task: Run `npm run build`. Confirm zero build errors.
- [ ] Task: Update `measure/tech-debt.md` and `measure/lessons-learned.md` (prune to <=50 lines). Document the crossword interlocking algorithm approach and the vanilla DnD pattern.
- [ ] Task: Measure — User Manual Verification 'Phase 4: Section Builder UI' (Protocol in workflow.md)
