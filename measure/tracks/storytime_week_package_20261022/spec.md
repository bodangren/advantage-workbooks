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
- D3 (source): the COLOR print picture selected by `resolveStorytimePictureFiles(<the picture folder>, <rows>, 'color')` in `dashboard/lib/storytime/print/picture-check.ts`. The script uses the resolver result for each matched row, not the `fileName` in `pictures.json` directly. The resolver reads the Forge `manifest.json` in the picture folder and selects the version of each row. Never use line art. The folder `content/storytime/l2/print/pictures/` is git-ignored and local only. The week-1 rows a-net, a-nose, and nan-can-nod resolve to their approved v2 files.
  - Cover match: the row of that week with `use` equal to `cover` and `text` equal to the book `title`.
  - Page match: the row of that week with `use` equal to `story-page` and `text` equal to the page text.
  - Zero matches, two matches, or a resolver error stop the script with exit 1 before any write.
- D4 (output): JPEG, sRGB, long side 1600 px with the aspect kept (the 4000 x 3000 sources give 1600 x 1200), quality 82, progressive, no metadata. Each file is 400 KB or less. If quality 82 exceeds 400 KB, encode that file again at a lower quality of 75 or more. Record the quality used for each file. Use sharp defaults: no mozjpeg and 4:2:0 chroma subsampling. The script uses `sharp` (already in `dashboard/package.json`).
- D5 (provenance): the file `l2/media/w<nn>/books/pictures.sha256` has one line for each picture: the output path, the output SHA-256, the resolved source file name, the source SHA-256, the quality, and the sharp version. The fields are separated by one tab. The lines are sorted by output path.
- D6 (caption): `image.caption` does not change. It is the alt text. It stays "" on the reader pages (A-11 Q13).
- D7 (approval): `approval.images` of w01 becomes `status` "approved", `date` "2026-11-03", `words` exactly `"Both ok" (2026-11-02 07:00 ICT); "Looks good" (2026-11-02 14:28 ICT); "Yes" (2026-11-03 11:54 ICT)`, and `source`. The `source` names the PM relay Tasks id TFBDbWRFTEItTy1kZGUzdw and the print Phase 4 git note on 2e3272e9. `approval.audio` and `approval.song` stay "draft". `meta.status` stays "published".
- D8 (effect on `published`): the detail of the check `published` of st2/1 changes from `images not approved; audio not approved; song not approved` to exactly `audio not approved; song not approved`. The check stays FAIL, because audio and song are not approved. The `PROJECT_CHECKS` commands of the print track and of the A-42 track count only the FAIL name `published`, so they keep working.

### Functional Requirements

1. **Script** `dashboard/scripts/storytime/set-book-pictures.ts --level 2 --week 1`. It has a `USAGE` text and the exit codes of the other storytime scripts: 0 for success, 1 for a data error, 2 for a usage error. It does these steps in this order:
   - It reads the week file and `pictures.json`, and it finds the 18 source rows by D3. It resolves every row with `resolveStorytimePictureFiles(<the picture folder>, <rows>, 'color')` and checks all matches, resolver results, and source files before the first write.
   - It writes the 18 JPEGs by D2 and D4.
   - It writes the provenance file by D5.
   - It writes `image.file` into the week file for each cover and page picture.
2. **Week file edit.** The script changes no other byte of the week file. It edits the text: it adds a `"file"` line after the `"caption"` line of each of the 18 image objects, with the indent of the `caption` line. The week file is not in `JSON.stringify` format, so a parse and a stringify would change other bytes. When `file` is present with the same value, the script changes nothing. When `file` is present with another value, the script changes the value on that line only.
3. **Repeat run.** A second run with the same inputs changes no byte of the 18 JPEGs, of the provenance file, or of the week file.
4. **Check** `book-pictures` in `dashboard/scripts/storytime/check-weeks.ts`, like `book-audio`. It reads `image.file` of each book cover and each book page. It has the status `fail` when a named file is missing, with `missing: <paths>` as the detail. It has the status `pass` when all named files exist. It adds no row for a week with no `image.file` on a book picture, in the same way as `book-audio` adds no row for a week with no book audio.
5. **Content** (hand edit in the Green task, not done by the script): `approval.images` of `content/storytime/l2/w01.json` by D7.
6. **Pinned tests.** The tests that pin the old `published` detail on the shipped w01 change in the Red task. The seven published tests are in `dashboard/__tests__/storytime-loops-schema.test.ts`, `storytime-print-adversarial.test.ts`, `storytime-print-contract-v2.test.ts`, and `storytime-print-contract.test.ts`, as listed in `measure/runs/storytime_teaching_loops_20261103/switch-dryrun.txt`. The test `storytime-loops-schema.test.ts` "still reports images not approved when only images is draft" builds a copy with `images` set to draft, so its logic stays valid.
7. **Hand-off.** The commit SHA of the Green task and the 18 paths go to the PM session for Monorepo by 2026-11-06 (peer-report).

### Acceptance Criteria

- AC1: each of the 18 covers and pages in the shipped w01 has `image.file` by the D2 path rule, and the file exists.
- AC2: each file is a JPEG with a long side of 1600 px and a size of 400 KB or less.
- AC3: `pictures.sha256` names each of the 18 pictures once, and the output SHA-256 of each line matches the file on disk. Its source file name is the COLOR file resolved for the matched row by D3, never the `fileName` read directly from `pictures.json` and never a line-art file. Each line records the quality and sharp version.
- AC4: all `image.caption` values of the books are the same as before the run.
- AC5: `approval.images` of w01 has the status "approved" and the date 2026-11-03. Its `words` equal D7 exactly. `approval.audio` and `approval.song` have the status "draft", and `meta.status` stays "published".
- AC6: `check-weeks.ts --level 2` shows the check `book-pictures` with the status `pass` for st2/1. The detail of `published` is exactly `audio not approved; song not approved`, and remains the one accepted FAIL.
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


## Addendum 2026-11-05: app packages of weeks 2 to 7 (Phase 9)

Author model: minimax-cn-coding-plan/MiniMax-M3.1-Flash
Amendment 2026-11-05 (after spec review r1) author model: minimax-cn-coding-plan/MiniMax-M3.1-Flash

### Overview

The Storytime app needs the packages of weeks 2 to 7 by 2026-11-16. The at-home release target is 2026-11-20 (internal). Week 1 is done. Weeks 2 to 7 are the gap.

Each of the 6 weeks has 2 books: a readalong and a decodable. Each book has 8 pages. So one week needs 1 cover and 8 pages for each book, which is 18 pictures. Six weeks need 108 pictures. Each week gives one app package.

No book cover or page of weeks 2 to 7 has `image.file` now. The app route of each of these books answers 404.

The status of each of the 6 weeks: `meta.status` is "draft". The approvals `approval.text` and `approval.thai` are "approved". The approvals `approval.images`, `approval.audio`, `approval.song`, `approval.scripts` and `approval.loops` are "draft".

Every media path that a week names exists. The path counts of the 6 weeks are 23, 22, 18, 24, 21 and 22. Each book has an `audio.file`, so each book stem exists. The script `dashboard/scripts/storytime/set-book-pictures.ts --level <n> --week <n>` matches the rows of `pictures.json` by week, use and text. Two weeks repeat a page text, and `content/storytime/l2/print/pictures.json` holds 2 rows for that text. The unchanged script stops with exit 1 for w02 and w06. E9 gives the rule that takes the right row.

Daniel answered "Yes" on 2026-11-03 at 11:54 ICT (PM relay, Tasks id TFBDbWRFTEItTy1kZGUzdw). That answer covers the app too: his print approval of the pictures of weeks 1 to 7 is the app approval of the same pictures. The pictures of weeks 2 to 7 are in proof v15. The PM sent proof v15 to Daniel on 2026-11-05 at 20:5x (Tasks id bmh2b1hqTFNCVEpDNks4VQ). He answered on 2026-11-05 with the words "The book seems fine." (PM relay of 2026-11-05).

The schema does not change. `image.file` on `books[].cover` and on `books[].pages[].image` already exists in `StorytimeImageSchema`. It names a JPEG relative to the content root `content/storytime/`.

### Decisions (pinned before Red; the Red and Green roles do not guess)

- E1 (scope): weeks 2 to 7; 6 weeks x 2 books x (1 cover + 8 pages) = 108 pictures; one app package per week.
- E2 (rules): the Phase 7 decisions D2 to D6 apply. The match step of the script follows E9. The other parts of D3 to D6 apply without change: D3 (COLOR source through the resolver; never line art), D4 (JPEG output), D5 (one `pictures.sha256` per week), D6 (caption unchanged).
- E3 (approval): the maker task makes one separate commit after the picture content commit. That commit sets `approval.images` of `content/storytime/l2/w02.json` to `w07.json` to the status "approved", the date "2026-11-05", the words exactly `"Yes" (2026-11-03 11:54 ICT); "The book seems fine." (2026-11-05 ICT)`, and the source exactly `PM relay Tasks id TFBDbWRFTEItTy1kZGUzdw; PM relay of 2026-11-05 (owner answer on proof v15, Tasks id bmh2b1hqTFNCVEpDNks4VQ)`. The record names no person. `meta.status` stays "draft". The other approvals do not change.
- E4 (week 1): w01 is not in this phase. The corrected w01 web pictures (A-48) wait for Daniel's v15 word.
- E5 (hand-off): one folder per week, `/home/daniebo/Desktop/handoff/w<nn>-storytime-app-package/`, by the rules of Phase 7 task 66 (the week file and every media file that it names, relative paths from `content/storytime/`, MANIFEST.txt with `workbooks-commit`, the source repo and path, each file with its SHA-256, the date, the sender; the week file byte-equal to `git show <sha>:content/storytime/l2/w<nn>.json`; every path matches `[A-Za-z0-9._/-]`). The folder takes the commit that holds both the 18 `"file"` lines and the `approval.images` record. That commit is the approval commit of E3 or a later commit. One folder per week. No second folder follows the approval commit. Then one line to the PM session. The PM checks each folder against the Monorepo field contract (A-42 Hand-off 1) before Monorepo takes it.
  - Amendment 2026-11-07 (Phase 10, decisions H12 and H13): the sentence "No second folder follows the approval commit." applies to the Phase 9 folders only. The family-word pictures of Phase 10 need one revision folder per week: `w01-storytime-app-package-r3` and `w02-storytime-app-package-r2` to `w07-storytime-app-package-r2`. Each revision is a new folder. No existing folder changes (hand-off README rule 5).
- E6 (11-16 list): for each week, the open owner items (`audio`, `song`, `scripts`, and any look item) go to the PM's 11-16 list. They do not stop the hand-off. The `images` item leaves the 11-16 list, because the owner answered on 2026-11-05 and E3 records that answer.
- E7 (tests): the new cases go into the existing file `dashboard/__tests__/storytime-book-pictures.test.ts`. There is no new test file. No test writes into `content/storytime/`. Each case runs the script on a temporary copy of a week and its folders, like the existing cases of that file.
  - Case (a), a temporary copy of w02: the run exits 0 and throws nothing. It writes 18 JPEGs, 18 provenance lines, and 18 `"file"` lines in the copied week file. In the provenance, the source names of `books/2-can-i/p01.jpg` to `p03.jpg` start with `l2-w02-story-page-nan-can-v`, `l2-w02-story-page-can-i-v`, and `l2-w02-story-page-i-can-v`. The source names of `p04.jpg` to `p06.jpg` start with `l2-w02-story-page-nan-can-b-`, `l2-w02-story-page-can-i-b-`, and `l2-w02-story-page-i-can-b-`. The test asserts the row-id prefix, not the version number. The test reads the book stem from the `audio.file` of the w02 decodable book. The maker confirms that stem is `2-can-i`.
  - Case (b), a temporary copy of w06: page 3 of the decodable book takes a source that starts with `l2-w06-story-page-tap-tap-tap-v`. Page 6 takes a source that starts with `l2-w06-story-page-tap-tap-tap-b-`.
  - Case (c), a temporary rows file with the row `l2-w02-story-page-nan-can-b` removed: the run throws an error whose text starts with `picture match:`. It writes no JPEG, no provenance file, and no change to the week file.
  - The cases (a) and (b) fail with the current script, because it throws for 2 candidates. They are the Red failures. The case (c) passes before the change.
- E8 (loops-content compare): `withoutNewFields` in `storytime-loops-content.test.ts` also drops `image.file` of each book cover and book page (media paths, not loops content), with a one-line comment, like the media approvals. No other change to that test.
- E9 (repeated page text): in one week, the n-th book picture with the same use and text, in book order (each book: the cover, then pages 1 to 8), takes the n-th row with that week, use and text, in `pictures.json` file order. The two rows of one text have different prompts, so they are different pictures. This is the same rule as `rowsByBook` in `dashboard/lib/storytime/print/readers.ts` lines 142 to 153. That rule maps the rows of `storytimePrintPictures([week])` to the pages by position, and it built the approved v15 A3 readers. The app shows on each page the same picture as the approved print book.
  - The rows of the repeated texts of w02 are `l2-w02-story-page-nan-can` (line 586) and `l2-w02-story-page-nan-can-b` (line 628), `l2-w02-story-page-can-i` (line 600) and `l2-w02-story-page-can-i-b` (line 642), `l2-w02-story-page-i-can` (line 614) and `l2-w02-story-page-i-can-b` (line 656). The rows of w06 are `l2-w06-story-page-tap-tap-tap` (line 2276) and `l2-w06-story-page-tap-tap-tap-b` (line 2322). The file is `content/storytime/l2/print/pictures.json`.
  - The decodable book of w02 has the texts "Nan can.", "Can I?", and "I can!" on pages 1 to 6. Pages 1 to 3 take the base rows. Pages 4 to 6 take the `-b` rows.
  - The decodable book of w06 has the text "Tap, tap, tap!" on pages 3 and 6. Page 3 takes `l2-w06-story-page-tap-tap-tap`. Page 6 takes `l2-w06-story-page-tap-tap-tap-b`.
  - The script stops with exit 1, and the error text starts with `picture match:`, when the count of the rows for a use and text differs from the count of the book pictures with that use and text. The script then writes no file.
  - Only the match step (lines 50 to 54) of `dashboard/scripts/storytime/set-book-pictures.ts` changes. D2 to D6 apply without change otherwise. The output of w01 stays byte-equal, because w01 repeats no text and the unchanged script succeeded on w01.

### Functional Requirements

1. **Script** `dashboard/scripts/storytime/set-book-pictures.ts --level 2 --week <nn>`, for each week of weeks 2 to 7, one week at a time. The script of Phase 7 changes in its match step only, and the match step follows E9. It keeps its `USAGE` text and its exit codes: 0 for success, 1 for a data error, 2 for a usage error. It reads the week file and `pictures.json`, matches the 18 source rows by E9, resolves each of them by D3, writes the 18 JPEGs by D2 and D4, writes the provenance file by D5, and writes `image.file` into the week file.
2. **Week file edit.** The script changes no other byte of the week file. It adds a `"file"` line after the `"caption"` line of each of the 18 image objects, with the indent of the `caption` line. Each week of weeks 2 to 7 gets 18 such lines.
3. **Repeat run.** A second run with the same inputs changes no byte of the 18 JPEGs, of the provenance file, or of the week file.
4. **Check** `book-pictures` in `dashboard/scripts/storytime/check-weeks.ts`. The check of Phase 7 applies without change. It reads `image.file` of each book cover and each book page. It has the status `fail` when a named file is missing, with `missing: <paths>` as the detail. It has the status `pass` when all named files exist. It adds no row for a week with no `image.file` on a book picture.
5. **Content** (hand edit in the maker task, not done by the script): one commit after the picture content commit sets `approval.images` of `content/storytime/l2/w02.json` to `w07.json` by E3. The words and the source are the exact strings of E3.
6. **Tests.** The cases of E7 go into `dashboard/__tests__/storytime-book-pictures.test.ts`. They run the script on a temporary copy of a week and its folders. No test writes into `content/storytime/`. The change of E8 in `storytime-loops-content.test.ts` drops the `image.file` of each book cover and each book page.
7. **Hand-off.** The 6 hand-off folders of E5 go to the PM session by 2026-11-16 (peer-report).

### Acceptance Criteria

- AC1: the Phase 7 AC1 to AC4 and AC8 pass for each week of weeks 2 to 7. The phase gives 108 files and 6 provenance files.
- AC2: `check-weeks.ts --level 2` shows the check `book-pictures` with the status `pass` for st2/2 to st2/7. The same one accepted FAIL stays as before. The detail of `published` stays the same as before the run.
- AC3: the RED gate fails only on the new and the changed assertions. The new assertions are the cases (a) and (b) of E7. After Green, the GREEN gate, PROJECT_TESTS, PROJECT_LINT and PROJECT_CHECKS pass.
- AC4: the orchestrator opens one contact sheet per week and compares each JPEG with the v15 print picture (person-checked). Each JPEG shows the right book, the right page, color, not line art.
- AC5: each hand-off folder passes `sha256sum -c` and the byte-equal check of E5. The PM confirms each folder (peer-report).

