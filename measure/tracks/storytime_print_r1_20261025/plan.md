# Plan: storytime_print_r1_20261025

Spec: [spec.md](./spec.md). Release-1 goal: 2026-12-01. Daniel's approval of the release proof: 2026-11-24. Print order: 2026-11-25.

## Rules for every task

- Tests first. The Red task writes failing tests and commits them. The Green task makes them pass. A review role does not fix code; it reports.
- New tests load the shipped week files `content/storytime/l2/w01.json` to `w08.json` (rule 11.3). Each new check has a mutation test on a copy in a temporary folder (rule 11.1). Keep a copy of a source file before an in-place mutation, and compare it after a stopped run (lessons-learned, 2026-10-22).
- A task becomes `[x]` only with its commit SHA and its evidence class: owner-approved, person-checked, automated, or peer-report (rules 7.1 and 7.2). Write each SHA as `commit <sha>`.
- A task that waits for Daniel stays `[ ]`, so that its phase stays open. Use `[b] … — deferred:daniel` only for a task that Daniel takes out of release 1. The checker does not count a `[b]` line in any gate or at closeout.
- Use the word "deferred" only in that trailer. In other text, write "later" or "waits for" (the checker drops any task line that contains the word).
- Heavy jobs (vitest runs, tsc, Chrome, Ghostscript, PDF/X builds, contact sheets) run with ONE command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'` (PM rule, advantage-pr 0e091de, 2026-10-25). It takes the lock and runs the pre-flight inside the lock. Exit 75 means that the pre-flight hold lasted longer than its wait. Never use a plain `flock` on the lock inside a heavy job, because a nested plain flock deadlocks. Report a "heavy-run: lock wait over 600 s" line to the PM session. No `pnpm install`. Run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed.
- Stage files path by path. Do not touch `video/**` (another session has an uncommitted change there).
- This repo has no `measure/generate.sh` or `measure/doctor.sh`. The doctor step of each phase is the `PROJECT_CHECKS` gate.

## Gate commands (orchestrator environment)

```bash
RED_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts'    # must fail after Red, before Green
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts'  # must pass after Green
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-print-*.test.ts'
PROJECT_CHECKS='cd dashboard && out=$(npx tsx scripts/storytime/check-weeks.ts --level 2); test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -le 1 && ! printf "%s\n" "$out" | grep "  FAIL " | grep -v "  FAIL    published" && npx tsc --noEmit'  # the whole command runs inside one heavy-run wrapper (line 12); no nested heavy-run
UX_REQUIRED=never   # print files: the visual checks are the contact-sheet tasks and Daniel's proof checks
PRINT_GATE='cd dashboard && npx tsx scripts/print/make-pdfx.ts <print file> --check'   # exit 0 for each print file
```

Baseline at 8e6df79 (2026-10-25): `PROJECT_TESTS` passes 10 files and 119 tests. `check-weeks.ts --level 2` exits 1 with one known FAIL (st2/1 `published`, spec P14); the first part of `PROJECT_CHECKS` accepts one FAIL at most, and only that check (measured: exit 0 at 8e6df79). The `tsc` part was not run in this planning session.

Graph note: `graph.db` is from 2026-08-08 (stale), so the blast-radius lines come from `grep`, not from `build-graph`.

## Phases and dates

| Phase | Dates | End gate |
|---|---|---|
| 1 Contracts and the picture list | 2026-10-26 to 2026-10-28 | The picture list and the picture spec go to the PM session by 2026-10-28 |
| 2 Student workbook template, week 1 | 2026-10-27 to 2026-11-05 | The template is due on 2026-11-05 (monorepo plan, Phase 2) |
| 3 Teacher book print file, week 1 | 2026-10-27 to 2026-10-30 | The week 1 print files in Thai and English |
| 4 Readers, week 1 (workbook pages and color A3 PDFs) | 2026-10-28 to 2026-11-05 | The week 1 pictures from Forge are needed by 2026-11-02 |
| 5 Covers, week 1 | 2026-11-02 to 2026-11-05 | Daniel approves the two week 1 cover pictures |
| 6 Week 1 proof and Daniel's approval | 2026-11-05 to 2026-11-09 | Daniel approves the week 1 print (rule 0.1) |
| 7 Weeks 2 to 8 | 2026-11-10 to 2026-11-18 | The pictures of weeks 2 to 7 from Forge are needed by 2026-11-16 |
| 8 Card kit | 2026-11-02 to 2026-11-19 | Only the week 1 cards before Daniel's week 1 approval (rule 0.2) |
| 9 Release proof and print order | 2026-11-19 to 2026-11-25 | Proof 2026-11-20; Daniel's approval 2026-11-24; print order 2026-11-25 |
| 10 Hand-off | 2026-11-25 to 2026-11-27 | Project memory and the "facts changed" list |

Risk: the weeks 2 to 7 pictures (about 96 story pages, 12 covers, and the picture words) have 7 days after Daniel's week 1 approval, and each needs two outputs (line art and color; spec FR-9). If Forge cannot meet 2026-11-16, Daniel chooses between a later print order and the stop-rule split (weeks 1 to 4 on 2026-12-01, weeks 5 to 8 in January 2027).

## Phase 1: Contracts and the picture list (2026-10-26 to 2026-10-28)

_Blast radius: `StorytimeWeekSchema` (9 files: `lib/storytime/checks.ts`, `files.ts`, `phonemes.ts`; `scripts/storytime/book-audio.ts`, `set-phoneme-audio.ts`, `make-manual-pdf.ts`; `__tests__/storytime-week.test.ts`, `storytime-manual.test.ts`, `storytime-phonemes.test.ts`); `StorytimeApprovalsSchema` (only `schema.ts`). The change is additive._

