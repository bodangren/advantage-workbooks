# Plan: storytime_print_r1_20261025

Spec: [spec.md](./spec.md). Release-1 goal: 2026-12-01. Daniel's approval of the release proof: 2026-11-24. Print order: 2026-11-25.

## Rules for every task

- Tests first. The Red task writes failing tests and commits them. The Green task makes them pass. A review role does not fix code; it reports.
- New tests load the shipped week files `content/storytime/l2/w01.json` to `w08.json` (rule 11.3). Each new check has a mutation test on a copy in a temporary folder (rule 11.1). Keep a copy of a source file before an in-place mutation, and compare it after a stopped run (lessons-learned, 2026-10-22).
- A task becomes `[x]` only with its commit SHA and its evidence class: owner-approved, person-checked, automated, or peer-report (rules 7.1 and 7.2).
- A task that waits for Daniel stays `[ ]`, so that its phase stays open. Do not mark it `[b]`.
- Heavy jobs (tsc, Chrome, Ghostscript) run under `flock ~/Desktop/primary-parity-progress/heavy.lock`. No `pnpm install`. Run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed.
- Stage files path by path. Do not touch `video/**` (another session has an uncommitted change there).
- This repo has no `measure/generate.sh` or `measure/doctor.sh`. The doctor step of each phase is the `PROJECT_CHECKS` gate.

## Gate commands (orchestrator environment)

```bash
RED_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts'    # must fail after Red, before Green
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts'  # must pass after Green
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-print-*.test.ts'
PROJECT_CHECKS='cd dashboard && out=$(npx tsx scripts/storytime/check-weeks.ts --level 2); test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -le 1 && ! printf "%s\n" "$out" | grep "  FAIL " | grep -v "  FAIL    published" && flock ~/Desktop/primary-parity-progress/heavy.lock npx tsc --noEmit'
UX_REQUIRED=never   # print files: the visual checks are the contact-sheet tasks and Daniel's proof checks
PRINT_GATE='cd dashboard && npx tsx scripts/print/make-pdfx.ts <print file> --check'   # exit 0 for each print file
```

Baseline at 8e6df79 (2026-10-25): `PROJECT_TESTS` passes 10 files and 119 tests. `check-weeks.ts --level 2` exits 1 with one known FAIL (st2/1 `published`, spec P14); the first part of `PROJECT_CHECKS` accepts one FAIL at most, and only that check (measured: exit 0 at 8e6df79). The `tsc` part was not run in this planning session.

Graph note: `graph.db` is from 2026-08-08 (stale), so the blast-radius lines come from `grep`, not from `build-graph`.

## Phases and dates

| Phase | Dates | End gate |
|---|---|---|
| 1 Contracts and the picture list | 2026-10-26 to 2026-10-28 | The picture list and the picture spec go to the PM session by 2026-10-28 |
| 2 Student book template, week 1 | 2026-10-27 to 2026-11-05 | The template is due on 2026-11-05 (monorepo plan, Phase 2) |
| 3 Teacher book print file, week 1 | 2026-10-27 to 2026-10-30 | The week 1 print files in Thai and English |
| 4 Books, week 1 | 2026-10-28 to 2026-11-05 | The week 1 pictures from Forge are needed by 2026-11-02 |
| 5 Covers, week 1 | 2026-11-02 to 2026-11-05 | Daniel approves the two week 1 cover pictures |
| 6 Week 1 proof and Daniel's approval | 2026-11-05 to 2026-11-09 | Daniel approves the week 1 print (rule 0.1) |
| 7 Weeks 2 to 8 | 2026-11-10 to 2026-11-18 | The pictures of weeks 2 to 7 from Forge are needed by 2026-11-16 |
| 8 Card kit and class sets | 2026-11-02 to 2026-11-19 | Only the week 1 cards before Daniel's week 1 approval (rule 0.2) |
| 9 Release proof and print order | 2026-11-19 to 2026-11-25 | Proof 2026-11-20; Daniel's approval 2026-11-24; print order 2026-11-25 |
| 10 Hand-off | 2026-11-25 to 2026-11-27 | Project memory and the "facts changed" list |

