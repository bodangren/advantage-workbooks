# Plan: storytime_week_package_20261022

## Phase 1: Package

- [x] Task: the schema and a Level 2 fixture week (tests first: the fixture parses; a wrong program, shape, level, or step id is refused). Changed the same day after Monorepo's QR-page review (Storytime agreed): `books[]` with `kind` readalong or decodable, the app's `SentenceTimepointSchema` for book and song times (`page` on book sentences), `meta.status` draft or published, `meta.band` (S15 names).
- [x] Task: the checks (tests first: the fixture is clean; one test for each rule). 9 mutants, all caught (one after a new test).
- [x] Task: the file paths and the URL key (`st<level>/<week>`): `lib/storytime/files.ts`, `content/storytime/README.md`.

## Phase 2: Manual template

- [x] Task: the labels (English and Thai drafts).
- [x] Task: the week and day renderer (tests first: five day sections, minutes, four headings, three lines, the Thai gloss under the English, no CJK).
- [x] Task: the document (title page, wrapper, A4) and one A4 PDF of the fixture (Chrome render under the heavy lock): `scripts/storytime/make-manual-pdf.ts`; the fixture week is 14 A4 pages in Thai, fonts embedded. Contact sheets showed two defects (no day page breaks, a split title word); both fixed.

## Phase 3: Hand-off

- [~] Task: the commit, the commit id and the shape summary to the Storytime session; tech-debt and lessons-learned.

## Phase 4: Level 2 week 1 (S17, approved 2026-10-22)

