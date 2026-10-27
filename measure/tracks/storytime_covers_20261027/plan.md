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

The `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` glob also matches the test file of the print track Phase 5, `__tests__/storytime-print-covers.test.ts`, once that file exists. This track uses the file name `__tests__/storytime-print-covers-16books.test.ts`, so the two tracks never write the same file. The gate of this track then runs both files, and both must pass.

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

- [x] Task (Red): `__tests__/storytime-print-covers-16books.test.ts`. Done when: `RED_TEST_COMMAND` fails only on these new tests, and the commit holds only the test file. commit b08310c6f4c1b8d4aa3b3dbd4a82447b349841fe. Evidence: automated.
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
    - Evidence: `RED_TEST_COMMAND` exit 1. The line is `Tests  23 failed | 1 passed (24)`. The output has no `No test files found`.
    - R1 fails. The data file `content/storytime/covers/books.json` does not exist.
    - R2 fails. The picture recipes are not in that data file.
    - R3 fails. The unit summaries are not in that data file.
    - R4, R5, both R6 tests, both R7 tests, both R8 tests, R9, and R12 fail. The module `lib/storytime/print/covers.ts` does not exist.
    - R13 fails. The module `lib/storytime/print/cover-picture.ts` does not exist.
    - R10, R11, and R14 fail. The script `scripts/storytime/make-storytime-book-cover.ts` does not exist.
    - R16 M1 to M6 fail. Each copy calls a missing export of `lib/storytime/print/covers.ts`.
    - R15 passes. The Primary cover files and the Primary cover tests are unchanged at this commit.
    - `PROJECT_LINT` exit 0. The new test file has no lint error. One warning is in the unrelated dirty file `student-book.ts`. This phase did not edit that file.
    - The existing cover tests pass. `covers-*.test.ts` reports `Tests  27 passed (27)` and exit 0.
    - Correction r2, 2026-10-27, commit 83d98286fc6dd4e83ffc6d2b4532980838bf88b7:
    - R12 read `raw.info.hasAlpha`. Sharp `OutputInfo` has no `hasAlpha` field. The value is always undefined. No implementation can pass that line. `tsc` reports TS2339.
    - The fix expects `(await sharp(buffer).metadata()).hasAlpha` to be false. The fix also expects `raw.info.channels` to be 3.
    - `assertPanel` took a `Document`. Three call sites pass an `Element`. The code runs. `tsc` reports TS2345 on those lines. `PROJECT_CHECKS` fails on the test file.
    - The fix types the first parameter as `ParentNode`. An `Element` and a `Document` both type-check. The check behavior does not change.
    - Evidence: an RGBA copy from `sharp(buffer).ensureAlpha()` fails both new checks. The real composed picture passes both checks. Output: `measure/runs/storytime_covers_20261027/mid-red-ba2b72a-alpha.txt`.
    - Evidence: R16 M6 still throws on a back without the panel. The test passes. Output: `measure/runs/storytime_covers_20261027/mid-red-ba2b72a-m6.txt`.
    - Evidence: `RED_TEST_COMMAND` exits 0. The count is 24 passed of 24. Green code is already committed, so a pass is expected.
    - Evidence: `PROJECT_LINT` exits 0. `PROJECT_CHECKS` exits 2. The test file has zero errors. One known Green error remains on `scripts/storytime/make-storytime-book-cover.ts` line 109. The error is `media: 'print'` in `page.pdf()`. This correction does not fix that error.
