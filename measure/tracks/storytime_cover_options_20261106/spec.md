# Spec: Storytime cover options in the RPG-theme style

Track: `storytime_cover_options_20261106`. Type: chore (classic FR list). Created: 2026-11-06. Owner: Daniel Bo. Status: Daniel picked option A on 2026-11-07 (Phase 1). Phase 2 (the option A covers) is planned. The independent spec review passed on 2026-11-07 (findings F1 to F6 answered). Amendment 2 (2026-11-13, PM look): fix round F9, D-F9-1 to D-F9-10 (cancelled 2026-11-13; Daniel approved the reader covers; the r5 book covers wait for his answer, Task 2.14b).

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

1. Every text on a mockup is an approved text, word for word: "Storytime Advantage", "Level 2 · Unit 1", "Student Book", "Teacher Book", "Sprout", the five panel fields of the approved v3 back, "Nan Can Nod", "SPROUT", "Week 1", "Listen and read.", and "LINE". Phase 2 clarification (2026-11-07, F7 of `test-strategy.md`): the role set of the 14 reader covers also holds "Sound it out." (6 readers; FR-7.4).
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
- D-A3 (guard G-1, amended after review finding F1): no Phase 2 commit changes a shared file. The list:
  - the cover code: `dashboard/lib/storytime/print/{covers,cover-picture,teacher-book-cover,readers,student-book,pictures,picture-check,profile,icons}.ts`, `dashboard/scripts/storytime/make-storytime-book-cover.ts`, `dashboard/scripts/storytime/make-storytime-teacher-cover.ts`, and `content/storytime/covers/books.json`;
  - the shared Thai source and the cover helpers: every file under `dashboard/lib/covers/`, with `dashboard/lib/covers/back-text.ts` (`BACK_LINES.contact`);
  - the print gate: every file under `dashboard/scripts/print/`, with `dashboard/scripts/print/make-pdfx.ts`;
  - the other imports: `dashboard/lib/storytime/{schema,files,phonics}.ts`, `dashboard/lib/qr-generator.ts`, `dashboard/lib/document-wrapper/print-fonts.ts`, and `dashboard/lib/lesson-package/files.ts`;
  - any other file that `cover-quest.ts` or the build script imports at a Phase 2 commit, and any week file, and anything under `video/`.
  The allowed paths of Phase 2 are the three new files of D-A1 and the two test files of D-A12. The other allowed paths are `measure/tracks/storytime_cover_options_20261106/`, `measure/runs/storytime_cover_options_20261106/`, `measure/tracks.md`, `measure/tech-debt.md`, `measure/lessons-learned.md`, and the one receiving task line of D-A4 in the print plan. The proof is `git show --name-only --format= <sha>` for each Phase 2 commit, not a range diff. Each listed path is in the allowed list.
- D-A4 (reader covers in the books): this track builds the reader cover pages as separate files for Daniel's check. The print track puts the approved pages into the A3 reader files and the student book leaves for the release proof of 2026-11-20. The new module exports one function for that call (FR-9.3). The orchestrator sends the hand-off to the print session (Task 2.13). The receiving task is the line "Task (Hand-off from storytime_cover_options)" in Phase 9 of `measure/tracks/storytime_print_r1_20261025/plan.md`, before its release proof task (review finding F3). Without Daniel's approval of the option A covers, the release proof keeps the approved covers.
- D-A5 (bleed): no printer answer is on record on 2026-11-07. The default is no bleed, as Daniel's decision of 2026-11-05 (separate front and back pages, no spine, no bleed). The template takes a bleed value of 0 mm or 3 mm, so a printer answer changes one value. Text, faces, and the frame keep a safe zone of 5 mm inside the trim.
- D-A6 (art size and upscale): image-01 gives at most 2048 px on the long side. Source: `mmx image generate --help` (width and height from 512 to 2048). The art is 1448 x 2048 px, which is 175 ppi at the A4 trim. A local upscale with the `lanczos3` kernel of `sharp` (a dashboard dependency) makes 2480 x 3508 px. That is 300 ppi at 210 x 297 mm (factor 1.713). No AI upscaler is installed on 2026-11-07, and this track installs no package.
- D-A7 (reader pictures): the reader covers use the approved files `content/storytime/l2/print/pictures/l2-wNN-cover-<slug>-v1.png` (color, A3) and `-line-v1.png` (black and white, leaf), 4000 x 3000 px. The build does not resample them up. The build report gives the effective ppi (4000 px across 420 mm is 242 ppi).
- D-A8 (art files): the final art goes into `content/storytime/l2/print/pictures/` with the names `l2-u1-cover-quest-<side>-v1.jpg` (source) and `l2-u1-cover-quest-<side>-v1-300ppi.png` (upscaled). `.gitignore` line 37 keeps that folder out of git. `quest.json` names the files.
- D-A9 (versions and folders, amended after review finding F2): the build writes into a new folder, `~/Desktop/print-ready/storytime/covers-quest-v1/`. The file versions continue the approved files. The student cover v3 becomes v4, and the teacher cover v1 becomes v2. The reader cover files start at v1. The build refuses a folder that holds files of another version, and it never overwrites a file. The build option `--version <n>` is the set number (pin P5 of `test-strategy.md`). The folder is `covers-quest-v<n>`, and the file versions are student 3+n, teacher 1+n, and readers n. Set 1 gives v4, v2, and v1. The layout of the folder:
  - `student/`: `front.png`, `back.png`, `cover.pdf`, `Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf`, `build-report.json`;
  - `teacher/`: `teacher-front.png`, `teacher-back.png`, `teacher-cover.pdf`, `Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf`, `build-report.json`;
  - `readers-a3/`: `l2-wNN-<slug>-a3-cover.png` (14 files), `reader-covers-a3.pdf`, `Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf`, `build-report.json`;
  - `readers-leaf/`: `l2-wNN-<slug>-leaf-cover.png` (14 files), `reader-leaf-covers.pdf`, `Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf`, `build-report.json`;
  - `contact-sheets/`: `student.png`, `teacher.png`, `readers-a3.png`, `readers-leaf.png`, `all.png`;
  - the folder root: `spend-log.md` (Task 2.8 writes it first) and `MANIFEST.txt` (Task 2.11 writes it last).
  The 11-16 copy (D-A11) mirrors the whole folder (orchestrator default of 2026-11-07; `test-strategy.md` section 4.12). It is a byte copy of the 50 files in the same five subfolders, with `spend-log.md` at its root. It adds `README.md` and its own `MANIFEST.txt` at its root. The print-ready folder holds 51 files with its `MANIFEST.txt`, and the copy holds 52. `<slug>` is the slug of the approved cover picture file name (for example `nan-can-nod`).
