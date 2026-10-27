# Test Strategy: storytime_covers_20261027

Written 2026-10-27 by the strategy role at dbe9173c. Phase 1 has full detail. Phase 2 has an outline. Phase 3 is not release 1 work.

## 1. Sources and measured facts

Inputs are the track `spec.md`, `plan.md`, and `metadata.json`. Inputs also include `measure/index.md`, `measure/workflow.md`, and `measure/anti-patterns.md` (A1 to A10). Inputs also include `measure/lessons-learned.md`, `measure/tech-debt.md`, and the print-track strategy. The mock build was read only. This role did not run the mock build again.

Facts measured on 2026-10-27 at dbe9173c. This role ran no vitest, tsc, Chrome, or Ghostscript. Another role is editing the print track in this checkout.

- F1. No file matches `dashboard/__tests__/storytime-print-covers*.test.ts`. `content/storytime/covers/` does not exist. `dashboard/lib/storytime/print/covers.ts` does not exist. A non-zero exit of `RED_TEST_COMMAND` before Red is `No test files found`. That exit is not a Red proof (A4). The print-track strategy measured this class on 2026-10-25. This role confirmed the empty glob with `ls`.
- F2. `graph.db` mtime is 2026-08-08. Graph-aware inspect was not run. Caller counts below come from `rg`, as the plan states.
- F3. `BACK_LINES.contact` in `dashboard/lib/covers/back-text.ts` equals the five mock contact lines, byte for byte. Line byte lengths are 27, 50, 42, 49, and 29.
- F4. `generateQRCode('https://line.me/ti/p/Pf7_EF98Pv')` returns an SVG with 434 dark rects. Each rect has width 10. The viewBox is 370. `qrcode(0, 'M')` reports 29 modules and 434 dark cells. The margin in `qr-generator.ts` is 4. The function does not export a module grid.
- F5. `composeSide` returns a JPEG. `placeArt` returns an RGBA PNG. `PAGE_RATIO` is 210/285. The Storytime trim is 210 x 297 mm. `cutWide` is the wrong cut for this trim.
- F6. `checkPdfx` fails a file that has no `PDF/X-1a:2001` marker, an RGB image, a soft mask, or a page that became one image. `--check` on a Chrome PDF fails the marker check. It is not a pass path.
- F7. Seven cast files exist: `content/storytime/l2/media/w01/forge/cast/sprout-<name>/front.png` for pat, may, sam, mia, ben, nan, and pip. Each file is 1024 x 1200, 8-bit RGBA.
- F8. `Teacher guide/reading-advantage logo.png` is 700 x 700 RGB. Its SHA-256 equals the mock copy of that logo.
- F9. `content/storytime/l2/w01.json` has `approval.text` approved on 2026-10-23 with the words `publish week 1`. Weeks 2 to 8 have `approval.text` draft. The token 2026 appears only in approval dates, not in page text.
- F10. The mock CSS sets `border-radius: 5mm` on the level card and `border-radius: 3mm` on the panel. The mock Level 4 Unit 4 picture is `class-waves.png`. The mock data has 16 rows. Three rows name a picture. Thirteen name none. Colours are L1 #E06A1F, L2 #2A77B8, L3 #3C9B57, L4 #8151B8. The LINE address is `https://line.me/ti/p/Pf7_EF98Pv`.
- F11. `compose.ts` has 2 callers. `back-text.ts` has 2 callers. `qr-generator.ts` has 3 callers (`template-renderer.ts`, `student-book.ts`, and its test). `COVER_BOOKS` is the Primary list. `covers-contract.test.ts` expects badge A1 on `quest-6.2` and badge A2 on `adventure-7.1`.
- F12. The print-track Phase 5 plan names `lib/storytime/print/covers.ts` and `scripts/storytime/make-storytime-cover.ts`. This plan names `scripts/storytime/make-storytime-book-cover.ts` and `__tests__/storytime-print-covers-16books.test.ts`. The spec line 11 name matches the print-track script, not this plan.
- F13. At HEAD, `student-book.ts` sets Andika `format: 'truetype'`. The working tree of that file is dirty. This track does not edit it. `format('ttf')` is not a valid CSS hint (lessons-learned, 2026-10-27). Sarabun faces in `dashboard/assets/print-fonts/` are woff2. Andika faces are ttf.
- F14. The full dashboard suite has 3 known failing tests (tech-debt, 2026-09-30). `PROJECT_TESTS` does not include them. This repo has no `measure/test-all.sh` and no `measure/generate.sh`.