- [~] Task: write week 1 from the Storytime sequence row (element n, frame "Hello, I am ___.", names and greetings): the read-along, the decodable, the song lyrics, the five scripts, the strips, the check, and the home card; checks clean; the Storytime review, then Daniel's Thai check.
  - 2026-10-22: written (`content/storytime/l2/w01.json`): read-along "Hello!" (8 pages, 33 words, Pip twist), sound book "Nan Can Nod" (`soundBook`, Storytime option A), the song lyric that Daniel rated "really good" (unchanged, `lyricSheet`), five 30-minute scripts. An independent review gave 33 findings; 32 applied (graph ids wait for graph v0, as Storytime asked). Changes against design §3.3, sent to Storytime: the Friday check E5 stays on day 5; the song steps B7 and D6 are item 3 of the next opening; E6 joins D6; A8 is a home-time task. The n action is a nod (n for nod).
  - 2026-10-22: the Storytime review fixes (539298a; Nan joins the series bible) and the song audio (020f9b5; Lyria 3 Pro, Daniel's choice, `media/w01/song.mp3`, 78.4 s).
  - 2026-10-22: `song.lines` and `song.times` follow the audio: 15 sung lines. Two transcriptions agree that the sheet line "Hello, I am, hello, I am" is not sung and that chorus 1 sings "Hello, who are you?" three times. The lyric sheet stays as the text sent to Lyria, and the `song-sheet` check is now a warning. The independent Thai proofread (a subagent, 26 findings) is applied, and Daniel still checks all Thai; `focus.element.action`, `focus.paSkill`, and `focus.family.name` are now English with Thai, and the `thai` check counts them, the prep lines, and the song notes.

## Phase 5: Book audio (S30, Storytime 2026-10-23; Daniel's go 2026-10-24)

- [~] Task: the book audio of each week with mmx and the read-along times (`dashboard/scripts/storytime/book-audio.ts`, tests first: the sentences and pages, the gaps, the screen words, the word fit, the heard check). One mmx clip for each sentence at 1.0 and at 0.75 (design §6.1), joined with 0.5 s in a page and 1.2 s at a page turn; `books[].audio` = {voice, file, sentences, slowFile, slowSentences} with the word times from faster-whisper (the letter counts when the word count differs). A take that the recognizer hears as other words is made again ("Nan can nod!" was heard as "Nan cannot."). The mmx clip code moved from `lesson-audio.ts` to `lib/media/make-clip.ts`; `check-weeks.ts` checks that the book audio files exist. Voice: `English_captivating_female1` (Daniel's lesson voice, 2026-10-01).

## Phase 6: Song-line pictures for weeks 2 to 7 (QR3; Daniel's go 2026-10-24, item 4)

- [~] Task: the gesture pictures of the week 2 to 7 song lines (`video/storytime-song/scripts/line-pictures.mjs`, test first: the week's own Forge set, else the gesture library). The library `content/storytime/forge-gestures/` is a Forge set with gestures only: the week 1 frames and the chibi-sprouts stills for weeks 2 to 7 (advantage-forge `out/chibi-sprouts/r1/week2-7/gestures`, 2026-10-24; 21 gestures, 32 frames). Only its `manifest.json` is in git; the video does not read it, so weeks 2 to 7 keep the placeholder art until Daniel passes the week 1 video. 45 pictures, 540 KB; `image.file` on 50 lines. Follow-up done: march, stamp, and sway looked close to idle in a still (the legs are short and the crop ends below the belt), so chibi-sprouts made one still pose of each for the pictures only (`<gesture>-picture` in the manifest). A pose has its own crop, the whole figure with the raised foot, and does not change the shared crop of the week. Turn has no independent review yet.

## Phase 7: Book pictures for the app, week 1 (2026-11-03 to 2026-11-06)

Spec review: Kimi, 2026-11-03, fail with 1 blocker (F1) and 7 nonblocking; closed in this commit; a short second review follows.

Spec: the section "Addendum 2026-11-03: book pictures for the app (Phase 7)" in [spec.md](./spec.md). Hand-off to the PM session for Monorepo: 2026-11-06. Weeks 2 to 7 come in a later phase by 2026-11-16.

PM 2026-11-03: light lane (accepted 19:1x ICT): one maker, one checker. The maker task below replaces the Red and Green tasks. The checkers are the spec review (one role, before the maker), the contact-sheet check, and the PM check of the hand-off folder against the Monorepo field contract (A-42 Hand-off 1).

_Blast radius (grep, `graph.db` is stale): `scripts/storytime/set-book-pictures.ts` (new, 0 callers); `scripts/storytime/check-weeks.ts` (1 file, the CLI only; the `book-pictures` check follows the `book-audio` check); `content/storytime/l2/w01.json` (parsed through `StorytimeWeekSchema`, which has 21 files in its blast radius; the change adds 18 `image.file` values and the `approval.images` record); media under `content/storytime/l2/media/w01/books/` (18 JPEGs and `pictures.sha256`, new). Test files that pin the old `published` detail of the shipped w01 (they belong to the print track and the A-42 track): `__tests__/storytime-print-contract-v2.test.ts:289`, `__tests__/storytime-print-adversarial.test.ts:257`, `__tests__/storytime-loops-schema.test.ts:303` (and its use of `PUBLISHED_DETAIL` in the same file), plus any other test that reads the `published` detail of the shipped w01 (the A-42 dry run lists 7 published tests in `measure/runs/storytime_teaching_loops_20261103/switch-dryrun.txt`). The `PROJECT_CHECKS` commands of both tracks count only the FAIL name `published`, so they keep working. No schema change._

```bash
RED_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-book-pictures.test.ts __tests__/storytime-loops-schema.test.ts __tests__/storytime-print-contract-v2.test.ts __tests__/storytime-print-adversarial.test.ts __tests__/storytime-print-contract.test.ts'    # add each other changed test file; must fail after Red, before Green
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-book-pictures.test.ts __tests__/storytime-loops-schema.test.ts __tests__/storytime-print-contract-v2.test.ts __tests__/storytime-print-adversarial.test.ts __tests__/storytime-print-contract.test.ts'  # add each other changed test file; must pass after Green
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-loops-*.test.ts __tests__/storytime-book-pictures.test.ts'
PROJECT_CHECKS='cd dashboard && out=$(npx tsx scripts/storytime/check-weeks.ts --level 2); test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -le 1 && ! printf "%s\n" "$out" | grep "  FAIL " | grep -v "  FAIL    published" && npx tsc --noEmit'  # the whole command runs inside one heavy-run wrapper; no nested heavy-run
UX_REQUIRED=never   # the visual check is the contact-sheet task (person-checked)
```

The whole command of each gate runs inside one heavy-run wrapper: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. The rules of the Phase 5 and 6 tasks apply: stage path by path, never stage `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, or the files under `measure/runs/` of other tracks, no pnpm, and run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed. Rule R1 (one Red window at a time across the tracks `storytime_print_r1_20261025` and `storytime_teaching_loops_20261103`) applies to the Red task. The orchestrator starts the Red task only when no other Red window is open. The pictures are not test items, so the public repository rule does not block them. The source pictures stay local (git-ignored); only the 18 JPEGs are committed. Rule R1 no longer blocks this task: the Red windows of both other tracks are closed (the print Red retry r2 cd08e412; A-42 Phase 1 closed).

- [x] Task (Maker): add tests and the w01 picture script, check, JPEGs, provenance, and the hand-edited images approval. Update the pinned published-detail tests. Keep `meta.status` published and audio and song approvals draft.
  - Commits: test `4cefdf60a930cb108e8909be5f4afc617d473fe3`; script and check `ae7ef1c04e405a7c6277f2dd153ed9995c92c1f0`; content `cf30bb2eee55806bf8830b3a3e69e4f6044847e6`.
  - Red: one pre-code run failed because `set-book-pictures.ts` did not exist; 0 tests ran. Evidence: `maker-a1675eba-red.txt`.
  - Green: 5 files, 142 tests passed: book pictures, loops schema, print v2 contract, print adversarial, and print contract.
  - Lint: passed for `lib/storytime`, `scripts/storytime`, loops tests, and the new book-pictures test.
  - Checks: 8 packages, 1 accepted FAIL, 49 warnings. The FAIL is `published`: `audio not approved; song not approved`. `tsc --noEmit` passed.
  - Repeat run: all 20 SHA-256 entries matched for 18 JPEGs, `pictures.sha256`, and `w01.json`.
  - JPEGs: 18 files, quality 82 for each, sharp 0.34.5; 1600 px long side and at most 400 KB.
  - Hand edit: `approval.images` uses the exact D7 words and source; `approval.audio` and `approval.song` stay draft.
- [x] Task (Check): the orchestrator opens the 18 JPEGs on one contact sheet and compares them with the approved print pictures. Evidence: person-checked. Done when: the contact sheet is in `measure/runs/storytime_week_package_20261022/` and the orchestrator records that all 18 match their print pictures (right book, right page, color, not line art).
  - 2026-11-04: the orchestrator opened measure/runs/storytime_week_package_20261022/w01-book-pictures-contact-sheet.png and compared each JPEG with the color A3 v3 reader proofs (proof-w01-v3). All 18 match: Hello cover and p01 to p08 (Pat, May, Sam, Mia, Nan, Ben, your teacher, Pip) and Nan Can Nod cover and p01 to p08 (nest, net, nut, nose, neck, nurse, a nest and a nut, Nan can nod). Each is the right book and page, in color, not line art. Evidence: person-checked.
- [ ] Task (Hand-off): put the w01 app package in /home/daniebo/Desktop/handoff/w01-storytime-app-package/ (rules: /home/daniebo/Desktop/handoff/README.md). Contents: `content/storytime/l2/w01.json` and every media file that w01.json names, with relative paths from `content/storytime/` exactly as w01.json names them (`l2/media/w01/...`, `phonemes/daniel/...`). Every path matches `[A-Za-z0-9._/-]`. Commit w01.json first. Then copy it; the hand-off folder's w01.json must equal `git show <sha>:content/storytime/l2/w01.json` byte for byte. MANIFEST.txt has `workbooks-commit: <full sha>`, the source repo and path, each file with its SHA-256, the date, and the sender. The Monorepo session reads the sibling checkout read only through receive-weeks.ts; do not push. Then send one line to the PM session. The PM checks the folder against the Monorepo field contract (A-42 Hand-off 1: steps, books, scripts, approval, recall kinds, media paths, answer.page) before Monorepo takes it. Due 2026-11-06. Done when: the PM confirms that the check passed (peer-report).
  - Folder: `/home/daniebo/Desktop/handoff/w01-storytime-app-package/`; 44 files (43 payload files and `MANIFEST.txt`); all 43 manifest hashes pass; `w01.json` matches commit `cf30bb2eee55806bf8830b3a3e69e4f6044847e6` byte for byte.
- [ ] Task: Measure - User Manual Verification 'Phase 7: Book pictures for the app, week 1' (Protocol in workflow.md)

## Phase 8: Fixes from the cloud review of 2026-11-03 (2026-11-04 to 2026-11-06)

PM 2026-11-03: light lane: one maker, one checker; tests: only the test files that a task changes; PROJECT_TESTS once at the phase end. Source: /home/daniebo/Desktop/handoff/cloud-wb-reports-1103/wb-storytime-checks-review.md (findings) and wb-storytime-checks-mutants.md (mutants 62 and 74), base cc7808c5. Finding 4 is in Phase 7. Finding 5 is by design (PM 2026-11-03): the sound game replaces the calendar (content/storytime/README.md line 15, i18n.ts line 41, schema.ts line 653; Storytime 2026-10-22); the opening stays 6 minutes. Findings 3 and 7 to 14 are not in this phase; they go to measure/tech-debt.md at the phase end.

```bash
RED_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-manual.test.ts __tests__/storytime-print-teacher-book.test.ts __tests__/storytime-week.test.ts __tests__/storytime-loops-checks.test.ts __tests__/storytime-phonics.test.ts'  # tests first; must fail before implementation
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-manual.test.ts __tests__/storytime-print-teacher-book.test.ts __tests__/storytime-week.test.ts __tests__/storytime-loops-checks.test.ts __tests__/storytime-phonics.test.ts'  # must pass after implementation
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-loops-*.test.ts __tests__/storytime-book-pictures.test.ts'
PROJECT_CHECKS='cd dashboard && out=$(npx tsx scripts/storytime/check-weeks.ts --level 2); test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -le 1 && ! printf "%s\n" "$out" | grep "  FAIL " | grep -v "  FAIL    published" && npx tsc --noEmit'  # the whole command runs inside one heavy-run wrapper; no nested heavy-run
UX_REQUIRED=never
```

The whole command of each gate runs inside one heavy-run wrapper: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.

- [x] Task (Maker, F6): the recall group of the teacher manual (`dashboard/lib/storytime/manual.ts` about line 206). Rules: (a) no content drops out of the manual; (b) no step of 0 minutes prints under a heading that says "1 min each"; a 0-minute song step (B7, D6, E6) prints with the opening song item that covers it, without minutes; (c) no new label and no new Thai text; if the home card A8 (0 minutes) has no existing home-time label, it stays where it prints now, and the maker reports it; (d) the opening header minutes stay correct. Tests first in `__tests__/storytime-manual.test.ts` (w02 day 2, 3, and 5; one Thai case). Run only `storytime-manual.test.ts` and the `storytime-print-teacher-book` tests that render the manual. Red: 4 failed, 23 passed. Green: 38 passed across the two test files. PROJECT_LINT passed. PROJECT_CHECKS: 8 packages, 1 allowed `published` FAIL for w01 audio/song approvals, 49 warnings; TypeScript passed. The old recall-filter mutant failed the B7 case; the source was restored and `cmp` passed. A8 remains in the day 2 recall group because `i18n.ts` has no home-time label; its title prints without minutes. Commits: tests `be9fb726c5d5c3e1e34d5eed2ec447aee31c0ee9`; code `06e866e12da015966d0d9f271868db179a2afee7`. PM 2026-11-03: light lane.
- [x] Task (Maker, F1 F2 and mutants 62 74): `dashboard/lib/storytime/checks.ts`. F1: `frameCount` matches the ___ slot as whole words only (a required space on both sides; the review fix sketch); "a" and "an" count as the same frame word, so "I can see an animal!" counts for the frame "I can see a ___." A line without the frame, such as "I can see!", does not count (orchestrator default, sent to the PM). A changed song lyric needs new song audio and a new listen check. F2: `soundBook` true is allowed only on Level 2 week 1; any other week gives a books FAIL with a clear reason. Mutant 62: a test that exactly 3 home words pass and 2 or 4 do not. Mutant 74: a test that a block week covered only on day 5 fails. Tests first; run only the test files of `checks.ts`. Done when: those tests, PROJECT_LINT, and PROJECT_CHECKS pass, the record lists the frame counts of st2/1 to st2/7 before and after, and the 4 mutants (F1, F2, 62, 74) are caught. Commits: tests `ae3ff1506707e3a9664ff048de21a17919ccc54f`; code `e31391acae343a2fbdfa1543144cadc957b6dc2c`.
  - PM 2026-11-03: light lane.
  - Red: `checks-red.txt`; 44 tests, 2 expected failures for F1 and F2, and 42 passes. Mutants 62 and 74 passed as boundary tests.
  - Green: `checks-green-final.txt`; 2 test files and 76 tests passed.
  - Lint: `checks-lint-final.txt`; passed. PROJECT_CHECKS: `checks-project-checks-final.txt`; passed with 8 packages, one accepted `published` FAIL, 49 warnings, and `tsc --noEmit`.
  - Mutants F1, F2, 62, and 74 were caught; see `checks-mutants-final.txt`.
  - Frame counts before: st2/1–st2/7 = 8, 9, 9, 10, 12, 9, 10. Counts after: 8, 9, 9, 10, 12, 9, 10.
- [ ] Task (Check): one report-only checker reads the diffs of the two maker tasks against this phase and runs their tests once. Done when: the report has no open error.
- [ ] Task: PROJECT_TESTS once at the phase end; add findings 3 and 7 to 14 to `measure/tech-debt.md` with these triggers: findings 7 and 8 (sound labels) must be fixed before the first week that uses x, qu, ee, or th; findings 3 and 9 (the review-strip week; two right answers) must be fixed before any new week after w08 is written; findings 10 to 14 have no trigger (low).
- [ ] Task: Measure - User Manual Verification 'Phase 8' (Protocol in workflow.md). Owner: the orchestrator.