Risk: the weeks 2 to 7 pictures (about 96 story pages, 12 covers, and the picture words) have 7 days after Daniel's week 1 approval. If Forge cannot meet 2026-11-16, Daniel chooses between a later print order and the stop-rule split (weeks 1 to 4 on 2026-12-01, weeks 5 to 8 in January 2027).

## Phase 1: Contracts and the picture list (2026-10-26 to 2026-10-28)

_Blast radius: `StorytimeWeekSchema` (9 files: `lib/storytime/checks.ts`, `files.ts`, `phonemes.ts`; `scripts/storytime/book-audio.ts`, `set-phoneme-audio.ts`, `make-manual-pdf.ts`; `__tests__/storytime-week.test.ts`, `storytime-manual.test.ts`, `storytime-phonemes.test.ts`); `StorytimeApprovalsSchema` (only `schema.ts`). The change is additive._

- [ ] Task: Orchestrator setup. Add `measure/anti-patterns.md` (a copy of the canonical catalog A1 to A10 of the measure-orchestrator skill) in its own `docs(measure):` commit, because the orchestrator reads it and the file does not exist. Done when: `test -f measure/anti-patterns.md` and `grep -c '^## A' measure/anti-patterns.md` gives 10.
- [ ] Task (Red): `__tests__/storytime-print-contract.test.ts` on the shipped weeks.
    - The 8 shipped weeks parse without a `print` block; `approval.print` defaults to draft.
    - A `print` block for week 1 (letter box n, practice sheet, dictation lines, writing page) parses; a block with an unknown part fails.
    - The print-text check passes on week 1 with its block. On a broken copy (one A7 word removed from the practice sheet), it gives the error id `print-practice`.
    - The picture list of week 1 has 16 story-page rows, 2 cover rows, and the 9 check-row pictures of `check.items` (nest, cat, fish, dog, nose, bus, hat, cup, net), and the practice-line pictures of the block.
    - Every row has a size class A, B, or C of spec FR-9 and a file name that matches `^l2-w\d{2}-[a-z-]+-v\d+\.png$`.
    - Done when: `RED_TEST_COMMAND` fails only on these new tests, and the commit holds only the test file.
- [ ] Task (Green): the contract and the picture list.
    - `lib/storytime/schema.ts`: the optional `print` block and the `print` approval part (FR-1).
    - `lib/storytime/print/text-check.ts` (the A3, A7, C3, D4, and E5 comparison) and its entry in `checks.ts`.
    - `lib/storytime/print/pictures.ts` and `scripts/storytime/print-pictures.ts --level 2`, which writes `content/storytime/l2/print/pictures.json` and `pictures.md` (FR-2).
    - Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Content): the week 1 `print` block in `w01.json`, from the steps A3, A7, C3, and D4. The print-text check passes. One independent review subagent reads the block against the scripts and reports findings with file and line (lessons-learned, 2026-10-22). Daniel sees the block in the week 1 proof. Evidence: automated plus peer-report.
