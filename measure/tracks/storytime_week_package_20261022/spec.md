# Spec: the storytime-week package and the Storytime manual template

Track: `storytime_week_package_20261022`. Type: feature (classic FR list).

## Overview

Storytime Advantage is the kindergarten to P2 phonics program (Anuban 2 to P2, Levels 1 to 4). Its design is in the monorepo: `measure/tracks/storytime_advantage_program_20261021/design.md` (branch primary-parity-integration, commit 80df85c9a). Daniel approved decisions S1 to S14 on 2026-10-22 and set a release goal of 2026-12-01. Workbooks makes the content (design §6): one package is one week, and the teacher book comes from the manual generator with a Storytime template (design §8).

Decision (this session, 2026-10-22): the week is its own schema, not the Primary `LessonPackageSchema`. The Primary schema needs an article (paragraphs, glossary, question bank, Thai paragraphs, article audio); a week has none of them. A new field on the Primary meta also changes the 70 pinned packages when they are saved again. The design §6.6 values stay: `meta.program = "storytime"`, `meta.shape = "storytime-week"`, injector key (program, level, week).

## Functional Requirements

1. **Schema** `dashboard/lib/storytime/schema.ts` (Zod, `version: 1`): meta (with `status` draft or published and the S15 `band`), focus (element, PA skill, new tricky words, frame, family, word wall), `books[]` with `kind` readalong or decodable (decodable from Level 2) with pages, pictures, sounds page and audio at 0.75 and 1.0 timed in the app player's `SentenceTimepointSchema` shape, song (lines as sung with gesture and picture, audio, video, karaoke, times in the same shape), five scripts with steps (four headings in English, optional Thai, Easier, Harder, Group, minutes, an optional move to the next day's opening), review strips for days 1 to 5, the Friday check, the home card, tags, approvals, db. Pictures reuse the Primary picture fields without the Primary positions.
2. **Files:** `content/storytime/l<level>/w<nn>.json`, media in `content/storytime/l<level>/media/w<nn>/`, URL key `st<level>/<week>`.
3. **Checks** `dashboard/lib/storytime/checks.ts`: the design rules (§3, §4, §6) as errors and warnings. Five scripts on days 1 to 5 with the script ids of the level (A to E; Level 1 L, M, S, V, P); opening plus the main steps equal the period; no Level 1 step over 8 minutes; 6 to 8 family words; 3 or fewer new tricky words; 8 read-along pages in Levels 1 to 3; a decodable from Level 2 and none in Level 1; the frame 8 or more times in the song; a gesture on every song line; Thai line counts equal the English; 18 or fewer strip cards a day, one strip for each day.
4. **Manual template** `dashboard/lib/storytime/manual.ts`: one HTML document for a level, through the Primary print wrapper (A4 or book, Sarabun). A title page with the product name; per week a header (element, frame, family, tricky words, books, song); per day a new page: the opening routine with the day's review strip and the recall of the moved steps, then each step with its minutes, the four headings, and the Easier, Harder and Group lines. In the Thai manual the teacher's English stays English with the Thai gloss under it.
5. **Labels** `dashboard/lib/storytime/i18n.ts` (English and Thai). The four headings come from the pinned manual i18n, read only.

## Non-Functional Requirements

- No change to a pinned path (`dashboard/lib/teacher-manual/i18n/*`, `Teacher guide/step-*.md`, the 70 printed packages) or to the Primary package code.
- Daniel checks all Thai. The Thai labels in `i18n.ts` are drafts until his check.
- Heavy jobs (tsc, Chrome renders): a message to the Monorepo session first, then `flock ~/Desktop/primary-parity-progress/heavy.lock`.
- PR rules: the product name "Storytime Advantage" is on the title page; no CEFR in the teacher book.

## Acceptance Criteria

- A fixture week (Level 2, 30 minutes) parses and passes the checks; each broken rule gives its error.
- The English and Thai manuals of the fixture have five day sections, the step minutes, the four headings, the three lines, and no CJK character in the Thai output.
- The Storytime session has the commit id and the shape summary.

## Out of Scope

- The injector and the database rows (later, with Monorepo; key (program, level, week)).
- The content of Level 2 week 1 (after Daniel confirms S17), the media scripts for books and songs, and the music source (S16).
- The student book, the cards, and the benchmark packs.


