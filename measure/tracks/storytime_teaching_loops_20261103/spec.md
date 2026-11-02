# Spec: Storytime teaching loops

Track: `storytime_teaching_loops_20261103`. Type: feature (classic FR list). Created: 2026-11-02. Starts: 2026-11-03. Status: planned, no code.

## Overview

This track adds five teaching routines to the five daily scripts of the Storytime Advantage Level 2 weeks. The source is research item A-42: the comparison of Storytime with "Teach Your Child to Read in 100 Easy Lessons" (advantage-pr, `06-research-and-evidence/storytime-vs-100-easy-lessons-2026-11.md`, version 1.4, 2026-11-01). The comparison found five gaps. This track closes them in the week data, the checks, and the Thai teacher book.

The five routines:

1. Dimension 2 (adopt): a scripted oral blend drill with model, lead, and test, with an oral repetition count and a correction step.
2. Dimension 8 (adopt): the correct, practise, retest loop on each sound step.
3. Dimension 5 (adopt): the finger-slide "read it the fast way" step for the sight words, with a timed check for each sight word.
4. Dimension 11 (adopt): a fixed question set for each read-along, with picture answers and a Thai prompt.
5. Dimension 9 (change): a fixed daily recall of 5 items in each lesson. The FSRS spacing stays a later change and is out of this track.

The track has four phases: the schema and the checks, the teacher book template and print, the content of weeks 1 to 8, and the report and release. The student workbook, the readers, and the covers do not change.

## Owner approval

Daniel approved the track with the word "Ok" on 2026-11-02 at 15:50 ICT. The word is his reply to the PM note `dUNHVjdnbEZKbmpvMFYwRw` in Google Tasks item `VHgtTW5teDhwSkhTMEVPRw`. The PM session relayed it at about 15:5x ICT. Evidence class: owner-approved (PM relay).

The PM note gave Daniel this plan:

- A new track after the Pictures work, in 4 phases.
- The day stays 30 minutes.
- The student book, the readers, and the covers stay unchanged.
- The Thai teacher book grows, and its printer quote changes.
- Daniel checks the English and the Thai of w01 to w08 by 2026-11-16, for the print order of 2026-11-25. The drafts are due 2026-11-09.
- Default: the week 1 proof of 2026-11-05 keeps the approved text. The loops enter the teacher book at the release proof of 2026-11-20.

## Dates

| Date | Event |
|---|---|
| 2026-11-03 | Track start |
| 2026-11-05 | Phase 1 done. The week 1 proof of the print track keeps the approved text |
| 2026-11-07 | Phase 2 done |
| 2026-11-09 | Phase 3 drafts of w01 to w08 done, checks clean |
| 2026-11-16 | Daniel's English and Thai check of w01 to w08 done |
| 2026-11-20 | Release proof (print track Phase 9). The loops enter the teacher book |
| 2026-11-25 | Print order |

## Sources

Other repositories are read-only for this track.

- Research file: `advantage-pr/06-research-and-evidence/storytime-vs-100-easy-lessons-2026-11.md`, dimensions 2, 5, 8, 9, and 11, and the sections "Adopt" and "Change".
- Workbooks code: `dashboard/lib/storytime/schema.ts` (`StepSchema`, `NoteSchema`, `ScriptSchema`, `BookSchema`, `StorytimeApprovalsSchema`, the script ids `A` to `E`), `lib/storytime/checks.ts` (`checkStorytimeWeek`), `scripts/storytime/check-weeks.ts`, `lib/storytime/manual.ts` (`renderStorytimeWeek`, `compileStorytimeManual`, `StorytimeManualOptions`), `lib/storytime/i18n.ts` (`StorytimeLabels`), `lib/storytime/phonemes.ts` (`phonemeAudioFields`), `scripts/storytime/make-manual-pdf.ts`, `scripts/storytime/make-teacher-book-print.ts`.
- Workbooks data: `content/storytime/l2/w01.json` to `w08.json`.
- Tests that cover these files: `__tests__/storytime-week.test.ts`, `storytime-manual.test.ts`, `storytime-phonemes.test.ts`, `storytime-print-teacher-book.test.ts`, and the other `storytime-*.test.ts` files.

