# Test Strategy: storytime_cover_options_20261106 (Phase 2, option A covers)

Written 2026-11-07 by the strategy role at role_base_sha `14b39927636964e704cff3a4a2b2af8693d5bd0f`. Task 2.3. The strategy covers Phase 2 only. Phase 1 (the option round) is closed and has no code.

## 1. Sources and measured facts

Inputs: `spec.md` (Phase 1 reading, FR-6 to FR-11, D-A1 to D-A13, AC-6 to AC-12, Q1 to Q7), `plan.md` (gate block, Tasks 2.1 to 2.14), `spec-review.md` (F1 to F6, all answered), `measure/anti-patterns.md`, the shared cover code, and the `options/` scripts.

Code and data facts, measured on 2026-11-07 at 14b39927:

- F1. No `dashboard/__tests__/quest-cover-*.test.ts` file exists. The track has no earlier `test-strategy.md`. `dashboard/vitest.config.ts` sets `environment: 'jsdom'` and no `include`, so `DOMParser` is available to tests and the default include finds the new files.
- F2. `measure/anti-patterns.md` holds entries A1 to A10 (A1 and A8 retired). It has no A11 entry, although the dispatch names A1 to A11. Section 4.17 proposes three project entries as promotion candidates.
- F3. Shared exports that `cover-quest.ts` can import without a change (D-A2): from `covers.ts` `STORYTIME_SERIES`, `STORYTIME_LINE_ADDRESS`, `STORYTIME_LEVEL_COLOURS`, `checkStorytimeCoverCopy`, `checkStorytimeCoverThai`, `storytimeCoverQrSvg`, `storytimeCoverQrGrid`, `checkStorytimeCoverQr`, `storytimeCoverFontCss`, `storytimeCoverMmToPx`, `storytimeCoverPanelValues`, `STORYTIME_COVER_LOGO_FILE`, `loadStorytimeCoverBooks`; from `teacher-book-cover.ts` `TEACHER_BOOK_COVER_BANDS`, `checkStorytimeReaderCoverCopy`; from `cover-picture.ts` `STORYTIME_COVER_PPI`; from `back-text.ts` `BACK_LINES.contact`, `richHtml`.
- F4. `checkStorytimeCoverQr(printed, expected)` returns a number (the count of different modules), not a list. A test must assert `0` and also assert `modules > 0` (A4). `FORBIDDEN_TOKENS` in `covers.ts` is not exported. It already holds every word of FR-4.3 (cefr, starters, primary advantage, gse, yle, reading a-z, raz, chibi, mitr, pre-a1, pre a1, a1 to c2). The year rule is a separate regex.
- F5. `checkStorytimeCoverOutDir` knows only the folders `proof` and `proof-v<n>`. It cannot protect `covers-quest-v1` or `print-v3`. The build needs its own out-folder check (Review B target).
- F6. `StorytimeMetaSchema` band values are capitalized: `Seed`, `Sprout`, `Leaf`, `Bud`, `Flower`. FR-7.2 and the spec say lower case (`sprout`). The data check must map one to the other, and a cross-check must compare `litBand` with `meta.band` of the 7 shipped weeks.
- F7. `roleOf` in `readers.ts` is not exported (G-1 forbids a change). The cover roles of the 14 readers are two labels: "Listen and read." for 8 readers (7 read-alongs and "Nan Can Nod", a sound book that is decodable) and "Sound it out." for 6 decodables. A third label "Say the first sound." exists in the code for a sound book that is not decodable. No shipped reader uses it. FR-4.1 names only "Listen and read." The role logic in `cover-quest.ts` is a copy and can drift. A parity test against `compileStorytimeReaders` guards it (T16).
- F8. The reader cover parts do not sit in the week file `print` block. The cover rows are in `content/storytime/l2/print/pictures.json` (227 rows, 14 with `use: "cover"`, weeks 1 to 7, two per week). A row holds `week`, `text` (the title), `fileName`, `lineArtFileName`, `width: 4000`, and `height: 3000`. The book title and `kind` come from `books[]` of the week file. FR-7.4 says "from the week file"; the title, week, and kind do, the picture row does not.
- F9. Panel check: `storytimeCoverPanelValues` with the 8 approved Level 2 weeks gives the five fields of Unit 1. All 5 equal the text in `options/approved-text.json` (5 of 5 SAME; approved weeks 8 of 8).
- F10. The three approved files keep the SHA-256 values of FR-11.7: `cover.pdf` begins `2964d9b678afc7a0`, the student PDF/X v3 begins `e0e0365a4ece8a5b`, the teacher PDF/X v1 begins `3b992af216dc2238`.
- F11. `make-pdfx.ts --keep-fonts` converted five option A mockup PDFs of the hand-off folder (student front, student back, teacher front, reader A3, leaf). All five printed "All checks pass" (PDF 1.3, PDF/X-1a:2001, fonts embedded, no Type 3, no RGB image, no soft mask). The mockup CSS has no `rgba`, `opacity`, `box-shadow`, `filter`, or gradient (grep of `build.py`). The teacher back is not a mockup, so no gate measure exists for it.
- F12. `checkPdfx` excuses a page that already is one page-size image in the source (`sourcePageImages`). Every cover page has a full-page art image. A rasterized page would therefore pass `PRINT_GATE`. The gate alone cannot catch lost text. Section 4.10 adds an explicit text and font check.
- F13. `pdftotext` of the PDF/X file drops Thai tone marks (measured: "ติดต่อเรา" count 0 in the PDF/X text of the student back). The Thai byte check must read the Chrome PDF or the HTML, never the PDF/X file. The English texts survive in both.
- F14. The leaf mockup converted without `--k-only` has ink coverage C=M=Y=0.176 (gray black as rich black). With `--k-only` it has C=M=Y=0.000 and K=0.180 (`gs -sDEVICE=inkcov`). FR-6.7 says the leaf has only black, white, and grey, and FR-11.1 names only `--keep-fonts`. Pin P7 adds `--k-only` for the leaf.
- F15. The option round art is 1448 x 2048 px (portrait) and 2048 x 1448 px (landscape). In the PDF/X it is embedded at 175 ppi (`pdfimages -list`). The final A4 art must show about 300 ppi there.
- F16. The reader art is 4000 x 3000 px. Across 420 mm it is 241.9 ppi. Across 198 mm (leaf) it is 513 ppi. The `lessons-learned.md` entry of 2026-10-02 says Chrome writes variable or synthesized faces as Type 3 and that `rgba`, `opacity`, shadows, gradients, emoji, and dashed rounded boxes with a background rasterize a page.
- F17. `gen_art.py` (Phase 1) already refuses a 4th attempt, a duplicate attempt, a prompt over 1500 characters, and a total over its limit. It uses a float sum and a fixed limit of 1.00 USD with no carry-over. Phase 2 needs the limit 0.9335 USD, so Task 2.8 needs a changed copy.
- F18. Tools on this host: `gs`, `pdfinfo`, `pdftotext`, `pdfimages`, `pdftoppm`, `mmx`. `tesseract` is not installed, so the letters check on the art is by eye only.
- F19. Baseline of `PROJECT_LINT` parts: `npx eslint lib/storytime scripts/storytime` exits 0 in 24 s. The test glob part cannot run before the first test file exists.
- F20. Open windows on 2026-11-07: the week-package Red 2 (`[~]`, plan line 240) has the untracked file `dashboard/__tests__/storytime-package-family.test.ts`. It matches the shared glob `__tests__/storytime-*.test.ts`. The print track Red "test reliability" (`[~]`, plan line 1287) is open. A `PROJECT_TESTS` run of this track now finds 61 files, and the week-package file can be red. The latest full run is `measure/runs/storytime_week_package_20261022/p10-green1-project.txt` at ad767a78: 60 files, 1269 tests, exit 0, duration 1145 s with `--maxWorkers=1`. The print track "test reliability" task exists because 7 print tests failed on timeouts under load; this track sets its timeouts at the start (R9).
- F21. The git status shows `video/storytime-song/scripts/render.mjs` modified and many untracked run files of other tracks. This track never stages them.

