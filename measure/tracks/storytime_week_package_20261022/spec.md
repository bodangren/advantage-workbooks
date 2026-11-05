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