- [x] Task: Orchestrator setup. Add `measure/anti-patterns.md` (a copy of the canonical catalog A1 to A10 of the measure-orchestrator skill) in its own `docs(measure):` commit, because the orchestrator reads it and the file does not exist. Done when: `test -f measure/anti-patterns.md` and `grep -c '^## A' measure/anti-patterns.md` gives 10. Evidence: automated (commit ecd28a4, grep count 10).
- [x] Task (Red): `__tests__/storytime-print-contract.test.ts` on the shipped weeks. commit 62a0998. Evidence: automated.
    - Red evidence: `cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts` exited 1: `Tests  39 failed | 8 passed (47)`. All failures occur inside test bodies. The eight characterization tests pass.
    - Failure counts: schema or approval behavior (17), text-check module (7), WARN (8), week 1 block (1), picture module (5), picture list (1).
    - Regression evidence: `PROJECT_TESTS` reports `Tests  39 failed | 127 passed (166)`; only the new file fails. The existing tests pass separately: 10 files, 119 tests. The new test file passes ESLint. Logs: `measure/runs/storytime_print_r1_20261025/mid-red-*-fbefeff.txt`.
    - The 8 shipped weeks parse without a `print` block; `approval.print` defaults to draft.
    - A `print` block for week 1 (letter box n, practice sheet, dictation lines, writing page) parses; a block with an unknown part fails.
    - The print-text check passes on week 1 with its block. On a broken copy (one A7 word removed from the practice sheet), it gives the error id `print-practice`.
    - The picture list of week 1 has 16 story-page rows, 2 cover rows, and the 9 check-row pictures of `check.items` (nest, cat, fish, dog, nose, bus, hat, cup, net), and the practice-line pictures of the block.
    - Every row has a size class A, B, or C of spec FR-9 and a file name that matches `^l2-w\d{2}-[a-z-]+-v\d+\.png$`.
    - R3: on a copy with the teacher-only words "Look at the page" added to the practice sheet, the print-text check gives an error too (spec FR-1.2: "A difference is an error").
    - R4: a week with no `print` block gives a WARN with a fixed id (proposal: `print-missing`), not a FAIL, and a test asserts that week 1 has the block and that its print checks have status PASS, so that a deleted block does not pass silently (A4).
    - R6: size class by use: story page A, cover B, check row and practice line C (FR-9).
    - R7: every file name matches `^l2-w\d{2}-[a-z-]+-v\d+\.png$`; ids and file names are unique across weeks 1 to 8; the week part of the name equals the row week.
    - R8: week 8 (`books: []`) gives 0 story-page rows and 0 cover rows and does not throw.
    - R9: an approved `print` part with no date or no words fails the parse (F6, F7); a published week with six approved app parts and a draft `print` part gives no `published` problem for `print` (rule G5).
    - R10: drift guard (A10): the committed `content/storytime/l2/print/pictures.json` equals the output of the list function on the shipped weeks; this test is red at Red, because the file does not exist.
    - Done when: `RED_TEST_COMMAND` fails only on these new tests, and the commit holds only the test file.