## 2. Risk classification and review gates

| Task | Work | Risk | Reason |
|---|---|---|---|
| 2.4 / 2.5 | Template module and `quest.json` | medium | New pure module, no shared change (G-1). A fault prints wrong text on a cover that Daniel sees first. |
| 2.6 / 2.7 | Build script | medium; high for the out folder | It writes files from argv and spawns Chrome and Ghostscript. A wrong `--out` can overwrite an approved print file. |
| 2.8 | Final art | high | Paid calls with a cap (0.9335 USD), an external service, a made-up-letters risk, and the Pip and cast rules. |
| 2.9 / 2.10 / 2.11 | Print build, look, MANIFEST, 11-16 copy | high | These files can go to the printer after Daniel approves. A wrong or stale file prints 32 cover pages. |
| 2.12 / 2.13 / 2.14 | PM line, print hand-off, Daniel | low | Messages and an owner word. |
| Phase 2 as a whole | | high | |

Review gates (a review role reports and does not fix code; a fix is a new Red and Green pair):

| Gate | Applies | When | Scope |
|---|---|---|---|
| Review A (code and spec) | yes | after Green 2, before Task 2.9 | `cover-quest.ts`, `quest.json`, the build script, both test files, guard G-1, and the pins of section 4.3. |
| Review B (security) | yes, limited | after Green 2, before Task 2.9 | The `--out` folder policy and the argv bounds only (symlink, traversal, overwrite, option injection, process spawn with an argv array). Also the paid-call guard of Task 2.8. No network, secret, or authentication surface exists in the code. |
| Review C (data contract) | yes | after Green 1, before Red 2 | The shape and limits of `quest.json`, the cast limits, the lit band mapping, the art file names, and the picture rows of the 14 readers. |
| Adversarial testing | yes | after Green 2, before Task 2.9 | Targets in section 4.15. |
| UX / API review | not applicable | | `UX_REQUIRED=never`. The only interface is a CLI; Review B and test B13 cover its usage text and argv. |
| Browser review | not applicable | | The code serves no page. Chrome only prints. The 32-page look (Task 2.10) is the visual review. |

Why before Task 2.9: a finding that changes the output then costs one rebuild, not a changed approved file.

## 3. Evidence classes

- automated: a command log with an exit code and a count, saved under `measure/runs/storytime_cover_options_20261106/`.
- person-checked: the orchestrator's look (Task 2.10) and the paid-art look (Task 2.8). Each result is a labeled line (section 4.11).
- owner-approved: Daniel's word (Task 2.14). No agent role closes it.
- peer-report: a review file or the PM and print session replies.
- A self-report closes no task. A plan claim of "all checks pass" must cite a log path with exit 0 (A5).

## 4. Phase 2 in full

### 4.1 Task order, owners, dates

| Order | Task | Owner | Dates (ICT) |
|---|---|---|---|
| 1 | 2.3 Strategy (this file) and the plan updates of section 5 | strategy role, orchestrator | 11-07 |
| 2 | Pins of section 4.3 recorded | orchestrator | 11-07 |
| 3 | 2.4 Red 1 (`quest-cover-template.test.ts`) | mid-red role | 11-07 to 11-08 |
| 3b | 2.8a guard proof, then 2.8 final art (parallel, no Red window) | orchestrator (paid calls run by the orchestrator only) | 11-07 to 11-09 |
| 4 | 2.5 Green 1 (`cover-quest.ts`, `quest.json`) | jr-green role | 11-08 |
| 5 | Review C | review role | 11-08 to 11-09 |
| 6 | 2.6 Red 2 (`quest-cover-build.test.ts`) | mid-red role | 11-09 |
| 7 | 2.7 Green 2 (`make-storytime-quest-covers.ts`) | jr-green role | 11-09 to 11-10 |
| 8 | Review A, Review B, adversarial | review roles | 11-10 to 11-11 |
| 9 | Fallback checkpoint 11-10 18:00; trigger 11-12 18:00 | orchestrator | see 4.13 |
| 10 | 2.9 Print build, 2.10 Look, 2.11 MANIFEST and copy | orchestrator | 11-12 to 11-13 |
| 11 | 2.12 PM line (due 11-14), 2.13 print hand-off, closeout gate | orchestrator | 11-13 to 11-14 |
| 12 | 2.14 Daniel's approval | Daniel | 11-16 or later |

Heavy time: three full `PROJECT_TESTS` runs (Green 1, Green 2, closeout) take about 19 min each plus lock waits. Start each run early and in the background. Never nest heavy-run.

### 4.2 phase_base_sha capture point

Capture `phase_base_sha=$(git rev-parse HEAD)` once, after both of these are done: (1) the commit of this file, and (2) the orchestrator commit that applies the plan updates of section 5 (a `measure(plan)` commit). Capture before any `[~]` mark for Task 2.4 and before any file under `dashboard/` changes. The value must postdate the strategy commit. Do not write a SHA into this file. Record `red_base_1=phase_base_sha`. Record `red_base_2=$(git rev-parse HEAD)` after the Green 1 commit and before the Red 2 file exists.

### 4.3 Decisions to pin before Red (defaults in force; the orchestrator records them in a pin note)

| Pin | Decision | Default |
|---|---|---|
| P1 | Export names (tests and Green use these; Red may rename only with an orchestrator note) | Types and constants: `QuestCoverKind` (`'student-front' \| 'student-back' \| 'teacher-front' \| 'teacher-back' \| 'reader-a3' \| 'reader-leaf'`), `QUEST_BANDS`, `QUEST_BOXES`, `QUEST_ROLE_LABELS`. Functions: `loadQuestCovers`, `checkQuestCoverData`, `questPageSize`, `renderQuestCover`, `questReaderCoverPage`, `questReaders`, `checkQuestCopy`, `checkQuestThai`, `checkQuestQr`, `checkQuestArt`, `checkQuestLitBand`, `checkQuestPageSize`, `questCssSafetyErrors`. |
| P2 | `renderQuestCover(kind, subject, assets, opts)` returns one full HTML document. `subject` is a book row or a reader row. `opts.bleedMm` is 0 or 3. `questReaderCoverPage(reader, trim, assets, opts)` returns `{ body, css }` with no `<html>`, no `@page`, and only selectors that start with `.quest-`. | as written |
| P3 | Data marks in the HTML: `data-part="<name>"` on every frame part; `data-band="<band>"` on each band icon with `data-lit="true"` or `"false"`; `data-unit-part` with `data-filled`; `data-plaque-colour`; `data-qr-input` on the QR box. | as written |
| P4 | The build script exports its pure functions (`parseQuestArgs`, `checkQuestOutDir`, `questLayout`, `questFileNames`, `questPdfxArgs`, `planQuestBuild`, `questBuildReport`, `parseQuestPdfInfo`, `questQrFromPng`). It runs `main` only when run directly (`import.meta.url` equals the entry file). An import changes no `process.exitCode`. | as written |
| P5 | Meaning of `--version <n>`: the set number. The folder is `covers-quest-v<n>`. The file versions are student `3+n`, teacher `1+n`, readers `n` (set 1 gives v4, v2, v1 of D-A9). | as written (Q-S1 in the handoff) |
| P6 | Option `--print-ready-root <dir>` (default `~/Desktop/print-ready`). The out folder must resolve (symlinks resolved) inside `<root>/storytime/covers-quest-v<n>`. Task 2.7 and the tests use a temporary root. | as written |
| P7 | `--k-only` is added to `make-pdfx.ts` for the leaf print file only. Other kinds use `--keep-fonts` only. | as written (Q-S2 in the handoff; amends FR-11.1) |
| P8 | Tests never require the gitignored art or the reader pictures. Fixtures are small `sharp` buffers in a temporary folder. The data check validates art file names, not existence. The build checks existence. | as written |
| P9 | Tests never read `measure/tracks/**` (A9). The approved texts are constants inside the test file; the panel values come from `storytimeCoverPanelValues`. | as written |
| P10 | Pixel rules: the ppi of art = `widthPx / ((trimMm + 2*bleedMm) / 25.4)`. Minimum 299 for the A4 fronts, the back, and the leaf art; 240 for the A3 reader art (reported, 241.9 measured). A bleed other than 0 or 3 is an error. | as written |
| P11 | The lit band in `quest.json` is lower case. The mapping to the schema band is `Capital(litBand)`. | as written |
| P12 | Timeouts: every test that spawns a process or uses `sharp` on a 4000 x 3000 buffer has an explicit timeout of 120000 ms. | as written |

