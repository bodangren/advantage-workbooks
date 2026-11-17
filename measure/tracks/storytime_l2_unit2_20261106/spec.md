# Spec: Storytime Advantage Level 2 Unit 2

Track: `storytime_l2_unit2_20261106`. Type: feature (classic FR list). Created: 2026-11-06. Starts: 2026-11-07. Status: planned; no content and no code.

## Overview

This track makes Unit 2 of Storytime Advantage Level 2 (Anuban 3): weeks 9 to 16. Weeks 9 to 15 are teaching weeks. Week 16 is the review week with Benchmark 2. The unit uses the package shape, the checks, the cast, the picture style, and the print makers of unit 1.

The track has six phases:

1. The week texts: 8 week files in English, with a Thai draft, and Daniel's English check.
2. The picture list of the unit for Forge, through the PM session.
3. The Thai parts for Daniel's check.
4. The unit scope change of the makers, and the move of the week files into `content/storytime/l2/`.
5. The print build with the existing makers, the PM audit, and Daniel's proof check.
6. The hand-offs: the songs, the book audio, the app packages, the QR check, and the facts-changed list.

Unit 1 stays first. Its open dates are the Phase 8 close of `storytime_print_r1_20261025`, Daniel's check sitting of 2026-11-16, the release proof of 2026-11-20, Daniel's approval of 2026-11-24, and the print order of 2026-11-25. This track uses only the session slots that unit 1 does not use. It changes no file under `content/storytime/l2/` or `dashboard/` before the unit 1 print order (exception: D-U2-K7).

Why this unit: the PM default is Level 2 Unit 2. The phonics sequence holds Level 2 weeks 9 to 16 as the block after unit 1, and the unit reuses every Level 2 maker and the cast. The sources give no reason for another unit first. Level 1, Level 3, and Level 4 need a shape track before their content (series plan, sections 4 and 5.1).

The series plan is `measure/storytime-series-plan.md`. It gives the dates of all 16 units and the limits of the speed.

## Owner order and the approvals that apply

Owner order (Daniel, Tasks, 2026-11-06 about 20:57 ICT, via the PM), word for word: 'For the books, make sure we are moving forward and creating the entire series as quickly as possible.' Evidence class: owner order (PM relay).

Earlier owner decisions that this track keeps (program `decisions.md` and the unit 1 tracks):

- S1: the element order of the sequence. S7: the Pip world cast. S15: the band names; Level 2 readers use "Sprout", as in unit 1.
- S17: Level 2 complete by 2027-02-15 (a target; this track does not change it).
- S21: no Reading A-Z lesson number and no reference citation in public text. This repository is public.
- S22: Daniel's recordings of the 45 sounds. S23: the QR host `https://storytime.reading-advantage.com`. S24: the home cards say บุตรหลาน. S25: no sung letter name and no sung onset.
- P3 of `storytime_print_r1_20261025` (Daniel, 2026-10-25): the Forge 3D renders, with one character look for the books and the videos.
- The reader form (Daniel, 2026-11-03 14:49 ICT and 2026-11-04): landscape reader pages of about 198 × 148.5 mm, as tear-out leaves in the student book.
- The five teaching routines of research item A-42 (Daniel, "Ok", 2026-11-02 15:50 ICT).

## Dates

| Phase | Dates | End gate |
|---|---|---|
| 1 Week texts | 2026-11-07 to 2026-11-18 | Daniel approves the English of weeks 9 to 16 (default date 2026-11-18) |
| 2 Picture list for Forge | 2026-11-14 to 2026-11-23 | Daniel's look at the delivered pictures (default date 2026-11-23) |
| 3 Thai parts for Daniel's check | 2026-11-19 to 2026-11-28 | Daniel approves the Thai (default date 2026-11-28) |
| 4 Unit scope and the move | 2026-11-26 to 2026-11-30 | The week files are in `content/storytime/l2/`, and the unit 1 outputs stay the same |
| 5 Print build | 2026-12-01 to 2026-12-08 | Daniel approves the unit 2 print proof (default date 2026-12-08): the unit is print-ready |
| 6 Hand-offs | 2026-12-01 to 2026-12-09 | The app packages, the QR check, and the facts-changed list |

All dates are internal. The print order date of unit 2 is Daniel's decision and is outside this track.

## Sources

- Program design (read only): `../reading-advantage-monorepo/measure/archive/storytime_advantage_program_20261021/design.md`, sections 2, 3.3 to 3.5, 6.1 to 6.5, and 7; `decisions.md`; `forge-brief.md`.
- The committed phonics sequence (read only): `../mastery-advantage/english/phonics/sequence.json` (commit ceb728d) and the graph `phonics-knowledge-space.json`.
- `content/storytime/README.md` (the package rules) and the unit 1 week files `content/storytime/l2/w01.json` to `w08.json` (the exemplars: w02 for a teaching week with a vowel, w04 for a consonant week, w08 for the review week).
- `content/storytime/l2/print/pictures.md` and `pictures.json` (picture list version 7) and spec FR-2 and FR-9 (version 1) of `storytime_print_r1_20261025` (the picture style rules).
- `dashboard/lib/storytime/` and `dashboard/scripts/storytime/` (the schema, the checks, and the makers).
- `measure/tech-debt.md` (rows of 2026-10-28, 2026-11-01, and 2026-11-05) and `measure/lessons-learned.md`.