- D-A10 (teacher back): the PM list names the teacher front only. The teacher book prints a back too (teacher cover v1 has one). Default: the teacher back uses the option A back frame. It holds the back scenery art, the series banner, the contact sign with the five Thai lines, the QR, and "LINE". It has no five-field panel, as the v1 teacher back. It needs no new picture.
- D-A11 (11-16 folder): no 11-16 check folder exists on 2026-11-07. `~/Desktop/handoff/` has no folder for that date, and `look-points-11-16.md` names no folder. Default: `~/Desktop/handoff/storytime-check-2026-11-16/covers/`.
- D-A12 (test names, review finding F4): the Phase 2 test files are `dashboard/__tests__/quest-cover-template.test.ts` and `dashboard/__tests__/quest-cover-build.test.ts`. The names are outside the shared globs `__tests__/storytime-*.test.ts` and `__tests__/covers-*.test.ts` of the print, loops, week-package, and unit 2 tracks. Reason: a red file of this track then fails no Green gate of another track, so rule R1 does not bind this track, and Red 1 can start at once. Section 2.3 of `measure/tracks/storytime_teaching_loops_20261103/test-strategy.md` names this structural option. The other tracks lose no cover of a shared module, because guard G-1 keeps every shared file unchanged. The `PROJECT_TESTS` of this track is the shared list plus `__tests__/quest-cover-*.test.ts`, with `--maxWorkers=1`.
- D-A13 (date fallback, review finding F4): Green 2 can fail to pass by 2026-11-12 18:00 ICT. Then the final covers come from the option A mockup pipeline of `options/`. The steps: `build.py` with the fixed art, Chrome through heavy-run, then `scripts/print/make-pdfx.ts`. The fallback writes the file names and the folders of D-A9, and it keeps every print and check step of Tasks 2.9 to 2.12. The template tasks then follow after 2026-11-14. The fallback changes no file under `dashboard/`. Checkpoint: 2026-11-10 18:00 ICT (orchestrator default of 2026-11-07; `test-strategy.md` section 4.13). If Green 1 is not done then, the orchestrator starts the fallback driver in parallel. Reason (measured): `build.py` builds only the 15 mockups, with no teacher back, no loop over the 14 A3 and 14 leaf covers, and no `--k-only` step. The plan names the trigger command and the record line.

### FR-6 The option A frame

The frame is the same on every book. Only the per-book parts of FR-7 change.

1. Art layer: one painted scene to all four trim edges (to the bleed edge when the bleed value is 3 mm). The layer is opaque.
2. Game bar at the top: a silver rim and a navy body. It holds the five band icons (seed, sprout, leaf, bud, flower), a unit bar of 4 parts, a book icon, and a star. The lit band has an amber ring and its own color. The other bands are grey-blue. The unit bar fills the parts up to the unit of the book. The bar has no words on the book fronts.
3. Crest (front sides): a round silver-and-navy emblem with an open book and the lit band icon. Below it, a blue bevelled banner plaque holds "Storytime" and "Advantage" in white League Spartan.
4. Title plaque (front sides): a blue bevelled plaque with a crystal at each end. It holds the level line ("Level 2 · Unit 1") and the book line ("Student Book" or "Teacher Book"). The teacher front adds the band pill ("Sprout") above the plaque. Amended 2026-11-13 (D-F9-5): the plaque of the shipped style has plain ends and no crystal.
5. Back sides: the company logo in a white box, a series banner plaque, and the paper panel with the five fields (student back only). Below them: the wooden contact sign with the five Thai contact lines, the QR in a white box, and "LINE".
6. A3 reader cover (420 x 297 mm): the approved color picture is the art layer. On it: the game bar with the band word, the series banner plaque, and the week pill. At the bottom: the title plaque with the reader title, and the role bar with its icons and its line.
7. Leaf cover (198 x 148.5 mm, black and white): the approved line art is in a double-line frame with round corners. A white bevelled plaque with a crystal at each end holds the reader title. The other text is the text of the approved leaf cover page. The leaf cover has only black, white, and grey. Amended 2026-11-13 (D-F9-3, D-F9-5): the plaque has plain ends, and all 14 leaf plaques have one height.
8. The plaque color is the level color of `STORYTIME_LEVEL_COLOURS` (Level 2: `#2A77B8`).
9. Every frame part has a `data-part` mark in the HTML, so a test finds each layer.

### FR-7 The per-book parts

1. A book row of `quest.json` holds the level, the unit, and the lit band. It also holds the art files of the student front, the back, and the teacher front, and the cast group of each front.
2. The lit band is one of the five bands of the week schema. Level 2 Unit 1 lights "sprout". `quest.json` holds the band in lower case (`sprout`). The week schema holds it with a capital (`Sprout`). The data check compares the capitalized `litBand` with `meta.band` of the weeks (pin P11 of `test-strategy.md`).
3. The cast of Level 2 Unit 1 is fixed (FR-3.4, review finding F5). The student front shows Nan, Sam, and Pip: 2 children and 1 animal, the limit of D5 and D7 of track `storytime_covers_20261027`. The teacher front shows Teacher Kim, Nan, and Sam. The data check of `quest.json` rejects a cast group above the limits. A student front fails with more than 2 children or more than 1 animal. A teacher front fails with more than Teacher Kim and 2 children.
4. A reader cover reads its parts and changes nothing in their files (clarified 2026-11-07, F7 and F8 of `test-strategy.md`). The title, the week number, and the kind come from `books[]` of the week file. The approved picture row with the use "cover" comes from `content/storytime/l2/print/pictures.json` (14 rows, weeks 1 to 7, two per week), not from the week file. The role mark follows the role rule of `readers.ts`. "Listen and read." marks 8 readers: the 7 read-alongs and "Nan Can Nod", the sound book of week 1. "Sound it out." marks the other 6 decodable readers.
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
2. The Thai of the back sides is byte-identical to `BACK_LINES.contact`. The fronts and the reader covers hold no Thai. The Thai byte check reads the Chrome PDFs or the HTML, never a PDF/X file. Reason (measured, F13 of `test-strategy.md`): `pdftotext` of the PDF/X file drops the Thai tone marks.
3. The forbidden words of FR-4.3 apply to every page.
4. The text stays text in the PDF. `pdftotext` finds each approved text on its page. The English texts are also checked in the PDF/X file (FR-11.3).
5. The art holds no letters, no words, no numbers, and no logo.

### FR-11 The print files and the hand-off

1. The build writes the PNG of each page at 300 ppi, a Chrome PDF, and with `--print` a PDF/X-1a file through `scripts/print/make-pdfx.ts --keep-fonts`. The leaf print file adds `--k-only` (amended 2026-11-07, pin P7 of `test-strategy.md`). Reason (measured, F14): without it, the black and grey of the leaf convert to rich black (C, M, and Y at 0.176). With it, C, M, and Y are 0.000, as FR-6.7 needs.
2. The print files: `Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf` (2 pages), `Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf` (2 pages), `Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf` (14 pages), and `Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf` (14 pages).
3. `PRINT_GATE` exits 0 for each print file. Next to it, the per-page text and font check (`PRINT_TEXT_CHECK` of the plan) runs on each print file. Every page holds "Storytime Advantage" and the title of its kind as text, and every font is embedded, with no Type 3 font. Reason (measured, F12 of `test-strategy.md`): `checkPdfx` excuses a page that already is one page-size image. Each cover page has a full-page art image, so a rasterized page passes `PRINT_GATE`.
4. A contact sheet for each kind and one for all kinds. A person looks at every page at 100 % and records one line for each page.
5. `MANIFEST.txt` gives the SHA-256, the size, and the name of each file. `sha256sum -c` passes on it.
6. The 11-16 check folder (D-A11, the layout of D-A9) gets a byte copy of every file of `covers-quest-v1` except its `MANIFEST.txt`. These are the print files, the Chrome PDFs, the PNGs, the build reports, the contact sheets, and the spend log. It also gets a README with one line for each file kind and its own `MANIFEST.txt`.
7. The approved files stay unchanged: the student cover v3 PDF/X (SHA-256 begins `e0e0365a4ece8a5b`), its `cover.pdf` (begins `2964d9b678afc7a0`), and the teacher cover v1 PDF/X (begins `3b992af216dc2238`). They stay the print files until Daniel approves the option A files.

### Acceptance (Phase 2)