The print-track strategy measured the checker on 2026-10-25. This role did not re-run the checker. Those rules still bind this track. A `[b]` line is not counted. The word `deferred` on a task's first line drops that task. A SHA counts only on the first line of a task. `git cat-file -e <sha>^{commit}` is the SHA check.

## 2. Risk classification and review gates

| Phase | Risk | Review A | Security (Review B) | Review C | Adversarial | UX/API | Browser |
|---|---|---|---|---|---|---|---|
| 1 The cover module and the three Drive covers | high | yes | yes, limited | yes | yes | not applicable | not applicable |
| 2 The Level 2 Unit 1 cover print file | high | yes | yes, limited | yes | yes | not applicable | not applicable |
| 3 The other 13 covers | low | no, until the phase starts | no | no | no | not applicable | not applicable |

`UX_REQUIRED=never`. The outputs are print files, not app screens. UX/API review does not apply. Browser review does not apply. The visual checks are the Check task and Daniel's look on Drive. If the UX role runs, it writes `ux_applicability: not_applicable` and `webbridge_status: not_run`.

Review B applies to Phase 1 and Phase 2. The phase has no network call, no secret, and no authentication surface. Review B checks four bounds. `--level` and `--unit` are integers in range. The script writes only under the named output folder. The LINE address is the constant, not an argv value. The summary words come from the named week text.

Phase 1 risk is high. The module is shared. The Thai lines must match byte for byte. A rounded corner can flatten a PDF/X page. Phase 2 risk is high. The print file can go stale. The owner gate can be skipped in error. The date risk belongs to the PM session if Daniel answers after 2026-11-05. That date risk is not a test.

## 3. Evidence classes

Each task note names one class or more: owner-approved, person-checked, automated, or peer-report. A self-report closes no task. A PM relay of Daniel's words is a peer-report, not owner-approved. Model pre-check does not apply. This track has no paid generation.

## 4. Phase 1 in full

Phase heading, exact: `Phase 1: The cover module and the three Drive covers (2026-10-27 to 2026-11-01)`.

### 4.1 Task order and owners

The checker needs every counted task of the phase closed before the jr-green gate. The phase has 5 counted tasks. The `[b]` line in Phase 3 is not one of them.

| Order | Task | Owner | Evidence | Closes when |
|---|---|---|---|---|
| 0 | Strategy (this file) | strategy role | automated | committed |
| 1 | Red | mid-red | automated | Red commit; Green task set to `[~]` |
| 2 | Green | jr-green | automated | four gates pass |
| 3 | Check | jr-green, then the orchestrator reads the defect list | automated | the three builds, `PRINT_GATE` on each PDF/X file, and the contact-sheet look |
| 4 | Hand-off | orchestrator | peer-report | the PM session confirms receipt |
| 5 | Manual Verification | orchestrator | automated | the steps in 4.7 pass |
| 6 | jr-green role gate, then Reviews A, B, C, adversarial, phase acceptance | orchestrator and audit roles | automated | each audit is `pass` on one HEAD |

Daniel's approval is not a Phase 1 task. It is the Phase 2 owner gate. Phase 1 ends when the PM session has the files.

### 4.2 Phase base SHA

The orchestrator captures `phase_base_sha` at one point only.

1. Commit this file.
2. Run `git rev-parse HEAD` immediately after that commit.
3. Store that SHA as `phase_base_sha`.
4. Start Mid Red only after that capture.

This file holds no SHA for that capture. A SHA from before this commit is not `phase_base_sha`. The mid-red `--baseline` is that captured SHA.

### 4.3 Red

Command, exact: `RED_TEST_COMMAND` from `plan.md`:

```bash
cd dashboard && CI=true npx vitest run __tests__/storytime-print-covers*.test.ts
```

The whole command runs inside one heavy-run wrapper:

```bash
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && CI=true npx vitest run __tests__/storytime-print-covers*.test.ts'
```

Exit 75 means the pre-flight wait ended. Wait, then retry the same command. Report any line `heavy-run: lock wait over 600 s` to the PM session. Do not put a plain `flock` inside the job.

File: `dashboard/__tests__/storytime-print-covers-16books.test.ts`. The commit holds only this file and plan markers in `measure/`.

