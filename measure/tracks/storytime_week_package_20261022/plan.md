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

Spec: the section "Addendum 2026-11-03: book pictures for the app (Phase 7)" in [spec.md](./spec.md). Hand-off to the PM session for Monorepo: 2026-11-06. Weeks 2 to 7 come in a later phase by 2026-11-16.

_Blast radius (grep, `graph.db` is stale): `scripts/storytime/set-book-pictures.ts` (new, 0 callers); `scripts/storytime/check-weeks.ts` (1 file, the CLI only; the `book-pictures` check follows the `book-audio` check); `content/storytime/l2/w01.json` (parsed through `StorytimeWeekSchema`, which has 21 files in its blast radius; the change adds 18 `image.file` values and the `approval.images` record); media under `content/storytime/l2/media/w01/books/` (18 JPEGs and `pictures.sha256`, new). Test files that pin the old `published` detail of the shipped w01 (they belong to the print track and the A-42 track): `__tests__/storytime-print-contract-v2.test.ts:289`, `__tests__/storytime-print-adversarial.test.ts:257`, `__tests__/storytime-loops-schema.test.ts:303` (and its use of `PUBLISHED_DETAIL` in the same file), plus any other test that reads the `published` detail of the shipped w01 (the A-42 dry run lists 7 published tests in `measure/runs/storytime_teaching_loops_20261103/switch-dryrun.txt`). The `PROJECT_CHECKS` commands of both tracks count only the FAIL name `published`, so they keep working. No schema change._

```bash
RED_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-book-pictures.test.ts __tests__/storytime-loops-schema.test.ts __tests__/storytime-print-contract-v2.test.ts __tests__/storytime-print-adversarial.test.ts'    # add each other changed test file; must fail after Red, before Green
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-book-pictures.test.ts __tests__/storytime-loops-schema.test.ts __tests__/storytime-print-contract-v2.test.ts __tests__/storytime-print-adversarial.test.ts'  # add each other changed test file; must pass after Green
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-loops-*.test.ts __tests__/storytime-book-pictures.test.ts'
PROJECT_CHECKS='cd dashboard && out=$(npx tsx scripts/storytime/check-weeks.ts --level 2); test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -le 1 && ! printf "%s\n" "$out" | grep "  FAIL " | grep -v "  FAIL    published" && npx tsc --noEmit'  # the whole command runs inside one heavy-run wrapper; no nested heavy-run
UX_REQUIRED=never   # the visual check is the contact-sheet task (person-checked)
```

The whole command of each gate runs inside one heavy-run wrapper: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. The rules of the Phase 5 and 6 tasks apply: stage path by path, never stage `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, or the files under `measure/runs/` of other tracks, no pnpm, and run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed. Rule R1 (one Red window at a time across the tracks `storytime_print_r1_20261025` and `storytime_teaching_loops_20261103`) applies to the Red task. The orchestrator starts the Red task only when no other Red window is open. The pictures are not test items, so the public repository rule does not block them. The source pictures stay local (git-ignored); only the 18 JPEGs are committed.

- [ ] Task (Red): `__tests__/storytime-book-pictures.test.ts` on the shipped w01. It checks: every cover and page has `image.file` by the path rule (D2); the file exists; it is a JPEG; the long side is 1600 px; the size is 400 KB or less; the provenance file names each picture once and its output SHA-256 matches the file; the captions are unchanged; `approval.images` is approved with the three quotes exactly; the check id `book-pictures` is present with the status `pass`. It also holds a mutation test on a copy in a temporary folder (one file missing gives `fail`) and a test for the script with a source match of zero or two entries (exit 1, no write). The task also updates the pinned `published` detail in `storytime-print-contract-v2.test.ts`, `storytime-print-adversarial.test.ts`, `storytime-loops-schema.test.ts`, and any other test that reads it. Done when: `RED_TEST_COMMAND` fails only on the new and changed assertions, and the commit holds only files under `dashboard/__tests__/`.
- [ ] Task (Green): write `scripts/storytime/set-book-pictures.ts` (spec FR 1 to 3), add the `book-pictures` check to `scripts/storytime/check-weeks.ts` (FR 4), run the script for w01 (18 JPEGs, `pictures.sha256`, 18 `image.file` lines), and write the `approval.images` record by hand (FR 5, D7). Record the hand edit in this task line. Change no test file. Write JSDoc on each export. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass, and a second run of the script changes no byte (compare the SHA-256 of the 18 JPEGs, of `pictures.sha256`, and of the week file before and after).
- [ ] Task (Check): the orchestrator opens the 18 JPEGs on one contact sheet and compares them with the approved print pictures. Evidence: person-checked. Done when: the contact sheet is in `measure/runs/storytime_week_package_20261022/` and the orchestrator records that all 18 match their print pictures (right book, right page, color, not line art).
- [ ] Task (Hand-off): send the commit SHA of the Green task and the 18 paths to the PM session for Monorepo, by 2026-11-06. Done when: the PM confirms receipt (peer-report).
- [ ] Task: Measure - User Manual Verification 'Phase 7: Book pictures for the app, week 1' (Protocol in workflow.md)
