# Spec: Storytime Advantage release-1 print

Track: `storytime_print_r1_20261025`. Type: feature (classic FR list). Created: 2026-10-25. Status: planned, no code.

## Overview

This track makes the print files of Storytime Advantage release 1: Level 2, unit 1, weeks 1 to 8 (decision S17). Daniel confirmed the split on 2026-10-25 through the PM session: Forge makes the pictures, and Workbooks makes the print files. Daniel ordered the work to start on 2026-10-25. The release-1 goal of 2026-12-01 stays (reaffirmed on 2026-10-25).

Workbooks makes six deliverables from the week packages:

1. The student workbook of Level 2 unit 1 (design §8): black and white, with the writing parts and the 14 readers (7 read-alongs, 7 decodables).
2. The teacher book as a PDF/X-1a print file, from the existing template.
3. The teacher's color A3 reader PDFs: 14 files, one reader per file. The teacher prints them on A3 and leads the class with them. Not a printer job.
4. The card kit (review deck S10, Benchmark 1 S11).
5. The covers of the workbook and the teacher book (S19), with the band name Sprout (S15). The 14 reader covers are reader pages (FR-5).
6. The proofs and the print order: Daniel approves the proofs by 2026-11-24, and the print order goes on 2026-11-25.

Week 1 comes first (generation rule 0.1). The week 1 workbook pages, the two week 1 readers (in the workbook and as color A3 PDFs), and the week 1 teacher book are complete in print. Then Daniel approves them. Then weeks 2 to 8 start. The workbook template is due on 2026-11-05 (monorepo plan, Phase 2).

## Decisions of 2026-10-25

Daniel spoke through the PM session. The evidence class of each decision below is peer-report of owner words.

- D1, about 21:10 ICT, verbatim: "We should have a workbook with the writing parts and "build your own" readers like Reading A-Z does. That means B&W (probably line drawings) pages of the book organized to slice out, fold, and staple."
- D2, about 21:25 ICT, verbatim: "1. 7 stories and decodables +1 review 2. yes, right for the student, but we can produce color pdfs for the teachers to printo on A3 and lead class with. 3. OK. 4. OK"
- The PM mapping of D2: item 1 gives the counts; item 2 gives the black-and-white workbook plus a new deliverable, the color reader PDFs that the teacher prints on A3; item 3 is OK to the QR address (P4); item 4 is OK to citing the record for the approvals (P14). Recorded as the PM's mapping.

Results:

1. One black-and-white A4 student workbook holds the writing parts and the 14 readers (7 read-alongs, 7 decodables). A reader is "build your own": workbook leaves that the child tears out, folds, and staples (changed 2026-11-03: no scissors step).
2. The separate color A5 books are out.
3. New deliverable: the teacher's color reader PDFs. Each page of the 14 readers is in color on A3. The teacher prints them and leads the class with them. Not a printer job.
4. Counts: 7 read-alongs, 7 decodables, 1 review week (week 8). The songs stay as the week files have them.
5. P4: print the S23 address `https://storytime.reading-advantage.com/th/st/<level>/<week>`. Source: decisions.md S23 (Daniel 2026-10-22: "Workbooks prints https://storytime.reading-advantage.com/th/st/2/1"). The address gives HTTP 404 today. The new app serves it (apps/storytime, build plan task 3.1). Monorepo plan task 7.4 checks every printed path on 2026-11-15.
6. P14: the week files record the approval sources. Orchestrator mapping (a default; Daniel checks it): (a) weeks 1 to 8, part `thai`: approved, date 2026-10-22, source = monorepo `storytime_advantage_program_20261021/plan.md` line 67 (week 1), line 80 (weeks 2 to 4), line 82 (weeks 5 to 7), line 155 (week 8); (b) week 1, parts `text` and `scripts`: approved, date 2026-10-23, words "publish week 1", source = Workbooks commit 4d78b21 (decision S29); (c) week 1, parts `images`, `audio`, `song`: stay draft, because Daniel's stop of 2026-10-24 (relayed by Storytime) discards the produced media, and the publish words came before the stop. The `published` FAIL of st2/1 then names only images, audio, and song. The six app parts get optional `source` and `words` fields; no new rule applies to them, because the existing tests use approved parts with a date only (FR-1.3).
7. P8: answered by D2 item 2. The color A3 reader PDFs replace the big book.
8. P10 (class set size): moot, because each child has the readers in the workbook. Dropped.

### The new P2 print defaults (Daniel checks them)