- [x] Task (Green): the contract and the picture list. commit 7eda179.
    - `lib/storytime/schema.ts`: the optional `print` block and the `print` approval part (FR-1). The `print` approval part has a `words` field (Daniel's exact words) and a date. `checks.ts` keeps the published rule on the six app parts (strategy rule G5).
    - `lib/storytime/print/text-check.ts` (the A3, A7, C3, D4, and E5 comparison) and its entry in `checks.ts`.
    - `lib/storytime/print/pictures.ts` and `scripts/storytime/print-pictures.ts --level 2`, which writes `content/storytime/l2/print/pictures.json` and `pictures.md` (FR-2).
    - Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
    - commit 7eda179. Evidence: automated. Gate results: `GREEN_TEST_COMMAND` exit 0, `Tests  47 passed (47)`; `PROJECT_TESTS` exit 0, `Tests  166 passed (166)` on 11 files; `PROJECT_LINT` exit 0, 0 problems; `PROJECT_CHECKS` exit 0 (one accepted FAIL, `published` for st2/1, with no "print not approved" text; the `tsc` part clean). The live drift proof: the script rerun exits 0 and `git diff --exit-code content/storytime/l2/print/` is clean.
- [x] Task (Content): the week 1 `print` block in `w01.json`, from the steps A3, A7, C3, and D4. Owner: jr-green. The review subagent uses a model family other than the Green model. The print-text check passes. One independent review subagent reads the block against the scripts and reports findings with file and line (lessons-learned, 2026-10-22). Daniel sees the block in the week 1 proof. commit 1c4b47a; F1 fixed in commit ae6812c.
    - commit 1c4b47a (the block only: 36 insertions, 0 deletions; JSON valid; the print-text check passes). Evidence: automated. The review is recorded in the next sub-bullet.
    - Review 2026-10-25 (minimax-cn-coding-plan/MiniMax-M3#high, log `measure/runs/storytime_print_r1_20261025/print-block-review-1c4b47a.log`): F1 error, the picture word net on the "and" line names line 2; fix: nut. F2 to F6 are notes for Daniel's week 1 proof. Evidence: peer-report.
    - Evidence: automated plus peer-report: print-block-review-1c4b47a.log (MiniMax-M3, F1 error fixed; F2 to F6 notes to Daniel's one page).
- [x] Task (Red 2): `__tests__/storytime-print-contract-v2.test.ts` on the shipped weeks. Done when: `RED_TEST_COMMAND` fails only on these new tests, and the commit holds only the two test files: the new v2 file and the change `pictureWord` 'net' -> 'nut' in `storytime-print-contract.test.ts` line 79; the Red 2 plan commit sets Green 2 to `[~]`. commit 3453f25. Evidence: automated.
    - Red evidence: `RED_TEST_COMMAND` exited 1: `Tests  23 failed | 48 passed (71)`; no "No test files found"; each failure is inside a test body (strategy 4.13.2 proof). The cycle 1 file stays green (47 passed; the `nut` change passes under the cycle 1 code). `PROJECT_TESTS` exit 1: `Tests  23 failed | 167 passed (190)` on 12 files; only the new v2 file fails. ESLint exit 0 on both test files. Logs: `measure/runs/storytime_print_r1_20261025/mid-red-feed0a9-red.txt` and `mid-red-feed0a9-project.txt`.
    - Red failure names: R11 line-art names (3), R12 spec constants and row sizes (2), R13 the picture-word rule (6), R14 the approval records (11; R14d the draft-state guard passes at Red by design), R10b the readable list (1).
    - Green 2 must provide (the tests name each one): the export `STORYTIME_PICTURE_SPEC` (`{A,B: 4000x3000, C: 1500x1500}`); the row fields `lineArtFileName`, `width`, `height` on every picture row; `pictureListMarkdown(rows, 2)` with the "Version 2" header and the line-art name plus pixel size on each row line; the `print-picture-word` check (status `fail`, detail naming the lines) wired into `checkStorytimeWeek` and the `published` detail; `source` and `words` accepted and preserved on the six app parts of `StorytimeApprovalsSchema` (`ApprovalSchema` in `lib/lesson-package/schema.ts` stays unchanged); the Content 2 data (the P14 records in `w01.json` to `w08.json` and the F1 fix `nut` in `w01.json`); the script rerun that makes `pictures.json` and `pictures.md` list version 2.
    - R11: each picture-list row has a line-art file name (the color name with `-line` before the version), unique across weeks 1 to 8. On the shipped weeks 1 to 8, the union of the 192 color names and the 192 line-art names has 384 distinct values. Collision guard (F13): on a copy with a story page text "A line." next to a page text "A.", the color name and the line-art names stay distinct, or the list throws with the two ids; a silent duplicate fails the test.
    - R12: the spec constants: the export `STORYTIME_PICTURE_SPEC` is exactly `{ A: { width: 4000, height: 3000 }, B: { width: 4000, height: 3000 }, C: { width: 1500, height: 1500 } }`; each row has `width` and `height` equal to the constant of its `sizeClass`, and the line art has the same pixel size as its row class (spec FR-9). The shipped list counts by use: story-page 112, cover 14, check-row 63, practice-line 3, card 0, sticker 0.
    - R13: the picture-word rule: the picture word of a practice line is not printed on another practice line of the block, and it is a word of the week (a reader page text, a picture word of `check.items`, or a home card word). A copy with net on the "and" line gives the error id `print-picture-word`. A copy with `Net` on the "and" line also fails (case). A copy with `zebra` on the "and" line fails (not a week word). A copy with `nest` on the line "A nest. A net." passes: a word on its own line is allowed (A7). The shipped week 1 passes after the F1 fix.
    - R14: the approval records: the six app parts accept `source` and `words` (spec FR-1.3). The shipped weeks record (a) and (b) of P14. Record (a): the `thai` source is `reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line <n>`, with n = 67 (week 1), 80 (weeks 2 to 4), 82 (weeks 5 to 7), 155 (week 8); the `thai` records carry no `words` key. Record (b): the week 1 `text` and `scripts` source is `Workbooks commit 4d78b21 (decision S29)`, with the words "publish week 1". The week 1 parts images, audio, and song stay draft. The `published` detail of st2/1 is exactly `images not approved; audio not approved; song not approved`.
    - R10b: the committed `pictures.md` equals `pictureListMarkdown(rows, 2)`, and its header says "Version 2".
- [x] Task (Green 2): commit 40bd714. `pictures.ts` (the line-art fields and the version-1 constants), `text-check.ts` (the picture-word rule), `schema.ts` (`source` and `words` on the six app parts), and the script rerun: `pictures.json` and `pictures.md` become list version 2, the first version that goes out. Commit order: G2a the Green 2 code; G2b the Content 2 data; G2c the script rerun (list version 2); the four gates run on G2c. `lib/lesson-package/schema.ts` stays unchanged: the Storytime schema extends `ApprovalSchema` (`.strict()` recommended). Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass on G2c.
    - Evidence: automated. Commits: 40bd714 (G2a code), ae6812c (G2b data), 8109758 (G2c list version 2). Gate results on G2c: `GREEN_TEST_COMMAND` exit 0, `Tests  71 passed (71)` on 2 files; `PROJECT_TESTS` exit 0, `Tests  190 passed (190)` on 12 files; `PROJECT_LINT` exit 0, 0 problems; `PROJECT_CHECKS` exit 0 (one accepted FAIL, `published` for st2/1, with the detail `images not approved; audio not approved; song not approved`; the `tsc` part clean; one earlier attempt hit a `heavy-run: lock wait over 600 s` hold and was rerun). The live drift proof: the script rerun exits 0 and `git diff --exit-code content/storytime/l2/print/` is clean; the list has 192 rows. mutants: 18, caught: 18 (M5 to M22; M1 to M4 keep their cycle 1 runs, because G2a changed none of their code lines). Log: `measure/runs/storytime_print_r1_20261025/jr-green-35f6838.log`.
- [x] Task (Content 2): commit ae6812c. The F1 fix in `w01.json` (nut) and the approval records of P14 in `w01.json` to `w08.json` (the approval block only; Python keeps the JSON format). Owner: jr-green. Its data commit (G2b) lands before the Green 2 rerun. One review subagent of another model family reads the records against the sources. The reviewer uses a model family other than GLM. Evidence: automated plus peer-report.
    - commit ae6812c holds the approval blocks of the eight weeks and the one `nut` line only (183 insertions, 1 deletion; parsed equality holds for every other key). The review is recorded in the next sub-bullet.
    - Evidence: automated plus peer-report: content2-review-ae6812c.log (MiniMax-M3, verdict pass; C1 answered with no change, key order; C2 to C4 notes).
- [x] Task (Hand-off): send picture list version 2, before Reviews A, B, and C (line art and color, weeks 1 to 8, as planning data), the picture spec version 1 (spec FR-9), and the print defaults of P2 to the PM session for Forge by 2026-10-28. The message gives what, why, done-when, and the dates needed: week 1 pictures by 2026-11-02 (Forge started the week 1 pictures on the PM's go of 2026-10-25), weeks 2 to 7 by 2026-11-16 (the renders of weeks 2 to 7 start after Daniel's week 1 approval unless Daniel says otherwise; each picture needs two outputs, line art and color). Send the open points P6, P7, P9, P11 to Daniel through the PM session on one page; the one page also holds the P2 defaults check, the P14 mapping check, the review notes F2 to F6, and P15. Done when: the PM session confirms receipt (peer-report). commit 8109758 (picture list version 2).
    - Evidence: peer-report. The PM session confirmed receipt on 2026-10-26 at 10:26 ICT (advantage-pr measure/pm-log.md, row 2026-10-26 10:26 ICT): picture list version 2 (pictures.json and pictures.md, commit 8109758), picture spec v1 (commit 40bd714), and the P2 print defaults. The PM forwards them to Forge after the asset work of 2026-10-26, before 2026-10-28. Daniel's one page (P6, P7, P9, P11, the P2 defaults check, the P14 mapping check, F2 to F6, P15) went in the same hand-off message after aaea4a3; Daniel's answers are open.
- [x] Task: Measure - User Manual Verification 'Phase 1: Contracts and the picture list' (Protocol in workflow.md). Owner: the orchestrator. Phase 1 has no owner gate. commit aaea4a3.
    - Evidence: automated. The orchestrator verified HEAD aaea4a3: the gates of jr-green-35f6838 ran on 8109758 (GREEN_TEST_COMMAND 71/71, PROJECT_TESTS 190/190, PROJECT_LINT 0 problems, PROJECT_CHECKS exit 0 with only the accepted `published` row of st2/1); a87316d and aaea4a3 change only plan.md; the week 1 rows of pictures.json are 16 story, 2 covers, 9 check, 3 practice; video/ is untouched; the Phase 1 commit SHAs resolve.

- [x] Task (Red 3): test B1 and N1 to N6 in `dashboard/__tests__/storytime-print-contract-r3.test.ts`; strengthen N2 in the v2 file. Measured failures: 28. commit c955bfa. Evidence: automated.
    - Red evidence: `cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts` exited 1 through `heavy-run.sh`. Result: `Tests  28 failed | 80 passed (108)` on 3 files. All failures occur inside the new R3 test bodies for the expected reasons. The 47 cycle 1 tests and 24 cycle 2 tests pass.
    - Failure counts: R15 counted answers (7), R16 counts and singular keys (10), R19 print strictness (1), R20 suffixes (6), R21 version (4).
    - Already satisfied at HEAD c955bfa: R18 rejects unknown keys on all six app parts because `.strict()` exists. The stronger N2 collision assertion passes because the error already names both full ids. R15 gives no count for the unanswered cake question. R20 preserves all 30 week 1 ids. R21 preserves the JSON array with 192 rows and no version field. No false Red claim applies to these checks.
    - `cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-print-*.test.ts` exited 0 through `heavy-run.sh`. No lint problems. No lock wait warning or exit 75 occurred. `pnpm-lock.yaml` stayed unchanged. Logs: `measure/runs/storytime_print_r1_20261025/mid-red-4695c59-red.txt` and `mid-red-4695c59-lint.txt`.
    - R10b correction: commit 115afea moves the header assertion to Version 3 and preserves the drift guard. Red owns test expectations; Green changes no test expectations. Evidence: automated. `RED_TEST_COMMAND` exited 1 through `heavy-run.sh`: `Tests  29 failed | 79 passed (108)`. Only the 28 R3 cases and the corrected R10b case fail. `PROJECT_LINT` exited 0 through `heavy-run.sh`. Logs: `measure/runs/storytime_print_r1_20261025/mid-red-4695c59-r10b-red.txt` and `mid-red-4695c59-r10b-lint.txt`.
    - R16 inventory correction: commit 0029163 removes car, doll, drum, teddy, and train. Evidence: automated. The corrected inventory has 53 keys: v2 has 57; remove nap and feet; add foot, cake, and friend; remove five negated-only keys. Ball and kite remain. The preserved Green patch also gives 53 keys on the shipped text. Its report incorrectly adds ball from a cover; ball already exists, and every cover has empty counts. `RED_TEST_COMMAND` exited 1 through `heavy-run.sh`: `Tests  29 failed | 79 passed (108)`. Only the 28 R3 cases and the corrected R10b case fail. `PROJECT_LINT` exited 0 through `heavy-run.sh`. Logs: `measure/runs/storytime_print_r1_20261025/mid-red-4695c59-inventory-{proof,red,lint}.txt`.
- [x] Task (Green 3): fix counts after "how many", negated questions, non-object nouns, and singular keys in `pictures.ts`. Start the suffix at "-b" and stop after "z". Export the list version constant with value 3. Make the print approval part strict. Rerun `print-pictures.ts --level 2` for list version 3. Run mutants M23 and up for each new rule. Fix the N8 plan wording. Record tech-debt rows for N7 (`text-check.ts:141,161,223`) and NC-1 (`STORYTIME_APPROVAL_PARTS` unused, `schema.ts:425`). Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass. commit 255f391.
    - The new version export is `STORYTIME_PICTURE_LIST_VERSION`. Keep `pictures.json` as a top-level array. Keep the picture spec at FR-9 version 1. Keep the 30 week 1 ids unchanged.
    - Evidence: automated. Commits: 255f391 (G3a code: `pictures.ts`, `schema.ts`), 078917f (G3b data: `pictures.json` and `pictures.md`, list version 3). Gate results on 078917f: `GREEN_TEST_COMMAND` exit 0, `Tests  108 passed (108)` on 3 files; `PROJECT_TESTS` exit 0, `Tests  227 passed (227)`; `PROJECT_LINT` exit 0, no output; `PROJECT_CHECKS` exit 0 in one outer `heavy-run.sh` wrapper (the nested heavy-run dropped for `tsc`): exactly one accepted FAIL, `published` for st2/1, `images not approved; audio not approved; song not approved`, and the `tsc --noEmit` part clean inside the same wrapper. The list: week 1 rows byte-equal to v2 (30 rows); exactly 4 id changes (`can-i`, `i-can`, `nan-can` of week 2 and `tap-tap-tap` of week 6, `-a` to `-b`); objectCounts changed rows by week: 2: 7, 3: 1, 5: 1, 7: 7 (16 rows). Mutants M23 to M38: 16 applied, 16 caught — M23 10, M24 3, M25 10, M26 4, M27 4, M28 10, M29 1, M30 6, M31 1, M32 8, M33 1, M34 11, M35 4, M36 2, M37 2, M38 3 failed — every restore `cmp` OK. Raw: `measure/runs/storytime_print_r1_20261025/jr-green-8e9b233-mutants.txt`. Log: `measure/runs/storytime_print_r1_20261025/jr-green-8e9b233.log`. The first Green 3 attempt (10d57c7) was blocked by the contradictory R16 inventory expectation; Red 3 corrected it in 0029163 (plan 8e9b233), and this run replayed the preserved patch `jr-green-10d57c7-green3-code.patch` cleanly.

## Phase 2: Student workbook template, week 1 (2026-10-27 to 2026-11-05)

_Blast radius: `storytimeQrUrl` and `STORYTIME_QR_HOST` (`lib/storytime/files.ts`; `__tests__/storytime-week.test.ts` asserts the host). Add `lib/print/pdfx.ts` and `scripts/print/make-pdfx.ts` for the opt-in flag only; the default conversion stays unchanged. The host stays. P4 was answered on 2026-10-25: the prints use the S23 address (spec P4)._

- [ ] Task (Hand-off 3): send picture list version 3 (reviewed in Phase 1) to the PM session for Forge, before 2026-10-28; it replaces version 2, which the PM has not forwarded. Done when: the PM session confirms receipt (peer-report).
- [x] Task (Red): `__tests__/storytime-print-student-book.test.ts` on the shipped `w01.json`. commit d9b6ecd; retry commit c9b6544. Evidence: automated.
    - Red evidence: `RED_TEST_COMMAND` (`cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts`) exited 1 through `heavy-run.sh`: `Tests  23 failed | 146 passed (169)`. Only the new file fails. All 23 failures are missing-module assertions inside test bodies: `student-book.ts` or `profile.ts`. The 146 existing print tests pass. No new test passes at this baseline.
    - Failure counts by bullet: page order and map (2), letter box (1), practice lines (1), writing page (1), check page (1), home card and QR inputs (3), labels and fonts (4), trim profile (3), K-only PDF/X (2), perforation and duplex geometry (2), mutations (3). Tests use the P2, P11, and P15 defaults. P6, P7, and P9 do not affect these tests.
    - `PROJECT_LINT` exited 0 through `heavy-run.sh`. No lock wait warning or exit 75 occurred. `pnpm-lock.yaml` stayed unchanged. Final logs: `measure/runs/storytime_print_r1_20261025/mid-red-03a803c-final-red.txt` and `mid-red-03a803c-final-lint.txt`. The report and Green handoff are in `mid-red-03a803c.log`. The first run found a jsdom path error before collection; the corrected final run has no collection failure.
    - Red fixes: commit c9b6544 corrects the nine type errors without changing expectations. The build helper now passes `--keep-fonts --k-only`. R31 keeps zero CMY, page count, positive K coverage, the PDF/X-1 marker, and cyan-patch detection. Two light checks cover the exact default Ghostscript arguments and `STORYTIME_STUDENT_PDFX_FLAGS = ['--keep-fonts', '--k-only']` in the production conversion call.
    - Retry evidence: automated. `RED_TEST_COMMAND` exited 1: `Tests  24 failed | 147 passed (171)`; only the student-book file fails. The 146 earlier tests pass; the default-argument characterization check also passes. `PROJECT_LINT` exited 0. `npx tsc --noEmit` exited 0 with 0 errors, including 0 in the student-book test. All three commands used `heavy-run.sh`.
    - No lock wait warning or exit 75 occurred. `pnpm-lock.yaml` stayed unchanged. Logs: `measure/runs/storytime_print_r1_20261025/mid-red-9466b31-{red,lint,tsc}.txt`; report: `mid-red-9466b31.log`.
    - Page order: the name page, the book map, the week 1 spread, the check page, the home card leaf. The spread starts on a left page.
    - The letter box shows "n" with a start dot, three trace copies, and one write space.
    - The practice sheet lines are the lines of `print.practice`, in order.
    - The writing page has the trace text "Hello, I am" and a name line.
    - The check page has 3 picture rows with the 9 picture ids of `check.items` and one write-letter box. It has no answer mark.
    - The home card front has `home.line.th`, the words net, nut, nose, the frame, `home.activity.th`, and two QR codes whose input is `storytimeQrUrl(home.songUrl)` and `storytimeQrUrl(home.readAlongUrl)`. The back has the English card and the 15 song lines.
    - The HTML has no "CEFR", "Pre-A1", "Starters", or "Reading A-Z", and no CJK character. Every font face is a static OFL face (Andika for English, Sarabun for Thai).
    - The trim comes from one print-profile constant: the same week renders at A4 and at 210 × 285 mm.
    - The inside pages of the PDF/X file use only the black (K) channel: `gs -sDEVICE=inkcov` gives C, M, and Y 0.00000 on every inside page.
    - The reader leaves and the home-card leaves carry the perforation mark 12 mm from the spine; the perforation side follows the page parity. The test checks the duplex registration of the strips. The strip width check: two reader pages of 99 mm fill the 198 mm leaf width after the tear (P15 default).
    - Mutations: a removed home card, an answer mark, and a spread on a right page each fail a test.
- [x] Task (Green): the student workbook. commit 399d9cb0.
    - Andika static faces (SIL OFL) and `OFL-andika.txt` in `dashboard/assets/print-fonts/` (no package change).
    - `lib/storytime/print/profile.ts` (trim, margins, bleed, page sizes in one place).
    - `lib/storytime/print/student-book.ts` (drawings for the letter box, the book map, and the cut line of the home card; Thai runs with `white-space: nowrap`, lessons-learned 2026-10-07).
    - `scripts/storytime/make-student-book-pdf.ts --level 2 --weeks 1 [--proof|--final]`: Paged.js in system Chrome, then `make-pdfx.ts --keep-fonts --k-only (an opt-in flag; the default does not change)`, to `~/Desktop/print-ready/storytime/Storytime-Advantage-L2-U1-Student-Book-v<n>_PDFX-1a.pdf`.
    - Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
    - Evidence: automated. Commits: c9f9d1e4 (the opt-in `make-pdfx.ts --k-only` DeviceGray pre-conversion; the default `ghostscriptArgs` list unchanged), 399d9cb0 (the fonts, `profile.ts`, `student-book.ts`, and the build script with `STORYTIME_STUDENT_PDFX_FLAGS = ['--keep-fonts', '--k-only']`). Gate results on 399d9cb0, all through `heavy-run.sh`: `GREEN_TEST_COMMAND` exit 0, `Tests  171 passed (171)` on 5 files; `PROJECT_TESTS` exit 0, `Tests  290 passed (290)` on 15 files; `PROJECT_LINT` exit 0, no output; `PROJECT_CHECKS` exit 0 in one heavy-run wrapper (one accepted FAIL, `published` for st2/1; the `tsc --noEmit` part clean). Logs: `measure/runs/storytime_print_r1_20261025/jr-green-17519e2-{green,project,lint,checks}.txt`. Mutants: 17 applied, 17 caught, every restore `cmp` OK — M39 9 failed (R22, R27), M40 2 (R26, R33), M41 8 (R22, R27), M42 1 (R30 297 mm), M43 1 (R31 zero CMY, the gray step bypassed), M44 1 (R28 line-art name), letter copies 1 (R23), practice order 1 (R24), writing text 1 (R25), check ids 3 (R26), home text 2 (R27), QR input 1 (R27 QR), song lines 1 (R27 back), labels 1 (R22 title), font face 1 (R29), perforation edge 1 (R32), back-strip slot 1 (R32 duplex). Raw: `measure/runs/storytime_print_r1_20261025/jr-green-17519e2-mutant-*.txt`. The `--proof` build: `~/Desktop/print-ready/storytime/Storytime-Advantage-L2-U1-Student-Book-v1_PDFX-1a.pdf`, 14 pages, PDF/X-1a:2001, `make-pdfx.ts --check` reports "All checks pass", 3 fonts embedded (Andika regular, Andika bold, Sarabun), `gs -sDEVICE=inkcov` gives C, M, and Y `0.00000` on all 14 pages and K above 0 on the 13 marked pages (`jr-green-17519e2-inkcov.txt`). The reader strip boxes stay empty until Phase 4.
- [ ] Task (Check): the week 1 workbook pages under the heavy lock. `PRINT_GATE` passes. A contact sheet of every page at 100 dpi. The agent looks at every page and lists defects (rule 6.5). A person scans both QR codes on a printed page with a phone and records the result (person-checked; the URL answers after the monorepo deploy; monorepo plan task 7.4 checks every printed path on 2026-11-15).
- [ ] Task: Measure - User Manual Verification 'Phase 2: Student workbook template, week 1' (Protocol in workflow.md)

## Phase 3: Teacher book print file, week 1 (2026-10-27 to 2026-10-30)

_Blast radius: `compileStorytimeManual` (`scripts/storytime/make-manual-pdf.ts`; `__tests__/storytime-manual.test.ts`). The template output must not change._

- [ ] Task (Red): `__tests__/storytime-print-teacher-book.test.ts`.
    - The text gate (`lib/storytime/print/text-diff.ts`) takes two `pdftotext -layout` outputs and reports each line that differs, except page numbers. A changed Thai word in a copy gives one difference. The same text gives none.
    - The print file name has a version and the language: `Storytime-Advantage-L2-U1-Teachers-Book-TH-v1_PDFX-1a.pdf`.
    - The Thai HTML of the shipped `w01.json` has every step id of the week and the four headings (`getTranslations('th').teachingNotes`).
- [ ] Task (Green): `scripts/storytime/make-teacher-book-print.ts --level 2 --weeks <list> --lang th|en`. It calls `compileStorytimeManual` (A4), renders the Chrome PDF, runs the text gate against the draft of each week, and runs `make-pdfx.ts --keep-fonts`. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check): the week 1 teacher book in Thai and English. `PRINT_GATE` passes. The text gate against `~/Desktop/primary-parity-progress/storytime/Storytime-L2-W01-Teachers-Book-{TH,EN}-draft.pdf` gives 0 differences, or each difference is listed with its cause for Daniel. A contact sheet of every page.
- [ ] Task: Measure - User Manual Verification 'Phase 3: Teacher book print file, week 1' (Protocol in workflow.md)

## Phase 4: Readers, week 1 (workbook pages and color A3 PDFs; 2026-10-28 to 2026-11-05)

- [ ] Task (Red): `__tests__/storytime-print-readers.test.ts` on the two readers of the shipped `w01.json` ("Hello!" and "Nan Can Nod").
    - Each reader has 12 pages of 99 × 140 mm (P15 default) in the page plans of spec FR-5.2 and FR-5.3.
    - The strip imposition: 3 strips for each reader, 2 strips on each A4 leaf, with the page pairs 12/1, 2/11, 10/3, 4/9, 8/5, and 6/7. The two week 1 readers fill 3 leaves. The perforation side follows the page parity. The test checks the duplex registration of the strips. The strip width check: two reader pages of 99 mm fill the 198 mm leaf width after the tear (P15 default).
    - The text of each story page is `pages[i].text`. The decodable reader has its sounds page (n; nest, net, nut, ...; a, and, can) and its back-cover word list (`backWords`).
    - The reader cover has the title, "Sprout", "Storytime Advantage", and the week number.
    - The color A3 PDF has 12 A3 pages for each reader. Both outputs have `final` and `proof` modes.
    - `final` mode throws when a picture file is missing and names the picture id. `proof` mode prints "PICTURE MISSING".
    - The picture measurement check (`lib/storytime/print/picture-check.ts`, sharp metadata) passes a 4000 × 3000 sRGB color PNG and a 4000 × 3000 grayscale line-art PNG, each with no alpha. It fails a 3000 × 2250 copy, an RGBA copy, a CMYK copy, a color file in the line-art place, and a wrong file name.
- [ ] Task (Green): `lib/storytime/print/readers.ts`, `lib/storytime/print/picture-check.ts`, and `scripts/storytime/make-readers-pdf.ts --level 2 --weeks <list> [--proof|--final] [--workbook|--a3-color]`. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check, proof mode): the two week 1 readers with empty picture boxes, in the workbook and as color A3 PDFs, for a layout check before the pictures come. A contact sheet of every page.
- [ ] Task (Pictures, week 1): receive the Forge week 1 batch with its manifest. Stage 1: `picture-check.ts` on every file. Stage 2: the model pre-check (rule 6.7) after Daniel's go for the models and the price (P7), with the calibration first. Stage 3: a person counts the objects against the text (rule 9.2). A failed picture goes back to Forge with the reason. Then the two week 1 readers in `final` mode, in the workbook and as color A3 PDFs; `PRINT_GATE` passes on the workbook pages. Evidence: automated, model pre-check, person-checked.
- [ ] Task: Measure - User Manual Verification 'Phase 4: Readers, week 1' (Protocol in workflow.md)

## Phase 5: Covers, week 1 (2026-11-02 to 2026-11-05)

_Blast radius: `COVER_BOOKS` (`lib/covers/catalogue.ts`, `schema.ts`, `check.ts`; `__tests__/covers-contract.test.ts`, `covers-back.test.ts`): no change. `lib/covers/compose.ts` is reused, not changed._

- [ ] Task (Red): `__tests__/storytime-print-covers.test.ts`.
    - The Storytime cover data schema (cover kind, title, band, art files) refuses an unknown band.
    - The copy check fails a cover text with "CEFR", "Pre-A1", "Starters", or "Primary Advantage", a cover without "Storytime Advantage", and a reader cover without "Sprout". The copy check also runs on the reader cover pages.
    - A composed side is one opaque layer (no alpha channel) at 300 ppi for the trim.
    - The Primary cover tests stay green.
- [ ] Task (Green): `lib/storytime/print/covers.ts` and `scripts/storytime/make-storytime-cover.ts <workbook|teacher-book> [--print]`: PNG of each side for Daniel, then a 2-page Chrome PDF and `make-pdfx.ts --keep-fonts`. The cover module makes the workbook and teacher book covers. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check): the cover PNGs of the workbook and the teacher book go to Daniel, and the two week 1 reader cover pictures (line art and color) go to him. After his approval, the workbook and teacher book cover print files; `PRINT_GATE` passes. Daniel checks any Thai on the covers.
- [ ] Task: Measure - User Manual Verification 'Phase 5: Covers, week 1' (Protocol in workflow.md)