- AC-6: The tests of `cover-quest.ts` and of the build pass, and `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass with no FAIL row.
- AC-7: Guard G-1 holds for each Phase 2 commit. No commit changes a file of D-A3, with `dashboard/lib/covers/back-text.ts` and `dashboard/scripts/print/make-pdfx.ts`, and each changed path is in the allowed list of D-A3.
- AC-8: The spend log lists every paid call of Phase 2, and the Phase 2 total is at most 0.9335 USD.
- AC-9: The four print files pass `PRINT_GATE` and the per-page text and font check of FR-11.3. The build report shows the copy, Thai, QR, page size, ppi, and band checks as pass. The Thai check reads the Chrome PDFs (FR-10.2).
- AC-10: The look record has one line for each page, and each line is a pass, or a fault with its fix.
- AC-11: The 11-16 folder holds the files of FR-11.6, and its `MANIFEST.txt` passes `sha256sum -c`.
- AC-12 (owner-approved): Daniel approves the option A covers, or asks for a change. The task stays open until his word.

### Fix round F9 (Amendment 2, 2026-11-13) (CANCELLED 2026-11-13)

**CANCELLED 2026-11-13.** Daniel passed the covers (Google Tasks LW5mMW9WbFJvNTR1OUNKVQ, 2026-11-13 11:41, PM relay, verbatim): "They all look fine at 12:40. Teacher gave is not cut." (the reader covers). The book covers stay r2 until Task 2.14b of the plan closes. The PM then cancelled this fix round and ordered no cover change. Fault 1 was a PM error, because the PM crop of the contact sheet cut the Paint! tile. D-F9-1 to D-F9-10 and the open points Q8 to Q12 do not apply. The cover set of MANIFEST 8f1901a3 is the accepted set. The text below stays as the record.

The PM look of the A3 and leaf contact sheets passed F7 (no white band) and the rule "no logo on a front". It found 5 faults and kept one point. This round fixes the faults by crop, layout, and data only. It makes no paid call.

PM look, 2026-11-13 about 11:55 ICT, word for word: "F7 white band gone, no logo on a front: pass. Faults for one fix round (crop/layout only, no paid generation), new MANIFEST + sheets by 17:00, AFTER the clip packages (14:00 stays first): (1) l2-w03-paint A3: the page edge cuts the teacher's face in half; shift the crop so that her face is whole or fully out. (2) The Week tag sits on the sun on l2-w02-how-many, l2-w05-i-have-two, l2-w06-i-can-see A3; move the tag to clear sky (rule: no chrome over a key object) and add a test for tag/sun overlap if the sun box is known, else a manual capture line. (3) l2-w01-nan-can-nod leaf: the title plate is much smaller than the other 13; same plate height and the ~80 % text fill rule on all 14. (4) Title plate over a child's body: A3 + leaf my-family (the waving girl), leaf tap-tap (both boys' torsos), A3 can-i (the boy), hello (2 children): move the plate to the lowest clear band or to the top (as on is-it-a-ball and the-top) so that no plate covers a main character above the knees. (5) The diamond ends of the title plate read as arrow buttons (Daniel: no game UI): plain ends. (6) Subtitle icons: keep." The PM checked `MANIFEST.txt` of `covers-quest-v1` (SHA-256 begins `8f1901a3`) at 11:40: 133 of 133 files match.

#### Measured facts (2026-11-13; scratch captures in `/tmp/opencode/p2fix/`, not committed; the Green role repeats each command)

- M1. `content/storytime/l2/print/pictures-heads.json` holds 31 entries with the kinds `head` (100 boxes), `dog-body` (5), and `title-object` (8). It holds no body box and no sun box. Command: `python3 -I -B /tmp/opencode/p2fix/keys_measure.py content/storytime/l2/print/pictures-heads.json` (capture `keys-measure-out.txt`).
- M2. The A3 art (4000 x 3000 px) fills the 420 mm width with no free space (0.0 mm). It crops 18.0 mm of the height. So a crop shift cannot move the art sideways.
- M3. The teacher head box of `l2-w03-cover-paint-v1.png` (art px 2540 to 2820) lies inside the trim at every art position. The faces that the page edge cuts are the head boxes of child 1 (px 0 to 420) and child 6 (px 3600 to 4000). The art file itself ends inside those faces. Nine head boxes have a side on the art edge: paint (colour and line art, 2 each), how-many (colour and line art, 2 each), and the hello line art (1).
- M4. A centred zoom of 1.27 puts both edge heads of paint fully outside the trim and cuts no other head, for the colour art on A3 and for the line art on the leaf. No centred zoom up to 1.60 does this for how-many (colour and line art) or for the hello line art (capture `keys-measure-out.txt`).
- M5. `KEY_HEAD_ABOVE_TOP_MM = 12` (`cover-quest.ts` line 1992) lets one box leave the top edge: the `Nan head` box of `l2-w01-cover-nan-can-nod-v1.png` (hair top at art row 60). It is 2.7 mm out at `50% 50%` and 11.7 mm out at `50% 100%`. At `50% 50%` the dog body is 7.9 mm out of the bottom. The art spans 307.7 mm of the 297 mm height, so no art position holds the hair top and the dog body together.
- M6. `questChromePlacement` gives the plaque scale 0.5 on 2 of the 28 reader covers: `w01-2 reader-a3` and `w01-2 reader-leaf`. The other 26 covers have scale 1 and a week pill move of 0 (capture `place-out.txt`, from the exported `questChromePlacement`).
- M7. `plaqueSvg` is called from 8 places in `cover-quest.ts`. The function `crystal` draws the arrow-like path and the diamond at both ends. `quest-cover-readers-r2b.test.ts`, `quest-cover-readers-r2c.test.ts`, and `quest-cover-plaque-fit.test.ts` pin the crystal groups today (24, 29, and 5 lines with "crystal" or "diamond").
- M8. The leaf title text is the 80 % cap-height rule `TITLE_CAP_SHARE = 0.8` (S3: 75 % to 85 % of the band). A scaled plaque scales its font and band together, so the rule already holds on the small plaque. Only the size differs.
- M9. The leaf plaque padding is 21 mm for the crystal ends (`LEAF_PLAQUE_PADDING_MM`), and the width has the limits 110 mm and 182 mm. On `w01-2 reader-leaf` the dog body box and the Nan head box leave a free band of about 95 mm (page x from 5 mm to the dog box). The scale 1 plaque of that title is wider (the size-0.5 plaque slid by 43 mm to the left).
- M10. `look-phase2.md` is in the track folder. Its line 6 says the last change was at 00:59. The last change of the folder was `MANIFEST.txt` at 07:35 ICT on 2026-11-13 (`stat`).

#### Decisions (Fix round F9)

- D-F9-1 (item 1: no cut face). A head box is whole in the trim, or whole outside it. The Q1 allowance goes: the constant `KEY_HEAD_ABOVE_TOP_MM` is deleted, and every kind takes the tolerance `KEY_TRIM_TOLERANCE_MM` (0.05 mm). Two parts follow from M3 and M5:
  - (a) A head box with a side on the art file edge (5 px) is an edge head. An edge head is cut by the art file, not by the crop. The art crop of a cover with an edge head sets a zoom so that every edge head lies fully outside the trim. The zoom is a new data row in a new file, `content/storytime/l2/print/pictures-crop.json` (the key is the art file name, the value is `{ "zoom": <number> }`, the anchor is the centre). The rows are `l2-w03-cover-paint-v1.png` and `l2-w03-cover-paint-line-v1.png` with the zoom 1.27 (M4; the Green role repeats the ladder and records any other value). The zoom is a uniform scale of the art layer by a larger picture box. It uses no CSS `transform` on the page (rule R31: Chrome turns a page with a scaled layer into one image). The key box mapping and the placement rule D3 read the zoom.
  - (b) The edge heads of how-many (colour and line art) and the hello line art cannot get a zoom (M4). They form the pinned list `EDGE_HEAD_EXCEPTIONS`: `l2-w02-cover-how-many-v1.png`, `l2-w02-cover-how-many-line-v1.png`, and `l2-w01-cover-hello-line-v1.png`. The PM did not flag them. The look task reports them.
  - (c) The `Nan head` box of `l2-w01-cover-nan-can-nod-v1.png` becomes the face box: the skin from the brows to the chin and both ears, with no hair and no bun. The Green role measures it from the art. The hair top may leave the trim. Reason: M5. The line art entry stays.
  - The effective ppi of a zoomed art is the file ppi divided by the zoom (A3 paint: 241.9 / 1.27 = 190.5). The build report gives it as `cropZoom` and `effectivePpi`. The check P10 of the file stays. A zoomed A3 art needs an effective ppi of 180 or more.
- D-F9-2 (item 2: no chrome on the sun). The key box file gets the new kind `sun`: the visible sun disc and its rays, in art pixels. The Green role measures every colour art of the 14 A3 covers and adds one `sun` box for each visible sun. The arts of `l2-w02-cover-how-many-v1.png`, `l2-w05-cover-i-have-two-v1.png`, and `l2-w06-cover-i-can-see-v1.png` must each hold at least one. A line art entry gets a `sun` box only when a chrome part of its leaf cover meets the sun. A `sun` box needs no trim rule: the mapping clips it to the trim before the overlap test. The overlap rule D2 (1 mm clearance, `KEY_CLEARANCE_MM`) applies to the new kind with the real boxes. The week pill keeps its order (top right, then the mirrored top left, then down that column). A test proves the rule with the real boxes, and a positive control proves that a pill box laid on the sun fails.
- D-F9-3 (item 3: one leaf plaque height). All 14 leaf covers take one plaque height, `LEAF_PLAQUE_HEIGHT_MM`, and the plaque scale of the leaf is always 1. The leaf has no size ladder and no 50 % size. M9 shows that the old height of 20 mm cannot hold the `w01-2` title clear of the dog body and the Nan head. So the one height is the largest whole millimetre from 10 to 16 at which all 14 leaf covers have a free place (default estimate: 13 mm). The Green role finds it with the placement code and records the table. The leaf plaque padding becomes 8 mm (`LEAF_PLAQUE_PADDING_MM`), because the plain ends of D-F9-5 need no crystal room. The width limits stay. The title keeps the cap-height rule of S3 (75 % to 85 % of the band, 80 % by design). The test measures it as S3 measures it. The rule is not a width share: the width of a plaque follows the title length and the minimum width, so one width share cannot hold for 14 titles. The A3 covers keep their size rule D3 (the 95 % to 50 % ladder), because the spec has no equal-height rule for A3 and the PM named the leaf. The A3 plaque of `w01-2` stays at 50 % (M6). The look task reports it.
- D-F9-4 (item 4: no plaque on a body). The key box file gets the new kind `body`: the main character from the head to the knees, in art pixels. The Green role measures and adds it at least for these arts: `l2-w04-cover-my-family-v1.png` and its line art (the girl who waves, and the other family members), `l2-w06-cover-tap-tap-line-v1.png` and its colour art (both boys), `l2-w02-cover-can-i-v1.png` and its line art (the boy), and `l2-w01-cover-hello-v1.png` and its line art (the 2 children that the Green role names: the two nearest the title place). A `body` box needs no trim rule (as D-F9-2). The plaque, its sub-part, and its painted overflow meet no `body` box (D2, 1 mm). The place order is the order of D3, with one change for the leaf: (1) the default place; (2) the group moves up in 1 mm steps and takes the first free place, which is the lowest clear band, and the top band when no lower band is free (as on `is-it-a-ball` and `the-top`); (3) on A3 only, the size ladder 95 % to 50 %; (4) the horizontal slide, on the leaf at the plaque height of D-F9-3. A leaf cover with no free place at that height stops the Green role. The role reports the cover, its boxes, and the free bands. It does not shrink the plaque.
- D-F9-5 (item 5: plain ends). The title plaque of the shipped style (the top style `hlogo`) has plain ends: no crystal group, no ornament path, and no diamond on the 2 fronts, the 14 A3 covers, and the 14 leaf covers. The plaque keeps its shape, its colours, its bevel, and its size rule. The A3 and front plaque widths keep their values (their padding stays). A parameter of `plaqueSvg` selects the plain ends. The default style (`top` not `hlogo`) keeps its crystal ends and its bytes (D8 of F3 to F6), because it ships no cover. The back sides of the shipped style hold no title plaque or series banner. Reason: Daniel's rule is no game UI, and the crystal ends read as arrow buttons.
- D-F9-6 (item 6: the subtitle icons stay). The A3 role bar and the leaf footer keep their role icons and their texts. A guard test counts the icons: 2 on each of the 28 covers.
- D-F9-7 (no paid call). The round changes crop, layout, and data only. A Claude role measures the new key boxes from the existing art (the Green role is a Claude model). No `mmx` call runs. The spend total stays as the spend log of Task 2.8.
- D-F9-8 (output). One heavy-run build per kind writes the new files in a temporary folder. The old files of the changed pages move first, with `mv` and their paths, to `~/Desktop/print-ready/storytime/covers-quest-v1-superseded-20261113/`, together with the old `MANIFEST.txt` as `MANIFEST-8f1901a3.txt`. The new files then copy into `covers-quest-v1` as byte copies (the build never overwrites). The changed files are every file whose bytes change in the rebuild. The Green role lists them in an old-to-new SHA-256 table, as part 12 of Task 2.9 did. The set holds the 2 shipped fronts (the r5 variants of `student/` and `teacher/`, item 5), the 14 A3 covers, the 14 leaf covers, their PDF files, print files, and build reports, the 3 PDF files of `reader-back-r5/` (their page 1 is a quest cover), and the contact sheets. Reason: one folder holds one current set, so `MANIFEST.txt` of `covers-quest-v1` lists no old page. The folder `covers-quest-v1` keeps the other book variants as before (D-3 of `print-gate.txt`). The new `MANIFEST.txt` and the contact sheets go to the PM by 17:00 ICT on 2026-11-13. The sheets carry one full-size page for each cover kind (the standing rule). The task also gives one before-and-after capture for each of the 6 items, as `contact-sheets/f9-item-<n>.png` (n from 1 to 6).
- D-F9-9 (lane and order). The round follows the lane of F7b and F8: Red, then Green, and the PM look is the review. The Red family differs from the Green family. Green is Anthropic. The round starts after the week-package hand-off at 14:00 ICT (one Workbooks role at a time). The Red role reads no week file. If it must, its first command is the Thai filter. Red ends about 14:45, Green and the rebuild end about 16:40, and the PM line goes at 17:00.
- D-F9-10 (guard G-1). The Red allowed paths are `dashboard/__tests__/quest-cover-*.test.ts` (the new file `quest-cover-f9.test.ts` and the moved pins), `measure/runs/storytime_cover_options_20261106/`, and `measure/tracks/storytime_cover_options_20261106/`. The Green allowed paths are `dashboard/lib/storytime/print/cover-quest.ts`, `dashboard/scripts/storytime/make-storytime-quest-covers.ts`, `content/storytime/l2/print/pictures-heads.json`, the new `content/storytime/l2/print/pictures-crop.json`, `content/storytime/covers/quest.json` (only if a row needs it), `measure/runs/storytime_cover_options_20261106/`, and `measure/tracks/storytime_cover_options_20261106/`. Green changes no test file. `readers.ts` and every other file of D-A3 stay unchanged, unless a Green gate shows that the zoom of D-F9-1 needs one named line there. Then the role stops and asks the orchestrator.

#### Moved pins (the Red role changes only these, each hunk with the comment "changed 2026-11-13 (F9)")

- `quest-cover-f3f6.test.ts`: `KEY_KINDS` and the guard "D1" (5 kinds: `head`, `dog-body`, `title-object`, `sun`, `body`; the new counts), the trim test "D2: every key box lies inside the trim" (the Q1 allowance goes: `Q1_COVER`, `Q1_HEAD_OUT_MM`, and `DEFAULT_POSITION` read the face box; the rule skips `sun` and `body`), the test "D3 ... keeps the full size" and "D4 ... the exception list" (the leaf has no scale below 1; `EXCEPTIONS` keeps only `w01-2 reader-a3`).
- `quest-cover-heads.test.ts`: the H0 kind list and its head rule.
- `quest-cover-readers-r2b.test.ts` (B1, B3) and `quest-cover-readers-r2c.test.ts` (the crystal group pins, lines near 1171 to 1221, and the leaf plaque size pins): 0 crystal groups, 0 diamond paths, the text box inside the plaque band with a margin of 2 mm to each plaque end.
- `quest-cover-plaque-fit.test.ts` P1 and P2: the same plain end change on the 2 fronts.
- The standing rules S1 to S5 stay as they are. They must pass on the new pages.

#### Acceptance (Fix round F9)

- AC-13: `dashboard/__tests__/quest-cover-f9.test.ts` and every other `quest-cover-*` test pass, and `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass with no FAIL row.
- AC-14: The built pages pass the 6 items: no head box is cut (D-F9-1), no chrome part meets a sun or a body box (D-F9-2, D-F9-4), the 14 leaf plaques have one height (D-F9-3), the plaques have plain ends (D-F9-5), and the icons stay (D-F9-6). The 4 print files pass `PRINT_GATE` and the text check, and the standing rules hold.
- AC-15: The new `MANIFEST.txt` of `covers-quest-v1` passes `sha256sum -c`. The old files and the old manifest are in the superseded folder with equal SHA-256 values. The 6 item captures and the sheets reach the PM by 17:00 ICT on 2026-11-13.