Red proof (all three must be true):

1. The command exits non-zero.
2. The output has the labeled line `Tests  <n> failed` with n of 1 or more. The output does not have `No test files found` (F1).
3. Each failure is an assertion failure or a missing export inside a test body. Load new modules with `await import()` inside each test.

If the print-track file `__tests__/storytime-print-covers.test.ts` already exists, the glob runs both files. The Red log names the failing tests in the 16-books file. The other file must still pass.

Tests load `content/storytime/covers/books.json` and `content/storytime/l2/w01.json` to `w08.json`. They do not use a hand-made file as the pass path (rule 11.3). Mutation copies live in a folder from `fs.mkdtemp` (rule 11.1). A test does not change a source file in place.

Do not hardcode the unit-summary sentence. Green writes that sentence. Red asserts the check, not a guessed sentence (lessons-learned, 2026-10-26).

Each test below names the behavior it fixes and the falsification condition.

- R1. Sixteen-book data. The shipped file has 16 rows, level 1 to 4 and unit 1 to 4. Weeks are 1–8, 9–16, 17–24, and 25–32 at every level. The title is `Storytime Advantage, Level N, Unit M, Student Book`. Colours are the four values in F10. The LINE address equals `https://line.me/ti/p/Pf7_EF98Pv`. Fixes a short list, a wrong title, or a wrong colour. Falsified when a 15-row copy or a wrong colour passes.
- R2. Picture recipes. Three rows have a non-empty recipe: Level 1 Unit 1, Level 2 Unit 1, and Level 4 Unit 4. Thirteen rows have an empty recipe. Every named file exists. No recipe names `class-waves.png`. Level 2 Unit 1 names the seven cast files in F7. Fixes a recipe that points at a missing file, and the room-scene picture (D4). Falsified when `class-waves.png` passes, or when an empty recipe is treated as present by a truthy check.
- R3. Unit-summary panel data (D1). Exactly one row has a summary. That row is Level 2 Unit 1. Its source week is 1, and `approval.text.status` of that week is `approved`. Fifteen rows have `null`, not `""`. A summary word that is not in the English student text of the named week fails. That text is page `text`, book titles, `backWords`, `check.items`, and `home.words`. A word that appears only in `approval.*.words` fails. The summary has 25 words or fewer. Fixes an invented summary and a panel on a unit with no week text. Falsified when the word `zebra` passes, or when a draft week supplies a summary.
- R4. Front contract. The front holds `Storytime Advantage` in the level colour. The picture area is 186 x 180 mm, at 12 mm from the left and 31 mm from the top. The level card is 186 x 65 mm, at 12 mm from the left and 217 mm from the top. The card holds `Level N · Unit M` and `Student Book`. The front has no badge element and no badge text `A1` or `A2`. Fixes a CEFR badge on a Storytime front. Falsified when a badge node passes.
- R5. Back contract and the LINE label (D2). The logo box is 30 x 30 mm, at 12 mm from the left and 12 mm from the top. The panel box is 186 x 138 mm, at 12 mm from the left and 48 mm from the top. The contact block is at 15 mm from the left and 200 mm from the top. The QR box is 44 x 44 mm, at 14 mm from the right and 200 mm from the top. The panel element exists only when the summary is non-null. The label text is `LINE`. It adds no Thai. Fixes a missing label and an empty panel box on a unit with no week text. Falsified when a null-summary HTML still contains the panel element.
- R6. Copy check (print-track FR-6.3, plus A-18). The check reads page text, not the source and not the raw PDF bytes. It fails a side that lacks `Storytime Advantage`. It fails a side that contains a forbidden token. The tokens are `CEFR`, `Starters`, `Primary Advantage`, `GSE`, `YLE`, `Reading A-Z`, `RAZ`, `Chibi`, and `Mitr`. The tokens also include CEFR levels: `Pre-A1`, `Pre A1`, `A1`, `A2`, `B1`, `B2`, `C1`, and `C2`. It fails a year `19xx` or `20xx`. Normalize the text before the search. Fold case. Map NBSP to a space. Map U+2010, U+2011, and U+2013 to `-`. Strip U+00AD and U+200B. Short tokens use a word boundary. Fixes a bypass. Falsified when `Pre‑A1` (U+2011) passes. Falsified when `cefr` passes. Falsified when `Primary\u00a0Advantage` passes. The check does not drop a line that contains `never` or `do not` (A7).
- R7. Thai byte check. Thai characters on the back page equal the Thai characters of `BACK_LINES.contact`, in order. No other Thai appears on either page. The live source is `pdftotext` of the Chrome PDF, not of the PDF/X file. Fixes a dropped tone mark and a sixth Thai line. Falsified when one changed tone mark passes, or when a PDF/X text extract is the only proof.
- R8. QR module check. The expected grid is the dark rects of `generateQRCode` for the constant URL, not a second encoder and not the official LINE image. The printed grid equals that grid. Zero modules differ. The quiet zone is not a data module. The measured encoder output is 29 modules and 434 dark cells (F4). The test computes the grid from `generateQRCode` and also asserts those two counts. Fixes a pasted image that is not the encoder output. Falsified when one swapped module passes, or when the expected grid comes from `line-qr.png`.
- R9. PNG contract. Each front PNG and each back PNG is 2480 x 3508 px, 8-bit RGB, with no alpha channel. Fixes an RGBA deliverable. Falsified when `hasAlpha` is true and the test still passes.
- R10. Chrome PDF contract. The PDF has 2 pages. Each page is A4 portrait, within 2 pt of 595.28 x 841.89. `pdffonts` shows every font embedded, no Type 3 face, an Andika face, and a Sarabun face. It shows no Liberation, Helvetica, Arial, or Mitr face. A CSS string that names Andika is not this proof. Fixes the `format('ttf')` skip (F13). Falsified when the CSS assertion passes and `pdffonts` shows LiberationSans.
- R11. Missing picture. A copy with a missing picture file stops the build, names the book, and writes no deliverable. Fixes a placeholder image. Falsified when the build writes a file after the missing-file error.
- R12. Cut-out style (D4). On every built front, the four corners of the picture area are white (255, 255, 255), inset 2 px from the area edge. A 40 x 40 box at the area center is not all white. One composer function serves every row that has a recipe. Fixes the room scene and an all-white pass. Falsified when `class-waves.png` passes the corner test, or when an all-white picture passes.
- R13. Opaque picture layer. The composed picture buffer has no alpha channel. Page text stays text: the PDF has fonts, and the page is not one image. `composeSide` stays a JPEG helper. Do not change its return type. Fixes a transparent stack and a page that is one JPEG. Falsified when an RGBA buffer passes, or when a font-less page passes.
- R14. PDF/X corner rule. `make-storytime-book-cover.ts --level <n> --unit <m> --print` writes a PDF/X-1a file through `make-pdfx.ts --keep-fonts`. `checkPdfx` on that file reports no soft mask, no RGB image, and no page that became one image. Fonts remain. If a CSS radius fails that check, the module draws square corners and records the mode. The preferred path flattens the radius into the opaque picture layer, so the page text stays text. Fixes a rounded box that Ghostscript turns into one image. Falsified when a page-as-one-image file passes, or when the fallback removes the fonts.
- R15. Primary regression. This phase does not change `catalogue.ts`, `check.ts`, `compose.ts`, `kit.ts`, `back-text.ts`, or `qr-generator.ts`. `COVER_BOOKS` and the badge rules in F11 stay as they are. Fixes a Storytime edit inside the Primary cover contract. Falsified when the phase diff touches one of those files. The live guard is `PROJECT_TESTS` on `covers-*.test.ts`, plus a diff check at closeout.
- R16. Six mutation copies, each in a temp folder. Drop one contact line. Change one Thai tone mark. Swap one QR module. Use a wrong level colour. Put a year in the summary. Drop the panel on Level 2 Unit 1. Each copy fails one test above. Fixes a check that ignores the broken field. Falsified when any of the six copies passes.