### Blast radius of the addendum

- Files that change: `content/storytime/l2/w02.json` to `content/storytime/l2/w07.json` (the 18 `"file"` lines of each week, and the `approval.images` record of E3).
- New media: `content/storytime/l2/media/w02/books/` to `content/storytime/l2/media/w07/books/` (108 JPEGs and 6 `pictures.sha256` files).
- Test files that change: `dashboard/__tests__/storytime-book-pictures.test.ts` (the cases of E7) and `dashboard/__tests__/storytime-loops-content.test.ts` (E8).
- The maker runs `grep -rlnE "book-pictures|checkBookPictures|image\.file|pictures\.sha256|approval\.images|images\.status" dashboard/__tests__`. The maker also reads the two tests that read every week: `dashboard/__tests__/storytime-print-covers-16books.test.ts` near line 443 and `dashboard/__tests__/storytime-loops-content.test.ts` near line 264. The maker lists each hit with "changes" or "no change" and the reason in the plan evidence, and adds each changed file to the RED and GREEN commands.
- `dashboard/scripts/storytime/set-book-pictures.ts` changes in its match step only (E9). `dashboard/lib/storytime/schema.ts` does not change.
- The repository is public. The pictures are not test items.

### Out of Scope

- Week 1 (w01). Its corrected web pictures (A-48) wait for Daniel's v15 word.
- The approval of `audio`, `song`, `scripts` and `loops`.
- The `published` status of any week.
- The at-home release of 2026-11-20 and the Monorepo work on the packages.
- A new picture for the app that is not one of the approved print pictures.


## Addendum 2026-11-07: family-word pictures for the app (Phase 10)

Author model: claude-code/claude-opus-5-5[1m]

### Overview

The Storytime app shows a family word with no picture as text only. The Monorepo receiver at commit `f2989514d` finds 51 family words with no file. Week 1 is ready in the app, and it has 6 such gaps today. This phase gives a picture file to each of the 51 family words of weeks 1 to 7. Then it delivers the next package revision of each week, so that Monorepo pins the revisions in its at-home Phase 2.

The PM request (2026-11-07, PM session), verbatim:

> "WHAT: fill the family-word pictures of the Storytime app packages (focus.family.words[].image). Monorepo's receiver at f2989514d finds 51 with no file: w01 6, w02 10 (one to ten), w03 7 (colors), w04 7 (family), w05 7 (body), w06 7 (animals), w07 7 (toys); w08 0. 1. Map the pictures that exist now: the approved card pictures in ~/Desktop/handoff/storytime-l2-card-pictures/ cover 15 words (w01 hello, goodbye, boy, girl, teacher; w04 mom, dad, brother, sister, grandma, grandpa; w07 doll, car, train, teddy). Use your color patches for the 7 w03 color words and your number-and-dots cards for the 10 w02 number words (Daniel's "Go" of 11-06 covers both). 2. The 19 words left (w01 friend; w04 family; w05 eyes, ears, nose, hands, arms, legs, feet; w06 cat, dog, bird, fish, frog, duck, horse; w07 ball, kite, drum): the PM asks Forge for color pictures in the card style, by 11-10, into ~/Desktop/handoff/storytime-l2-family-word-pictures/. Map them when they arrive. 3. Deliver the next package revision of w01-w07 (same hand-off format, MANIFEST with SHA-256), so that Monorepo pins it in at-home Phase 2. WHY: a family word with no picture shows as text only in the app; w01 is ready with 6 such gaps today. DONE WHEN: the w01-w07 packages carry a picture for each family word, and the PM has one status line. Date: 11-12, before Daniel's 11-16 check (he sees the pictures there). Facts changed: none expected."

The PM log row of the same request is `~/Desktop/advantage-pr/measure/pm-log.md` line 2222 (2026-11-07 03:43 ICT). It gives Forge a hard stop of 0.86 USD, the rest of the approved card limit of 1.60 USD.

Daniel's "Go" of 2026-11-06, verbatim from the PM log (`~/Desktop/advantage-pr/measure/pm-log.md` line 2122, 2026-11-06 04:50 ICT, Tasks `OHFaMGVXUl9UaDVJOHhJcQ` under `ZUNxRzA2QnNHT3dkd1pKZQ`):

> "Daniel: "Go" (card pictures; default: 31 words, color + line art, limit 1.60 USD; color patch for 8 color words, number + dots for 9 numbers; card ink color one side)."

Daniel's own word is "Go". The text in parentheses is the PM default that the "Go" approved. The print plan records the same decision as "The 8 color words print as a color patch, and the 9 number words print as the number with dots." (`measure/tracks/storytime_print_r1_20261025/plan.md` line 1114).

### Facts (measured 2026-11-07)

- The family words of the shipped weeks: w01 6 (hello, goodbye, boy, girl, friend, teacher); w02 10 (one to ten); w03 7 (red, blue, yellow, green, orange, pink, purple); w04 7 (mom, dad, brother, sister, grandma, grandpa, family); w05 7 (eyes, ears, nose, hands, arms, legs, feet); w06 7 (cat, dog, bird, fish, frog, duck, horse); w07 7 (ball, doll, car, kite, drum, train, teddy). Each of the 51 has an `image` object with `prompt`, `characters`, and `caption`, and no `file`. The `caption` line is the last line of each image object. Each caption is the word ("hello", "ten").
- w08 has 18 family words (an, Nan, pan, ...). None of them has an `image` object, so none needs a file.
- The Workbooks schema already holds the field: `FamilyWordSchema.image` is `StorytimeImageSchema` (`dashboard/lib/storytime/schema.ts` lines 97 to 99), and that schema has `file`. The schema does not change.
- The card pictures: `~/Desktop/handoff/storytime-l2-card-pictures/` holds 29 of the 31 card rows of picture list v7 (58 PNG files and `MANIFEST.txt`). Every file is 1500 x 1500 px, 8-bit, RGB, with no alpha channel. The MANIFEST says "No person review yet. Workbooks checks the cards." The files have a Forge model-judge pass. No person check of the files is recorded yet. Daniel sees the pictures in his 11-16 check. At the first measure, the folder did not hold the row `l2-w04-card-family`. Amendment r2 (2026-11-07): at 10:11 ICT, Forge put the family row into the folder (the color file `l2-w04-card-family-v1.png` and its line-art file) and the ham color file. The MANIFEST now lists 61 files: 31 color files and 30 line-art files. `card-pictures.json` holds the row of `family` for week 4. So by H3 the word "family" maps to `card`, not to Forge.
- The card kit (print track, `dashboard/lib/storytime/print/card-kit.ts`): `STORYTIME_CARD_COLOR_PATCH` (lines 128 to 137) holds 8 sRGB values (red `#E53935`, blue `#1E88E5`, yellow `#FDD835`, green `#43A047`, orange `#FB8C00`, pink `#F48FB1`, purple `#8E24AA`, brown `#6D4C41`). `STORYTIME_CARD_NUMBER_DOTS` (lines 144 to 154) holds one to nine. `colorPatchBox` (lines 753 to 756) and `numberDotsBox` (lines 765 to 783) are module-private. `compileStorytimeCardSheet` (line 840) is exported and writes their markup into each card.
- The print card "ten": the print card kit has no number card for ten. The A6 v2 match report (`~/Desktop/print-ready/storytime/card-kit-v2/card-picture-match.txt`) gives `family-picture	ten	l2-w06-check-row-ten	text`, so the print card "ten" shows the check-row picture.
- `dashboard/scripts/storytime/check-storytime-pictures.ts` needs a Forge `manifest.json` with one job for each picture-list row id, and a line-art file for each row. The Forge folder holds 19 color files and no line-art file. 18 of them are sources (amendment r2), and none of these 18 has a picture-list row. So that script does not fit the delivery check (H8).
- The Forge folder (amendment r2, measured 2026-11-07): `~/Desktop/handoff/storytime-l2-family-word-pictures/` arrived before its due date of 2026-11-10. Its MANIFEST gives the date 2026-11-07 07:38 ICT. The folder holds 19 color files, `MANIFEST.txt` with 19 SHA-256 lines, `manifest.json`, and a contact sheet. `sha256sum -c` passes for the 19 lines (the PM hand-off, and a new run on 2026-11-07). The names have the form `l2-w0N-card-<word>-v1.png`. The family file of this folder and the family file of the card folder have the same SHA-256 (`ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62`).

### The Monorepo receiver (read only, 2026-11-07)

The Monorepo HEAD is `84e356bdf` (branch master). The commit `f2989514d` exists and is an ancestor of HEAD. `git diff --stat f2989514d HEAD -- apps/storytime` is empty, so the line numbers below are the same at both commits.

- `apps/storytime/lib/contracts/week.ts`: `MEDIA_PATH_MAX = 200` (line 26). The media path allowlist `/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/` (line 41), with no `..` and no `.` segment (lines 44 to 49). `imageSchema` (lines 77 to 86) has `file: mediaPath.optional()` (line 84) and is `passthrough`. `familyWordSchema` (lines 187 to 193) has `image: imageSchema.optional()` (line 191). The family words are at line 206.
- `apps/storytime/scripts/receive-weeks.ts`: `MEDIA_RULES.bookPicture = "9.1"` (line 51). `mediaOf` (line 80) lists each family word picture (lines 121 to 129). A family word with an `image` and a `file` is a normal media item of the kind `family-word-picture`. A family word with an `image` and no `file` is a missing item; its `file` is the field path `focus.family.words.<n>.image` (line 124). `MEDIA_EXTENSION` (line 180) accepts `mp3|wav|m4a|aac|ogg|opus|mp4|m4v|webm|mov|jpg|jpeg|png|webp|gif|svg|pdf`. `mediaPathsOf` (line 191) walks every string of a week and lists each string with a media extension.
- The media coverage test `apps/storytime/__tests__/phase3-media-coverage.test.ts` (finding F13, `describe` at line 120, the shipped-week case at line 121; `mediaPathsOf` at lines 112 and 135) requires that `mediaOf` lists every media path that `mediaPathsOf` finds. The new `image.file` values are in `mediaOf`, so the test holds.
- `apps/storytime/__tests__/phase2-media-missing.test.ts` lines 125 to 151: a family word picture with no file is missing (line 126 to 137), and one with a file (`words/tap.png`) is a normal item (lines 140 to 151).
- The app shows the picture in the teacher week view: `apps/storytime/app/[locale]/teacher/[level]/[week]/week-view.tsx` lines 127 to 158. The `img` has `src={mediaUrl(entry.image.file)}` (line 140), `alt` = the caption, and `className="h-24 w-24 rounded-xl object-cover"` (line 144): 96 x 96 CSS px, a crop to fill, round corners. With no file, the view shows the caption text in a box (lines 146 to 153). `mediaUrl` puts the file under `STORYTIME_MEDIA_BASE` or `/media` (lines 20 and 36 to 43).
- `apps/storytime/lib/readiness.ts` line 81: only a book page picture without a file blocks a week. A family word without a file does not block it.
- The receiver has no limit on the pixel size or the byte size of a picture. The format limit is the extension list of line 180.
- The 51: `measure/tracks/storytime_at_home_release_20261106/plan.md` line 64 (task 1.4 record: w01 6, w02 10, w03 7, w04 7, w05 7, w06 7, w07 7, w08 0 missing pictures). The at-home Phase 2 starts at line 69. Its task 2.1 (lines 75 to 79) receives the approved pin on 2026-11-17 to 2026-11-19.

### Decisions (pinned before Red; the Red and Green roles do not guess)

The letter H names the decisions of this phase, because F names the review findings.

- H1 (scope): the 51 family words of w01 to w07 (6, 10, 7, 7, 7, 7, 7). No w08 word gets a file. No book picture, song picture, or print file changes.
- H2 (path and edit): the file is `l2/media/w<nn>/family/<word>.jpg`, relative to `content/storytime/`. `<nn>` is the two-digit week. `<word>` is the `word` value; all 51 values are lower-case letters only. The script adds a `"file"` line after the `"caption"` line of each family image object, with the indent of the `caption` line. The caption line gains a comma. No other byte of the week file changes (the rules of Phase 7 FR-2). `image.caption` does not change (D6).
- H3 (source of a word, in this order of priority):
  1. `patch`: the word is a key of `STORYTIME_CARD_COLOR_PATCH`. The 7 w03 words.
  2. `dots`: the word is a key of `STORYTIME_APP_NUMBER_DOTS` (H4). The 10 w02 words.
  3. `card`: `content/storytime/l2/print/card-pictures.json` holds an entry with that word and that week, and the `MANIFEST.txt` of the card folder lists the color file `l2-w<NN>-card-<word>-v1.png`. The 16 words: the 15 words of the PM request and `family` (amendment r2).
  4. `forge`: every other word. The source is the color file `l2-w<NN>-card-<word>-v<k>.png` in the Forge folder (`<k>` is a whole number of 1 or more, with no leading zero). The 18 words: the 19 Forge words of the PM request except `family` (amendment r2).
  - COLOR only: a file name with `-line-` is never a source. Such a name stops the script with exit 1 before any write.
  - A word with a color file in both folders (amendment r2; the code of `storytimeFamilyPictureSource` and `setFamilyPictures`, read at `b6a33e7c`): the mapping kind decides the source folder.
    - The order of priority above gives the kind. The kind `card` needs two facts: the row in `card-pictures.json`, and the file name in the card `MANIFEST.txt`.
    - When both facts are true, the function returns `card` and does not read the Forge files. The script ignores the Forge file of that word.
    - The script does not check the ignored file by H8, does not count it for the rule of two color files, and does not encode it.
    - One folder rule still reads the ignored file. With `--forge`, each color file of the Forge folder must be in the Forge `MANIFEST.txt`. Else the run stops with `not in MANIFEST` (review F8).
    - The card rule reads the card MANIFEST, not the disk. If the card MANIFEST lists the file and the file is absent, the run stops with `not in MANIFEST`. The word does not go to Forge.
    - The word goes to `forge` only when the row or the card MANIFEST name is absent.
    - Measured on 2026-11-07: `set-family-pictures.ts --level 2 --week 4 --check` with both folders exits 0. Its `family` line has the fields `family`, `card`, `l2-w04-card-family-v1.png`, and `ok`.
    - The two family files hold the same bytes (the same SHA-256 in both MANIFESTs). So the output does not change with the folder.
- H4 (the number ten): Daniel's "Go" names "9 numbers", and the print card kit has no number card for ten (its "ten" card shows the check-row picture `l2-w06-check-row-ten`). The PM line of 2026-11-07 names 10 number cards inside the "Go". Default (the PM line): the app card of "ten" is the numeral 10 with 10 dots in two rows of five, by the dot rule of the card kit (one or two rows, at most five dots in a row). The new module exports `STORYTIME_APP_NUMBER_DOTS`: every entry of `STORYTIME_CARD_NUMBER_DOTS` plus `ten: 10`. `card-kit.ts` does not change, so the print card kit keeps its 9 number cards and its approved A6 v2 output. Answer (orchestrator, 2026-11-07, test strategy Q1 and pin S1): yes. The app card `ten` shows the numeral 10 with 10 dots in two rows of five. The card is for the app only, and `card-kit.ts` does not change. The `ten` cases are two separate tests (R1-3 for the markup, R1-10 for the render), so a later reversal changes two tests and one constant.
- H5 (the raster export of a patch and of a number card):
  - The markup: `familyCardPictureHtml(source)` builds the picture area with the geometry of the card kit. A patch is a rounded rectangle of the hex value with a corner radius of 6 mm that fills the area. A number card is the numeral at 60 pt, bold, in Andika, with a gap of 3 mm, above an SVG with a view box 100 wide, dots of radius 7, a gap of 4, a row height of 22, and a top offset of 4, at most 50 percent of the area high.
  - The parity rule: for each of the 9 number words one to nine and each of the 8 color words, the string of `familyCardPictureHtml` equals the `card-picture` element that `compileStorytimeCardSheet([{ kind: 'family-picture', label: <word>, size: 'A6', classSet: false }], 'A6').html` writes, byte for byte.
  - The page: `familyCardPageHtml(source)` is one HTML document of 400 x 400 CSS px with a white `#FFFFFF` background, the faces of `fontFaceCss()` (`dashboard/lib/storytime/print/print-fonts.ts` line 41), a body padding of 4 mm (the card safe margin), and the picture area that fills the rest.
  - The page CSS (pin S6): `familyCardPageHtml` restates the rules that the sheet CSS gives to the picture area, because `cardSheetCss` is module-private. The rules are `* { box-sizing: border-box; margin: 0; padding: 0 }` and `.card-picture { flex: 1; width: 100%; min-height: 0; display: flex; align-items: center; justify-content: center }` with no top margin (the app picture has no label). The `body` has a padding of 4mm, `display: flex`, `flex-direction: column`, a size of 400 x 400 px, `overflow: hidden`, and the Andika face from `fontFaceCss()`. The numeral keeps `font-weight: 700` through its element style.
  - The render: Playwright `chromium.launch({ channel: 'chrome' })`, a viewport of 400 x 400, `deviceScaleFactor: 2`, one PNG screenshot of the page, 800 x 800 px. Then H6. The render runs only inside a heavy-run job.
  - The app picture shows the picture area only. The app writes the word above the picture (week-view.tsx line 135), so the picture has no label.