- [ ] Task (Hand-off): send the picture list (weeks 1 to 8, as planning data) and the FR-9 picture spec to the PM session for Forge. The message gives what, why, done-when, and the dates needed: week 1 pictures by 2026-11-02, weeks 2 to 7 by 2026-11-16 (the renders of weeks 2 to 7 start after Daniel's week 1 approval unless Daniel says otherwise). Send the open points P1 to P14 to Daniel through the PM session on one page. Done when: the PM session confirms receipt (peer-report).
- [ ] Task: Measure - User Manual Verification 'Phase 1: Contracts and the picture list' (Protocol in workflow.md)

## Phase 2: Student book template, week 1 (2026-10-27 to 2026-11-05)

_Blast radius: `storytimeQrUrl` and `STORYTIME_QR_HOST` (`lib/storytime/files.ts`; `__tests__/storytime-week.test.ts` asserts the host). Do not change the host before Daniel answers P4._

- [ ] Task (Red): `__tests__/storytime-print-student-book.test.ts` on the shipped `w01.json`.
    - Page order: the name page, the book map, the week 1 spread, the check page, the home card leaf. The spread starts on a left page.
    - The letter box shows "n" with a start dot, three trace copies, and one write space.
    - The practice sheet lines are the lines of `print.practice`, in order.
    - The writing page has the trace text "Hello, I am" and a name line.
    - The check page has 3 picture rows with the 9 picture ids of `check.items` and one write-letter box. It has no answer mark.
    - The home card front has `home.line.th`, the words net, nut, nose, the frame, `home.activity.th`, and two QR codes whose input is `storytimeQrUrl(home.songUrl)` and `storytimeQrUrl(home.readAlongUrl)`. The back has the English card and the 15 song lines.
    - The HTML has no "CEFR", "Pre-A1", "Starters", or "Reading A-Z", and no CJK character. Every font face is a static OFL face (Andika for English, Sarabun for Thai).
    - The trim comes from one print-profile constant: the same week renders at A4 and at 210 × 285 mm.
    - Mutations: a removed home card, an answer mark, and a spread on a right page each fail a test.
- [ ] Task (Green): the student book.
    - Andika static faces (SIL OFL) and `OFL-andika.txt` in `dashboard/assets/print-fonts/` (no package change).
    - `lib/storytime/print/profile.ts` (trim, margins, bleed, page sizes in one place).
    - `lib/storytime/print/student-book.ts` (drawings for the letter box, the book map, and the cut line of the home card; Thai runs with `white-space: nowrap`, lessons-learned 2026-10-07).
    - `scripts/storytime/make-student-book-pdf.ts --level 2 --weeks 1 [--proof|--final]`: Paged.js in system Chrome, then `make-pdfx.ts --keep-fonts`, to `~/Desktop/print-ready/storytime/Storytime-Advantage-L2-U1-Student-Book-v<n>_PDFX-1a.pdf`.
    - Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check): the week 1 student-book pages under the heavy lock. `PRINT_GATE` passes. A contact sheet of every page at 100 dpi. The agent looks at every page and lists defects (rule 6.5). A person scans both QR codes on a printed page with a phone and records the result (person-checked; the URL target is open, P4).
- [ ] Task: Measure - User Manual Verification 'Phase 2: Student book template, week 1' (Protocol in workflow.md)

## Phase 3: Teacher book print file, week 1 (2026-10-27 to 2026-10-30)

_Blast radius: `compileStorytimeManual` (`scripts/storytime/make-manual-pdf.ts`; `__tests__/storytime-manual.test.ts`). The template output must not change._

- [ ] Task (Red): `__tests__/storytime-print-teacher-book.test.ts`.
    - The text gate (`lib/storytime/print/text-diff.ts`) takes two `pdftotext -layout` outputs and reports each line that differs, except page numbers. A changed Thai word in a copy gives one difference. The same text gives none.
    - The print file name has a version and the language: `Storytime-Advantage-L2-U1-Teachers-Book-TH-v1_PDFX-1a.pdf`.
    - The Thai HTML of the shipped `w01.json` has every step id of the week and the four headings (`getTranslations('th').teachingNotes`).
- [ ] Task (Green): `scripts/storytime/make-teacher-book-print.ts --level 2 --weeks <list> --lang th|en`. It calls `compileStorytimeManual` (A4), renders the Chrome PDF, runs the text gate against the draft of each week, and runs `make-pdfx.ts --keep-fonts`. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check): the week 1 teacher book in Thai and English. `PRINT_GATE` passes. The text gate against `~/Desktop/primary-parity-progress/storytime/Storytime-L2-W01-Teachers-Book-{TH,EN}-draft.pdf` gives 0 differences, or each difference is listed with its cause for Daniel. A contact sheet of every page.
- [ ] Task: Measure - User Manual Verification 'Phase 3: Teacher book print file, week 1' (Protocol in workflow.md)

## Phase 4: Books, week 1 (2026-10-28 to 2026-11-05)