Geometry in millimetres is the contract. Convert millimetres to pixels in one shared function: `Math.round(mm / 25.4 * 300)`. Do not hardcode a second pixel table.

### 4.4 Green

Green gate, all four commands from `plan.md`, each inside one heavy-run wrapper:

```bash
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-print-covers*.test.ts'
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-print-covers*.test.ts'
PROJECT_CHECKS='cd dashboard && npx tsc --noEmit'
```

Each command must exit 0. `PROJECT_CHECKS` is the doctor step. This repo has no `measure/doctor.sh`. Run `git checkout -- pnpm-lock.yaml` after a gate if that file changed. Do not run `pnpm install`. Do not edit `package.json`.

Code, and no other production files:

- `content/storytime/covers/books.json`
- `dashboard/lib/storytime/print/covers.ts`
- `dashboard/lib/storytime/print/cover-picture.ts`
- `dashboard/scripts/storytime/make-storytime-book-cover.ts`

Do not create `scripts/storytime/make-storytime-cover.ts`. That name belongs to the print-track plan (F12). The orchestrator routes the print-track change. This track does not edit it.

Live proofs, after the four gates, each under heavy-run when it starts Chrome or Ghostscript:

1. Build Level 2 Unit 1, Level 1 Unit 1, and Level 4 Unit 4. Record each exit code.
2. Run `pdffonts` on each Chrome PDF. Record the face names.
3. Run `pdftotext` on each Chrome PDF and pass that text to the copy check and the Thai byte check.
4. Raster the back page at 300 ppi and run the QR module check. Record the difference count. The pass value is 0.
5. Run `--print`, then `PRINT_GATE` on the PDF/X file, not on the Chrome PDF (F6).