- H6 (output of all 51): JPEG, sRGB, 800 x 800 px, quality 82, progressive, no metadata. Use the sharp defaults: no mozjpeg and 4:2:0 chroma subsampling. A card or Forge source (1500 x 1500) gets a resize to 800 x 800 with `fit: 'cover'` and the sharp default kernel. Each file is 150 KB or less. If quality 82 is above 150 KB, encode that file again at a lower quality of 75 or more, and record the quality. Reason for 800 px: the app shows 96 x 96 CSS px (week-view.tsx line 144), and 800 px also serves a later larger view.
- H7 (provenance): one file for each week, `l2/media/w<nn>/family/pictures.sha256`, in the D5 form: one line for each picture with the output path, the output SHA-256, the source name, the source SHA-256, the quality, and the sharp version, separated by one tab, sorted by output path.
  - The source name of a card or Forge picture is its PNG file name. Its source SHA-256 is the SHA-256 of that file, and it equals the line of the folder `MANIFEST.txt`.
  - The source name of a patch is `card-kit-patch-<word>-<hex>` (six upper-case hex digits, no `#`), for example `card-kit-patch-red-E53935`. The source name of a number card is `card-kit-dots-<word>-<count>`, for example `card-kit-dots-ten-10`. Their source SHA-256 is the SHA-256 of the UTF-8 text of `familyCardPageHtml(source)`.
  - The family pictures do not go into `l2/media/w<nn>/books/pictures.sha256`. `set-book-pictures.ts` writes that file whole, so a family line in it is lost at the next book run.
- H8 (the delivery check of a source folder): the card folder and the Forge folder each hold `MANIFEST.txt` with lines `<sha256>  <file name>` (the form of the card hand-off). Before the first write, the script checks each source of the requested week:
  - the file is listed in the MANIFEST, and its SHA-256 equals the MANIFEST line;
  - it is a PNG, 8-bit, sRGB, 3 channels, with no alpha channel, 1500 x 1500 px (the FR-9 class C color rules of the print spec);
  - the Forge folder holds exactly one color file for each Forge word of the week;
  - no source name holds `-line-`.
  - A failed rule stops the script with exit 1, and the error names the file and the rule. The script then writes no file.
  - The check does not measure the background. The card hand-off measured near-white corners (246 to 249). The app crop and the round corners hide the corners, and the person check (AC10-10) covers the look.
  - The FR-9 rules (pin S15; orchestrator answer Q3, 2026-11-07): the machine rules above equal the color rules and the class C size of FR-9 in `measure/tracks/storytime_print_r1_20261025/spec.md` (PNG, 8-bit, sRGB, opaque, no alpha channel, no CMYK; 1500 x 1500 px, 1:1). FR-9 class C also gives three rules of the picture content: a white `#FFFFFF` background; no letters, words, or numbers in the picture; one object, or one person who does the action, centred, about 80 percent of the frame. These three rules apply to every card and Forge source. The script does not measure them, because the delivered card pictures have near-white corners (246 to 249) and an exact-white test would refuse them. The contact-sheet check (AC10-10) checks the three rules for each of the 34 PNG sources (16 card and 18 Forge; amendment r2), and a fault goes to the PM as a redo request.
  - The test of the machine rules (pin S15) reads `sharp(file).metadata()`: `format === 'png'`, `space === 'srgb'`, `channels === 3`, `depth === 'uchar'`, `hasAlpha === false`, and a size of 1500 x 1500. The script does not check an ICC profile.
  - The Forge names (review F5): the PM gives Forge the file-name pattern of H3 item 4 and the MANIFEST form of this rule. The orchestrator sent both to the PM on 2026-11-07. The Forge delivery task records the PM's confirmation, or the names that Forge used. If Forge used another name form, the orchestrator amends H3 and H8 before the first run.
- H9 (check): `family-pictures` in `dashboard/scripts/storytime/check-weeks.ts`, like `book-pictures`. The row label is exactly `The family-word pictures named in the package exist` (the form of the `book-pictures` label at line 27). It reads `image.file` of each family word. The status is `fail` when a named file is missing, with the detail `missing: <paths>`. The status is `warn` when a family word with an `image` has no `file`, with the detail `no file: <words>`. The status is `pass` when every family word with an `image` has a file that exists. The check adds no row for a week with no family word that has an `image` (w08).
- H10 (approval): `approval.images` and every other approval of each week stay as they are. `meta.status` stays as it is. The family-word pictures go on the PM's 11-16 list, where Daniel sees them. They do not stop the hand-off (as E6). The at-home deploy (2026-11-20) comes after the 11-16 check. If Daniel refuses a picture, a later revision changes it.
- H11 (Forge late): Forge is due on 2026-11-10. If the Forge folder is absent at 2026-11-10 18:00 ICT, or fails H8, the orchestrator asks the PM for one choice. The default is: wait for Forge. Only if the PM agrees, a partial revision goes first: w02 r2, w03 r2, and w04 r2 complete, w01 r3 with 5 of 6, and w07 r2 with 4 of 7. w05 and w06 wait, because they have no mapped word. The full set then follows with the next revision numbers (w01 r4, w05 r2, w06 r2, w07 r3), each with its "Changed since" section. Amendment r2: `family` maps to `card`, so w04 is complete with 7 of 7 (before: 6 of 7, and w04 r3 in the full set). The Forge folder arrived on 2026-11-07, so now only an H8 failure of that folder can start this rule. The PM reports the date change of the full set.
- H12 (revision names and form): `w01-storytime-app-package-r3`, and `w02-storytime-app-package-r2` to `w07-storytime-app-package-r2`, under `/home/daniebo/Desktop/handoff/`. The rules of E5 apply: the week file and every media file that it names, the two provenance files (`books/pictures.sha256` and `family/pictures.sha256`), relative paths from `content/storytime/`, every path in `[A-Za-z0-9._/-]`, and the week file byte-equal to `git show <sha>:content/storytime/l2/w<nn>.json`. `MANIFEST.txt` holds `source-repo`, `source-path`, `source-commit` and `workbooks-commit` with the full SHA, each file with its SHA-256, the date, and the sender. It also holds one section `# Changed since <previous folder>:` in the form of the w01 r2 MANIFEST (lines 51 to 63): each payload file whose SHA-256 differs from the MANIFEST of the previous folder, with `#   old-sha256:` and `#   new-sha256:`. The w01 r2 MANIFEST writes an empty value for a new file: line 68 is `#   old-sha256: ` with nothing after the space (the new file `l2/media/w01/books/pictures.sha256`). The new revisions use the same form: an empty `old-sha256:` value for a new file, and an empty `new-sha256:` value for a removed file (review F2). The previous folders are `w01-storytime-app-package-r2` and `w02-storytime-app-package` to `w07-storytime-app-package`. The section also lists a week file that changed for another reason after `82f88853` (for example the loops fields of another track).
- H13 (the E5 rule): the amendment line under E5 (Phase 9 decisions) permits these revision folders.
- H14 (tests and rule R1): two new test files, `dashboard/__tests__/storytime-package-raster.test.ts` (Red 1) and `dashboard/__tests__/storytime-package-family.test.ts` (Red 2). The prefix `storytime-package-` does not match `storytime-print-*` or `storytime-loops-*`, so the Red gates of those tracks do not run these files. No test writes into `content/storytime/`. Each script case runs on a temporary copy of a week and of the source folders. The tests read the shipped week files (print rule 11.3) and the shipped card MANIFEST.
  - Rule R3 of the loops track (review F1): while the loops Phase 3b R3 window is open, every Phase 10 gate that runs `PROJECT_TESTS` adds `--exclude "**/storytime-loops-share-content.test.ts"`. The window starts at the commit of the loops content Red (Red 2, `__tests__/storytime-loops-share-content.test.ts`) and ends at the loops switch commit (`measure/tracks/storytime_teaching_loops_20261103/plan.md` Rule R3, line 255; `test-strategy.md` section 9.8). The Phase 10 verification task runs `PROJECT_TESTS` with no exclude after the switch commit, or names the exclude if the window is still open.
- H15 (lane): this phase has separate Red and Green roles, because it adds code. The checkers are the spec review, the contact-sheet check (AC10-10), and the PM check of each revision folder. The test strategy (plan update P2; orchestrator answer Q2, 2026-11-07) adds two roles after Green 2 and before the Maker task: one review role with the labeled sections A (code and test quality), B (security and data), and C (contracts and blast radius), and one limited adversarial round. If the schedule slips, the adversarial round is cut first, and the plan records the cut.

### The mapping of the 51 words

| Week | Word | Source | Source file or value |
|---|---|---|---|
| 1 | hello | card | `l2-w01-card-hello-v1.png` |
| 1 | goodbye | card | `l2-w01-card-goodbye-v1.png` |
| 1 | boy | card | `l2-w01-card-boy-v1.png` |
| 1 | girl | card | `l2-w01-card-girl-v1.png` |
| 1 | friend | forge | `l2-w01-card-friend-v<k>.png` |
| 1 | teacher | card | `l2-w01-card-teacher-v1.png` |
| 2 | one to nine | dots | 1 to 9 dots (`STORYTIME_CARD_NUMBER_DOTS`) |
| 2 | ten | dots | 10 dots, two rows of five (H4) |
| 3 | red | patch | `#E53935` |
| 3 | blue | patch | `#1E88E5` |
| 3 | yellow | patch | `#FDD835` |
| 3 | green | patch | `#43A047` |
| 3 | orange | patch | `#FB8C00` |
| 3 | pink | patch | `#F48FB1` |
| 3 | purple | patch | `#8E24AA` |
| 4 | mom, dad, brother, sister, grandma, grandpa | card | `l2-w04-card-<word>-v1.png` |
| 4 | family | card | `l2-w04-card-family-v1.png` (amendment r2) |
| 5 | eyes, ears, nose, hands, arms, legs, feet | forge | `l2-w05-card-<word>-v<k>.png` |
| 6 | cat, dog, bird, fish, frog, duck, horse | forge | `l2-w06-card-<word>-v<k>.png` |
| 7 | doll, car, train, teddy | card | `l2-w07-card-<word>-v1.png` |
| 7 | ball, kite, drum | forge | `l2-w07-card-<word>-v<k>.png` |

The counts (amendment r2, 2026-11-07): card 16 (w01 5, w04 7, w07 4), patch 7, dots 10, forge 18 (w01 1, w05 7, w06 7, w07 3). The total is 16 + 7 + 10 + 18 = 51. Before the amendment, `family` was a Forge word (card 15, forge 19).

### Functional Requirements

1. **Module** `dashboard/lib/storytime/family-pictures.ts` (new, pure, no file access, no browser). Every export has JSDoc. The exports:
   - `STORYTIME_APP_NUMBER_DOTS: Readonly<Record<string, number>>` (H4).
   - `type StorytimeFamilyPictureSource = { kind: 'patch'; word: string; hex: string } | { kind: 'dots'; word: string; count: number } | { kind: 'card'; word: string; fileName: string } | { kind: 'forge'; word: string; fileName: string | undefined }`.
   - `storytimeFamilyPicturePath(level: number, week: number, word: string): string` gives the H2 path.
   - `storytimeFamilyPictureSource(input: { level: number; week: number; word: string; cardEntries: readonly { word: string; week: number }[]; cardFiles: ReadonlySet<string>; forgeFiles: ReadonlySet<string> }): StorytimeFamilyPictureSource` applies H3. A Forge word with no file in `forgeFiles` gives `fileName: undefined`. A Forge word with two color files throws an error that starts with `family picture:`.
   - `familyCardPictureHtml(source: { kind: 'patch'; word: string; hex: string } | { kind: 'dots'; word: string; count: number }): string` (H5 markup and parity).
   - `familyCardPageHtml(source: same type): string` (H5 page).
   - `familyCardSourceName(source: same type): string` (H7 names).
2. **Script** `dashboard/scripts/storytime/set-family-pictures.ts --level 2 --week <n> --cards <folder> [--forge <folder>] [--partial] [--check]`. It has a `USAGE` text and the exit codes of the other storytime scripts: 0 for success, 1 for a data error, 2 for a usage error. `main(argv)` runs only when the file is the entry point. It exports `renderFamilyCardJpeg(source): Promise<{ jpeg: Buffer; quality: number }>` (H5 render and H6 encode). It does these steps in this order:
   - It reads the week file, `card-pictures.json`, and the MANIFEST of each folder. It finds the source of each family word by H3.
   - It checks every source by H8 before the first write. Without `--partial`, a Forge word with no file stops the script with exit 1. With `--partial`, the script skips that word and prints `skip <word>: no Forge file`.
   - With `--check`, it prints one line for each word (word, source kind, source name, `ok` or the failed rule) and stops. It writes no file. The exit code is 0 when every requested source passes, else 1.
   - It writes the JPEGs by H2 and H6, the provenance file by H7 (all lines of the week that have a file, also the lines of an earlier run), and the `"file"` lines into the week file.
   - Pins of the test strategy (`test-strategy.md` section 5.2, plan updates P7; accepted by the orchestrator on 2026-11-07). They also bind FR 1 and FR 3 where they name a function of those items:
     - S4 (nothing to map): `setFamilyPictures` throws `family picture: nothing to map` when it plans 0 pictures (for example w08, or a `--partial` run where every word is skipped). `main` returns 1 and writes no file. A repeat run that plans N pictures and changes 0 bytes is a success (exit 0).
     - S8 (export names): `setFamilyPictures(options: { weekFile: string; contentRoot: string; cardsFolder: string; cardRowsFile?: string; forgeFolder?: string; partial?: boolean; check?: boolean; render?: (source: PatchOrDotsSource) => Promise<{ jpeg: Buffer; quality: number }> }): Promise<{ mapped: number; skipped: string[]; lines: string[] }>`. `PatchOrDotsSource` is the `patch` and `dots` part of `StorytimeFamilyPictureSource`, the input type of `familyCardPictureHtml`. The default `render` is `renderFamilyCardJpeg`. `main(argv)` reads the shipped paths only (`STORYTIME_ROOT`, `l2/print/card-pictures.json`) and the flags of this item. Tests that write use `setFamilyPictures` on temporary copies. Tests of `main` cover exit code 2 (usage), `--help`, and `--check` on the shipped week with a temporary card folder (no write). In `check` mode the function returns the lines and writes nothing.
     - S11 (error text): every H8 and H3 failure throws an `Error` whose text holds the file name and one of these rule tokens: `not in MANIFEST`, `SHA-256 differs from MANIFEST`, `not a PNG`, `not 8-bit sRGB with 3 channels`, `has an alpha channel`, `not 1500 x 1500`, `-line- name`, `no color file`, `two color files`. The module error for two Forge files starts with `family picture:`. Tests match the file name and the token (case-insensitive).
     - S12 (the `--check` output): one line for each requested word, with the fields `word`, `kind`, `source name`, and `ok` or the rule token, separated by one tab. A Forge word with no file is a failed line (`no color file`) with or without `--partial`. The exit code is 0 only when every line is `ok`.
     - S13 (provenance of a skipped word): a `--partial` run keeps the existing provenance lines of the words that already have a file and that the run skips. The file holds one line for each word of the week that has a file after the run, sorted by output path.
     - S14 (order of the lines): the sort is by output path (`localeCompare`, as D5). The tests hold the expected word order by hand, for example w02: eight, five, four, nine, one, seven, six, ten, three, two.
     - S15 (the PNG rules): the H8 machine rules and the FR-9 content rules, as H8 states them.
     - S16 (hex case): `familyCardSourceName` writes the six hex digits in upper case, also when the input is lower case (`#e53935` gives `card-kit-patch-red-E53935`).
     - S17 (path function): `storytimeFamilyPicturePath` throws for a word that is not `[a-z]+` (for example `Nan`, `a1`, `a/b`, `..`, or an empty string), and for a week below 1 or above 99.
     - S18 (escape): `familyCardPictureHtml` escapes `&`, `<`, `>`, and `"` in the word. A word `a"><script>` gives no `<script` in the output.
     - S19 (tests do not name track paths): the two Phase 10 test files hold no `measure/tracks/` string. They read `content/storytime/**`, the card folder, and the Forge folder.
     - S20 (the existing `file` value): a week file that holds a `file` line with another value changes on that line only (FR 3). A week file that holds the same value is not rewritten (its bytes and its mtime stay).
