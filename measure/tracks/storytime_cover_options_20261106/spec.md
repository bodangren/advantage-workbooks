# Spec: Storytime cover options in the RPG-theme style

Track: `storytime_cover_options_20261106`. Type: chore (classic FR list). Created: 2026-11-06. Owner: Daniel Bo. Status: Daniel picked option A on 2026-11-07 (Phase 1). Phase 2 (the option A covers) is planned; its Red waits for the independent spec review.

## Owner order

Daniel's words, verbatim (Google Tasks, 2026-11-06 about 21:02 ICT, PM relay):

> "Look at the way we used the RPG theme in the covers of Primary Advantage and Reading Advantage workbooks. I want to take our Storytime assets and design engaging book covers in a similar vein. Not the way we create images for use in the book (give 3D models as reference imaages) because we want something more stylized."

## PM brief (2026-11-06)

1. Read how the Primary Advantage and Reading Advantage covers use the RPG theme: the layout, the title band, the frame, the character placement, the level mark, the colors, and how the art was made.
2. Design the Storytime covers the same way, from the Storytime cast and world. The art is stylized cover art. It is not the 3D-model reference method of the book pages. No 3D model render goes to the image model as a reference.
3. First the unit 1 covers: the student book, the reader books, and the teacher book, as the unit 1 print set needs them. Make 2 or 3 options as cover mockups at print size, with one plain-words line for each option. The series cover template comes after Daniel picks an option.

Due: 2026-11-09 12:00 ICT (internal).

## The RPG covers (read 2026-11-06)

Sources: `assets/PA-*-Front Cover.png`, `assets/PA-*-Back Cover.png`, `assets/cover-kit/` (track `book_covers_20261007`), `docs/content-plans/primary-cover-art-plan.md`, and the Canva export `~/Downloads/Reading Advantage (210 x 285 mm).zip` (read only). The archived track `thematic_covers_20260308` made CSS gradient covers; the Canva covers replaced them.

| Part | Primary Advantage | Reading Advantage |
|---|---|---|
| Page | 210 x 285 mm, front and back pages, no spine, no bleed | The same |
| Art | One painted fantasy scene to all four edges. The back art and the front art are one wide scene. Bright anime look, lush scenery, sunlight | One painted scene to all four edges. Darker, realistic painted look for older students |
| Heroes | The same boy (green tunic, sword) and girl (red cloak, crystal staff) and a fox on every book. They walk toward the reader in the lower middle. Their gear grows with the level | Older painted heroes, seen from behind, who look down a path into the world. The teacher's manual shows a wizard teacher |
| Level mark | A game bar at the top: "LV 4", an XP bar, a book icon, and stars | A game bar: "LV 4", "XP", a gold XP bar, and three icons |
| Brand | A blue shield crest with "PA" and an open book, and a "PRIMARY ADVANTAGE" banner, at the top | The RA logo in a light box at the top |
| Title band | A blue bevelled plaque with crystal ends at the bottom, white League Spartan title ("Quest 4") | A wooden plaque with gold edges and gold script ("Quest 4"), and a blue ribbon below ("Your quest awaits") |
| Back | The scene continues; a paper panel holds the text; a wooden sign holds the contact lines and the QR; the RA logo and the CEFR badge at the top | The same back layout |
| How made | Daniel placed AI-painted art and the frame layers in Canva. The frame layers are shared by all books (`assets/cover-kit/`). The later cover script puts new art under the same frame | The same method |

The RPG pattern in five parts: (1) a painted world to the edges, (2) the same heroes on every book, (3) a game level bar, (4) a brand crest, (5) a title plaque. A new book changes the scene and the hero gear, and keeps the frame.

## The present Storytime covers (approved)