`PRINT_GATE`, exact, with `<print file>` replaced by the PDF/X path:

```bash
cd dashboard && npx tsx scripts/print/make-pdfx.ts <print file> --check
```

Mutation proof. The Green log records `mutants: <n>, caught: <n>` as labeled integers. Keep a copy before any in-place edit, and compare the file after the run (lessons-learned, 2026-10-22).

| Id | Mutant | Must fail |
|---|---|---|
| M1 | Drop one contact line | R7 |
| M2 | Change one Thai tone mark | R7 |
| M3 | Swap one QR module in the drawn grid | R8 |
| M4 | Use a wrong level colour | R1 |
| M5 | Put `2026` in the summary | R6 |
| M6 | Drop the panel on Level 2 Unit 1 | R5 |
| M7 | Draw the panel when the summary is null | R5 |
| M8 | The copy check skips hyphen normalization | R6 (`Pre‑A1`, U+2011) |
| M9 | The recipe uses `class-waves.png` | R2, R12 |
| M10 | The composed picture keeps an alpha channel | R9, R13 |
| M11 | CSS radius makes the PDF/X page one image, and the fallback does not run | R14 |
| M12 | A missing picture still writes a PNG | R11 |
| M13 | `@font-face` uses `format('ttf')` | R10 (`pdffonts`) |
| M14 | The expected QR grid comes from a pasted PNG | R8 |
| M15 | A summary word exists only in `approval.text.words` | R3 |

M1 to M6 are the six copies in the plan. M7 to M15 are required as well. A mutant that is not caught blocks Green.

### 4.5 Check

The Check task builds the three books. Level 2 Unit 1 keeps the group of seven cut-outs (D3). Level 4 Unit 4 uses the cut-out composer, not the room scene (D4). Level 1 Unit 1 uses the same composer and the cast files that exist.

Default for the output folder: `~/Desktop/print-ready/storytime/proof/`. That folder is outside git. The plan does not name it. Do not commit the PNGs or the PDFs.

For each book:

1. Build the Chrome PDF, the front PNG, and the back PNG.
2. Build the PDF/X file with `--print`.
3. Run `PRINT_GATE` on the PDF/X file. Exit 0 is the pass.
4. Run the Thai byte check and the copy check on the Chrome PDF.
5. Run the QR module check on the 300 ppi raster.
6. Record the corner mode: `radius in the picture layer` or `square corners`.

Then make one contact sheet of every page of every cover. The agent opens every page and lists the defects (rule 6.5). A sheet that nobody opened does not close the task.

`PRINT_GATE` on the Chrome PDF is not the check (F6). The handoff states this default.

### 4.6 Hand-off

The message to the PM session names the front PNG, the back PNG, and the 2-page PDF of each of the three books. It gives the SHA-256 of each file. It gives the Level 2 Unit 1 summary text and the source week. It lists open points P1 to P6. It states the corner mode from 4.5. It says the summary wording is a default that Daniel checks. It does not call the files approved.

Done when the PM session confirms receipt. That reply is a peer-report. A sent message with no reply does not close the task.

### 4.7 Manual Verification

The orchestrator runs this protocol. It does not wait for Daniel.

