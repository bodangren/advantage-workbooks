# Plan: storytime_covers_20261027

Spec: [spec.md](./spec.md). Phase 1 ends 2026-11-01, before the print track Phase 5 (2026-11-02 to 11-05). Daniel checks the three covers on Google Drive. Phase 2 makes the Level 2 Unit 1 cover print file after his approval.

## Rules for every task

- Tests first. The Red task writes failing tests and commits them. The Green task makes them pass. A review role does not fix code; it reports.
- New tests load the shipped data file `content/storytime/covers/books.json` and the shipped week files, not a hand-made fixture (rule 11.3). Each new check has a mutation test on a copy in a temporary folder (rule 11.1). Keep a copy of a source file before an in-place mutation, and compare it after a stopped run (lessons-learned, 2026-10-22).
- A task becomes `[x]` only with its commit SHA and its evidence class: owner-approved, person-checked, automated, or peer-report (rules 7.1 and 7.2). Write each SHA as `commit <sha>`.
- A task that waits for Daniel stays `[ ]`, so that its phase stays open. Use `[b] … — deferred:daniel` only for a task that Daniel takes out of release 1. The checker does not count a `[b]` line in any gate or at closeout.
- Use the word "deferred" only in that trailer. In other text, write "later" or "waits for" (the checker drops any task line that contains the word).
- Heavy jobs (vitest runs, tsc, Chrome, Ghostscript, PDF/X builds, contact sheets) run with ONE command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'` (PM rule, advantage-pr 0e091de, 2026-10-25). It takes the lock and runs the pre-flight inside the lock. Exit 75 means that the pre-flight hold lasted longer than its wait. Never use a plain `flock` on the lock inside a heavy job, because a nested plain flock deadlocks. Report a "heavy-run: lock wait over 600 s" line to the PM session. No `pnpm install`. Run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed.
- Stage files path by path. Do not touch `video/**` (another session has an uncommitted change there).
- This repo has no `measure/generate.sh` or `measure/doctor.sh`. The doctor step of each phase is the `PROJECT_CHECKS` gate.

## Gate commands (orchestrator environment)

```bash
RED_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-print-covers*.test.ts'    # must fail after Red, before Green
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-print-covers*.test.ts'  # must pass after Green
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-print-covers*.test.ts'
PROJECT_CHECKS='cd dashboard && npx tsc --noEmit'   # the whole command runs inside one heavy-run wrapper (line 12); no nested heavy-run
UX_REQUIRED=never   # print files: the visual checks are the contact-sheet tasks and Daniel's Drive checks
PRINT_GATE='cd dashboard && npx tsx scripts/print/make-pdfx.ts <print file> --check'   # exit 0 for each print file
```

The whole command of each gate runs inside one heavy-run wrapper (line 12). The `PROJECT_TESTS` list holds the print track's files too, so a change in the Storytime print modules shows up here. `check-weeks.ts` does not run in this track, because the track changes no week file.

Baseline at 253edfaa (2026-10-27): the print track measured `PROJECT_TESTS` at 12 files and 227 tests on 078917f. This planning session ran no gate, so it gives no new number.

Graph note: `graph.db` is from 2026-08-08 (stale), so the blast-radius lines come from `grep`, not from `build-graph`.

## Phases and dates

| Phase | Dates | End gate |
|---|---|---|
| 1 The cover module and the three Drive covers | 2026-10-27 to 2026-11-01 | The three covers and the contact sheet are on Google Drive for Daniel |
| 2 The Level 2 Unit 1 cover print file | 2026-11-02 to 2026-11-05 | `PRINT_GATE` passes on the print file; Daniel approved the cover on Drive |
| 3 The other 13 covers | later, after release 1 | Not release 1 work |

Risk: Phase 2 waits for Daniel's approval on Drive. If his approval comes after 2026-11-05, the print track Phase 5 loses the Level 2 Unit 1 cover print file. The PM session decides then.

## Phase 1: The cover module and the three Drive covers (2026-10-27 to 2026-11-01)

_Blast radius: new files only. `lib/covers/compose.ts` (2 callers: `scripts/covers/make-cover.ts`, `__tests__/covers-render.test.ts`) and `lib/covers/back-text.ts` (2 callers) are read, not changed. `lib/qr-generator.ts` (3 callers) is read, not changed. `lib/covers/catalogue.ts` (`COVER_BOOKS`) does not change. The print track Phase 5 must not create `lib/storytime/print/covers.ts` again: the orchestrator routes that change._