3. **Week file edit.** The rules of Phase 7 FR-2 apply to the family image objects: a `"file"` line after the `"caption"` line, the indent of the `caption` line, no other byte. When `file` is present with the same value, the script changes nothing. When `file` is present with another value, the script changes the value on that line only.
4. **Repeat run.** A second run with the same inputs changes no byte of the JPEGs, of the provenance file, or of the week file.
5. **Check** `family-pictures` in `dashboard/scripts/storytime/check-weeks.ts` by H9.
   - S9 (check export): `checkFamilyPictures(week: any, contentRoot = STORYTIME_ROOT): { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string } | undefined`, exported from `check-weeks.ts`. The id is `family-pictures`. The label is exactly `The family-word pictures named in the package exist`. The CLI pushes the row into the report after the `book-pictures` row.
   - S10 (check details): a missing file gives `fail` with the detail `missing: <paths joined by ", ">`. No `file` (absent, or an empty string) gives `warn` with the detail `no file: <words joined by ", ">` in document order. A week with both gives `fail` with the detail `missing: <paths>` only (fail wins). A week with no family word that has an `image` gives `undefined`. A pass has no detail.
6. **Tests.** Red 1 (`storytime-package-raster.test.ts`): the parity rule of H5 for 17 words; the `ten` markup (10 dots, rows of 5 and 5, numeral `10`); `renderFamilyCardJpeg` of `red`, `purple`, `one`, and `ten` gives a progressive JPEG, sRGB, 800 x 800, 150 KB or less; the center pixel of a patch is within 12 of its hex value in each channel; the pixel at (6, 6) is within 8 of white; the source names of H7. Red 2 (`storytime-package-family.test.ts`): the 51-row table of this addendum, written by hand; the script on a temporary copy of w01 with a temporary card folder and a temporary Forge folder; the exit 1 cases of H8 with no write; `--partial` and `--check`; the H2 diff form; the repeat run; the four cases of H9 on copies.
   - Amendment (plan updates P6; pins S2, S3, S5, S7; accepted 2026-11-07): Red 1 also holds R1-10 and R1-11 of `test-strategy.md` section 5.4.
     - S7 (R1-10, the render-level dot count): decode the JPEG of `one`, `nine`, and `ten` with `sharp(...).raw()`, take the pixels with a luminance below 128, label the connected components, and count the round components (width 90 to 120 px, aspect 0.9 to 1.1). The counts are 1, 9, and 10. For `ten`, the centers fall in two rows (y within 6 px) of 5 and 5.
     - S3 (R1-11, determinism): two calls of `renderFamilyCardJpeg` for `seven` give byte-equal JPEG buffers. This is the live proof under AC10-8 for the patch and dots path.
     - S2 (Chrome timeouts): each test that renders gets a timeout of 90 000 ms (one `renderFamilyCardJpeg` call). The live w03 case of Red 2 gets 240 000 ms. A timeout in a gate is run again once alone under the heavy lock. Both captures stay on record. A second timeout is a defect.
     - S5 (outside folders): the shipped cases read the card folder and the Forge folder from constants with the default paths of this addendum. An absent folder fails the test with the message `Missing folder: <path>`. The test never skips. `--cards` and `--forge` carry the paths in script runs.
7. **Hand-off.** The 7 revision folders of H12 and one status line to the PM by 2026-11-12.

### Acceptance Criteria