1. Run the four Green gates. Record each exit code.
2. Confirm `git diff --name-only <phase_base_sha> HEAD` does not include `video/`, `catalogue.ts`, `compose.ts`, `back-text.ts`, or `qr-generator.ts`.
3. Confirm `git status --porcelain video/` is unchanged by this phase.
4. Confirm each `[x]` SHA with `git cat-file -e <sha>^{commit}`. Confirm the SHA is on the first line of the task.
5. Open the contact sheet. Count 6 pages. Compare the defect list with the Check note.

### 4.8 Phase closeout gate

- `role-gate --role jr-green` passes. The baseline is `phase_base_sha`.
- Review A, Review B, and Review C JSON are `pass` on one HEAD.
- Adversarial JSON is `pass` with `PROJECT_TESTS`.
- Phase acceptance is `pass` on an immutable HEAD.
- M1 to M15 are caught. The Green log has labeled integers.
- Every `[x]` task has a real SHA on its first line and an evidence class.
- The Hand-off task has the PM receipt.

### 4.9 Adversarial targets

- Copy bypass: `cefr`, `Pre‑A1` (U+2011), and `Pre­A1` (U+00AD).
- Copy bypass: `Primary\u00a0Advantage`, `CEFR` with U+200B, and the year `2026` from an approval date.
- Thai: one dropped tone mark, one extra Thai character, contact lines in a new order.
- QR: one swapped module, or a quiet zone counted as data.
- QR: the official LINE image used in place of `generateQRCode`, or a URL that differs by one character.
- Panel: an empty panel element when the summary is null; a summary on a draft week; a summary longer than 25 words.
- Picture: `class-waves.png`; an all-white picture; an RGBA cast file left unflattened.
- PDF/X: a CSS radius plus a background that makes the page one image.
- PDF/X: `--check` on the Chrome PDF, then reported as a pass.
- CLI: `--level 0`, `--level 9`, `--level ../x`, a missing `--unit`, a write path outside the output folder.
- Fonts: `format('ttf')`; a synthesized bold that becomes Type 3.
- Primary: any edit to `COVER_BOOKS` or to the badge field.

### 4.10 Changed contracts and guardrails

- New code only, plus the new data file. Do not change the Primary cover contract.
- Do not change `generateQRCode`. Parse its SVG for the expected grid (F4).
- Do not change `composeSide`. Call it, or flatten with the same white background. Pass the A4 pixel size. Do not use `PAGE_RATIO` or `cutWide` for these covers (F5).
- Do not change `BACK_LINES.contact`. Compare against it.
- The print-track Phase 5 must not create `lib/storytime/print/covers.ts` again. This track creates that file.
- Fonts use `format('truetype')` or `format('woff2')`. Do not use `format('ttf')` (F13).
- The year 2026 in `w01.json` must not be printed (F9).
- Stage files path by path. Do not touch `video/**`, `dashboard/lib/storytime/print/student-book.ts`, or `dashboard/d1measure.tmp.mts`.
- No `pnpm install`. No change to `package.json` or `pnpm-lock.yaml`.

### 4.11 Anti-pattern coverage, Phase 1

| A | Defense | Falsified when |
|---|---|---|
| A2 | Phase 2 owner gate stays `[ ]` until Daniel's exact words are in the plan. Phase 1 hand-off does not call the files approved. | A closeout treats no answer as approval, or the hand-off says approved |
| A3 | Labeled counts: 16 rows, 5 lines, 29 modules, 434 dark cells, 0 module diffs, `Tests  <n> failed`, `mutants: <n>, caught: <n>` | A test matches any digit, or a total hides a wrong row |
| A4 | Red proof excludes `No test files found`. Panel absence is an element check. Summary null is not a falsy check. A skipped Chrome test is a failure. | M6, M7, or M12 survives, or a skip passes the QR test |
| A5 | Task notes quote measured exit codes only. Do not write "all checks pass" before the gate runs. | A plan line claims a pass while the cited command exits non-zero |
| A6 | `tracks.md` does not say the covers are print-ready in Phase 1. The print file is Phase 2. | The registry says the print file is done before `PRINT_GATE` |
| A7 | The copy check normalizes, then searches. It does not drop lines by bare English words. Short tokens use a word boundary. | M8 survives, or `A1` matches inside a longer token and false-fails a good page |
| A9 | Tests load `content/` and `lib/` only. They do not reference `measure/tracks/` paths. | A test path contains `measure/tracks/` |
| A10 | R1 and R3 compare the shipped data with the module output. The data file is the source. This repo has no `measure/generate.sh`. | The HTML title differs from the row title and the test still passes |