## Terms

- **Unit 2**: Level 2 weeks 9 to 16 (program weeks 41 to 48). The keys are `st2/9` to `st2/16`.
- **Staged week file**: a week file at `content/storytime/drafts/l2/w<nn>.json`, before the move.
- **Stage root**: a temporary folder that holds a link copy of `content/storytime/` (`cp -rs`) and real copies of the staged week files in its `l2/` folder. The makers read it through `WORKBOOKS_ROOT`. The plan gives the exact commands.
- **The move**: the Phase 4 task that puts the staged week files into `content/storytime/l2/`.
- **Unit scope change**: the Phase 4 code change that makes the makers read the unit from the week data.
- **English review extract**: the English teacher manual PDF of the staged weeks (`make-manual-pdf.ts --lang en`). It holds no Thai.
- **Owner gate**: a task that waits for Daniel's words. The PM session relays the words.
- **Picture-type card**: a card of the card kit of kind `picture`, `sound-picture`, or `family-picture`. The `materials` lines of the script steps name the cards (`storytimeCardKit`, `lib/storytime/print/card-kit.ts`).
- **Card picture entry**: one item of a card picture file: the card word, its first week, and a Forge prompt (`readLevelCardPictures`, `lib/storytime/files.ts` line 118). The print picture list makes one `card` row of class C from each entry.

## Scope of the unit

The sounds and the sight words come from `sequence.json`. The frames and the topics come from design section 2. A decodable book uses only VC and CVC words with the sounds of elements 1 to n (design 6.1).

| Week | Element | Sound (bank file) | New sight words | Frame | Word family (Starters topic) | Decodable words, examples |
|---|---|---|---|---|---|---|
| 9 | 8 d | /d/ (`P06`) | are, has, cannot | I like ___. Yum! | food and drink | dad, mad, sad, pad, nod, dot, mop |
| 10 | 9 -an -ad | /a/ with n and d (`P26`, `P04`, `P06`) | they, too, were | Put on your ___. | clothes | man, pan, tan, Nan, dad, mad, sad, pad |
| 11 | 10 short e | /e/ (`P27`) | me, of | Where is ___? In/On/Under. | home | ten, pen, net, pet, men, den, set |
| 12 | 11 h | /h/ (`P10`) | goes, it, said, that | Open your book. | school | hat, hot, hen, hop, ham, had |
| 13 | 12 -ot -op | /o/ with t and p (`P29`, `P02`, `P03`) | do, for, like | I can run/hop/jump. | actions | pot, not, dot, hot, top, mop, hop, pop |
| 14 | 13 f | /f/ (`P12`) | you ("this" is a review word) | It is hot/cold. | weather | fan, fat, fed, fog |
| 15 | 14 g | /g/ (`P07`) | his, no, my | Look, a ___! | transport | dog, fog, hog, tag, nag, gas, gap, got, peg |
| 16 | review | the 12 taught letters: n, a, p, m, s, t, o, d, e, h, f, g | (review) | the 7 frames of weeks 9 to 15 | the word list of the unit | the 7 decodables of weeks 9 to 15 (re-read) |

The decodable examples are a start list for the writer. The `decodable` check decides each word.

## Functional Requirements

### FR-1: The stage

1. Until the move (FR-6), the week files of unit 2 are staged files in `content/storytime/drafts/l2/`. No task writes a file under `content/storytime/l2/` or `dashboard/` before the unit 1 print order (2026-11-25). Exception: D-U2-K7.
2. Reason (measured on 2026-11-06 at commit 504fb6a2): `readLevelWeeks` (`lib/storytime/files.ts` line 67) reads every `w<nn>.json` file of the level folder. A new `w09.json` there fails unit 1 tests: `storytime-print-h1-classes.test.ts` line 44 expects 8 weeks, `storytime-print-card-pictures.test.ts` line 230 expects 227 rows, and the contract tests keep the committed picture list equal to the maker output. `make-step-map.ts` writes `step-map-u1.json` from every week of the level, and `make-teacher-book-print.ts` line 186 reads every week as the unit weeks.
3. The stage gate `STAGE_CHECKS` runs `check-weeks.ts --level 2` on a stage root. Measured with no staged file: the same report as the normal run (8 packages, 0 failed checks, 1 warning), in 1.5 seconds, and no file of the repository changes.
4. A maker that writes runs on a stage root only when its output file in the stage root is a real file, not a link. The plan removes the output links first, so that a write cannot reach a unit 1 file through a link.

### FR-2: The teaching weeks 9 to 15