### 4.4 Red 1: `dashboard/__tests__/quest-cover-template.test.ts` (Task 2.4)

Precondition: Tasks 2.3 and the plan updates are committed; `phase_base_sha` is captured.

`RED_TEST_COMMAND`: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/quest-cover-*.test.ts --maxWorkers=1 2>&1 | tee ../measure/runs/storytime_cover_options_20261106/red1.txt'`

Red proof (all of these):
1. Exit code 1 and the log line `Test Files  1 failed (1)`.
2. The log names `quest-cover-template.test.ts` and the missing module `cover-quest`. The log has no `No test files found`, no `SyntaxError`, and no `is not a function` from the test code (a failure by a typo is not a Red).
3. `ls dashboard/__tests__/quest-cover-*.test.ts` lists exactly one file. The commit changes only that file (`git show --name-only --format= <sha>`).
4. `PROJECT_LINT` passes after the file exists (`cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/quest-cover-*.test.ts`, exit 0).
5. The file imports only from `../lib/storytime/print/cover-quest` (the target), the shared modules of D-A2, `vitest`, `sharp`, `fs`, `path`, `os`. It does not read `measure/**` (P9).

Test list. Each row has a falsification condition (the input that must fail). Parameterized rows count one test per case.

| ID | Test | Falsification (case that must fail) | Anti-pattern |
|---|---|---|---|
| T01 | The module exports every name of P1. | Remove one export. | A4 |
| T02 | Parts by kind: for each of the 6 kinds, each required `data-part` mark occurs the exact number of times (DOMParser `querySelectorAll`, attribute match, not text). Student front: art, game-bar, 5 band icons, unit-bar (4 parts), crest, series-banner, title-plaque, level-line, book-line. Teacher front adds band-pill. Student back: art, logo-box, series-banner, panel with 5 panel-fields, contact-sign, 5 contact lines, qr, line-label. Teacher back: the same with no panel. A3 reader: art, game-bar with band-word, series-banner, week-pill, title-plaque, role-bar. Leaf: art, double-line frame, title-plaque, band-word, series, week, role mark. | Delete one mark; duplicate one mark; put a mark only in text. | A7 |
| T03 | The five panel fields are in the order story, sounds, decodable, sight, books, with the headings "Story", "Sounds", "Decodable words", "Sight words", "Books". The values equal `storytimeCoverPanelValues` of the 8 approved weeks. The teacher back has no `panel`. | Swap two fields; add a panel to the teacher back. | A5 |
| T04 | Lit band: for each of the 5 bands, an in-memory book with that band gives exactly 1 icon with `data-lit="true"` and it is that band. The 5 icons are in the order seed, sprout, leaf, bud, flower. Kinds with a game bar: student front, teacher front, A3 reader. | Light 2 bands; light a fixed band (`sprout`); swap two icons. A fixed `sprout` passes the shipped data, so the in-memory parameter is the guard. | A4 |
| T05 | Unit bar: for unit 1 to 4, `data-filled` is true for exactly `unit` of the 4 parts. | Fill all 4 always; fill `unit+1`. | A4 |
| T06 | Plaque colour: for levels 1 to 4, `data-plaque-colour` equals `STORYTIME_LEVEL_COLOURS[level]`. Level 2 is `#2A77B8`. | Hard-code `#2A77B8`. | A4 |
| T07 | Frame sameness: the front HTML of two books (L2U1 and an in-memory L3U2 with another band, unit, art, and colour) is equal after the per-book values (level line, art URL, lit flags, filled flags, plaque colour) are replaced by placeholders. | Add an element only for level 3. | A5 |
| T08 | Page size: `questPageSize` for the 6 kinds at bleed 0 gives 210x297, 210x297, 210x297, 210x297, 420x297, 198x148.5 mm; at bleed 3 each side grows by 6 mm. The document has an `@page size` that equals it. A bleed of 2 is an error. The art element covers trim plus bleed. | Swap A3 and A4; accept bleed 2. | A3 |
| T09 | Safe zone: every part of `QUEST_BOXES` that carries text or a face lies at least 5 mm inside the trim at bleed 0 and at bleed 3 (the boxes shift by the bleed). The art part is exempt. | Move the title plaque to 293 mm from the top. | A4 |
| T10 | Copy: for the 6 kinds, `checkQuestCopy` returns no error for the shipped data. Every approved text of the kind is present (labeled list per kind, constants in the test). The words of the page text are a subset of the approved words (exact set difference; the list of new words is printed). "SPROUT" is literal upper case on the A3 reader and the leaf; "Sprout" is literal on the teacher front. | Add one new word; drop "Student Book". | A7 |
| T11 | Forbidden words: each of CEFR, A1, A2, B1, B2, C1, C2, Starters, Primary Advantage, GSE, YLE, Reading A-Z, RAZ, Pre-A1, Pre A1, Chibi, Mitr, and "2026" injected into a title or band label gives an error that names it. Clean titles "Is It a Ball?", "Tap, Tap!", and "Never do not" give no error. A word split by a soft hyphen or `<wbr>` is still caught. | Remove one token; filter lines that contain "never" or "do not". | A7 |
| T12 | Thai: the Thai characters of each back equal the Thai of `BACK_LINES.contact` byte for byte (no Unicode normalization). Fronts, A3 readers, and the leaf have no Thai. The `**` markers are absent from the output. | Change one character; remove one tone mark; use the decomposed sara am (U+0E4D U+0E32); put one Thai letter on a front. | A4 |
| T13 | QR: on both backs the QR grid has `modules >= 21`, `dark > 0`, and `checkStorytimeCoverQr(...) === 0` against the encoder grid. `data-qr-input` equals `STORYTIME_LINE_ADDRESS`. Fronts, readers, and the leaf have no QR. | Flip one module (expect 1 different); encode a lookalike address. | A4 |
| T14 | One escape: a synthetic reader title `A & B <i>"x"` appears as `A &amp; B &lt;i&gt;&quot;x&quot;` once, with no `&amp;amp;` and no raw `<i>`. A table covers the level line, the band pill, the week pill, the title, and the role label. | No escape; double escape. | A5 |
| T15 | Readers: `questReaders()` gives exactly 14 rows (assert the count before any filter). Per row: title and kind from the week file, week 1 to 7, role by the rule of F7, picture row `use: cover`, file names `l2-wNN-cover-<slug>-v1.png` and `-line-v1.png`, unique slugs. Week 8 gives no row. The sha256 of the 7 week files and `pictures.json` is the same before and after. | A week 8 row; a changed week file. | A3, A4 |
| T16 | Parity: for all 14 readers, the role label, the title, and the week text equal the cover page of `compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'a3-color', bookTitle })` (`data-part="reader-role"` and `data-part="reader-cover-title"`). | Change a role label in the copy. | A5 |
| T17 | Reader function: `questReaderCoverPage` at the A3 trim and at the leaf trim returns `{ body, css }`. Every CSS selector starts with `.quest-`. The body has no `<html>`, `<head>`, or `<body>`. The css has no `@page`. The two trims give different CSS. | Add a selector `body {`; add `@page`. | A5 |
| T18 | Leaf colour: every colour token in the leaf HTML and CSS (hex of 3 or 6 digits, `rgb()`, `hsl()`, SVG `fill` and `stroke`, named colours) is black, white, or grey with r=g=b. At least 1 token is found. The A3 reader has a non-grey token (the check is not vacuous). | Insert `#2A77B8`, `#00f`, `rgb(1,2,3)`, or `blue`. | A4 |
| T19 | PDF/X-safe CSS (F11, F16): no `rgba(`, `hsla(`, `opacity`, `box-shadow`, `text-shadow`, `drop-shadow`, `filter`, `backdrop`, `mix-blend`, `gradient(`, `blur(`, or emoji in any kind or in the reader css; no SVG `opacity`; every `@font-face` is a static face (no weight range, no `font-variation-settings`); `font-synthesis: none`; only the families Andika, Sarabun, League Spartan. | Add `box-shadow`; add `opacity: .9`. | A5 |
| T20 | Every `file://` font URL in the CSS names an existing file under `dashboard/assets/print-fonts`. | Misspell the League Spartan file. | A4 |
| T21 | No remote URL: every `src`, `href`, and `url()` is `file://` or `data:`. No `@import`. | Add an `https://` image. | A7 |
| T22 | `checkQuestCoverData` rejects: level 0, 5, 1.5; unit 5; a duplicate level and unit; `litBand` `Sprout` (case), `tree`, or missing; an art name with `../`, an absolute path, a NUL, a wrong extension, or a wrong side token; a student cast of 3 children; a student cast of 2 animals; a teacher cast of 3 children; a cast name not in the roster; an unknown key (strict); a `__proto__` key; `books` empty or not an array. It accepts the valid L2U1 row. Each error names the field. | Remove one rule. | A4 |
| T23 | Shipped `quest.json`: passes the check; has the L2U1 row only; `litBand` is `sprout` and equals `meta.band.toLowerCase()` of the 7 shipped weeks (assert 7 first); cast is {Nan, Sam, Pip} and {Teacher Kim, Nan, Sam}; art names have the pattern of D-A8; the test passes with no art folder present. | `litBand: "seed"`. | A4 |
| T24 | Art ppi: 2480x3508 passes at bleed 0 (299.96 ppi). 1448x2048, 1447x2048, and 2400x3400 fail. 2480x3508 fails at bleed 3 (291.6 ppi); 2551x3579 passes. The A3 reader art 4000x3000 passes at 240 and reports 241.9. The result holds labeled numbers. | Threshold 150; compare height only. | A3 |
| T25 | The same input gives byte-identical HTML twice. | Add a timestamp. | A5 |
| T26 | The art layer is the first positioned element, `alt=""`, `object-fit: cover`, with no opacity, and its box equals trim plus bleed. | Put the art after the frame. | A5 |
| T27 | Every exported function and constant has a JSDoc block (FR-9.5, read from the source text). | Delete one block. | A5 |
| T28 | Imports: the specifiers of `cover-quest.ts` are within the allowed set (the D-A2 shared modules, `sharp`, `fs`, `path`, `url`). No `next`, `@/`, `drizzle`, `@aws-sdk`, `postgres`, `@supabase`, `child_process`, `http`, `https`, or anything under `apps/`. | Add `import 'child_process'`. | A5 |
| T29 | Importing the module and rendering all 6 kinds calls `fetch` 0 times and `fs.writeFileSync` 0 times (spies). | Write a cache file. | A5 |
| T30 | The unit and level text: the level line reads "Level 2 · Unit 1" with the middle dot U+00B7 after entity decoding; "Student Book" and "Teacher Book" are in the right kinds only. | Use a hyphen. | A7 |

