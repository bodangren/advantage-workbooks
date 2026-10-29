# Spec: Storytime Advantage write-in workbook covers

Track: `storytime_covers_20261027`. Type: feature (classic FR list). Created: 2026-10-27. Status: planned, no code.

## Overview

Storytime Advantage has 16 write-in student books: 4 levels x 4 units x 8 weeks. This track makes the cover system for those books. It builds one cover module in the repo, the data for all 16 books, and the print file of the Level 2 Unit 1 cover. The PM session approved this track on 2026-10-27 at 06:41 ICT (assignment A-18 (a)).

Workbooks makes these deliverables:

1. The cover module in the repo: `dashboard/lib/storytime/print/covers.ts`, with its data in `content/storytime/covers/books.json` and its build script in `dashboard/scripts/storytime/make-storytime-cover.ts`.
2. The data of all 16 books: the level, the unit, the weeks, the title, the level colour, the cover picture, and the unit summary.
3. The three mock covers of Level 2 Unit 1, Level 1 Unit 1, and Level 4 Unit 4. Each cover gives a front PNG, a back PNG, and a 2-page PDF for Daniel's check. The v3 build writes new files for the five-field back panel of D11, and it keeps the v1 and the v2 files.
4. The Level 2 Unit 1 cover print file (PDF/X-1a), after Daniel approves the cover picture on Drive. In the printer file a missing panel field fails the build (D11).
5. The other 13 covers, later, when their week text and pictures exist.

The mock build lives outside the repo. It is the reference for this track:

- `/home/daniebo/Desktop/asset-requests/2026-10-26/storytime-workbook-covers/build/make_covers.py` — the template and the build.
- `build/books.json` — the 16-book data, the level colours, the contact lines, and the LINE address.
- `build/compose_pictures.py` — the cut-out picture compositions.
- `build/check_covers.py` — the size, font, copy, date, Thai byte, and QR module checks.
- `build/qr_code.py` — the QR encoder and decoder used in the QR proof.
- `mock-L2U1.pdf`, `mock-L1U1.pdf`, `mock-L4U4.pdf` — the three mock covers.
- `books.md`, `books.csv` — the readable 16-book list.
- `covers-contact.png` — the contact sheet of the three mocks.

The check script gave ALL PASS on 2026-10-27 (PM log, 2026-10-27 06:16 ICT).

## The assignment (A-18 (a), PM, 2026-10-26)

The PM session gave these rules for the cover system:

1. The Storytime look only, with the Forge 3D cast. Never the Chibi cast.
2. The full product name "Storytime Advantage".
3. No CEFR, GSE, YLE, or RAZ text. No level badge.
4. No public dates.
5. Real files only. No placeholder in a delivered file.
6. All Thai goes to Daniel's check.
7. The back cover holds three things: the company logo `Teacher guide/reading-advantage logo.png`, the five approved Thai contact lines, and the LINE Official QR for https://line.me/ti/p/Pf7_EF98Pv. The Thai lines are byte-identical to the approved back-cover lines.
8. The title of each book is "Storytime Advantage, Level N, Unit M, Student Book" (Daniel, 2026-10-26, P11 of the print track).
9. The level colours of the mocks are L1 #E06A1F, L2 #2A77B8, L3 #3C9B57, L4 #8151B8.

## Daniel's look (Google Tasks, 2026-10-27 06:35 ICT)

Daniel's words, verbatim:

> "The cover mock-ups look fine but I guess the back cover has that blank space for a description that's not complete yet correct?"

Yes. The blank panel is the unit summary panel. It holds a short English summary of the unit (D1). The panel is not a page of text.

Daniel's words (Google Tasks, 2026-10-27 06:33 ICT), point 2, verbatim:

> "These need to be in Google drive so I can verify them before I can approve."

So the cover files go to Google Drive through the PM session. The PM session made the folder "2026-10-27 Storytime cover mocks" in "Asset requests" (PM log, 2026-10-27 06:22 ICT). Daniel's words on the same day, 06:22 ICT, verbatim:

> "I will not be at my desk until about 5:00 this evening so you will need to upload these kinds of assets for me to check to Google drive the way we did yesterday"