1. One staged file for each week: `w09.json` to `w15.json`, valid against `StorytimeWeekSchema`. `meta`: program `storytime`, shape `storytime-week`, level 2, the week, unit 2, the key, kind `teach`, `periodMinutes` 30, `openingMinutes` 6, band `Sprout`, status `draft`.
2. The content follows the scope row of the week and the rules of `content/storytime/README.md`, as unit 1 does:
   - the element with its action, the sound game of each day (`opening.pa`), the sight words, the frame, and the family (6 to `focus.family.max` picture words of the Starters topic);
   - a read-along book: 8 pages, one sentence a page, the frame repeated with one change, 20 to 35 words (39 to 40 with a 5-word frame);
   - a decodable book: 8 pages, 2 to 5 words a page, VC and CVC words only, and a twist on the last page. At least 90 percent of the words are decodable with the sounds taught to date, and the book has at most 3 new sight words. A name that the graph cannot decode by the week goes in `names`;
   - the song: the lyric sheet, the sung lines with one of the 24 gestures and one picture each, the frame at least 8 times, 92 to 108 bpm, no sung letter name or onset (S25), and a style brief without the words "children" or "five-year-olds", and the song text rule of D17 (a verse, a chorus with a short hook line that repeats, and a clear ending line);
   - the five scripts A to E, each step with the four headings and the lines Easier, Harder, and Group; the main steps fill 24 minutes;
   - the review strips, the Friday check (E5), the home card with the QR path `/th/st/2/<week>`, and the tags;
   - the five teaching routines of A-42 (the blend drill, the sound loop, the sight-word step, the read-along questions, and the daily recall of 5);
   - the print block: the check rows, the letter box, the practice lines, the dictation, and the writing page.
3. Pictures: each page and each picture word has an `image.prompt` in the unit 1 style:
   - the Forge 3D cast, drawn at about five years old, with the look of each cast member as in the unit 1 prompts;
   - race-unmarked text: hair and clothes, never skin or ethnicity;
   - the object counts that the text says, and one look for each animal;
   - the end sentence "No letters, words, or numbers anywhere.";
   - the Muse filter rules of lessons-learned (2026-10-07).
