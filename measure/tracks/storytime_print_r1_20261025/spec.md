# Spec: Storytime Advantage release-1 print

Track: `storytime_print_r1_20261025`. Type: feature (classic FR list). Created: 2026-10-25. Status: planned, no code.

## Overview

This track makes the print files of Storytime Advantage release 1: Level 2, unit 1, weeks 1 to 8 (decision S17). Daniel confirmed the split on 2026-10-25 through the PM session: Forge makes the pictures, and Workbooks makes the print files. Daniel ordered the work to start on 2026-10-25. The release-1 goal of 2026-12-01 stays (reaffirmed on 2026-10-25).

Workbooks makes six deliverables from the week packages:

1. The student book of Level 2 unit 1 (design §8).
2. The teacher book as a PDF/X-1a print file, from the existing template.
3. The read-along books and the decodable books of weeks 1 to 7 (7 + 7).
4. The card kit and the class-set items of unit 1 (review deck S10, Benchmark 1 S11).
5. The covers (S19), with the band name Sprout (S15).
6. The proofs: Daniel approves them by 2026-11-24, and the print order goes on 2026-11-25.

Week 1 comes first (generation rule 0.1). The week 1 student-book pages, the two week 1 books, and the week 1 teacher book are complete in print. Then Daniel approves them. Then weeks 2 to 8 start. The student book template is due on 2026-11-05 (monorepo plan, Phase 2).

## Sources

Other repositories are read-only for this track.