- AC10-1: this command prints `51/51`: `node -e 'const fs=require("fs");let t=0,ok=0;for(let n=1;n<=8;n++){const w=JSON.parse(fs.readFileSync("content/storytime/l2/w0"+n+".json","utf8"));for(const x of w.focus.family.words){if(!x.image)continue;t++;const f=x.image.file;if(f&&/^l2\/media\/w0[1-7]\/family\/[a-z]+\.jpg$/.test(f)&&fs.existsSync("content/storytime/"+f))ok++;}}console.log(ok+"/"+t)'` (run in the repository root).
- AC10-2: `find content/storytime/l2/media -path '*/family/*.jpg' | wc -l` prints 51, and `find content/storytime/l2/media -path '*/family/*.jpg' -size +150k | wc -l` prints 0. The shipped case of `storytime-package-family.test.ts` holds that each of the 51 files is a progressive JPEG, sRGB, 800 x 800.
- AC10-3: in `content/storytime/`, `for n in 1 2 3 4 5 6 7; do awk -F'\t' '{print $2"  "$1}' l2/media/w0$n/family/pictures.sha256; done | sha256sum -c --quiet` exits 0. `cat l2/media/w0*/family/pictures.sha256 | wc -l` prints 51. In field 3, `grep -c -- '-line-'` prints 0, `grep -c '^card-kit-patch-'` prints 7, `grep -c '^card-kit-dots-'` prints 10, and `grep -c '\.png$'` prints 34.
- AC10-4: the content commits of a week together change its week file by `2N` insertions and `N` deletions in `git show --numstat --format=`, where N is the family count of that week (w02: 20 and 10). Each changed line is a `"file"` line or a caption line that gains a comma. Every caption value is the same as before.
- AC10-5: `cd dashboard && npx tsx scripts/storytime/check-weeks.ts --level 2` shows `family-pictures` with the status `pass` for st2/1 to st2/7 and shows no `family-pictures` row for st2/8. A copy with one named file missing gives `fail` with the path. A copy with one family image without `file` gives `warn` with the word.
- AC10-6: the parity rule of H5 holds for the 9 number words and the 8 color words (Red 1 test). A mutant that changes one dot radius or one hex value in the new module fails the test.
- AC10-7: the `ten` card has exactly 10 dots in 2 rows of 5 and the numeral `10`. A mutant that gives `ten` 9 dots fails the test.
- AC10-8: a second run of the script on each week changes no byte: the SHA-256 of the week file, of `family/pictures.sha256`, and of each family JPEG are the same before and after.
- AC10-9: each `RED_TEST_COMMAND` fails only on the new assertions of its Red file. After each Green, `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass.
- AC10-10: the orchestrator opens the 51 JPEGs on one contact sheet and compares each with its source: the right word, color (not line art), the right dot count, and the right color (person-checked).
- AC10-11: in each revision folder, `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c --quiet -` exits 0; `cmp` of the week file with `git show <sha>:content/storytime/l2/w<nn>.json` exits 0; `grep -c '^# Changed since ' MANIFEST.txt` prints 1; and the file list of that section equals the list of paths whose SHA-256 differs between the old and the new MANIFEST (`join` of the two sorted file lists).
- AC10-12: the PM has one status line with the 7 folder paths and the commit (peer-report).

### Blast radius of the addendum

- New files: `lib/storytime/family-pictures.ts`, `scripts/storytime/set-family-pictures.ts`, `__tests__/storytime-package-raster.test.ts`, `__tests__/storytime-package-family.test.ts`.
- Files that change: `scripts/storytime/check-weeks.ts` (the H9 check); `content/storytime/l2/w01.json` to `w07.json` (51 `"file"` lines); the new media under `content/storytime/l2/media/w0<n>/family/` (51 JPEGs and 7 `pictures.sha256` files).
- Test files that can change: `__tests__/storytime-loops-content.test.ts` (`withoutNewFields` must also drop `focus.family.words[].image.file`, as E8; a file of the loops track, which has uncommitted work in `lib/storytime/schema.ts` and `lib/storytime/checks.ts` now) and `__tests__/storytime-print-v15.test.ts` (its 5 pinned lines of `w02.json` lie after the family block, so they move by 10). The Red 2 author runs `grep -rlnE "family-pictures|focus\.family|family\.words|image\??\.file|cover\??\.file|pictures\.sha256|AX-lines" dashboard/__tests__` (plan update P3: the older pattern `image\.file` missed `image?.file` in `storytime-loops-content.test.ts`), lists each hit with "changes" or "no change" and the reason, and adds each changed file to the GREEN command.
- `lib/storytime/print/card-kit.ts`, `lib/storytime/schema.ts`, the print files, and the Monorepo do not change.
- The repository is public. The pictures are not test items.

### Out of Scope

- A change of the print card kit: the 9 number cards, the A6 rebuild, and the 31 card pictures of the print (print track).
- The Forge request and its spend (PM and Forge). Workbooks writes no Forge prompt in this phase.
- A change of any approval, of `meta.status`, or of a w08 family word.
- The Monorepo receipt of the revisions (at-home Phase 2) and the Monorepo test pins of the missing count.
- The family pictures of unit 2 (weeks 9 to 16).

## Addendum 2026-11-07, Phase 11: word clips and the song video lead-in (2026-11-07 to 2026-11-14)

Author model: claude-code/claude-opus-5-5[1m]

### Overview

This phase gives each word of the read-along books and the decodable books its own recorded clip. A tap on a word in the app then plays that clip, not a cut of the sentence audio. The phase also adds the field `song.videoLeadInSeconds` where a song video ships. With this field, the app lights each lyric line at the correct time while a song video plays. Both items block the at-home release of 2026-11-20. The phase delivers `w01-storytime-app-package-r4` by 2026-11-10 and `w02-storytime-app-package-r3` to `w07-storytime-app-package-r3` by 2026-11-14.

Daniel's words (2026-11-07 13:53 ICT; `~/Desktop/advantage-pr/measure/pm-log.md` line 2299), verbatim:

> "It is not possible to slice up the sentence audio the way you're trying to do it. You need to use the individual words that we generated."

His note of the same row, verbatim:

> "In the song, the highlighted lines under the video are about one line ahead of the part of the song that is currently playing"

The Monorepo answer and the PM defaults (pm-log line 2300, 2026-11-07 13:59 ICT), verbatim:

> "song cause: both w01 videos start the singing 3.000 s after song.mp3 (silencedetect; 85.376 vs 78.367 s); lyric times fit the mp3; app lights lines from the video time → one line ahead. Word clips: w01 package names none; bank wa-<word>.mp3 covers 11 of 23; missing ben, i, may, mia, pip, your (book 0), a, and, can, neck, nod, nurse (book 1). PM: defaults accepted (song.videoLeadInSeconds; books[].audio.wordClips, no clip = no tap target); Monorepo tasks 1.10 + 1.11 start now; Workbooks asked: wordClips + missing clips (same voice, citation forms; spend only inside its unit 1 approval, else count + cost to PM for Daniel's Go) and videoLeadInSeconds measured per week; w01 by 11-10, w02-w08 by 11-14"

The Monorepo count "11 of 23" agrees with the table below. w01 has 23 book keys, because `nan` is in both books. 11 of these keys have a bank clip.

### Facts (measured 2026-11-07)

- The word bank `content/storytime/words/` holds 98 words: `wa-<word>.wav`, `wa-<word>.mp3`, and `manifest.json` (commit `ba2b72a3`). The manifest gives the bank `storytime-words-l2u1-2026-10-27`, the model `speech-2.8-hd`, the voice `English_captivating_female1`, and the speed 0.9. Its normalisation text is "peak -3 dBFS, edge silence trimmed to 80 ms, 32 kHz mono 16-bit".
- The manifest approval, verbatim: "Approved, American, ox and axe correct" (Daniel, 2026-10-27). Each of the 98 rows has the keys n, id, word, file, mp3, sources, weeks, take, len_s, peak_dbfs, recognized, note, and sha256.
- The `sha256` value of each row is the SHA-256 of the WAV file (98 of 98). No row holds the SHA-256 of the mp3 file.
- The 98 WAV files are 32 kHz, mono, 16-bit, and each has the peak sample 23197 (98 of 98). 23197 is round(32767 × 10^(-3/20)), so the peak is -3.0 dBFS.
- The 98 mp3 files are 32 kHz, mono, 128 kb/s (98 of 98). The tag `encoder=Lavf62.3.100` shows an ffmpeg encode. The installed ffmpeg is 8.0.1.
- The edge silence of the 98 WAV files is not one exact rule. At a level of -50 dBFS, the start edge is 80 ms (±1 ms) in 70 of 98 files. The end edge has a median of 34 ms.
- The manifest text is the Python form `json.dumps(manifest, indent=1)` with one final newline: that form equals the file byte for byte. The Node form `JSON.stringify(manifest, null, 1)` does not equal it, because Node writes `-3.0` as `-3`.
- No code of this repository reads `content/storytime/words/manifest.json`. The script that made the bank on 2026-10-27 is not in a repository (pm-log line 458: a faster-whisper venv at `~/.local/share/storytime-word-audio-venv`). That venv has faster-whisper 1.2.1. The plain `python3` has no `faster_whisper` module.
- The book audio tools exist: `dashboard/scripts/storytime/book-audio.ts` (mmx clips, 3 takes at most) and `dashboard/scripts/storytime/word-times.py` (faster-whisper, the local `small` model). `dashboard/lib/media/audio.ts` exports `parseWav`, `writeWav`, `trimSilence`, `longestPause`, and `speechArgs`.
- `mmx speech synthesize --help` gives the default model `speech-2.8-hd`, the default sample rate 32000, the default bit rate 128000, and the default channel count 1.
- The book words: the `word` values of `books[].audio.sentences[].words[]` and `books[].audio.slowSentences[].words[]`. No such value holds a character other than a letter. 32 values start with a capital letter (for example `I`, `A`, `Pip`, `Ben`).
- Weeks 1 to 7 have 2 books each. w08 has `books: []` and no `song`.
- The 4 w01 song files `song.mp4`, `song-phone.mp4`, `song-poster.jpg`, and `song-phone-poster.jpg` are not in git (`.gitignore` lines 26 to 30). The comment of that block names `video/storytime-song/scripts/render.mjs` as the tool that makes the videos again. The work-tree videos have the SHA-256 values of the r2 and r3 folders (`4c88951f…` and `74ccefed…`).
- Weeks 2 to 7 have `song.mp3` only, because Daniel stopped the song videos on 2026-10-24. Their mp3 lengths are 71.7 s to 74.6 s.
- `BookAudioSchema` and `SongSchema` (`dashboard/lib/storytime/schema.ts` lines 147 to 155 and 227 to 266) are not strict. So a parse today removes an unknown key such as `wordClips` from the output.
- `check-weeks.ts` has the rows `song-media` and `book-audio`. No row reads a word clip.

### The lead-in measure (2026-11-07)

The command form is `ffmpeg -hide_banner -nostats -i <file> -vn -af silencedetect=noise=<n>:d=<d> -f null -`. The lengths are: `song.mp3` 78.367 s, `song.mp4` 85.376 s, and `song-phone.mp4` 85.376 s.

| noise, d | mp3 first sound | `song.mp4` first sound | `song-phone.mp4` first sound | Difference (classroom, phone) |
|---|---|---|---|---|
| -40 dB, 0.05 s | 0.0854649 | 3.085458 | 3.085458 | 3.000, 3.000 |
| -40 dB, 0.02 s | 0.0854649 | 3.085458 | 3.085458 | 3.000, 3.000 |
| -30 dB, 0.05 s | 0.0856689 | 3.085667 | 3.085667 | 3.000, 3.000 |
| -50 dB, 0.05 s | 0.0843764 | 3.084812 | 3.083708 | 3.000, 2.999 |
| -40 dB, 0.1 s | 0 (not detected) | 3.085458 | 3.085458 | 3.085, 3.085 |

- The mp3 starts with 85 ms of quiet (-91 dB for the first 40 ms). A minimum duration of 0.1 s does not detect a quiet part of 85 ms, so that value gives the false lead-in 3.085.
- The second sound at -40 dB and 0.05 s: mp3 0.654717, `song.mp4` 3.655167 (3.000450), and `song-phone.mp4` 3.654812 (3.000095).
- The silence edges at -40 dB and 0.1 s agree: the mp3 edge 0.123107 and the video edge 3.123104 differ by 3.000.
- The first sound of each mp3 of weeks 2 to 7 (-40 dB, 0.05 s): w02 0.093, w03 0.098, w04 0.123, w05 0.094, w06 0.092, w07 0.085. These weeks have no video, so they get no lead-in.

### The book words of weeks 1 to 7

A key is the K2 form of a book word. "Files" counts the distinct keys of a week, because one file serves both books.

| Week | Keys, book 0 | Keys, book 1 | Keys | Files | In the bank | Missing | Missing first in this week |
|---|---|---|---|---|---|---|---|
| 1 | 12 | 11 | 23 | 22 | 10 | 12 | 12: a, and, ben, can, i, may, mia, neck, nod, nurse, pip, your |
| 2 | 19 | 4 | 23 | 23 | 8 | 15 | 11: balls, birds, cakes, ducks, friends, how, kites, many, no, oh, suns |
| 3 | 10 | 10 | 20 | 20 | 11 | 9 | 5: get, in, is, it, the |
| 4 | 12 | 14 | 26 | 24 | 14 | 10 | 3: house, my, this |
| 5 | 12 | 16 | 28 | 28 | 17 | 11 | 4: have, off, saw, with |
| 6 | 12 | 14 | 26 | 22 | 15 | 7 | 2: he, see |
| 7 | 13 | 14 | 27 | 24 | 13 | 11 | 2: run, yes |
| Sum | | | 173 | 163 | | | 39 |

- Distinct keys of weeks 1 to 7: 101. 62 of them have a bank row, and 39 have no bank row.
- The sums: keys 23 + 23 + 20 + 26 + 28 + 26 + 27 = 173; files 22 + 23 + 20 + 24 + 28 + 22 + 24 = 163; new clips 12 + 11 + 5 + 3 + 4 + 2 + 2 = 39.
- The TTS characters of one take for each new clip (K8 texts): w01 37, w02 47, w03 12, w04 11, w05 14, w06 5, w07 6. The sum is 132. With 3 takes for each word, the maximum is 396.

### The Monorepo receiver (read only, 2026-11-07)

The Monorepo HEAD is `bdda3dd18`. `git grep` finds no `wordClips` and no `videoLeadIn` in `apps/storytime`.

- `apps/storytime/lib/contracts/week.ts`: `bookAudioSchema` (lines 109 to 117) and `songSchema` (lines 240 to 253) are `passthrough`, so the receiver keeps the two new fields. The `mediaPath` rule (line 35) is the allowlist of Phase 10, with a maximum of 200 characters.
- `apps/storytime/scripts/receive-weeks.ts`: `mediaPathsOf` (line 191) walks every string of a week and lists each string with a media extension. So it lists each `wordClips` value. The media coverage test (Phase 10, finding F13) needs `mediaOf` (line 80) to list each such path. That change is Monorepo work (tasks 1.10 and 1.11 of pm-log line 2300).
- `apps/storytime/app/[locale]/st/[level]/[week]/reader.tsx` line 117: `mediaUrl(base, file)` joins the media base and the file value. So a media value must be relative to the content root, as every media value of the package is today.

### Decisions (pinned before Red; the Red and Green roles do not guess)

The letter K names the decisions of this phase.

- K1 (scope): the book words of w01 to w07, 2 books in each week. w08 has no book and no song, so it gets no field and no revision. No book audio file, song audio file, video file, picture, or print file changes. The 98 bank clips do not change.
- K2 (the key of a book word): the key is computed from each `word` value of `sentences[].words[]` and `slowSentences[].words[]` of a book, in these steps:
  1. Normalise the text to NFC. Change U+2019 and U+2018 to U+0027 (the straight apostrophe).
  2. Change the text to lower case (`toLowerCase()`).
  3. Remove each character other than `a` to `z` and the apostrophe from the start and from the end of the text. This step removes punctuation and quotation marks.
  4. If no character stays, the word has no key. It gets no clip and no tap target.
  5. The key must match `^[a-z]+('[a-z]+)*$`. Else the mapper stops with exit 1 before any write, with the token `not a word key`. A hyphen, a digit, or a letter with an accent stops the mapper.
  - `I` gives the key `i`, and `A` gives `a`. A name gives its lower-case form: `Pip` gives `pip`. One key serves the word in each letter case.
  - The app must compute the key of a tapped word with the same rule (K17).
- K3 (the value of a key): the value is the path relative to `content/storytime/`, as every media path of the package is: `l<level>/media/w<nn>/words/wa-<stem>.mp3`. `<nn>` is the two-digit week. `<stem>` is the key with each apostrophe removed (`don't` gives `dont`). The file is in `content/storytime/l2/media/w<nn>/words/`, so each week ships its own clips. If two keys of one week give the same stem, the mapper stops with exit 1 (`two keys, one file`).
- K4 (the map of a book): `books[i].audio.wordClips` holds one key for each distinct key of that book, from both speeds, and no other key. A key of both books of a week is in both maps, with the same value, and one file serves both books.
  - The keys are sorted by code point.
  - The mapper writes the map by a text edit. The line that closes the last key of `audio` gains a comma. Then come the line `"wordClips": {`, one line `"<key>": "<value>"` for each key, and the line `}`.
  - The key lines have the indent of the last key of `audio` plus 2 spaces. The two other lines have the indent of that key. Each key line except the last ends with a comma. No other byte changes.
  - In each shipped book, `slowSentences` is the last key of `audio`. So its closing `]` gains a comma, and the edit adds the key count plus 2 lines for each book.
  - A repeat run with the same map changes nothing: the bytes and the modification time stay. A run with another map replaces only the `wordClips` block.
- K5 (the bank is the single source): each clip of a week is a byte copy of `content/storytime/words/wa-<stem>.mp3`. A week never holds a clip that the bank does not hold. A new clip goes into the bank first: its WAV, its mp3, and its manifest row. The mapper never makes audio.
- K6 (the bank row of a new clip): the keys come in this order: n, id, word, file, mp3, sources, weeks, take, len_s, peak_dbfs, recognized, note, sha256, text, added.
  - `n` continues from 99. `id` is `wa-<stem>`. `word` is the key. `file` is `wa-<stem>.wav`, and `mp3` is `wa-<stem>.mp3`.
  - `sources` is `book`. `weeks` lists the weeks of the level whose books hold the key, joined by `;` (for example `1;3;4;5;6;7` for `a`).
  - `take` is the number of the take that stays. `len_s` is the length in seconds, rounded to 3 decimals. `peak_dbfs` is `-3.0`.
  - `recognized` and `note` follow K9. `sha256` is the SHA-256 of the WAV file, as in the 98 rows.
  - `text` is the text sent to TTS. The row holds it only when it differs from the key (K8). `added` is the date of the take (`YYYY-MM-DD`).
  - The top-level keys of the manifest do not change. The `approval` object of 2026-10-27 covers only the rows with no `added` key. The rows with `added` wait for Daniel's listen check (K10).
  - The bank maker adds each row by a text edit before the `]` that closes `items`, in the Python form of the file. A float keeps its Python text (`-3.0`, not `-3`).
  - After the edit, this command prints `True`: `python3 -I -c 'import json,sys;t=open(sys.argv[1]).read();print(json.dumps(json.loads(t),indent=1)+"\n"==t)' content/storytime/words/manifest.json`. The git diff of the file adds lines only, except the `}` of the last old row, which gains a comma.
- K7 (the clip settings, from the bank): one mmx call for each take: `mmx speech synthesize --model speech-2.8-hd --text <text> --voice English_captivating_female1 --speed 0.9 --language English --format wav --sample-rate 32000 --channels 1 --out <file>`. Then these steps, in this order:
  1. Scale the take so that its largest absolute sample is 23197 (each sample `Math.round(x * 23197 / peak)`).
  2. Trim it with `trimSilence(samples, 32000, { threshold: 103, padMs: 80 })` of `lib/media/audio.ts`. 103 is the largest sample below -50 dBFS (32767 × 10^(-50/20) = 103.6). The step keeps 2560 samples (80 ms) at each edge, or fewer if the take has fewer.
  3. Write the WAV: 32 kHz, mono, 16-bit.
  4. Encode the mp3 with `ffmpeg -y -loglevel error -i <wav> -codec:a libmp3lame -b:a 128k <mp3>`: 128 kb/s, 32 kHz, mono.
  - The start edge of a new clip is 80 ms at -50 dBFS, as in 70 of the 98 old clips. The end edge is also 80 ms, and the old clips have a median end edge of 34 ms. A tap clip does not need a shorter end edge.
- K8 (the TTS text and the citation form): the text is the first written form of the key in the books of the week that the bank maker runs for (`--week`). The order is book, speed, sentence, and word. The K2 step 3 characters are removed. Examples: `Ben`, `May`, `Pip`, `nurse`.
  - A key with no form in the books of that week is not made by that run, and it keeps the text of its bank row (review F3). The Clips tasks run the weeks in the order w01 to w07, so each new key gets the first form of the first week that uses it.
  - Two keys have a fixed text for the citation form. `a` uses the text `uh` (/ə/). `i` uses the text `I` (/aɪ/).
  - If the heard text of an `i` take is a number (for example `one` or `1`), the next take uses the text `eye`.
  - The row of each such clip holds its text in `text`. The texts go on the listen list (K10).
- K9 (the heard check): the bank maker runs `scripts/storytime/word-times.py` on each take, with `$WHISPER_PYTHON` (default `~/.local/share/storytime-word-audio-venv/bin/python`; `book-audio.ts` keeps its default `python3`). The script uses faster-whisper, the local `small` model, int8, beam 5, temperature 0, and `language="en"`.
  - The plain `python3` has no `faster_whisper` module, so the default is the venv. The Clips tasks also set `WHISPER_PYTHON=~/.local/share/storytime-word-audio-venv/bin/python`.
  - The venv check (review F4): before the first mmx call of a run without `--dry-run`, the bank maker checks the interpreter. The interpreter file must exist, and `<interpreter> -c 'import faster_whisper'` must exit 0.
  - If the check fails, the bank maker stops with exit 2 and the message `word bank: no faster-whisper venv at <path>`. `<path>` is the interpreter path. The run makes no mmx call and writes no file.
  - The heard text is the recognized words, joined with no space, in lower case. Each character other than `a` to `z`, `0` to `9`, and the apostrophe is removed.
  - A take passes when the heard text equals the key. It also passes when the heard text is in the variant list of the key, `WORD_CLIP_HEARD_VARIANTS` of FR 2: `a`: `uh`, `ah`; `i`: `eye`, `aye`; `in`: `inn`; `no`: `know`; `oh`: `o`, `owe`; `see`: `sea`; `your`: `you're`, `yore`.
  - A pass by the variant list writes the note `homophone variant: heard '<x>'`, the form of the `an` and `mat` rows. `recognized` holds the heard text.
  - A take fails when the heard text is another text, or when its longest inner pause is above 0.6 s (`longestPause` and `MAX_PAUSE_S` of `lib/media`). The bank maker then makes another take.
  - A word gets 3 takes at most. If all 3 takes fail, the third take stays with the note `heard '<x>' in 3 takes`, and the clip goes on the listen list (K10).
- K10 (the listen list and the approvals): the clips of `a` and `i` go on Daniel's 11-16 listen list as look points. Each clip with a note also goes on the list. Each item names the file path and the text sent. The PM line of each package names the items.
  - All 39 new clips wait for Daniel's listen check. They do not stop the hand-off (as E6 and H10). If Daniel refuses a clip, a later revision changes it.
  - Each approval and `meta.status` of each week stay as they are.
- K11 (the spend and its authority): the authority has two parts. The first part is Daniel's go of 2026-10-24 for the unit 1 book audio with mmx (plan Phase 5, S30). The second part is his words of 2026-10-27 (pm-log line 520), verbatim: "My Minimax subscription is basically barely used and so text to speech and image generation are essentially free so I want you to brainstorm areas where we can use more audio and image support".
  - The PM line of 2026-11-07 (pm-log line 2300) permits spend only inside the unit 1 approval. The orchestrator records that the 39 clips fit: 132 characters for one take each, and 396 at most with 3 takes.
  - The cost is about 0.05 USD at the list price and 0 USD inside the MiniMax plan. The list price of the 2026-10-27 run was at most 0.18 USD for 1,800 characters (pm-log line 446). So 500 characters cost at most 0.05 USD.
  - The hard stop is 500 characters for the phase, all takes included. The bank maker counts the characters of each call. It stops before a call that would take the run above `--max-chars` (default 300).
  - If mmx refuses a call for quota or for price, the run stops with exit 1. The run uses no other voice, model, or provider.
- K12 (the check `word-clips`): `checkWordClips(week, contentRoot = STORYTIME_ROOT)` in `dashboard/scripts/storytime/check-weeks.ts`. The CLI adds its row after the `family-pictures` row. The label is exactly `The book word clips named in the package exist and match the word bank`. The check reads the bank manifest `content/storytime/words/manifest.json`.
  - The K3 path of a key uses `week.meta.level` and `week.meta.week` (`StorytimeMetaSchema`). A week with no `meta` gets no row (review F1).
  - No row for a week with no book (w08).
  - `fail` when a key has a fault, with the detail parts in this order, joined by `; `: `missing: <paths>` (no file); `differs from bank: <paths>` (the SHA-256 of the clip differs from the SHA-256 of the bank mp3 of the row with that key); `no bank row: <keys>`; `not a book word: <keys>` (a key that no word of its book gives); `bad path: <paths>` (a value other than the K3 path of its week and key).
  - `warn` when a book word has no key in the map of its book, or when the book has no map. The detail is `no clip: <keys>`, with each key once, in document order.
  - `fail` wins over `warn`, and the detail of a `fail` holds only the fail parts. `pass` has no detail.
  - The `differs from bank` compare hashes the bank mp3 file (the `mp3` value of the row, in `content/storytime/words/`) at run time. The row `sha256` is the WAV hash, so the check does not compare a clip with it. The 98 rows do not change (review F2).
  - The status `warn` for a word with no key keeps the `PROJECT_CHECKS` of the print, unit 2, and cover-options tracks at exit 0. This applies between the Green 1 commit and the content commits (rule F9).
- K13 (the lead-in): `song.videoLeadInSeconds` gives the seconds from the start of a song video to the same sound in `song.mp3`. The app adds it to each `song.times` value when it plays a video.
  - The measure: run `ffmpeg -hide_banner -nostats -i <file> -vn -af silencedetect=noise=-40dB:d=0.05 -f null -` on `song.audio` and on each of `song.video`, `song.videoPhone`, and `song.karaoke` that the song names.
  - The sound onsets of one file: if the first silence starts at 0.001 s or less, its `silence_end` is the first onset; else the first onset is 0. The next `silence_end` is the second onset. A `silence_end` within 0.001 s of the length of the file is not an onset.
  - The lead-in of one video is its first onset minus the first onset of the mp3. The second onsets must give a difference within 0.010 s of that value. Else the script stops with exit 1.
  - The videos of one song must give lead-ins within 0.010 s of each other. Else the script stops with exit 1.
  - The value is the lead-in of `song.video`, else of `song.videoPhone`, else of `song.karaoke`. It is rounded to 3 decimals (`Math.round(x * 1000) / 1000`) and written as `String(value)`. So 3.000 is written `3`.
  - The field exists only when the song names a video. An absent field means no video. Today only w01 has the field, with the value 3 (3.000 measured).
  - The text edit adds the line `"videoLeadInSeconds": <value>` with the indent of the line before it. That line is the `"videoPhone"` line, else the `"video"` line, else the `"karaoke"` line. The comma rules of JSON apply. In w01, the `"videoPhone"` line is not the last key, so the new line ends with a comma and no other line changes.
  - A repeat run changes nothing. A run with another value changes that line only.
  - The w01 videos are not in git. The script reads the work-tree videos only after their SHA-256 equals the lines of the `w01-storytime-app-package-r3` MANIFEST.
  - A new render of a song video (for example by the song video track) needs a new measure before its package. The package task runs the measure with no write and compares it with the field.
- K14 (the check `song-lead-in`): `checkSongLeadIn(week)` in `check-weeks.ts`, with its row after the `word-clips` row. The label is exactly `The song video lead-in is set for each song video`.
  - No row when the song names no video and has no field (w02 to w07), or when the week has no song (w08).
  - `pass` when the song names a video and has the field. `warn` with the detail `no lead-in` when the song names a video and has no field. `fail` with the detail `lead-in without video` when the song has the field and names no video.
  - The check does not decode a video. The measure script (K13) owns the value.
- K15 (the schema): two optional fields in `dashboard/lib/storytime/schema.ts`, each with JSDoc:
  - `BookAudioSchema.wordClips: z.record(z.string().regex(/^[a-z]+('[a-z]+)*$/), z.string().min(1)).optional()`.
  - `SongSchema.videoLeadInSeconds: z.number().finite().min(0).optional()`.
  - The parse output keeps both fields. A week file without them parses as before.
  - `schema.ts` is shared with the loops track. Before the Green 1 edit, `git status --porcelain dashboard/lib/storytime/schema.ts` must print nothing. The Green 1 commit stages the file by its path.
  - The test files that parse week files with `StorytimeWeekSchema` (41 files, `grep -rlE "StorytimeWeekSchema" dashboard/__tests__`) are the cross-track readers. Two of them change, because the shipped week files change:
    - `storytime-loops-content.test.ts`: `withoutNewFields` must also remove `books[].audio.wordClips` and `song.videoLeadInSeconds`. Line 504 compares the parsed shipped week with the parsed baseline week.
    - `storytime-print-v15.test.ts`: its 5 pinned lines of `w02.json` (2104, 4129, 4157, 4163, and 4215) come after the two `audio` blocks (lines 367 and 1127). So they move by the lines that the w02 edit adds: 27 by K4.
  - The Red 1 author runs the grep of FR 7 and records each hit with "changes" or "no change" and the reason.
- K16 (the package revisions): `w01-storytime-app-package-r4` (previous: r3) by 2026-11-10. `w02-storytime-app-package-r3` to `w07-storytime-app-package-r3` (previous: r2) by 2026-11-14. They are under `/home/daniebo/Desktop/handoff/`.
  - The H12 form and the nine checks of the Phase 10 Package build task apply, with the Phase 11 values of the plan.
  - The 4 w01 song files come from `w01-storytime-app-package-r3`, read only, with the SHA-256 values of its MANIFEST. They are not in git (the Phase 10 deviation from rule R4).
  - The E5 amendment of 2026-11-07 limits the sentence "No second folder follows the approval commit." to the Phase 9 folders. So these revisions need no new E5 line. Each revision is a new folder, and no existing folder changes (hand-off README rule 5).
  - The payload files: w01 51 + 22 = 73; w02 54 + 23 = 77; w03 50 + 20 = 70; w04 46 + 24 = 70; w05 52 + 28 = 80; w06 49 + 22 = 71; w07 50 + 24 = 74. The changed paths are the clips and the week file: 23, 24, 21, 25, 29, 23, 25. If another track first changes a week file or adds a media file, the "Changed since" list also names that change. The task line then records the measured counts.
- K17 (the receiver contract, for the PM line to Monorepo): `books[].audio.wordClips` (object: lower-case word -> relative file path) and `song.videoLeadInSeconds` (number, seconds).
  - The key is the K2 form of the tapped word. The value is relative to the content root, as `books[].audio.file` is (K3). A word with no key has no clip and no tap target.
  - The app adds `song.videoLeadInSeconds` to each `song.times` value while a song video plays. The app uses `song.times` as it is while `song.mp3` plays. An absent field means that the song has no video.
- K18 (lane and tests): the light lane. PM approval asked 2026-11-07; default light lane. The lane has no strategy role and no adversarial round. It has one spec review by a model family other than Anthropic, and one Review A by a model family other than the Green family.
  - One new test file: `dashboard/__tests__/storytime-package-clips.test.ts` (Red 1). The name matches the glob `__tests__/storytime-*.test.ts` of the shared `PROJECT_TESTS`, so rule R1 of Phase 10 applies.
  - No test writes into `content/storytime/`. Each script case runs on a temporary copy of a week, of the bank, and of the media folder.
  - The tests replace mmx and faster-whisper with fakes, so no test makes a paid call or loads a model. The ffmpeg cases use short files that the test makes in a temporary folder.
  - The test file holds no `measure/tracks/` string.

### Functional Requirements

1. **Schema.** The two fields of K15.
2. **Module** `dashboard/lib/storytime/word-clips.ts` (new and pure: no file access, no process, no network). Every export has JSDoc. The exports:
   - `bookWordKey(word: string): string | undefined` applies K2. It returns `undefined` when no character stays. It throws an `Error` whose text starts with `word clip:` and holds the word and `not a word key`.
   - `wordClipStem(key: string): string` removes each apostrophe.
   - `wordClipPath(level: number, week: number, key: string): string` gives the K3 path. It throws for a key that fails the K2 pattern and for a week below 1 or above 99.
   - `bookWordKeys(audio: { sentences?: readonly { words?: readonly { word: string }[] }[]; slowSentences?: readonly { words?: readonly { word: string }[] }[] }): string[]` gives the distinct keys of one book, sorted by code point.
   - `planWordClips(input: { level: number; week: number; books: readonly { audio: Parameters<typeof bookWordKeys>[0] }[] }): { maps: Record<string, string>[]; files: string[] }` gives one map for each book (K4) and the sorted distinct values. It throws `word clip: two keys, one file: <key>, <key>` for two keys with one stem.
   - `wordClipText(key: string, firstForm: string): string` applies K8: `uh` for `a`, `I` for `i`, else `firstForm`.
   - `WORD_CLIP_HEARD_VARIANTS: Readonly<Record<string, readonly string[]>>` holds the K9 list.
   - `heardText(words: readonly string[]): string` and `heardPasses(key: string, heard: string): { pass: boolean; note: string }` apply K9. A pass by the variant list gives the note `homophone variant: heard '<x>'`. An exact pass gives the note `""`.
   - `normalizeWordClip(samples: Int16Array, rate: number): Int16Array` applies K7 steps 1 and 2.
   - `appendBankRows(manifestText: string, rows: readonly WordBankRow[]): string` applies the K6 text edit. `WordBankRow` is the exported row type of K6.
   - `parseSilenceOnsets(ffmpegLog: string, lengthSeconds: number): number[]` gives the K13 onsets in order.
   - `videoLeadIn(audioOnsets: readonly number[], videoOnsets: readonly number[]): number` gives the K13 lead-in, rounded to 3 decimals. It throws an `Error` whose text starts with `lead-in:` when a list has fewer than 2 onsets, or when the guard of K13 fails.
3. **Bank maker** `dashboard/scripts/storytime/make-word-bank.ts --level <n> --week <n> [--max-chars <n>] [--dry-run]`. It has a `USAGE` text and the exit codes of the other Storytime scripts. The exit codes are 0 for success, 1 for a data error, and 2 for a usage error or an absent faster-whisper venv (K9, review F4). `main(argv)` runs only when the file is the entry point.
   - It exports `makeWordBank(options: { level: number; week: number; contentRoot: string; bankFolder: string; date: string; maxChars?: number; dryRun?: boolean; synthesize?: (text: string, wavFile: string) => void; recognize?: (wavFiles: readonly string[]) => string[][]; whisperPython?: string }): { made: string[]; chars: number; lines: string[] }`.
   - The default `synthesize` runs mmx by K7. The default `recognize` runs `word-times.py` by K9 and gives the words of each file.
   - `whisperPython` is the interpreter of the default `recognize`: `$WHISPER_PYTHON`, else the venv path of K9. When `recognize` is not given, the maker does the K9 venv check before the first `synthesize` call. A failed check throws an `Error` with the K9 message, and `main` gives exit 2 for that error. When `recognize` is given (a test fake), the maker does no venv check.
   - It lists each key of the books of the week that has no bank row, with its K8 text. It prints `chars: <n>` for one take of each key. With `--dry-run`, it then stops and writes nothing.
   - For each key, in sorted order, it makes the takes of K9 and writes the WAV and the mp3 into the bank folder by K7. Then it adds the row by K6. So an interrupted run keeps the rows of the finished words. A key that has a row is never made again.
   - It stops with exit 1 before a call that would take the characters of the run above `maxChars` (default 300). It also stops before the first call when one take of each key needs more than `maxChars`.
4. **Mapper** `dashboard/scripts/storytime/set-word-clips.ts --level <n> --week <n> [--check]`, with `USAGE`, the same exit codes, and the same entry guard.
   - It exports `setWordClips(options: { weekFile: string; contentRoot: string; bankFolder: string; check?: boolean }): { keys: number; files: number; removed: string[]; lines: string[] }`.
   - `keys` counts the key slots: one slot for each key of each book, so a key of both books counts two times (w01: 12 + 11 = 23). `files` counts the distinct clip paths of the week (w01: 22) (review F5).
   - It reads the week file and the bank manifest. It takes the level and the week number from `meta.level` and `meta.week` of the week file (review F1). Then it plans the maps by K2 to K4.
   - Before any write, it checks each key. The key has a bank row (`no bank row`), and the bank mp3 of the row exists (`no bank file`). The SHA-256 of the bank WAV equals the row (`bank SHA-256 differs`). A failure stops the script with exit 1, and the script writes no file.
   - With `--check`, it prints one line for each key of each book, and it writes no file. The line holds the book index, the key, the bank id, and `ok` or the rule token, separated by one tab. The exit code is 0 only when every line is `ok`.
   - Else it copies each bank mp3 to its K3 path, byte for byte. It does not write a file with the same bytes. It removes each `words/wa-*.mp3` file of the week that no key names, and prints `removed <path>`. It writes the maps by K4.
   - It parses the new week text with `JSON.parse` and `StorytimeWeekSchema.parse` before the first write.
   - A second run with the same inputs changes no byte.
5. **Lead-in script** `dashboard/scripts/storytime/measure-video-lead-in.ts --level <n> --week <n> [--write]`, with `USAGE`, the same exit codes, and the same entry guard.
   - It exports `measureVideoLeadIn(options: { weekFile: string; contentRoot: string; write?: boolean }): { leadIn: number | undefined; lines: string[] }`.
   - It applies K13. It prints one line for each video, with 4 fields separated by one tab. The fields are the file, the first onset of the video, the first onset of the mp3, and the lead-in with 3 decimals. Then it prints `lead-in: <value with 3 decimals>`.
   - A song with no video prints `no video`, exits 0, and writes nothing. A song with no `audio` stops with exit 1.
   - With `--write`, it sets the field by the K13 text edit, and it parses the new week text with `StorytimeWeekSchema.parse` before the write.
6. **Checks** `word-clips` (K12) and `song-lead-in` (K14) in `dashboard/scripts/storytime/check-weeks.ts`, both exported:
   - `checkWordClips(week: any, contentRoot = STORYTIME_ROOT): { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string } | undefined`. It reads `week.meta.level` and `week.meta.week` for the K3 path, and a week with no `meta` gets no row (K12, review F1).
   - `checkSongLeadIn(week: any): { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string } | undefined`.
7. **Tests** in `dashboard/__tests__/storytime-package-clips.test.ts` (Red 1), the cases C1 to C16:
   - C1 the K2 table, written by hand: `Hello` → `hello`; `I` → `i`; `A` → `a`; `Pip!` → `pip`; `"Yes,"` → `yes`; `don’t` (U+2019) → `don't`; `...` → `undefined`. `teddy-bear`, `a1`, and `café` throw `not a word key`.
   - C2 `wordClipStem` and `wordClipPath`: `wordClipPath(2, 1, "don't")` is `l2/media/w01/words/wa-dont.mp3`, and `wordClipPath(2, 1, 'i')` is `l2/media/w01/words/wa-i.mp3`. A bad key, week 0, and week 100 throw. The keys `its` and `it's` in one week make `planWordClips` throw `two keys, one file`.
   - C3 `bookWordKeys` of the shipped w01: book 0 gives the 12 keys of the table and book 1 the 11 keys, sorted. Both lists are written by hand.
   - C4 the counts of the table, written by hand: the keys 23, 23, 20, 26, 28, 26, 27 (173); the files 22, 23, 20, 24, 28, 22, 24 (163); w08 has no book.
   - C5 the schema: a `wordClips` map parses, and the parse output keeps it. An upper-case key and an empty value fail. `videoLeadInSeconds` 3 parses; -0.001 fails.
   - C6 the mapper on a temporary copy of w01 with a temporary bank of 22 rows: the result gives `keys` 23 and `files` 22 (review F5); 22 files, each byte-equal to its bank mp3; the two maps of K4; the K4 diff form (27 added lines and 2 changed lines); a second run changes no byte and no modification time; a stale `wa-*.mp3` file is removed.
   - C7 the mapper stops before any write: a key with no bank row, a bank row with no mp3, and a WAV whose SHA-256 differs from its row. Each error holds its token. No file changes.
   - C8 `--check` prints 23 lines for the copy of w01 and writes nothing. With 12 bank rows absent, it prints 12 `no bank row` lines and exits 1.
   - C9 `checkWordClips`: `pass` on the mapped copy; `warn` `no clip: <keys>` with no map; `fail` for each detail part of K12; fail wins; `undefined` for a week with no book and for a week with no `meta` (review F1); a clip that equals its bank mp3 passes, although the row `sha256` is the WAV hash (review F2); the exact label.
   - C10 `checkSongLeadIn`: `pass`, `warn` `no lead-in`, `fail` `lead-in without video`, and `undefined`; the exact label.
   - C11 the onset math on fixed ffmpeg logs (the w01 lines of the lead-in measure): mp3 onsets 0.0854649 and 0.654717; `song.mp4` onsets 3.085458 and 3.655167; `videoLeadIn` gives 3. A second-onset difference 0.011 s away throws. A file that starts with sound gives the first onset 0.
   - C12 the lead-in script live on short files that ffmpeg makes in the test. The files are an mp3 with 85 ms of quiet and two tones, and an mp4 with the same audio 1.5 s later. The script gives a value within 0.002 of 1.5, because an encoder can add a delay of about 1 ms. `--write` adds the line `"videoLeadInSeconds": <that value>` after the `videoPhone` line of a temporary week. A second run changes no byte. A song with no video prints `no video` and writes nothing.
   - C13 the bank maker with a fake `synthesize`. The fake writes a 32 kHz mono take with long quiet edges and a peak of 10000. The WAV is 32 kHz, mono, 16-bit, with the peak 23197. Its length is the loud part plus 2 × 2560 samples. The mp3 is 32 kHz, mono, 128 kb/s.
   - C14 the bank maker heard rule with a fake `recognize`: a take heard as another word is made again, and `take` is 2; 3 failed takes keep the third take with the note `heard '<x>' in 3 takes`; a variant passes with its note; `a` sends `uh` and the row has `text: "uh"`; the character limit stops the run before the call, and no row changes; `--dry-run` writes nothing and prints `chars:`; the manifest text keeps each old line except one comma line, and the Python form test of K6 holds on a fixture; `n` continues; with no `recognize` and `whisperPython` set to a missing file, `makeWordBank` throws `word bank: no faster-whisper venv at <path>` before the first `synthesize` call, and the fake counts 0 calls (review F4).
   - C15 the bank facts (characterization): the shipped manifest has 98 rows or more, and each `sha256` equals the SHA-256 of its WAV.
   - C16 the guards of the file: no `measure/tracks/` string, and no write under `content/storytime/`.
   - The Red 1 grep: `grep -rlnE "wordClips|videoLeadIn|withoutNewFields|AX-lines|BookAudioSchema|SongSchema|audio\??\.(file|slowFile|sentences|slowSentences)|song\??\.(audio|video|videoPhone|times)|words/manifest" dashboard/__tests__`.
8. **Hand-off.** The 7 revision folders of K16, and one status line to the PM for each delivery. The w01 line is due by 2026-11-10, and the w02 to w07 line by 2026-11-14.

### Acceptance Criteria

- AC11-1: in the repository root, this command prints `173/173 no key: 0`: `node -e 'const fs=require("fs"),c=require("crypto");const h=p=>c.createHash("sha256").update(fs.readFileSync(p)).digest("hex");const by=new Map(JSON.parse(fs.readFileSync("content/storytime/words/manifest.json","utf8")).items.map(r=>[r.word,r]));let t=0,ok=0,miss=0;for(let n=1;n<=7;n++){const w=JSON.parse(fs.readFileSync("content/storytime/l2/w0"+n+".json","utf8"));for(const b of w.books){const keys=new Set();for(const s of [...(b.audio.sentences||[]),...(b.audio.slowSentences||[])])for(const x of (s.words||[])){const k=x.word.normalize("NFC").replace(/[‘’]/g,"\x27").toLowerCase().replace(/^[^a-z\x27]+|[^a-z\x27]+$/g,"");if(k)keys.add(k)}const m=b.audio.wordClips||{};for(const k of keys){t++;const f=m[k];if(!f){miss++;continue}const r=by.get(k);if(r&&fs.existsSync("content/storytime/"+f)&&h("content/storytime/"+f)===h("content/storytime/words/"+r.mp3))ok++}}}console.log(ok+"/"+t+" no key: "+miss)'`.
- AC11-2: `find content/storytime/l2/media -path '*/words/wa-*.mp3' | wc -l` prints 163. For each week, the file count equals the files value of the table.
- AC11-3: the bank has 137 rows, with `n` from 1 to 137 and no gap. Each row with `added` has a WAV of 32 kHz, mono, 16-bit, with the peak 23197, and an mp3 of 32 kHz, mono, 128 kb/s. Its `sha256` equals its WAV. The Python form test of K6 prints `True`.
- AC11-4: `cd dashboard && npx tsx scripts/storytime/check-weeks.ts --level 2` shows `word-clips` with `pass` for st2/1 to st2/7 and no `word-clips` row for st2/8. It shows `song-lead-in` with `pass` for st2/1 and no `song-lead-in` row for st2/2 to st2/8.
- AC11-5: `measure-video-lead-in.ts --level 2 --week 1` prints `lead-in: 3.000`. `w01.json` holds `"videoLeadInSeconds": 3`, and no other week file holds the key.
- AC11-6: a second run of the mapper and of the lead-in script on each week changes no byte. This applies to the week file and to each clip.
- AC11-7: the content commits of a week together change its week file by these insertions and deletions in `git show --numstat --format=`: w01 30 and 2; w02 29 and 2; w03 26 and 2; w04 32 and 2; w05 34 and 2; w06 32 and 2; w07 33 and 2. Each changed line is a closing `]` that gains a comma.
- AC11-8: `RED_TEST_COMMAND` fails only on the new assertions of the Red 1 file. The four gates pass after Green 1, after the Clips w01 content commit, and after the last content commit of w02 to w07. After each other content commit, `GREEN_TEST_COMMAND` and `PROJECT_CHECKS` pass.
- AC11-9: the 13 mutants of the Green 1 task are caught.
- AC11-10: each revision folder passes the nine checks of the Phase 11 package task, with the counts of K16.
- AC11-11: the PM has one status line for w01 r4 and one for w02 to w07 r3 (peer-report). Each line holds the folder paths, the commit, the K17 contract, and the listen list.

### Blast radius of the addendum

- New files: `lib/storytime/word-clips.ts`, `scripts/storytime/make-word-bank.ts`, `scripts/storytime/set-word-clips.ts`, `scripts/storytime/measure-video-lead-in.ts`, and `__tests__/storytime-package-clips.test.ts`.
- Files that change: `lib/storytime/schema.ts` (2 optional fields; shared with the loops track); `scripts/storytime/check-weeks.ts` (2 rows); `content/storytime/words/` (39 WAV files, 39 mp3 files, and 39 manifest rows); `content/storytime/l2/w01.json` to `w07.json` (14 maps with 173 keys, and 1 lead-in line in w01); `content/storytime/l2/media/w0<n>/words/` (163 mp3 files).
- Test files that can change: `__tests__/storytime-loops-content.test.ts` and `__tests__/storytime-print-v15.test.ts` (K15). The Red 1 grep can find more files.
- Read only: `lib/media/audio.ts`, `lib/media/make-clip.ts`, `scripts/storytime/word-times.py`, the bank of 98 clips, the book audio, and the song files.
- `lib/storytime/checks.ts`, the print files, and the Monorepo do not change. The Monorepo work (tasks 1.10 and 1.11) adds the tap clips, the lead-in, and the `mediaOf` entries.
- The repository is public. The clips are not test items.

### Out of Scope

- The Monorepo code: the word tap, the song player, `mediaOf`, and its tests.
- The skipped words of "Read it to me" (pm-log line 2299: the Monorepo fix 1.9).
- New song videos for weeks 2 to 7 and their lead-in values (Daniel's stop of 2026-10-24).
- A change of the 98 approved clips, of the book audio, of `song.times`, or of an approval.
- The word clips of unit 2 (weeks 9 to 16) and of w08 (no book).

## Addendum 2026-11-13, Phase 12: own clips for the practice words, and sentence clips (2026-11-13)

Author model: claude-code/claude-sonnet-5-5

The letter L names the decisions of this phase. The Phase 11 decisions K1 to K18 stay in force, except where an L decision says that it extends or replaces one.

### Overview

The phonics section of the Storytime review copy still plays sliced audio. Daniel looked at it on 2026-11-13 at 08:56 ICT. His order of 2026-11-07 stands: each word plays its own individual generation, never a slice, and a full-sentence button plays the whole sentence. Phase 11 gave an own clip to each book word. It gave no clip to the words of the opening game, the family words, and the tricky words. Phase 12 gives each of these words an own clip. It also gives each sentence of the decodable books an own whole-sentence clip. The phase delivers `w01-storytime-app-package-r5` and `w02-storytime-app-package-r4` to `w07-storytime-app-package-r4` to `~/Desktop/handoff/` on 2026-11-13 by 14:00 ICT.

The order (PM, 2026-11-13 about 09:15 ICT, relayed from Daniel): make one own word clip for each gap word, with the approved voice and the checks of the existing word clips. Slice no audio from a longer audio. Use the MiniMax plan quota only, and use no credits. Log the character count. Add the clips to the week files under a field for the phonics, family, and tricky words. Name the contract change in the hand-off, so that Monorepo wires it. Add, for each phonics sentence, the whole-sentence recording (unsliced) with a field that a full-sentence button can play. Generate a sentence recording when no clean file exists.

### Facts (measured 2026-11-13)

The orchestrator measured the first block at 09:20 ICT. The author of this section measured each count again with a read-only script. All counts agree. The role logs hold the evidence.

- The w01 to w07 packages (w01 r4, w02 to w07 r3) hold own clips only for the book words: `books[].audio.wordClips`, 163 week clips, each equal to the week `words/` folder.
- The practice words of a week come from three lists. The first list is the opening game, `opening.pa` (5 lines, each of the form `{ en, th }`). The second list is `focus.family.words` (an array of `{ word, image? }`). The third list is `focus.trickyWords` (an array of strings).
- The distinct words of each list, for w01 to w07: opening 8, 8, 9, 9, 7, 8, 9 (58); family 6, 10, 7, 7, 7, 7, 7 (51); tricky 3, 3, 2, 2, 3, 3, 3 (19). The total is 128 word slots.
- 55 slots have no book clip in the same week (the gap entries): 42 opening words, 8 family words, and 5 tricky words. These are 47 unique words.
- 32 of the 47 words already have an own bank clip `content/storytime/words/wa-<word>.mp3`. The bank maker `make-word-bank.ts` made each of them with the voice and the heard check of K7 and K9. These words are: ant, apple, bag, boy, bus, cat, cup, eight, friend, girl, goodbye, hat, in, man, mango, map, milk, nap, nine, nod, octopus, on, ox, pear, pen, pig, sister, sock, sun, ten, tiger, top.
- 15 words need a new bank clip: arm, cap, dress, fan, from, ham, hen, hop, hot, jam, mop, put, sad, sit, up. One take of the 15 words sends 47 characters. Three takes send 141 characters at most.
- The bank manifest has 137 rows (AC11-3 of Phase 11). The 15 new rows make 152 rows.
- The distinct keys of the union of book words and practice words, for each week (K2 keys): w01 30, w02 36, w03 27, w04 31, w05 34, w06 27, w07 33. The sum is 218. This is 163 book files plus 55 new files.
- The opening lines hold two word forms for each day, 10 forms for each week. The forms are `Listen: <word>.` and `What is the word? <word>!`. Other lines of the game, such as `Listen: nnn - /e/ - /t/.`, hold sounds and no word.
- The book sentences are 128 in all `books[].audio.sentences` of w01 to w07. Each week has 2 books: one read-along and one decodable (`kind`). The decodable book of each week has 8 sentences. That is 56 sentences and 779 characters of sentence text in all. The decodable sentences have 70, 62, 130, 116, 127, 132, and 142 characters for w01 to w07.
- No sentence has its own file today. Each book has one mp3 and one slow mp3 with word times.
- The clip cache `content/storytime/l2/media/wNN/.clips/` (git-ignored, Opus, trimmed) holds the per-sentence generations that the book audio joined. It is local state, so a package cannot read it. L8 does not use it.
- Each book has the voice `English_captivating_female1` (`books[].audio.voice`). The book audio speeds are 1 and 0.75 (`BOOK_SPEEDS`). The word clips use speed 0.9.
- `w08` is a review week: it has 18 family words and no tricky word, no book, and no song. The PM order names w01 to w07 only.
- The existing tools: `dashboard/lib/storytime/word-clips.ts`, `dashboard/scripts/storytime/make-word-bank.ts`, `set-word-clips.ts`, `check-weeks.ts`, `dashboard/lib/storytime/book-audio.ts` (`heardMatches`), `dashboard/lib/storytime/schema.ts`, and `dashboard/scripts/storytime/word-times.py`. The package builder of Phase 11 is the script `measure/runs/storytime_week_package_20261022/p11-handoff-r3-build.py` with its check, probe, and tree scripts. It is not repository code.
- The MiniMax quota page shows the coding plan weekly window at 83 % used and the 5 h window at 3 %. In Phase 11 a Green role stopped at "Token Plan usage limit reached (2056)". So quota is a real risk (L11).

### Decisions (pinned before Red; the roles do not guess)

- L1 (lane, roles, and the spec review): the light lane of K18. The roles are Red, Green, one Review A (a model family other than the Green family), and phase acceptance. This track already has a passing spec review (one for each track), so Phase 12 runs no spec review role. The orchestrator records this in the plan. No strategy role and no adversarial round. One Workbooks role at a time (the PM slot rule).
- L2 (the clip rule): one bank clip for each unique practice word. The 32 words that have a bank clip use it (each clip is its own generation, with the same voice and checks). The 15 other words are generated with `make-word-bank.ts` (L6). A week copies each clip that it needs into `content/storytime/l2/media/w<nn>/words/` (K3 and K5 apply). No clip is cut from a longer audio. The bank stays the single source (K5).
- L3 (the receiver contract; this extends K17): three new optional maps. Each has the shape and the key rule of `books[].audio.wordClips`: the key is the K2 form of the word, and the value is relative to `content/storytime/` (K3).
  - `opening.wordClips`: one key for each distinct word of `opening.pa` (L4), not only the gap words.
  - `focus.family.wordClips`: one key for each distinct `word` of `focus.family.words`.
  - `focus.trickyWordClips`: one key for each distinct word of `focus.trickyWords`.
  - A value can point to the same file as a book map. The three names are the names that the PM order and the orchestrator suggest. The reason to keep them: `opening.audio` already means Daniel's recordings of sounds, and `wordClips` is the name that Monorepo already reads for the book words. Each map sits in the object whose word list it serves, so the receiver finds the clip next to the word. The family map sits in `focus.family` (the object of the list) and the tricky map sits in `focus` (the list is an array of strings and has no object of its own).
- L4 (the opening word rule, pinned): the words of `opening.pa` are the matches of this expression in the `en` text of each of the 5 lines: `(?:Listen: |What is the word\? )([A-Za-z]+)[.!]`. Each match gives one word. The key is the K2 form of the word. A line with no match throws `opening: no word form in line <i>`. The Red role pins the rule with a hand-written table for w01 to w07 (the distinct words of the Facts section) and with the 10 forms for each week. The Thai text (`th`) is never read.
- L5 (the files and the mapper; this extends K3 to K5 and FR 4): the file of a key is the K3 path, in the same `words/` folder as the book clips. One copy of a clip serves each map that names it. `set-word-clips.ts` plans the book maps and the three new maps together. It copies the union of the distinct clips of the week (30, 36, 27, 31, 34, 27, and 33 files). It removes each `words/wa-*.mp3` file of the week that no map names. Each key goes through the K5 checks (the bank row, the bank mp3, and the WAV hash). A week with no `opening`, no family list, or no tricky word gets no map for that list.
- L6 (the bank rows of the 15 new words; this extends K6 to K9 and FR 3): `make-word-bank.ts` gets the flag `--practice`. With the flag, the keys of a run are the book keys and the practice keys of the week. Without the flag, the run is the Phase 11 run. A run makes only the keys that have no bank row.
  - The model, voice, speed, sample rate, channels, takes (3 at most), heard check, variant list, silence trim (80 ms), peak (-3 dBFS), and mp3 encode are the K7 and K9 values. No new voice, model, or provider is allowed.
  - The TTS text is the K8 text. The first written form of a practice key comes from these lists, in this order: `opening.pa`, `focus.family.words`, `focus.trickyWords`. A book form comes first when the key is also a book word of that week.
  - The row follows K6. `n` continues from 138. `sources` lists the sources of the key in the order `opening`, `family`, `tricky`, joined by `;`. `weeks` lists the weeks of the level where one of these lists holds the key. `added` is `2026-11-13`.
  - The 15 rows wait for Daniel's listen check (K10). The look points are each clip with a note and each clip that took take 3.
  - The Clips task runs the weeks in the order w01 to w07 (K8). A week makes only the words with no bank row at that time.
- L7 (the sentence clips; the schema field): `books[].audio.sentenceClips` on each book of `kind` `decodable`. It is an array in the order of `audio.sentences`. Each item is `{ "sentence": <the text of audio.sentences[i].sentence>, "file": <relative path> }`.
  - The path is `l2/media/w<nn>/sentences/b<i>-s<jj>.mp3`: `<i>` is the 0-based index of the book in `books`, and `<jj>` is the 1-based index of the sentence with two digits. Example: `l2/media/w01/sentences/b1-s01.mp3`.
  - The receiver finds the clip by the index, and it can check the text. The read-along books get no field (default; open question 1 for the PM).
  - The scope is the 7 decodable books: 56 sentences, 8 for each week.
- L8 (how a sentence clip is made; this extends K7): one mmx call for each sentence, with the whole sentence text, the voice of `books[i].audio.voice` (default `VOICES.female`), the speed 1 (`BOOK_SPEEDS.normal`), `--language English`, `--format wav`, 32 kHz, and one channel. Then the steps of K7: scale to the peak 23197, trim with `trimSilence` (threshold 103, pad 80 ms), write the WAV, and encode the mp3 at 128 kb/s. The WAV is a temporary file, and only the mp3 ships.
  - A sentence clip is never a cut of a book mp3, and never a read of the clip cache. The maker does not read the book audio file. The maker makes a fresh generation, even if the cache holds the same sentence (open question 3 for the PM).
  - The heard check: `word-times.py` (K9) gives the heard words. The take passes when `heardMatches(sentence, heard)` of `lib/storytime/book-audio.ts` is true. This means that the recognizer finds each word in order.
  - The length check: the take is at least 0.2 s for each word of the sentence and at most 1.2 s for each word plus 1 s. The longest inner pause is at most 0.6 s (`MAX_PAUSE_S`).
  - A sentence gets 3 takes at most. If all 3 takes fail, the third take stays with the note `heard '<x>' in 3 takes` or the note of the failed bound, and the clip goes on Daniel's listen list.
  - `looksLikeCut(clip, source, rate)` in the library is a pure function over samples. It returns true when the clip equals a window of the source audio (the normalised cross-correlation of the clip with a window of the source is 0.98 or more). The tests use it as a guard (D11). The Clips task also runs it on each shipped clip against the decoded book mp3, as a live proof.
  - Each week keeps the provenance file `l2/media/w<nn>/sentences/manifest.json`: the keys `voice`, `speed`, `model`, and `items`. Each item has `book`, `n`, `text`, `file`, `take`, `len_s`, `peak_dbfs`, `recognized`, `note`, and `sha256` (the SHA-256 of the mp3 file). The text form is `JSON.stringify(value, null, 1)` and one final newline.
- L9 (the checks; they extend K12): two new rows of `check-weeks.ts`, after the `word-clips` row. Both are exported and take the same arguments as `checkWordClips`.
  - `practice-clips`, `checkPracticeClips(week, contentRoot = STORYTIME_ROOT)`. The label is exactly `The practice word clips named in the package exist and match the word bank`. It checks the three maps with the rules of K12: `fail` parts in this order: `missing: <paths>`, `differs from bank: <paths>`, `no bank file: <keys>`, `no bank row: <keys>`, `not a practice word: <keys>`, and `bad path: <paths>`. `warn` with `no clip: <keys>` when a practice word has no key in its map, or when the list has no map. `fail` wins over `warn`. A week with no `meta` gets no row.
  - `sentence-clips`, `checkSentenceClips(week, contentRoot = STORYTIME_ROOT)`. The label is exactly `The sentence clips named in the package exist and follow the book sentences`. No row for a week with no decodable book. `fail` parts in this order: `count differs: <books>` (the array length is not the sentence count), `text differs: <paths or indexes>` (an item sentence is not the book sentence), `missing: <paths>`, and `bad path: <paths>` (a value other than the L7 path). `warn` with `no clips` when a decodable book has no field. `fail` wins over `warn`.
  - The checks do not decode audio. The maker and the Clips task own the heard check, the length check, and the cut guard.
  - The `word-clips` row of K12 does not change. The `warn` status keeps the `PROJECT_CHECKS` of other tracks at exit 0 between the Green 1 commit and the content commits (rule F9).
- L10 (the schema; this extends K15): four optional fields, each with JSDoc, in `dashboard/lib/storytime/schema.ts`: `opening.wordClips` and `focus.family.wordClips` (the type of K15 `wordClips`), `focus.trickyWordClips` (the same type), and `BookAudioSchema.sentenceClips` (`z.array(z.object({ sentence: z.string().min(1), file: z.string().min(1) })).optional()`). The parse output keeps each field. A week file without them parses as before. The rules of K15 for `schema.ts` apply (a clean `git status` before the edit, and a stage by path).
- L11 (the spend and its authority): the authority is Daniel's words of 2026-10-27 (K11) and the PM order of 2026-11-13. The spend uses the MiniMax plan quota only. Each run logs its characters (the `chars: <n>` line and the count of each call).
  - The word run (15 words): one take of each word is 47 characters, and 3 takes are 141 characters at most. The limit is `--max-chars 150` in total, and each week run uses the rest of that budget.
  - The sentence run (56 sentences): one take of each sentence is 779 characters, and 3 takes are 2,337 characters at most. The limit is `--max-chars 2400` in total. Each week run uses 3 times its sentence characters (210, 186, 390, 348, 381, 396, and 426 for w01 to w07). The maker counts the characters of each call and stops before a call that would go over the limit (exit 1), as in K11.
  - The Green role checks the mmx quota before the first call (`mmx quota show`). It stops with status `blocked` when the plan cannot pay. It never uses credits, another voice, or another provider. If mmx refuses a call for quota or for price, the run stops with exit 1.
  - The hand-off README of each folder and the plan line give the characters of the words run and of the sentence runs, and the total.
- L12 (the tests and the lane files): one new test file `dashboard/__tests__/storytime-package-practice-clips.test.ts` (Red 1). The name matches the globs `__tests__/storytime-package-*.test.ts` and `__tests__/storytime-*.test.ts`, so rule R1 of Phase 10 applies. The rules of K18 apply: no test writes into `content/storytime/`, each script case runs on a temporary copy, the tests use fakes for mmx and faster-whisper, and the file holds no `measure/tracks/` string. The Red 1 role runs the grep of FR 8 and records each hit with "changes" or "no change" and the reason.
- L13 (the packages; this replaces K16 for Phase 12): `w01-storytime-app-package-r5` (previous: r4) and `w02-storytime-app-package-r4` to `w07-storytime-app-package-r4` (previous: r3), under `~/Desktop/handoff/`, built from one content commit by the Phase 11 builder script (copied and extended; not repository code). w08 gets no revision (the PM order names w01 to w07). Each folder has `MANIFEST.txt` (the H12 form and the nine checks of Phase 11) and `README.txt`.
  - `README.txt` is not a payload file and the MANIFEST does not list it. It holds the contract change (L14), the character totals (L11), the K2 key rule, and the look points of the listen list.
  - The 4 w01 song files come from `w01-storytime-app-package-r4`, read only, with the SHA-256 values of its MANIFEST.
  - The expected payload files (without MANIFEST and README, if no other track changes a path): w01 90, w02 99, w03 86, w04 86, w05 95, w06 85, w07 92. The expected changed paths (new clips, 8 sentence clips, the sentence manifest, and the week file): 18, 23, 17, 17, 16, 15, 19. The expected `words/wa-*.mp3` lines: 30, 36, 27, 31, 34, 27, 33 (218 in all). The expected `sentences/b*-s*.mp3` lines: 8 for each week. The package task records the measured counts. The measured count wins, and the task line names each difference.
- L14 (the receiver contract, for the PM line to Monorepo; this extends K17): four new optional fields.
  - `opening.wordClips`, `focus.family.wordClips`, and `focus.trickyWordClips`: each is an object, lower-case word -> relative file path (K2 key, K3 path). A word of the list with no key has no clip.
  - `books[].audio.sentenceClips` (decodable books only): an array in the order of `audio.sentences`, each item `{ sentence, file }`. The full-sentence button plays `file` of the item with the same index.
  - The receiver `mediaOf` of Monorepo must list each new path (the same work as K17). The PM line says that the contract changed, and it lists the four fields.
- L15 (the Thai filter): a non-Claude role that can touch a week file (`content/storytime/**/*.json`) makes its Thai filter its first command, before any read. The filter is one script that drops each `th` key and each string with a character from U+0E00 to U+0E7F, and proves 0 Thai characters in its output (PM rule, 2026-11-09). This applies to the Green role and the Review A role. The Red role is a Claude role. No role copies Thai text into spec.md, plan.md, or a log.
- L16 (the scratch rule; PM, 2026-11-13): each role removes its `/tmp` scratch folder at its end, after its captures are committed.
- L17 (the text edits of the week file; they follow K4): each new map is a text edit after the last key of its parent object (`opening`, `focus.family`, `focus`, and `books[i].audio`). The line that closes the last key gains a comma. Then come the line `"<name>": {` and one line `"<key>": "<value>"` for each key, sorted by code point, and a closing `}`. The `sentenceClips` field is an array: the line `"sentenceClips": [`, then for each item 4 lines (`{`, the `"sentence"` line, the `"file"` line, and `}` with a comma between items), and the line `]`. The indent follows the neighbour key. No other byte changes. The edit parses the new text with `JSON.parse` and `StorytimeWeekSchema.parse` before the write. A repeat run changes nothing. One content commit for a week holds its week file, its new clips, its sentence manifest, and its new bank files and rows (rule F9).
  - The insertions of the week file: w01 57, w02 61, w03 58, w04 58, w05 57, w06 58, and w07 59. Each week file has 4 deletions: the 4 closing lines that gain a comma. This is the count by the form rules above. The Clips task line records the measured values and the reason for each difference.
  - The numstat of AC12-8 is the L17 count plus 4 for each week (61/4, 65/4, 62/4, 62/4, 61/4, 62/4, 63/4), because git counts each of the 4 closing lines that gain a comma as 1 deletion and 1 insertion (Review A F5, 2026-11-13).
- L18 (the order and the times, 2026-11-13): Red by about 10:45, Green code by about 11:45, the clips and the sentence clips by about 12:45, and the packages and the PM line by 14:00. Review A runs before the package build if it can end by 13:15. Else it runs after the hand-off, and a fault gives a new revision folder (r6 for w01, r5 for w02 to w07).

### Functional Requirements

1. **Schema.** The four fields of L10.
2. **Library.** In `dashboard/lib/storytime/word-clips.ts` (pure, with JSDoc): `openingWordKeys(pa)` (L4), `practiceWordKeys(week)` (the three lists: the distinct keys of each list, sorted by code point), and `planPracticeClips(input)` (the three maps and the union of the files, with the K3 path and the `two keys, one file` rule). In `dashboard/lib/storytime/sentence-clips.ts` (new, pure): `sentenceClipPath(level, week, book, n)`, `planSentenceClips(input)` (the decodable books only), `sentenceHeardPasses`, `sentenceLengthBounds`, and `looksLikeCut`.
3. **Word maker.** `make-word-bank.ts --practice` (L6).
4. **Word mapper.** `set-word-clips.ts` plans the book maps and the three new maps together (L5, L17). `--check` prints one line for each key of each map.
5. **Sentence maker.** `dashboard/scripts/storytime/make-sentence-clips.ts --level <n> --week <n> [--max-chars <n>] [--dry-run]`, with `USAGE`, the exit codes of the other Storytime scripts, the entry guard, and the venv check of K9. It exports `makeSentenceClips(options)` with the injectable `synthesize` and `recognize` of `makeWordBank`. It writes the mp3 files and the provenance file (L8). It does not read the book audio file.
6. **Sentence mapper.** `dashboard/scripts/storytime/set-sentence-clips.ts --level <n> --week <n> [--check]` writes `sentenceClips` into the week file by the L17 text edit. It checks that each file exists and that its SHA-256 equals the provenance row.
7. **Checks.** `practice-clips` and `sentence-clips` (L9) in `check-weeks.ts`.
8. **Tests** in `dashboard/__tests__/storytime-package-practice-clips.test.ts` (Red 1), the cases D1 to D13:
   - D1 the schema: each new map and `sentenceClips` parse and the parse output keeps them. An upper-case key, an empty value, and an item with no `file` fail.
   - D2 `openingWordKeys` (L4): a hand-written table for w01 (nose, sun, nest, pen, net, nut, hen, fan) and the distinct counts of w01 to w07 (8, 8, 9, 9, 7, 8, 9); 10 forms for each shipped week; a line with no form throws `opening: no word form in line <i>`; a Thai-only change of a line does not change the result.
   - D3 `practiceWordKeys` and the counts, written by hand: opening 58, family 51, tricky 19 (128 slots); 47 gap words; the 15 new words by name; the union of files 30, 36, 27, 31, 34, 27, and 33 (218).
   - D4 the word maker with `--practice` on a temporary bank of 137 rows and fakes: the dry run lists the 15 words in order and prints `chars: 47`; a run makes 15 rows with `n` from 138 to 152, the K6 and L6 form (`sources`, `weeks`, `added`), the K7 files (32 kHz, mono, 16-bit, peak 23197; mp3 32 kHz, mono, 128 kb/s); a word with a bank row is not made again; the heard rule and the character limit work as in C14; the manifest keeps its Python form.
   - D5 the word mapper on a temporary copy of w01 and a bank that holds every key: the three maps and the book maps appear in the L17 form; 30 files, each byte-equal to its bank mp3; a second run changes no byte and no modification time; a stale `wa-*.mp3` is removed and a practice clip is kept.
   - D6 the word mapper stops before any write for a practice word with no bank row, no bank mp3, or a WAV hash that differs. Each error holds its token. No file changes.
   - D7 `checkPracticeClips`: `pass`; `warn` `no clip: <keys>`; each `fail` part of L9; fail wins; `undefined` for a week with no `meta`; the exact label.
   - D8 `sentenceClipPath` (`l2/media/w01/sentences/b1-s01.mp3`) and `planSentenceClips`: the decodable books only; 8 sentences for each shipped week (56); the read-along books give nothing.
   - D9 the sentence maker with fakes, on a temporary copy of w01 that has no book mp3: the fake `synthesize` gets exactly one call for each sentence, in order, with the exact sentence text, the voice of the book, and the speed 1. The run succeeds with no book mp3, so the maker does not read it.
   - D10 the sentence heard rule and the length rule with fakes: a take that lacks a word is made again; 3 failed takes keep the third with its note; a take that is too short or too long fails; the WAV, the mp3, the peak, and the edge follow K7; the provenance file has the L8 keys; the character limit stops the run before the call and `--dry-run` writes nothing; with no `recognize` and a missing interpreter, the maker throws the K9 message before the first call.
   - D11 `looksLikeCut`: a window cut from a synthetic source gives true (the positive control); an unrelated synthetic signal of the same length gives false; the maker output of D9 against a synthetic book mp3 gives false.
   - D12 `checkSentenceClips`: `pass`; `warn` `no clips`; each `fail` part of L9; fail wins; `undefined` for a week with no decodable book; the exact label.
   - D13 `set-sentence-clips.ts`: the L17 array form; the text parses with the schema; a second run changes no byte; a missing file or a hash that differs stops the run before any write.
   - Guards of the file: no `measure/tracks/` string, and no write under `content/storytime/`.
   - The Red 1 grep: `grep -rlnE "wordClips|sentenceClips|trickyWordClips|withoutNewFields|AX-lines|BookAudioSchema|FocusSchema|audio\??\.(file|slowFile|sentences|slowSentences)|opening\??\.(pa|audio)|words/manifest" dashboard/__tests__`.
9. **Hand-off.** The 7 revision folders of L13, and one status line to the PM by 14:00 ICT on 2026-11-13. The line names the folder paths, the commit, the L14 contract change, the character totals, and the listen list.

### Acceptance Criteria

- AC12-1: in the repository root, this command prints `128/128 no key: 0`: `node -e 'const fs=require("fs"),c=require("crypto");const h=p=>c.createHash("sha256").update(fs.readFileSync(p)).digest("hex");const by=new Map(JSON.parse(fs.readFileSync("content/storytime/words/manifest.json","utf8")).items.map(r=>[r.word,r]));const key=x=>x.normalize("NFC").replace(/[‘’]/g,"\x27").toLowerCase().replace(/^[^a-z\x27]+|[^a-z\x27]+$/g,"");let t=0,ok=0,miss=0;for(let n=1;n<=7;n++){const w=JSON.parse(fs.readFileSync("content/storytime/l2/w0"+n+".json","utf8"));const op=new Set();for(const p of w.opening.pa)for(const m of p.en.matchAll(/(?:Listen: |What is the word\? )([A-Za-z]+)[.!]/g))op.add(key(m[1]));const lists=[[op,w.opening.wordClips],[new Set(w.focus.family.words.map(f=>key(f.word))),w.focus.family.wordClips],[new Set(w.focus.trickyWords.map(key)),w.focus.trickyWordClips]];for(const [ks,m] of lists)for(const k of ks){t++;const f=(m||{})[k];if(!f){miss++;continue}const r=by.get(k);if(r&&fs.existsSync("content/storytime/"+f)&&h("content/storytime/"+f)===h("content/storytime/words/"+r.mp3))ok++}}console.log(ok+"/"+t+" no key: "+miss)'`.
- AC12-2: `find content/storytime/l2/media -path '*/words/wa-*.mp3' | wc -l` prints 218. For each week, the file count equals the union value of the Facts section.
- AC12-3: the bank has 152 rows, with `n` from 1 to 152 and no gap. Each row with `added` has a WAV of 32 kHz, mono, 16-bit, with the peak 23197, and an mp3 of 32 kHz, mono, 128 kb/s. Its `sha256` equals its WAV. The K6 Python form test prints `True`.
- AC12-4: `find content/storytime/l2/media -path '*/sentences/b*-s*.mp3' | wc -l` prints 56. Each decodable book has `sentenceClips` with 8 items, and each item `sentence` equals the book sentence of the same index. Each mp3 is 32 kHz, mono, 128 kb/s, with a peak of -3 dBFS, and each `sha256` of the week provenance file equals its mp3.
- AC12-5: no sentence clip is a cut of its book mp3. The live proof `looksLikeCut` gives false for each of the 56 clips against the decoded book mp3 (the capture lists the correlation of each clip). The heard check passes for each clip, or the clip is on the listen list with its note.
- AC12-6: `cd dashboard && npx tsx scripts/storytime/check-weeks.ts --level 2` shows `practice-clips` with `pass` and `sentence-clips` with `pass` for st2/1 to st2/7, and no such row for st2/8. The `word-clips` row stays `pass` for st2/1 to st2/7.
- AC12-7: a second run of each mapper on each week changes no byte. This applies to the week file and to each clip.
- AC12-8: the content commits of a week change its week file by the insertions and the 4 deletions of L17, or the task line gives the measured values and the cause of each difference. Each changed line is a closing line that gains a comma.
- AC12-9: `RED_TEST_COMMAND` fails only on the new assertions of the Red 1 file. The four gates pass after Green 1, after the first content commit, and after the last content commit. After each other content commit, `GREEN_TEST_COMMAND` and `PROJECT_CHECKS` pass.
- AC12-10: each mutant of the Green 1 task is caught.
- AC12-11: each revision folder passes the nine checks of the Phase 11 package task, with the L13 counts or the measured counts, and holds `README.txt` with the contract change and the character total. The tree hash of each existing folder is the same before and after the build.
- AC12-12: the characters of the mmx runs are logged, and the total is at most 150 for the words and 2,400 for the sentences. No credit is used. The PM has one status line (peer-report).

### Blast radius of the addendum

- New files: `lib/storytime/sentence-clips.ts`, `scripts/storytime/make-sentence-clips.ts`, `scripts/storytime/set-sentence-clips.ts`, and `__tests__/storytime-package-practice-clips.test.ts`.
- Files that change: `lib/storytime/word-clips.ts` (new exports), `lib/storytime/schema.ts` (4 optional fields; shared with the loops track), `scripts/storytime/make-word-bank.ts` (`--practice`), `scripts/storytime/set-word-clips.ts` (the three maps and the union), `scripts/storytime/check-weeks.ts` (2 rows), `content/storytime/words/` (15 WAV files, 15 mp3 files, and 15 manifest rows), `content/storytime/l2/w01.json` to `w07.json` (the 3 maps and the sentence clips), `content/storytime/l2/media/w0<n>/words/` (55 new mp3 files), and `content/storytime/l2/media/w0<n>/sentences/` (56 mp3 files and 7 provenance files).
- Test files that can change: `__tests__/storytime-loops-content.test.ts` (`withoutNewFields` must also remove the new fields), `__tests__/storytime-print-v15.test.ts`, and each file that the Red 1 grep finds.
- Read only: `lib/media/audio.ts`, `lib/media/make-clip.ts`, `lib/storytime/book-audio.ts`, `scripts/storytime/word-times.py`, the 137 bank clips, the book audio, the clip cache, and the song files.
- `lib/storytime/checks.ts`, the print files, and the Monorepo do not change. The Monorepo work adds the phonics playback, the full-sentence button, and the `mediaOf` entries. The package builder is a script under `measure/runs/`, and its proof is the nine checks, not a unit test.
- The repository is public. The clips are not test items.

### Out of Scope

- The Monorepo code: the phonics playback, the sentence button, and `mediaOf`.
- The sentence clips of the read-along books (default; open question 1) and the slow speed (default).
- The practice words and sentences of w08 and of unit 2 (weeks 9 to 16).
- A change of a bank clip that exists, of the book audio, of `song.times`, or of an approval.