## Addendum 2026-11-03: book pictures for the app (Phase 7)

### Overview

The Monorepo Storytime app needs the page pictures of week 1 by 2026-11-06. No shipped week has `image.file` on a reader page or on a cover. The app route of week 1 therefore answers 404. The PM relayed the request on 2026-11-03 (Monorepo A-11 Q14, answered 11:34 ICT).

Daniel approved the week 1 pictures: "Both ok" (2026-11-02 07:00 ICT) and "Looks good" (2026-11-02 14:28 ICT). The git note on commit 2e3272e9 records both quotes. On 2026-11-03 at 11:54 ICT, Daniel answered "Yes" (PM relay, Tasks id TFBDbWRFTEItTy1kZGUzdw). The question was: do his picture approvals of weeks 1 to 7 and of the Level 2 cover cover the app too? So the print approval of the pictures is the app approval of the pictures. This addendum covers week 1 only. Weeks 2 to 7 come in a later phase by 2026-11-16, after their print picture stages 1 and 2 (print track `storytime_print_r1_20261025`, Phase 7).

The schema does not change. `image.file` on `books[].cover` and on `books[].pages[].image` already exists in `StorytimeImageSchema`. It names a JPEG relative to the content root `content/storytime/`. The song lines (`l2/media/w01/song-lines/wave.jpg`) and the book audio (`l2/media/w01/books/1-hello.mp3`) use the same rule.

### Decisions (pinned before Red; the Red and Green roles do not guess)

- D1 (scope): week 1 only. 2 books x (1 cover + 8 pages) = 18 pictures.
- D2 (path rule): `l2/media/w<nn>/books/<book stem>/cover.jpg` and `p01.jpg` to `p08.jpg`. `<book stem>` is the file name of the book's `audio.file` without the folder and without `.mp3` (`1-hello`, `2-nan-can-nod`). `pNN` is the 1-based page number. It is the same numbering as `audio.sentences[].page` and `questions[].answer.page` (G4). Every path uses only letters, digits, `.`, `_`, `-`, and `/` (G3).
- D3 (source): the COLOR print picture, that is `fileName` of the entry in `content/storytime/l2/print/pictures.json`. Never use `lineArtFileName`. The files are in `content/storytime/l2/print/pictures/` (git-ignored, local only).
  - Cover match: the entry of that week with `use` equal to `cover` and `text` equal to the book `title`.
  - Page match: the entry of that week with `use` equal to `story-page` and `text` equal to the page text.
  - Zero matches or two matches stop the script with exit 1 before any write.
- D4 (output): JPEG, sRGB, long side 1600 px with the aspect kept (the 4000 x 3000 sources give 1600 x 1200), quality 82, progressive, no metadata. Each file is 400 KB or less. The script uses `sharp` (already in `dashboard/package.json`).
- D5 (provenance): the file `l2/media/w<nn>/books/pictures.sha256` has one line for each picture: the output path, the output SHA-256, the source file name, and the source SHA-256. The fields are separated by one tab. The lines are sorted by output path.
- D6 (caption): `image.caption` does not change. It is the alt text. It stays "" on the reader pages (A-11 Q13).
- D7 (approval): `approval.images` of w01 becomes `status` "approved", `date` "2026-11-03", `words` with Daniel's three quotes exactly ("Both ok", "Looks good", "Yes") and their times, and `source`. The `source` names the PM relay Tasks id TFBDbWRFTEItTy1kZGUzdw and the print Phase 4 git note on 2e3272e9. `approval.audio` and `approval.song` stay "draft".
- D8 (effect on `published`): the detail of the check `published` of st2/1 changes from `images not approved; audio not approved; song not approved` to `audio not approved; song not approved`. The check stays FAIL, because audio and song are not approved. The `PROJECT_CHECKS` commands of the print track and of the A-42 track count only the FAIL name `published`, so they keep working.

### Functional Requirements

1. **Script** `dashboard/scripts/storytime/set-book-pictures.ts --level 2 --week 1`. It has a `USAGE` text and the exit codes of the other storytime scripts: 0 for success, 1 for a data error, 2 for a usage error. It does these steps in this order:
   - It reads the week file and `pictures.json`, and it finds the 18 source pictures by D3. It checks all matches and all source files before the first write.
   - It writes the 18 JPEGs by D2 and D4.
   - It writes the provenance file by D5.
   - It writes `image.file` into the week file for each cover and page picture.