- Monorepo track `reading-advantage-monorepo/measure/tracks/storytime_advantage_program_20261021/` (master 2ae13a4c6): `design.md` §6.1, §6.2, §6.5 (pictures, line 524), §6.7 (page budget, line 544), §8 (print kit, line 570; student book, line 574), §9 (home card, line 588); `decisions.md` S10, S11, S15, S17, S19, S24; `plan.md` Phase 2 (line 58) and Phase 6 (lines 103 to 108). The plan has a rollback banner of 2026-10-25.
- `storytime-advantage/docs/s1-s28-survival.md` (622b956): S4 dies (the app comes first; print stays in scope); S23 dies (the QR host moves to Storytime's own service).
- `storytime-approval/re/generation-rules-draft2.md`: rule 6.7 is Daniel's rule (2026-10-24). The other rules are draft 2. This track applies 0.1, 0.3, 6.1 to 6.7, 7.1 to 7.4, 8.1 to 8.6, 9.1 to 9.3, 11.1 to 11.3, and 12.1 to 12.3.
- Workbooks: `content/storytime/README.md`; `content/storytime/l2/w01.json` to `w08.json` (the source of truth for all text; w01 is published, w02 to w08 are draft; w08 is the review week with `books: []` and no song); `dashboard/lib/storytime/*` (`manual.ts` is the teacher book template); `dashboard/scripts/storytime/make-manual-pdf.ts`; track `storytime_week_package_20261022` (its spec puts the student book, the cards, and the benchmark packs out of scope); the Primary print path `dashboard/scripts/print/make-pdfx.ts`; the cover kit `dashboard/lib/covers/*`, `dashboard/scripts/covers/make-cover.ts`, and track `book_covers_20261007` (Primary books only).
- Teacher book drafts, weeks 1 to 8, English and Thai: `~/Desktop/primary-parity-progress/storytime/*.pdf` (A4, 21 to 26 pages a week, PDF 1.4, not PDF/X). Storytime relayed that Daniel approved the Thai teacher books of weeks 1 to 8 with no corrections.

## Terms

- **Week package**: one file `content/storytime/l2/wNN.json`. It holds all text of the week.
- **Books**: the 7 read-along books and the 7 decodable books of weeks 1 to 7.
- **Picture**: a raster file that Forge makes. A vector shape that Workbooks makes is a **drawing** (the letter formation box, the book map, the cut lines).
- **Print file**: a PDF/X-1a file that `npx tsx scripts/print/make-pdfx.ts <file> --check` passes (exit code 0).
- **Proof**: a set of print files with a contact sheet of every page and a list of the files with their SHA-256 and source commit.
- **Approve**: only Daniel approves. A script, a model, or a peer session passes or fails a check.
- **Model pre-check**: the first-pass check of a picture by multimodal models (generation rule 6.7). It is never an approval.

## Functional Requirements

### FR-1 The print data contract

1. The week schema `dashboard/lib/storytime/schema.ts` gets one optional block `print`. It holds the student-book text that the scripts name but that the package does not store today:
   - the letter box: the letter, the formation words, the start point;
   - the practice sheet: the lines (sounds, words, phrases, one sentence) and the picture word at the start of each line;
   - the dictation lines: the letters, the words, and the sentence to trace;
   - the writing page: the trace text, the name or word line, and the picture box.
2. A new check compares the `print` text with the script steps A3, A7, C3, D4, and E5. Example: each word and sentence that step A7 tells the children to read is on the practice sheet (week 1: "A nest. A net." and the tricky word "and"). The teacher's other words ("Look at the page.") are not. A difference is an error.
3. `approval` gets a seventh part, `print`. Daniel's approval of the print of a week goes into the week package with his exact words and the date (generation rules 12.1 and 12.3).
4. The change is additive. All callers of `StorytimeWeekSchema` keep working (9 files; see the plan).

### FR-2 The picture list for Forge

1. A script reads the week packages and writes the list of every picture that the print files need: `content/storytime/l2/print/pictures.json` and a readable `pictures.md`.
2. Each row has: the id, the week, the use (book page, cover, check row, practice line, card, sticker), the text that the picture must show (`image.prompt`, `caption`, and the page text), the object counts from the text, the size class of FR-9, and the file name.
3. The file name says what the picture shows and has a version: `l2-w01-<use>-<what-it-shows>-v1.png` (generation rules 9.3 and 12.2).
4. The list is the record of the picture dependency on Forge. The PM session sends it to Forge.

### FR-3 The student book (design §8, line 574)

One book for Level 2 unit 1, built from the week packages. The default trim is A4 portrait (open point P2).

Pages:
- The front pages: a name page ("This book belongs to") and the book map.
- Each teaching week (1 to 7): the weekly spread, the picture-sound page of the Friday check, and the home card. The left page of the spread has the letter formation box and the practice sheet. The right page has the dictation lines and the frame sentence lines of the writing page.
- Week 8 (review week): the five review pages (`block.days[].paper`) and the Benchmark 1 page (`benchmark.paper`).
- The book map: one sticker place for each decodable book (weeks 1 to 7) and one place for the unit 1 sticker.

Rules:
- The weekly spread starts on a left page, so that its two pages face each other.
- The letter formation box shows the lower-case letter with a start dot and arrows, three copies to trace, and a space to write. The letter shapes agree with the formation words of step A3 (for example, the single-storey "a" of week 2: "Round to the left. Up to the top. Down.").
- The check page prints the rows of `check.items` in the order of the data, with the pictures (FR-2). It has no answer mark. The answers stay in the teacher book.
- The home card is perforated. Its leaf has no student work on either side. The front has the Thai card: `home.line.th`, the sound, the three words, the frame, `home.activity.th`, and two QR codes (the song and the read-along). The back has the English card and the song lines of the week. Week 8 has no song: its back has the English card and the seven song titles of unit 1.
- The student book has almost no Thai (design §6.5). Thai is only on the home card and on the cover.
- No page shows a CEFR level, an exam name ("Starters"), or "Reading A-Z".
- English text uses a font with a single-storey "a" and "g" (default: Andika, SIL OFL, static faces). Thai text uses Sarabun.

### FR-4 The teacher book as a print file (design §8)

1. The existing template (`lib/storytime/manual.ts`) and `make-manual-pdf.ts` make the Chrome PDF. `make-pdfx.ts` makes the PDF/X-1a print file.
2. Text gate: the text of the new Chrome PDF of a week is the same as the text of the draft that Daniel approved, except the page numbers. The gate reads the Chrome PDF, because `pdftotext` drops Thai tone marks in a PDF/X file (lessons-learned, 2026-10-02).
3. The file name has a version: `Storytime-Advantage-L2-U1-Teachers-Book-TH-v1_PDFX-1a.pdf` (rule 12.2).
4. Page 1 is the classroom language card (design §8, line 576) when Daniel approves its text (open point P9).

### FR-5 The books (design §6.1 and §6.2)

1. One layout serves the read-along books and the decodable books. The default is A5 landscape, 12 pages, self cover (open point P2).
2. Decodable page plan: cover; "Sounds in this book" (`soundsPage`); 8 story pages; a page with the QR code; back cover with the word list (`backWords`).
3. Read-along page plan: cover; title page with the QR code; 8 story pages; a page with the frame and the family words; back cover with the word list (`backWords`; week 1: hello, I, am, your, teacher).
4. Each story page has the picture of the page (FR-2) and the page text in the FR-3 font, large for young readers.
5. The cover shows the title, the band name "Sprout" (S15), "Storytime Advantage", and the week number.
6. A build in `final` mode stops with an error when a picture is missing, and names the picture id. A build in `proof` mode prints an empty box with the words "PICTURE MISSING". A `proof` file never goes to the printer.
7. The page text is the master. When a picture does not agree with the text, the picture goes back to Forge. The text does not change (rules 8.1 and 9.1).
8. The A3 big book (design §8) uses the same layout at twice the size. It prints only when Daniel says so (open point P8).

### FR-6 The covers (S19)

1. Workbooks makes the covers from Forge renders: the front and the back of the 14 books, the student book, and the teacher book.
2. A Storytime cover module reuses `lib/covers/compose.ts` (one opaque picture layer on each side) and the PDF/X path. It does not change the Primary cover contract (`COVER_BOOKS`, the CEFR badge).
3. A copy check fails a cover that does not show "Storytime Advantage", that shows "CEFR", a CEFR level, "Starters", or "Primary Advantage", or (for the 14 books) that does not show "Sprout".
4. Daniel approves each cover picture before Workbooks makes its print file (as rule R7 of `book_covers_20261007`). Daniel checks all Thai on a cover.

### FR-7 The card kit and the class sets (design §8, S10, S11)

1. A script reads the `materials` of every step of weeks 1 to 8 and makes the card list of unit 1: sound cards, picture cards, sound picture cards, family picture cards, tricky-word cards, word cards, frame cards, letter cards (class set), workmats (class set), the letter strip of Benchmark 1 (`benchmark.oneToOne.letters`, in its order), the sorting mat, the word wall card of each week, and the stickers (one for each decodable book and one for unit 1).
2. Sizes: design §8 gives A5 for the sound and symbol cards, and A6 for the picture cards and the tricky-word cards. Open point P2 gives defaults for the other items.
3. The review deck (S10) is the sound cards, the tricky-word cards, the word cards, and the frame cards that the day strips of the teacher book name. The kit has each card once for each classroom.
4. Benchmark 1 (S11): the paper part is a student-book page (FR-3). The one-to-one part uses the letter strip and the sound cards. The class record sheet and the reading record forms are in the teacher book already (`manual.ts`).
5. A class set is a quantity of books on the print order (open point P10). It is not a separate file.
6. Items with no content in the design or in the data (center cards, group signs, name cards, the alphabet frieze) stay out of release 1 unless Daniel adds them (open point P9).

### FR-8 The proofs and the print order

1. The week 1 proof: the week 1 student-book pages, the two week 1 books with their covers, and the week 1 teacher book in Thai and in English.
2. The release proof, by 2026-11-20: all print files, the contact sheets, and the print order sheet (item, file, SHA-256, trim, pages, paper, binding, colors, quantity for each classroom).
3. Every print file passes `make-pdfx.ts --check`. Every print file is newer than the last commit of its sources (lessons-learned, 2026-10-20).
4. Daniel approves the release proof by 2026-11-24. No answer is not an approval (rule 0.3).
5. The print order goes on 2026-11-25 after Daniel's go. Daniel, or the person he names, sends the files to the printer.

### FR-9 The default picture spec for Forge (version 0; Forge can use it now)

All classes: PNG, 8-bit, sRGB, opaque (no alpha channel), no CMYK, and no letters, words, or numbers in the picture. Each picture shows the objects in the counts that the text says (rule 9.2). The cast is the Forge cast at age 5 (the week 1 set of 2026-10-23). Each batch has a `manifest.json` with the file name, the picture-list id, the SHA-256, and the pixel size. Workbooks converts to CMYK (Japan Color 2001 Coated) in `make-pdfx.ts`.

| Class | Use | Pixels | Aspect | Background | Composition |
|---|---|---|---|---|---|
| A | Story pages of the books (112) | 3000 × 2250 | 4:3 landscape | The scene, opaque | Every named object, face, and hand in the central 90 percent. Workbooks can cut 5 percent at each edge. 300 ppi at 254 × 190 mm. |
| B | Covers: the 14 books, the student book, the teacher book | 3600 × 2700 | 4:3 landscape | The scene, opaque | One in-scene render with the cast in place. The top 30 percent is calm (sky or wall) for the title. |
| C | Picture words: check rows, practice lines, cards | 1500 × 1500 | 1:1 | White `#FFFFFF` | One object, or one person who does the action, centred, about 80 percent of the frame. |

The pictures sit in frames on white pages, so they need no bleed. S19 also lets Forge send transparent cast renders (2048 px, straight alpha). The default front cover is one in-scene render, because cut-outs did not read as part of the scene in the song video test (F7, 2026-10-23).

## Non-Functional Requirements

- Tests come first. New tests load the shipped week files `w01.json` to `w08.json`, not a hand-made fixture (rule 11.3).
- A check counts only after it fails on a broken copy (rule 11.1). Each new check has a mutation test on a copy in a temporary folder.
- Pictures go through three stages (rule 6.6). Stage 1: a measurement script (size, aspect, color mode, alpha, file name). Stage 2: the model pre-check (rule 6.7). Stage 3: the person that Daniel names.
- The model pre-check uses a written rubric for pictures. The rubric must first fail the known bad picture (the gesture thumbnail for "One sun") and pass a picture that Daniel approved. Release files need two models of two providers. The model and its price are named before the run and go into the cost ledger (rule 7.3).
- A person counts the objects in every picture against the text (rule 9.2).
- The agent opens every page of a proof before Daniel sees it (rule 6.5). A contact sheet shows every page (lessons-learned, 2026-10-20).
- Every task note states its evidence class: owner-approved, person-checked, automated, or peer-report (rule 7.1). A self-report never closes a task (rule 7.2).
- A changed print file or picture gets a new version number in its name (rule 12.2).
- A message to a peer quotes Daniel's words exactly and names one item (rule 12.3).
- When a decision changes, the spec and the plan change on the same day (rule 7.4).
- Daniel checks all Thai (rule 8.5). No CEFR in external copy. The product name is "Storytime Advantage".
- No paid generation without Daniel's go. The model pre-check is a paid call: its model and price need Daniel's go (open point P7).
- Heavy jobs (tsc, Chrome renders, Ghostscript) run under `flock ~/Desktop/primary-parity-progress/heavy.lock`. No port 3005.
- No `pnpm install`. No change to `package.json` or `pnpm-lock.yaml`. Fonts are static OFL faces with their OFL files (lessons-learned, 2026-10-02).
- Print files go to `~/Desktop/print-ready/storytime/`, outside git.
- No change to the Primary print templates, the Primary cover contract, or the pinned teacher-manual i18n.
- Other agents work in this checkout. Stage files path by path. Do not touch `video/**`.

## Acceptance Criteria (track level)

- AC-1: `make-pdfx.ts --check` exits 0 for every file on the print order sheet.
- AC-2: The student book of unit 1 has the pages of FR-3 for weeks 1 to 8. A test on the shipped week files proves the page order, the spread on a left page, the home card leaves, and the absence of answer marks.
- AC-3: The Thai teacher book of weeks 1 to 8 has 0 text differences from the approved drafts, except the page numbers. Each other difference is listed and Daniel approves it.
- AC-4: The 14 books have 12 pages each. Their page text is the same as the week packages. No print file has a "PICTURE MISSING" box.
- AC-5: Every picture in a print file has stage 1 and stage 2 results in its log and a person-checked object count.
- AC-6: No print file has the strings "CEFR", "Pre-A1", "Starters", or "Reading A-Z" (the step ids A1 to E6 of the teacher book are not CEFR levels). Every cover has "Storytime Advantage". On 2026-10-25 the 8 week packages have 0 of these strings.
- AC-7: Daniel's approvals of the week 1 proof and of the release proof are in the week packages with his exact words and dates.
- AC-8: The print order sheet names the printer, the order date, and the quantities, and Daniel gave the go to send it.

## Out of Scope

- The Storytime app, the at-home app, and the QR page (Storytime repository).
- The song videos (track `storytime_song_video_20261022`), the song audio, and the book audio.
- The pictures themselves (Forge).
- Levels 1, 3, and 4; Level 2 weeks 9 to 32; Benchmarks 2 to 4; the parent report; the routine videos; the training; the sales pack (PR).
- Any paid generation, and any message to the printer without Daniel's go.

## Open Points (Daniel decides; the track does not decide them)

| # | Point | Facts | Track default until Daniel answers |
|---|---|---|---|
| P1 | Book and song counts | S17 says 8 decodables, 8 read-alongs, and 8 songs. The packages have 7 + 7 + 7, because week 8 is the review week (design §3.5: "re-reads seven books and sings seven songs"; §6.7: 28 a level). | 7 + 7 books. |
| P2 | Print spec: trim, paper, binding, perforation, colors, bleed, printer | Design §8: "one A4 book". The Primary printer page is 210 × 285 mm (`paper: 'book'`, the Primary covers). The PDF/X path has no bleed. The printer is not named. | Student book: A4 portrait, 4 colors, 100 gsm uncoated inside, 250 gsm cover, saddle stitch, home card leaves perforated 12 mm from the spine, no bleed. Teacher book: A4, black only, 80 gsm, wire-o. Books: A5 landscape, 12 pages, self cover, 4 colors, 170 gsm coated, saddle stitch. Cards: 300 gsm, A5 and A6 n-up on A4 with cut lines. Stickers: round 40 mm on A4 sticker sheets. Profile: Japan Color 2001 Coated. Printer: the Primary printer. One profile constant in the code holds the trim; a test renders both A4 and 210 × 285 mm. |
| P3 | Picture spec and picture style | FR-9 is a default. Design §6.5 and S7 say the books use the Primary picture-book style with the Pip-world children "drawn young", and the packages hold 2D prompts. The 2026-10-25 split gives the pictures to Forge (3D chibi renders). | FR-9; the Forge cast at age 5. |
| P4 | The QR link after the S23 move | The packages and `storytimeQrUrl()` print `https://storytime.reading-advantage.com/th/st/<level>/<week>`. S23 dies (survival report). On 2026-10-25 at 18:50 (+08) that URL returned HTTP 404 (curl, also with `?part=song`). The brief says that the `/th/st/` URLs must keep working; the survival report does not say this. | Proofs print the current URLs with the mark "QR target open". The print order waits until Daniel names the printed URL and it answers on the live host. |
| P5 | Stop rule of week 1 | Monorepo plan: "if Daniel has not approved week 1 by 2026-11-05, release 1 ships weeks 1 to 4 in print on 2026-12-01 and weeks 5 to 8 in January 2027." This track sends the week 1 print proof on 2026-11-05 and asks for approval by 2026-11-09. | Ask Daniel on 2026-11-09 if he has not approved. |
| P6 | Teacher book language on the print order | Drafts exist in Thai and English. | Print the Thai book; keep the English file for review and sales. |
| P7 | Models and cost of the model pre-check | Rule 6.7 needs two models of two providers for release files, named with their price before the run. | No paid run before Daniel's go. |
| P8 | The A3 big book | Design §8: "the big book of the 28 read-along books (A3) or a tablet for the board". The scripts say "big book or screen". | Make the file; print only on Daniel's go. |
| P9 | The classroom language card and items without content | Design §8 lists the 12 instructions and the 24 gestures, but not the praise lines. Center cards, group signs, name cards, and the frieze have no content. | The card waits for Daniel's text; the other items stay out. |
| P10 | Class set size | Design §8: "class sets of 8 (pairs)". The scripts give "one for each pair", and design §3.5 counts 30 children (15 books). | Ask Daniel; the order sheet shows both numbers. |
| P11 | Title and scope of the student book | Release 1 is unit 1 only. | A unit 1 book: "Storytime Advantage, Level 2, Unit 1, Student Book". |
| P12 | Start of the Forge picture work | The Storytime repository says that its rebuild track starts after Daniel reads the survival report. The monorepo plan put the week 1 pictures on hold (`[b]`, 2026-10-25). | The PM session asks Forge to start the week 1 pictures now. |
| P13 | Does the week text carry? | Draft 2 rules list "book" and "check" among the things to make again. The monorepo plan and the survival report say that the authored weeks and the Thai checks carry. | The week text carries. |
| P14 | Approvals not recorded | Week 1 is published, but its file records no approval. `check-weeks.ts --level 2` exits 1 at 8e6df79 (st2/1 `published`: "text not approved; thai not approved; images not approved; audio not approved; song not approved; scripts not approved"). | The gate accepts only this known failure until Daniel's approvals are in the file. |

## Conflicts between the sources

1. **S4.** Approved 2026-10-22: print first, the app as a second track. The survival report: S4 dies, and the app comes first; print stays in scope. The Storytime milestone (one read-along, one decodable, one song) uses the same week 1 books and pictures as this track.
2. **S23 and the QR host.** Decided 2026-10-22: `storytime.reading-advantage.com` on the Primary service. The survival report: S23 dies. The Workbooks README, `files.ts`, and the tests still name that host, and it returns HTTP 404 today (P4).
3. **Who makes the pictures.** The 2026-10-07 owner rule in the Forge brief §6 and the Forge engine facts: "pictures are Workbooks, not Forge". Design §6.1 and §6.5: the Workbooks image pipeline and the Primary picture-book style. The 2026-10-25 split: Forge makes the assets. This track follows the newest decision (P3).
4. **Counts.** S17: 8 + 8 + 8. Design §3.5 and §6.7, and the packages: 7 + 7 + 7 (P1).
5. **Student-book pages.** Design §8 lists the formation box, the practice sheet, the frame sentence lines, the check page, the book map, and the home card. The packages also name "student book: dictation lines" (C3), "review page 1" to "review page 5", and "Benchmark 1 page". This track prints all of them.
6. **Benchmark 1 pass marks.** Design §7, letter-sound row: "Level 2 week 8: 26 and 26". Design §3.5 and `w08.json`: 20 of 26 letter names and 6 of 7 sounds. This track prints `w08.json`.
7. **Page budget.** Design §6.7: about 120 student-book pages and about 300 teacher-book pages a level. The Thai drafts are 21 to 26 A4 pages a week (195 pages for unit 1, about 780 for 32 weeks at the same rate). The FR-3 plan is about 5 pages a teaching week and 6 a review week (about 165 a level).
8. **Trim.** Design §8: A4. The Primary printer page: 210 × 285 mm. The teacher-book drafts: A4 office print (P2).
9. **The Thai approval commit.** Storytime relayed commit 4940776. That commit is the week 8 second Thai proofread (2026-10-22 10:43). The Thai drafts are dated 18:35 to 18:36 and have the S24 wording of 041017a (18:35:40). A field comparison showed that the printed fields of all 8 weeks are the same at 041017a and at 8e6df79, so the approved text is the current text.
10. **Stop rule.** The monorepo stop rule (2026-11-05) was for the week 1 content, which Daniel approved on 2026-10-22. Rule 0.1 adds a new gate: the whole week 1 in print (P5).
11. **Pictures on hold.** The monorepo plan puts the week 1 pictures at `[b] deferred:daniel` (rollback, 2026-10-25), while Daniel's order of 2026-10-25 starts the print work, which needs them (P12).
12. **Scope of "make again".** Draft 2 rules: "Everything else is made again", which includes "book" and "check". The monorepo plan and the survival report: the authored weeks carry (P13).
13. **Test data.** Rule 11.3: tests load the shipped week files. The existing Storytime tests use `__tests__/fixtures/storytime-week-fixture.ts`. The new tests of this track follow rule 11.3; the old tests stay.
14. **Classroom language card.** Design §8: "The same card is page 1 of the teacher book." The template has no such page, and the design gives no praise lines (P9).
15. **Class set size.** Design §8: sets of 8 for pairs. The scripts: one book for each pair, in classes of 30 (P10).
16. **Recorded approvals.** Week 1 is published (4d78b21), and the monorepo plan records Daniel's Thai approvals of weeks 1 to 8. No week file records an approval, and the `published` check fails (P14).