## The PM decisions (2026-10-27 06:41 ICT)

The PM session relayed four decisions. Daniel may change them later.

- D1: the back panel holds a short English unit summary from the approved week text. A unit with no week text shows no panel. **Replaced by D11 on 2026-10-29.** The text of D1 stays here, and it does not bind the build.
- D2: a label "LINE" next to the QR. No new Thai.
- D3: the Level 2 Unit 1 group picture stays. Withdrawn 2026-10-28 (PM).
- D4: one picture style for all 16 books: cut-out characters on white. The Level 4 Unit 4 front, now a room scene in a box, changes. Withdrawn 2026-10-28 (PM).

## Daniel's look at covers v1 (chat, PM relay 2026-10-28 05:25 ICT)

Daniel's words, verbatim:

> "Only characters and no backgrounds, right? The composition of Level 1 Unit 1 is the best, but the white background behind the characters should probably at least be colored. Level 2 Unit 1 is far too crowded. Level 4 Unit 4 has a view that zoomed out and has too much neutral space around the characters. Plus, we seem to be using the same classroom space for 90% of our media. We need some variety not just in the covers, but in the settings for videos, etc."

## The PM decisions (2026-10-28 05:25 ICT)

The PM session relayed six decisions for covers v2.

- D5: Level 1 Unit 1 is the composition model for all books. Two main characters and at most one animal stand close and fill the picture area.
- D6: no white ground. The default is a coloured ground behind the characters. It is a light tint of the level colour, to the edges of the picture area.
- D7: Level 2 Unit 1 holds at most 3 figures. They are the unit's main characters, with Nan for unit 1.
- D8: Level 4 Unit 4 gets a closer crop. The characters fill the picture area, with little empty space.
- D9: the 16 covers do not repeat the same group of characters.
- D10: Daniel wants settings other than the classroom across all media. A later cover version can show the place of the unit behind the characters. No new picture generation runs now.

## The PM decisions (2026-10-29 05:22 ICT)

Daniel's words, verbatim (Google Tasks, 2026-10-29 05:14 ICT):

> "The summary panels need to include: a Sunday of the story, phonemes, decodable words, sight words, etc. fill up that space. Use larger text if necessary."

The reading of the words: the PM session and the orchestrator read "a Sunday of the story" as "a summary of the story". The words came by voice into Tasks. They read "etc." as "the books of the unit (the reader titles)". Daniel confirms the reading with the v3 covers on Drive.

The PM session accepted every default of D11 on 2026-10-29 at 05:22 ICT. The PM brief names this change D6. This spec numbers it D11, because D6 (2026-10-28) is the ground tint decision, and that decision stays live.

- D11: the back panel holds five fields, in this order: the story, the sounds, the decodable words, the sight words, and the books of the unit. Every back of the 16 books shows the panel. D11 replaces D1 and the 25-word limit of the summary. The text of D1 stays in this spec.
  1. Every back of the 16 books shows the panel. The panel holds the five fields in this order: the story (an English summary of the unit), the sounds (the phonemes of the unit), the decodable words, the sight words, and the books of the unit (the reader titles).
  2. The sounds, the decodable words, and the sight words come from the phonics graph and the week files. The story comes from the week text of the unit. Each field records its source weeks.
  3. The text takes the largest size from a fixed scale that fits the panel. No text is smaller than 10 pt. Nothing overflows the panel. The scale is 14, 13, 12, 11, and 10 pt. The text inset is 12 mm at each side of the 186 x 138 mm panel, so the text box is 162 x 114 mm. The Level 2 Unit 1 text block fills at least 0.60 of that height (Open point P13).
  4. A field with no data shows its heading and one light line, "comes with the week text", on the Drive mock only. The build report lists the missing fields of each book. In the printer file, a missing field fails the build.
  5. The panel is English only. It adds no new Thai, so D2 holds. The Thai contact lines of the back stay unchanged, and Daniel checks them as usual.
  6. The v3 build writes new files. The v1 and the v2 files stay unchanged.