## Phase 6: Week 1 proof and Daniel's approval (2026-11-05 to 2026-11-09)

- [ ] Task: the week 1 proof. The week 1 workbook pages with the two readers, the two color A3 reader PDFs, and the week 1 teacher book in Thai and English. A contact sheet of every page, and a list with the SHA-256 and the source commit of each file. The agent opens every page first (rule 6.5). The proof goes to Daniel through the PM session on 2026-11-05.
- [ ] Task (Owner gate): Daniel approves the week 1 print. Record his exact words and the date in `approval.print` of `w01.json` (rules 12.1 and 12.3). No answer is not an approval (rule 0.3). If he has not approved by 2026-11-09, tell him the Phase 7 date risk (line 47). The old 11-05 stop rule does not apply (PM relay of Daniel's standing words, 2026-10-25, peer-report). Evidence: owner-approved.
- [ ] Task: the fix list from Daniel's notes. Each changed file gets a new version (rule 12.2), passes its gates again, and goes back to Daniel until he approves.
- [ ] Task: Measure - User Manual Verification 'Phase 6: Week 1 proof and Daniel's approval' (Protocol in workflow.md)

## Phase 7: Weeks 2 to 8 (2026-11-10 to 2026-11-18; starts after the Phase 6 approval)

- [ ] Task (Content): the `print` blocks of weeks 2 to 7. The print-text check passes. One independent review subagent for each week (lessons-learned, 2026-10-22). Week 8 uses `block.days[].paper` and `benchmark.paper`, which exist.
- [ ] Task (Red): extend the print tests to the shipped weeks 2 to 8.
    - The workbook has the pages of all 8 weeks. Week 8 has 5 review pages and the Benchmark 1 page (8 circle-picture rows and 7 write-letter boxes). The book map has 7 decodable-reader places and 1 unit place.
    - The 12 readers of weeks 2 to 7 have their page plans and texts.
    - The text gate of the Thai teacher book has 0 differences for each of the 8 weeks, or each difference is listed.
- [ ] Task (Green): the template changes that weeks 2 to 8 need (for example, the circle-word rows and the picture sort of the review pages). Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Pictures, weeks 2 to 7): the Forge batches, needed by 2026-11-16. The three picture stages of Phase 4 for each batch. Daniel looks at each batch.
- [ ] Task (Check): the unit 1 workbook with the 14 readers, the 14 color A3 reader PDFs, the unit 1 teacher book in Thai and English, and the workbook and teacher book covers. `PRINT_GATE` passes for each print file. A contact sheet of every page. The agent opens every page.
- [ ] Task: Measure - User Manual Verification 'Phase 7: Weeks 2 to 8' (Protocol in workflow.md)