### Fix round F10 (Amendment 3, 2026-11-13): the r6 book covers

Daniel looked at the r5 student and teacher book covers and found no title on the front. This round puts the title "Storytime Advantage" on the 2 book fronts as text. It changes layout only. It makes no paid call and builds nothing but the 2 book covers. The F9 round stays cancelled. The F9 section stays as the record, and its decisions do not apply here.

#### Owner word and PM order

Daniel's look at the r5 student and teacher book covers (Google Tasks Z21qUjZET3VNUjQxNzVfdA, 2026-11-13, his words, PM relay, verbatim): "Logo is on the back, but we still need a title on the fucking front. Jesus."

The PM order of 2026-11-13, about 14:50 ICT (PM relay, verbatim):

> "PM → Workbooks: Daniel's look at the alt-hlogo r5 student + teacher BOOK covers (Tasks Z21qUjZET3VNUjQxNzVfdA, 2026-11-13, his words): \"Logo is on the back, but we still need a title on the fucking front. Jesus.\" FAULT (yours in the build, mine in the look): r5 took the logo off the front and left the front with no title at all, only the 'Level 2 · Unit 1 · Student Book' plate. ORDER, book covers r6, student and teacher: the front carries the TITLE 'Storytime Advantage' as text (a title plate in the logo colors, as on the first front.png, large, centered, text fill about 80 % of the plate, in the calm top area over the tree canopy; no STA logo mark on the front), and keeps the level plate at the bottom. The back stays as r5 (logo tile, centered text). Rules as before: nothing over a face, a head, or the dog; a real frame or none; no game UI. Add a test: each book front holds the title text 'Storytime Advantage' (and each reader front holds its book title), so a front with no title can never pass again. Layout only, no paid generation. Order of work: the clip packages stay first; then r6. DATE: r6 PDFs + PNGs + one contact sheet with whole tiles (student front/back, teacher front/back) by 2026-11-14 10:00. The release proof keeps r2 until Daniel passes r6."