Test helper rules: text is extracted from the HTML by `DOMParser` (`textContent`) and entity-decoded once. A count assertion states its expected integer (`toBe(14)`), never a regex of digits (A3). Each `it.each` table asserts its length first (A4).

### 4.5 Green 1: `cover-quest.ts` and `quest.json` (Task 2.5)

`GREEN_TEST_COMMAND` is the same text as `RED_TEST_COMMAND`, with the log name `green1.txt`.

Green 1 gate (all):
1. `GREEN_TEST_COMMAND` exits 0 and the log shows `Test Files  1 passed (1)` and the test count of T01 to T30 (record the integer).
2. `PROJECT_TESTS` (one heavy-run, about 19 min, background) exits 0 or fails only as section 4.19 allows. Record files, tests, and failed names.
3. `PROJECT_LINT` exits 0. `PROJECT_CHECKS` exits 0. The `check-weeks.ts --level 2` rows are the same text as at `phase_base_sha` (`diff` of the two logs is empty).
4. Guard G-1: `git show --name-only --format= <green sha>` lists only `dashboard/lib/storytime/print/cover-quest.ts` and `content/storytime/covers/quest.json` (plus `measure/` paths). It lists no `__tests__` path.
5. `grep -c '^export function' dashboard/lib/storytime/print/cover-quest.ts` prints at least `6`.
6. The mutant run of the next paragraph, with every mutant caught.

Mutant protocol: the Green commit exists first. For each mutant, edit `cover-quest.ts` only, run `cd dashboard && CI=true npx vitest run __tests__/quest-cover-template.test.ts --maxWorkers=1 -t "<ID>"` in one heavy-run, record `caught` (exit 1) or `SURVIVED`, then run `git checkout -- dashboard/lib/storytime/print/cover-quest.ts` and check `git status --porcelain dashboard/lib/storytime/print/cover-quest.ts` is empty. A surviving mutant opens a new Red and Green pair. Save the table in `measure/runs/storytime_cover_options_20261106/mutants-green1.txt`.

| Family | Mutant A | Mutant B | Caught by |
|---|---|---|---|
| lit band | light a second band | hard-code `sprout` | T04 |
| unit bar | fill all 4 parts | fill `unit+1` | T05 |
| plaque colour | hard-code `#2A77B8` | use the level colour on the crest banner | T06, T07 |
| Thai | change one Thai byte in a contact line | add one Thai letter to a front | T12 |
| QR | flip one module | encode a lookalike address | T13 |
| forbidden words | drop the `Chibi` token from the check | filter lines that contain "never" | T11 |
| art ppi | threshold 150 ppi | compare height only (accepts a 1447 px width) | T24 |
| page size | swap the A3 and A4 sizes | accept bleed 2 | T08 |
| approved text | drop "Student Book" | add a new word | T10 |
| escape | no escape | double escape | T14 |
| safe zone | title plaque at 293 mm | text box at 2 mm | T09 |
| PDF/X-safe CSS | add `box-shadow` | add `opacity` | T19 |
| leaf colour | add `#2A77B8` | add `rgb(1,2,3)` | T18 |
| role | change "Sound it out." to "Sound it up." | use one label for all readers | T16 |
| reader CSS scope | add selector `body {` | add `@page` | T17 |
| data check | allow a 3rd child | allow `../` in an art name | T22 |
| determinism | add `Date.now()` text | | T25 |

### 4.6 Review C (after Green 1)

The review role reads `quest.json`, `checkQuestCoverData`, and the picture rows. It reports on: the strict shape; the roster of cast names; the lit band mapping (F6, P11); the art name pattern and path safety (names only, resolved under `content/storytime/l2/print/pictures/`, no symlink follow outside); the 14 reader rows and their link to `pictures.json` (F8); and the role copy (F7, T16). The review also records the spec clarifications of section 5 (P12).

### 4.7 Red 2: `dashboard/__tests__/quest-cover-build.test.ts` (Task 2.6)

Precondition: Green 1 passed; `red_base_2` is recorded; Review C has no open Blocker.

`RED_TEST_COMMAND` is unchanged. The Red proof is the proof of 4.4 with these changes: the log names `quest-cover-build.test.ts` and the missing module `make-storytime-quest-covers`; `Test Files  1 failed | 1 passed (2)`; the template file passes; the commit changes only the build test file.