## Terms

- **Teach week**: a week file with `meta.kind` equal to `teach` (w01 to w07).
- **Review week**: a week file with `meta.kind` equal to `review` (w08).
- **Sound step**: the steps A1 (Hear it), A2 (See it), and A3 (Form it) of script A.
- **Loop step**: a step that holds a routine: A1, A2, A3, A4, A6, C5, D2.
- **Donor step**: a step that gives minutes to the loops: A4, A6, D2, C5, and the opening.
- **Baseline**: the week files at commit `cc7808c541ca1cac810a7cd74f34520f748aef5b`.

## Functional Requirements

### FR-1: The schema carries the five routines

`schema.ts` gets new optional fields. The fields are optional in the schema, so that every shipped week still parses. The checks of FR-8 require them.

- `StepSchema.blendDrill`: `{ words, model, lead, test, repeats, correction }`. `words` holds 3 to 5 entries `{ word, sounds, audio? }`. `sounds` holds 2 to 4 sound labels in the form of `bankSound` (`/n/`). `model`, `lead`, `test`, and `correction` are `BiText`. `repeats` is an integer from 2 to 5.
- `StepSchema.soundLoop`: `{ correct, practise, retest }`, three `BiText` lines.
- `StepSchema.sightWords`: `{ words, slide, check, seconds }`. `words` holds 1 to 3 words. `slide` and `check` are `BiText`. `seconds` is an integer from 2 to 5: the time that the child has for one word.
- `StepSchema.loopMinutes`: an integer from 0 to 20. It is the step minutes when the loops print (FR-7).
- `BookSchema.questions`: an array of 3 entries `{ kind, ask, answer }`. `kind` is `who`, `what`, or `where`. `ask` is a `BiText` (the Thai prompt is `ask.th`). `answer` is `{ page, word }`: the 1-based reader page and the picture word on it.
- `ScriptSchema.recall`: `{ items, ask }`. `items` holds the cards of the existing `StripCardSchema` (`kind`, `text`, `week`, `audio?`). `ask` is a `BiText`.
- `StorytimeApprovalsSchema.loops`: the same shape as an app part (`StorytimeAppApprovalSchema`), default draft. It is not one of the six `STORYTIME_APPROVAL_PARTS`. The `published` check and its message do not change.

Acceptance criteria:

- All shipped weeks `w01.json` to `w08.json` parse unchanged.
- A week with each new field set to a valid value parses. A week with an invalid value (4 or 6 words, `repeats` 1 or 6, a fourth question, a question kind twice) does not parse.
- The six app approval parts and the `published` check message of st2/1 stay as they are at the baseline.

### FR-2: The oral blend drill (dimension 2)

Each teach week has a `blendDrill` on step A4 (Blend it). The drill has 3 to 5 words that use only the sounds taught to the week (`taughtTo`). The teacher models the word, leads the class, and then tests the class. The class repeats the word `repeats` times. The `correction` line tells the teacher what to say when a child errs. The drill sounds come from Daniel's phoneme bank (S22): each sound has a model clip.

Acceptance criteria:

- A teach week without `blendDrill` on A4 fails the check `loops-blend`. A drill word with a sound that the week has not taught fails the check.
- Each drill sound has a recording in the bank. `phonemeAudioFields` includes the drill sounds, so the existing check `phoneme-audio` covers them.
- The model, lead, test, and correction lines each have English and Thai.

### FR-3: The correct, practise, retest loop (dimension 8)

Each sound step (A1, A2, A3) of each teach week has a `soundLoop`. The loop has three lines: the teacher corrects the sound by modelling it again, the class practises it, and the teacher retests the item.