#### Measured facts (2026-11-13; scratch captures in `/tmp/opencode/p2f10/`, not committed; the Green role repeats each command)

- M-F10-1 (the call path). `renderQuestCover` (line 3012 of `dashboard/lib/storytime/print/cover-quest.ts`) sends `student-front` and `teacher-front` to `frontBody` (line 2618). The build `make-storytime-quest-covers.ts` calls `renderQuestCover` for 32 pages. With `--top hlogo` it makes the shipped fronts: the student book cover v4 and the teacher book cover v2. The file names come from lines 471 to 475 of the build script (student 3 + version, teacher 1 + version). Command: `grep -n "function renderQuestCover\|function frontBody\|function titlePlaqueFront\|function seriesBanner\|function plaqueSvg" dashboard/lib/storytime/print/cover-quest.ts`.
- M-F10-2 (where r5 lost the title). With `hlogo`, `frontBody` pushes the art layer and `titlePlaqueFront` and nothing else. Before commit `23f746a4` (F2, "no logo on the fronts"), the same branch pushed `logoTile`, the horizontal logo picture. That picture was the only carrier of the series name on the front. Commit `23f746a4` removed it and put no text in its place. Commands: `git show 23f746a4 -- dashboard/lib/storytime/print/cover-quest.ts | grep -n "logoTile"` and `git show 23f746a4~1:dashboard/lib/storytime/print/cover-quest.ts | grep -n "function frontBody" -A22`.
- M-F10-3 (why no gate caught it). `pageText` of the build script removes tags but keeps the text of `<title>Storytime Advantage</title>` in the head. So `checkQuestCopy` finds the series name on a front that shows no title. Check 4 of `print-gate.txt` (decision D-1 there) pins 0 whole words "Storytime" and "Advantage" on the r5 front. Measured on the r5 Chrome PDFs: page 1 of `student/cover-alt-hlogo-r5.pdf` and of `teacher/teacher-cover-alt-hlogo-r5.pdf` gives 0 Thai characters and no joined "Storytime Advantage". The new test must read the body of the page, never the head. Command: `python3 -I -B /tmp/opencode/p2f10/thai_count.py` (capture `thai-count-out.txt`: counts only, no page text).
- M-F10-4 (the level plate). `titlePlaqueFront` (line 1638) with `hlogo` draws the part `title-plaque` at 278 to 292 mm from the top (box 26, 278, 158, 14). The row reads "Level 2 · Unit 1 · Student Book" or "… · Teacher Book" in League Spartan 700 with the logo brown `#92400E` on the logo amber `#FCD34D`. The pinned painted box is `[22.98, 278.00, 187.02, 292.00]` for the student front and `[22.94, 278.00, 187.05, 292.00]` for the teacher front (`DEFAULT_BOXES` of `quest-cover-f3f6.test.ts`).
- M-F10-5 (the first `front.png`). It is `~/Desktop/print-ready/storytime/covers-quest-v1/student/front.png` (2480 x 3508 px, built 2026-11-10 14:25). The teacher twin is `teacher/teacher-front.png`. Both come from the default style, with the part `series-banner` made by `seriesBanner(kind, 'front', …)` (line 1571). The plate is the box `student-front:series-banner`: 22 mm from the left, 48 mm from the top, 166 mm wide, 38 mm high (centred, because (210 - 166) / 2 = 22). It is a bevelled plaque of `plaqueSvg` with the amber palette, with the fill `#FCD34D`, the outer line in `#92400E`, a cream ring, and a diamond at each end. It holds 2 lines in League Spartan 700 in the logo brown: "Storytime" at 17.5 mm and "Advantage" at 10.5 mm, centred. The STA logo mark stood above it (`series-logo`, 30 x 30 mm). Command: `grep -n "student-front:series-banner\|student-front:series-logo" dashboard/lib/storytime/print/cover-quest.ts`.
- M-F10-6 (the plate measure on the first front). Script `/tmp/opencode/p2f10/plate_measure.py` (read-only, `python3 -I -B`, capture `plate-out.txt`) reads the brown pixels inside the plate band. The ink block of both lines is 26.42 mm high (53.85 to 80.27 mm). The band is 38 - 5.6 = 32.4 mm. So the ink height is 81.5 % of the band and 69.5 % of the plate height. The ink is 73.92 mm wide, which is 44.5 % of the plate width. The ink centre is 104.7 mm across (page centre 105 mm). So the PM rule "text fill about 80 %" holds on the first front only as a height share of the band (the rule of standing order S3). A width share of 80 % does not hold on a 2-line plate.
- M-F10-7 (the free area). Script `/tmp/opencode/p2f10/free_band.py` (capture `free-band-out.txt`) reads `content/storytime/l2/print/pictures-heads.json`. The 2 front arts are 2480 x 3508 px and fill the 210 x 297 mm page with no crop (11.8095 px per mm). The student front holds 4 boxes: the highest top is the `Sam head` at 103.31 mm. The teacher front holds 3 boxes: the highest top is the `Teacher Kim head` at 97.38 mm. No box lies above those tops, so the band from the 5 mm safe zone to 102.31 mm (student) and 96.38 mm (teacher), with the 1 mm clearance, is free over the full width. The first-front plate (48 to 86 mm) clears the highest head by 17.3 mm (student) and 11.4 mm (teacher). The art above about 95 mm is tree canopy and trunk with no face, no head, and no dog. I looked at the r5 front PNGs at reduced size on 2026-11-13: the top area is calm on both.
- M-F10-8 (the logo colours). `LOGO_AMBER` `#FCD34D` and `LOGO_BROWN` `#92400E` (lines 67 and 70), the cream and the white of `PLAQUE_AMBER_PALETTE` (line 1293). The token table of the standing rules (S2) is `#fcd34d`, `#92400e`, `#fef3c7`, `#fffbeb`, and `#ffffff`.
- M-F10-9 (the tests that pin the r5 front). `quest-cover-hlogo.test.ts` test A3 pins 0 `logo-tile`, 0 `series-logo`, 0 `crest`, and 0 `series-banner` on the 2 fronts (these pins stay). The same test pins that no text node of any of the 4 book pages holds "Storytime" or "Advantage", except inside a `contact-line` (this pin moves). `quest-cover-f1f2.test.ts` test G3 pins the exact part set of each front (`R3_PARTS` minus `logo-tile`) and pins that no part enters the r3 tile box `[21.4, 12, 167.2, 54]` (both pins move: the plate at 48 to 86 mm enters that box). `quest-cover-standing-rules.test.ts` S1 pins 0 `logo-tile` on the 4 front kinds (stays). `quest-cover-f3f6.test.ts` D2 reads every `[data-part]` of the 2 fronts against the key boxes with 1 mm clearance, so it covers a new top-level part with no change. `quest-cover-plaque-fit.test.ts` reads only the first `title-plaque` part. Command: `grep -n "series-banner\|seriesNameNodes\|R3_TILE_BOXES\|R3_PARTS" dashboard/__tests__/quest-cover-hlogo.test.ts dashboard/__tests__/quest-cover-f1f2.test.ts`.
- M-F10-10 (the reader fronts). `readerTitlePlaque` (line 1445, A3) and `leafTitlePlaque` (line 2834, leaf) write the reader title as escaped text inside the part `title-plaque`. Both pass the text of `questReaders()[i].title`. So the 28 reader covers hold their titles today, and the new reader test is a guard that passes at HEAD.
- M-F10-11 (Thai). The 2 book fronts hold no Thai: `cover-quest.ts` and `quest.json` hold 0 Thai characters, `checkQuestThai` requires 0 on a front, and the r5 Chrome PDFs hold 0 Thai characters on page 1 (M-F10-3). The Thai of the 2 backs is the 38 characters of `BACK_LINES.contact` (page 2 of both Chrome PDFs, measured). The F10 build renders both backs, because it builds the whole book. So the rule is: a front-only change needs no Thai filter. A role that reads a back page (HTML, PNG, PDF text, or a test log that prints one) must be a Claude model, or must read through a Thai drop that proves 0 Thai characters in its output (PM rule, 2026-11-09).
- M-F10-12 (the backs and the accepted set). The r5 back PNG of the student book is `student/back-alt-hlogo-r5.png` with SHA-256 `9f5b588fa6f6b968b55c1f7c33abdff03f90cf513cd823ea940a645a829b20b3`. The r5 back PNG of the teacher book is `teacher/teacher-back-alt-hlogo-r5.png` with SHA-256 `ad6c3335e4e92ae43eae1d86e50b2a8c4175bc7cbc9eecb23bc83aeb6e13b0a4`. Both are in `MANIFEST.txt` of `covers-quest-v1` (lines 79 and 119). `sha256sum MANIFEST.txt` gives `8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87`, and the file has 133 lines. The r5 front PNGs are `student/front-alt-hlogo-r5.png` (`6750339526f85e6fbcddb3de8ad93d9b43258b4b943cea4092528babb437d795`) and `teacher/teacher-front-alt-hlogo-r5.png` (`6a0d5227a074b9af9ca8822cc62afa3cdfe4d52d8819df43dfdb5fc5e2fe5f3b`). Command: `sha256sum ~/Desktop/print-ready/storytime/covers-quest-v1/MANIFEST.txt; grep -n "back-alt-hlogo-r5\|front-alt-hlogo-r5" ~/Desktop/print-ready/storytime/covers-quest-v1/MANIFEST.txt`.
- M-F10-13 (how earlier rounds built and gated the books). Round r5 (Task 2.9 part 10) staged 31 pictures in a scratch folder (29 hard links, the edge-filled back, and the prepared teacher front), then ran one heavy-run build with `--top hlogo --pictures-dir <scratch> --print-ready-root <scratch> --print`. It then copied the 10 book files with new names (`copy_2_9j.py`, suffix `-alt-hlogo-r5`), made the sheets (`contact-2-9j.py`), and wrote `print-gate.txt` with `gate-functions-2-9l.py`. The gates were: the gate inside the build ("All checks pass." for each of 4 print files), `PRINT_GATE` (`make-pdfx.ts <file> --check`), `PRINT_TEXT_CHECK`, `pdffonts`, `pdfimages -list`, the Thai byte check on the Chrome PDFs, and the manifest check. Command: `ls measure/runs/storytime_cover_options_20261106 | grep "copy_2_9j\|contact-2-9j\|gate-functions-2-9l\|link_pictures_2_9c\|fix-back-edge\|prep-teacher"`.