- D12 (the source rule, the PM's choice): the v3 Drive mock may use the draft text of weeks 2 to 8, and the build report names each draft week that it uses. The printer file accepts only approved sources until Daniel approves the week 2 to 8 text: the `approval.text` of week 1 and the phonics graph data. The PM puts this choice to Daniel with the v3 hand-off.

## Sources

- The mock build (above). The mock PDF is a Chrome PDF, 2 pages, A4 portrait 210 x 297 mm, no spine, no bleed.
- The approved Thai contact lines: `dashboard/lib/covers/back-text.ts`, `BACK_LINES.contact`. The mock data file and the repo constant hold the same five lines.
- The company logo: `Teacher guide/reading-advantage logo.png` (700 x 700 px, RGB). The mock build holds a copy with the same SHA-256.
- The cast cut-outs in the repo: `content/storytime/l2/media/w01/forge/cast/sprout-<name>/front.png` (1024 x 1200 px, RGBA) for pat, may, sam, mia, ben, nan, pip. The mock build used the same files.
- The QR encoder in the repo: `dashboard/lib/qr-generator.ts` (`qrcode-generator`).
- The print path: `dashboard/scripts/print/make-pdfx.ts`, `--keep-fonts` for a PDF with fonts.
- The fonts: `dashboard/assets/print-fonts/` (Andika for English, Sarabun for Thai). The mock build used the same faces.
- The print track: `measure/tracks/storytime_print_r1_20261025/spec.md`, FR-6 (lines 154 to 159) and plan Phase 5 (lines 228 to 238); its spec P2 (the print defaults), P11 (the title), and FR-9 (the picture spec).
- The week packages: `content/storytime/l2/w01.json` to `w08.json`. Week 1 of Level 2 Unit 1 has the approved English text (2026-10-23, "publish week 1"). The other weeks of that unit and every other book have no approved English text yet. The week files of Level 1 and of Level 4 do not exist: `content/storytime/l1/` and `content/storytime/l4/` are absent.
- The phonics graph: `../mastery-advantage/english/phonics/phonics-knowledge-space.json`, read through `lib/storytime/files.ts` (`PHONICS_GRAPH_FILE`, `MASTERY_PHONICS_GRAPH`) and `lib/storytime/phonics.ts` (`phonicsGraphFrom`, `parseWord`, `wordNeed`, `programWeek`). The graph GPC nodes run from program week 33 to program week 115. It holds no phoneme for Level 1 (program weeks 1 to 32) and none for Level 4 Unit 4 (program weeks 121 to 128). `programWeek(level, week)` is `(level - 1) * 32 + week`.
- The QR proof of the mock build: `build/qr_proof.py`. It proved that the official LINE QR image and the clean encoding hold the same address.

## Terms

- **Cover side**: the front or the back of one book cover. One A4 page.
- **Picture layer**: the one opaque image of one cover side. It holds the logo, the cover picture, the QR, and the coloured blocks. It holds no alpha channel.
- **Cut-out style**: the cast characters stand on the ground tint of the level, with no box and no room around them.
- **Ground tint**: 20 % of the level colour on white. L1 #F9E1D2, L2 #D4E4F1, L3 #D8EBDD, L4 #E6DCF1.
- **Figure**: one cut-out of a character or an animal.
- **Unit summary panel** (replaced by the back panel, D11): the box on the back cover that held the short English summary of the unit.
- **Back panel**: the box on the back cover that holds the five fields of the unit (D11). The box is 186 x 138 mm, at 12 mm from the left and 48 mm from the top.
- **Panel field**: one of the five fields of the back panel, in this order: the story, the sounds, the decodable words, the sight words, and the books of the unit.
- **Panel inset**: the text box inside the back panel. It is 162 x 114 mm: 12 mm at each side of the panel.
- **Panel font scale**: the fixed scale of the panel text sizes: 14, 13, 12, 11, and 10 pt (D11.3). 10 pt is the smallest size and the floor of the scale.
- **Panel fill share**: the share of the panel inset height that the panel text block covers. The Level 2 Unit 1 threshold is 0.60 (P13).
- **Missing field**: a panel field with no data. On the Drive mock it shows its heading and the light line "comes with the week text". In the printer file it fails the build (D11.4).
- **Source weeks**: the weeks that supply the data of one panel field. Each field records them in the data file, and the build report names them.
- **Approved source**: a week whose `approval.text.status` is `approved`, or the phonics graph data (D12). A week whose status is `draft` is a draft week.
- **LINE label**: the word "LINE" next to the QR code (D2).
- **Cover picture**: the one picture of the front cover.
- **Check**: a script that fails on a broken file.

## Functional Requirements

### FR-1 The data of the 16 books

1. `content/storytime/covers/books.json` holds the series name, the trim, the four level colours, the LINE address, and one row per book.
2. A row holds the level, the unit, the first week, and the last week. It also holds the title, the level colour, the cover picture recipe, and the five panel fields with their source weeks (D11).
3. The data holds 16 rows: level 1 to 4, unit 1 to 4. The weeks of a unit are 1 to 8, 9 to 16, 17 to 24, and 25 to 32, at every level.
4. The title of a row is "Storytime Advantage, Level N, Unit M, Student Book".
5. The level colours are L1 #E06A1F, L2 #2A77B8, L3 #3C9B57, L4 #8151B8.
6. The picture recipe names the cut-outs. Each entry also states the kind: child or animal. A recipe holds at most 2 children and at most 1 animal, so at most 3 figures (D5, D7). No two non-empty recipes hold the same set of figures (D9). A row with no picture has an empty recipe. Today 3 rows have a picture and 13 rows have none.
7. The panel field object holds one entry per field, in this order: `story`, `sounds`, `decodable`, `sight`, and `books`. The `story` entry holds the English summary text of the unit and its source weeks. The other four entries hold only their source weeks, because the module derives their values from the week files and the phonics graph. A field with no data holds an empty week list and no value.
8. The source weeks of a field are weeks of that row's unit. The week list of a field must match the weeks that the module can read for that field: a week in the list with no week file and no graph data fails, and a readable week outside the list fails.
9. The story text comes from the student text of its source weeks. A word that is not in that text fails. The story holds no year.

### FR-1a The five panel fields (D11)

1. The story: the English summary of the unit, written in the plain voice of the week text. It comes from the week text of the source weeks. The text lives in the data file, one string per book. Red does not hardcode the sentence; Green writes it.
2. The sounds: the phonemes of the unit, in week order, from the week files (`focus.element` of each week) and from the phonics graph (the GPC nodes at the program week of that week). A week that teaches no new sound adds none. Each sound shows its grapheme and its phoneme, for example `n /n/`. No sound repeats.
3. The decodable words: the words of the source weeks that the phonics graph decodes at or before the program week of that week (`wordNeed`). The word list of a week is `focus.family.words`, `home.words`, `books[].backWords`, and the page text of the student books. The order is week order, then the order in the week file. No word repeats.
4. The sight words: `focus.trickyWords` of the source weeks, in week order, with no repeat. A week with no tricky word adds none.
5. The books: the reader titles of the source weeks (`books[].title` of kind `readalong` and of kind `decodable`), in week order.
6. A field is missing when its source weeks give no value. On the Drive mock a missing field shows its heading and the light line "comes with the week text". In the printer file a missing field fails the build.
7. The sources of the printer file are the approved sources only (D12). A week with `approval.text.status` of `draft` supplies no field data in the printer file.
8. The five fields are English. No field holds a Thai character. The build report lists, for each book and each field, the state (present or missing) and the source weeks, with the approval state of each week.

### FR-2 The front cover

1. The front is A4 portrait, 210 x 297 mm, with no bleed and no spine.
2. The series name "Storytime Advantage" sits at the top, centred, in the level colour, in Andika bold.
3. The picture area is 186 x 180 mm, at 12 mm from the left and 31 mm from the top.
4. The picture area shows the figures as cut-outs on the ground tint of the level, to the four edges of the picture area. The picture area has rounded corners of 5 mm, the same as the level card, drawn in the picture layer. A sample point 8 mm inside each corner, on both axes, holds the ground tint within 6 per RGB channel. A white sample point fails. A room scene in a box fails.
5. The level card is 186 x 65 mm, at 12 mm from the left and 217 mm from the top. It has the level colour and rounded corners of 5 mm. It holds "Level N · Unit M" and "Student Book" in white.
6. The front shows no CEFR level badge. The level card is not a badge.
7. The figures fill the picture area (D5 and D8). The measure is the share of figure pixels in the picture area and the bounding box of the figures. The Red role sets the thresholds from the v1 files. The Level 1 Unit 1 v1 picture passes, and the Level 4 Unit 4 v1 picture fails. Red records the measured values. The fill limit is 0.55 at a tolerance of 24 per RGB channel (STORYTIME_COVER_FILL_SHARE). At 0.55 the Level 1 Unit 1 v1 picture passes (0.613) and the Level 4 Unit 4 v1 picture fails (0.543). A crop at the bottom edge is allowed. No head is cut. No figure pixel is in the 3 mm band at the left edge or the right edge of the picture area (STORYTIME_COVER_SIDE_BAND_MM), and none is in the 8 mm band at the top edge. Each figure keeps the width-to-height ratio of its trimmed cut-out within 0.02, so no figure is stretched (Check v2 finding C3). The children stand in one row, so no child stands behind another child. The animal may stand in front of the children's feet, as in the Level 1 Unit 1 model (D5). The check rule: two figure boxes overlap in x only when the top of one box is lower than the vertical middle of the other box. No figure covers a head.
8. Level 1 Unit 1 keeps pat, nan, and pip (the model of D5). Level 2 Unit 1 holds nan and sam (Nan leads unit 1, D7; Nan and Sam share the week 5 story 'Sam and Pam'). Level 4 Unit 4 holds mia and ben. Nan is the only figure on two covers. The repo holds the 7 cut-outs of Level 2 week 1 only.

### FR-3 The back cover

1. The back is A4 portrait, 210 x 297 mm, with no bleed and no spine.
2. The logo `Teacher guide/reading-advantage logo.png` sits at 12 mm from the left and 12 mm from the top, at 30 x 30 mm.
3. The series name "Storytime Advantage" sits at the top, in the level colour.
4. The back panel is 186 x 138 mm, at 12 mm from the left and 48 mm from the top. It has the fill #F7F5F0, a 0.4 mm border #E1DDD3, and rounded corners of 3 mm. Every back shows the panel (D11.1). It holds the five fields of FR-1a in their order, each with its heading. The text sits in the panel inset of 162 x 114 mm. The text takes the largest size of the panel font scale that fits the inset, and no text is smaller than 10 pt. Nothing overflows the panel.
5. A field with no data shows its heading and one light line, "comes with the week text" (D11.4). The line shows on the Drive mock only. The build report names the missing fields of each book. In the printer file a missing field fails the build, and no file is written.
6. The five approved Thai contact lines sit at 15 mm from the left and 200 mm from the top, in Sarabun. They are byte-identical to `BACK_LINES.contact`.
7. The QR box is 44 x 44 mm, at 14 mm from the right and 200 mm from the top. It holds the LINE QR for https://line.me/ti/p/Pf7_EF98Pv.
8. The LINE label sits under the QR box, centred on it, in the level colour. The label adds no Thai (D2).
9. The back holds no other Thai and no other text than the five contact lines, the series name, and the five panel fields. The panel fields add no Thai (D11.5).

### FR-4 The copy check

The copy check is the check of FR-6.3 of the print track, with the extra words of assignment A-18 (a).

1. The check fails a side that does not show "Storytime Advantage".
2. The check fails a side that shows "CEFR", a CEFR level, "Starters", "Primary Advantage", "GSE", "YLE", "Reading A-Z", "RAZ", "Pre-A1", "Pre A1", "Chibi", or "Mitr".
3. The check fails a side that shows a year, 19xx or 20xx. The covers carry no public date.
4. The check fails a front that shows a CEFR level badge.
5. The check reads the text of the built PDF, not the source.

### FR-5 The outputs

1. The build writes the front PNG and the back PNG of each book. Each PNG holds 2480 x 3508 px, which is 300 ppi of A4. It is RGB, with no alpha channel.
2. The build writes a 2-page PDF: the front, then the back. The PDF is A4 portrait.
3. Every picture of a cover side is opaque, with no alpha channel. The picture area of the front holds one composed picture at 300 ppi for its size. The text of a cover side stays text, not a picture.
4. The build writes a PDF/X-1a print file through `scripts/print/make-pdfx.ts --keep-fonts`. The file name holds the series, the level, the unit, the kind, the version, and the suffix `_PDFX-1a` (rule 12.2).
5. The build stops with an error and names the book when a picture file is missing. No delivered file holds a placeholder.
6. A v2 cover gets `v2` in the print file name (rule 12.2). The v1 files in `~/Desktop/print-ready/storytime/proof/` stay unchanged. The v2 build writes to a new folder or to new file names, so that Red can measure the v1 files.
7. A v3 cover gets `v3` in the print file name (rule 12.2). The v3 build writes the front PNG, the back PNG, and the Chrome PDF of each book to a new folder, by default `~/Desktop/print-ready/storytime/proof-v3/`. The v1 files in `~/Desktop/print-ready/storytime/proof/` and the v2 files in `~/Desktop/print-ready/storytime/proof-v2/` stay unchanged: the SHA-256 values of the 12 v1 files and of the 12 v2 files are recorded before the v3 build and again after it, and the two lists are equal.

### FR-6 The checks on the built files

1. The Thai byte check: the Thai characters of the back page equal the Thai characters of the five approved contact lines. No other Thai appears on either page. The check reads the Chrome PDF, because `pdftotext` drops Thai tone marks in a PDF/X file (lessons-learned, 2026-10-02).
2. The QR module check: the printed QR module grid equals the encoder output for https://line.me/ti/p/Pf7_EF98Pv. Zero modules differ. The check reads a 300 ppi raster of the back page.
3. The font check: every font of the PDF is embedded, and no font is Type 3.
4. The contact sheet: one PNG that holds every page of every cover of the build. The agent looks at every page (rule 6.5).

## Non-Functional Requirements

- Tests come first. Each new check has a mutation test on a copy in a temporary folder (rule 11.1).
- The new tests load the shipped data file and the shipped week files, not a hand-made fixture (rule 11.3).
- Daniel approves each cover picture before Workbooks makes its print file (FR-6.4 of the print track). Daniel checks all Thai on a cover.
- Every task note states its evidence class: owner-approved, person-checked, automated, or peer-report (rule 7.1). A self-report never closes a task (rule 7.2).
- A changed cover picture or print file gets a new version number in its name (rule 12.2).
- The module reuses `lib/covers/compose.ts` and the PDF/X path. It does not change the Primary cover contract (`COVER_BOOKS`, the CEFR badge).
- The cover pictures use the Forge 3D cast. The Chibi cast never appears.
- No CEFR in the copy. The product name is "Storytime Advantage".
- Heavy jobs (vitest runs, tsc, Chrome, Ghostscript, PDF/X builds, contact sheets) run under the heavy-run script. Never a plain `flock` inside a heavy job.
- No `pnpm install`. No change to `package.json` or `pnpm-lock.yaml`.
- Other agents work in this checkout. Stage files path by path. Do not touch `video/**`.
- The print files go to `~/Desktop/print-ready/storytime/`, outside git.
- The cover module does not change the Primary cover templates, the Primary print templates, or the week packages.

## Acceptance Criteria (track level)

- AC-1: The data holds 16 books with the titles, weeks, and level colours of FR-1.
- AC-2: The build of Level 2 Unit 1, Level 1 Unit 1, and Level 4 Unit 4 gives a front PNG and a back PNG. Each PNG holds 2480 x 3508 px, RGB, with no alpha channel. The build also gives a 2-page A4 PDF.
- AC-3: Each sample point of FR-2.4 holds the ground tint within 6 per RGB channel. No sample point is white.
- AC-4: The Thai of the back page equals the Thai of the five approved contact lines, character for character. No other Thai appears on either page.
- AC-5: The printed QR modules equal the encoder output for the LINE address. Zero modules differ.
- AC-6: The copy check passes all three built covers, and it fails on each forbidden word of FR-4.
- AC-7: The Level 2 Unit 1 print file passes `PRINT_GATE`. Daniel's approval of the cover picture on Drive is recorded with Daniel's exact words and the date.
- AC-8: The other 13 covers are not in release 1. They wait for their week text and pictures.
- AC-9: The fill checks of FR-2.7 pass on all three v2 covers.
- AC-10: Each recipe holds at most 2 children and at most 1 animal. Level 2 Unit 1 holds nan.
- AC-11: No two non-empty recipes hold the same set of figures.
- AC-12: The back of each of the three v3 covers shows the panel with five field headings in the order of FR-1a.1. Level 1 Unit 1 and Level 4 Unit 4 show five missing fields with the light line "comes with the week text". The panel text takes a size of the panel font scale, no size is below 10 pt, no ink leaves the panel, and the Level 2 Unit 1 panel fill share is 0.60 or more (P13).
- AC-13: The v3 build writes new files. The 12 v1 files and the 12 v2 files keep their SHA-256 values, and the two lists are recorded in the plan.
- AC-14: The panel fields are English. The Thai of the back page equals the Thai of the five approved contact lines, and the panel adds no Thai.

## Out of Scope

- The teacher-book cover. The print track Phase 5 keeps it.
- The 14 reader covers. They are reader pages of the print track (FR-5).
- The Primary cover contract, the Primary cover templates, and the cover kit.
- The app, the songs, the song videos, and the picture files of the weeks.
- The print order of the covers. The printer gets the files, not this track.
- The other 13 covers. They come later, when their week text and pictures exist.
- The panel fields of a book with no week text. On the Drive mock they are missing fields, and the build report names them. The week text of Level 1 and of Level 4 is not release 1 work.
- The approval of the Level 2 weeks 2 to 8 text. The PM session puts that approval to Daniel with the v3 hand-off (D12).
- Any paid generation, and any message to the printer without Daniel's go.
- Place pictures behind the characters (D10). A later cover version can hold them.
- Any new picture generation.

## Open Points (Daniel decides; the track does not decide them)

| # | Point | Facts | Track default until Daniel answers |
|---|---|---|---|
| P1 | The words of the unit summary. Closed by D11 on 2026-10-29. | D1 (PM, 2026-10-27 06:41 ICT) says the panel holds a short English unit summary from the approved week text. The only approved English week text is Level 2 Unit 1 week 1 (`approval.text`, approved 2026-10-23, "publish week 1"). The other 7 weeks of that unit and every other book have no approved English text. | D11 replaces D1 and the 25-word limit. The story text still lives in the data file, one string per book, with its source weeks named. It is in English, in the plain voice of the week text, and every word comes from the student text of a source week. There is no word limit. The other four fields come from the week files and the phonics graph. Daniel checks the wording of the story and the reading of Daniel's words with the v3 covers on Drive. |
| P2 | The proof of the QR | The mock build proved the QR with its own Python encoder and decoder (`qr_code.py`, `qr_read.py`). The repo has the `qrcode-generator` package in `lib/qr-generator.ts`. | The module draws the QR with `lib/qr-generator.ts` from the LINE address in the data. The check compares the printed module grid with the encoder output, module by module, with zero differences. No new package. The Python proof stays the record of the mock build. |
| P3 | The Level 4 Unit 4 picture under D4. Replaced by D6 and D8, 2026-10-28. | D4 says one picture style for all 16 books: cut-out characters on white. The mock Level 4 Unit 4 front is the classroom scene `class-waves.png`, so its picture area corners are brown. The repo holds the cast cut-outs of Level 2 week 1 only. No Level 4 cast render exists yet. | The Level 4 Unit 4 cover is composed from the cast cut-outs in the repo, so the picture style is one style. Forge delivers the Level 4 cast later, and the picture changes then. The check of white corners fails the old room-scene picture, so the change cannot pass unnoticed. Daniel sees the picture on Drive. |
| P4 | The LINE label | D2 says a label "LINE" next to the QR, with no new Thai. The mock has no label. The QR box is 44 x 44 mm, at 14 mm from the right and 200 mm from the top. The contact lines reach 133 mm from the left. | The label sits under the QR box, centred on it, in the level colour, in Andika bold, at the same size as the contact text. It adds no Thai. Daniel sees the position on Drive. |
| P5 | The boundary with the print track | The print track FR-6 (lines 154 to 159) already plans a Storytime cover module: `lib/storytime/print/covers.ts`, the reuse of `lib/covers/compose.ts`, the PDF/X path, a copy check, and Daniel's approval of each cover picture. Its plan Phase 5 (lines 228 to 238) is dated 2026-11-02 to 2026-11-05 and names the same files. The PM approval of 2026-10-27 06:41 ICT sets the boundary below. | This track owns the shared cover module, the data of the 16 books, and the 16 student-book covers: the front and back PNGs for Daniel's Drive, and the PDF/X print file of a book whose week text exists. The print track Phase 5 uses this module for the Level 2 Unit 1 workbook print file, and keeps the teacher-book cover. Phase 1 of this track ends on 2026-11-01, so the module exists before Phase 5 starts. The orchestrator routes the matching print-plan change later. |
| P6 | The hand-off to Google Drive | Daniel (Google Tasks, 2026-10-27 06:33 ICT, point 2) wants the files on Google Drive before he approves. The PM session made the folder "2026-10-27 Storytime cover mocks" in "Asset requests" (PM log, 2026-10-27 06:22 ICT). The project rules send cross-project files through the PM session. | The track sends the three front PNGs, the three back PNGs, the three 2-page PDFs, and the contact sheet to the PM session, with the SHA-256 of each file. The PM session uploads them to that folder and answers Daniel's Tasks item. The track does not write to Drive. |
| P7 | The tint strength | D6 requires a light tint of the level colour. The Ground tint term gives the colours. | Use 20 % of the level colour on white: L1 #F9E1D2, L2 #D4E4F1, L3 #D8EBDD, L4 #E6DCF1. |
| P8 | The groups of FR-2.8 | D5 names Level 1 Unit 1 as the model. D5 allows two main characters and at most one animal. D7 names Nan for Level 2 Unit 1. The repo holds 7 cut-outs. | Level 1 Unit 1 keeps pat, nan, and pip. Level 2 Unit 1 holds nan and sam. Level 4 Unit 4 holds mia and ben. |
| P9 | The 5 mm rounded corners of the picture area | FR-2.4 matches the level card. The picture layer holds the corners. | Keep the 5 mm radius and the sample points of FR-2.4. |
| P10 | The bottom crop, no head cut | FR-2.7 permits a crop at the bottom edge. No head is cut. | Allow the bottom crop. Keep every head whole. |
| P11 | The animal in front of the children | D5 names the Level 1 Unit 1 v1 picture as the model. In it, pip stands in front of the children's feet. A strict one-row layout of three cut-outs gives a fill share of 0.34, below the 0.58 limit (Green measure, 2026-10-28). The limit is 0.55 since Check v2 finding C3 (P12). | Two figure boxes overlap in x only when the top of one box is lower than the vertical middle of the other box. The two children never overlap. |
| P12 | The fill limit and the shape of the figures | With the 3 mm side bands (Check v2 finding C2), Level 2 Unit 1 fills 0.5593 when each figure keeps its shape. Green C2 reached the old 0.58 limit with a row height up to 6 percent above the shape of the cut-outs, so each figure printed up to 6 percent taller (finding C3, orchestrator code check, 2026-10-28). Stretched character art is a defect. | No stretch: each figure keeps the ratio of its cut-out within 0.02. The fill limit is 0.55, which keeps the v1 calibration of FR-2.7. The v2 fills are 0.5895, 0.5573, and 0.6000. Daniel sees the v2 covers on Drive. |
| P13 | The panel fill share of Level 2 Unit 1 | D11.3 says the Level 2 Unit 1 text block fills most of the 114 mm panel inset. The share is a measurable value, and no build exists yet at 8e2c9194. | 0.60. On the 300 ppi back PNG, the bounding box of the panel text ink (each RGB channel at most 128) covers at least 0.60 of the 114 mm inset height, so at least 68.4 mm. The measure applies to a book whose five fields all have data, and Level 2 Unit 1 is the only such book in this build. Green records the measured share. A smaller word set is the other fix, because the size never drops below 10 pt. |