4. The phoneme fields come from `set-phoneme-audio.ts --file <staged file>` (Daniel's bank).
5. A staged file names no media file until the file exists: no song audio, no book audio, and no picture file. The media come in Phase 6 (FR-8).
6. Every `th` field holds a Thai draft for Daniel's check (FR-5). Every approval part stays `draft` until Daniel's words.
7. Gate of each week: `STAGE_CHECKS` passes. It fails on a check-weeks exit code other than 0, on a FAIL line, and on a `print-missing` warning of a teaching week of unit 2 (st2/9 to st2/15). The last rule is machine-checked in the command (an `awk` step over the report), not read by a person.
8. One independent English review of each week, on the English review extract only. The writer fixes each finding or answers it in the task line. Until the Phase 4 fix, the review also checks two rules by hand (tech debt of 2026-11-05, findings 3 and 9): each review strip card is taught by the week, and each check item has exactly one right picture.

### FR-3: The review week 16

1. One staged file `w16.json`, kind `review`, in the shape of `w08.json`. It holds:
   - `block` with the weeks 9 to 15 and the five days: days 1 to 4 cover every block week, and day 5 is the child's choice;
   - the paper page of each day, and the opening medley (the songs of the block; no new song);
   - the family (the word list of the unit), one home card ("Unit 2 is done ..."), and the daily recall.
2. Benchmark 2 keeps the shape of the week 8 benchmark (default D5). It has three parts:
   - the whole-class paper part on day 1;
   - one one-to-one sitting of 3 minutes: the 26-letter strip, the sounds of the 12 taught letters on cards, and 4 blend words of the unit;
   - the reading record of a block decodable.
   The pass marks keep the week 8 shares, rounded down. Daniel approves them with the English text.
3. Gate: `STAGE_CHECKS` passes, and FR-2.8 applies. The review week may show the `print-missing` warning, as st2/8 does: a review week has no print block, and its pages in the student book are the paper pages of `block` and the benchmark. So `STAGE_CHECKS` does not fail on the warning of st2/16.

### FR-4: The picture list for Forge

1. `PICTURE_LIST_U2` (plan) runs `print-pictures.ts --level 2` on a stage root and keeps the rows of weeks 9 to 16: `content/storytime/drafts/l2/print/pictures-u2.json` and the readable copy `pictures-u2.md`. Nobody edits a row by hand.
2. The rows follow picture list version 7 and FR-9 version 1 of the print track: class A story pages (4000 × 3000), class B reader covers (4000 × 3000, a calm top 30 percent), and class C picture words (1500 × 1500, white). Each row has a color file and a line-art file, with the names `l2-w<nn>-<use>-<what>-v1.png` and `l2-w<nn>-<use>-<what>-line-v1.png`.
3. The card rows of unit 2 are in this list. Their source is the staged file `content/storytime/drafts/l2/print/card-pictures-u2.json`, in the format of the unit 1 file `l2/print/card-pictures.json` (a unit 1 file that this track does not change). The writer of this track authors the entries (default D13):
   - `CARD_MATCH_U2` (plan) prints the match of every picture-type card of weeks 9 to 16, with every row of the stage list counted as delivered.
   - The match rule is the PM rule of 2026-11-05 with the Phase 8 extensions of the print track: a `card` row of the same word, then a check-row, practice-line, or d4-prompt row of the same word (case a), then a story page that shows only that object (case b). A unit 1 row counts, so a unit 1 picture of the same word is used again and needs no new render.
   - The 8 color words print as a color patch, and the number words one to nine print as the numeral with dots (owner decision, Daniel, 2026-11-06). They get no entry.
   - Each card word with no match (`none: no row`) gets one entry: the word, the first week of weeks 9 to 16 that names the card, and a Forge prompt in the unit 1 card style (one object or one person who does the action, then the fixed end "One clear picture, the main thing large in the middle, a plain light background. No letters, words, or numbers anywhere.").
   - The gate: `CARD_MATCH_U2` exits 0, with 0 `none` lines. The stage commands give the stage root a real card picture file with the 31 unit 1 entries and the staged unit 2 entries, so the maker never writes through a link.
4. A Forge brief in this track folder (`forge-brief.md`) gives:
   - the scenes, the props, and the cast of each week;
   - the style rules, by reference to FR-9 version 1, with its class table;
   - the card rows of unit 2 with their prompts (class C, the unit 1 card style);
   - the row count and the cost estimate at the unit 1 rate;
   - the delivery rule: a Forge folder with `manifest.json`, and the copy into `content/storytime/l2/print/pictures/` in Phase 4.
5. Forge starts paid renders only after Daniel's English approval and his go for the cost (owner gate). The go names the book rows and the card rows of unit 2 together, through the PM session.
6. The delivery check is `PICTURE_CHECK_U2` (plan): `check-storytime-pictures.ts` with the Forge folder, level 2, and weeks 9 to 16, on a stage root with the merged card picture file. It checks the book rows and the card rows, before the Phase 5 card kit. A card row that Forge cannot deliver stays open until it passes or Daniel takes the card picture out with his words. Then Daniel looks at the pictures, the card pictures included, and `approval.images` of each staged file gets his words.

### FR-5: The Thai parts for Daniel's check

1. Claude drafts the Thai of the 8 weeks: the step titles and notes, the prep lines, the song notes, the home cards, the focus texts, and the Thai of the routines.
2. Only Daniel checks the Thai. No Thai goes to another person or to a model for a check. A review role gets the English review extract only.
3. The Thai parts file for Daniel is the Thai teacher book draft of the 8 staged weeks: `make-manual-pdf.ts --file <8 staged files> --lang th --loops`. The writer looks at a page render of every page, because `pdftotext` drops Thai tone marks (lessons-learned, 2026-10-20).
4. Daniel's words, the date, and the source go into `approval.thai` of each week.
5. The Thai draft starts after Daniel's English approval, so that the Thai follows the approved English.

### FR-6: The unit scope change and the move

1. The start condition: the print order task of `storytime_print_r1_20261025` is complete (2026-11-25), and the orchestrator gives the go. The Red window rule R1 applies: at most one open Red window across this track and the unit 1 tracks.
2. The makers take the unit from the week data (`meta.unit`), not a fixed unit 1. This applies to:
   - the student book title and file name, the book map sticker, the song line of the map, and the benchmark label;
   - the card kit title and the unit weeks of the teacher book;
   - the step map file (`step-map-u<unit>.json`);
   - the picture list of each unit: unit 1 keeps `l2/print/pictures.json`; unit 2 gets `l2/print/u2/pictures.json`, `pictures.md`, and the card pictures file `l2/print/u2/card-pictures.json`.
3. The unit 1 tests that count the weeks or the rows of the level read the unit 1 weeks only.
4. The card match of unit 2 covers every row of the level, unit 1 rows included, so that the Phase 2 match result stays true after the split of the lists.
5. The tracing guides get the letters d, e, h, f, and g in `letter-strokes.ts`, with a test for each letter (tech debt of 2026-10-28, the formation guides).
6. The checks fix of tech debt 2026-11-05 (findings 3 and 9): a review strip card must be taught by its week, and a check item must have exactly one right picture.
7. The unit 1 outputs stay the same. A snapshot of every unit 1 print output at the Phase 4 base and after Green proves it (lessons-learned, 2026-10-20). The test strategy names the method.
8. The move: the 8 staged files go into `content/storytime/l2/`, the staged card entries go to `content/storytime/l2/print/u2/card-pictures.json`, the delivered pictures go into `content/storytime/l2/print/pictures/` (SHA-256 equal to the Forge manifest), and the unit 2 picture list and step map are made. Then `PROJECT_CHECKS` shows 0 FAIL lines (the gate of the PM brief, `check-weeks.ts --level 2`), and `PROJECT_TESTS` passes.
9. The song-frame exception (D15). `checks.ts` keeps a fixed list of song-frame exceptions beside the song-frame check. Each entry names the week key, the exact number of song lines with the frame, and the decision with its source and date. The only entry: `st2/12`, 7 lines, the PM decision of 2026-11-09. When the week key and the number match an entry, the check passes, and the check text names the exception and the decision. Any other number, and any other week, keeps the rule of 8 or more. The week file gets no new field, because the app package goes to Monorepo.

### FR-7: The print build

1. After the move, the existing makers build the print files of unit 2:
   - the student book (`make-student-book-pdf.ts --weeks 9,...,16`), title "Storytime Advantage, Level 2, Unit 2, Student Book";
   - the Thai teacher book (`make-teacher-book-print.ts --weeks 9,...,16 --lang th --loops`);
   - the 14 color A3 readers (`make-readers-pdf.ts --a3-color`) and the card kit (`make-card-kit-pdf.ts`, FR-7.3);
   - the teacher book cover (`make-storytime-teacher-cover.ts --level 2 --unit 2`) and the step map.
2. The student book cover (`make-storytime-book-cover.ts --level 2 --unit 2 --print`) needs Daniel's go first: the covers of the other 13 books wait for Daniel until after release 1 (Phase 3 of the archived track `storytime_covers_20261027`). After his go, the row of Level 2 Unit 2 in `content/storytime/covers/books.json` gets its picture recipe and panel.
3. The card kit (`make-card-kit-pdf.ts --level 2 --weeks 9,...,16`) builds after the Phase 2 delivery check and the Phase 4 copy of the card pictures. Its `card-picture-match.txt` must have 0 lines whose source is `none`, so no card prints an empty box. A `none` line stops the card kit task until it has a named reason that the PM session records with Daniel's words.
4. Each print file passes `PRINT_GATE`, is newer than the last commit of its sources, has contact sheets of every page, and shows its fonts in `pdffonts` (lessons-learned, 2026-10-27). `check-qr.ts` decodes the QR codes of the student book.
5. The PM runs the print-curriculum audit (checklist A1 to J1) before Daniel. The gate passes with 0 blockers and 0 majors. This track never audits its own proof.
6. Daniel's words and the date go into `approval.print` of `w09.json` to `w16.json`.

### FR-8: The hand-offs

All hand-offs go to the PM session, and each needs a receipt (peer-report).

1. Hand-off 1: the English text file of weeks 9 to 16 for Daniel's English check.
2. Hand-off 2: the song request after the English approval: 7 lyric sheets and style briefs for Lyria 3 Pro, 3 candidates a song (about 1.68 USD; paid, so Daniel's go). Daniel picks one candidate a song. Workbooks sets `song.lines` and `song.times` from a transcript of the chosen audio (local faster-whisper, no lyric prompt; lessons-learned, 2026-10-22).
3. Hand-off 3: the picture list and the Forge brief.
4. Hand-off 4: the Thai parts for Daniel.
5. Hand-off 5: the proof files for the PM audit and Daniel's check.
6. Hand-off 6: the app packages of weeks 9 to 16 for Monorepo, after the move: the book audio (`book-audio.ts`; mmx speech; the PM confirms the cost class before the run), the song audio, and the app pictures (`set-book-pictures.ts`), with a SHA-256 list.
7. Hand-off 7: the report and the facts-changed list.
8. The printed QR addresses `/th/st/2/9` to `/th/st/2/16` must answer on the live host before any print order of unit 2. A person scans one printed page.

### FR-9: Files that this track does not change

- Before the unit 1 print order (2026-11-25): any file under `content/storytime/l2/` and `dashboard/`. Exception: D-U2-K7 for Tasks 1.13a to 1.13c.
- At any time: `content/storytime/l2/w01.json` to `w08.json`, the Phase 8 files of the print track (`dashboard/lib/storytime/print/card-kit.ts`, `pictures.ts`, and the card kit tests) until the print track closes, `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, `measure/tracks/storytime_print_r1_20261025/plan.md`, and the approved unit 1 print files.

## Defaults

| # | Point | Default | Why |
|---|---|---|---|
| D1 | The unit | Level 2 Unit 2 (weeks 9 to 16) | The PM default; the next block of the sequence; it reuses every Level 2 maker and the cast. |
| D2 | Where the drafts live | `content/storytime/drafts/l2/` until the move | FR-1.2, measured. |
| D3 | "cannot" | Week 9, with "are, has" | `sequence.json` puts it in week 9, and the shipped `w06.json` teaches "he, put, see". |
| D4 | Cast | The unit 1 cast only: no new character, so no new Forge cast sheet | Lower cost and time. A name that the graph cannot decode by the week goes in `names` (as Pip in w06 and w07). |
| D5 | Benchmark 2 | The week 8 shape (FR-3.2); the full forms of design 7 wait for a later assessment track | Design 7 needs about 10.6 minutes a child, so about 320 minutes for 30 children. The week 8 shape gives 81 minutes at the check table (27 sittings of 3 minutes). |
| D6 | Week 14 sight words | "you" is new; "this" is a review word | Week 4 taught "this". |
| D7 | Titles | The writer takes a short title from the frame, as unit 1 did ("How Many?", "I Can See"); week 16 is "Unit 2 Review" | Unit 1 pattern; Daniel approves the titles with the English. |
| D8 | Picture style | The unit 1 style without change | P3 (Daniel, 2026-10-25) and picture list version 7. |
| D9 | Daniel's sittings | English 2026-11-17 or 2026-11-18; Thai 2026-11-26 to 2026-11-28; proof by 2026-12-08 | After the unit 1 sitting of 2026-11-16 and the unit 1 approval of 2026-11-24. The PM sets the real slots. |
| D10 | Paid generation | The PM asks Daniel's go after his English approval: Forge renders (about 13 to 17 USD at the unit 1 rate) and Lyria songs (about 1.68 USD) | The owner rule: paid generation is Daniel's gate. |
| D11 | Unit 2 picture folder | The Forge folder until the move; then `content/storytime/l2/print/pictures/` (git-ignored) | The unit 1 folder rule (`.gitignore` line 37) and tech debt of 2026-11-01. |
| D12 | Unit 2 picture list path after the move | `content/storytime/l2/print/u2/` | The unit 1 list keeps its path, so its tests and the Forge pin stay valid. |
| D13 | Unit 2 card pictures | The unit 1 rule (FR-4.3): a card word first takes a picture of the same word from the book rows or the card rows of the level; the 8 color words print as a color patch and the numbers one to nine as numeral and dots; each word with no match gets one card entry with a Forge prompt in the unit 1 card style. The writer of this track authors the entries in Phase 2, and they go to Forge with the book rows. | The PM rule of 2026-11-05 and Daniel's decision of 2026-11-06 for unit 1. The card kit prints an empty labelled box for an undelivered card and does not fail (`card-kit.ts` line 474), so the entries, the delivery check, and the card kit gate must exist before Phase 5. |
| D14 | The share moments of weeks 9 to 16 | Each script of w09 to w16 gets the `share` field of FR-14 of `storytime_teaching_loops_20261103`. A non-Claude role writes the English captions, a non-Claude review role of a second family reads them, and a Claude role after 2026-11-10 15:22 writes the Thai captions and adds the field (plan rule 19). The English and Thai captions join the hand-off of 2026-11-14 18:00, and Daniel checks both in the same sitting. The task starts by 2026-11-11; the PM session gets a new date on 2026-11-12 if the hand-off cannot hold. | The PM decisions of 2026-11-09 and the 8 `share-moment` FAIL rows of the staged weeks (plan line 161). |
| D15 | The song-frame rule for week 12 | Daniel's pick c2 sings 10 of the 12 lines; lines 9 and 10 (the third chorus) are out of the week file, so the frame is on 7 song lines. The rule takes a recorded exception for week 12 (FR-6.9); the code goes through Phase 4 Tasks 4.1 and 4.2. | PM decision 2026-11-09, word for word: "Keep Daniel's pick c2. The lyrics follow the audio: lines 9 and 10 (the third chorus) come out of the w12 week file. The song-frame rule takes a recorded exception for week 12: 7 frame lines in place of 8 (PM decision, 11-09). Reasons: Daniel chose c2 for how it sounds; the frame count is our own design rule; and print plus audio stay equal. Record the exception where the song-frame check reads it, so the check passes with the exception named, not hidden." Staged in commit 46960211. |
| D16 | The song lines of week 14 | Daniel's pick "W14 C2" (2026-11-09 21:06 ICT). If the second local pass confirms that the take does not sing lines 10 and 11, those lines come out of the week file. song-frame passes (10 lines with "It is"); song-sheet warns and names the difference; the line 11 picture row is not used in the song. No new take. | PM decision 2026-11-09, word for word: "Your default stands: tomorrow's role confirms the miss with the second local pass, and if it is confirmed, lines 10 and 11 come out of the w14 week file. song-frame passes; song-sheet WARNs and names the difference; the line 11 picture row is not used in the song. Reason: the listen sheet shows that none of the 5 w14 takes sings 'It is very cold! Hug, hug, hug!' (c1, c1-r2, c2, c3, c3-r2 all miss it). A new take has no promise to fix it, and the read-along still teaches 'very' on page 7. So: no new take." |
| D17 | The week 15 song and the song text rule | c2 is the fallback and is staged with week 14. A text-only non-Claude role rewrites the lyrics with a clear structure; the PM makes 3 new Lyria takes and a listen sheet for Daniel's pick (target 2026-11-12). Every new song text from now on has a verse, a chorus with a short hook line that repeats, and a clear ending line. | Daniel, 2026-11-09 21:12 ICT (Tasks item OEFrVGtrU2Q5N293b3F6Zg), word for word: "W15 probably C2, but they are all pretty mediocre, probably because the lyrics have no real structure to them. They just kind of amble on until the end". PM decisions 2026-11-09, word for word: "(1) w15 c2 is the FALLBACK: stage it tomorrow morning with w14, so the unit is complete if nothing better comes. (2) Rewrite the w15 lyrics with a clear structure: verse 1, a chorus with a short hook line that repeats, verse 2, the chorus again, and a clear ending line. Keep the week's target words and the lines the read-along and the pictures need, and keep the length near the current take (about 70 s). It is English only, with no Thai, in a text-only role on a non-Claude route. (3) Hand the new lyric file to the PM as a hand-off folder with a MANIFEST. The PM makes 3 new Lyria takes (about 0.24 USD, inside the unit 2 media budget) and a listen sheet for Daniel's pick, target 11-12. (4) Standing rule for every new song text from now on: verse, chorus with a repeated hook, and a clear ending." |

## Ownership and overlap

- `storytime_print_r1_20261025` owns the unit 1 print makers until its closeout. This track changes them only in Phase 4, after the unit 1 print order, with the orchestrator's go. The orchestrator runs no task of the two tracks on one file at the same time.
- `storytime_week_package_20261022` owns the schema, the checks, and the teacher manual. The Phase 4 checks fix changes `lib/storytime/checks.ts`; the same rule applies.
- `storytime_teaching_loops_20261103` owns the routine checks. This track writes the routine fields as the unit 1 weeks do.
- `storytime_song_video_20261022` owns the song videos. They are outside this track.
- Forge (pictures) and Monorepo (the app and the QR page) receive work only through the PM session.

## Non-Functional Requirements

- New prose follows ASD-STE100 (the global rules).
- The repository is public: no test item, test paper, answer key, or test audio goes into it.
- Heavy jobs (vitest, tsc, Chrome, PDF renders, Ghostscript, PDF/X builds, contact sheets) run through `heavy-run.sh` (plan rules).
- No pnpm and no npm install. Commits name their paths (`git commit -- <paths>`).
- No paid generation without Daniel's go.
- Thai goes to Daniel only.

## Out of scope

- The song videos, the karaoke cut (S28, open), and the classroom extras.
- The full benchmark forms of design 7 (D5).
- Levels 1, 3, and 4, and the other Level 2 units (their own tracks; series plan section 7).
- The Storytime app and the QR page code (Monorepo).
- The covers of the books of the other units.

## Questions (each with a default)

1. Staging: the unit 2 weeks stay in `content/storytime/drafts/l2/` until Phase 4, and the week gate is `check-weeks.ts --level 2` on a stage root. Default: yes (FR-1.2, measured).
2. Benchmark 2 in the week 8 shape. Default: yes (D5).
3. Daniel's sittings for unit 2 (D9). Default: the dates of D9.
4. Daniel's go for the paid renders and songs (D10). Default: the PM asks after the English approval.
5. The unit 2 cover: Daniel's go is needed before the build (FR-7.2). Default: the PM asks after release 1 (2026-12-01).
6. A unit 2 card word that has a unit 1 picture of the same word uses that picture again, with no new render. Default: yes (FR-4.3, D13).

## Amendment 2026-11-16: hyphen word keys and the lint gate (Phase 1 acceptance findings PA-P1-1 and PA-P1-2)

The Phase 1 acceptance at head c9192a06 gave 2 findings. PA-P1-1: `STAGE_CHECKS` exits 1 with an uncaught error, `word clip: T-shirt: not a word key`, from `dashboard/lib/storytime/word-clips.ts:123` (rule K2), through the practice-clips row of `dashboard/scripts/storytime/check-weeks.ts:213`. PA-P1-2: `PROJECT_LINT` exits 2, because its unit 2 test glob matches no file before Phase 4. These decisions override rule K2 of `measure/archive/storytime_week_package_20261022/spec.md` for every week. The archived spec stays as it is.

- D-U2-K2 (the hyphen key): `bookWordKey` accepts one or more inner hyphens between letter runs. For example, `T-shirt` gives the key `t-shirt`. The clip stem keeps the hyphen (`t-shirt`). The TTS text of a hyphen key is the written form (`T-shirt`). The heard check accepts `t shirt`, `tshirt`, and `t-shirt` for `t-shirt`, in `WORD_CLIP_HEARD_VARIANTS`. A digit or an accent inside the text still throws. A hyphen at the start or at the end is still removed. D-U2-K10 gives the exact key rule, and D-U2-K11 gives the heard text.
- D-U2-K3 (the check never throws on one week): `check-weeks.ts` never throws on the data of one week. A key error becomes one FAIL row of the check that met it, with the week and the word. The other rows and the other weeks still print. The summary still prints. The exit stays 1. D-U2-K8 covers the other throw sites, and D-U2-K9 gives the row count.
- D-U2-K4 (unit 1 output does not change): no unit 1 week holds a hyphen word. Measured 2026-11-16 on `content/storytime/l2/w01.json` to `w08.json`: 0 hyphen words in the family words, the tricky words, the opening game, and the book sentence words. The word clips, the practice clips, and the check rows of st2/1 to st2/8 do not change.
- D-U2-L1 (the lint gate before Phase 4): `PROJECT_LINT` gets the eslint flag `--no-error-on-unmatched-pattern`. The unit 2 test glob then passes before its files exist. Plan line 32 holds this command, and no other part of the command changes.
- The measured facts of 2026-11-16 (step 0 of the amendment): the staged w10 holds `T-shirt` at `focus.family.words[2].word`, at `focus.family.words[2].image.caption`, and at `books[0].backWords[5]`. The family word form is the one that reaches `bookWordKey`, through `practiceWordKeys`. The 7 other staged weeks hold no hyphen word. The image prompts of w10 and w13 to w15 name `T-shirt` as prose only. No staged week holds a word clip or a practice clip yet: no `wordClips` map in `opening`, in `focus.family`, in `focus.trickyWordClips`, or in `books[].audio`. The clip maps come with Phase 6.

The spec review of 2026-11-16 (head 0dcb45d4, reviewer opencode-go/mimo-v2.6-flash) gave 3 Blockers (F5 to F7), 3 Majors (F8 to F10), and 5 Nits (F11 to F15). These decisions answer them. The code facts below were checked at head 7693a08c.

- D-U2-K5 (the flipped test pins): D-U2-K2 flips 2 pins of `dashboard/__tests__/storytime-package-clips.test.ts`. `bookWordKey('teddy-bear')` now gives `teddy-bear` (about lines 1201 to 1212). `wordClipPath` on a hyphen key no longer throws (about line 1237). The schema pin at about line 1345 accepts a hyphen key. Task 1.13a owns the pin edits. Red changes the pins in the same commit as the new cases. Task 1.13b changes no test file.
- D-U2-K6 (the schema keys): `dashboard/lib/storytime/schema.ts` joins the files of Task 1.13b. The 4 wordClips record keys at about lines 116, 130, 174, and 773 accept the same hyphen rule. One exported pattern holds the rule: `WORD_KEY_PATTERN` in `word-clips.ts`. The schema imports that pattern, and no second copy of the regex text stays in the schema.
- D-U2-K7 (the stage rule exception): this amendment is an exception to FR-1.1, to the `dashboard/` line of FR-9, and to the Phase 1 blast-radius line of the plan. Code under `dashboard/` may change before the unit 1 print order, for Tasks 1.13a to 1.13c only. Reason 1: the unit 1 print set is frozen. Daniel passed r6-v4 on 2026-11-16, the printer package is built and on Drive 10uUFqBu, and no rebuild follows. Reason 2: the print order of 2026-11-25 is cancelled. Daniel wrote on Google Tasks at 2026-11-16 09:56: "I won't send to print until after new year" (plan of `storytime_print_r1_20261025`, commit 05a34dcd). Reason 3: the unit 1 print files are byte copies, so a change under `dashboard/` cannot reach them. Every other task keeps FR-1.1, FR-9, and the Phase 4 start condition.
- D-U2-K8 (the opening-game throw): D-U2-K3 covers the key errors of a word only. The opening game has one more throw: `opening: no word form in line <i>` (`word-clips.ts` about lines 421 and 428, reached through line 448). That throw also becomes one FAIL row of the check that met it, in the same form. One Red case covers it. So no week data reaches a stack trace.
- D-U2-K9 (the row count of a key error): one FAIL row for each bad word of the week. `practiceWordKeys` collects every bad word, and it stops at no first error. `checkPracticeClips` prints one row for each bad word. Red has a case with 2 bad words: 2 FAIL lines, and each line names one word. The Summary counts both rows, and the exit stays 1.
- D-U2-K10 (the exact key rule): the WORD_KEY form is `/^[a-z]+(?:['-][a-z]+)*$/`, exported as `WORD_KEY_PATTERN`. The rule in words: one or more inner hyphens, and each hyphen sits between 2 letter runs. `t-shirt` is a key. A run of 2 hyphens (`t--shirt`) is refused, because one hyphen has no letter run after it. A hyphen next to an apostrophe group (`t-shirt's`) is allowed, and the key is `t-shirt's`. A hyphen at the start or at the end is removed, as D-U2-K2 says. A digit or an accent inside the text still throws.
- D-U2-K11 (the heard text): the heard check compares `heardText` output, which removes spaces and hyphens. So only `tshirt` can match in the bank pipeline. The 3 accepted forms apply to a raw call of `heardPasses`. `WORD_CLIP_HEARD_VARIANTS` gets one entry: `'t-shirt': ['t shirt', 'tshirt']`. Red pins `heardPasses` with the 3 raw strings and with the `heardText` output.
- D-U2-K12 (the text of a key FAIL row): the detail is `not a word key: <word>`. The form does not change between the word-clips row and the practice-clips row.

## Amendment 2026-11-17: the sound stages of weeks 9 to 16 (PA-P3-1)

The stage gate of 2026-11-17 (head 4597638c, evidence `measure/runs/storytime_l2_unit2_20261106/printgate-4597638c-summary.txt`) exits 1 with 21 FAIL rows. Twenty of them are the R14 sound stage rows of the 8 staged weeks: `sound-stage-plan` 8, `sound-stage-mix` 7, `sound-stage-day1` 5. Commit a318b199 added `dashboard/lib/storytime/sound-stages.ts`, `focus.paStage`, and the R14 rows. It also set `paStage` in w01 to w08. The 8 unit 2 drafts came before that change and never took it.

- D-U2-S1 (the cause): the 20 rows come from a missing `focus.paStage` and from sound units that ask 2 positions. The st2/12 `song-frame` row stays the recorded exception of D15.
- D-U2-S2 (the planned stage): `plannedSoundStage(2, 9)` to `plannedSoundStage(2, 16)` gives stage 2 with the positions `first` and `last`, in plan order. `SOUND_STAGE_PLAN` adds `last` from week 9 and `middle` from week 17. Each of the 8 drafts gets `focus.paStage` with stage 2 and the 2 positions. Week 9 also adds `english.phonics.pa.final-sound.identify` to `tags.taught`, because the stage starts in week 9.
- D-U2-S3 (one position for each unit): a unit that asks 2 positions becomes 2 units that ask one position each. The units are `focus.paSkill`, each `opening.pa` line, each script step, the check items, and the benchmark items. A split `opening.pa` line becomes 2 entries. The Thai of the 2 entries is the approved Thai of the original line, split at its clause boundary, and the 2 parts joined equal the original Thai bytes. The task writes no new Thai word. If a split is not byte-faithful, the role stops and puts the line to the PM.
- D-U2-S4 (day 1): `opening.pa[0]` holds no new sound, holds no untaught sound, and asks the first sound only. Default: it is the day-1 line of the previous teaching week of the level, copied word for word with its Thai, and its source week goes in the task line.
- D-U2-S5 (the tests): the Red test file `dashboard/__tests__/storytime-unit2-sound-stage.test.ts` pins the 3 R14 rows for the 8 drafts through the pure module `dashboard/lib/storytime/sound-stages.ts`. It holds one mutation case for each rule on a temporary copy of a week: a copy with no `paStage`, a copy with a 2-position unit, and a copy whose day-1 line names the new sound.
- D-U2-S6 (the scope): code under `dashboard/` may change now, and D-U2-K7 stands. Only the 8 staged files change in content. The Thai rule holds: no new Thai word, split only.
- D-U2-S7 (Daniel's words): the English before and after list of the changed `opening.pa` lines goes to the PM in the Task 3.3 batch, due 2026-11-28. No separate review round runs for that list.
- D-U2-S8 (the Phase 4 start): the app-side tasks of Phase 4 start without Daniel's print order. These are Tasks 4.1, 4.2, and the app half of Task 4.3 (the week read, the makers, the picture list, the step map). The print half of Task 4.3 (the picture copy and the print files) and the tasks of Phase 5 wait for the print order. Rule R1 stays: one open Red window at a time.
