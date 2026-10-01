# Plan: Origins 2 and 3.1 app refresh

Track: `origins_app_refresh_20261001`

## Phase 0: Flat 2D cast

- [x] Picture tests: subject references give a 3D look; flat style and looks give the same character (spec)
- [x] `cast-sheets.ts`: no subject reference by default (`--with-source` keeps the old way); test
- [x] `cast.json`: flat 2D style; a `look` for every character
- [~] Two flat 2D sheet candidates for each of the 15 characters; Claude chooses on `/review/cast`
- [ ] Scene prompts use the flat style and the looks with no reference; E12 pictures again

## Phase 1: Importer (TDD)

- [ ] Tests: printed workbook file → package (locked text, vocabulary, and print part; article id; level)
- [ ] `lib/lesson-package/import-printed.ts` and `scripts/import-printed.ts`
- [ ] Check `locked`: fails when the paragraphs, the vocabulary words, or the print part differ from the printed file
- [ ] Text-profile checks report only (no fail) for printed lessons
- [ ] Review page: the locked parts are read-only
- [ ] Import the 27 lessons

## Phase 2: Supporting content (Claude writes; Daniel checks the Thai)

- [ ] Sentence Thai, summary, glossary, and app question bank for the 14 Origins 2 lessons
- [ ] The same for the 13 Origins 3.1 lessons

## Phase 3: Pictures

- [ ] 3 pictures for each lesson, 2 candidates each; Claude chooses; Daniel reviews

## Phase 4: Audio

- [ ] Narrator voice for each lesson; article, words, flashcards, and Tutor clips

## Phase 5: Injection (needs the production read)

- [ ] Read-only production check: field map, the 27 articles, and the rows that point at their questions (Q-ORF-01, Q-ORF-02)
- [ ] Bucket backup prefix for the old objects; update mode in the injector
- [ ] Inject and verify the 27 lessons and E12