- Student book cover v3 (Daniel approved the print file, 2026-11-02 06:19 ICT, "Approved"): `~/Desktop/print-ready/storytime/print-v3/l2u1/`. A4 portrait, 210 x 297 mm, no bleed. Front: "Storytime Advantage", a picture area with the 3D figures Nan and Sam on the light blue level tint, and the level card "Level 2 · Unit 1" and "Student Book". Back: the RA logo, the five-field panel, the five Thai contact lines, and the LINE QR.
- Teacher book cover v1 (Daniel, 2026-11-03, "All yes"): `~/Desktop/print-ready/storytime/teacher-cover-l2u1/`. A4 portrait. Front: "Storytime Advantage", Nan, the level card "Level 2 · Unit 1", "Teacher Book", "Sprout". Back: Sam, the contact panel, the QR, and "LINE".
- Reader covers: the A3 color reader (420 x 297 mm landscape, no bleed) and the tear-out leaf in the student book (one landscape reader page of about 198 x 148.5 mm, black and white). The cover page holds the picture, the title, "SPROUT", "Storytime Advantage", the week, and the role mark with its line ("Listen and read." or "Sound it out.").
- Tech debt row of 2026-10-02 (Daniel, 2026-11-05): the covers go to the printer as separate front and back pages, with no spine and no bleed.

## Terms