- Student workbook: A4 portrait, 210 × 297 mm. Inside: black only, printed on both sides, 80 gsm uncoated. Cover: 4/0 color on 250 gsm card, matte lamination. Binding: perfect binding. Perforation: every reader leaf and every home-card leaf 12 mm from the spine. Bleed: none. Extent: about 130 A4 pages (estimate; changed 2026-11-03, Daniel's proof answer: the readers take 6 leaves a week, and the extent was about 88).
- Reader in the workbook (changed 2026-11-04, Daniel's proof v3 answer of 2026-11-04 (Tasks `enRNY2RTZ0E3QU5sNE5Odg`, PM relay), verbatim: "Still wrong. Student book page are the wrong orientation. See this for for the right orientation." The reference is a leveled reader of 13 pages, 1440 × 931.5 pt, landscape. The line of 2026-11-03 is replaced): each reader page is 198 × 148.5 mm landscape (P15 default). The page is the A5 height and the torn-leaf width: a torn leaf is 198 × 297 mm after the 12 mm perforation. A reader has 12 pages (the page plans of FR-5.2 and FR-5.3 stay) and line-art pictures. Each side of an A4 reader leaf holds 2 reader pages, upright, one above the other, with a dashed fold line across the middle of the leaf (148.5 mm from the top; no cut line). A reader has 12 pages on 3 leaves. The two readers of a week fill 6 leaves. The reader is a top-fold booklet. The child tears out the 3 leaves, folds each on the fold line, nests them in leaf order (leaf 1 outside), and staples the fold at the top (2 staples). There is no scissors step. The bound book prints both sides of a leaf with the same top (the leaf turns over on its vertical spine edge). The imposition of the 3 nested leaves, from outer to inner (top|bottom as seen on each side): leaf 1 front 1|12, back 2|11; leaf 2 front 3|10, back 4|9; leaf 3 front 5|8, back 6|7. Every front page is turned 180 degrees and every back page is upright. After the fold, the closed reader shows page 1 with the fold at the top. The child turns each leaf up over the fold and sees the spreads 2/3, 4/5, 6/7, 8/9, 10/11 (top/bottom), then page 12, every page upright. Each leaf side has a small mark with the reader title and the leaf number (1 to 3) inside a page margin, clear of the fold line and the perforation. Page layout, as in the reference: a margin inside the page; one framed picture across the top, 158 × 107 mm (aspect between 4:3 and 4:2.7, so the 4:3 art loses at most 5 percent at each edge and the central 90 percent of the picture holds every named object); one or two large text lines under the picture, left-aligned with the picture (Andika, 24 pt, the size of the A5 text of 2026-11-03); the page number at the bottom right of pages 2 to 11; a small footer at the bottom left with the book title and "Level 2" on pages 2 to 12. The cover has no number and no footer.
- Color A3 teacher PDF (changed 2026-11-04, Daniel's proof v3 answer; the line of 2026-11-03 is replaced): the same page layout in color. Each reader page is on one A3 landscape page, 420 × 297 mm, at scale 2.0 (396 × 297 mm), centered, with 12 mm of white at the left and at the right. One reader page on each A3 page. An sRGB PDF for office printers. Not PDF/X. Not on the print order.
- Teacher book, home cards, cards, and stickers: unchanged (teacher book: A4, black only, 80 gsm, wire-o).
- The picture box is 158 × 107 mm on the reader page (changed 2026-11-04, Daniel's proof v3 answer; the box of 2026-11-03 is replaced). The pictures are 4000 × 3000 px, so no new render is needed; the box shows the central part of the picture (object-fit cover, at most 5 percent lost at each edge). On A3 the box is 316 × 214 mm.

## Decisions of 2026-10-26

Daniel answered on his approval page on 2026-10-26 at 18:52 ICT. The PM session relayed the answers. Evidence class: owner-approved.

The PM relay, verbatim:

> "(8) Student book title "Storytime Advantage, Level 2, Unit 1, Student Book": PASS. (9) Teacher book Thai only: PASS. No A3 big book in release 1: PASS. Centre cards, group signs, name cards, frieze out of release 1: PASS with his words: "We will not deliver STA for about 2-3 months, but we will begin presales soon. We want to keep the class accessories like these in the plan. Let's not forget them. We will also move to put STA into the Tutor Advantage app once STA is workable." So keep the four extras in the plan as later items, not deleted. Karaoke: not in release 1, and song audio goes to no outside service: PASS."

Results:

1. The student book title is "Storytime Advantage, Level 2, Unit 1, Student Book" (P11).
2. The teacher book is Thai only (P6). This track makes the Thai teacher-book print file only. The existing English drafts stay as they are. This track makes no English print file.
3. No A3 big book in release 1 (P8).
4. Center cards, group signs, name cards, and the alphabet frieze are out of release 1 and stay in the plan as later items (P9, FR-7.5). Daniel's words are in the relay above.
5. Karaoke is not in release 1, and the song audio goes to no outside service.
6. P7 (models and price of the picture pre-check) stays open. The PM session asked for a proposal with two models of two providers and their price, before Phase 4.

## Decisions of 2026-10-27

The PM session relayed Daniel's morning page at 05:42 ICT on 2026-10-27. Evidence class: owner words relayed by the PM session (peer-report of owner words).

Daniel's words, verbatim: "Deliver 12-01"

Results:

1. Release 1 delivers on 2026-12-01 (internal date; not a public date). This confirms the goal in the introduction; no task changes.
2. The teacher prints the Storytime reader pages on A3. This confirms D2 item 2 and FR-5.8 (the color A3 reader PDFs); no task changes.

## Decisions of 2026-11-03

Daniel answered the week 1 print proof. The PM session relayed the answer (Tasks `MU5DTEJZZU9meWk5YU9DQg`, his reply of 2026-11-03 13:44 ICT). Evidence class: owner words relayed by the PM session (peer-report of owner words). The week 1 proof is not approved.

Daniel's words, verbatim: "Readers are 4 reader pages per student book page, when it should be 2. The constructed books are going to be 1/4 A4. Far too small. Also, are you creating a completely different student book for each week? It should be one book for 8 weeks."

PM decisions (2026-11-03, 13:5x ICT, under Daniel's standing rule of 12:3x):

1. The approved pictures and text stay. Only the reader imposition and the reader size change. Andika and Sarabun stay.
2. Two proof steps: the week 1 A5 readers on 2026-11-05, and the one 8-week student book (all pages, contact sheet) on 2026-11-10.
3. Phase 7 starts 2026-11-04, before the Phase 6 approval.
4. The reader size question (P15) went to Daniel (Tasks `RkpsQWhMRkFRNzF3cWxSbw`, 13:54 ICT). The work starts with the default of P15.
5. P15 answer (Daniel, 2026-11-03 14:49 ICT, PM relay, Tasks `RkpsQWhMRkFRNzF3cWxSbw`), verbatim: "Understood and approved". The reader stays inside the bound book as tear-out leaves; each reader page is 148.5 × 198 mm. Daniel also accepted the one-book answer and the two proof dates: 2026-11-05 for the week 1 A5 readers and 2026-11-10 for the full 8-week book.
6. Correction 2026-11-03 16:3x: the back pairs and the page turn of FR-5.1 were wrong in commit 17bc3225 (an orchestrator error in the brief); the Red tests of commit cd08e412 hold the correct order.

Results: the new reader rules are in the P2 defaults, FR-3, FR-5.1, FR-5.8, FR-9, and P15. The student book is one book for 8 weeks (FR-3).

## Sources

Other repositories are read-only for this track.

- Monorepo track `reading-advantage-monorepo/measure/tracks/storytime_advantage_program_20261021/` (master 2ae13a4c6): `design.md` §6.1, §6.2, §6.5 (pictures, line 524), §6.7 (page budget, line 544), §8 (print kit, line 570; student book, line 574), §9 (home card, line 588); `decisions.md` S10, S11, S15, S17, S19, S24; `plan.md` Phase 2 (line 58) and Phase 6 (lines 103 to 108). The plan has a rollback banner of 2026-10-25.
- `storytime-advantage/docs/s1-s28-survival.md` (622b956): S4 dies (the app comes first; print stays in scope); S23 dies (the QR host moves to Storytime's own service).
- `storytime-approval/re/generation-rules-draft2.md`: rule 6.7 is Daniel's rule (2026-10-24). The other rules are draft 2. This track applies 0.1, 0.3, 6.1 to 6.7, 7.1 to 7.4, 8.1 to 8.6, 9.1 to 9.3, 11.1 to 11.3, and 12.1 to 12.3.
- Workbooks: `content/storytime/README.md`; `content/storytime/l2/w01.json` to `w08.json` (the source of truth for all text; w01 is published, w02 to w08 are draft; w08 is the review week with `books: []` and no song); `dashboard/lib/storytime/*` (`manual.ts` is the teacher book template); `dashboard/scripts/storytime/make-manual-pdf.ts`; track `storytime_week_package_20261022` (its spec puts the student book, the cards, and the benchmark packs out of scope); the Primary print path `dashboard/scripts/print/make-pdfx.ts`; the cover kit `dashboard/lib/covers/*`, `dashboard/scripts/covers/make-cover.ts`, and track `book_covers_20261007` (Primary books only).
- Teacher book drafts, weeks 1 to 8, English and Thai: `~/Desktop/primary-parity-progress/storytime/*.pdf` (A4, 21 to 26 pages a week, PDF 1.4, not PDF/X). Storytime relayed that Daniel approved the Thai teacher books of weeks 1 to 8 with no corrections.

## Terms

- **Week package**: one file `content/storytime/l2/wNN.json`. It holds all text of the week.
- **Readers**: the 7 read-along readers and the 7 decodable readers of weeks 1 to 7. Each reader is "build your own": workbook leaves that the child tears out, folds, and staples.
- **Line art**: the black-and-white output of a picture: a grayscale PNG with black outlines on an opaque white background (FR-9). The workbook prints line art only.
- **Color A3 PDF**: an sRGB PDF with one reader page in color on each A3 page. The teacher prints it and leads the class with it. It is not a print file.
- **Picture**: a raster file that Forge makes. A vector shape that Workbooks makes is a **drawing** (the letter formation box, the book map, the cut lines, the fold lines).
- **Print file**: a PDF/X-1a file that `npx tsx scripts/print/make-pdfx.ts <file> --check` passes (exit code 0).
- **Proof**: a set of print files and color A3 reader PDFs with a contact sheet of every page and a list of the files with their SHA-256 and source commit.
- **Approve**: only Daniel approves. A script, a model, or a peer session passes or fails a check.
- **Model pre-check**: the first-pass check of a picture by multimodal models (generation rule 6.7). It is never an approval.

## Functional Requirements

### FR-1 The print data contract

1. The week schema `dashboard/lib/storytime/schema.ts` gets one optional block `print`. It holds the workbook text that the scripts name but that the package does not store today:
   - the letter box: the letter, the formation words, the start point;
   - the practice sheet: the lines (sounds, words, phrases, one sentence) and the picture word at the start of each line. The picture word of a practice line is not printed on another practice line of the block, and it is a word of the week (a book page text, a picture word of `check.items`, or a home card word). Source: review F1 and F2 (2026-10-25);
   - the dictation lines: the letters, the words, and the sentence to trace;
   - the writing page: the trace text, the name or word line, and the picture box.
2. A new check compares the `print` text with the script steps A3, A7, C3, D4, and E5. Example: each word and sentence that step A7 tells the children to read is on the practice sheet (week 1: "A nest. A net." and the tricky word "and"). The teacher's other words ("Look at the page.") are not. A difference is an error.
3. `approval` gets a seventh part, `print`. Daniel's approval of the print of a week goes into the week package in a `words` field (his exact words) and a date (generation rules 12.1 and 12.3). The six app parts also get optional `source` and `words` fields, so that a recorded approval can cite its record (P14). No new rule applies to them; the existing tests use approved parts with a date only.
4. The change is additive. All callers of `StorytimeWeekSchema` keep working (9 files; see the plan).

### FR-2 The picture list for Forge

1. A script reads the week packages and writes the list of every picture that the print files and the color A3 PDFs need: `content/storytime/l2/print/pictures.json` and a readable `pictures.md`.
2. Each row has: the id, the week, the use (story page, reader cover, check row, practice line, card, sticker), the text that the picture must show (`image.prompt`, `caption`, and the page text), the object counts from the text, the size class of FR-9, the color file name, and the line-art file name.
3. The color file name says what the picture shows and has a version: `l2-w01-<use>-<what-it-shows>-v1.png` (generation rules 9.3 and 12.2). The line-art file name is the color file name with `-line` before the version: `l2-w01-story-page-a-nest-line-v1.png`.
4. The list is the record of the picture dependency on Forge. The PM session sends it to Forge.

### FR-3 The student workbook (design §8, line 574)

One workbook for Level 2 unit 1, built from the week packages. The default trim is A4 portrait (P2 defaults, 2026-10-25). The workbook is black only. It holds the writing parts and the reader leaves of each week 1 to 7 (FR-5). The pictures in the workbook are line art (FR-9).

The workbook is ONE book for the 8 weeks of unit 1 (Daniel, 2026-11-03: "It should be one book for 8 weeks."). A proof file with fewer weeks is a part of this one book, not a separate book.

Pages:
- The front pages: a name page ("This book belongs to") and the book map.
- Each teaching week (1 to 7): the weekly spread, the picture-sound page of the Friday check, the home card, and the 6 reader leaves (2 readers × 3 leaves; FR-5.1; changed 2026-11-03, Daniel's proof answer). The left page of the spread has the letter formation box and the practice sheet. The right page has the dictation lines and the frame sentence lines of the writing page.
- Week 8 (review week): the five review pages (`block.days[].paper`) and the Benchmark 1 page (`benchmark.paper`).
- The book map: one sticker place for each decodable reader (weeks 1 to 7) and one place for the unit 1 sticker.

Rules:
- The weekly spread starts on a left page, so that its two pages face each other.
- The letter formation box shows the lower-case letter with a start dot and arrows, three copies to trace, and a space to write. The letter shapes agree with the formation words of step A3 (for example, the single-storey "a" of week 2: "Round to the left. Up to the top. Down.").
- The check page prints the rows of `check.items` in the order of the data, with the pictures (FR-2). It has no answer mark. The answers stay in the teacher book.
- The home card leaf and every reader leaf are perforated 12 mm from the spine (P2 defaults). The home-card leaf has no student work on either side. The front has the Thai card: `home.line.th`, the sound, the three words, the frame, `home.activity.th`, and two QR codes (the song and the read-along). The back has the English card and the song lines of the week. Week 8 has no song: its back has the English card and the seven song titles of unit 1.
- The workbook has almost no Thai (design §6.5). Thai is only on the home card and on the cover.
- No page shows a CEFR level, an exam name ("Starters"), or "Reading A-Z".
- English text uses a font with a single-storey "a" and "g" (default: Andika, SIL OFL, static faces). Thai text uses Sarabun.

### FR-4 The teacher book as a print file (design §8)

1. The existing template (`lib/storytime/manual.ts`) and `make-manual-pdf.ts` make the Chrome PDF. `make-pdfx.ts` makes the PDF/X-1a print file.
2. Text gate: the text of the new Chrome PDF of a week is the same as the text of the draft that Daniel approved, except the page numbers. The gate reads the Chrome PDF, because `pdftotext` drops Thai tone marks in a PDF/X file (lessons-learned, 2026-10-02).
3. The file name has a version: `Storytime-Advantage-L2-U1-Teachers-Book-TH-v1_PDFX-1a.pdf` (rule 12.2).
4. Page 1 is the classroom language card (design §8, line 576) when Daniel approves its text (open point P9).

### FR-5 The readers (design §6.1 and §6.2)

1. One page layout serves the read-along readers and the decodable readers (changed 2026-11-04, Daniel's proof v3 answer of 2026-11-04 (Tasks `enRNY2RTZ0E3QU5sNE5Odg`, PM relay), verbatim: "Still wrong. Student book page are the wrong orientation. See this for for the right orientation." The reference is a leveled reader of 13 pages, 1440 × 931.5 pt, landscape. The text of 2026-11-03 is replaced): 12 pages of 198 × 148.5 mm landscape (P15 default; the page plans of 5.2 and 5.3 stay). Each reader lives in the workbook as 3 A4 leaves. A torn leaf is 198 × 297 mm and holds 2 reader pages, upright (no turn of 90 degrees), one above the other, with a dashed fold line across the middle of the leaf (148.5 mm from the top; no cut line). The two readers of a week fill 6 leaves. The reader is a top-fold booklet. The child tears out the 3 leaves, folds each on the fold line, nests them in leaf order (leaf 1 outside), and staples the fold at the top (2 staples). There is no scissors step. The bound book prints both sides of a leaf with the same top (the leaf turns over on its vertical spine edge). The imposition of the 3 nested leaves, from outer to inner (top|bottom as seen on each side): leaf 1 front 1|12, back 2|11; leaf 2 front 3|10, back 4|9; leaf 3 front 5|8, back 6|7. Every front page is turned 180 degrees and every back page is upright. After the fold, the closed reader shows page 1 with the fold at the top. The child turns each leaf up over the fold and sees the spreads 2/3, 4/5, 6/7, 8/9, 10/11 (top/bottom), then page 12, every page upright. Every reader leaf is perforated 12 mm from the spine of the workbook (P2 defaults). Each leaf side has a small mark with the reader title and the leaf number (1 to 3) inside a page margin, clear of the fold line and the perforation. The reader pictures in the workbook are line art (FR-9). Page layout, as in the reference: a margin inside the page; one framed picture across the top, 158 × 107 mm (aspect between 4:3 and 4:2.7, so the 4:3 art loses at most 5 percent at each edge and the central 90 percent of the picture holds every named object); one or two large text lines under the picture, left-aligned with the picture (Andika, 24 pt, the size of the A5 text of 2026-11-03); the page number at the bottom right of pages 2 to 11; a small footer at the bottom left with the book title and "Level 2" on pages 2 to 12. The cover has no number and no footer.
2. Decodable reader page plan: cover; "Sounds in this book" (`soundsPage`); 8 story pages; a page with the QR code; back cover with the word list (`backWords`).
3. Read-along reader page plan: cover; title page with the QR code; 8 story pages; a page with the frame and the family words; back cover with the word list (`backWords`; week 1: hello, I, am, your, teacher).
4. Each story page has the picture of the page (FR-2) and the page text in the FR-3 font, large for young readers.
5. The reader cover shows the title, the band name "Sprout" (S15), "Storytime Advantage", and the week number.
6. A build in `final` mode stops with an error when a picture is missing, and names the picture id. A build in `proof` mode prints an empty box with the words "PICTURE MISSING". A `proof` file never goes to the printer.
7. The page text is the master. When a picture does not agree with the text, the picture goes back to Forge. The text does not change (rules 8.1 and 9.1).
8. The color A3 reader PDF (changed 2026-11-04, Daniel's proof v3 answer; the text of 2026-11-03 is replaced): the same 12 pages in color, with one reader page on each A3 landscape page, 420 × 297 mm. The page is at scale 2.0 (396 × 297 mm), centered, with 12 mm of white at the left and at the right. It is an sRGB PDF for office printers. It is not PDF/X and not on the print order. The teacher prints it on A3 and leads the class with it (D2, 2026-10-25).

### FR-6 The covers (S19)

1. Workbooks makes the covers from Forge renders: the front and the back of the workbook and the teacher book. The 14 reader covers are reader pages (FR-5), not covers of this module.
2. A Storytime cover module reuses `lib/covers/compose.ts` (one opaque picture layer on each side) and the PDF/X path. It does not change the Primary cover contract (`COVER_BOOKS`, the CEFR badge).
3. A copy check fails a cover that does not show "Storytime Advantage", that shows "CEFR", a CEFR level, "Starters", or "Primary Advantage", or (for the 14 readers) that does not show "Sprout". The check also runs on the reader cover pages.
4. Daniel approves each cover picture before Workbooks makes its print file (as rule R7 of `book_covers_20261007`). This includes each reader cover picture, in line art and in color. Daniel checks all Thai on a cover.
5. The track `storytime_covers_20261027` owns `lib/storytime/print/covers.ts`, `lib/storytime/print/cover-picture.ts`, `content/storytime/covers/books.json`, `scripts/storytime/make-storytime-book-cover.ts`, and the Level 2 Unit 1 workbook cover print file. This track reads these files and does not change them; a needed change goes to the orchestrator. This track keeps the teacher-book cover, and the PM approved this boundary on 2026-10-27 at 06:41 ICT (cover track spec P5).

### FR-7 The card kit (design §8, S10, S11)

1. A script reads the `materials` of every step of weeks 1 to 8 and makes the card list of unit 1: sound cards, picture cards, sound picture cards, family picture cards, tricky-word cards, word cards, frame cards, letter cards (class set), workmats (class set), the letter strip of Benchmark 1 (`benchmark.oneToOne.letters`, in its order), the sorting mat, the word wall card of each week, and the stickers (one for each decodable reader and one for unit 1).
2. Sizes: design §8 gives A5 for the sound and symbol cards, and A6 for the picture cards and the tricky-word cards. Open point P2 gives defaults for the other items.
3. The review deck (S10) is the sound cards, the tricky-word cards, the word cards, and the frame cards that the day strips of the teacher book name. The kit has each card once for each classroom.
4. Benchmark 1 (S11): the paper part is a workbook page (FR-3). The one-to-one part uses the letter strip and the sound cards. The class record sheet and the reading record forms are in the teacher book already (`manual.ts`).
5. Center cards, group signs, name cards, and the alphabet frieze are out of release 1 (owner-approved 2026-10-26) and stay in the plan as later items (open point P9). The classroom language card still waits for Daniel's text (unchanged).

### FR-8 The proofs and the print order

1. The week 1 proof: the week 1 workbook pages with the two readers, the two color A3 reader PDFs, and the week 1 teacher book in Thai.
2. The release proof, by 2026-11-20: all print files, the contact sheets, and the print order sheet (item, file, SHA-256, trim, pages, paper, binding, colors, quantity for each classroom). The print order sheet lists printer jobs only. The color A3 reader PDFs get their own file list, with the SHA-256 of each file, for the teachers.
3. Every print file passes `make-pdfx.ts --check`. Every print file is newer than the last commit of its sources (lessons-learned, 2026-10-20).
4. Daniel approves the release proof by 2026-11-24. No answer is not an approval (rule 0.3).
5. The print order goes on 2026-11-25 after Daniel's go. Daniel, or the person he names, sends the files to the printer.

### FR-9 The picture spec for Forge (version 1, 2026-10-25)

Each reader page (the story pages and the reader covers) has two outputs: line art for the workbook, and color for the A3 PDFs. Every other row of the picture list (FR-2) also has two outputs, because the whole workbook is black and white.

Color rules: PNG, 8-bit, sRGB, opaque (no alpha channel), no CMYK, and no letters, words, or numbers in the picture. Each picture shows the objects in the counts that the text says (rule 9.2). The cast is the Forge cast at age 5 (the week 1 set of 2026-10-23). Each batch has a `manifest.json` with the file name, the picture-list id, the SHA-256, and the pixel size. Workbooks converts to CMYK (Japan Color 2001 Coated) in `make-pdfx.ts`.

| Class | Use | Pixels | Aspect | Background | Composition |
|---|---|---|---|---|---|
| A | Reader story pages (112) | 4000 × 3000 | 4:3 landscape | The scene, opaque | Every named object, face, and hand in the central 90 percent. Workbooks can cut 5 percent at each edge. |
| B | Reader covers (14) | 4000 × 3000 | 4:3 landscape | The scene, opaque | One in-scene render with the cast in place. The top 30 percent is calm (sky or wall) for the title. |
| C | Picture words: check rows, practice lines, cards | 1500 × 1500 | 1:1 | White `#FFFFFF` | One object, or one person who does the action, centred, about 80 percent of the frame. |

Size reason: version 0 (3000 × 2250) gives about 282 ppi in the A3 picture box (about 270 mm wide), under the 300 ppi target. 4000 px gives about 376 ppi. Class C keeps 1500 × 1500.

Line art, for every row: the same pixel size as the color class of the row; PNG, 8-bit, grayscale; an opaque white `#FFFFFF` background; black outlines only, with no gray fill or shading (anti-aliased edges are allowed); closed outlines, so that a child can color the picture; no line thinner than 12 px; no letters, words, or numbers in the picture; the same scene, cast, and object counts as the color render of the row (rule 9.2). File name: the color file name with `-line` before the version, for example `l2-w01-story-page-a-nest-line-v1.png`.

Workbooks prints only the line art in the workbook and only the color in the A3 PDFs. The cover art of the workbook and the teacher book is not a picture-list row; the cover module composes it (FR-6).

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

- AC-1: `make-pdfx.ts --check` exits 0 for every file on the print order sheet. The print order sheet lists printer jobs only; the color A3 reader PDFs are not on it (FR-8.2).
- AC-2: The student workbook of unit 1 has the pages of FR-3 for weeks 1 to 8. A test on the shipped week files proves the page order, the spread on a left page, the home card leaves, and the absence of answer marks.
- AC-3: The Thai teacher book of weeks 1 to 8 has 0 text differences from the approved drafts, except the page numbers. Each other difference is listed and Daniel approves it.
- AC-4: The 14 readers have 12 pages each, in the workbook (line art) and in the color A3 PDFs. Their page text is the same as the week packages. No print file has a "PICTURE MISSING" box.
- AC-5: Every picture in a print file has stage 1 and stage 2 results in its log and a person-checked object count.
- AC-6: No print file has the strings "CEFR", "Pre-A1", "Starters", or "Reading A-Z" (the step ids A1 to E6 of the teacher book are not CEFR levels). Every cover has "Storytime Advantage". On 2026-10-25 the 8 week packages have 0 of these strings.
- AC-7: Daniel's approvals of the week 1 proof and of the release proof are in the week packages with his exact words and dates.
- AC-8: The print order sheet names the printer, the order date, and the quantities, and Daniel gave the go to send it.
- AC-9: The 14 color A3 reader PDFs exist. Each page is A3 and sRGB. No page has a "PICTURE MISSING" box.

## Out of Scope

- The Storytime app, the at-home app, and the QR page (Storytime repository).
- The song videos (track `storytime_song_video_20261022`), the song audio, and the book audio.
- The pictures themselves (Forge).
- Levels 1, 3, and 4; Level 2 weeks 9 to 32; Benchmarks 2 to 4; the parent report; the routine videos; the training; the sales pack (PR).
- A printer job for the color A3 reader PDFs: the teachers print them (FR-5.8).
- Any paid generation, and any message to the printer without Daniel's go.

## Open Points (Daniel decides; the track does not decide them)

| # | Point | Facts | Track default until Daniel answers |
|---|---|---|---|
| P1 | Book and song counts | S17 says 8 decodables, 8 read-alongs, and 8 songs. The packages have 7 + 7 + 7, because week 8 is the review week (design §3.5: "re-reads seven books and sings seven songs"; §6.7: 28 a level). | Answered 2026-10-25 (D2 item 1; peer-report of owner words, PM relay): 7 read-alongs, 7 decodables, 1 review week (week 8). The songs stay as the week files have them. |
| P2 | Print spec: trim, paper, binding, perforation, colors, bleed, printer | Design §8: "one A4 book". The Primary printer page is 210 × 285 mm (`paper: 'book'`, the Primary covers). The PDF/X path has no bleed. The printer is not named. | Answered in part 2026-10-25 (D1 and D2 item 2; peer-report of owner words). New defaults; Daniel checks them (the section "Decisions of 2026-10-25"). Student workbook: A4 portrait 210 × 297 mm; inside black only, printed on both sides; 80 gsm uncoated; cover 4/0 color on 250 gsm card, matte lamination; perfect binding; every reader leaf and every home-card leaf perforated 12 mm from the spine; no bleed; about 130 pages (estimate; changed 2026-11-03, Daniel's proof answer). Reader in the workbook (changed 2026-11-04, Daniel's proof v3 answer): 198 × 148.5 mm landscape (P15 default), 12 pages, line art; 3 leaves with 2 upright reader pages, one above the other, a dashed fold line across the middle of the leaf (no cut line); top fold; leaf 1 front 1|12, back 2|11; leaf 2 front 3|10, back 4|9; leaf 3 front 5|8, back 6|7; every front page turned 180 degrees, every back page upright; the child folds each leaf and staples the fold at the top; the two readers of a week fill 6 leaves; no scissors step (FR-5.1). Color A3 teacher PDF (changed 2026-11-04): A3 landscape 420 × 297 mm, one reader page on each page at scale 2.0 (396 × 297 mm), centered, 12 mm of white at the left and at the right; sRGB, not PDF/X, not on the print order. Teacher book: A4, black only, 80 gsm, wire-o (unchanged). Home cards: unchanged. Cards: 300 gsm, A5 and A6 n-up on A4 with cut lines (unchanged). Stickers: round 40 mm on A4 sticker sheets (unchanged). Profile: Japan Color 2001 Coated. Printer: the Primary printer. One profile constant in the code holds the trim. |
| P3 | Picture spec and picture style | FR-9 is a default. Design §6.5 and S7 say the books use the Primary picture-book style with the Pip-world children "drawn young", and the packages hold 2D prompts. The 2026-10-25 split gives the pictures to Forge (3D chibi renders). | Answered 2026-10-25 (owner-answer relayed by the PM session): the books use Forge 3D renders, with one character look for the books and the videos. Forge makes more poses on request; new assets are made when needed. Daniel's words: "We can use the same style for the entire system, I think. We have the 3D assets from Forge. If they need more poses, we can request them. If we need additional assets, we can create them. One character look for both books and videos seems like a good idea!" Forge starts the paid week 1 renders on 2026-10-25 (PM session). |
| P4 | The QR link after the S23 move | The packages and `storytimeQrUrl()` print `https://storytime.reading-advantage.com/th/st/<level>/<week>`. S23 dies (survival report). On 2026-10-25 at 18:50 (+08) that URL returned HTTP 404 (curl, also with `?part=song`). The brief says that the `/th/st/` URLs must keep working; the survival report does not say this. | Answered 2026-10-25 (D2 item 3 and the PM mapping; peer-report of owner words): print the S23 address `https://storytime.reading-advantage.com/th/st/<level>/<week>`. Source: decisions.md S23 (Daniel 2026-10-22: "Workbooks prints https://storytime.reading-advantage.com/th/st/2/1"). The address gives HTTP 404 today. The new app serves it (apps/storytime, build plan task 3.1). Monorepo plan task 7.4 checks every printed path on 2026-11-15. |
| P5 | Stop rule of week 1 | Monorepo plan: "if Daniel has not approved week 1 by 2026-11-05, release 1 ships weeks 1 to 4 in print on 2026-12-01 and weeks 5 to 8 in January 2027." This track sends the week 1 print proof on 2026-11-05 and asks for approval by 2026-11-09. | Answered 2026-10-25 (peer-report, PM relay of Daniel's standing words): the old 11-05 stop rule does not apply to the week 1 print approval. |
| P6 | Teacher book language on the print order | Drafts exist in Thai and English. | Answered 2026-10-26 (owner-approved): the teacher book is Thai only. Orchestrator mapping, for Daniel's check: this track makes the Thai teacher-book print file only; the existing English drafts stay as they are, and this track makes no English print file. |
| P7 | Models and cost of the model pre-check | Rule 6.7 needs two models of two providers for release files, named with their price before the run. | Answered 2026-10-27 (peer-report, PM relay of Daniel's answer, point 4): H1 yes. Two models of two providers check each release picture: Doubao and MiniMax. Both must pass. Kimi is the reserve. A person counts the objects last (rule 9.2). The calibration runs first. Calibration 2026-10-27 08:01 ICT: 8 pictures, X1 to X8; doubao-seed-2.1-pro and minimax-m3 on the volcengine-agent-plan route; Ark Agent Plan quota, no extra charge. Both models gave the same verdict on all 8 pictures: PASS on X2 and X5 (the known-good pictures) and FAIL on X1, X3, X4, X6, X7, and X8 (the known-bad pictures). Files: ~/Desktop/asset-requests/2026-10-27/picture-precheck-calibration/ (result-doubao.json, result-minimax.json, ledger-doubao.csv, ledger-minimax.csv). The Doubao ledger row has unquoted commas; it gets a fix when the cost ledger of rule 7.3 becomes one file. |
| P8 | The A3 big book | Design §8: "the big book of the 28 read-along books (A3) or a tablet for the board". The scripts say "big book or screen". | Answered 2026-10-25 (D2 item 2; peer-report of owner words): the color A3 reader PDFs replace the big book. No big-book print file. Confirmed 2026-10-26 (owner-approved): no A3 big book in release 1. |
| P9 | The classroom language card and items without content | Design §8 lists the 12 instructions and the 24 gestures, but not the praise lines. Center cards, group signs, name cards, and the frieze have no content. | The classroom language card still waits for Daniel's text (unchanged). Center cards, group signs, name cards, and the alphabet frieze are out of release 1 (owner-approved 2026-10-26) and stay in the plan as later items. |
| P10 | Class set size | Design §8: "class sets of 8 (pairs)". The scripts give "one for each pair", and design §3.5 counts 30 children (15 books). | Moot 2026-10-25 (D2 item 1; peer-report of owner words): each child has the readers in the workbook, so there is no class set of books. Dropped. |
| P11 | Title and scope of the student book | Release 1 is unit 1 only. | Answered 2026-10-26 (owner-approved): the title "Storytime Advantage, Level 2, Unit 1, Student Book". |
| P12 | Start of the Forge picture work | The Storytime repository says that its rebuild track starts after Daniel reads the survival report. The monorepo plan put the week 1 pictures on hold (`[b]`, 2026-10-25). | Answered 2026-10-25 (peer-report, PM relay of Daniel's standing words): yes, Forge starts the week 1 pictures now. |
| P13 | Does the week text carry? | Draft 2 rules list "book" and "check" among the things to make again. The monorepo plan and the survival report say that the authored weeks and the Thai checks carry. | Answered 2026-10-25 (peer-report, PM relay of Daniel's standing words): yes, the authored text of weeks 1 to 8 and their Thai checks carry over, and the print does not make "book" or "check" content again. |
| P14 | Approvals not recorded | Week 1 is published, but its file records no approval. `check-weeks.ts --level 2` exits 1 at 8e6df79 (st2/1 `published`: "text not approved; thai not approved; images not approved; audio not approved; song not approved; scripts not approved"). | Answered 2026-10-25 (D2 item 4 and the PM mapping; peer-report of owner words). The week files record the approval sources. Mapping (a default; Daniel checks it): (a) weeks 1 to 8, part `thai`: approved, date 2026-10-22, source = monorepo `storytime_advantage_program_20261021/plan.md` line 67 (week 1), line 80 (weeks 2 to 4), line 82 (weeks 5 to 7), line 155 (week 8); (b) week 1, parts `text` and `scripts`: approved, date 2026-10-23, words "publish week 1", source = Workbooks commit 4d78b21 (decision S29); (c) week 1, parts `images`, `audio`, `song`: stay draft, because Daniel's stop of 2026-10-24 (relayed by Storytime) discards the produced media, and the publish words came before the stop. The `published` check of st2/1 then names only images, audio, and song. The six app parts get optional `source` and `words` fields (FR-1.3). |
| P15 | Perforation geometry and reader page size | A leaf torn 12 mm from the spine is 198 × 297 mm (F16). Two reader pages of 198 × 148.5 mm, upright, one above the other, fill the leaf. A full A5 page (148 × 210 mm) is 12 mm too tall for the torn leaf. Daniel's week 1 proof answer of 2026-11-03: the readers at 99 × 140 mm were "far too small". Daniel's proof v3 answer of 2026-11-04: "Still wrong. Student book page are the wrong orientation. See this for for the right orientation." | Answered 2026-11-03 (Daniel's words, PM relay, Tasks `RkpsQWhMRkFRNzF3cWxSbw`, 14:49 ICT): "Understood and approved" for the size. Changed 2026-11-04, Daniel's proof v3 answer: the page is landscape, 198 × 148.5 mm, with a top fold (FR-5.1). The reader stays inside the bound book as tear-out leaves. |

## Conflicts between the sources

1. **S4.** Approved 2026-10-22: print first, the app as a second track. The survival report: S4 dies, and the app comes first; print stays in scope. The Storytime milestone (one read-along, one decodable, one song) uses the same week 1 readers and pictures as this track.
2. **S23 and the QR host.** Decided 2026-10-22: `storytime.reading-advantage.com` on the Primary service. The survival report: S23 dies. The Workbooks README, `files.ts`, and the tests still name that host, and it returns HTTP 404 today (P4). Resolved 2026-10-25 (D2 item 3): the prints use the S23 address, and the new app serves it (P4).
3. **Who makes the pictures.** The 2026-10-07 owner rule in the Forge brief §6 and the Forge engine facts: "pictures are Workbooks, not Forge". Design §6.1 and §6.5: the Workbooks image pipeline and the Primary picture-book style. The 2026-10-25 split: Forge makes the assets. This track follows the newest decision (P3). Daniel resolved the style on 2026-10-25: Forge 3D renders, with one character look for the books and the videos (P3).
4. **Counts.** S17: 8 + 8 + 8. Design §3.5 and §6.7, and the packages: 7 + 7 + 7 (P1). Resolved 2026-10-25 (D2 item 1): 7 + 7, and week 8 is the review week (P1).
5. **Student-book pages.** Design §8 lists the formation box, the practice sheet, the frame sentence lines, the check page, the book map, and the home card. The packages also name "student book: dictation lines" (C3), "review page 1" to "review page 5", and "Benchmark 1 page". This track prints all of them.
6. **Benchmark 1 pass marks.** Design §7, letter-sound row: "Level 2 week 8: 26 and 26". Design §3.5 and `w08.json`: 20 of 26 letter names and 6 of 7 sounds. This track prints `w08.json`.
7. **Page budget.** Design §6.7: about 120 student-book pages and about 300 teacher-book pages a level. The Thai drafts are 21 to 26 A4 pages a week (195 pages for unit 1, about 780 for 32 weeks at the same rate). The FR-3 plan is about 5 pages a teaching week and 6 a review week (about 165 a level).
8. **Trim.** Design §8: A4. The Primary printer page: 210 × 285 mm. The teacher-book drafts: A4 office print (P2). A4 by default (P2 defaults, 2026-10-25).
9. **The Thai approval commit.** Storytime relayed commit 4940776. That commit is the week 8 second Thai proofread (2026-10-22 10:43). The Thai drafts are dated 18:35 to 18:36 and have the S24 wording of 041017a (18:35:40). A field comparison showed that the printed fields of all 8 weeks are the same at 041017a and at 8e6df79, so the approved text is the current text.
10. **Stop rule.** The monorepo stop rule (2026-11-05) was for the week 1 content, which Daniel approved on 2026-10-22. Rule 0.1 adds a new gate: the whole week 1 in print (P5).
11. **Pictures on hold.** The monorepo plan puts the week 1 pictures at `[b] deferred:daniel` (rollback, 2026-10-25), while Daniel's order of 2026-10-25 starts the print work, which needs them (P12).
12. **Scope of "make again".** Draft 2 rules: "Everything else is made again", which includes "book" and "check". The monorepo plan and the survival report: the authored weeks carry (P13).
13. **Test data.** Rule 11.3: tests load the shipped week files. The existing Storytime tests use `__tests__/fixtures/storytime-week-fixture.ts`. The new tests of this track follow rule 11.3; the old tests stay.
14. **Classroom language card.** Design §8: "The same card is page 1 of the teacher book." The template has no such page, and the design gives no praise lines (P9).
15. **Class set size.** Design §8: sets of 8 for pairs. The scripts: one book for each pair, in classes of 30 (P10). Resolved 2026-10-25: moot, because each child has the readers in the workbook (P10).
16. **Recorded approvals.** Week 1 is published (4d78b21), and the monorepo plan records Daniel's Thai approvals of weeks 1 to 8. No week file records an approval, and the `published` check fails (P14). Resolved 2026-10-25 (D2 item 4): the week files record the approval sources (P14).

## Addendum 2026-11-14: print audit gate, code tests, and the r6-v2 fix batch

Request: the PM hand-off of 2026-11-14 (`~/Desktop/handoff/pr-print-audit-gate/workbooks-handoff.md`, version 0.2, SHA-256 `2c2638de…faec`, receipt sent 11:10 ICT) and the PM decisions of 2026-11-14 11:25 ICT on the PM print audit of `proof-books-r6-v1` (`~/Desktop/handoff/print-audit-r6-v1/Storytime-Advantage-L2-U1-books-r6-v1.audit.md`). The audit verdict is PASS: 0 blockers, 0 majors, 10 minors (A6, B1, B3, B4, C2, D1, D2, D5, D7, F3). The PM accepted six fixes. This addendum records the audit gate, the code-test list, and the fix batch. It changes no earlier decision.

### Decisions

| Id | Decision | Default | Reason |
|---|---|---|---|
| P9-A1 | The print track names the audit gate and its pass rule (text below). | The gate is the skill `print-curriculum-audit`. It sits after the code tests and before Daniel's look and the printer order. It passes only with 0 blockers and 0 majors. | PM ask 1 (T3.1). The plan already holds a short form of this text in the paragraph "Audit gate (PM 2026-11-04 …)" (plan line 30). This section adds the exact words. |
| P9-A2 | The code-test list lives in the file `print-audit-code-tests.md` of this track folder. | The file holds the 11 rows of PM list version 0.2 (C1, C2, C3, C4, E2, E3, E6, E7, F6, H1, I1), each with the real input paths and the test that covers it. | PM ask 2 (T3.2). The first PM request said nine rows. Version 0.2 added E6 and E7, so the file holds eleven. |
| P9-A3 | One line-art fix table replaces a line-art file for the print only. The table is `content/storytime/l2/print/pictures-line-fix.json`. Its code is the new module `dashboard/lib/storytime/print/line-art-fix.ts`. | `resolveStorytimePictureFiles(folder, rows, 'line')` in `picture-check.ts` calls the module after its SHA-256 check. The call changes the `file` of a result and keeps its `fileName`. D1 and D7 use the table. | All line-art users of the print pass this one function: `readers.ts` (lines 196 and 216), `student-book.ts` (line 767), and the card kit check (`card-kit.ts`, lines 589 and 597). The Forge files, `manifest.json`, and the batch hashes stay byte equal. Replacing the bytes in place would break the manifest SHA-256 check. A new Forge version needs a color file with the same version, and a manifest rewrite. |
| P9-A4 | D1: the check picture for "ten" is `content/storytime/l2/media/w02/family/ten.jpg` (800 x 800 px JPEG: a black "10" over ten black dots). | The table entry for the row `l2-w06-check-row-ten` replaces its line art `l2-w06-check-row-ten-line-v2.png` with the file in place. The print only changes. The week package does not change. | The audit D1: the picture of ten apples makes a child say "apples", a word that starts with /a/. The teacher key needs "ten" as the /t/ answer (p96 item 2, p134 item 5). The row serves both pages, because a review word keeps the row of the earliest week (`student-book.ts`, line 589). The PM named the file. |
| P9-A5 | D7: Pat gets a solid black hair fill in the line art of week 6. | Four table entries (below). A deterministic script makes the four filled files. The files go to `content/storytime/l2/print/pictures-fix/`. | The audit D7: Pat has black hair on the cast sheet and light, unfilled hair in Tap, Tap! pages 3 and 4 and in the A7 picture of page 94. In each of the four pictures, Pat is the left child. Sam is the right child with brown hair and a striped shirt. The PM decided the fill (D5: no new Forge picture). |
| P9-A6 | B3: the picture frames of the practice and check pages are solid. | In `student-book.ts` the rule `.picture-box` (line 138) changes from `0.6mm dashed` to `0.6mm solid`. | The audit B3: a dashed frame suggests a cut that does not happen. The frames of the reader leaves are already solid. |
| P9-A7 | B4: the tear-out ticks print 0.5 mm wide. | In `readers.ts` the rule `.tear-tick` (line 619) takes a border of `2px` (0.53 mm) in place of `0.4mm`. | The audit B4 measured 0.25 mm (3 px at 300 dpi). Chrome prints a border width in whole CSS pixels, rounded down, and 0.4 mm is 1.51 px, so it prints 1 px (0.26 mm). A value of `0.5mm` is 1.89 px and prints 1 px too. Only 2 px or more gives 0.5 mm. |
| P9-A8 | A6 nose: the two nose line pictures clip inside the frame. | A table of two row ids in `student-book.ts` marks their picture boxes with `data-edge-ink="clip"`. One rule, `.picture-box[data-edge-ink] img { clip-path: inset(1.5mm); }`, leaves 1.5 mm of white between the stroke ends and the frame. | The audit A6: the nose picture runs through the frame at the top and the bottom. A measure of all 103 square line pictures (2026-11-14) shows ink in the outer pixel ring for these two files only: `l2-w01-check-row-nose-line-v2.png` and `l2-w01-practice-line-nose-line-v2.png` (50 dark pixels at the top and 52 at the bottom of each). |
| P9-A9 | B1: the proof folder gets a fold-test PDF of the reader leaves. | The Phase 14 Print proof task makes `fold-test/Storytime-Advantage-L2-U1-readers-fold-test-v18.pdf` in `proof-books-r6-v2/` (command below). | The audit B1: the r6 hand-off had no fold-test file. The v15 fold test (86 pages) is for another file. |
| P9-A10 | The hand-off note of `proof-books-r6-v2` lists the minors that stay open, with the reasons (below). | Six items go to Daniel's proof look: A6 rest, C2, D2, D5, E22, F3. | PM decision of 2026-11-14 11:25 ICT: "Minors left … go to Daniel's proof look of r6-v2 with your reasons. Put them in the r6-v2 hand-off note as one short list." |
| P9-A11 | Lane, order, and dates (below). | One batch of one spec review, one Red, one Green, and the hand-off to the PM. The Phase 14 Print proof task builds `proof-books-r6-v2` from the batch. | Rule R1: no two Red windows of the print, loops, cover-options, and week package tracks at once. |

### P9-A1: the gate text

The track states three facts.

1. The gate is the skill `print-curriculum-audit`. Its files are in `/home/daniebo/Desktop/advantage-pr/skills/print-curriculum-audit/`. Three links point to the folder: `~/.agents/skills/print-curriculum-audit`, `~/.claude/skills/print-curriculum-audit`, and `~/.config/opencode/skills/print-curriculum-audit`. The skill holds the checklist A1 to J1 in `references/checklist.md`. The checklist covers E6 and E7 (Daniel, 2026-11-14). A failed E6 or E7 is a blocker.
2. The gate sits in the order of each print curriculum: (1) the maker builds the proof and runs its code tests (P9-A2); (2) the audit gate runs on the proof; (3) the maker fixes each fail, and the re-audit (J1) follows; (4) the PM checks sections C and D at zoom on several weeks; (5) Daniel looks at the proof; (6) the printer order goes out. The gate for the final Storytime print proof must pass before the printer order of 2026-11-25.
3. The gate passes only with 0 blockers and 0 majors.

The pass rule, quoted exactly from `SKILL.md` through the PM hand-off:

> - Each item is pass, fail or n.a.
> - Each result carries proof: a crop path or a test name. An item without proof is not a result.
> - Severity: **blocker** (the page teaches the wrong thing), **major** (the page confuses), **minor** (the page is untidy).
> - The gate passes only with 0 blockers and 0 majors.
> - The minors go to Daniel with a default. The default: the print order goes ahead, and Daniel decides each minor.
>
> A missing proof is a fail, not a pass. An item skipped because a file was missing is an `n.a.` with the missing file named in the note.

The independence rule, quoted exactly:

> The auditor is never the session that built the book. The maker knows where the shortcut sits, and the shortcut is what the audit must find. The auditor must read images: text extraction misses a wrong stroke, a wrong picture, and a start dot in the wrong place.

The Workbooks session builds the book, so it is the maker. It never runs the skill on its own build. The auditor takes no part in a fix batch. After a fix batch, the auditor re-checks every failed item and does one full pass of sections C and D (J1). The PM spawns the auditor. The route that passed calibration v13 is `claude-code/claude-sonnet-5-5#high`. The report is `<proof-file-name>.audit.md` with a `crops/` folder next to it, in the hand-off folder that the PM names. The PM sends the report to this track.

Result of the audit of `proof-books-r6-v1` (2026-11-14): PASS, 0 blockers, 0 majors, 10 minors (the J1 re-check gave the same 10). The 10 minors go to Daniel with the default that the print order goes ahead.

### P9-A2: the code tests

The file [print-audit-code-tests.md](./print-audit-code-tests.md) holds the 11 rows. Each row gives the real input paths, the test that covers it today (file and test name, found with `grep`), the gap, and the planned test. The maker runs the list on each proof build, before the audit (plan Phase 9, task "Code tests on the r6-v2 proof"). The tests do not replace the page images.

### P9-A3: the line-art fix table

- **File and shape.** `content/storytime/l2/print/pictures-line-fix.json` is an object keyed by picture row id. Each entry has: `sourceFile` (the line-art name that the manifest gives), `sourceSha256`, `replacement` (a path relative to `content/storytime/`), `replacementSha256`, `reason` (`D1` or `D7`), and, for `D7` only, `fill` with `seed` (`[x, y]` in pixels), `areaPx`, and `bbox` (`[minX, minY, maxX, maxY]`).
- **Rule.** After the SHA-256 check of the manifest, a `line` result for a row with an entry changes only when the SHA-256 of the source file equals `sourceSha256`. Then the module checks that the replacement file exists and has `replacementSha256`, and it returns the replacement path as `file`. A folder with other bytes (a scratch copy of a test) gets no change. A replacement that is missing or has another SHA-256 throws an error that starts with `line-art fix:`. A `color` result never changes.
- **Not changed.** `pictures/manifest.json`, every file under `pictures/`, `pictures.json`, and `content/storytime/l2/media/`.
- **Where the code goes.** The module reads the table with the same pattern as `art-edge-fill.ts` (a missing table file gives an empty table). Pins for the export names go into the header of the Red test file as PIN lines.

### P9-A4: D1, the "ten" picture

- **Entry.** Row `l2-w06-check-row-ten`. `sourceFile` is `l2-w06-check-row-ten-line-v2.png` with SHA-256 `b9647ab86cf41e1839877290f668e9f984c830307944fa8440433111d4b07e1e`. `replacement` is `l2/media/w02/family/ten.jpg` with SHA-256 `45548b692934a9ff1d9a39da120c214d77c8eeffc08bd582ff90a1bdc7285431`.
- **Where it shows.** The row is the one picture of "ten" in the student book: the check row of week 6 (page 96, item 2) and the review rows of week 8 (page 134, item 5). Week 8 uses this row, so no second entry is needed.
- **Print only.** The week package does not change. The week 2 family set (`set-family-pictures.ts`) keeps its file. The print reads the file in place, so a later change of that file stops the build with the SHA-256 error of P9-A3. This is the wanted behavior.
- **Smallest change.** One table entry. No new Forge version, no new file, no code change besides P9-A3.
- **Color.** The color file `l2-w06-check-row-ten-v2.png` stays the card and A3 picture. The card kit is not part of this fix (open question Q9-3).
- **Print format.** The file is 800 x 800 px (about 780 ppi in the 26 mm frame), black on white. The existing `--k-only` step of the PDF/X build turns it to DeviceGray.

### P9-A5: D7, the hair fill of Pat

- **Scope: four pictures of week 6, one entry each.** In all four, Pat is the child at the left (the color files show black hair and a green shirt; Sam at the right has brown hair and a red striped shirt). The measured seeds and areas (2026-11-14, 4000 x 3000 px sources, open pixel = gray value 128 or more, 4-connected):

| Row id | Source file (v1) | Seed (x, y) | areaPx | bbox |
|---|---|---|---|---|
| `l2-w06-story-page-pat-sat-on-a-mat` | `l2-w06-story-page-pat-sat-on-a-mat-line-v1.png` | 1550, 1420 | 157420 | 1195, 1297, 1896, 1733 |
| `l2-w06-story-page-sam-sat-on-a-mat` | `l2-w06-story-page-sam-sat-on-a-mat-line-v1.png` | 1500, 1360 | 187021 | 1143, 1229, 1874, 1741 |
| `l2-w06-story-page-pip-sat-on-the-mat` | `l2-w06-story-page-pip-sat-on-the-mat-line-v1.png` | 1270, 1360 | 186107 | 820, 1236, 1543, 1773 |
| `l2-w06-cover-tap-tap` | `l2-w06-cover-tap-tap-line-v1.png` | 1485, 1422 | 214243 | 1115, 1283, 1834, 1820 |

  The source SHA-256 values are the line-art values of `manifest.json` and the files: `78ece6ba9bbc269abb6aa726da348b4c2edb9474e29ccabd4671cc07b2d27bb2`, `8f930c72a36408f2042ac587b534866f7fe5e87ef3eb0ad6232b00993490b20f`, `f990e6ab90ad467954a1fbcecf0eb360245698c0ede720d1b18ba24c5e99058a`, and `48efe50b69efd80f5a712073efd6c4cca602e1347649941336a0149b782f42d0`.
- **Where it shows.** Tap, Tap! reader pages 3, 4, and 10 (story pages 1, 2, and 8) and the cover leaf, and the A7 picture of student page 94, because the practice word "Pat" resolves to the row `l2-w06-story-page-pat-sat-on-a-mat`.
- **Not in scope.** The row `l2-w06-story-page-pat-can-see-a-map` shows Pat with black hair already. The rows `l2-w06-story-page-tap-tap-tap` and `…-tap-tap-tap-b` show Sam (a striped shirt). Neither gets an entry. The Pat pictures of weeks 1 to 3 stay as they are (open question Q9-2).
- **Method (deterministic).** A new script `dashboard/scripts/storytime/make-line-art-hair-fill.ts` (sharp 0.34.5, run in one `heavy-run.sh` wrapper) has two modes. `--write` reads each `D7` entry and writes `content/storytime/l2/print/pictures-fix/<source name without .png>-hair-v1.png` (an existing file stops the run). `--check` recomputes each fill from the source and compares the pixels of the committed file; it exits 1 on any difference. The fill function lives in `line-art-fix.ts`, so that a test can import it. The rule: (1) read the source as 8-bit gray; (2) refuse when the seed pixel is below 128; (3) flood fill (4-connected) all pixels of value 128 or more; (4) refuse when the region touches the image border, when its area is not `areaPx` exactly, or when its box is not `bbox` exactly; (5) set each pixel of the region to 0; (6) write an 8-bit gray PNG of the same size. The measured regions are closed: none touches the border, and each region is 1.3 to 1.8 percent of the picture. The fill has no dilation, because the line pixels are already 0.
- **Checks (each a test, on the shipped files).** (a) Every pixel with a source value below 128 is equal in the replacement. (b) Each changed pixel has a source value of 128 or more, a replacement value of 0, and lies inside `bbox`. (c) The count of changed pixels equals `areaPx`. (d) The region is dark: the mean of the replacement over the changed pixels is 0. (e) The count of pixels with a value from 1 to 254 is the same in the source and the replacement (no new gray). (f) The replacement has the size 4000 x 3000 and 8 bits of gray. (g) The table has no entry for `l2-w06-story-page-pat-can-see-a-map`.
- **App media impact: none.** The app media of week 6 (`content/storytime/l2/media/w06/books/…/pNN.jpg`) are color pictures from the color files (`set-book-pictures.ts` resolves `'color'` only), so a line-art change cannot reach them. The week 6 app package `r5` of Phase 13 holds those color files, so it stays as planned and needs no new revision. The Green scope guard proves this: `git diff --stat -- content/storytime/l2/media` and `git diff --stat -- content/storytime/l2/print/pictures` print no line.
- **The orchestrator fact that needs a correction.** The week 6 JPG files `l2/media/w06/books/2-tap-tap/p01.jpg` onward are color renders. The print line art of Tap, Tap! is `content/storytime/l2/print/pictures/l2-w06-story-page-*-line-v*.png`.

### P9-A6: B3, solid frames

- `.picture-box` (`student-book.ts`, line 138) becomes `border: 0.6mm solid #000`. The same rule serves the practice, writing, check, and review pictures, so one change covers all of them.
- Three dashed rules stay: `.perforation` (line 221, the home card cut edge), `.fold-line` (line 228 of `student-book.ts` and line 542 of `readers.ts`, the reader fold), and `.map-place` (line 93, the sticker places of the book map; open question Q9-4). `card-kit.ts` line 826 is a card kit rule and stays.
- The test reads the compiled student book of weeks 1 to 8. It lists each CSS rule with `dashed` or `dotted` and expects exactly these selectors: `.map-place`, `.perforation`, and `.fold-line`. A page picture box has a solid border.

### P9-A7: B4, the ticks

- `readerLeafMarkCss` in `readers.ts` (line 619): `.tear-tick { position: absolute; left: -0.25mm; width: 0; height: 5mm; border-left: 2px solid #000; }`. The tick stays 5 mm long, at the top edge and the bottom edge, on the perforation line. The scissors mark and the label do not change.
- The test computes the printed width of a border as the CSS width in pixels (millimeters x 96 / 25.4) rounded down, with a minimum of 1 px, and expects at least 0.5 mm minus 0.05 mm. The old value `0.4mm` gives 0.26 mm and fails. The value `0.5mm` also gives 0.26 mm and fails. The test `R-P6-F6a` of `storytime-print-reader-ink.test.ts` keeps its checks, because the tick keeps a solid border.
- The same rule serves the readers build (`readers.ts`, `readerTearOutHtml`) and the student book.
- The page proof: the Phase 14 Print proof task measures the tick on page 9 of the student book v18 at 300 dpi, as the audit did (column x = 142, rows 0 to 58). The expected width is 6 px (0.53 mm). A width of 3 px is a fail, and it means that the rule did not reach the PDF.

### P9-A8: A6 nose clip

- Data: a constant of two row ids in `student-book.ts`: `l2-w01-check-row-nose` and `l2-w01-practice-line-nose`. `pictureElement` adds `data-edge-ink="clip"` to the picture box of these rows only. The page CSS holds one rule `.picture-box[data-edge-ink] img { clip-path: inset(1.5mm); }`.
- The nose strokes then stop 1.5 mm before the frame in each box (the check rows of week 1, the week 8 review rows, and the practice line of week 1). Chrome keeps a CSS clip path as a vector clip in the PDF.
- A guard test measures the line pictures of class C (1500 x 1500 px, from `manifest.json`) with sharp: the files with a value below 128 in the outer pixel ring are exactly the two nose files. A new picture with edge ink then fails the test until it gets a decision.
- Not in this fix: the room scenes and the two reader pictures that the frame cuts (A6 rest, P9-A10).

### P9-A9: B1, the fold-test PDF

- Output: `~/Desktop/print-ready/storytime/proof-books-r6-v2/fold-test/Storytime-Advantage-L2-U1-readers-fold-test-v18.pdf`, 86 pages: the 2 lead sheets (`make-fold-test-lead-pdf.ts`) and the 84 reader leaf sides of the student book v18, the same layout as the v15 file. The reader sides of week n are the pages 9 + 18 (n − 1) to 20 + 18 (n − 1) of the student book (weeks 1 to 7: 9–20, 27–38, 45–56, 63–74, 81–92, 99–110, 117–128). The audit default named the pages 9 to 20 only (week 1). The default here is all 14 readers, as in the v13 and v15 fold tests (PM rule).
- Commands (the lead build in one `heavy-run.sh` wrapper; `pdfseparate` and `pdfunite` do not re-render, as in v13):
  1. `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'mkdir -p /tmp/opencode/p9-fold && cd dashboard && npx tsx scripts/storytime/make-fold-test-lead-pdf.ts --out /tmp/opencode/p9-fold/lead.pdf'`
  2. `for n in 1 2 3 4 5 6 7; do pdfseparate -f $((9+18*(n-1))) -l $((20+18*(n-1))) ~/Desktop/print-ready/storytime/proof-books-r6-v2/student/Storytime-Advantage-L2-U1-Student-Book-v18_PDFX-1a.pdf /tmp/opencode/p9-fold/s%d.pdf; done`
  3. `mkdir -p ~/Desktop/print-ready/storytime/proof-books-r6-v2/fold-test && pdfunite /tmp/opencode/p9-fold/lead.pdf $(for n in 1 2 3 4 5 6 7; do for p in $(seq $((9+18*(n-1))) $((20+18*(n-1)))); do printf '/tmp/opencode/p9-fold/s%d.pdf ' $p; done; done) ~/Desktop/print-ready/storytime/proof-books-r6-v2/fold-test/Storytime-Advantage-L2-U1-readers-fold-test-v18.pdf`
- Check: `pdfinfo` gives 86 pages and A4 (594.96 x 841.92 pts). The `pdftotext` text of the pages 3 to 86 equals the text of the 84 source pages (0 differences). The file is in `MANIFEST.txt`. The scratch folder `/tmp/opencode/p9-fold` is removed at the end.

### P9-A10: the minors that stay open (text for the hand-off note)

The note of `proof-books-r6-v2` (file `p14-proof-note.md`) holds this list, as "open, goes to Daniel's proof look", with the audit row and the reason:

| Row | What stays | Reason |
|---|---|---|
| A6 rest | The room scenes (p22, p23, p40, p58, p76, p94, p112) and two reader pictures ("A neck.", "How many balls? Five!") are cut at the frame edge. | The fix is a look choice for each picture: a crop, or white bands. Daniel chooses. |
| C2 | The start dots of c, s, and d in the sentence trace lines sit at the left middle. | The fix needs a start table for every lowercase letter. The tests of today cover the 7 taught letters. |
| D2 | The picture word "ox" looks like a cow. | A new word is Daniel's choice. It changes 5 or more places and the audio. |
| D5 | Tap, Tap! page 4 "Sam sat on a mat." shows two boys. | No new Forge picture now (PM). The D7 fill makes Pat and Sam two clear children. Daniel decides. |
| E22 | The picture "A neck." (Nan Can Nod p7) shows a very large head on a thin neck. | The fix needs a new picture. |
| F3 | The D4 script traces the sentence first and then colors the picture. The page puts the picture above the trace line. | A swap of the D4 items changes item numbers that the teacher book quotes, or adds Thai lines. |

Fixed in this batch: D1, D7, B1, B3, B4, and the nose part of A6. The note gives "fixed in <commit>" for each.

### P9-A11: lane, order, and dates

- Lane: the light lane (no strategy role, no adversarial round). Roles in order: one spec review (a model family other than Anthropic; the Thai filter first; it writes only files under `measure/runs/`), Red (a model other than Claude; the Thai filter first), Green (a model family other than the Red family), and the hand-off of P9-A1 and P9-A2 to the PM. One role runs at a time. The routes are picked by `ra-quota` at spawn.
- Order (PM, 2026-11-14 11:25): the Phase 14 Red first, then the fix plan, then the Red and Green pair. This batch's Red starts only after the Phase 14 Green commit closes the Phase 14 Red window (rule R1).
- Dates (ICT): the spec review on 2026-11-14. Red on 2026-11-15 after the Phase 14 Green commit (the Phase 14 Green is due 12:00), done by 14:00. Green done by 16:30. The student book v18 build in the Phase 14 Print proof task starts at 16:30. The proof folder `proof-books-r6-v2` goes to the PM by 2026-11-15 20:00 (already sent to the PM; holds). The PM audit follows within 1 day. The J1 re-audit re-checks the failed items. The printer order is 2026-11-25.
- Fallback: if the Green commit does not land by 16:30, the student book v18 builds with the fixes that landed. The note then says "next version" for each fix that did not land. The teacher book and the 8 drafts do not depend on this batch, so their steps can start right after the Phase 14 Green commit.
- The Phase 14 Print proof task adds three things to its build: the fold-test PDF (P9-A9), the open-minors list (P9-A10), and the agent-opened pages of this batch: student pages 9 (ticks), 6 and 96 (frames and the "ten" picture), 94 (Pat), and 132 (nose).

### Open questions (Daniel decides; the track uses the default)

| Id | Question | Default |
|---|---|---|
| Q9-1 | The file `ten.jpg` prints a numeral "10". The Forge rules (FR-9) say "no letters, words, or numbers in the picture". Does the numeral stay? | The numeral stays. The PM named the file, and the rule governs Forge deliveries. Daniel decides at the proof look. |
| Q9-2 | Does the hair fill extend to the Pat pictures of weeks 1 to 3? | No. Week 6 is the only week where Pat and Sam share a picture, and the audit passed weeks 1 to 3. |
| Q9-3 | Does the card kit "ten" card change with D1? | No. The kit prints the color file. The Red role records with `grep` whether any card uses the row `l2-w06-check-row-ten`. The release proof rebuilds the card kit, and Daniel sees it. |
| Q9-4 | Do the sticker places of the book map (`.map-place`) become solid? | No. They stay dashed. They are not picture frames. |
| Q9-5 | Does the fold test hold all 14 readers? | Yes (84 sides + 2 lead sheets), as in v13 and v15. |

### Acceptance criteria of the batch

- AC9-A1: this section and the file `print-audit-code-tests.md` exist, and the PM has the place of each in the track (the plan task "PM hand-off").
- AC9-A2: `resolveStorytimePictureFiles(…, 'line')` gives `ten.jpg` for the row of ten and the four filled files for the four Pat rows, and it gives the manifest file for every other row. The checks (a) to (g) of P9-A5 pass.
- AC9-A3: the compiled student book has solid picture frames, ticks of at least 0.5 mm (computed), and the clip mark on the nose boxes only.
- AC9-A4: no file changes under `content/storytime/l2/media/`, `content/storytime/l2/print/pictures/`, or in `manifest.json`. The scope guard prints `outside: 0`.
- AC9-A5: the r6-v2 hand-off holds the fold-test file and the open-minors list, and the PM re-audit (J1) finds D1, D7, B1, B3, B4, and the nose part of A6 fixed.
