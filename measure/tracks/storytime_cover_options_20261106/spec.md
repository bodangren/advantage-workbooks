# Spec: Storytime cover options in the RPG-theme style

Track: `storytime_cover_options_20261106`. Type: chore (classic FR list). Created: 2026-11-06. Owner: Daniel Bo. Status: Phase 1 (option round) in progress; Phase 2 not started.

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

## Phase 2 (later, not started)

The series cover template of the picked option: a code change in `dashboard/lib/storytime/print/` that runs through the Measure roles of the orchestrator. It needs a new spec section after Daniel's pick.

## Out of scope

- Any change to the approved print files, the cover code, the week files, or the book pages.
- The covers of other units and levels.
- Muse renders, Forge work, and any message to the printer.

## Open points (default in force until Daniel answers)

| # | Point | Default |
|---|---|---|
| Q1 | The cast look on the covers: the stylized cast differs from the 3D cast of the book pages. Rule 1 of assignment A-18 (a) said "The Storytime look only, with the Forge 3D cast". Daniel's order of 2026-11-06 asks for a more stylized look. | The owner order of 2026-11-06 is newer, so the options draw the same characters (names, hair, clothes, colors) in a stylized look. The Primary Chibi Quest cast never appears. |
| Q2 | Full-bleed art with no bleed: art to the trim edge can show a thin white line after the cut. | Keep no bleed, as the present files and Daniel's decision of 2026-11-05. Ask the printer about 3 mm bleed in Phase 2. |
| Q3 | Reader covers: new stylized art for all 14 readers, or the frame around the approved reader picture. | The mockups show new art for one reader. The Phase 2 default is the frame around the approved reader picture (no new art), unless Daniel asks for new art. |