- [ ] Task (Red): `__tests__/storytime-print-books.test.ts` on the two books of the shipped `w01.json` ("Hello!" and "Nan Can Nod").
    - Each book has 12 pages in the page plan of spec FR-5.
    - The text of each story page is `pages[i].text`. The decodable has its sounds page (n; nest, net, nut, ...; a, and, can) and its back-cover word list (`backWords`).
    - The cover has the title, "Sprout", "Storytime Advantage", and the week number.
    - `final` mode throws when a picture file is missing and names the picture id. `proof` mode prints "PICTURE MISSING".
    - The picture measurement check (`lib/storytime/print/picture-check.ts`, sharp metadata) passes a 3000 × 2250 sRGB PNG with no alpha. It fails a 1024 px copy, an RGBA copy, a CMYK copy, and a wrong file name.
- [ ] Task (Green): `lib/storytime/print/books.ts`, `lib/storytime/print/picture-check.ts`, and `scripts/storytime/make-books-pdf.ts --level 2 --weeks <list> [--proof|--final] [--size a5|a3]`. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check, proof mode): the two week 1 books with empty picture boxes, for a layout check before the pictures come. A contact sheet of every page.
- [ ] Task (Pictures, week 1): receive the Forge week 1 batch with its manifest. Stage 1: `picture-check.ts` on every file. Stage 2: the model pre-check (rule 6.7) after Daniel's go for the models and the price (P7), with the calibration first. Stage 3: a person counts the objects against the text (rule 9.2). A failed picture goes back to Forge with the reason. Then the two books in `final` mode; `PRINT_GATE` passes. Evidence: automated, model pre-check, person-checked.
- [ ] Task: Measure - User Manual Verification 'Phase 4: Books, week 1' (Protocol in workflow.md)

## Phase 5: Covers, week 1 (2026-11-02 to 2026-11-05)

_Blast radius: `COVER_BOOKS` (`lib/covers/catalogue.ts`, `schema.ts`, `check.ts`; `__tests__/covers-contract.test.ts`, `covers-back.test.ts`): no change. `lib/covers/compose.ts` is reused, not changed._

- [ ] Task (Red): `__tests__/storytime-print-covers.test.ts`.
    - The Storytime cover data schema (book kind, week, title, band, art files) refuses an unknown band.
    - The copy check fails a cover text with "CEFR", "Pre-A1", "Starters", or "Primary Advantage", a cover without "Storytime Advantage", and a book cover without "Sprout".
    - A composed side is one opaque layer (no alpha channel) at 300 ppi for the trim.
    - The Primary cover tests stay green.
- [ ] Task (Green): `lib/storytime/print/covers.ts` and `scripts/storytime/make-storytime-cover.ts <week> <readalong|decodable> [--print]`: PNG of each side for Daniel, then a 2-page Chrome PDF and `make-pdfx.ts --keep-fonts`. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check): the cover PNGs of the two week 1 books go to Daniel. After his approval, their print files; `PRINT_GATE` passes. Daniel checks any Thai on the covers.
- [ ] Task: Measure - User Manual Verification 'Phase 5: Covers, week 1' (Protocol in workflow.md)

## Phase 6: Week 1 proof and Daniel's approval (2026-11-05 to 2026-11-09)

- [ ] Task: the week 1 proof. The print files of the week 1 student-book pages, the two week 1 books with their covers, and the week 1 teacher book in Thai and English. A contact sheet of every page, and a list with the SHA-256 and the source commit of each file. The agent opens every page first (rule 6.5). The proof goes to Daniel through the PM session on 2026-11-05.
- [ ] Task (Owner gate): Daniel approves the week 1 print. Record his exact words and the date in `approval.print` of `w01.json` (rules 12.1 and 12.3). No answer is not an approval (rule 0.3). If he has not approved by 2026-11-09, ask him about the stop rule (spec P5). Evidence: owner-approved.
- [ ] Task: the fix list from Daniel's notes. Each changed file gets a new version (rule 12.2), passes its gates again, and goes back to Daniel until he approves.
- [ ] Task: Measure - User Manual Verification 'Phase 6: Week 1 proof and Daniel's approval' (Protocol in workflow.md)