- [x] Task (Green): the cover module, the data file, the build script, and the picture composer. commit 057c8fe5; commit 331a8616; commit c6e10981; commit ffbe3569; commit 6d6c73eb; commit 84c25fab. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
    - `content/storytime/covers/books.json`: the 16 rows, the level colours, the LINE address, and the picture recipes. The Level 2 Unit 1 row names the 7 cast cut-outs of `content/storytime/l2/media/w01/forge/cast/`. The other rows name their picture recipe too, so that a later build needs no new data work.
    - `lib/storytime/print/covers.ts`: the module. It reads the data file, the week packages, and the fonts. It writes the front and the back HTML, and it returns the checks of FR-4 and FR-6.
    - `lib/storytime/print/cover-picture.ts`: the composer. It places the cut-out files on a white ground. It writes one opaque picture for the picture area of the front, at 300 ppi for the trim. It flattens the cut-outs on the same white ground as `lib/covers/compose.ts`; it does not call `composeSide`, because that helper returns a JPEG for the Primary kit and the cover needs one PNG at 300 ppi with no alpha channel (strategy default, section 4.10).
    - `scripts/storytime/make-storytime-book-cover.ts --level <n> --unit <m> [--print]`: the build. It writes the front PNG, the back PNG, and the 2-page Chrome PDF. With `--print` it writes the PDF/X-1a file through `scripts/print/make-pdfx.ts --keep-fonts`.
    - The module draws the panel and the level card with the corner radius of the mock. The PDF/X file must hold no soft mask, no RGB image, and no page that is one image. If a corner radius fails that check, the module draws the corner as a square and the change goes to Daniel with the covers.
    - The file name of the print file holds the series, the level, the unit, and the kind. It also holds the version and the suffix `_PDFX-1a` (rule 12.2).
    - The Primary cover contract does not change. `lib/covers/catalogue.ts`, `lib/covers/check.ts`, and the cover kit stay as they are.
    - Evidence: `GREEN_TEST_COMMAND` exit 0. The line is `Tests  24 passed (24)`, on commit 84c25fab. Output: `measure/runs/storytime_covers_20261027/jr-green-15dab660-green.txt`.
    - Evidence: `PROJECT_TESTS` exit 0. The line is `Tests  325 passed (325)` over 16 files. Output: `measure/runs/storytime_covers_20261027/jr-green-15dab660-project.txt`.
    - Evidence: `PROJECT_LINT` exit 0, no error and no warning. Output: `measure/runs/storytime_covers_20261027/jr-green-15dab660-lint.txt`.
    - Evidence: `PROJECT_CHECKS` exit 0, no type error. Output: `measure/runs/storytime_covers_20261027/jr-green-15dab660-checks.txt`.
    - Evidence: the mutant proof. The line is `mutants: 15, caught: 15`. Each mutant breaks one behaviour in a copy of the source file; the gate runs in the foreground; the file is then restored and compared with the copy. M1 R7, M2 R7, M3 R8, M4 R1, M5 R3 and R6, M6 R5 and R16 M6, M7 R5, M8 R6, M9 R1 and R2, M10 R12 and R13, M11 R14, M12 R11, M13 R4 and R10, M14 R8, M15 R3. Output: `measure/runs/storytime_covers_20261027/jr-green-15dab660-mutants.txt`.
    - Evidence: the three covers in `~/Desktop/print-ready/storytime/proof/`. Each holds a front PNG and a back PNG of 2480 x 3508 px, RGB, with no alpha channel, and the 2-page Chrome PDF. The SHA-256 of each file:
    - Level 2 Unit 1: `front.png` fa286d37628f3cf275d67ec89e99cf49dd3b1a9d2b17093cadd1c8b066dde2e3, `back.png` 6bf071bf59d0fc2c1395788707c74cb3bc099b7fa96de968429600e4669055cc, `cover.pdf` d9e427cd52b5501ebc6ccd1cd3eecaf3cd3497cdc0eeccfa0a0be05ed7858d27, `Storytime-Advantage-L2-U1-Student-Book-Cover-v1_PDFX-1a.pdf` 6174484c7617c2de1ae696d7f1979978ed0b355586b6ef283f4a3ecd651eeff9.
    - Level 1 Unit 1: `front.png` d28bcb27a16d23be0a4690cfb783101e20b563a87b3f92895d1a4e9081120aa5, `back.png` 7e190c338c7832db4bf6e3581d82c7de262da3c571b5ccc313ec3a0c39abb15d, `cover.pdf` 5b716efcdeab143e75dad9a5ced3365aa405175fe6b16c3bf0bb5a65bcac9b0c, `Storytime-Advantage-L1-U1-Student-Book-Cover-v1_PDFX-1a.pdf` 605ef87e801a96441a8bfe9fec4f964a0d18af606d5a9b45c3ce62ffcc7ab7cc.
    - Level 4 Unit 4: `front.png` 8d08461fd3dbfc1d42fbab6545446f4687b8511b2e94f0341adab71303dbb2d5, `back.png` 61d033be1e58a949056258c95dd5e1aaa0c23dc5378d15f56a5793dc3a7953ca, `cover.pdf` 29a2cee90df857d542507feed4c35b0400e29c2e57a76e51076bf7b71eb9bcc9, `Storytime-Advantage-L4-U4-Student-Book-Cover-v1_PDFX-1a.pdf` 39b217be37bb83525fda4aa4657c3ff3ec13b5ca727f25ab53fb38e1e3dbbea3.
    - Evidence: `PRINT_GATE` exit 0 on each print file. Each line is `All checks pass.`: PDF/X-1a:2001, PDF 1.3, 2 pages, 4 embedded fonts, no soft mask, no RGB image, and no page that became one image.
    - Evidence: the corner mode is `radius in the picture layer`, the same string in each `corner-mode.txt`. The corner radius of the level card and of the unit summary panel sits in the opaque picture layer, so the text of the page stays text and the PDF/X file holds no soft mask. The fallback of square corners did not run.
    - Evidence: the level card, the unit summary panel, the logo, and the cover picture are the only pictures of a page. The QR code is an inline SVG, so it stays vector. The Andika and Sarabun faces stay embedded, and no Type 3 face is in the file.