#### Decisions (Fix round F10)

- D-F10-1 (scope). The round changes the 2 book fronts of the shipped style (`top: 'hlogo'`, bleed 0) and nothing else. The 2 backs, the 28 reader covers, the default style (`top: 'banner'`), the art files, `quest.json`, and every shared file of guard G-1 stay byte-equal. The title is text. It is not the STA logo mark.
- D-F10-2 (the title plate). Each book front gets one new top-level part, `data-part="front-title"`. It is a plate in the logo colours with the geometry of the first front (M-F10-5): the box `<kind>:series-banner` of `QUEST_BOXES` (22, 48, 166, 38 mm), the plaque from `plaqueSvg` with `LOGO_AMBER` and `PLAQUE_AMBER_PALETTE`, and 2 centred lines in League Spartan 700 in `LOGO_BROWN`: "Storytime" at 17.5 mm and "Advantage" at 10.5 mm. The 2 lines are 2 block elements with no `data-part` of their own, so the text of the part, with white space joined, reads "Storytime Advantage". The plate takes its numbers from the box table, so the box table gets no new key. The new code is a new function in `cover-quest.ts` (default name `frontTitlePlate`). `seriesBanner` and the default render stay unchanged.
- D-F10-3 (the text fill rule). The ink block of the 2 lines fills 75 % to 85 % of the plate band (the plate height minus `READER_PLAQUE_BAND_INSET_MM` of 5.6 mm, so 32.4 mm). Reason: this is the standing rule S3, and the first front gives 81.5 % (M-F10-6). The ink block is the ink top of line 1 to the ink bottom of line 2. The ink block stands at the plate centre, and the plate stands at the page centre, each within 1 mm (standing rule S4).
- D-F10-4 (the place). The plate stands at the first-front place (48 to 86 mm from the top, the full 166 mm width, centred). It meets no key box of the front art with 1 mm clearance, and it stays 5 mm inside the trim (M-F10-7). No placement rule and no art shift apply, because the highest key box is at 97.38 mm. A `front-title` box that meets a key box fails the test. The plate may stand in the r3 tile box (M-F10-9), because the tile is gone.
- D-F10-5 (the plate ends). The plate has the same ends as the first front and as the level plate of r5: the diamond ends of `plaqueSvg`. The F9 plain-end decision (D-F9-5) does not apply, because the F9 round is cancelled and the PM order of F10 says "as on the first front.png". The open point Q14 records this.
- D-F10-6 (the level plate stays). The part `title-plaque` of each front stays at the bottom with the same HTML bytes of its part, the same text, and the same box (M-F10-4). Its text reads "Level 2 · Unit 1 · Student Book" or "Level 2 · Unit 1 · Teacher Book".
- D-F10-7 (no logo mark, no game UI on a front). A front holds no `logo-tile`, no `series-logo`, no `crest`, no `logo-box`, no `series-banner`, no `band-pill`, and no `img` other than the art. The standing rule 5 holds: 0 band words, 0 band icons, 0 XP bars, and 0 game bars. The front holds exactly 1 `front-title` part and exactly 1 `title-plaque` part.
- D-F10-8 (the backs and the readers). The 2 backs keep the r5 layout. Two proofs apply. First, the Red role pins the SHA-256 of each back HTML at its role base, and it never prints the HTML. Second, the Green build gives back PNGs with the SHA-256 of M-F10-12 (the r6 back PNG equals the r5 back PNG). The 14 A3 and the 14 leaf reader fronts keep their titles in the part `title-plaque`. The new test checks the titles and changes no reader code.
- D-F10-9 (the test, Red). The new file is `dashboard/__tests__/quest-cover-f10.test.ts`. It is outside the shared globs, as D-A12 says. The Red role writes these tests, each with a positive control on a changed copy of the HTML (the control must fail the same check):
  - T1: each of the 2 shipped fronts holds exactly 1 part `front-title`, and its text with white space joined equals "Storytime Advantage". The text sits in the body, outside `style`, `script`, and `title`, and no `img` holds it. A front with the part cut out fails T1 (control).
  - T2: each of the 28 reader fronts (14 A3 and 14 leaf, rows of `questReaders()`) holds its own title in its part `title-plaque`, with white space joined. A control with another title fails.
  - T3: the plate colours: the band path and `data-plaque-colour` are `#FCD34D`, the text colour is `#92400E`, and every colour of the part is in the token table of M-F10-8.
  - T4: in Chrome (the method of `quest-cover-plaque-fit.test.ts`, League Spartan loaded): the plate is centred on the page within 1 mm, the ink block is 75 % to 85 % of the band, the ink block is centred in the plate within 1 mm, the 2 lines stay inside the band, and the plate and the level plate are 1 mm apart or more.
  - T5: the painted box of `front-title`, grown by 1 mm, meets no key box of the front art (boxes of `pictures-heads.json`, 11.8095 px per mm), and it lies 5 mm inside the trim. A control box laid on the `Teacher Kim head` or the `Sam head` fails.
  - T6: the level plate stays: the text, the box of M-F10-4, and the SHA-256 of the part HTML pinned at the Red role base.
  - T7: the 2 backs keep r5: the SHA-256 of each back HTML (pinned at the Red role base, never printed), exactly 1 `logo-tile` with the horizontal logo by file hash, and 0 `front-title`. A control that changes one byte fails.
  - T8: the default style (`top: 'banner'`) holds 0 `front-title` on both fronts.
  - T9: each front holds none of the parts `logo-tile`, `series-logo`, `crest`, `logo-box`, `series-banner`, `band-pill`, `band-word`, `band-icon`, `game-bar`, and `unit-bar`, and its only `img` is the art.
  - The family rule of D-F9-9 applies: the Red family differs from the Green family. The Red role pins digests only. It prints no back text and reads no week file.
