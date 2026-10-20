# Spec: v2 workbook look (Chibi Quest) for Primary levels 5–9

Track: `primary_v2_look_20261020`. Type: feature (story-shaped).

## Overview

**Sprint goal:** Quest 5 goes to the printer by 2026-11-06 in the Chibi Quest look of the app, and the books of levels 1–4 print exactly as before.

Daniel approved the Chibi Quest look of the 14 app lesson steps on 2026-10-20 (advantage-pr `CHANGELOG.md`, `assets/screenshots/CURRENT.md` v1.6). His workbook look decisions of 2026-10-20 are in advantage-pr `02-brand/naming-conventions.md` v1.4 (ad6dca9, 2bbcfd4):

- Only Primary Advantage books get the Chibi Quest look. It starts with Quest 5. Origins 1 to Quest 4 keep their present look.
- The work starts after the Primary cutover (2026-10-20).
- Reading Advantage books get the Riven Lands look (planned only). A Tutor Advantage book takes the look of its program.

Source of the look (monorepo, branch `primary-parity-integration`, worktree `~/Desktop/rama-worktrees/integration`):

- `docs/primary-rpg-skin.md` (design authority, owner approved 2026-10-06).
- `apps/primary-advantage/styles/rpg.css`: the `--cq-*` tokens (lines 3–21) and the lesson classes (lines 324–339).
- Commit d5e911951 (lesson restyle): `components/lesson/task/task-header.tsx` (wood sign step header), `components/lesson/lesson-step-rail.tsx` (gold medal, step bar).
- `packages/domain/src/primary-books/step-map.ts`: the map from the 14 app steps to the 13 printed steps.
- Captures: advantage-pr `assets/screenshots/primary-advantage/parity-run2-2026-10-19/student/lesson-step*.png`.

Tokens (rpg.css): ink #3b2a1a, ink-soft #6b5438, parchment #f3e4c3, parchment-2 #e9d4a8, parchment-edge #b58a4e, wood #8a5a2b, wood-dark #5c391a, wood-light #b37a3f, iron #4a4f57, gold #e8b534, gold-dark #a8781a, red #d64545, green #4fb45a, blue #3f7fd6, light text on wood #fff4dc. Right: fill #dfeccd, border #2f6b35, text #1f4a23. Wrong: fill #f3d6cc, border #8f2424, text #6b1717. Gold text #7a5410. Radii: panel 14 px, button 12 px, sign 8 px, well 10 px. Borders 2–3 px.

Decisions in this session (Daniel, 2026-10-20):