| ID | Test | Falsification | Anti-pattern |
|---|---|---|---|
| B01 | Import of the script exports the names of P4 and leaves `process.exitCode` unchanged. | `main()` at module level. | A5 |
| B02 | `parseQuestArgs` bounds: `--level` 0, 5, 1.5, `abc`, empty, `1e0`, `0x2`, ` 2`; `--unit` the same; `--version` 0, -1, 1.5, `x`, 4294967296; an unknown flag; a flag with no value; a repeated flag; a missing `--level` or `--unit`. `--help` returns the usage. Valid values (1 to 4, integer version) pass. The function reads no file and exits no process. | Bound `<= 5`; accept a float. | A4 |
| B03 | Out-folder policy (P6): the default is `<root>/storytime/covers-quest-v<n>`. An out folder is refused when it is the root, outside the root, a parent of the approved folders, inside `print-v3`, `proof*`, `teacher-cover-l2u1`, `unit1-check-*`, or another `covers-quest-v<m>`, when it uses `..`, when it is a file, when it starts with `-`, or when a symlink resolves into any of these (fixture: a temporary root with symlinks). | Allow `..`; skip `realpath`. | A7 |
| B04 | Never overwrite: a fixture folder with an existing target file (bytes known) makes `planQuestBuild` return an error; the file hash is unchanged after the call. A folder with files of another version (for example `...v4_PDFX-1a.pdf` when the set asks v5) is refused. An empty folder passes. The writer uses create-only mode (`wx`). | `w` flag; skip the other-version scan. | A5 |
| B05 | File names: set 1 gives the four print names of FR-11.2 exactly; set 2 gives v5, v3, v2. The 14 plus 14 PNG names match `l2-wNN-<slug>-(a3\|leaf)-cover.png`, unique. `questLayout` lists the 44 paths that the script writes (student 5, teacher 5, readers-a3 17, readers-leaf 17; assert `toBe(44)`) and the four subfolders. The contact sheets (5), `spend-log.md`, and `MANIFEST.txt` come from other steps. | Drop one file. | A3 |
| B06 | `parseQuestPdfInfo` and the page checks use two real `pdfinfo -box` samples stored in the test. Student and teacher: 2 pages, 595.28 x 841.89 pt. Readers A3: 14 pages, 1190.55 x 841.89 pt. Leaf: 14 pages, 561.26 x 420.94 pt. Tolerance 1.5 pt. Bleed 3 grows each dimension by 17.01 pt. 13 pages fails; A4 given for A3 fails; 1.6 pt off fails. | Tolerance 15. | A4 |
| B07 | Build report: each page row holds `file`, `kind`, `widthMm`, `heightMm`, `artPpi`, and the 7 checks `copy`, `thai`, `qr`, `pageSize`, `ppi`, `band`, `forbidden`, each exactly `pass` or `fail` (the key set is exact). One fail makes `ok` false and the exit code 1. A check that did not run is an error. Pages total 32 for the full set. | Hide a fail; omit a check. | A4 |
| B08 | Plan before write: a missing art file, art of the wrong size, art with an alpha channel, and a PNG renamed `.jpg` (magic bytes by `sharp`) each give an error that names the file and leave the out folder untouched (not created). | Write first, check later. | A5 |
| B09 | Reader pictures: 14 fixture pictures of 4000 x 3000 px pass. A missing file, a 3999 px width, and a line-art file with a colored pixel fail. The effective ppi (241.9 for A3, 513 for the leaf) is in the report. | Skip the colored-pixel scan. | A4 |
| B10 | `questPdfxArgs`: all kinds `--keep-fonts`; the leaf also `--k-only`; never `--outline`; the script path is the shared `scripts/print/make-pdfx.ts`; the call uses an argv array and `shell` is not true (spy on `execFileSync` and `spawnSync`). | Leaf without `--k-only`; `shell: true`. | A5 |
| B11 | `questQrFromPng`: a PNG drawn from the encoder grid gives 0 different modules; one flipped module gives 1; an all-white PNG gives the dark count (> 0). | Compare the grid with itself. | A4 |
| B12 | No network and no paid tool: `fetch` and `http.request` are stubbed to fail and the plan functions pass; the script source has no `mmx`, `fetch(`, `https`, or `XMLHttpRequest`; the commands it spawns are only node, `pdfinfo`, `pdftotext`, `pdfimages`, `pdftoppm`. | Add `fetch`. | A5 |
| B13 | CLI smoke (spawn, timeout 120000 ms): `--help` exits 0 and prints `Usage:` once; `--level 9` and `--bogus` exit 2 and create no file. | Exit 1 for bad argv. | A4 |
| B14 | Temp cleanup: the `storytime-quest-` temp folders of `os.tmpdir()` are the same before and after, on success and on failure. | Skip cleanup on error. | A5 |

### 4.8 Green 2: `make-storytime-quest-covers.ts` (Task 2.7)

Gate: the same six points as 4.5 with these changes. The Green commit lists only `dashboard/scripts/storytime/make-storytime-quest-covers.ts`. `grep -c 'Usage:' dashboard/scripts/storytime/make-storytime-quest-covers.ts` prints `1`. A dry build runs once through one heavy-run with the option round art copied to fixture names in a temporary root (`--print-ready-root <tmp>`) and exits 0; the report shows all checks `pass` for the pages built; the temporary root is removed and `git status --porcelain` shows nothing new outside `measure/runs`.

A dry build with the option round art cannot cover the 14 readers if the real reader pictures are absent from the working tree (they are gitignored but present on this host). Check `ls content/storytime/l2/print/pictures/l2-w0[1-7]-cover-*-v1.png | wc -l` prints `14` and the line-art count prints `14` before the dry build.

| Family | Mutant A | Mutant B | Caught by |
|---|---|---|---|
| argv | level bound `<= 5` | accept a float version | B02 |
| out folder | allow `..` | skip `realpath` | B03 |
| overwrite | open with `w` | skip the other-version scan | B04 |
| names | drop one file from the layout | wrong leaf version | B05 |
| PDF page checks | tolerance 15 pt | accept 13 pages | B06 |
| report | hide a failed check | omit a check key | B07 |
| plan order | write before the checks | accept alpha art | B08 |
| reader pictures | skip the colored-pixel scan | accept 3999 px | B09 |
| PDF/X args | leaf without `--k-only` | `shell: true` | B10 |
| QR from PNG | compare the grid with itself | ignore the quiet zone shift | B11 |
| import side effect | `main()` at module level | | B01 |
| cleanup | skip the temp cleanup on error | | B14 |

### 4.9 Task 2.8: final art, paid (protocol)

Order: 2.8a, then price check, then calls, then upscale, then checks. This task opens no Red window and can run before Task 2.4.

2.8a Guard proof (cost 0 USD). The orchestrator makes `options/gen_art_final.py` as a changed copy of `gen_art.py` (allowed path under `measure/tracks/`): prompts from `options/prompts-final.json`; the limit 0.9335 USD for Phase 2 counted from the Phase 2 log only; the track total 0.0665 + Phase 2 must stay at or below 1.00 USD; costs as integers in units of 0.0001 USD (35 per call, 9335 limit) so float error cannot pass a call; ids limited to `Q-front` and `Q-teacher`. Run it with a stub `mmx` first on `PATH` (a shell script that appends its argv to a file and writes a small JPEG). Cases and expected result:

| Case | Expected |
|---|---|
| fresh log, attempt 1 | 1 call, 1 row, 35 units |
| the same id and attempt again | refused, 0 calls |
| attempt 4 | refused, 0 calls |
| log total 9300 units, one more call | allowed (9335, the boundary) |
| log total 9335 units, one more call | `STOP`, 0 calls |
| prompt of 1501 characters | refused, 0 calls |
| any stub argv | has `--prompt`, `--width 1448`, `--height 2048`; has no `--subject-ref`, no image path, no `-i` |

Mutants of the guard (each caught by one case above): limit 9400, `>=` changed to `>`, attempt limit 4, float sum with `0.9335`. Save the table in `measure/runs/storytime_cover_options_20261106/guard-2-8a.txt`.

Price check: before the first real call, run `mmx image generate --dry-run` (as Phase 1) and read the price page of image-01; record the cost per call and the date in the first lines of `~/Desktop/print-ready/storytime/covers-quest-v1/spend-log.md`. A changed price recomputes the units. The log opens with the carry-over line "Option round: 0.0665 USD".