- **Option**: one cover design for all three book kinds: a frame, a title plaque, a level mark, and an art style.
- **Frame**: the shared layers of an option that every book keeps (the brand crest, the level mark, the title plaque, the back panel, and the contact sign).
- **Level mark**: the game bar of an option. For Storytime it is a growth bar with the five reader bands Seed, Sprout, Leaf, Bud, and Flower as pictures. The present band is lit. The bar has no words.
- **Mockup**: one cover side built from the frame, the new art, and the approved text, at print size.
- **Approved text**: a text on an approved Storytime cover or reader cover page. A mockup copies it word for word.
- **Paid call**: one `mmx image generate` call.
- **Attempt**: one paid call for one new picture. A picture has at most 3 attempts (Daniel's picture rule).

## Functional requirements

### FR-1 The options

1. The round gives 3 options. Each option follows the five-part RPG pattern: a stylized art world to the edges, the Storytime cast as the heroes, a level mark at the top, the brand line "Storytime Advantage", and a title plaque at the bottom.
2. Option A follows the Primary Advantage frame: a painted anime adventure scene, a navy-and-silver game bar, and a blue bevelled plaque.
3. Option B follows the Reading Advantage frame: a soft painted picture-book scene, a wooden game bar, a wooden plaque with gold edges, and a blue ribbon.
4. Option C is a flat game-map look: flat colors with bold outlines, a path of stepping stones with the unit 1 objects, white sticker-style frames, and a round pill plaque.
5. Each option has one plain-words line for Daniel.

### FR-2 The mockups of each option

1. Student book front, A4 portrait 210 x 297 mm.
2. Student book back, A4 portrait.
3. Teacher book front, A4 portrait.
4. A3 color reader cover, 420 x 297 mm landscape. The sample reader is "Nan Can Nod" (week 1).
5. Tear-out reader leaf cover, 198 x 148.5 mm landscape, black and white. It keeps the approved line art of the reader (`l2-w01-cover-nan-can-nod-line-v1.png`). It gets no new picture.
6. No mockup has bleed or a spine, as the present files.
7. Each mockup is one PDF page at its print size and one PNG at 150 ppi.

### FR-3 The art

1. The art comes from `mmx image generate` (image-01) with a text prompt only. No call has `--subject-ref`. No 3D render and no picture of any kind goes to the model.
2. Each option has 4 new pictures: the student front (portrait), the back scenery (portrait, no character), the teacher front (portrait), and the reader cover (landscape).
3. The cast is drawn from the text of the cast sheets (`advantage-forge/docs/storytime/l2-unit1/judge/cast.json`, read only), in the style of the option.
4. The student front shows Nan, Sam, and Pip (decisions D5 and D7 of track `storytime_covers_20261027`: two children and at most one animal). The teacher front shows Teacher Kim, Nan, and Sam. The reader cover shows Nan and Pip.
5. The scenes are outside the classroom (decision D10 of track `storytime_covers_20261027`).
6. No picture holds letters, words, numbers, or a logo. The frame adds all text.

### FR-4 The text

1. Every text on a mockup is an approved text, word for word: "Storytime Advantage", "Level 2 · Unit 1", "Student Book", "Teacher Book", "Sprout", the five panel fields of the approved v3 back, "Nan Can Nod", "SPROUT", "Week 1", "Listen and read.", and "LINE".
2. The five Thai contact lines are byte-identical to `BACK_LINES.contact` (`dashboard/lib/covers/back-text.ts`). A mockup adds no other Thai.
3. No mockup shows "CEFR", a CEFR level, "Starters", "Primary Advantage", "GSE", "YLE", "Reading A-Z", "RAZ", "Pre-A1", "Pre A1", "Chibi", "Mitr", or a year. No front shows a level badge.
4. The QR is the approved LINE QR (https://line.me/ti/p/Pf7_EF98Pv), cut from the approved v3 back PNG.

### FR-5 The hand-off

1. The folder is `~/Desktop/handoff/storytime-cover-options-2026-11-06/`.
2. It holds the PDFs and PNGs of the mockups, the art, one contact sheet that shows all options side by side, a README with the plain-words line of each option, `spend-log.md`, and `MANIFEST.txt` (one line per file: SHA-256, size, name).
3. `spend-log.md` lists every paid call: the time, the tool, the prompt id, the cost, and the result file, and the total.

## Non-functional requirements

- Paid limit: 1.00 USD for the whole round. Price checked before the first call: image-01 is 0.0035 USD per image (MiniMax pay-as-you-go price page, read 2026-11-06). Stop at the limit and report.
- Muse goes only through Forge and the PM. This round uses mmx only.
- No code changes under `dashboard/`. The mockup HTML and the helper scripts live in `measure/tracks/storytime_cover_options_20261106/options/`.
- Chrome runs only through `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`, never nested.
- The approved print covers stay the print files until Daniel picks.
- Large binary files stay out of git. They live only in the hand-off folder.
- Thai goes to Daniel only. No new Thai is in this round.
- Commits use `git commit -- <paths>` only.

## Acceptance (Phase 1)

- AC-1: 3 options, 5 mockups each (15), at the print sizes of FR-2.
- AC-2: The text check of each mockup PDF passes: the approved texts are present, no forbidden word, and the Thai equals the five approved lines.
- AC-3: The spend log lists every paid call, and the total is at most 1.00 USD.
- AC-4: The hand-off folder holds the contact sheet, the README, `spend-log.md`, and `MANIFEST.txt`, and every manifest line matches its file.
- AC-5 (person-checked): Daniel picks an option, or asks for a change. The task stays open until his pick.

## Phase 2: The option A covers (Amendment 1, 2026-11-07)

### Owner word and PM record

Daniel's word, verbatim (Google Tasks, 2026-11-07 05:06 ICT, PM relay). It is his reply to "Your pick: Storytime cover look A, B, or C". The message had the contact sheet `contact-sheet.png` of `storytime-cover-options-2026-11-06` (SHA-256 begins `fe64b036c17b8b27`):

> "A"

The PM records it as Daniel's look pick: option A, Storybook Quest. The three defaults of the PM note stand, because Daniel gave no other word:

1. The covers draw the book cast in the option A style.
2. The 14 reader covers put the option A frame around the approved reader pictures. No reader gets new art.
3. No new Thai. The approved contact lines stay unchanged.

The PM order for Phase 2 (2026-11-07) has two parts. First, the series cover template of option A in the cover code. Then, the final Level 2 Unit 1 covers. The final covers go into `~/Desktop/print-ready/storytime/` with a MANIFEST by 2026-11-14, and into the 11-16 check folder for Daniel's approval. The approved covers then go into the release proof of 2026-11-20, before the print order of 2026-11-25. Unit 1 critical work comes first (A-48 part 2, the family-word packages by 2026-11-12).

### Decisions (Phase 2)

- D-A1 (code location): the template is a new module, `dashboard/lib/storytime/print/cover-quest.ts`. The per-book parts are a new data file, `content/storytime/covers/quest.json`. The build is a new script, `dashboard/scripts/storytime/make-storytime-quest-covers.ts`. Reason: `covers.ts`, `cover-picture.ts`, `teacher-book-cover.ts`, and `content/storytime/covers/books.json` carry the approved v3 and teacher v1 covers and the tests of the print track. A change there can break the print track gates.
- D-A2 (read only): the new module imports these shared parts and does not change them. From `covers.ts`: the series name, the LINE address, the copy check, the Thai check, the QR grid and its check, the panel values, the font CSS, and the logo file. From `teacher-book-cover.ts`: the teacher and reader copy checks. From `cover-picture.ts`: the 300 ppi value. From `dashboard/lib/covers/back-text.ts`: `BACK_LINES.contact`.
- D-A3 (guard G-1): no Phase 2 commit changes these paths: `dashboard/lib/storytime/print/{covers,cover-picture,teacher-book-cover,readers,student-book,pictures,picture-check}.ts`, `dashboard/scripts/storytime/make-storytime-book-cover.ts`, `dashboard/scripts/storytime/make-storytime-teacher-cover.ts`, `content/storytime/covers/books.json`, any week file, and anything under `video/`. The proof is `git show --name-only --format= <sha>` for each Phase 2 commit, not a range diff.
- D-A4 (reader covers in the books): this track builds the reader cover pages as separate files for Daniel's check. The print track puts the approved pages into the A3 reader files and the student book leaves for the release proof of 2026-11-20. The new module exports one function for that call (FR-9.3). The orchestrator sends the hand-off to the print session (Task 2.13).
- D-A5 (bleed): no printer answer is on record on 2026-11-07. The default is no bleed, as Daniel's decision of 2026-11-05 (separate front and back pages, no spine, no bleed). The template takes a bleed value of 0 mm or 3 mm, so a printer answer changes one value. Text, faces, and the frame keep a safe zone of 5 mm inside the trim.
- D-A6 (art size and upscale): image-01 gives at most 2048 px on the long side. Source: `mmx image generate --help` (width and height from 512 to 2048). The art is 1448 x 2048 px, which is 175 ppi at the A4 trim. A local upscale with the `lanczos3` kernel of `sharp` (a dashboard dependency) makes 2480 x 3508 px. That is 300 ppi at 210 x 297 mm (factor 1.713). No AI upscaler is installed on 2026-11-07, and this track installs no package.
- D-A7 (reader pictures): the reader covers use the approved files `content/storytime/l2/print/pictures/l2-wNN-cover-<slug>-v1.png` (color, A3) and `-line-v1.png` (black and white, leaf), 4000 x 3000 px. The build does not resample them up. The build report gives the effective ppi (4000 px across 420 mm is 242 ppi).
- D-A8 (art files): the final art goes into `content/storytime/l2/print/pictures/` with the names `l2-u1-cover-quest-<side>-v1.jpg` (source) and `l2-u1-cover-quest-<side>-v1-300ppi.png` (upscaled). `.gitignore` line 37 keeps that folder out of git. `quest.json` names the files.
- D-A9 (versions and folders): the build writes into a new folder, `~/Desktop/print-ready/storytime/covers-quest-v1/`. The file versions continue the approved files. The student cover v3 becomes v4, and the teacher cover v1 becomes v2. The reader cover files start at v1. The build refuses a folder that holds files of another version, and it never overwrites a file.
- D-A10 (teacher back): the PM list names the teacher front only. The teacher book prints a back too (teacher cover v1 has one). Default: the teacher back uses the option A back frame. It holds the back scenery art, the series banner, the contact sign with the five Thai lines, the QR, and "LINE". It has no five-field panel, as the v1 teacher back. It needs no new picture.
- D-A11 (11-16 folder): no 11-16 check folder exists on 2026-11-07. `~/Desktop/handoff/` has no folder for that date, and `look-points-11-16.md` names no folder. Default: `~/Desktop/handoff/storytime-check-2026-11-16/covers/`.

### FR-6 The option A frame

The frame is the same on every book. Only the per-book parts of FR-7 change.

1. Art layer: one painted scene to all four trim edges (to the bleed edge when the bleed value is 3 mm). The layer is opaque.
2. Game bar at the top: a silver rim and a navy body. It holds the five band icons (seed, sprout, leaf, bud, flower), a unit bar of 4 parts, a book icon, and a star. The lit band has an amber ring and its own color. The other bands are grey-blue. The unit bar fills the parts up to the unit of the book. The bar has no words on the book fronts.
3. Crest (front sides): a round silver-and-navy emblem with an open book and the lit band icon. Below it, a blue bevelled banner plaque holds "Storytime" and "Advantage" in white League Spartan.
4. Title plaque (front sides): a blue bevelled plaque with a crystal at each end. It holds the level line ("Level 2 · Unit 1") and the book line ("Student Book" or "Teacher Book"). The teacher front adds the band pill ("Sprout") above the plaque.
5. Back sides: the company logo in a white box, a series banner plaque, and the paper panel with the five fields (student back only). Below them: the wooden contact sign with the five Thai contact lines, the QR in a white box, and "LINE".
6. A3 reader cover (420 x 297 mm): the approved color picture is the art layer. On it: the game bar with the band word, the series banner plaque, and the week pill. At the bottom: the title plaque with the reader title, and the role bar with its icons and its line.
7. Leaf cover (198 x 148.5 mm, black and white): the approved line art is in a double-line frame with round corners. A white bevelled plaque with a crystal at each end holds the reader title. The other text is the text of the approved leaf cover page. The leaf cover has only black, white, and grey.
8. The plaque color is the level color of `STORYTIME_LEVEL_COLOURS` (Level 2: `#2A77B8`).
9. Every frame part has a `data-part` mark in the HTML, so a test finds each layer.

### FR-7 The per-book parts

1. A book row of `quest.json` holds the level, the unit, and the lit band. It also holds the art files of the student front, the back, and the teacher front, and the cast group of each front.
2. The lit band is one of the five bands of the week schema. Level 2 Unit 1 lights "sprout".
3. The cast group of the student front has at most 2 children and at most 1 animal (D5 and D7 of track `storytime_covers_20261027`). The teacher front shows Teacher Kim and at most 2 children.
4. A reader cover reads its parts from the week file and changes nothing in it. The parts are the title, the week number, the role mark, and the approved picture row with the use "cover".
5. Level 2 Unit 1 has 14 readers: w01 "Hello!" and "Nan Can Nod" to w07 "Is It a Ball?" and "The Top". Week 8 has no reader.

### FR-8 The art rules

1. New art comes from `mmx image generate` with the model image-01 and a text prompt only. No call has `--subject-ref`. No 3D render and no picture goes to the model.
2. The prompt says "picture", not "cover". Each cast line ends with "no letters". Pip is "a small puppy as tall as Nan's knees". The cast text comes from the cast sheets (`advantage-forge/docs/storytime/l2-unit1/judge/cast.json`, read only).
3. New pictures: the student front and the teacher front. The back scenery keeps `A-back-a1.jpg` of the option round (no fault found). It is upscaled only.
4. The fault list of the option round that the final art fixes:
   - AF-1: Sam's T-shirt on the student front shows one stripe. The cast sheet says "a red T-shirt with two white stripes across the chest".
   - AF-2: the student front a1 has made-up letters on Nan's shirt. The option round filled them with a local step. The final art shows "an orange T-shirt with a white star" with no letters and no local fill.
   - AF-3: Nan's T-shirt on the teacher front shows no white star.
   - AF-4: Teacher Kim reads the book herself on the teacher front. The final pose shows the open book to the children.
5. A picture has at most 3 attempts (Daniel's picture rule). If 3 attempts do not fix a fault, the build uses the best attempt, and a local fix is allowed only for made-up letters. The orchestrator then asks the PM about the Forge route.
6. Spend: the limit is 0.9335 USD for Phase 2 (the 1.00 USD cover limit less 0.0665 USD of the option round). Check the price of one call before the first call. Log every paid call: the time, the tool, the prompt id, the attempt, the cost, and the result file. Stop at the limit and ask the PM before more. Muse goes only through Forge and the PM.
7. The upscale follows D-A6. The upscaled file is at least 2480 x 3508 px for an A4 side.

### FR-9 The template module

1. `cover-quest.ts` writes the HTML of 6 kinds: the student front and back, the teacher front and back, the A3 reader cover, and the leaf cover.
2. The size of each page comes from its trim and the bleed value. The trims are A4 portrait 210 x 297 mm, A3 landscape 420 x 297 mm, and the leaf 198 x 148.5 mm (the `readerPage` of the print profile).
3. One exported function returns the body and the CSS of one reader cover page at a given trim. The print track can call it from the reader cover page of `readers.ts` (D-A4).
4. The module has the checks of the built files. They are the copy check, the Thai byte check, the QR module check, the forbidden words, the page size, the art ppi, and the lit band.
5. Every text in the HTML has one HTML escape. Every exported function has JSDoc.

### FR-10 The text rules

1. Every text is an approved text, word for word, as FR-4.1. The reader texts come from the week files.
2. The Thai of the back sides is byte-identical to `BACK_LINES.contact`. The fronts and the reader covers hold no Thai.
3. The forbidden words of FR-4.3 apply to every page.
4. The text stays text in the PDF. `pdftotext` finds each approved text on its page.
5. The art holds no letters, no words, no numbers, and no logo.

### FR-11 The print files and the hand-off

1. The build writes the PNG of each page at 300 ppi, a Chrome PDF, and with `--print` a PDF/X-1a file through `scripts/print/make-pdfx.ts --keep-fonts`.
2. The print files: `Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf` (2 pages), `Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf` (2 pages), `Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf` (14 pages), and `Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf` (14 pages).
3. `PRINT_GATE` exits 0 for each print file.
4. A contact sheet for each kind and one for all kinds. A person looks at every page at 100 % and records one line for each page.
5. `MANIFEST.txt` gives the SHA-256, the size, and the name of each file. `sha256sum -c` passes on it.
6. The 11-16 check folder (D-A11) gets the print files, the PNGs, and the contact sheets. It also gets a README with one line for each file kind, the spend log, and its own `MANIFEST.txt`.
7. The approved files stay unchanged: the student cover v3 PDF/X (SHA-256 begins `e0e0365a4ece8a5b`), its `cover.pdf` (begins `2964d9b678afc7a0`), and the teacher cover v1 PDF/X (begins `3b992af216dc2238`). They stay the print files until Daniel approves the option A files.

### Acceptance (Phase 2)

- AC-6: The tests of `cover-quest.ts` and of the build pass, and `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass with no FAIL row.
- AC-7: Guard G-1 holds for each Phase 2 commit.
- AC-8: The spend log lists every paid call of Phase 2, and the Phase 2 total is at most 0.9335 USD.
- AC-9: The four print files pass `PRINT_GATE`, and the build report shows the copy, Thai, QR, page size, ppi, and band checks as pass.
- AC-10: The look record has one line for each page, and each line is a pass, or a fault with its fix.
- AC-11: The 11-16 folder holds the files of FR-11.6, and its `MANIFEST.txt` passes `sha256sum -c`.
- AC-12 (owner-approved): Daniel approves the option A covers, or asks for a change. The task stays open until his word.

## Out of scope

- Phase 1: any change to the approved print files, the cover code, the week files, or the book pages.
- Phase 2: any change to the files of guard G-1, the approved print files, and the book pages. The wiring of the reader covers into the reader files and the student book belongs to the print track.
- The covers of other units and levels.
- Muse renders, Forge work, and any message to the printer.

## Open points (default in force until Daniel answers)

| # | Point | Default |
|---|---|---|
| Q1 | The cast look on the covers: the stylized cast differs from the 3D cast of the book pages. Rule 1 of assignment A-18 (a) said "The Storytime look only, with the Forge 3D cast". Daniel's order of 2026-11-06 asks for a more stylized look. | Closed 2026-11-07: Daniel picked option A, and PM default 1 stands. The covers draw the book cast in the option A style. The Primary Chibi Quest cast never appears. |
| Q2 | Full-bleed art with no bleed: art to the trim edge can show a thin white line after the cut. | Open. No bleed (D-A5), with a 5 mm safe zone. The PM asks the printer about 3 mm bleed. A "yes" changes one value of the template. |
| Q3 | Reader covers: new stylized art for all 14 readers, or the frame around the approved reader picture. | Closed 2026-11-07: PM default 2 stands. The 14 reader covers put the option A frame around the approved reader pictures. No reader gets new art. |
| Q4 | The teacher back (D-A10). | The option A back frame with the back scenery, the contact sign, the QR, and "LINE". No panel and no new picture. |
| Q5 | The upscale method (D-A6). | `sharp` `lanczos3` to 300 ppi at the trim. An AI upscaler needs an install, which this track does not do. |
| Q6 | The 11-16 check folder (D-A11). | `~/Desktop/handoff/storytime-check-2026-11-16/covers/`, unless the PM names the folder of the 11-16 sitting. |
| Q7 | The A3 reader files of the print track are Chrome PDFs (PDF 1.4), not PDF/X (measured on `unit1-check-v2/readers-a3/`, 2026-11-07). | This track makes the reader cover files PDF/X-1a. The print track keeps the form of its reader files. |