Acceptance criteria:

- A teach week with a sound step without `soundLoop` fails the check `loops-sound`.
- The three lines of each loop have English and Thai.
- The `correct` line models the sound again. It does not only name the error (the L2 point of dimension 8).

### FR-4: The fast-way sight-word step (dimension 5)

Each teach week with tricky words has `sightWords` on step A6 (New tricky words) and on step D2 (Tricky words). `sightWords.words` equals `focus.trickyWords`, in the same order. The `slide` line tells the teacher to slide a finger under the word and to say "read it the fast way". The `check` line is the timed check: each word has `seconds` seconds.

Acceptance criteria:

- A week with tricky words and no `sightWords` on A6 or D2 fails the check `loops-sight`.
- A `sightWords.words` list that differs from `focus.trickyWords` fails the check.
- A week without tricky words has no `sightWords`.

### FR-5: The read-along question set (dimension 11)

Each read-along book of each teach week has `questions`: exactly 3, one each of `who`, `what`, and `where`, in that order. The child answers by pointing at the picture of the reader page `answer.page`. The Thai prompt `ask.th` helps the teacher to ask a beginner. The teacher asks the questions in step C5 (Comprehension) on day 3.

Acceptance criteria:

- A read-along without 3 questions in the order `who`, `what`, `where` fails the check `loops-questions`.
- `answer.page` is a page of the book, and `answer.word` is in the text of that page.
- The question set is not in the student book, the readers, or the cover code.

### FR-6: The daily recall (dimension 9)

Each script of each teach week and of the review week has a `recall` of exactly 5 items. The items are existing cards (`sound`, `tricky`, `frame`, `word`) of this week or of an earlier week. The recall sits in the opening of the day. The opening minutes do not change. The FSRS spacing is out of scope.

Acceptance criteria:

- A script without 5 recall items fails the check `loops-recall`. Exception: day 1 of week 1 (see Defaults, D6).
- Each item has `week` less than or equal to the week of the file, and the item text is in the taught set of that week (`taughtTo`).
- No recall item repeats inside one day.

### FR-7: The day stays 30 minutes

The loops add no minutes. The loops take time from the donor steps. `loopMinutes` holds the new minutes of a step. A step without `loopMinutes` keeps `minutes`.

Acceptance criteria:

- The check `loops-minutes` passes when, for each day, `openingMinutes` plus the sum of `loopMinutes ?? minutes` of the steps that are not `moved` equals `meta.periodMinutes`, and `periodMinutes` is 30.
- Only the loop steps A1, A2, A3, A4, A6, C5, and D2 have a `loopMinutes` that differs from `minutes`. Every loop step has at least 2 minutes.
- The existing check `minutes` stays and still passes on `minutes`.

### FR-8: The checks

`checkStorytimeWeek` gets the checks `loops-blend`, `loops-sound`, `loops-sight`, `loops-questions`, `loops-recall`, and `loops-minutes`. `check-weeks.ts --level 2` reports them. Until the end of Phase 3, the checks have the status `warn`, so that the shipped weeks do not fail the gate. At the end of Phase 3 the status becomes `fail` (one constant, `LOOP_CHECK_STATUS`).

The checks apply to weeks of Levels 2 to 4 (the script ids `A` to `E`). A Level 1 week (script ids `L`, `M`, `S`, `V`, `P`) skips them.

Acceptance criteria:

- Each check has a mutation test on a copy of a shipped week in a temporary folder (rule 11.1): removing a routine, or breaking a rule, makes the check report.
- After Phase 3, `check-weeks.ts --level 2` shows no loop check with `warn` or `fail`. Its only FAIL stays the accepted `published` row of st2/1.

### FR-9: The teacher manual and the Thai teacher book print

`manual.ts` prints the routines when `StorytimeManualOptions.loops` is true. The option is false by default. The English and the Thai manual both print them (the Thai book prints the Thai line, and the gloss under each English line). `make-manual-pdf.ts` and `make-teacher-book-print.ts` get a `--loops` flag.

