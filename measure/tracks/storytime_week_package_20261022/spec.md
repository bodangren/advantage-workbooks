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