Prompt checks (before the call, from `prompts-final.json`): each prompt is at most 1500 characters; says "picture" and not "cover"; each cast line ends with "no letters"; Pip reads "a small puppy as tall as Nan's knees"; Sam's shirt reads "two white stripes across the chest"; Nan's shirt reads "an orange T-shirt with a white star"; the teacher pose line says Teacher Kim shows the open book to the children; no Thai, no forbidden word of FR-4.3, no field `subjectRef` or `images`. The scene is outside the classroom (D10).

Calls: the student front and the teacher front only; the back keeps `A-back-a1.jpg`. At most 3 attempts per picture, so at most 6 calls (0.0210 USD). The limit 0.9335 USD is far above the need. The cap is a safety stop, not a target.

Spend log checks (a script or `grep`, with labeled integers, A3), all must hold: each row has the six fields (time, tool, prompt id, attempt, cost, result file); the stated `Phase 2 total` equals the sum of the rows in units; the Phase 2 total is at most 0.9335; the track total equals 0.0665 + Phase 2 and is at most 1.00; the row count is at least 2 (a log of 0 calls fails: A4); each attempt number is 1 to 3 per id; the ids are only `Q-front` and `Q-teacher`; every `saved` row names a file that exists.

Upscale: a one-off `options/upscale.mjs` (allowed path) with `sharp` `lanczos3`, `removeAlpha()`, density 300, PNG, create-only. It runs for the 3 pictures (`A-back-a1.jpg` and the two new fronts). Checks on each output (a script, exit 0): width x height is exactly 2480 x 3508; format `png`; `hasAlpha` false; 3 channels; downscaled to the source size with `lanczos3`, the mean absolute difference to the source is at most 3 of 255 (the right picture was upscaled); the name matches D-A8; the file is in `content/storytime/l2/print/pictures/` and `git check-ignore` confirms it is ignored. Mutants of the upscale check: output 2480 x 3507; an upscale of `A-front-a2.jpg` for the back.

Art acceptance look (person-checked, orchestrator): for each new front, crop three native tiles (head and shirt of each child; the animal; the hands with the book) and a full view. Record AF-1 (Sam has two white stripes), AF-2 (Nan's shirt shows a white star and no letters), AF-3 (Nan's star on the teacher front), AF-4 (Teacher Kim shows the open book), no letters or numbers or logo anywhere, Pip's size, and only the allowed cast (2 children and 1 animal on the student front; Teacher Kim and 2 children on the teacher front). Write one line for each picture into `options/selection-final.json` (`file`, `faults`, `result`). If 3 attempts leave a fault, use the best attempt, allow a local fix only for made-up letters, and put the question about the Forge route in the handoff to the PM.

### 4.10 Task 2.9: print build and PRINT_GATE checks

Run each build in one heavy-run. Order: student, teacher, readers A3, readers leaf, contact sheets. Use `--print-ready-root` only for dry runs. The real build uses the default root and `--version 1`.

Checks per print file, all by command with exit 0 (log in `measure/runs/storytime_cover_options_20261106/print-gate.txt`):

1. `PRINT_GATE`: `cd dashboard && npx tsx scripts/print/make-pdfx.ts <file> --check` exits 0, for each of the 4 files.
2. Pages and sizes: `pdfinfo -box` page counts 2, 2, 14, 14 and page sizes of B06; the TrimBox equals the page size within 0.5 pt.
3. Fonts: `pdffonts` lists at least 1 font and every font is embedded; no Type 3 (the gate does so; the count check also guards F12).
4. Text kept (F12): `pdftotext -f <p> -l <p>` of every page contains "Storytime Advantage" (every page of the 4 files, 32 pages in total; a loop over the page numbers) and the kind-specific title ("Level 2 · Unit 1", "Student Book", "Teacher Book", or the reader title). A page without text fails, even when the gate passes.
5. Art ppi in the print file: `pdfimages -list` for the A4 pages shows a page-size image with x-ppi and y-ppi at or above 299. The option round art would show 175 and fail.
6. Thai: the Thai byte check runs on the Chrome PDFs (`cover.pdf`, `teacher-cover.pdf`), never the PDF/X file (F13).
7. Leaf ink (F14): `gs -q -o - -sDEVICE=inkcov <leaf print file>` shows C, M, Y at 0.00000 on every page.
8. QR: the build report shows `qr` `pass`; an independent check reads the QR crop of `back.png` and `teacher-back.png` (the `qr_check.mjs` method of Phase 1: 0 of 841 modules different).
9. Build reports: every page row has the 7 checks `pass` (B07); `jq`/`python3 -I` counts 32 rows and 0 fail.
10. Approved files unchanged (FR-11.7): `sha256sum` of the three files begins `2964d9b678afc7a0`, `e0e0365a4ece8a5b`, `3b992af216dc2238` (labeled compare, exit 0). `git status --porcelain` shows no change under `dashboard/` or `content/storytime/covers/books.json`.
11. Contact sheets: 5 files exist; each opens as a PNG (`sharp` metadata, width > 0); `all.png` is built from the 32 page PNGs.

Mutants of the print checks (run once on a copy in `/tmp/opencode/`, never in the output folder): replace one A4 art with the option round art (check 5 fails); a Chrome PDF with one Thai tone mark removed (check 6 fails); a leaf PDF/X made without `--k-only` (check 7 fails); a page rasterized by an added `opacity` (check 4 fails while `PRINT_GATE` passes: this proves F12).

### 4.11 Task 2.10: the 32-page look protocol

Page numbers: 1 student front, 2 student back, 3 teacher front, 4 teacher back, 5 to 18 the A3 covers, 19 to 32 the leaf covers. The A3 and the leaf lists use the order week 1 to 7, and in a week the order of `books[]` (read-along first, then decodable). So 5 is "Hello!" (w01), 6 is "Nan Can Nod" (w01), and so on; 19 is "Hello!" leaf.

Method (100 %): for each page, cut native tiles of the 300 ppi PNG (at most 1600 px per side) into `/tmp/opencode/look/`. A4 pages: 3 vertical tiles `t1` to `t3`. Backs: `t1` logo, banner, panel top; `t2` panel; `t3` sign, QR, "LINE". A3: 2 x 2 tiles `t1` to `t4`. Leaf: the full page `t1` and one detail `t2`. The orchestrator opens each tile with the read tool and writes the line. The line form is:

`page <n>: pass, <file>, tiles <ids>; <frame parts seen>; <art>; <text>`

or `page <n>: fault, <file>, tiles <ids>; <fault>; <fix>`

The note must name the frame parts of the kind (game bar with its lit band and unit bar, crest and banner, title plaque with crystals, band pill, week pill, role bar, double-line frame, panel, sign, QR, "LINE"), the art (cast, no letters, AF-1 to AF-4 for pages 1 and 3), and the visible texts. A line with a note under 30 characters does not count.

Gate (stronger than a line count; review finding F6 stays and the repeat risk is closed):

- `grep -oE '^page ([1-9]|[12][0-9]|3[0-2]): pass' look-phase2.md | sort -u | wc -l` prints `32` (32 different page numbers; one repeated number cannot fill the count).
- `grep -cE '^page [0-9]+: fault' look-phase2.md` prints `0`.
- A loop reads field 2 of each pass line and checks that the 32 file names are different and exist in the output folder.
- Faults are listed in the file with their fix lines until the final pass lines replace them. A fault returns to Task 2.8 or to a new Red and Green pair, then Tasks 2.9 and 2.10 run again for the changed pages only.

The look is the only check of the upscale quality (spec review R-3). The tiles at native size serve that check. The look also decides the made-up letters question; `tesseract` is not installed (F18).

### 4.12 Task 2.11: MANIFEST and the 11-16 copy