Acceptance criteria:

- With the option off, the HTML of week 1 is byte-equal to the baseline HTML. This keeps the proof of 2026-11-05 unchanged.
- With the option on, each routine prints in its step, in the order of FR-2 to FR-6. The questions print in step C5. The recall prints in the opening of the day. The step minutes use `loopMinutes ?? minutes`.
- The Thai teacher book of week 1 with the loops is A4, black only, and passes `PRINT_GATE`. Phase 2 and Phase 3 record the page count. The week 1 file has 23 A4 pages now (`Storytime-Advantage-L2-U1-Teachers-Book-TH-v2`).

### FR-10: The content of weeks 1 to 8

`w01.json` to `w08.json` get the routines in English and Thai. The change is additive: every existing line stays byte-equal to the baseline. Each new English line has a Thai gloss, under the same rules as the existing `th` notes. One independent review reads each week. Daniel checks the English and the Thai.

Acceptance criteria:

- All six loop checks pass on each teach week. The review week w08 passes `loops-recall` and `loops-minutes`.
- With the new fields removed, each week file is byte-equal to its baseline file. The test compares a hash of the baseline.
- The English of the new lines has a text profile that fits a Level 2 teacher script: sentences of 12 words or less in the lines that the class repeats.
- Each week has one independent review report with no open error.

### FR-11: The approval, the release, and the pin

The routines are draft until Daniel approves them. Daniel's check of the English and the Thai gives `approval.loops` the value approved. The app shows the routines only when `approval.loops` is approved. The new Monorepo pin needs a new Workbooks commit, and the PM session sends it.

Acceptance criteria:

- All eight weeks have `approval.loops` draft until Daniel says that the check passed. The record has his words and the date.
- After his approval, the PM session gets the new pin commit and the facts-changed list.
- The Monorepo pin of 2026-11-02 is Workbooks `ccf3d95c92bb5b3970722946dffbed1de57f9df6`. This track does not move it.

### FR-12: The hand-offs

The orchestrator sends three messages to the PM session: the field names after Phase 1 (for the Storytime app in Monorepo), the new page count and the printer-quote note after Phase 3, and the report with the facts-changed list at the end.

Acceptance criteria:

- Each message has a PM confirmation of receipt (peer-report).

### FR-13: Code that this track does not change

The track does not change the student book, the readers, or the covers. The track does not touch `video/**`.

Acceptance criteria:

- `git diff --name-only <phase base>..HEAD` shows no change in `lib/storytime/print/student-book.ts`, `readers.ts`, `picture-check.ts`, `pictures.ts`, `covers.ts`, and no change in `video/**`.

## Defaults

The owner decisions are above. Where a detail was open, the author chose the default below. Daniel or the orchestrator can change a default before Red of the phase that uses it.