2. **Week file edit.** The script changes no other byte of the week file. It edits the text: it adds a `"file"` line after the `"caption"` line of each of the 18 image objects, with the indent of the `caption` line. The week file is not in `JSON.stringify` format, so a parse and a stringify would change other bytes. When `file` is present with the same value, the script changes nothing. When `file` is present with another value, the script changes the value on that line only.
3. **Repeat run.** A second run with the same inputs changes no byte of the 18 JPEGs, of the provenance file, or of the week file.
4. **Check** `book-pictures` in `dashboard/scripts/storytime/check-weeks.ts`, like `book-audio`. It reads `image.file` of each book cover and each book page. It has the status `fail` when a named file is missing, with `missing: <paths>` as the detail. It has the status `pass` when all named files exist. It adds no row for a week with no `image.file` on a book picture, in the same way as `book-audio` adds no row for a week with no book audio.
5. **Content** (hand edit in the Green task, not done by the script): `approval.images` of `content/storytime/l2/w01.json` by D7.
6. **Pinned tests.** The tests that pin the old `published` detail on the shipped w01 change in the Red task. They are at least `dashboard/__tests__/storytime-print-contract-v2.test.ts:289`, `storytime-print-adversarial.test.ts:257`, and `storytime-loops-schema.test.ts:303`. Any other test that reads the `published` detail of the shipped w01 changes too. The A-42 switch dry run lists 7 published tests in `measure/runs/storytime_teaching_loops_20261103/switch-dryrun.txt`. The test `storytime-loops-schema.test.ts` "still reports images not approved when only images is draft" builds a copy with `images` set to draft, so its logic stays valid.
7. **Hand-off.** The commit SHA of the Green task and the 18 paths go to the PM session for Monorepo by 2026-11-06 (peer-report).

### Acceptance Criteria

- AC1: each of the 18 covers and pages in the shipped w01 has `image.file` by the D2 path rule, and the file exists.
- AC2: each file is a JPEG with a long side of 1600 px and a size of 400 KB or less.
- AC3: `pictures.sha256` names each of the 18 pictures once, and the output SHA-256 of each line matches the file on disk. The source file name is the `fileName` of the matched entry, never a `lineArtFileName`.
- AC4: all `image.caption` values of the books are the same as before the run.
- AC5: `approval.images` of w01 has the status "approved" and the date 2026-11-03. Its `words` hold the three quotes exactly, with their times. `approval.audio` and `approval.song` have the status "draft".
- AC6: `check-weeks.ts --level 2` shows the check `book-pictures` with the status `pass` for st2/1. The detail of `published` is `audio not approved; song not approved`.
- AC7: a copy of w01 with one named picture file missing gives `book-pictures` the status `fail`, with the path in the detail. A copy with a source match of zero or two entries stops the script with exit 1 and writes no file.
- AC8: a second run of the script changes no byte. The diff of the week file against the commit before the run adds only the 18 `"file"` lines (and the `approval.images` record from the hand edit).
- AC9: `RED_TEST_COMMAND` fails only on the new and the changed assertions. After Green, `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- AC10: the orchestrator opens the 18 JPEGs on one contact sheet and compares them with the approved print pictures (person-checked).

### Blast radius of the addendum

- Files that change: `scripts/storytime/set-book-pictures.ts` (new), `scripts/storytime/check-weeks.ts`, `content/storytime/l2/w01.json`, the new media under `content/storytime/l2/media/w01/books/`, and the tests in FR 6 plus the new `__tests__/storytime-book-pictures.test.ts`.
- Test files of the print track and of the A-42 track change in the Red task (FR 6). Both tracks keep their `PROJECT_CHECKS` commands unchanged.
- The Primary code, the pinned packages, and `lib/storytime/schema.ts` do not change.

### Out of Scope

- Weeks 2 to 7 (later phase, by 2026-11-16).
- The line-art pictures, the check-row pictures, and the practice-line pictures.
- A schema change, a new picture format, and a new resolution for the print.
- The approval of `audio` and `song`, and the `published` status of the week.
- A new picture for the app that is not one of the approved print pictures.