Counts (D-A9): the print-ready folder `covers-quest-v1` holds 50 files and `MANIFEST.txt`, 51 in total. The 50 files are: student 5, teacher 5, readers-a3 17 (14 PNG, 2 PDF, 1 report), readers-leaf 17, contact-sheets 5, and `spend-log.md` 1. The 11-16 folder `~/Desktop/handoff/storytime-check-2026-11-16/covers/` holds the same 50 files, `README.md`, and its own `MANIFEST.txt`, 52 in total. The copy mirrors the whole folder (pin: default in force). The print-ready manifest has 50 lines. The copy manifest has 51 lines.

Checks (all exit 0):

1. `cd <folder> && sha256sum -c MANIFEST.txt` in both folders. The manifest names are relative, with no `..` and no absolute path, and the manifest does not list itself.
2. `find <folder> -type f ! -name MANIFEST.txt | wc -l` equals `wc -l < MANIFEST.txt` in both folders (labeled integers: 50 and 51).
3. `diff -rq covers-quest-v1 handoff/.../covers` lists only `README.md` and `MANIFEST.txt` as different or extra. Every shared file is byte-identical (the copy is not a rebuild).
4. The manifest of the copy lists the SHA-256 of the 4 print files; they equal the print-ready values.
5. The README has one plain-words line for each file kind (student, teacher, readers A3, readers leaf, contact sheets, spend log) and the look points of Task 2.10; it holds no Thai and no forbidden word; it says "waits for Daniel's check of 2026-11-16".
6. `spend-log.md` is the same file in both folders (cmp) and passes the spend checks of 4.9.
7. The approved files of FR-11.7 are not in the manifests.
8. A mutant on a scratch copy: change one byte in one PNG; `sha256sum -c` fails.

### 4.13 Fallback D-A13

Checkpoint (new): 2026-11-10 18:00 ICT. If Task 2.5 (Green 1) is not `[x]`, the orchestrator starts the fallback preparation in parallel. Reason (measured): `options/build.py` builds only the 15 mockups. It has no teacher back, no loop over the 14 readers and 14 leaf covers, and no `--k-only` step. The fallback driver is real work and needs about as many hours as Green 1.

Trigger: at or after 2026-11-12 18:00 ICT, if `grep -cE '^- \[x\] Task 2\.7 .*commit [0-9a-f]{7,40}' measure/tracks/storytime_cover_options_20261106/plan.md` prints `0`, or `GREEN_TEST_COMMAND` at HEAD exits non-zero. The orchestrator writes the labeled line `Fallback D-A13 triggered: <date time ICT>; reason: <one line>` into the plan and keeps Task 2.7 open.

The fallback writes the file names and folders of D-A9 and changes no file under `dashboard/` (G-1 proof as in 4.5). It needs its own checker because no vitest file covers it: `options/check_final.py`, in the form of `check.py`, run over the 32 pages and the 6 print/Chrome files. The checker holds: page size per kind (tolerance 1.5 pt); the approved texts per kind; the new-word set difference; the forbidden words; the Thai bytes of the Chrome PDFs; the QR check (`qr_check.mjs`); the lit band (exactly one lit icon per game bar and the band of the book, from the HTML marks); the art ppi (`pdfimages`); the page count. Its mutants, each caught: a second lit band, a changed Thai byte, one QR module, a forbidden word, a 1447 px art width. Save them in `mutants-fallback.txt`. Every check of 4.10 to 4.12 stays. Tasks 2.4 to 2.7 follow after 2026-11-14, and a later build replaces no approved file. AC-6 stays open until then.

### 4.14 Phase 2 closeout gate (Manual Verification task)

Run in this order, each in one heavy-run, logs under `measure/runs/storytime_cover_options_20261106/`:

1. `GREEN_TEST_COMMAND` at HEAD: exit 0, 2 files passed (the fallback path: skipped and stated).
2. `PROJECT_TESTS` with no open Red window of any track: exit 0. Record files, tests, and the equation of 4.19.
3. `PROJECT_LINT`: exit 0. `PROJECT_CHECKS`: exit 0.
4. `PRINT_GATE` on the 4 print files: exit 0 each; the checks of 4.10.
5. `sha256sum -c MANIFEST.txt` in both folders.
6. Guard G-1: for every Phase 2 SHA recorded in the plan, `git show --name-only --format= <sha>` lists only paths of the allowed list of D-A3. Run a labeled loop that prints `sha: n paths, m outside the allowed list` and requires `m=0`.
7. The three approved SHA-256 prefixes are unchanged.
8. The spend checks of 4.9 on the final log.
9. `tracks.md` and the track note still say "waits for Daniel" (A6). The word "approved" does not appear for these covers before Task 2.14.

### 4.15 Adversarial targets (after Green 2)

1. argv: `--out ../../..`, `--out` as the approved folder, `--out` as a symlink to the approved folder, a name with a newline or a leading `-`, `--level 1e0`, `0x2`, `2.0`, `--version 4294967296`, a repeated flag, `--print` twice.
2. `quest.json`: `__proto__`, constructor keys, an art name `x/../../etc/passwd.jpg`, a symlink art file that points outside the pictures folder (`lstat`), a PNG renamed `.jpg`, a 100 MB file (size cap), a huge cast array.
3. Text injection: a week title with `</div><script>`; a Thai look-alike (Thai digit, zero-width joiner, decomposed sara am); a forbidden word split by `&shy;`, `<wbr>`, a non-breaking hyphen, or a minus sign `U+2212` in "Pre−A1".
4. QR: a different URL that gives the same module count; a QR box scaled to 20 mm.
5. PDF/X: an SVG `opacity` attribute; a CSS `filter` in the reader function CSS; a rasterized page that keeps the gate green (F12).
6. Output: two builds into the same folder at once (the second must fail on `wx`); a read-only target; a full disk (13 GB free on `/`, 95 % used: the build must fail with an error and leave no partial print file).
7. Paid art: the guard cases of 2.8a; a log edited by hand (sum mismatch must fail the check); a prompt with a forbidden word.
8. Stale file: a print file older than the last commit of `cover-quest.ts` or `quest.json` (compare file times and the build report commit; the build report holds `gitHead`).

### 4.16 Changed contracts and guardrails

- G-1: no shared file changes. The proof per commit is `git show --name-only --format= <sha>`. The list of D-A3 is the allow list. A range diff is not a proof.
- New contract: `questReaderCoverPage` is the only function the print track may call (D-A4). Its output has no `@page`, no global selector, and no document tags (T17). The print track owns the page rule and the wiring.
- The print track hand-off (Task 2.13) must carry: the function name and signature, the trim values, the CSS scope rule, the asset contract (`assets` paths), and the SHA-256 of the reader files. The release proof of 2026-11-20 must find the receiving task "Task (Hand-off from storytime_cover_options)" in Phase 9 of the print plan (review finding F3). Check by `grep -c 'Hand-off from storytime_cover_options' measure/tracks/storytime_print_r1_20261025/plan.md` prints `1` before Task 2.13 closes.
- The template is not a replacement of the approved covers. The approved v3 and v1 files stay the print files until Daniel's word.
- Rule R1 of the loops track does not bind this track (D-A12). The reverse direction stays (section 4.19).
- Bleed: one value (0 or 3 mm) and the art ppi rule change together (T08, T24, P10). A printer answer for 3 mm needs a new art upscale size (2551 x 3579 px) and a rebuild.
- Public repository: no Thai goes to another model; no test items; no secret in logs (the `mmx` key is never printed; the spend log has no key).

### 4.17 Anti-pattern coverage (catalog A1 to A10 read; A11 absent)