## Phase 8: Card kit (2026-11-02 to 2026-11-19; only the week 1 cards before the Phase 6 approval)

- [ ] Task (Red): `__tests__/storytime-print-card-kit.test.ts` on the shipped weeks.
    - The Red author writes the expected card lists by hand from the `materials` of the 8 files. Example: the sound cards of unit 1 are n, a, p, m, s, t, o. A removed materials item in a copy changes the list and fails the test.
    - The letter strip has the 26 letters of `w08.json` `benchmark.oneToOne.letters`, in that order.
    - The sound and symbol cards are A5. The picture cards and the tricky-word cards are A6 (design §8).
    - The sticker sheet has 8 stickers: the 7 decodable covers and unit 1.
- [ ] Task (Green): `lib/storytime/print/card-kit.ts` and `scripts/storytime/make-card-kit-pdf.ts --level 2 --weeks <list>`: cards n-up on A4 with cut lines, one print file for each card size. The classroom language card only after Daniel gives its text (spec P9). Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- [ ] Task (Check): the card kit print files; `PRINT_GATE` passes. A person cuts one test sheet of each size and measures one card (person-checked).
- [ ] Task: Measure - User Manual Verification 'Phase 8: Card kit' (Protocol in workflow.md)

## Phase 9: Release proof and print order (2026-11-19 to 2026-11-25)