- [x] Task (Red C1): test that the level card text shows (Check finding C1). Done when: `RED_TEST_COMMAND` fails only on the new tests, and the commit holds only the test file. commit 3f8c5010bd3bea809450d27edfd8f6407c96066b. Evidence: automated.
    - Check finding C1, evidence class peer-report, orchestrator page check, 2026-10-27. Files: the three Drive covers of the Green task (SHA-256 above).
    - C1: on all three fronts (front.png, cover.pdf, and the PDF/X file) the level card prints as an empty colour block. The text "Level N · Unit M" and "Student Book" is in the PDF text layer, but it does not show. Cause: `.level-card img` in `lib/storytime/print/covers.ts` has `position: absolute`, and `.level-line` and `.book-line` have no position, so the card picture paints over the text.
- [~] Task (Green C1): fix C1 in the cover module and build the three Drive covers again. Preserve the committed Red tests. Change no test file. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass; the three covers are built again with `--print`; `PRINT_GATE` passes on each print file; the Thai byte check, the QR module check, and the copy check pass on each built file, with the outputs saved; and the SHA-256 of each new file is recorded.
    - Evidence: `RED_TEST_COMMAND` exit 1. It reports `Tests 1 failed | 24 passed (25)`. Only R17 fails. It fails because near-white ink in front PNG band 1 measures 0 pixels; expected threshold is greater than 1,000. Output: `measure/runs/storytime_covers_20261027/mid-red-5f50f52-red.txt`.
    - R17 uses the front-card inset box at 18 mm left, 224 mm top, 174 x 23 mm for the level line, and 18 mm left, 251 mm top, 174 x 23 mm for the book line. It counts near-white RGB pixels with each channel at least 245. It requires more than 1,000 pixels per band on the 300 dpi front PNG, and more than 50 pixels per band on the 72 dpi PDF/X page 1 raster. It counts dark RGB pixels with each channel at most 80 inside the back panel text inset, and requires more than 1,000 pixels.
    - Measurement on a scratch fix (`position: relative` on `.level-line` and `.book-line`): front PNG band counts are 17,429 and 5,370. At 72 dpi, the PDF/X raster band counts are 849 and 173. The back PNG dark panel count is 13,043. A lower-resolution measurement at 36 dpi gave 157 and 3 PDF/X pixels, so R17 uses 72 dpi. Output: `measure/runs/storytime_covers_20261027/mid-red-5f50f52-measure.txt` and `measure/runs/storytime_covers_20261027/mid-red-5f50f52-proof.txt`.
    - Evidence: with the scratch fix, R17 passes (`Tests 1 passed | 24 skipped (25)`). The scratch proof restored `covers.ts`; `git diff --quiet -- dashboard/lib/storytime/print/covers.ts` exited 0. No production edit is committed. Output: `measure/runs/storytime_covers_20261027/mid-red-5f50f52-proof.txt`.
    - `PROJECT_LINT` exit 0. Output: `measure/runs/storytime_covers_20261027/mid-red-5f50f52-lint.txt`.
    - `PROJECT_CHECKS` exit 0. Output: `measure/runs/storytime_covers_20261027/mid-red-5f50f52-checks.txt`.
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