- D-F10-10 (moved pins). The Red role changes only these pins, each hunk with the comment "changed 2026-11-13 (F10)":
  - `quest-cover-hlogo.test.ts` test A3: on the 2 fronts, every text node that holds "Storytime" or "Advantage" sits inside the part `front-title`, and the 2 nodes are "Storytime" and "Advantage". On the 2 backs the count stays 0 outside `contact-line`.
  - `quest-cover-f1f2.test.ts` test G3: the part set of each front adds `front-title`, and the r3 tile box rule skips the part `front-title`. Every other part still stays out of the tile box.
  - Every other pin stays. The Red role runs the whole `quest-cover-*` set once, after the new file. It lists each failing test. A failing test outside the named pins stops the Red role, and it asks the orchestrator. The standing rules S1 to S5, D2 of `quest-cover-f3f6.test.ts`, and the plaque fit tests must pass on the new pages.
- D-F10-10b (orchestrator decision, 2026-11-13 15:18): D8 of `quest-cover-f3f6.test.ts` moves too: the 2 hlogo fronts leave its byte pin; the 32 default renders stay pinned.
- D-F10-11 (the build and the output, Green). The Green role changes `cover-quest.ts` only: the new function and one call in `frontBody` for the top style `hlogo`. The build script stays unchanged, unless a gate shows that one named line needs a change. Then the role stops and asks the orchestrator. One heavy-run build (`--level 2 --unit 1 --version 1 --top hlogo --print`, with the 31 staged pictures of M-F10-13) writes the build in a scratch folder under `/tmp/opencode/p2f10/`. The role copies only the 2 book sets. The output folder is new: `~/Desktop/print-ready/storytime/covers-quest-v1-books-r6/`. The accepted folder `covers-quest-v1` is not touched, so its `MANIFEST.txt` still hashes to `8f1901a3…`. The layout of the new folder:
  - `student/`: `front-alt-hlogo-r6.png`, `back-alt-hlogo-r6.png`, `cover-alt-hlogo-r6.pdf`, `Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r6_PDFX-1a.pdf` (2 pages), `build-report-alt-hlogo-r6.json`;
  - `teacher/`: `teacher-front-alt-hlogo-r6.png`, `teacher-back-alt-hlogo-r6.png`, `teacher-cover-alt-hlogo-r6.pdf`, `Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r6_PDFX-1a.pdf` (2 pages), `build-report-alt-hlogo-r6.json`;
  - `contact-sheets/books-r6.png`: one sheet in 2 rows. Row 1 is the student front and back. Row 2 is the teacher front and back. Each tile is the whole page at the page aspect 210 : 297, with no crop, and the file name under it (lesson of F9: a PM crop cut a tile). The sheet script proves each tile equals its page PNG, resized, within 3 grey levels of mean difference per channel;
  - the folder root: `MANIFEST.txt`, written last, with one line for each file in the form SHA-256, size in bytes, relative path (the form of `covers-quest-v1`). The check is `awk '{print $1"  "$3}' MANIFEST.txt | sha256sum -c -`.
  The copies are byte copies. The script refuses a target that exists and a folder that holds another file. The files are the 2 PDF/X-1a print files (2 pages each, so 4 print pages: student front, student back, teacher front, teacher back), the 2 Chrome PDFs, the 4 PNG files, the 2 build reports, and the sheet.