- D1: The five routines have the shapes of FR-1. The field names are the Phase 1 names that go to the PM session.
- D2: The sound steps are A1, A2, and A3. The other steps of days 2 to 5 get no sound loop.
- D3: The blend drill sits on step A4 of each teach week. The drill has 5 words at most and 3 repetitions by default (`repeats` 3). Week 1 blends by ear only, as today: its drill words use sounds and no letters.
- D4: The timed check of a sight word is 3 seconds for each word (`seconds` 3). A6 introduces the words. D2 repeats the check.
- D5: Each read-along has the three questions `who`, `what`, and `where`. Children answer by pointing at the reader pictures. The teacher asks them in C5. The answer needs no new picture.
- D6: The recall uses the existing cards. The recall has 5 items each day. Day 1 of week 1 is the exception: the child has learned no card before that day, so that script has no recall. Question for Daniel: should the day 1 recall of week 1 use five oral-base items instead?
- D7: The recall sits in the opening. The opening stays 6 minutes. The data has no minutes for the opening items, so the check does not count them.
- D8: The loops take minutes from the donor steps. The orchestrator and the author set the `loopMinutes` of each week inside FR-7. A loop step has at least 2 minutes.
- D9: The loops print only with the manual option `loops` (the flag `--loops`). The default is off. This keeps the 2026-11-05 proof byte-equal to the approved text. The print track Phase 9 builds the release proof with `--loops` after Daniel's approval.
- D10: The change to the week files is additive. No existing English or Thai line changes. `minutes` does not change. `loopMinutes` carries the new minutes.
- D11: The review week w08 gets the recall (5 items each day) and `loopMinutes` only if its day sum changes. It gets no blend drill, sound loop, sight words, or questions, because the review week has no read-along and no new sound.
- D12: The loop checks have the status `warn` from Phase 1 to Phase 3, and `fail` after the Phase 3 switch task.
- D13: The schema `version` stays 1. The new week text needs no new `version` value. Each week gets a new pin through the PM session after Daniel's approval.
- D14: The independent review of each week uses a model other than the author model. The orchestrator picks the model.
- D15: The page count of Phase 2 is an estimate from a copy of w01 with sample routines in a temporary folder. The real count comes after the Phase 3 content (plan task "measure the real page count").

## Ownership and overlap

- The track `storytime_week_package_20261022` (open) created `schema.ts`, `checks.ts`, and `manual.ts`. Its open tasks do not touch the schema. This track changes these files through its own Red and Green tasks. The orchestrator runs no task of the two tracks at the same time on one file.
- The track `storytime_print_r1_20261025` owns the teacher book print file and the release proof. Its Phase 3 made `make-teacher-book-print.ts`. Its Phase 9 builds the release proof. This track changes the teacher book template and adds the `--loops` flag. The print track rebuilds the teacher book with `--loops` in its Phase 9. This track must not change `lib/storytime/print/student-book.ts`, `readers.ts`, `picture-check.ts`, `pictures.ts`, or `covers.ts`.
- The track `storytime_song_video_20261022` and all `video/**` files stay untouched.
- The Monorepo pin of 2026-11-02 is Workbooks `ccf3d95c92bb5b3970722946dffbed1de57f9df6`. The new week versions need a new pin through the PM session.
- Uncommitted files of other sessions stay unstaged: `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, and the files under `measure/runs/`.

## Interface for the Storytime app (Monorepo)

The Storytime app in Monorepo reads the week files. The field names come from Phase 1 and go to the PM session after the Phase 1 commit (FR-12). The app must show the routines only when `approval.loops` is approved. The app must show:

1. On each read-along, after the last page, the fixed question set (`books[].questions`) with picture answers (`answer.page`, `answer.word`) and the Thai prompt (`ask.th`).
2. The daily recall items (`scripts[].recall.items`): 5 cards with audio (`audio` of each card).
3. The fast-way sight-word card with the timed check (`steps[].sightWords`: `words`, `slide`, `check`, `seconds`).
4. The model sound clips of the blend drill (`steps[].blendDrill.words[].audio`).
5. The new routines in any teacher view of the scripts (`blendDrill`, `soundLoop`, `sightWords`, `loopMinutes`).

## Non-Functional Requirements

- Every new English line has a Thai gloss and needs Daniel's Thai check.
- The English lines follow the existing rules of the week text: the sounds are pure sounds and not letter names, and a sentence that the class repeats is short.
- New code has JSDoc on each exported function. The code follows the style of the files that it changes.
- The repository is public. No test item, test paper, answer key, or test audio goes into this track.

## Out of scope

- FSRS spacing and any adaptive review queue (a later change).
- The student workbook, the readers, and the covers.
- Level 1, Level 3, and Level 4 week text.
- The week 1 proof of 2026-11-05. It keeps the approved text.
- New pictures, new audio recordings, and new songs.
- Any change to the Monorepo app code. This track gives the field names and the interface only.