- [ ] Task (Red): `__tests__/storytime-print-covers-16books.test.ts`. Done when: `RED_TEST_COMMAND` fails only on these new tests, and the commit holds only the test file.
    - The data file `content/storytime/covers/books.json` holds 16 books: level 1 to 4, unit 1 to 4. Each row holds the level, the unit, the first week, and the last week. It also holds the title, the level colour, the picture recipe, and the unit summary. The title is "Storytime Advantage, Level N, Unit M, Student Book".
    - The weeks of a unit are 1 to 8, 9 to 16, 17 to 24, and 25 to 32, at every level.
    - The level colours are L1 #E06A1F, L2 #2A77B8, L3 #3C9B57, L4 #8151B8.
    - The front page holds the series name in the level colour. It holds the picture area of 186 x 180 mm, at 12 mm from the left and 31 mm from the top. It holds the level card of 186 x 65 mm, at 12 mm from the left and 217 mm from the top. The card holds "Level N · Unit M" and "Student Book".
    - The front page holds no badge and no level badge.
    - The back page holds the logo at 12 mm from the left and 12 mm from the top, at 30 x 30 mm. It holds the series name in the level colour. It holds the panel of 186 x 138 mm, at 12 mm from the left and 48 mm from the top. It holds the contact block at 15 mm from the left and 200 mm from the top. It holds the QR box of 44 x 44 mm, at 14 mm from the right and 200 mm from the top. It holds the LINE label next to the QR.
    - The panel shows for a unit with week text, and no panel shows for a unit without week text. Today one row has a summary and 15 rows have none.
    - The words of the summary come from the approved English text of the named week. A word that is not in that text fails the check.
    - The Thai of the back page equals the Thai of the five approved contact lines, character for character. No other Thai appears on either page.
    - The printed QR module grid equals the output of `lib/qr-generator.ts` for `https://line.me/ti/p/Pf7_EF98Pv`. Zero modules differ.
    - The copy check fails a cover without "Storytime Advantage". It also fails a cover with "CEFR", "Pre-A1", "Starters", "Primary Advantage", "GSE", "YLE", "Reading A-Z", "RAZ", "Chibi", "Mitr", or a year of 19xx or 20xx.
    - The front PNG and the back PNG hold 2480 x 3508 px, RGB, with no alpha channel.
    - The PDF holds 2 pages of A4 portrait, 210 x 297 mm. Every font is embedded, and no font is Type 3.
    - A build with a missing picture file stops with an error and names the book. No delivered file holds a placeholder.
    - Mutation tests: six broken copies each fail a test. The copies drop a contact line, change a Thai tone mark, swap a QR module, use a wrong level colour, put a year in the summary, and drop the panel.
- [ ] Task (Green): the cover module, the data file, the build script, and the picture composer. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
    - `content/storytime/covers/books.json`: the 16 rows, the level colours, the LINE address, and the picture recipes. The Level 2 Unit 1 row names the 7 cast cut-outs of `content/storytime/l2/media/w01/forge/cast/`. The other rows name their picture recipe too, so that a later build needs no new data work.
    - `lib/storytime/print/covers.ts`: the module. It reads the data file, the week packages, and the fonts. It writes the front and the back HTML, and it returns the checks of FR-4 and FR-6.
    - `lib/storytime/print/cover-picture.ts`: the composer. It places the cut-out files on a white ground. It writes one opaque picture for the picture area of the front, at 300 ppi for the trim, through `lib/covers/compose.ts`.
    - `scripts/storytime/make-storytime-book-cover.ts --level <n> --unit <m> [--print]`: the build. It writes the front PNG, the back PNG, and the 2-page Chrome PDF. With `--print` it writes the PDF/X-1a file through `scripts/print/make-pdfx.ts --keep-fonts`.
    - The module draws the panel and the level card with the corner radius of the mock. The PDF/X file must hold no soft mask, no RGB image, and no page that is one image. If a corner radius fails that check, the module draws the corner as a square and the change goes to Daniel with the covers.
    - The file name of the print file holds the series, the level, the unit, and the kind. It also holds the version and the suffix `_PDFX-1a` (rule 12.2).
    - The Primary cover contract does not change. `lib/covers/catalogue.ts`, `lib/covers/check.ts`, and the cover kit stay as they are.
- [ ] Task (Check): the three covers. The Level 2 Unit 1 group picture stays (D3). The Level 4 Unit 4 front is the cut-out style, not the room scene (D4). `PRINT_GATE` passes on the 2-page PDF of each book. The Thai byte check, the QR module check, and the copy check pass on each built file. A contact sheet of every page of every cover. The agent looks at every page and lists the defects (rule 6.5).
- [ ] Task (Hand-off): the three covers go to the PM session for Google Drive. The message names the front PNG, the back PNG, and the 2-page PDF of each of the three books. It also gives the SHA-256 of each file, the default summary of the Level 2 Unit 1 panel, and the open points P1 to P6. Daniel checks the files there and answers his Tasks item. Done when: the PM session confirms receipt (peer-report).
- [ ] Task: Measure - User Manual Verification 'Phase 1: The cover module and the three Drive covers' (Protocol in workflow.md)

## Phase 2: The Level 2 Unit 1 cover print file (2026-11-02 to 2026-11-05)

_Blast radius: the module and the script of Phase 1. The print track Phase 5 reads the module._

- [ ] Task (Owner gate): Daniel approves the Level 2 Unit 1 cover on Google Drive. Record his exact words and the date in this plan. No answer is not an approval (rule 0.3). Evidence: owner-approved.
- [ ] Task (Green): the print file. `make-storytime-book-cover.ts --level 2 --unit 1 --print` writes the PDF/X-1a file to `~/Desktop/print-ready/storytime/`. Done when: `PRINT_GATE` exits 0 on the file, and the file is newer than the last commit of its sources (lessons-learned, 2026-10-20).
- [ ] Task (Check): the print file. `pdffonts` shows only embedded Andika and Sarabun faces, and no Type 3 face. `pdfimages -list` shows no soft mask and no page that is one image. The Thai byte check and the QR module check pass on the Chrome PDF of the same build. A contact sheet of the two pages. The agent looks at both pages.
- [ ] Task (Hand-off): the print file goes to the PM session for the print track Phase 5. The message gives the file name, the SHA-256, the page count, and the date. Done when: the PM session confirms receipt (peer-report).
- [ ] Task: Measure - User Manual Verification 'Phase 2: The Level 2 Unit 1 cover print file' (Protocol in workflow.md)

## Phase 3: The other 13 covers (later, after release 1)

- [b] Task (Later, after release 1): the covers of the other 13 books, when their week text and their pictures exist (PM approval, 2026-10-27 06:41 ICT) — deferred:daniel