- [ ] Task: the release proof by 2026-11-20. All print files, the contact sheets, and the print order sheet (item, file, SHA-256, trim, pages, paper, binding, colors, quantity for each classroom). The print order sheet lists printer jobs only; the color A3 reader PDFs get their own file list with the SHA-256 of each file, for the teachers. Each print file passes `PRINT_GATE` and is newer than the last commit of its sources (`git log -1 --format=%cI -- <sources>`). Each printed QR URL (the S23 address) answers on the live host.
- [ ] Task (Owner gate): Daniel approves the release proof by 2026-11-24. Record his exact words and the date in `approval.print` of each week package. Evidence: owner-approved.
- [ ] Task: the print order on 2026-11-25. Daniel gives the go to send. Record the printer, the order date, and the delivery date in this plan.
- [ ] Task: Measure - User Manual Verification 'Phase 9: Release proof and print order' (Protocol in workflow.md)

## Phase 10: Hand-off (2026-11-25 to 2026-11-27)

- [ ] Task: update `measure/tech-debt.md` and `measure/lessons-learned.md` (50 lines or less each). Send the "facts changed" list to the PM session (price, date, status, numbers, names; an empty list is a valid answer).
- [ ] Task: set `actual_tasks` and the deviation notes in `metadata.json`; the track is ready for final acceptance and closeout.