| Class | Applies | Defense in this phase |
|---|---|---|
| A1 | retired | none |
| A2 consent-blind publish | analog | No code flips an approval. The build refuses to write in the approved folders (B03, B04). Daniel's word (Task 2.14) is the only gate to print. Task 2.12 says "waits for Daniel". |
| A3 digit-only count | yes | Counts are labeled integers: 14 readers, 51/52 files, 32 pages, 0 fail rows, the spend totals in units. Test asserts use `toBe(<integer>)`. The look gate uses `sort -u` on page numbers. |
| A4 vacuous pass | yes | Each `it.each` asserts its table length; QR `modules > 0`; colour tokens > 0; 14 readers counted before filters; the spend log needs at least 2 rows; the Red proof rejects `No test files found`; T04 parameterizes the band so a fixed `sprout` fails; T23 cross-checks `litBand` with the weeks. |
| A5 false-claim text | yes | A plan line cites a log path and an exit code. The parity test T16 guards the copied role logic. T29 and B12 prove "no side effect" and "no network" by spies, not by a claim. |
| A6 registry overstatement | yes | The note in `tracks.md` and `metadata.json` says "waits for Daniel" until AC-12. Closeout step 9 checks it. |
| A7 over-broad filter | yes | T11 uses word-boundary matching and clean titles that contain "never" and "do not". The new-word check (T10) is an exact set difference. B03 uses `realpath`, not a prefix filter on a string. G-1 uses the exact allow list. |
| A8 retired | | none |
| A9 archive path | yes | Tests do not read `measure/tracks/**` (P9). The `options/` scripts are not a test input. At archive time the tests still pass. |
| A10 generated-facts drift | analog | `quest.json` art names vs the real files: the build checks existence (B08). The picture rows vs the reader files: the build checks 28 files (B09). `pictures.json` vs the week files: T15 reads both. |

Project candidates for the orchestrator audit (promotion, not added to the catalog by this role):

- Candidate A11, hard-coded value hidden by shipped data: a test that uses only the shipped data (one band) cannot see a fixed value. Defense: parameterize over all values (T04, T05, T06).
- Candidate A12, gitignored or paid artifact as a unit-test input: such a test fails on a clean checkout. Defense: P8 fixtures.
- Candidate A13, gate exemption hides a fault: `checkPdfx` excuses a page that already is one image (F12). Defense: the text and font checks of 4.10.

### 4.18 Artifact tests and live tests

| Kind | Items |
|---|---|
| Artifact tests (documentation, source text, data) | T01, T27, T28, T20, B12 source scan, the plan and look file gates, the `tracks.md` note check. They prove the form of a file, not the printed result. |
| Unit tests of live code (pure functions and generated HTML) | T02 to T26, T29, T30, B01 to B11, B14. They run the code on in-memory data and temporary fixtures. |
| Live behavior proofs (real tools) | B13 (CLI spawn); Task 2.8a (stub `mmx`); Task 2.8 (real paid calls and real `sharp` upscale); Task 2.9 (Chrome, Ghostscript, `PRINT_GATE`, `pdftotext`, `pdfimages`, `gs inkcov`); Task 2.10 (the look); Task 2.11 (`sha256sum -c`). A mock cannot prove the PDF/X result. The print build is the only proof of it. |

### 4.19 Intentionally red, aggregate suites, and the PROJECT_TESTS baseline

- This track's Red windows are `quest-cover-template.test.ts` (Red 1 to Green 1) and `quest-cover-build.test.ts` (Red 2 to Green 2). Both are outside the shared globs, so they fail no Green gate of another track. Keep each window short: commit Red and Green in the same working session, because a bare `npx vitest run` in `dashboard/` would find a red file. No other track's command does so (plan rule).
- `PROJECT_TESTS` of this track runs the shared list, so a red file of another track fails it. Today the open files are the week-package Red 2 (`storytime-package-family.test.ts`, untracked) and possibly the print track "test reliability" tests. A run passes this track's gate when the failed tests are exactly the tests of that open Red file. The log names the failed tests and the window (track, task, file). The closeout run needs no open window.
- Baseline (cited, no new run before Red 1): `measure/runs/storytime_week_package_20261022/p10-green1-project.txt` at ad767a78: 60 files, 1269 tests, exit 0, 1145 s, `--maxWorkers=1`. The expected count at the Green 1 gate is: 60 files + the files added by other tracks since (list them with `git diff --name-status ad767a78..HEAD -- dashboard/__tests__`) + the untracked week-package file if present + 1 (the template file); tests = 1269 + the tests of those files + the Red 1 test count. The Green 1 log records the equation and the real numbers. A difference without a cause stops the gate. Run a new baseline only when a commit that changes `dashboard/lib` or `dashboard/scripts` lands from another track before Green 1 (check with `git log --oneline ad767a78..HEAD -- dashboard/lib dashboard/scripts`).
- Heavy lock: every vitest, tsc, eslint, Chrome, Ghostscript, and PDF/X command runs inside one heavy-run wrapper. No nested wrapper. `--maxWorkers=1` is on every vitest command. If `git status` shows `pnpm-lock.yaml` changed after a run, run `git checkout -- pnpm-lock.yaml`. No `pnpm`, `npm install`, or `npm ci`.

## 5. plan_updates for the orchestrator (this role edits neither plan.md nor spec.md)

1. Task 2.3: mark `[x]` with the strategy commit SHA, evidence automated. Then apply items 2 to 12 in one `measure(plan)` commit, then capture `phase_base_sha` (section 4.2).
2. Task 2.4: add "test list T01 to T30 of `test-strategy.md` section 4.4; pins P1 to P12 recorded first". Keep the precondition.
3. Task 2.5: add to Done-when: "no test file in the commit; `git show --name-only --format=` proof; the mutant table of 4.5 with every mutant caught; `check-weeks.ts --level 2` rows equal to the rows at `phase_base_sha`".
4. Task 2.6 and Task 2.7: state P4 (importable pure functions, `main` only when run directly), P5 (`--version` is the set number), P6 (`--print-ready-root`), and change "a temporary folder" to "a temporary print-ready root". Add B01 to B14 and the mutant table of 4.8.
5. Add three review tasks before Task 2.9: "Task (Review C: quest.json contract) after Green 1", "Task (Review A and Review B limited) after Green 2", "Task (Adversarial) after Green 2". The plan has no such line today; the orchestrator closes the phase review gates with them.
6. Task 2.8: add the sub-step 2.8a (guard proof with a stub `mmx`), the allowed new files `options/gen_art_final.py` and `options/upscale.mjs`, the units rule (0.0001 USD), the spend log checks (at least 2 rows), and the upscale checks of 4.9.
7. Task 2.9: add the checks 2 to 11 of 4.10 to Done-when. Amend FR-11.1 in the spec: the leaf print file uses `--keep-fonts --k-only` (F14, P7).
8. Task 2.10: replace the fast gate with the `sort -u` form of 4.11 and the file-exists loop; keep the `fault` count of 0.
9. Task 2.11: add the counts of 4.12 (50 files and 51 with the manifest in `covers-quest-v1`; 52 in the copy) and the `diff -rq` check.
10. Add the fallback checkpoint (2026-11-10 18:00 ICT), the trigger command, and the labeled line of 4.13 to the date-fallback rule.
11. Baseline wording: replace "Red 1 records the baseline" with the cited run and the equation of 4.19.
12. Spec clarifications (no change of intent): the role set of FR-4.1 and FR-7.4 includes "Sound it out." (6 readers); the picture rows come from `pictures.json`, not the week file; the lit band is lower case in `quest.json` and capital in the week schema; `--version` means the set number (D-A9).
13. Keep the status line for `tracks.md`: "Phase 2 in progress; waits for Daniel's check of 2026-11-16".

## 6. Unmeasured items and risks

- `PROJECT_CHECKS` (`check-weeks.ts` plus `tsc --noEmit`) was not run. Its duration and baseline rows are unknown; Green 1 records them.
- No full `PROJECT_TESTS` run was made. The baseline is the cited run.
- The teacher back (D-A10) has no mockup, so the PDF/X result for it is unmeasured. Task 2.9 is its first gate.
- The reader A3 art at 241.9 ppi is below 300. D-A7 accepts it. The look must judge it. A fault there has no fix in this phase (no new reader art).
- A printer answer for 3 mm bleed (Q2) is open. It would change the art size and force a rebuild after the 11-14 date.
- The fallback is real work (4.13). The 11-10 checkpoint is the control.
- Disk: `/` has 13 GB free (95 % used). A full build of 51 files with 4000 x 3000 PNG reads needs little, but the 300 ppi PNGs and PDFs can reach several hundred MB. Check `df` before Task 2.9.
