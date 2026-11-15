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

Amendment 1 (2026-11-07) adds Phase 3b: the parent-share moment of each day (FR-14). Each day gets one photo or video moment that shows a child who uses English, with a caption in English and Thai. The moment adds 0 minutes. The student book v15 does not change.

## Owner approval

Daniel approved the track with the word "Ok" on 2026-11-02 at 15:50 ICT. The word is his reply to the PM note `dUNHVjdnbEZKbmpvMFYwRw` in Google Tasks item `VHgtTW5teDhwSkhTMEVPRw`. The PM session relayed it at about 15:5x ICT. Evidence class: owner-approved (PM relay).

The PM note gave Daniel this plan:

- A new track after the Pictures work, in 4 phases.
- The day stays 30 minutes.
- The student book, the readers, and the covers stay unchanged.
- The Thai teacher book grows, and its printer quote changes.
- Daniel checks the English and the Thai of w01 to w08 by 2026-11-16, for the print order of 2026-11-25. The drafts are due 2026-11-09.
- Default: the week 1 proof of 2026-11-05 keeps the approved text. The loops enter the teacher book at the release proof of 2026-11-20.

### Owner request: parent-share moments (Amendment 1)

Daniel asked for the parent-share moments on 2026-11-06. The PM session relayed his words. Source: advantage-pr `measure/pm-log.md`, lines 2162, 2163, and 2167 (read-only). Evidence class: owner request (PM relay).

- 2026-11-06 11:35 ICT (line 2162), Daniel: "Parent communication (posting children's accomplishments to Facebook or line group) is very important. We need to include at least one "PR" element into each lesson period"
- 2026-11-06 11:55 ICT (line 2163), Daniel, on the first default list (a book-map sticker on day 3): "Putting stickers in a book is your idea of parental engagement?"
- 2026-11-06 13:11 ICT (line 2167), Daniel: "So what replaces the sticker moments?"

The PM session then corrected the list (lines 2163 and 2167). Each moment shows the child using English. The corrected list is the moment table of FR-14. The sticker step C7 stays in the lesson as a class reward, and it is not a share moment.

