# Plan: v2 workbook look (Chibi Quest) for Primary levels 5–9

Track: `primary_v2_look_20261020`. Spec: [spec.md](./spec.md).

Dates (printer file due 2026-11-06): S1–S4 by 2026-10-27; proofs to Daniel on 2026-10-28 (S5); Quest 5 build 2026-11-02 to 05 (S6). Every heavy job: a message to the monorepo session first, then `flock ~/Desktop/primary-parity-progress/heavy.lock`. Every commit on a template path: send the id to the monorepo session (S7).

## Phase S1: Look switch per book
_Story ref: spec.md#story-s1_

- [ ] Task: Contract
    - [ ] `look?: 'classic' | 'chibi-quest'` in the render options of `lib/template-renderer.ts` (next to `firstLessonNumber` and `headerStrip`); default `classic`
    - [ ] The book's look: `look` in `primary/<project>/project.json`, and a book-folder map in `lib/lesson-package/files.ts` (Quest 5 to Adventure 9.3 → `chibi-quest`)
- [ ] Task: Tests (first)
    - [ ] Classic is byte-identical: the golden `origins-3.2/print/golden/lesson-05{,-no-key}.html` and the 70 print files of 08bb160 (`export-print-data.ts` output compared with git)
    - [ ] A Quest 5 package renders with `chibi-quest`; no `look` gives `classic`
- [ ] Task: Implement
    - [ ] The chibi-quest CSS goes in a separate block that only the `chibi-quest` look adds, so the classic HTML does not change
    - [ ] Pass `look` through the compile route, `render-lesson-html.ts`, `make-book-pdf.ts`, `make-lesson-pdfs.ts`, and `print-export.ts`
- [ ] Task: Docs: the option in `content/primary/README.md`
- [ ] Task: Measure - User Manual Verification 'Phase S1: Look switch per book' (Protocol in workflow.md)

## Phase S2: Static print fonts for the new look
_Story ref: spec.md#story-s2_

- [ ] Task: Contract: the faces that the kit uses (measure them on a first S3 render): Fredoka 500/600/700, Mitr 400/500/700 (Thai range), Quicksand 400/500/700
- [ ] Task: Tests (first): `print-fonts.ts` lists each new face with an existing file; a `chibi-quest` render embeds only static faces (`pdffonts`, no Type 3); the classic font list does not change
- [ ] Task: Implement
    - [ ] Static woff2 files (Fontsource builds of Google Fonts) and the OFL texts in `dashboard/assets/print-fonts/`; read each licence first
    - [ ] Register the faces in `lib/document-wrapper/print-fonts.ts`; add them only for the `chibi-quest` look
- [ ] Task: Docs: `assets/print-fonts/README.md`, `measure/tech-stack.md`
- [ ] Task: Measure - User Manual Verification 'Phase S2: Static print fonts for the new look' (Protocol in workflow.md)

## Phase S3: Chibi Quest print kit
_Story ref: spec.md#story-s3_

- [ ] Task: Contract: a token table for print (the `--cq-*` hex values as flat fills) and the part list: wood step sign with rivets, gold step medal, time chip, parchment panel frame, white write-in box, right and wrong boxes with a word or icon, score medal
- [ ] Task: Tests (first)
    - [ ] The `chibi-quest` CSS has no `gradient`, `rgba(`, `opacity`, `box-shadow`, `text-shadow`, or emoji
    - [ ] The step header HTML has the medal, the title, and the time chip; right and wrong boxes always have a word or an icon
- [ ] Task: Implement
    - [ ] Tokens, step sign, medal, and chip
    - [ ] Panels and write-in boxes (white page, parchment accents)
    - [ ] Answer key, score box, self-assessment, glossary, flashcards, and TOC in the kit
    - [ ] SVG icons in `icons.ts` for the steps (no emoji)
    - [ ] Tech debt: step 11 (title and writing box on one page) and step 3 (QR block, header, inline pictures), checked on Quest 5 and Adventure 9 lessons
- [ ] Task: Verify: a scratch render of Quest 5 lesson 1; `make-pdfx.ts --check` passes; every page on a contact sheet
- [ ] Task: Measure - User Manual Verification 'Phase S3: Chibi Quest print kit' (Protocol in workflow.md)

## Phase S4: App step names in the v2 books
_Story ref: spec.md#story-s4_

- [ ] Task: Contract: a step-name table for `chibi-quest` (13 printed steps; 9, 10, and 11 keep their names), from `packages/domain/src/primary-books/step-map.ts` of the monorepo
- [ ] Task: Tests (first): a `chibi-quest` render shows the 13 names in the lesson pages, the TOC, the answer key, and the in-book teacher pages; a `classic` render keeps the present names
- [ ] Task: Implement: names in `primary_template.html` and `sections/teacher-guide.ts` by look; `lib/teacher-manual/` (pinned i18n) does not change
- [ ] Task: Measure - User Manual Verification 'Phase S4: App step names in the v2 books' (Protocol in workflow.md)

## Phase S5: Page proofs for Daniel
_Story ref: spec.md#story-s5_

- [ ] Task: Proofs of Quest 5 lesson 1 and the longest Adventure 9 lesson: every page as a contact sheet, next to the app captures of the same steps (`parity-run2-2026-10-19/student/lesson-step*`)
- [ ] Task: Daniel's notes fixed; new proofs until he approves (date and notes in this plan)
- [ ] Task: Measure - User Manual Verification 'Phase S5: Page proofs for Daniel' (Protocol in workflow.md)

## Phase S6: Quest 5 printer file
_Story ref: spec.md#story-s6_

- [ ] Task: Preconditions: Daniel approved the Quest 5 content (levels 5–9 track); the Quest 5 articles are in the new database (QR); the Quest 5 cover is ready (covers track)
- [ ] Task: Tests (first): the project has 14 lessons, `look` `chibi-quest`, and `article_url` `https://primary.reading-advantage.com/b/q5/<n>` for each lesson
- [ ] Task: Implement
    - [ ] `primary/quest-5-a1/` project from the packages (`scripts/build-workbook-json.ts`)
    - [ ] Book PDF (`make-book-pdf.ts`), PDF/X-1a (`make-pdfx.ts --keep-fonts`), and the 14 lesson PDFs (`make-lesson-pdfs.ts`), under the lock
- [ ] Task: Verify: every `make-pdfx.ts` check passes; every page looked at; answer key on the last page of each lesson PDF; QR codes scanned on 3 lessons
- [ ] Task: Deliver: `~/Desktop/print-ready/Primary-Advantage-Quest-5_PDFX-1a.pdf` by 2026-11-06
- [ ] Task: Measure - User Manual Verification 'Phase S6: Quest 5 printer file' (Protocol in workflow.md)

## Phase S7: Monorepo print kit sync
_Story ref: spec.md#story-s7_

- [ ] Task: After each commit on `primary_template.html`, `icons.ts`, `styles.ts`, `print-fonts.ts`, or `assets/print-fonts/`: check that the classic golden is unchanged, and send the commit id to the monorepo session
- [ ] Task: Tell the monorepo session the option name `look`, its values, and the default `classic`
- [ ] Task: Measure - User Manual Verification 'Phase S7: Monorepo print kit sync' (Protocol in workflow.md)

## Close

- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