## Phase 7: Weeks 2 to 8 (2026-11-10 to 2026-11-18; starts after the Phase 6 approval)

- [ ] Task (Content): the `print` blocks of weeks 2 to 7. The print-text check passes. One independent review subagent for each week (lessons-learned, 2026-10-22). Week 8 uses `block.days[].paper` and `benchmark.paper`, which exist.
- [ ] Task (Red): extend the print tests to the shipped weeks 2 to 8.
    - The student book has the pages of all 8 weeks. Week 8 has 5 review pages and the Benchmark 1 page (8 circle-picture rows and 7 write-letter boxes). The book map has 7 decodable places and 1 unit place.
    - The 12 books of weeks 2 to 7 have their page plans and texts.
    - The text gate of the Thai teacher book has 0 differences for each of the 8 weeks, or each difference is listed.
- [ ] Task (Green): the template changes that weeks 2 to 8 need (for example, the circle-word rows and the picture sort of the review pages). Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Pictures, weeks 2 to 7): the Forge batches, needed by 2026-11-16. The three picture stages of Phase 4 for each batch. Daniel looks at each batch.
- [ ] Task (Check): the unit 1 student book, the unit 1 teacher book in Thai and English, the 12 books, the 12 book covers, and the student-book and teacher-book covers. `PRINT_GATE` passes for each file. A contact sheet of every page. The agent opens every page.
- [ ] Task: Measure - User Manual Verification 'Phase 7: Weeks 2 to 8' (Protocol in workflow.md)

## Phase 8: Card kit and class sets (2026-11-02 to 2026-11-19; only the week 1 cards before the Phase 6 approval)

- [ ] Task (Red): `__tests__/storytime-print-card-kit.test.ts` on the shipped weeks.
    - The Red author writes the expected card lists by hand from the `materials` of the 8 files. Example: the sound cards of unit 1 are n, a, p, m, s, t, o. A removed materials item in a copy changes the list and fails the test.
    - The letter strip has the 26 letters of `w08.json` `benchmark.oneToOne.letters`, in that order.
    - The sound and symbol cards are A5. The picture cards and the tricky-word cards are A6 (design §8).
    - The sticker sheet has 8 stickers: the 7 decodable covers and unit 1.
- [ ] Task (Green): `lib/storytime/print/card-kit.ts` and `scripts/storytime/make-card-kit-pdf.ts --level 2 --weeks <list>`: cards n-up on A4 with cut lines, one print file for each card size. The classroom language card only after Daniel gives its text (spec P9). Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check): the card kit print files; `PRINT_GATE` passes. A person cuts one test sheet of each size and measures one card (person-checked).
- [ ] Task: Measure - User Manual Verification 'Phase 8: Card kit and class sets' (Protocol in workflow.md)

## Phase 9: Release proof and print order (2026-11-19 to 2026-11-25)

- [ ] Task: the release proof by 2026-11-20. All print files, the contact sheets, and the print order sheet (item, file, SHA-256, trim, pages, paper, binding, colors, quantity for each classroom). Each file passes `PRINT_GATE` and is newer than the last commit of its sources (`git log -1 --format=%cI -- <sources>`). Each printed QR URL answers on the live host, or Daniel has decided P4.
- [ ] Task (Owner gate): Daniel approves the release proof by 2026-11-24. Record his exact words and the date in `approval.print` of each week package. Evidence: owner-approved.
- [ ] Task: the print order on 2026-11-25. Daniel gives the go to send. Record the printer, the order date, and the delivery date in this plan.
- [ ] Task: Measure - User Manual Verification 'Phase 9: Release proof and print order' (Protocol in workflow.md)

## Phase 10: Hand-off (2026-11-25 to 2026-11-27)

- [ ] Task: update `measure/tech-debt.md` and `measure/lessons-learned.md` (50 lines or less each). Send the "facts changed" list to the PM session (price, date, status, numbers, names; an empty list is a valid answer).
- [ ] Task: set `actual_tasks` and the deviation notes in `metadata.json`; the track is ready for final acceptance and closeout.