The order of done (line 2162 and the session brief of 2026-11-07, which calls it Daniel's order): the field and its tests, the teacher book build, and the caption list in the 11-16 folder.

## Dates

| Date | Event |
|---|---|
| 2026-11-03 | Track start |
| 2026-11-05 | Phase 1 done. The week 1 proof of the print track keeps the approved text |
| 2026-11-07 | Phase 2 done |
| 2026-11-07 | Phase 3b start (Amendment 1, FR-14) |
| 2026-11-09 | Phase 3 drafts of w01 to w08 done, checks clean |
| 2026-11-13 | Phase 3b: the share field and its tests, the teacher book build, and the caption list done |
| 2026-11-16 | Daniel's English and Thai check of w01 to w08 done |
| 2026-11-16 | Daniel's check of the Thai share captions (Phase 3b) |
| 2026-11-20 | Release proof (print track Phase 9). The loops enter the teacher book |
| 2026-11-25 | Print order |

## Sources

Other repositories are read-only for this track.

- Research file: `advantage-pr/06-research-and-evidence/storytime-vs-100-easy-lessons-2026-11.md`, dimensions 2, 5, 8, 9, and 11, and the sections "Adopt" and "Change".
- Workbooks code: `dashboard/lib/storytime/schema.ts` (`StepSchema`, `NoteSchema`, `ScriptSchema`, `BookSchema`, `StorytimeApprovalsSchema`, the script ids `A` to `E`), `lib/storytime/checks.ts` (`checkStorytimeWeek`), `scripts/storytime/check-weeks.ts`, `lib/storytime/manual.ts` (`renderStorytimeWeek`, `compileStorytimeManual`, `StorytimeManualOptions`), `lib/storytime/i18n.ts` (`StorytimeLabels`), `lib/storytime/phonemes.ts` (`phonemeAudioFields`), `scripts/storytime/make-manual-pdf.ts`, `scripts/storytime/make-teacher-book-print.ts`.
- Workbooks data: `content/storytime/l2/w01.json` to `w08.json`.
- Tests that cover these files: `__tests__/storytime-week.test.ts`, `storytime-manual.test.ts`, `storytime-phonemes.test.ts`, `storytime-print-teacher-book.test.ts`, and the other `storytime-*.test.ts` files.
- Amendment 1 sources: advantage-pr `measure/pm-log.md` lines 2162, 2163, and 2167 (Daniel's words and the corrected moment list). Workbooks: `lib/storytime/print/student-book.ts` (`compileStorytimeStudentBook`, for the guard of AC-14.7 only; no change), `__tests__/storytime-loops-content.test.ts` (the Phase 3 additive compare), `__tests__/fixtures/storytime-week-fixture.ts`, and `measure/tracks/storytime_teaching_loops_20261103/look-points-11-16.md` (the 11-16 sitting).
- Monorepo, read-only, at HEAD `db3fc23d8` on 2026-11-07: `apps/storytime/scripts/receive-weeks.ts`, `apps/storytime/lib/contracts/week.ts`, `apps/storytime/__tests__/phase3-media-coverage.test.ts`, and `apps/primary-advantage/lib/storytime/week.ts`.

## Terms

- **Teach week**: a week file with `meta.kind` equal to `teach` (w01 to w07).
- **Review week**: a week file with `meta.kind` equal to `review` (w08).
- **Sound step**: the steps A1 (Hear it), A2 (See it), and A3 (Form it) of script A.
- **Loop step**: a step that holds a routine: A1, A2, A3, A4, A6, C5, D2.
- **Donor step**: a step that gives minutes to the loops. The donors that give minutes are A4 and A6 on day 1. The opening is a host for the recall and gives no minutes (D7).
- **The text of a day**: the English text of the steps of that day's script (the `en` fields of each step, as FR-6 lists). The prep lines, the Thai lines, and the reader page text do not count.
- **Baseline**: the week files at commit `cc7808c541ca1cac810a7cd74f34520f748aef5b`.
- **Share moment**: the parent-share moment of one day (FR-14): one or two shots and one caption.
- **Shot**: one photo or one video at one step.
- **The period of a day**: the steps that run in the lesson of that day. These are the steps of the day's script without `moved`, and the steps with `moved: 'next-opening'` of the script of the day before. The moved steps run in the opening of the day. A moved step of the day's own script runs on the next day.
- **Assessment step**: step E5 (Check) of a teach week, and step A1 (Benchmark: paper part) of a review week.

## Functional Requirements

### FR-1: The schema carries the five routines

`schema.ts` gets new optional fields. The fields are optional in the schema, so that every shipped week still parses. The checks of FR-8 require them.

- `StepSchema.blendDrill`: `{ words, model, lead, test, repeats, correction }`. `words` holds 3 to 5 entries `{ word, sounds, audio? }`. `sounds` holds 2 to 4 sound labels in the form of `bankSound` (`/n/`). `model`, `lead`, `test`, and `correction` are `BiText`. `repeats` is an integer from 2 to 5.
- `StepSchema.soundLoop`: `{ correct, practise, retest }`, three `BiText` lines.
- `StepSchema.sightWords`: `{ words, slide, check, seconds }`. `words` holds 1 to 3 words. `slide` and `check` are `BiText`. `seconds` is an integer from 2 to 5: the time that the child has for one word.
- `StepSchema.loopMinutes`: an integer from 0 to 20. It is the step minutes when the loops print (FR-7).
- `BookSchema.questions`: an array of 3 entries `{ kind, ask, answer }`. `kind` is `who`, `what`, or `where`. `ask` is a `BiText` (the Thai prompt is `ask.th`). `answer` is `{ page, word }`: the 1-based reader page and the picture word on it.
- `ScriptSchema.recall`: `{ items, ask }`. `items` holds the cards of the existing `StripCardSchema` (`kind`, `text`, `week`, `audio?`). `ask` is a `BiText`.
- `StorytimeApprovalsSchema.loops`: the shape of an app part (`StorytimeAppApprovalSchema`) with a refine, default draft. The refine is named `StorytimeLoopsApprovalSchema`. It works like the refine of the `print` part: an approved `loops` part needs `words` and `date`. A draft `loops` part needs neither. The part is not one of the six `STORYTIME_APPROVAL_PARTS`.
- The `published` check in `checks.ts` skips the `loops` part, as it skips the `print` part. This one exclusion is the only code change to the `published` check. The message of st2/1 does not change.

Acceptance criteria:

- All shipped weeks `w01.json` to `w08.json` parse unchanged.
- A week with each new field set to a valid value parses. A week with an invalid value (4 or 6 words, `repeats` 1 or 6, a fourth question, a question kind twice) does not parse.
- The six app approval parts stay as they are at the baseline.
- The `published` detail of st2/1 stays `images not approved; audio not approved; song not approved`. A week with a draft `loops` part gives the same `published` detail as the baseline.
- An approved `loops` part without `words` does not parse. An approved `loops` part without `date` does not parse. An approved `loops` part with both parses. A draft `loops` part without both parses.

### FR-2: The oral blend drill (dimension 2)

Each teach week has a `blendDrill` on step A4 (Blend it). The drill has 3 to 5 words. A drill sound is allowed in two cases. Case one: `bankSound(sound)` equals `bankSound` of a grapheme in `taughtTo.graphemes`. Case two: it equals `bankSound` of a sound label that the same week names in its `opening.pa` lines. The check reads the `sounds` labels, not the `word`. The reason: the drill is oral, and strict taught graphemes leave w01 and w02 with fewer than 3 words. The teacher models the word, leads the class, and then tests the class. The class repeats the word `repeats` times. The `correction` line tells the teacher what to say when a child errs. The drill sounds come from Daniel's phoneme bank (S22): each sound has a model clip.

Acceptance criteria:

- A teach week without `blendDrill` on A4 fails the check `loops-blend`. A drill word with a sound that the rule above does not allow fails the check.
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

The taught set depends on the kind of the card:

- A `sound` card (a grapheme) is in `taughtTo` of the week file. A `tricky` card (a tricky word) is in `taughtTo` of the week file. `taughtTo` counts the weeks to date, so it holds the earlier weeks.
- A `frame` card is the `focus.frame` of the current week or of an earlier week.
- A `word` card appears in the text of an earlier day of the same week, or in the text of an earlier week.

"The text of a day" is the English text of the steps of that day's script. These are the English fields of each step: `title.en`, `en.teacherActions`, `en.teacherLanguage`, `en.studentActions`, `en.watchFor`, `easier.en`, `harder.en`, and `group.en`. The prep lines (`prep`), the Thai lines (`th`), the `materials` list, and the reader page text (`BookPageSchema.text`) do not count. A word that appears only on a reader page does not pass.

Acceptance criteria:

- A script without 5 recall items fails the check `loops-recall`. Exception: day 1 of week 1 (see Defaults, D6).
- Each item has `week` less than or equal to the week of the file, and the item text is in the taught set of its kind (the list above).
- A `sound` or `tricky` item outside `taughtTo`, a `frame` item that is not a `focus.frame` to date, and a `word` item that no earlier day or week shows: each fails the check.
- No recall item repeats inside one day.

### FR-7: The day stays 30 minutes

The loops add no minutes. The loops take time from the donor steps. `loopMinutes` holds the new minutes of a step. A step without `loopMinutes` keeps `minutes`. C5 and D2 are the only loop steps of their days, so their `loopMinutes` equals `minutes`. The questions and the sight-word step fit inside the existing step time.

Acceptance criteria:

- The check `loops-minutes` passes when, for each day, `openingMinutes` plus the sum of `loopMinutes ?? minutes` of the steps that are not `moved` equals `meta.periodMinutes` of the week. The check does not use a fixed 30. A Level 2 week has `periodMinutes` 30, and a Level 3 or Level 4 week has 49.
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
- With the new fields removed, each week file equals its baseline file. The test parses both files, deletes the FR-1 fields, and compares the normalized `JSON.stringify` output of both sides. It does not compare the raw file hash.
- The English of the new lines has a text profile that fits a Level 2 teacher script: sentences of 12 words or less in the lines that the class repeats.
- Each week has one independent review report with no open error.

### FR-11: The approval, the release, and the pin

The routines are draft until Daniel approves them. Daniel's check of the English and the Thai gives `approval.loops` the value approved. The refine `StorytimeLoopsApprovalSchema` (FR-1) refuses an approved part without `words` and `date`. The app shows the routines only when `approval.loops` is approved. The new Monorepo pin needs a new Workbooks commit, and the PM session sends it.

Acceptance criteria:

- All eight weeks have `approval.loops` draft until Daniel says that the check passed. The record has his words and the date. The refine `StorytimeLoopsApprovalSchema` enforces both fields on an approved part.
- After his approval, the PM session gets the new pin commit and the facts-changed list.
- The Monorepo pin of 2026-11-02 is Workbooks `ccf3d95c92bb5b3970722946dffbed1de57f9df6`. This track does not move it.

### FR-12: The hand-offs

The orchestrator sends five messages to the PM session: the field names after Phase 1 (Hand-off 1, for the Storytime app in Monorepo), the page-count note (the estimate after Phase 2, then the real count with the printer-quote note after Phase 3), the new pin request (Hand-off 2), the `--loops` notice for the print track Phase 9 (Hand-off 3), and the report with the facts-changed list at the end.

Acceptance criteria:

- Each message has a PM confirmation of receipt (peer-report).

### FR-13: Code that this track does not change

The track does not change the student book, the readers, or the covers. The track does not touch `video/**`.

Acceptance criteria:

- For each commit SHA that the plan records for this track, `git show --name-only --format= <sha>` lists none of `lib/storytime/print/student-book.ts`, `readers.ts`, `picture-check.ts`, `pictures.ts`, and `covers.ts`. It also lists nothing under `video/`.
- The check reads one commit at a time. A range diff is not the proof, because the print track edits these files in the same checkout.

### FR-14: The parent-share moment of each day (Phase 3b, Amendment 1)

Each day of each Level 2 week has one parent-share moment. At the moment, the teacher takes a photo or a video of a child who uses English. The teacher posts it with the caption in the closed class parent group. Daniel asked for the moment on 2026-11-06 (section "Owner request: parent-share moments"). The moment adds 0 minutes, so the day stays at `meta.periodMinutes` (FR-7).

**The moments.** Each moment shows the child using English. The table is the corrected list of the PM log, lines 2163 and 2167.

| Week | Day | Script | Shots (step, media) | What the shot shows |
|---|---|---|---|---|
| w01 to w07 | 1 | A | A3 (Form it), video | The child says the sound of the week, says a word with the sound, and writes the letter. |
| w01 to w07 | 2 | B | B5 (Frame practice), video | The child acts the story and says the frame sentence of the week (D16). |
| w01 to w07 | 3 | C | C4 (read together), video | One child reads one page of the C4 book aloud, 10 to 20 seconds. The C4 book is the first-sound book in w01 and the decodable in w02 to w07. |
| w01 to w07 | 4 | D | D4 (Write it), photo; D5 (Share), video | The photo shows the child's own written sentence. The video shows the child who reads the sentence to the class (D18). |
| w01 to w07 | 5 | E | D6 (Sing it: song show), video | The song show. D6 is a moved step of day 4, and it runs in the opening of day 5. |
| w08 | 1 | A | A2 (Centers), video | The benchmark day: a child reads one page of a unit 1 book aloud at the decodables center (D17). |
| w08 | 2 to 4 | B, C, D | B1, C1, D1 (Centers, rotation 1), video | A child reads one page of a unit 1 book aloud at the decodables center (D17). |
| w08 | 5 | E | E3 (Song show and unit sticker), video | The song show. |

The sticker step C7 stays in the lesson as a class reward (3 minutes). C7 is not a share moment. The week 8 moment of day 5 is the song show of E3, not the unit sticker.

**The field.** `schema.ts` gets one new optional field on the script, with two strict objects:

- `ScriptSchema.share`: a `ShareSchema`, optional in the schema. The check `share-moment` requires it.
- `ShareSchema`: `{ shots, caption }`, `.strict()`.
- `shots`: an array of 1 or 2 `ShareShotSchema` entries.
- `ShareShotSchema`: `{ step, media }`, `.strict()`. `step` is a string in the step id form `^[A-Z]\d{1,2}$` (as `StepSchema.id`). `media` is `'photo'` or `'video'`.
- `caption`: a `BiText`. `caption.en` is the English text of the post. `caption.th` is the Thai text of the post.
- The type goes out through the existing `StorytimeScript`. Each new field has JSDoc.

The field holds no minutes, no file path, and no name of a child. The strict objects refuse an extra key, for example `minutes`.

**The check.** `checkStorytimeWeek` gets the check `share-moment`, and `check-weeks.ts --level 2` reports it. A problem has the status of the exported constant `SHARE_CHECK_STATUS`. The status is `'warn'` from the Green task to the switch task, and `'fail'` after the switch task (the pattern of `LOOP_CHECK_STATUS`, FR-8). The check applies to the weeks of Levels 2 to 4 (the script ids `A` to `E`): teach weeks and review weeks. A Level 1 week skips it. The check needs no taught set and no other week, so it has no skipped part. The check runs before the `published` block, so a `fail` also blocks a published week.

The check reports one problem line for each broken rule:

1. Each script has `share`.
2. Each shot `step` names a step of the same script, or a step with `moved: 'next-opening'` of the script of the day before.
3. At least one shot of the day names a step in the period of the day (see Terms).
4. The two shots of one day name two different steps.
5. No shot names an assessment step (see Terms). A photo or a video of a check shows the check items and a child under test.
6. `caption.en` has 1 to 40 words. The word count: trim `caption.en`, split it on runs of white space (`/\s+/`), and count the non-empty parts. `caption.th` is not empty after trim. The check does not test the Thai text in other ways (Q9 of the plan).
7. No caption string ends in a media file extension. The pattern is the Monorepo `MEDIA_EXTENSION`: `\.(mp3|wav|m4a|aac|ogg|opus|mp4|m4v|webm|mov|jpg|jpeg|png|webp|gif|svg|pdf)$`, case-insensitive (see "Interface for the Storytime app").

**The teacher book.** `manual.ts` prints the share moments when `StorytimeManualOptions.share` is true. The option is false by default (D21). `make-manual-pdf.ts` and `make-teacher-book-print.ts` get a `--share` flag. At the step of each shot, the step block prints:

- one icon: an inline SVG camera for a photo, or an inline SVG video camera for a video, in black only (D22). The icon element has the attribute `data-share-media` with the value of `media`.
- the label of the media (`StorytimeLabels.sharePhoto` or `shareVideo`) in the language of the book.
- the caption. The Thai book prints `caption.th` and, under it, `caption.en`, because the post holds both. The English manual prints `caption.en`.

The consent line (`StorytimeLabels.shareConsent`) and the length line (`shareLength`) print once in each week part, at the first shot of day 1 (D20).

**The caption list.** The file `measure/tracks/storytime_teaching_loops_20261103/share-captions-11-16.md` (D24) holds the captions for Daniel's sitting of 2026-11-16. It is ready by 2026-11-13. Its form:

- A header with the source commit of the week files, the date, and the line "Answer OK for all rows, or name a row by its id and the change."
- Table 1, one row for each day of w01 to w08 (40 rows): `| SC-w0N-dD | Week | Day | Shots (step, media) | English caption | Thai caption (draft) |`.
- Table 2, one row for each new label of `StorytimeLabels` (4 rows): `| SL-n | Key | English | Thai (draft) |`.
- The path of the teacher book build and the page numbers of the share icons, so that Daniel can see the captions in place.
- The last line: `Daniel's answer: ____ (date ____)`.
- Cell formats: the Week cell is the week number in decimal, the Day cell is 1 to 5, the `SL` row order is `sharePhoto`, `shareVideo`, `shareConsent`, `shareLength`, and `<rows>` in the last line of the cross-check counts the rows read.

**The caption cross-check.** The script `dashboard/scripts/storytime/check-share-captions.ts` compares the caption list with its sources. The teacher book Green task of Phase 3b writes it, and the teacher book Red task tests it first.

- Command: `cd dashboard && npx tsx scripts/storytime/check-share-captions.ts --level 2 --list ../measure/tracks/storytime_teaching_loops_20261103/share-captions-11-16.md`.
- Arguments: `--level <n>` (the level of the week files, read with `readLevelWeeks` of `lib/storytime/files.ts`) and `--list <path>` (the caption list). Both are required.
- Sources: the `share` of each script of the level, and the labels `sharePhoto`, `shareVideo`, `shareConsent`, and `shareLength` of `storytimeLabels('en')` and `storytimeLabels('th')` in `lib/storytime/i18n.ts`.
- Compare: each cell after trim, as exact text. An `SC-` row has the week, the day, the shots (each shot written as `<step> <media>`, two shots joined with `; `), `caption.en`, and `caption.th`. An `SL-` row has the key, the English, and the Thai of the label. A `|` inside a cell is written `\|` and is read back as `|`.
- Exit 0: the list has exactly one `SC-` row for each day of the level (40 for Level 2) and one `SL-` row for each of the 4 labels, and every cell equals its source.
- Exit 1: a row differs, a row is missing, a row is extra, or a row id repeats. The script prints one line for each problem, with the row id.
- Exit 2: a usage error: an unknown flag, a missing `--level` or `--list`, or a list file that does not exist.
- The last output line is `share captions: <rows> rows, <problems> problems`.

The Thai goes to Daniel only. No model and no other person checks the Thai captions or the Thai labels. The review roles get the English only.

Acceptance criteria:

- AC-14.1 (schema): All shipped weeks `w01.json` to `w08.json` parse. A copy with a valid `share` on each script parses. A copy with 0 shots or 3 shots, a `media` of `audio`, an unknown key in `share` or in a shot (for example `minutes`), or a `step` of `a3` does not parse. The key set of `share` is `caption` and `shots`. The key set of a shot is `media` and `step`.
- AC-14.2 (check): A share-complete copy of each shipped week, in a temporary folder, passes `share-moment`. Each data mutant below makes the check report a problem with the status `SHARE_CHECK_STATUS`: the share of one day removed; a shot step `A9` that the scripts do not have; a day 2 share with only `B6` (a moved step, so no shot in the period); two shots with the same step; a shot on E5 of a teach week; a shot on A1 of w08; an empty `caption.th`; a `caption.en` of 41 words; a caption that ends in `.mp4`.
- AC-14.3 (scope): A Level 1 week has no `share-moment` row. In the report, the `share-moment` row comes before the `published` row.
- AC-14.4 (0 minutes): For each shipped week, the rows `minutes` and `loops-minutes` have the same status and detail with and without the share fields.
- AC-14.5 (content): After the content task, each script of w01 to w08 has a `share`, and its shots equal the moment table above (step and media). With `share` removed from each script, each week equals its file at the baseline commit of the content Red task (the normalized `JSON.stringify` output, as FR-10). The Phase 3 compare of `storytime-loops-content.test.ts` also removes `share`, so it stays green.
- AC-14.6 (switch): After the switch task, `SHARE_CHECK_STATUS` is `'fail'`. `check-weeks.ts --level 2` shows `share-moment` `PASS` for st2/1 to st2/8 and no FAIL row.
- AC-14.7 (student book): `compileStorytimeStudentBook` of w01 to w08 with the share fields gives HTML that is byte-equal to the HTML with the share fields removed. FR-13 applies to each commit of Phase 3b.
- AC-14.8 (teacher book): With the option `share` off or absent, the HTML of each week with the share fields is byte-equal to the HTML of the same week with the share fields removed, with `loops` off and with `loops` on. With `share` on, the block of each shot step holds exactly one element with `data-share-media` equal to the shot media, and the caption text. A teach week has 6 icon elements, and w08 has 5. The consent line prints once in each week part. A caption with `<script>` prints escaped. Each new label has English and Thai in `StorytimeLabels`.
- AC-14.9 (build): The Thai teacher book of w01 to w08 with `--loops --share` is A4, black only, and passes `PRINT_GATE`. The build records the page count and the PDF SHA-256. The PM session gets the page count for the printer quote.
- AC-14.10 (caption list): The caption list has 40 `SC-` rows and 4 `SL-` rows. At the commit that the list header names, the command `cd dashboard && npx tsx scripts/storytime/check-share-captions.ts --level 2 --list ../measure/tracks/storytime_teaching_loops_20261103/share-captions-11-16.md` exits 0. A list with one changed cell, one missing row, or one extra row makes the command exit 1.
- AC-14.11 (Daniel): The plan records Daniel's answer on the Thai captions and labels, with his words and the date. Until then, his check task stays `[ ]`.

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

Defaults of Amendment 1 (FR-14). Daniel or the orchestrator can change a default before the Red task that uses it.

- D16: The day 2 shot is B5 (Frame practice). B6 (Act it) is a moved step: it runs in the opening of day 3 as a one-minute recall. A B6 shot leaves the day 2 period without a moment. In B5, the children say the frame sentence of the week with an action. Question for Daniel: B5 on day 2, or B6 in the opening of day 3?
- D17: Week 8, day 1 (the benchmark day) films the decodables center of A2. It does not film the paper part A1 or the check table. Daniel named no moment for days 2 to 4 of week 8. The default is the same reading aloud at the decodables center of rotation 1 (B1, C1, D1). Each day reads other unit 1 books, so the posts show the whole unit. Day 5 films the song show of E3.
- D18: The day 4 moment has two shots: the photo at D4 and the video at D5. D5 is a moved step, and it runs in the opening of day 5. The photo is in the day 4 period, so rule 3 of the check holds.
- D19: Each caption is for its week. It names the English of the moment: the sound and a word, the frame sentence, the book title, or the song title. A caption names no child. The teacher posts the caption with no change.
- D20: The consent line, English default: "Post only in the closed class parent group that the school runs. Show a face only when the school has the photo consent of the parents. Else show the work, the hands, or the backs." The length line, English default: "A video is 10 to 20 seconds. The song show video holds the whole song." Both lines print once in each week part, at the first shot of day 1. Their Thai lines are drafts for Daniel.
- D21: The teacher book prints the share moments only with the option `share` (the flag `--share`). The default is off. Every existing build (the proof of 2026-11-05, proof v15, and each `--loops` build) then stays byte-equal. The release proof of 2026-11-20 builds with `--loops --share` (plan Phase 4, Hand-off 3).
- D22: The icon is an inline SVG in black (`#000`) only, about 4 mm high, before the label. A camera shows a photo. A video camera shows a video.
- D23: Amendment 1 adds no approval part. Daniel's check of 2026-11-16 covers the Thai captions and the Thai labels. The Phase 4 record of `approval.loops` then covers the share moments. The app shows a share moment only when `approval.loops` is approved.
- D24: The caption list is in the track folder, next to `look-points-11-16.md`, because that folder holds the file of the 11-16 sitting. On 2026-11-07, no other folder for that sitting exists. The caption task adds the look point LP-28 to `look-points-11-16.md`. LP-28 points to the caption list.
- D25: The schema `version` stays 1 (as D13).
- D26: The content author writes the English and the Thai drafts of the captions. The Green author of the teacher book writes the English and the Thai drafts of the 4 labels. The independent review reads the English only. Daniel checks the Thai.
- D27: The check `share-moment` applies to Levels 2 to 4, as the loop checks do (FR-8). On 2026-11-07, the repository holds no Level 3 or Level 4 week, so no other level fails.
- D28: The teacher book build of Phase 3b goes to `~/Desktop/print-ready/storytime/share-check-v1/teacher-book/`. The caption list names this path for the 11-16 sitting.

## Ownership and overlap

- The track `storytime_week_package_20261022` (open) created `schema.ts`, `checks.ts`, and `manual.ts`. Its open tasks do not touch the schema. This track changes these files through its own Red and Green tasks. The orchestrator runs no task of the two tracks at the same time on one file.
- The track `storytime_print_r1_20261025` owns the teacher book print file and the release proof. Its Phase 3 made `make-teacher-book-print.ts`. Its Phase 9 builds the release proof. This track changes the teacher book template and adds the `--loops` flag. The print track rebuilds the teacher book with `--loops` in its Phase 9. The orchestrator runs no task of the two tracks at the same time on one file. This track edits `manual.ts`, `i18n.ts`, and `make-teacher-book-print.ts` in its Phase 2. Phase 2 Green waits until the print track commits its week 1 proof build of 2026-11-05. The Phase 9 release proof of the print track builds with `--loops`. This track must not change `lib/storytime/print/student-book.ts`, `readers.ts`, `picture-check.ts`, `pictures.ts`, or `covers.ts`.
- The track `storytime_song_video_20261022` and all `video/**` files stay untouched.
- The Monorepo pin of 2026-11-02 is Workbooks `ccf3d95c92bb5b3970722946dffbed1de57f9df6`. The new week versions need a new pin through the PM session.
- Uncommitted files of other sessions stay unstaged: `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, and the files under `measure/runs/`.
- Phase 3b (Amendment 1) edits `schema.ts`, `checks.ts`, `manual.ts`, `i18n.ts`, `make-manual-pdf.ts`, `make-teacher-book-print.ts`, the week files `w01.json` to `w08.json`, and the test files of this track. The rule above applies: the orchestrator runs no task of this track and of `storytime_print_r1_20261025` at the same time on one file. The content task and the teacher book Green start only when `git status --porcelain` of their files is empty.

## Interface for the Storytime app (Monorepo)

The Storytime app in Monorepo reads the week files. The field names come from Phase 1 and go to the PM session after the Phase 1 commit (FR-12). The app must show the routines only when `approval.loops` is approved. The app must show:

1. On each read-along, after the last page, the fixed question set (`books[].questions`) with picture answers (`answer.page`, `answer.word`) and the Thai prompt (`ask.th`).
2. The daily recall items (`scripts[].recall.items`): 5 cards with audio (`audio` of each card).
3. The fast-way sight-word card with the timed check (`steps[].sightWords`: `words`, `slide`, `check`, `seconds`).
4. The model sound clips of the blend drill (`steps[].blendDrill.words[].audio`).
5. The new routines in any teacher view of the scripts (`blendDrill`, `soundLoop`, `sightWords`, `loopMinutes`).
6. Amendment 1: the share moment of each day in the teacher view of the scripts (`scripts[].share`: `shots[].step`, `shots[].media`, `caption.en`, `caption.th`), at the named step, with the consent line. The app shows it only when `approval.loops` is approved (D23). The app uploads no photo or video.

Contract check for the share field (Amendment 1). The author read the Monorepo on 2026-11-07 at HEAD `db3fc23d8`, read-only. The spec reviewer (opencode-go/deepseek-v4.1-flash) rechecked the same lines at `f97fffbaf` on 2026-11-07. Each claim below holds at both commits.

- The receiving step is `receiveWeek` in `apps/storytime/scripts/receive-weeks.ts` (line 218). It parses each week with `weekSchema` of `apps/storytime/lib/contracts/week.ts` (line 222).
- The contract is passthrough, not strict. Every object of `week.ts` uses `.passthrough()`, and `scriptSchema` (line 381) does too. The file header (lines 6 and 7) says: "Every object passes unknown keys through, because Workbooks owns the schema and the app must accept a field that a later phase does not read yet."
- Answer: an extra `scripts[].share` field does not break the contract check. The step writes the source text with no change (line 237), so the field reaches the app content.
- One limit: `mediaPathsOf` (`receive-weeks.ts` line 191) reads every string of a week. The test `apps/storytime/__tests__/phase3-media-coverage.test.ts` fails on a string that ends in a media file extension when `mediaOf` does not list it. So the share field holds no file path (FR-14, rule 7 of the check).
- The older reader `apps/primary-advantage/lib/storytime/week.ts` uses plain `z.object`, which drops unknown keys. Its header says: "Unknown fields are dropped". It ignores the field.

## Non-Functional Requirements

- Every new English line has a Thai gloss and needs Daniel's Thai check.
- The English lines follow the existing rules of the week text: the sounds are pure sounds and not letter names, and a sentence that the class repeats is short.
- New code has JSDoc on each exported function. The code follows the style of the files that it changes.
- The repository is public. No test item, test paper, answer key, or test audio goes into this track.
- Amendment 1: the Thai captions and the Thai share labels go to Daniel only. No model and no other person checks them. The review roles get the English only.
- Amendment 1: a share moment adds no minutes, and it shows no assessment step.

## Out of scope

- FSRS spacing and any adaptive review queue (a later change).
- The student workbook, the readers, and the covers.
- Level 1, Level 3, and Level 4 week text.
- The week 1 proof of 2026-11-05. It keeps the approved text.
- New pictures, new audio recordings, and new songs.
- Any change to the Monorepo app code. This track gives the field names and the interface only.
- Amendment 1: the posts themselves, the parent groups, and the photo consent forms. The school runs them.
- Amendment 1: any upload of share photos or videos to the app or to a bucket.
- Amendment 1: a share moment in the student book, the readers, the covers, or the home card.
