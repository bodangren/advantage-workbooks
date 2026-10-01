# Plan: Origins 2 and 3.1 app refresh

Track: `origins_app_refresh_20261001`

## Phase 0: Flat 2D cast

- [x] Picture tests: subject references give a 3D look; flat style and looks give the same character (spec)
- [x] `cast-sheets.ts`: no subject reference by default (`--with-source` keeps the old way); test
- [x] `cast.json`: flat 2D style; a `look` for every character
- [x] Two flat 2D sheet candidates for each of the 15 characters; Claude chose 15 on `/review/cast`
- [x] Scene prompts use the flat style and the looks with no reference; E12 pictures again (Daniel chose and approved E12)

## Phase 1: Importer (TDD)

- [x] Tests: printed workbook file → package (locked text, vocabulary, and print part; article id; level)
- [x] `lib/lesson-package/import-printed.ts` and `scripts/import-printed.ts`
- [x] Check `locked`: fails when the paragraphs, the vocabulary words, or the print part differ from the printed file; check `todo` lists the "?" fields
- [x] The text profile does not run on the locked text; printed activity defects only warn
- [x] Review page: the locked parts are read-only
- [x] Import the 27 lessons (Thai paired: 761 of 1,120 sentences)

## Phase 2: Supporting content (Claude writes; Daniel checks the Thai)

- [x] Supplement file per lesson (`lib/lesson-package/supplement.ts`, `scripts/apply-supplement.ts`); it refuses changes to the locked parts; tests
- [x] Sentence Thai, summary, glossary, and app question bank for the 14 Origins 2 lessons
- [x] The same for the 13 Origins 3.1 lessons (printed Thai paired where a sentence was split; one missing sentence written)
- [x] Check `print-set` warns (not fails) for a printed lesson: its questions are on paper; test

## Phase 3: Pictures

- [x] 3 pictures for each lesson, 3 candidates each; Claude chose all 81 against the old app pictures (redo for 16 pictures: non-cast looks, story looks, one mmx timeout)
- [ ] Daniel reviews the pictures on `/review`

## Phase 4: Audio

- [x] Narrator voice for each lesson; article, words, flashcards, and Tutor clips — all 27 lessons (85b2b63); a failed mmx call is tried again (0d35dab)

## Phase 5: Injection (needs the production read)

- [x] Read-only production check: field map, the 27 articles, and the rows that point at their questions (Q-ORF-01, Q-ORF-02) — `scripts/sample-legacy.ts` (31e936f, 311a2a0)
- [x] Bucket backup prefix for the old objects; update mode in the injector (printed article id, old rows replaced, passage line breaks kept, `words` null)
- [x] Dry run passes for all 27 lessons (update) and E12 (new); only the lesson approval is missing
- [ ] Daniel approves the lessons; inject and verify the 27 lessons and E12