- D-F10-12 (the print gates, Green). The gates are those of M-F10-13, with one changed rule. Check 4 (the text count) of the r5 `print-gate.txt` pinned 0 words "Storytime" and "Advantage" on the front page. For r6, page 1 of each print file holds the text "Storytime Advantage" at least once (white space joined), the level line, and the book line. Page 2 (the back) holds 0 whole words "Storytime" and "Advantage", because the back keeps the logo picture. The other gates stay: `PRINT_GATE` exits 0 on each of the 2 PDF/X files, every font is embedded with no Type 3 font, the art is 299 ppi or more, page 1 of each Chrome PDF holds 0 Thai characters, page 2 holds the 38 characters of `BACK_LINES.contact`, the QR check passes, the build reports hold 0 fail rows, and the r6 back PNGs equal the r5 back PNGs (M-F10-12).
- D-F10-13 (no paid call). No `mmx` call runs, and no art changes. The spend total stays at the spend log of Task 2.8.
- D-F10-14 (lane, order, and dates). The order is Red, then Green, then the PM line. The PM look is the review. The clip packages of the week-package track stay first (PM order). Only one Workbooks role runs at a time. Red ends first, then Green, with the build, the gates, the sheet, and the manifest. The PM line goes by 2026-11-14 10:00 ICT. The release proof keeps r2 until Daniel passes r6. The Green role is a Claude model, because it builds and opens the 2 backs (M-F10-11). The Green role runs each heavy job with `HEAVY_PRIORITY=p2 … heavy-run.sh -c` and the shell timeout 1800000 ms.
- D-F10-15 (guard G-1). The Red allowed paths are `dashboard/__tests__/quest-cover-f10.test.ts`, the moved pins in `dashboard/__tests__/quest-cover-hlogo.test.ts` and `dashboard/__tests__/quest-cover-f1f2.test.ts`, `measure/runs/storytime_cover_options_20261106/`, and `measure/tracks/storytime_cover_options_20261106/`. The Green allowed paths are `dashboard/lib/storytime/print/cover-quest.ts`, `measure/runs/storytime_cover_options_20261106/`, `measure/tracks/storytime_cover_options_20261106/`, and the new output folder of D-F10-11 (create only). Green changes no test file. `readers.ts`, `make-storytime-quest-covers.ts`, `quest.json`, the art, and every other file of D-A3 stay unchanged.

#### Moved pins

The Red role changes the pins of D-F10-10 and of D-F10-10b, and no other pin. Each hunk has the comment "changed 2026-11-13 (F10)". The comment rule is the rule of F9.

#### Acceptance (Fix round F10)

- AC-16: `dashboard/__tests__/quest-cover-f10.test.ts` passes. Every other `quest-cover-*` test passes (Gate A). `PROJECT_TESTS` passes (Gate B: `storytime-*`, `covers-*`, and `print-pdfx`). ESLint and `tsc --noEmit` exit 0.
- AC-17: The folder `covers-quest-v1-books-r6/` holds the files of D-F10-11 with a `MANIFEST.txt` that passes the check. The 2 PDF/X files pass `PRINT_GATE` and the text rules of D-F10-12. The contact sheet shows 4 whole tiles.
- AC-18: `MANIFEST.txt` of `covers-quest-v1` still hashes to `8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87`, and its 133 lines still match (the check of Task 2.11, run before and after the build).
- AC-19 (owner-approved): Daniel passes the r6 book covers, or asks for a change. The task stays open until his word (Task 2.14b).

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
| Q8 | F9 item 1: the PM wrote "teacher's face" on paint. The measured cut faces are child 1 and child 6 (M3). A crop shift cannot fix them (M2), so D-F9-1 uses a zoom of 1.27 (effective A3 ppi 190.5). | Open. The zoom of D-F9-1 stands until the orchestrator or the PM answers. |
| Q9 | F9 item 1: the `Nan head` box of `l2-w01-cover-nan-can-nod-v1.png` becomes a face box, so that the hair top may leave the trim (M5). The 3 edge-head arts of D-F9-1 (b) get no fix. | Open. D-F9-1 stands. |
| Q10 | F9 item 3: one leaf plaque height forces a height below 20 mm for all 14 leaf plaques (M9, estimate 13 mm). The PM may prefer two sizes or a bigger plaque over the dog. | Open. D-F9-3 stands. A3 keeps the size ladder. |
| Q11 | F9 item 5: the plain ends apply to the shipped style only. The default style keeps its crystal ends and its bytes. | Open. D-F9-5 stands. |
| Q12 | F9 item 9: the old pages move to `covers-quest-v1-superseded-20261113/` (D-F9-8). | Open. D-F9-8 stands. |
| Q13 | F10: the PM wrote "text fill about 80 % of the plate". On the 2-line first-front plate the ink fills 81.5 % of the band height and 44.5 % of the plate width (M-F10-6). A single-line title at 80 % of the plate width would need a thin plate about 200 mm wide and 17 mm high. | Closed 2026-11-13 (PM answer, about 15:10, PM relay, verbatim): "title plate: your default, the 2-line plate of the first front". D-F10-3 stands: the ink block is 75 % to 85 % of the band height (rule S3), on the 2-line plate. |
| Q14 | F10: the PM word "a real frame or none; no game UI" and the diamond ends of the plate (the F9 PM look called them arrow buttons). The PM order also says "as on the first front.png", which has the diamond ends. | Closed 2026-11-13 (PM answer, about 15:10, PM relay, verbatim): "Diamond ends: keep them; Daniel passed the reader covers with them ('They all look fine'), my arrow-button note is withdrawn". D-F10-5 stands: the same ends as the first front and the level plate. |
| Q15 | F10: the place of the title plate. | Open. D-F10-4 stands: the first-front place (48 to 86 mm), which clears the highest head by 11.4 mm or more. |
| Q16 | F10: "4 print files". The build writes 2 PDF/X-1a files of 2 pages each (student, teacher). The 4 print pages are student front, student back, teacher front, and teacher back. | Open. D-F10-11 stands: 2 PDF/X-1a files with 4 print pages. The PM line names the files and the pages. |
| Q17 | F10: the output folder. | Open. D-F10-11 stands: the new folder `covers-quest-v1-books-r6/` with its own `MANIFEST.txt`. The accepted `MANIFEST.txt` `8f1901a3` stays byte-equal. |
| Q18 | F10: "each reader front holds its book title" covers the 14 A3 and the 14 leaf covers. | Open. D-F10-9 T2 tests all 28 covers. |
| Q19 | F10: the Green role family. The build renders both backs, and they hold Thai. | Open. D-F10-14 stands: Green is a Claude model. Red may be another family if it pins digests only and prints no back text. |
| Q20 | F10: check 4 of the print gate changes for the 2 book fronts: the front page holds the title text, where r5 pinned 0 (D-1 of `print-gate.txt`). | Open. D-F10-12 stands. The backs keep the logo picture and 0 series words. |