- Books: levels 5–9 only (Quest 5, Quest 6.1, 6.2, Adventure 7.1 to 9.3).
- Depth: the look and the app step names.
- Page: a white page. Parchment, wood, and gold are accents only (step signs, panel frames, labels). Write-in areas stay white.
- Fonts: Fredoka (Latin) and Mitr (Thai) for signs, titles, and labels. Quicksand (the app's story font) and Sarabun (Thai) for the article and question text.
- Order: Quest 5 first. Its printer file is due on 2026-11-06.

## Stories

### Story S1: Look switch per book
**As** the workbook builder
**I want** a `look` option (`classic` | `chibi-quest`) for each book
**So that** levels 5–9 print in the new look and levels 1–4 print exactly as before

**Acceptance Criteria:**
- Given a lesson of Origins 1, Origins 2, Origins 3.1, Origins 3.2, or Quest 4, When it is compiled with no `look` or with `classic`, Then the HTML is byte-identical to the output before this track (the golden `content/primary/origins-3.2/print/golden/lesson-05{,-no-key}.html` and the 70 print files of 08bb160 do not change).
- Given a book of Quest 5 to Adventure 9.3, When it is compiled, Then it uses `chibi-quest`.
- Given the monorepo print kit, When it renders a lesson with no `look`, Then the lesson gets `classic`.

**Estimate:** M
**Priority:** Must

### Story S2: Static print fonts for the new look
**As** the printer
**I want** static font files for Fredoka, Mitr, and Quicksand with their OFL licence texts
**So that** every font embeds as a CID font and the file has no Type 3 font

**Acceptance Criteria:**
- Given the new faces in `dashboard/assets/print-fonts/` with their OFL files, When a `chibi-quest` book is printed, Then `make-pdfx.ts --check` passes and `pdffonts` lists only embedded static faces.
- Given bold Thai text in a sign, When it is printed, Then a real Mitr bold face is used (no synthetic bold).
- Given a `classic` book, Then its font list does not change.

**Estimate:** S
**Priority:** Must

### Story S3: Chibi Quest print kit
**As** a student who uses the app and the book
**I want** the workbook pages to look like the app lesson steps
**So that** the book and the app feel like one game

**Acceptance Criteria:**
- Given a step header, Then it is a wood sign: wood fill, a wood-dark border, a rivet dot at each end, the step number on a gold medal, the title in light text with no shadow, and the time on a chip.
- Given a panel (vocabulary card, article frame, notes box, score box), Then it has a white or parchment fill, a 3 px parchment-edge border, and a 14 px radius. Write-in areas stay white.
- Given an answer key or a score box, Then right and wrong use the app colors, and each always has a word or an icon too.
- Given any page, Then it has no gradient, no rgba, no opacity, no shadow, no emoji, and no dark background. Icons are SVG in `lib/document-wrapper/icons.ts`.
- Given Thai text, Then the Thai line-break rules of the present template still apply.
- Given step 11 (Guided Writing) and step 3 (the article), Then the title and the box stay on one page, the QR block does not orphan the header, and inline pictures do not split (tech debt of 2026-04-26).

**Estimate:** L
**Priority:** Must

### Story S4: App step names in the v2 books
**As** a teacher who uses the app and the book in one class
**I want** the printed steps to have the app names
**So that** the class finds the same step in both

**Acceptance Criteria:**
- Given a `chibi-quest` book, Then the printed steps have these names: 1 Introduction, 2 Preview Vocabulary, 3 First Reading, 4 Vocabulary Collection, 5 Deep Reading, 6 Sentence Collection, 7 Multiple Choice, 8 Short Answer, 9 Vocabulary Practice, 10 Sentence Practice, 11 Guided Writing, 12 Language Questions, 13 Lesson Summary. Steps 9, 10, and 11 keep their printed names, because no single app step matches them.
- Given the table of contents, the answer key, and the in-book teacher guide pages of that book, Then they use the same names.
- Given a `classic` book, Then the step names do not change.

**Estimate:** S
**Priority:** Must

### Story S5: Page proofs for Daniel
**As** Daniel
**I want** page proofs before any printer file
**So that** I approve the print look myself

**Acceptance Criteria:**
- Given the kit, When the proofs are made, Then Daniel gets contact sheets of every page of Quest 5 lesson 1 and of the longest Adventure 9 lesson, next to the app captures of the same steps.
- Given Daniel's notes, When they are fixed, Then he gets new proofs.
- Given no approval, Then no printer file is made.

**Estimate:** S
**Priority:** Must

### Story S6: Quest 5 printer file
**As** the printer
**I want** the Quest 5 interior as a PDF/X-1a file by 2026-11-06
**So that** the books arrive for semester 2

**Acceptance Criteria:**
- Given the approved Quest 5 packages, When the book is built (a `primary/quest-5-a1/` project from the packages, `make-book-pdf.ts`, `make-pdfx.ts --keep-fonts`), Then every `make-pdfx.ts` check passes, and every page was looked at on a contact sheet.
- Given the single-lesson PDFs, Then each one has the answer key on its last page.
- Given the QR codes, Then each lesson points to `https://primary.reading-advantage.com/b/q5/<n>`, and the article exists in the Primary database before the file goes to the printer.

**Estimate:** M
**Priority:** Must

### Story S7: Monorepo print kit sync
**As** the owner of the monorepo print kit
**I want** the commit id after each change of the template paths
**So that** the app's "print this lesson" output stays the same as the book

**Acceptance Criteria:**
- Given a commit that changes `primary_template.html`, `icons.ts`, `styles.ts`, `print-fonts.ts`, or `assets/print-fonts/`, When it lands, Then the monorepo session gets the commit id, and the classic golden files are unchanged.
- Given the look switch, Then the monorepo session knows the option name, its values, and the default.

**Estimate:** S
**Priority:** Should

## Non-Functional Requirements

- Print: PDF/X-1a, Japan Color 2001 Coated, 210 × 285 mm, no bleed. Flat solid fills of the tokens only. Static fonts only. Check every page of each print PDF.
- Pinned paths (catalogue pin 08bb160): the 70 packages of the five printed books, `dashboard/lib/teacher-manual/i18n`, and `Teacher guide/step-*.md` do not change.
- Heavy jobs (book PDFs, test sweeps): message the monorepo session first, and run them with `flock ~/Desktop/primary-parity-progress/heavy.lock`.
- Spelling: American English. Daniel checks all Thai.

## Acceptance Criteria (track)

- The classic output is byte-identical for the five printed books.
- Daniel approved the page proofs.
- The Quest 5 PDF/X-1a file passes every check and is in `~/Desktop/print-ready/` by 2026-11-06.

## Out of Scope

- Origins 1 to Quest 4 (they keep the present look).
- Reading Advantage books (Riven Lands, planned only) and Tutor-only books.
- Covers (track `book_covers_20261007`, Phase 4), the teacher manual, `Teacher guide/step-*.md`, and the app.
- The Phase 1 app shell (decision D10 is open): no copy of the wooden header bar, the HUD chips, or the signpost menu.

## Dependencies and Risks

- Daniel must approve the Quest 5 content (track `levels_5_9_20261006`) before the print.
- The Quest 5 cover (covers track, Phase 4) is also due on 2026-11-06.
- The Quest 5 articles must be in the new Primary database before the print (QR links). The levels 5–9 load comes after the cutover.
- Fredoka is a variable font in the app. The print needs static instances, and Quicksand too.