A1 and A8 are retired. The checker word `deferred` is A7-class. Use that word only in the trailer `— deferred:<owner>` of a `[b]` line.

### 4.12 Artifact tests and live tests

Artifact tests read committed files and strings: the data file, plan markers, and the copy-check cases on a string. A pass of an artifact test does not prove live behavior.

Live tests run the code on built files. They use `pdffonts` and `pdftotext` of the Chrome PDF. They use the 300 ppi QR raster, the PNG metadata, and `PRINT_GATE` on the PDF/X file. Phase 1 needs both classes. R6, R7, R8, and R10 each have a string case and a built-file case. The built-file case is the live proof.

### 4.13 Intentionally red

- `RED_TEST_COMMAND` is red only between the Red commit and the Green commit. Do not push inside that window.
- The full dashboard suite has 3 known failing tests (F14). `PROJECT_TESTS` does not include them. Do not "fix" those tests in this track.
- There is no `measure/test-all.sh`. No test needs a `## skip-aggregate:` header.
- No other test may be committed red.
- If `PROJECT_TESTS` fails only in files this phase did not change, do not edit those files. Record the failing file. Retry when that other work is committed. Do not weaken the gate.

## 5. Phase 2 outline

Phase heading: `Phase 2: The Level 2 Unit 1 cover print file (2026-11-02 to 2026-11-05)`.

The plan has no Red task in Phase 2. Default: do not add one. Phase 1 Red owns the `--print` contract (R14). A new Phase 2 Red test would already pass after Phase 1 Green. That is a vacuous Red (A4). The handoff states the fallback if the orchestrator rejects this default.

| Item | Rule |
|---|---|
| Risk | high |
| Red command | none, under the default above |
| Green gate | `PRINT_GATE` exits 0 on the PDF/X file. The file is newer than `git log -1 --format=%cI` of its sources. |
| Closeout gate | owner-approved words and date in the plan; Check proofs; PM receipt; Reviews A, B, and C; adversarial pass |
| Security | limited: the file leaves the repo only to `~/Desktop/print-ready/storytime/` and then to the PM session |
| UX/API and browser | not applicable (`UX_REQUIRED=never`) |
| Adversarial | yes |

Riskiest behavior: a Chrome PDF handed off as the print file, or a print file older than its sources. Mutant: omit `--print` and still report a `PRINT_GATE` pass. Mutant: run the Thai byte check on the PDF/X file and accept a dropped tone mark. Mutant: set the owner task to `[x]` with no quoted words.

Check method: `pdffonts` shows only embedded Andika and Sarabun faces, and no Type 3 face. `pdfimages -list` shows no soft mask and no page that is one image. The Thai byte check and the QR module check run on the Chrome PDF of the same build. The agent looks at both pages of the contact sheet.

The owner task stays `[ ]` until the plan quotes Daniel's words and the date. No answer is not an approval.

Output path: `~/Desktop/print-ready/storytime/`. The file name holds the series, the level, the unit, the kind, the version, and the suffix `_PDFX-1a`.

## 6. Phase 3

Phase 3 is one `[b]` line. The checker does not count it. No test runs for it in release 1. Do not build the other 13 covers in Phase 1 or Phase 2.

## 7. Defaults the strategy uses

These defaults are not questions. The orchestrator may override them. This role did not edit `plan.md`.

1. Phase 1 Check runs `PRINT_GATE` on the PDF/X file from `--print`, not on the Chrome PDF (F6).
2. Phase 2 gets no new Red task. R14 covers `--print`.
3. The script name is `dashboard/scripts/storytime/make-storytime-book-cover.ts` (the plan). Do not also create `make-storytime-cover.ts`.
4. Shipped data has 3 non-empty recipes and 13 empty recipes (spec FR-1.6). The recipe field exists on every row. Do not invent paths for missing Level 4 renders.
5. Phase 1 proof files go to `~/Desktop/print-ready/storytime/proof/`, outside git.
6. The corner radius is flattened into the picture layer. Square corners are the fallback if that path fails `PRINT_GATE`. The Check note records the mode.
