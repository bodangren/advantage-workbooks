# Test Strategy: storytime_week_package_20261022

Written 2026-11-07 by the strategy role (role base `a6bad1a7d055cd07a337549ca5a3640f21dc58d0`). Phase 10 (family-word pictures for the app) has full detail. Earlier phases have one outline line each. The strategy role refreshes this file before a new phase starts.

## 1. Sources and measured facts

Inputs: `spec.md` (Phase 10 addendum, decisions H1 to H15, Phase 7 decisions D2 to D6, Phase 9 decision E5 and its amendment), `plan.md` (Phase 10 section and gate commands), `spec-review.md` (the Phase 10 amendment passed; F1 to F5 answered in `7f587966`), `measure/anti-patterns.md` (A2 to A7, A9, A10 are live; A1 and A8 are retired), the loops strategy `storytime_teaching_loops_20261103/test-strategy.md` (sections 2, 8, 9.8, 9.16, 9.17), and the code that the plan names.

Facts measured on 2026-11-07 at `a6bad1a7`:

- F1. The 51 family words are in `focus.family.words` of w01 to w07 (6, 10, 7, 7, 7, 7, 7). w08 has 18 words and 0 `image` objects. Each of the 51 has `prompt`, `characters`, and `caption`, and no `file`. The week files use LF line ends (CR count 0).
- F2. The folder `~/Desktop/handoff/storytime-l2-card-pictures/` holds `MANIFEST.txt` with 58 lines of the form `<sha256>  <file name>` (29 color and 29 line-art files), a Forge `manifest.json`, and one contact-sheet PNG that is not in `MANIFEST.txt`. The color name form is `l2-w<NN>-card-<word>-v1.png`; the line-art form is `l2-w<NN>-card-<word>-line-v1.png`. All 15 words of the PM request have a color file in `MANIFEST.txt`.
- F3. `content/storytime/l2/print/card-pictures.json` holds 31 entries (`word`, `week`, `prompt`). It has an entry for `family` (week 4) with no file in `MANIFEST.txt`. It has no entry for `friend`. So `friend` and `family` both fall to `forge` by H3 item 3 (the rule needs the entry and the MANIFEST file). The entry `ham` (week 4) is the other undelivered row. It is not a family word.
- F4. The folder `~/Desktop/handoff/storytime-l2-family-word-pictures/` does not exist yet (Forge is due 2026-11-10).
- F5. `card-kit.ts`: `colorPatchBox` (line 753) and `numberDotsBox` (line 765) are module-private. The CSS rule `.card-picture { flex: 1; width: 100%; min-height: 0; margin-top: 3mm; ... }` is inside the private `cardSheetCss` (line 824). So the parity rule of H5 compares the element string only. It does not prove that the page CSS makes the same picture. Only a render test proves that (R1-9, R1-10).
- F6. `STORYTIME_CARD_COLOR_PATCH` has 8 keys, and the new module reads it. A mutant in that constant changes both sides of the parity compare. So the test needs its own hand-written hex table (R1-1).
- F7. `set-book-pictures.ts` (exemplar): the caption edit works on the slice between `"books"` and `"song"` with the regex `captionLine`. Its optional group rewrites an existing `"file"` line. If the new script ran that regex over the whole week file, it would overwrite the 18 book `file` lines of each week. The family edit must stay inside the family block (mutant G2-M5).
- F8. `check-weeks.ts` exports `checkBookPictures(week, contentRoot)`. It returns `undefined` when no file is named, and a row `{ id, label, status, detail }` otherwise. The CLI `main` is not exported, so a unit test cannot prove that a new check row is pushed into the report. Only a live `check-weeks.ts --level 2` run proves it.
- F9. `w04` has a tracked book folder `content/storytime/l2/media/w04/books/1-my-family/` (9 JPEGs). A match on the bare text `family/` finds these files. Every grep and path rule of this phase anchors on `/family/` or on the full pattern `media/w0[1-7]/family/[a-z]+\.jpg`.
- F10. `storytime-loops-content.test.ts` `withoutNewFields` (line 389) drops `book.cover.file` and `page.image.file` (the Phase 9 change). It does not drop `focus.family.words[].image.file`. The grep of the plan (`image\.file`) misses it, because the code reads `image?.file`. The Phase 10 content commit makes this test fail until the file changes. Use the pattern in section 5.6 (grep list).
- F11. Both other tracks run `PROJECT_TESTS` with the glob `__tests__/storytime-*.test.ts` (print plan line 21, loops plan line 26). The names `storytime-package-raster.test.ts` and `storytime-package-family.test.ts` match that glob. They do not match the `RED_TEST_COMMAND` globs of the other tracks (`storytime-print-*`, `storytime-loops-*`).
- F12. Loops state: Red 1 of Phase 3b is committed (`ffe6e74a`). Its Green 1 is in the work tree and not committed (`git status` shows `dashboard/lib/storytime/schema.ts` and `checks.ts` modified). The loops Green 1 `PROJECT_TESTS` capture exists (section 7). The loops R3 window (the content test `storytime-loops-share-content.test.ts`) is not open: that file does not exist.
- F13. Machine: 7.3 GB RAM, about 2.5 GB available at the time of reading. `PROJECT_TESTS` took 937 s in the loops Green 1 run. Chrome launches time out at 15 s under load (baseline of `0e632495`). The Chrome cases of this phase carry long test timeouts (section 5.2, S2).
- F14. `sharp` is 0.34.5 (`dashboard/package.json` `^0.34.5`; `sharp.versions.sharp` prints it). Chrome is the installed `google-chrome` (channel `chrome`).
- F15. Existing picture tests read the git-ignored folder `content/storytime/l2/print/pictures/` and fail when it is absent. They never skip. Phase 10 tests follow this practice for the card folder and the Forge folder (S5).

## 2. Rules across the three active tracks

### 2.1 Rule R1 for Phase 10

Rule R1 (loops strategy 2.2) says one Red window is open at a time across the tracks. The set is now three tracks: print, loops, and week package. A Red window starts when a failing test file first exists in the work tree (committed or not). It ends at the Green commit that passes `PROJECT_TESTS`. The orchestrator keeps the owner of the open window in its run log.

State now: the loops window of Phase 3b is open (Red 1 `ffe6e74a`; Green 1 is running). Phase 10 Red 1 starts only after the loops Green 1 commit lands and its `PROJECT_TESTS` capture passes. The orchestrator also reads the print plan for an open window.

Phase 10 windows (each one is short: one Red file, then its Green, on the same day):

| Window | Opens | Closes | Red file |
|---|---|---|---|
| W1 | Red 1 commit | Green 1 commit (four gates pass) | `storytime-package-raster.test.ts` |
| W2 | Red 2 commit | Green 2 commit (four gates pass) | `storytime-package-family.test.ts` |

The orchestrator does not start Red 2 before the Green 1 gates pass. It does not start any Red role of the other tracks between W1 and W2 without telling the other session. The Red draft stays outside `__tests__/` (for example in `/tmp/opencode/p10/`) until the window opens. The orchestrator records `red_base=$(git rev-parse HEAD)` right before each Red role.

### 2.2 How the print and loops `PROJECT_TESTS` see the new files

- While W1 or W2 is open, the new Red file is red. It fails the `PROJECT_TESTS` Green gates of the print and loops tracks. This is the same cycle as in loops 2.1. The window is short, so there is no exclude (loops 2.3 says an exclude is worse for short windows).
- Before opening a window, the orchestrator sends one message to the print session and one to the loops session: the window owner, the Red file, and the planned close. At the close, it sends one message with the new file count (section 7, F0 plus 1 after Green 1 and plus 2 after Green 2).
- A loops or print Red file that opens while W1 or W2 is open is a rule R1 breach. The orchestrator stops the later Red role.
- The loops R3 window is an exclude-only window (loops 9.8). When its file exists, every Phase 10 gate that runs `PROJECT_TESTS` adds `--exclude "**/storytime-loops-share-content.test.ts"` (spec H14, plan rule R3 paragraph). Evidence that the exclude is not over-broad (A7): the capture holds `grep -c "storytime-loops-share-content" <capture>` = `0`, and `grep -c "storytime-loops-share.test" <capture>` = 1 or more. The orchestrator reads the loops plan before each such gate. The verification task runs with no exclude after the loops switch commit.
- The loops expected file count `F0 + 1` (loops 9.8, F0 = 58) changes when a Phase 10 Green lands first. The message of the close tells the loops session the new F0.
- After Green 2, the two Phase 10 files run in both other `PROJECT_TESTS`. They add Chrome renders (about 1 to 2 minutes). Their per-test timeouts are long (S2), because of the load-sensitive failures of `4ffdbdca`.

### 2.3 Rule R4: the week files are shared

The loops content task (Phase 3b) edits `content/storytime/l2/w01.json` to `w08.json`. The Maker and Forge tasks of Phase 10 edit `w01.json` to `w07.json`. Both write by text edit.

- Before each script run and before each `git add` of a week file, `git status --porcelain content/storytime/l2/ dashboard/__tests__/` must show no change in a file that the commit will hold. A week file with an uncommitted loops edit blocks the run (the path-wise `git add` would stage the loops edit).
- Each commit of Phase 10 stages path by path. It never stages `dashboard/lib/storytime/schema.ts`, `dashboard/lib/storytime/checks.ts`, `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, or `measure/runs/**` of another track.
- The second of the two content commits (loops or Phase 10) runs after the first commit lands. The hand-off MANIFEST then lists the loops change in its "Changed since" section (spec H12, last sentence).

## 3. Risk classification and review gates

Phase 10 risk: `high`. Reason: a new script writes 51 JPEGs and edits 7 shipped week files by text. One week (w01) has `meta.status = published`. The hand-off folders go to Monorepo, which pins them on 2026-11-17 to 2026-11-19. The input folders (card, Forge) come from other sessions. There is no secret, no network call, no paid call, no schema change, and no approval change (H10).

| Task | Risk | Reason |
|---|---|---|
| Red 1 | medium | Test only; it launches Chrome. |
| Green 1 | medium | Pure module and one render function; no write into content. |
| Red 2 | medium | Test only; temporary copies. |
| Green 2 | high | Byte-level edit of shipped weeks; delivery check of external folders; provenance integrity. |
| Maker (32 pictures) | high | Writes shipped content of 5 weeks; changes tests of other tracks. |
| Forge delivery | high | External input; the last write; the shipped case. |
| Check (contact sheet) | medium | Person check; no code. |
| Package build | high | Outward-facing folders; Monorepo pins them. |
| Hand-off | high | Outward-facing message; no code. |

Review gates (one column per gate; the lane of spec H15 names three checkers: the spec review, the contact-sheet check, and the PM check of each folder; this strategy adds two roles, see plan_updates P2):

| Gate | Applies | Why and scope |
|---|---|---|
| Review A (code and test quality) | yes, one role, after Green 2 and before the Maker run | The script edits shipped files by regex. The tests are the only guard. The role reads the commits of Red 1, Green 1, Red 2, Green 2 and checks mutants, vacuous passes, and test honesty. Model family differs from the Green author. |
| Review B (security and data) | yes, limited; the same role as Review A with its own labeled section | Path rules (H2 word charset, output path allowlist), hostile `MANIFEST.txt` lines (`..`, `/`, a name with spaces), HTML escape in `familyCardPictureHtml`, no source PNG in git, public repo. No secret, no network. |
| Review C (contracts and blast radius) | yes, limited; the same role, own section | The Monorepo receiver contract (media path allowlist, 200-character limit, `image.file` as a string), the schema (unchanged), the H12 revision form, the tests of other tracks that read week files, and `PROJECT_CHECKS` of the other tracks (the new check gives `warn`, never `fail`). The PM check of each folder stays the owner of the A-42 field contract. |
| Adversarial | yes, one limited round, after Green 2 and before the Maker run | The Maker run writes shipped content. Scope: the script and the check on temporary copies (hostile folders, symlinks, CRLF, a JPEG named `.png`, `--partial` with `--check`, a repeat run after an interrupted run). It also probes the package-build check of section 5.11. The role writes no file in `content/`. |
| UX and browser review | not applicable (`UX_REQUIRED=never`) | There is no UI in this repository. The app screen is Monorepo code. Chrome is only the renderer. The visual check is the contact-sheet task (person-checked) and Daniel's check on 2026-11-16. If the orchestrator runs the UX role, the role writes `ux_applicability: not_applicable` and `webbridge_status: not_run`. |
| API review | inside Review C | The "API" is the week-file field `image.file` and the folder form. There is no HTTP API. |

If the schedule forces a cut, cut the adversarial round first. Keep the single review role.

## 4. Evidence classes

- owner-approved: Daniel only. No Phase 10 task is owner-approved. Daniel sees the pictures on 2026-11-16 (H10).
- person-checked: a named person or the orchestrator opened the files. The contact-sheet task is person-checked.
- automated: a gate command with its exit code and a labeled summary line.
- peer-report: a peer session reply. A PM relay is a peer-report. The Forge confirmation and the PM confirmation of each folder are peer-reports.
- model pre-check: never an approval. The Forge model-judge pass of the card pictures is a model pre-check (spec facts).

A self-report closes no task. Each task note starts with `commit <sha>`. A capture counts only when its last line is `exit: <code>` and its labeled summary line is present (A4).

## 5. Phase 10 in full

### 5.0 Shorthand

`HR` means: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'set -o pipefail; <command>'`. Each heavy job (vitest, tsc, Chrome, every script run that renders) runs inside one `HR`, one job at a time, never nested, never a plain `flock`. Capture form: `HR '{ <command>; echo "exit: $?"; } > <capture> 2>&1'`. Strip ANSI before a grep: `sed 's/\x1b\[[0-9;]*m//g' <capture> | grep ...`. After a run, if `git status --porcelain pnpm-lock.yaml` shows a change, run `git checkout -- pnpm-lock.yaml`. Capture folder: `measure/runs/storytime_week_package_20261022/`.

### 5.1 Task order and owners

| # | Task | Owner | Wait gate |
|---|---|---|---|
| 0 | Commit this strategy. `phase_base_sha=$(git rev-parse HEAD)` right after the commit and before Red 1. | orchestrator | none |
| 1 | Pin the decisions S1 to S20 (section 5.2) in `spec.md` or `plan.md`. Ask the PM question Q1 (H4) if it has no answer. | orchestrator | before Red 1 |
| 2 | Red 1 | Red role | the loops Green 1 passed (R1) |
| 3 | Green 1 | Green role | Red 1 committed |
| 4 | Red 2 | Red role | Green 1 gates pass |
| 5 | Green 2 | Green role | Red 2 committed |
| 6 | Review A, B, C (one role) and the adversarial round | review roles | Green 2 gates pass; before task 7 |
| 7 | Maker: map the 32 pictures | Maker | task 6 findings fixed; R4 clean |
| 8 | Forge delivery | orchestrator and Maker | the Forge folder exists (due 2026-11-10 18:00 ICT) |
| 9 | Check: contact sheet of 51 | orchestrator | task 8 committed |
| 10 | Package build | Maker | task 9 recorded |
| 11 | Hand-off line to the PM | orchestrator | task 10 passes |
| 12 | Verification of Phase 10 | orchestrator | task 11 |

Dates (default plan): tasks 2 to 5 on 2026-11-07 to 2026-11-09 (the loops Green 1 sets the start), task 6 on 11-09, task 7 on 11-09 or 11-10, tasks 8 to 10 on 11-10 to 11-12, task 11 on 11-12. Task 7 does not wait for Forge. If Forge is late, rule H11 applies (section 5.9).

Heavy-job count (the lock queue is long): Green 1 has 4 gates and 8 mutant runs of one test file. Green 2 has 4 gates and 16 mutant runs of one test file. A mutant run covers one test file only, never `PROJECT_TESTS`. Each gate of a Green task runs once, and a second run happens only after a fix.

### 5.2 Decisions to pin before Red (defaults; the Red and Green roles do not guess)

The orchestrator pins these in the spec or plan before Red 1. The default applies when no answer arrives.

- S1 (the `ten` card, H4 and Q1). Default: the PM line (10 dots in two rows of 5). The test cases for `ten` are two separate tests (R1-3 markup, R1-10 render). A reversal by the PM then changes two tests and one constant.
- S2 (Chrome timeouts). Each test that renders gets a timeout of 90 000 ms (a single `renderFamilyCardJpeg` call). The w03 live case of Red 2 gets 240 000 ms. `RED_TEST_COMMAND` and the gates run with `--maxWorkers=1` (already in the plan). A timeout in a gate is rerun once alone under the lock. Both captures stay on record. A second timeout is a defect.
- S3 (determinism). Red 1 adds R1-11: two calls of `renderFamilyCardJpeg` for `seven` give byte-equal JPEG buffers. This is the live proof under AC10-8 for the patch and dots path.
- S4 (nothing to map). `setFamilyPictures` throws `family picture: nothing to map` when it plans 0 pictures (for example w08, or a `--partial` run where every word is skipped). `main` returns 1 and writes no file. A repeat run that plans N pictures and changes 0 bytes is a success (exit 0). Reason: A4.
- S5 (outside folders). The shipped cases read the card folder and the Forge folder from constants with the default paths of the spec. An absent folder fails the test with the message `Missing folder: <path>`. It never skips. `--cards` and `--forge` carry the paths in script runs.
- S6 (the page CSS). `familyCardPageHtml` restates the rules that the sheet CSS gives to the picture area: `* { box-sizing: border-box; margin: 0; padding: 0 }`, `.card-picture { flex: 1; width: 100%; min-height: 0; display: flex; align-items: center; justify-content: center }` with no top margin (the app picture has no label), `body` padding 4mm, `display: flex`, `flex-direction: column`, a size of 400 x 400 px, `overflow: hidden`, and the Andika face from `fontFaceCss()`. The numeral keeps `font-weight: 700` through the element style.
- S7 (render-level dot count). Red 1 adds R1-10: decode the JPEG of `one`, `nine`, and `ten` with `sharp(...).raw()`, threshold at luminance below 128, label connected components, and count the round components (width 90 to 120 px, aspect 0.9 to 1.1). The counts are 1, 9, and 10. For `ten`, the centers fall in two rows (y within 6 px) of 5 and 5.
- S8 (export names for the script). `setFamilyPictures(options: { weekFile: string; contentRoot: string; cardsFolder: string; cardRowsFile?: string; forgeFolder?: string; partial?: boolean; check?: boolean; render?: (source: PatchOrDotsSource) => Promise<{ jpeg: Buffer; quality: number }> }): Promise<{ mapped: number; skipped: string[]; lines: string[] }>`. The default `render` is `renderFamilyCardJpeg`. `main(argv)` reads the shipped paths only (`STORYTIME_ROOT`, `l2/print/card-pictures.json`) and the flags of the spec. Tests that write use `setFamilyPictures` on temporary copies. Tests of `main` cover exit code 2 (usage), `--help`, and `--check` against the shipped week with a temporary card folder (no write). In `check` mode the function returns the lines and writes nothing.
- S9 (check export). `checkFamilyPictures(week: any, contentRoot = STORYTIME_ROOT): { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string } | undefined`, exported from `check-weeks.ts`. The id is `family-pictures`. The label is exactly `The family-word pictures named in the package exist`.
- S10 (check details). Missing file: `fail`, detail `missing: <paths joined by ", ">`. No `file` (absent or an empty string): `warn`, detail `no file: <words joined by ", ">` in document order. A week with both: `fail`, detail `missing: <paths>` only (fail wins). No family word with an `image`: `undefined`. Pass: no detail.
- S11 (error text). Every H8 and H3 failure throws an `Error` whose text holds the file name and one of these rule tokens: `not in MANIFEST`, `SHA-256 differs from MANIFEST`, `not a PNG`, `not 8-bit sRGB with 3 channels`, `has an alpha channel`, `not 1500 x 1500`, `-line- name`, `no color file`, `two color files`. The module error for two Forge files starts with `family picture:`. Tests match the file name and the token (case-insensitive).
- S12 (the `--check` output). One line for each requested word, fields separated by one tab: `word`, `kind`, `source name`, `ok` or the rule token. A Forge word with no file is a failed line (`no color file`) with or without `--partial`. The exit code is 0 only when every line is `ok`.
- S13 (provenance of a skipped word). A `--partial` run keeps the existing provenance lines of words that already have a file and that the run skips. The file holds one line for each word of the week that has a file after the run, sorted by output path.
- S14 (order of the lines). The sort is by output path (`localeCompare`, as D5). The tests hold the expected word order by hand, for example w02: eight, five, four, nine, one, seven, six, ten, three, two.
- S15 (the PNG rules). The test reads `sharp(file).metadata()`: `format === 'png'`, `space === 'srgb'`, `channels === 3`, `depth === 'uchar'`, `hasAlpha === false`, 1500 x 1500. The script does not check an ICC profile. (The print FR-9 class C text is not in this strategy. The orchestrator confirms that this list equals it. See plan_updates P7.)
- S16 (hex case). `familyCardSourceName` writes the six hex digits in upper case, also when the input is lower case (`#e53935` gives `card-kit-patch-red-E53935`).
- S17 (path function). `storytimeFamilyPicturePath` throws for a word that is not `[a-z]+` (for example `Nan`, `a1`, `a/b`, `..`, an empty string), and for a week below 1 or above 99.
- S18 (escape). `familyCardPictureHtml` escapes `&`, `<`, `>`, and `"` in the word. A word `a"><script>` gives no `<script` in the output.
- S19 (tests do not name track paths). The two Phase 10 test files hold no `measure/tracks/` string (A9). They read `content/storytime/**`, the card folder, and the Forge folder.
- S20 (the existing `file` value). A week file that holds a `file` line with another value changes on that line only (FR 3). A week file that holds the same value is not rewritten (the mtime and the bytes stay).

### 5.3 Red proof (both Reds)

Common rules for Red 1 and Red 2:

- The test file reaches the new code through a path-based dynamic import with `fs.existsSync` and the message `Missing module: <path>` (the practice of `storytime-print-card-kit.test.ts` line 148). `tsc --noEmit` therefore passes before and after Green (loops F11). The check export of Red 2 is read as `(await import(...)) as any`. Each test fails inside its body.
- A test that passes at Red is a labeled characterization test (R1-1b, R1-4b, and similar). The Red log lists each one by id. The capture shows `Tests  <a> failed | <b> passed (<a+b>)`, and `<b>` equals the number of listed characterization tests. `<a>` equals the number of new tests (the Red log gives the integer K for each group). Reason: A3 and A4. A bare "fails" proves nothing.
- `git show --stat --format= <sha>` lists only the one test file. ESLint on it exits 0: `HR 'cd dashboard && npx eslint __tests__/storytime-package-raster.test.ts'`.
- The plan check `grep ' FAIL ' <capture> | grep -v storytime-package-raster` prints nothing. It is vacuous when the capture is empty or has no FAIL lines, so these positives are also required: the labeled line `Test Files  1 failed (1)` for Red 1 (and `1 failed | 1 passed (2)` for Red 2, because the raster file passes then), `Tests  <a> failed`, and the last line `exit: 1`.
- `tsc --noEmit` at the Red commit: `HR 'cd dashboard && npx tsc --noEmit'` exits 0.
- The test writes only into `os.tmpdir()`. The test never writes into `content/storytime/`. Proof: `git status --porcelain content/ dashboard/` after the Red run shows no new path except the Red file.
- Red 1 and Red 2 hold no `skip`, `todo`, `only`, or `-t` filter: `grep -cE "\b(it|test|describe)\.(skip|todo|only)" <file>` prints `0`.
- Red 2 starts only after Green 1 passed. Its capture then shows the raster file passing (`passed` count of the raster file equals its test count).

`RED_TEST_COMMAND` (plan, exact): `cd dashboard && CI=true npx vitest run __tests__/storytime-package-*.test.ts --maxWorkers=1`. Run it as `HR '{ cd dashboard && CI=true npx vitest run __tests__/storytime-package-*.test.ts --maxWorkers=1; echo "exit: $?"; } > /home/daniebo/Desktop/Workbooks/measure/runs/storytime_week_package_20261022/p10-red1.txt 2>&1'`. The capture path is absolute, because the block changes the folder. Red 2 writes `p10-red2.txt` in the same way.

### 5.4 Red 1: `__tests__/storytime-package-raster.test.ts`

Hand-written tables in the test (never imported from the code under test): the 8 patch hex values with their RGB triples, the nine dot counts and `ten: 10`, the cx list of `ten` (14, 32, 50, 68, 86 for each row), cy values 11 and 33, radius 7, view box `0 0 100 44`.

| Id | Test | At Red | Falsified when |
|---|---|---|---|
| R1-1 | Parity (H5): for each of `one` to `nine` and each of the 8 colors, `familyCardPictureHtml(input)` equals the picture element that `compileStorytimeCardSheet([{ kind: 'family-picture', label, size: 'A6', classSet: false }], 'A6').html` writes. The test cuts the element from `<div class="card-picture` to before the last `</div>` of the card div. It asserts that the cut is non-empty and starts with `<div class="card-picture` (A4). Labeled: `parity words: 17`. | fail | a changed radius, hex, gap, numeral size, or row height in the new module |
| R1-1b | Characterization: `STORYTIME_CARD_COLOR_PATCH` equals the hand hex table (8 keys), and `STORYTIME_CARD_NUMBER_DOTS` equals the hand table of nine (9 keys, no `ten`). | pass | a changed constant of `card-kit.ts` (parity cannot see it, F6) |
| R1-2 | `STORYTIME_APP_NUMBER_DOTS` has exactly 10 keys, equals the hand table, and its first nine entries equal `STORYTIME_CARD_NUMBER_DOTS`. Labeled: `keys: 10`. | fail | `ten` missing or wrong; a changed entry |
| R1-3 | `ten` markup (H4, S1): the numeral element holds `10`; there are 10 `<circle` elements with `data-number-dot="1"`; `data-row="0"` 5 times and `data-row="1"` 5 times; the cx lists and cy values equal the hand values; the view box is `0 0 100 44`; `r="7"`. | fail | 9 dots, 6 and 4, or one row |
| R1-4 | Page (H5, S6): `familyCardPageHtml` holds `#FFFFFF`, the exact text of `fontFaceCss()`, `400px`, `4mm`, and the picture markup of the same source as a substring. | fail | a missing face or background; a different picture |
| R1-5 | Escape (S18, Review B): a word `a"><script>` (kind `patch`) and `a"><script>` (kind `dots`, count 1) give no `<script` and no raw `">` in the output of `familyCardPictureHtml` and `familyCardPageHtml`. | fail | the escape removed |
| R1-6 | Names (H7, S16): `familyCardSourceName` gives `card-kit-patch-red-E53935`, `card-kit-patch-purple-8E24AA`, `card-kit-dots-ten-10`, `card-kit-dots-one-1`, and the upper-case form for the input `#e53935`. | fail | a lower-case hex; a wrong template |
| R1-7 | Render of `red`, `purple`, `one`, `ten` (H5, H6): `renderFamilyCardJpeg` gives a buffer that starts with `FF D8`; `sharp(jpeg).metadata()` gives `format: jpeg`, `isProgressive: true`, `space: srgb`, `width: 800`, `height: 800`, `chromaSubsampling: 4:2:0`, no `exif`, no `icc`, no `xmp`; the byte length is at most 153 600; `quality` is an integer from 75 to 82. One `it` for each word. | fail | 400 px output; baseline JPEG; 4:4:4; metadata kept; quality outside the range |
| R1-8 | Patch pixels (H5): for `red` and `purple`, decode to raw. The center pixel is within 12 of the hand RGB in each channel. The pixel (6, 6) is within 8 of white. The pixel (34, 34) is within 8 of white (the corner of the rounded rectangle lies outside the radius). The pixel (76, 76) is within 12 of the hand RGB (it lies inside the radius). | fail | no radius; no 4 mm padding; a wrong hex; a missing fill |
| R1-9 | Dots and white (H5): for `one` and `ten`, the pixel (6, 6) is within 8 of white. | fail | a colored page |
| R1-10 | Render-level dot count (S7): for `one`, `nine`, and `ten`, the count of round components is 1, 9, and 10. For `ten`, the two rows hold 5 and 5. | fail | a CSS that hides or resizes the dots; 9 dots; one row |
| R1-11 | Determinism (S3): `renderFamilyCardJpeg` of `seven` twice gives equal SHA-256. | fail | a time or random input in the page |

The pixel positions come from the page geometry of H5 (400 px page, scale 2, 4 mm padding = 30 px, 6 mm radius = 45 px). The Red author records the derivation in a test comment, and checks that the positions are not inside the JPEG ringing of an edge (at least 12 px from an edge). The Red log states `tests: <K>` and `characterization: <n>`.

### 5.5 Green 1: `lib/storytime/family-pictures.ts` and `renderFamilyCardJpeg`

Files: `dashboard/lib/storytime/family-pictures.ts` (new) and `dashboard/scripts/storytime/set-family-pictures.ts` (new; the render, the encode, `USAGE`, and an entry guard only; the full script follows in Green 2). The module has no file access and no browser import. JSDoc on every export. The script does not import `schema.ts` or `checks.ts`.

Gates (one `HR` each, captures `p10-green1-{green,project,lint,checks}.txt`):

1. `GREEN_TEST_COMMAND` exits 0. Red 2 does not exist yet, so the plan glob finds the raster file and `storytime-book-pictures.test.ts`. The labeled summary is `Test Files  2 passed (2)`. The tests count is the raster `K` plus the book-pictures count (the capture states both integers).
2. `PROJECT_TESTS` (with the R3 exclude when its window is open; section 2.2). Expected: F0 + 1 files (section 7). The failures allowed: only a named load timeout that passes alone on a rerun (record both).
3. `PROJECT_LINT` exits 0.
4. `PROJECT_CHECKS` exits 0 (the plan line plus the labeled count `grep -c "  FAIL "` prints `1` for the accepted `published` row at w01, or `0` if the audio and song approvals changed; the capture states the number).

Live proof: the R1-7 to R1-11 renders in the gate run are live (Chrome). A markup-only pass does not close Green 1.

Mutants (protocol: backup copy, one mutant, run only `__tests__/storytime-package-raster.test.ts` under `HR`, restore, `cmp` against the backup; a vitest run cannot import a patched copy from `/tmp`, so the mutant lives in the tree; loops F8). The log gives `mutants: <n>, caught: <n>`; captures `p10-green1-mutant-<id>.txt` end with `exit: 1`.

| Id | Mutant | Must fail |
|---|---|---|
| G1-M1 | `ten` in `STORYTIME_APP_NUMBER_DOTS` is 9 (plan mutant 1) | R1-2, R1-3, R1-10 |
| G1-M2 | one hex value in the new markup path changed (for example the `background-color` value of `red` ends in `36`; plan mutant 2) | R1-1, R1-8 |
| G1-M3 | dot radius 7 to 8 in the new module | R1-1, R1-3, R1-10 |
| G1-M4 | patch `border-radius` 6mm to 0 | R1-1, R1-8 |
| G1-M5 | `deviceScaleFactor` 2 to 1 | R1-7 |
| G1-M6 | `progressive: true` removed | R1-7 |
| G1-M7 | `chromaSubsampling: '4:4:4'` | R1-7 |
| G1-M8 | the page padding 4mm to 0 | R1-8 (the pixel (34, 34)) |
| G1-M9 | `esc` removed in `familyCardPictureHtml` | R1-5 |
| G1-M10 | the hex name in lower case | R1-6 |

A mutant that no test catches is reported by name. Do not hide it. A background mutant (white to `#FEFEFE`) is equivalent inside the tolerance of 8, and it stays out of the list.

### 5.6 Red 2: `__tests__/storytime-package-family.test.ts`

The test uses temporary copies of one week file, the card rows, a card folder, and a Forge folder. The temporary PNG files are 1500 x 1500 RGB (generated with `sharp`, solid color), listed in a temporary `MANIFEST.txt` with their real SHA-256. The logic cases inject a fake `render` (S8) that returns a small deterministic JPEG, so they need no Chrome. One live case uses the real renderer.

Hand-written 51-row table (week, word, kind, source value), copied from the spec by hand. The test asserts that its words equal the words of the shipped week files in `focus.family.words` (labeled `rows: 51`) and that the kinds count 15 card, 7 patch, 10 dots, 19 forge (labeled counts, A3).

| Id | Test | At Red | Falsified when |
|---|---|---|---|
| R2-1 | The 51-row table: `storytimeFamilyPictureSource` returns the kind (and `fileName` for card `l2-w01-card-hello-v1.png`) for each row. Inputs: the shipped `card-pictures.json` and the shipped card `MANIFEST.txt` (S5), a fake Forge set with one `v2` file per Forge word. | fail | a wrong kind for any word |
| R2-2 | H3 priority: a synthetic input where `red` has a card entry and a card file gives `patch`; `one` with a card entry gives `dots`; `friend` (no entry) and `family` (entry, no MANIFEST file) give `forge`. | fail | card before patch or dots; the card rule without the MANIFEST |
| R2-3 | Forge file names: `v10` is accepted; `v0` and `v01` are not; `ears` does not match the word `ear`; the file of another week is not used; a `-line-` file is never chosen; two color files throw `family picture:`; no file gives `fileName: undefined`. | fail | a loose glob; a prefix match; the line file chosen |
| R2-4 | `storytimeFamilyPicturePath(2, 1, 'hello')` is `l2/media/w01/family/hello.jpg`; week 10 gives `w10`; S17 throws. | fail | a wrong path; an unchecked word |
| R2-5 | Script on a copy of w01 (5 card words and `friend` as a Forge word), fake `render`: 6 JPEGs, 6 provenance lines (6 fields, tab separated, the output SHA-256 equals the file, the source SHA-256 equals the PNG, quality 75 to 82, `sharp.versions.sharp`), 6 `"file"` lines. | fail | any field wrong |
| R2-6 | The H2 diff form on the copy: the line diff has 6 deleted and 12 added lines; each changed line is a caption line with a comma added or a `"file"` line with the indent of the caption line; every caption value is the same; the file parses; `StorytimeWeekSchema.parse` gives each family `image.file`; every byte outside the family block is equal (compare the slice before the first family word and after the last one). The w01 copy holds 18 book `file` lines (F7): they are unchanged. | fail | a whole-file regex (G2-M5); a missing comma; a changed caption |
| R2-7 | H8 exit-1 cases, one test each. In each, the bad file is the last word in the processing order and the other sources are valid. The script throws with the file name and the S11 token. The temporary tree has the same SHA-256 for every file before and after (no JPEG, no provenance, week file equal): (a) a card file missing from `MANIFEST.txt`; (b) a SHA-256 that differs; (c) JPEG bytes named `.png`; (d) an RGBA PNG; (e) a 16-bit PNG; (f) a grayscale PNG; (g) a 1499 x 1500 PNG; (h) a Forge folder that holds only `l2-w01-card-friend-line-v1.png` (the line file; the error names `friend` and `no color file`); (i) two color files for `friend`; (j) a hostile `MANIFEST.txt` line with `../x.png` or a name with a space (refused, no read outside the folder). | fail | the write before the check (G2-M9); a removed rule |
| R2-8 | The line file next to a color file: a Forge folder with `l2-w01-card-friend-v1.png` and `l2-w01-card-friend-line-v1.png` gives exit 0. Field 3 of the `friend` line is the color name. `grep -c -- '-line-'` on the provenance prints `0`. | fail | a glob that picks or rejects on the line file (G2-M1) |
| R2-9 | `--partial`: with no Forge folder, the run maps 5 words, skips `friend`, prints `skip friend: no Forge file`, writes 5 JPEGs, 5 lines, 5 `"file"` lines. Without `--partial` the same input throws and writes nothing. A missing card file with `--partial` still throws (G2-M10). | fail | partial skips a card error |
| R2-10 | After R2-9, a run with the Forge folder maps all 6. The 5 earlier JPEG files and the 5 earlier provenance lines are byte-equal. A later `--partial` run without the Forge folder keeps all 6 lines and all 6 files (S13, G2-M7). | fail | the provenance written from the run only |
| R2-11 | `--check`: 6 tab-separated lines (`word`, `kind`, `source name`, `ok`), exit 0, no write. With a bad source: exit 1, the failed line holds the S11 token, no write. With `friend` missing: a failed line `no color file` and exit 1, with and without `--partial` (S12). | fail | a write in check mode; a wrong exit code |
| R2-12 | The existing `file` value: a copy where one `file` holds another value changes on that line only. A copy with the same value is not rewritten (S20). | fail | a second `"file"` line; a rewrite |
| R2-13 | Repeat run: the SHA-256 of the week file, `pictures.sha256`, and every JPEG are equal before and after (fake `render`). | fail | a time stamp or random input |
| R2-14 | Nothing to map (S4): the script on a copy of w08 throws `family picture: nothing to map` and writes nothing. `main` returns 1. | fail | exit 0 on no work |
| R2-15 | Live case, real renderer, a copy of w03 (7 patches), timeout 240 000 ms: 7 JPEGs (800 x 800, progressive, at most 153 600 bytes); provenance names `card-kit-patch-<word>-<HEX>` with the hand hex; the source SHA-256 equals the SHA-256 of `familyCardPageHtml` of that source; a second run changes no byte. | fail | the wiring from the script to the renderer; a changed hex |
| R2-16 | Usage: `main(['--help'])` returns 0; `main(['--level','2'])` returns 2; `--week 0` returns 2; `--cards` missing returns 2. | fail | a wrong exit code |
| R2-17 | The H9 check (`checkFamilyPictures`, S9, S10), four plus cases on copies of w02: all files exist: `pass`, no detail; one file missing: `fail`, detail exactly `missing: <path>`; one image with no `file`: `warn`, detail exactly `no file: <word>`; an empty `file`: `warn`; a missing file and a no-file word: `fail` with `missing:` only; w08: `undefined`; the label equals the H9 text; the id is `family-pictures`. The case reads the files from a temporary content root. | fail | warn changed to pass; fail changed to warn |
| R2-18 | Guards: the SHA-256 of the 7 shipped week files is equal before and after the run of the file (no test writes content). The file holds no `measure/tracks/` string (S19) and no `skip`. | pass (characterization) | a test that writes content |

Labeled counts for A3: the R2-5 provenance count is the integer 6; the R2-6 diff counts are the integers 6 and 12; the R2-1 row count is the integer 51. The Red log gives `tests: <K>`, `characterization: <n>`, and `tests per week: n/a`.

Blast radius grep (task line of Red 2). Run, from the repository root:

`grep -rlnE "family-pictures|focus\.family|family\.words|image\??\.file|cover\??\.file|pictures\.sha256|AX-lines" dashboard/__tests__`

Measured at `a6bad1a7`: `storytime-print-covers-16books-adversarial`, `storytime-print-covers-16books`, `storytime-manual`, `storytime-week`, `storytime-print-e4-back-list`, `storytime-print-v15`, and `storytime-book-pictures`. The measured list with the plan pattern (`image\.file`) misses `storytime-loops-content.test.ts` (it reads `image?.file` and `page.image?.file`). The new pattern finds it. The Red 2 author lists each hit with "changes" or "no change" and the reason. Known: `storytime-loops-content.test.ts` changes (`withoutNewFields` drops `focus.family.words[].image.file`; F10) and `storytime-print-v15.test.ts` changes (5 pinned lines of `w02.json` move by 10). The Maker re-runs this grep at its start (a new test file can land from another track between Red 2 and the Maker, for example `storytime-loops-share-content.test.ts` with its N5 compare). It adds each changed file to the GREEN command. The loops file belongs to another track, so rule R4 and the "no change before edit" check apply.

### 5.7 Green 2: the script and the check

Files: `dashboard/scripts/storytime/set-family-pictures.ts` and `dashboard/scripts/storytime/check-weeks.ts` (the `checkFamilyPictures` export and one push into the report, after the `book-pictures` push). `lib/storytime/family-pictures.ts` changes only if a Red 2 test shows a defect in it. Such a change is a separate commit with its own mutant run. No other file changes (scope guard, section 5.12).

Gates (captures `p10-green2-{green,project,lint,checks}.txt`):

1. `GREEN_TEST_COMMAND` exits 0 with the Red 2 `K` and the Red 1 `K` in the summary. It adds the test files of the Red 2 grep that already changed (none before the Maker).
2. `PROJECT_TESTS` (R3 exclude if open). Expected: F0 + 2 files.
3. `PROJECT_LINT` exits 0.
4. `PROJECT_CHECKS` exits 0.

Live proofs (A5; each one is a command with its output in the task line):

- `cd dashboard && npx tsx scripts/storytime/check-weeks.ts --level 2`: exit 0; `grep -cE "^  WARN +family-pictures"` prints `7`; `grep -cE "^  FAIL +family-pictures"` prints `0`; no `family-pictures` row for `st2/8`; `grep -c "  FAIL "` prints the same integer as before Green 2 (the check never adds a FAIL). This proves the wiring, which the unit test cannot prove (F8). The WARN count of the run is the old WARN count plus 7 (the capture states both integers).
- `set-family-pictures.ts --level 2 --week 1 --cards ~/Desktop/handoff/storytime-l2-card-pictures --check` on the shipped w01: exit 1 while the Forge folder is absent (the `friend` line fails with `no color file`), and 5 lines `ok`. A `--check` run writes nothing: `git status --porcelain content/` is empty after it.

Mutants (one `HR` of `storytime-package-family.test.ts` each; restore and `cmp`; log `mutants: <n>, caught: <n>`; captures `p10-green2-mutant-<id>.txt` end with `exit: 1`). The plan asks for three. The strategy asks for all of these:

| Id | Mutant | Must fail |
|---|---|---|
| G2-M1 | the Forge pattern accepts `-line-` (plan mutant 1) | R2-3, R2-8, R2-7 (h) |
| G2-M2 | the SHA-256 compare removed (plan mutant 2) | R2-7 (b) |
| G2-M3 | `warn` of H9 changed to `pass` (plan mutant 3) | R2-17 |
| G2-M4 | `fail` of H9 changed to `warn` | R2-17 |
| G2-M5 | the caption regex runs over the whole week file | R2-6 |
| G2-M6 | the caption line gains no comma | R2-6 |
| G2-M7 | provenance written from the words of this run only | R2-10 |
| G2-M8 | the provenance sort removed | R2-5, R2-10 (the hand order) |
| G2-M9 | the first write runs before the last source check | R2-7 |
| G2-M10 | `--partial` skips any missing source (not only Forge) | R2-9 |
| G2-M11 | two Forge color files pick the first | R2-3, R2-7 (i) |
| G2-M12 | the H3 order: card before patch and dots | R2-2 |
| G2-M13 | `--check` writes the files or returns exit 0 on a failed line | R2-11 |
| G2-M14 | an existing `file` value gets a second line | R2-12 |
| G2-M15 | zero planned pictures give exit 0 | R2-14 |
| G2-M16 | the alpha rule removed | R2-7 (d) |
| G2-M17 | the size rule accepts any size | R2-7 (g) |
| G2-M18 | the channel and depth rules removed | R2-7 (e, f) |
| G2-M19 | the check pushes no row in the CLI (the push removed) | live proof (7 WARN rows) |
| G2-M20 | the MANIFEST name rule accepts `../` | R2-7 (j) |

G2-M19 is caught by the live `check-weeks.ts` run, not by a unit test. The capture for it is that run with the mutant (the count of `WARN family-pictures` is 0 and the proof fails).

### 5.8 Maker: map the 32 pictures

Preconditions: Green 2 gates pass; Review and adversarial findings are fixed or accepted in the task line; `git status --porcelain content/storytime/l2 dashboard/__tests__` shows no change (rule R4); the Red 2 grep is run again and its list is recorded; the `--check` output of w01, w04, w07 (card words) and the number and patch weeks is clean.

Run (one `HR` for each week; the week order is 2, 3, 1, 4, 7):

`HR 'set -o pipefail; cd dashboard && npx tsx scripts/storytime/set-family-pictures.ts --level 2 --week <n> --cards ~/Desktop/handoff/storytime-l2-card-pictures [--partial]'`

w02 and w03 run without `--partial`. w01, w04, and w07 run with `--partial`. Each run is repeated once (capture `p10-map32-repeat.txt` holds the SHA-256 table of the 32 JPEGs, the 5 provenance files, and the 5 week files, before and after the second run).

Checks (each one prints a labeled integer; none is a bare digit match, A3):

- `cat content/storytime/l2/media/w0{1,2,3,4,7}/family/pictures.sha256 | wc -l` prints `32`. Per week: w01 5, w02 10, w03 7, w04 6, w07 4.
- AC10-3 loop for these 5 weeks exits 0 (`sha256sum -c --quiet`). Field 3: `grep -c -- '-line-'` prints `0`; `grep -c '^card-kit-patch-'` prints `7`; `grep -c '^card-kit-dots-'` prints `10`; `grep -c '\.png$'` prints `15`.
- AC10-4 (the `git show --numstat --format=` of the content commit): w01 `10 5`, w02 `20 10`, w03 `14 7`, w04 `12 6`, w07 `8 4` (insertions and deletions). The line check: `git diff -U0 <parent> <sha> -- <week file> | grep '^[+-]' | grep -v '^+++\|^---'` has only lines of two kinds: `"file": "l2/media/w0N/family/<word>.jpg"` (added) and the caption line (deleted and added with a comma added). A script `p10-diff-check.mjs` (outside the repository, in `/tmp/opencode/p10/`) checks that each added caption line equals the deleted line plus a comma. The capture prints `file lines: 32` and `caption pairs: 32`.
- `check-weeks.ts --level 2`: `PASS family-pictures` for st2/2 and st2/3; `WARN family-pictures` for st2/1 (`no file: friend`), st2/4 (`no file: family`), st2/5 (`no file: eyes, ears, nose, hands, arms, legs, feet`), st2/6 (`no file: cat, dog, bird, fish, frog, duck, horse`), st2/7 (`no file: ball, kite, drum`). Labeled: `grep -cE "^  PASS +family-pictures"` prints `2`; `grep -cE "^  WARN +family-pictures"` prints `5`; `grep -cE "^  FAIL +family-pictures"` prints `0`.
- Image facts (live): `find content/storytime/l2/media -path '*/family/*.jpg' | wc -l` prints `32`; `find ... -size +153600c | wc -l` prints `0` (the `-size +150k` of the spec means the same, rounded up in 1 KiB blocks); each file is read with `sharp` (progressive, sRGB, 800 x 800). The anchor `/family/` is required (F9: the `1-my-family` book folder).
- The scope guard (section 5.12) passes for the content commit.
- The same commit changes the test files of the Red 2 grep list. `GREEN_TEST_COMMAND` (with those files added) exits 0. `PROJECT_CHECKS` exits 0. `PROJECT_TESTS` runs at the end of the task (R3 exclude if open) and records F0 + 2 files.
- Git hygiene: `git ls-files content/storytime/l2/media | grep -cE "/family/.*\.png$"` prints `0` (no source PNG in git).

The run may rewrite tracked w01 web files (a known side effect of the book-pictures tests). If `git status --porcelain content/storytime/l2/media/w01/books` shows a change after a gate, save the files under `measure/runs/storytime_week_package_20261022/` and restore them with `git checkout -- content/storytime/l2/media/w01/books`.

Repeat-run risk (AC10-8): Chrome output is byte-stable only on the same Chrome build and fonts. If the second run changes a byte, the Maker stops and reports. It does not edit the check to hide the change. R1-11 shows this first.

### 5.9 Forge delivery

Preconditions: the folder `~/Desktop/handoff/storytime-l2-family-word-pictures/` exists with `MANIFEST.txt`. If it is absent at 2026-11-10 18:00 ICT, or fails a check below, the orchestrator asks the PM for one choice (H11). The default is: wait for Forge. Only with the PM agreement does a partial revision go first.

Checks before any run (captures `p10-forge-pre.txt`):

1. `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c --quiet -` exits 0 in the folder. The labeled count of MANIFEST lines is an integer of 19 or more. `comm` of the MANIFEST names and the PNG names in the folder prints no color file that the MANIFEST lacks (an unlisted file is reported).
2. The names. The color names match `^l2-w0[1-7]-card-[a-z]+-v[1-9][0-9]*\.png$`. The expected 19 words are w01 friend; w04 family; w05 eyes, ears, nose, hands, arms, legs, feet; w06 cat, dog, bird, fish, frog, duck, horse; w07 ball, kite, drum. The check prints `forge words with one color file: 19` and `forge words with 0 or 2 or more: 0`. Line-art files (`-line-`) in the folder are ignored by the matcher and listed in the capture. A word with only a line-art file counts as missing.
3. The PM confirmation of the H3 and H8 names (sent on 2026-11-07), or the names that Forge used, is recorded in the task line. Another name form needs a spec amendment of H3 and H8 first (review F5), before the first run.
4. A model pre-check of the color rule: for each of the 19 files, the mean saturation (HSV) is above a hand-set floor that the card color pictures also pass (the Maker measures the 15 card pictures and sets the floor at half of their minimum). The result is a model pre-check, not an approval. The person check (section 5.10) decides.

Run: `--check` for w01, w04, w05, w06, w07 with `--forge <folder>` (capture `p10-forge-check.txt`; `ok lines: 34` for the 34 words of these 5 weeks (6+7+7+7+7), `non-ok lines: 0`, exit 0). Then the script for each of the 5 weeks (the w01, w04, w07 weeks keep their 5, 6, and 4 earlier lines; S13), then a second run. The commit holds the content and the shipped case added to `storytime-package-family.test.ts` (R2-19 below).

R2-19 (the shipped case, added in this commit, passes when added): for each of the 7 weeks, each family word with an `image` has `file` matching `^l2/media/w0[1-7]/family/[a-z]+\.jpg$`; the file exists; it is a progressive JPEG, sRGB, 800 x 800, at most 153 600 bytes (labeled: `files: 51`, `bytes over limit: 0`); the provenance has 51 lines in total; each output SHA-256 equals the file; for the 34 `.png` sources, the source SHA-256 equals the MANIFEST line (card folder or Forge folder; S5); the 7 and 10 special lines carry the `card-kit-` names. The case reads shipped files and outside folders. It is an artifact test of committed content plus a live read of the folders. It holds no `measure/tracks/` string.

Done-when checks (all labeled):

- AC10-1: the node command of the spec prints exactly `51/51` (the capture is compared with `^51/51$`).
- AC10-2: `find content/storytime/l2/media -path '*/family/*.jpg' | wc -l` prints `51`; the oversize count prints `0`.
- AC10-3: the `sha256sum -c` loop exits 0 for the 7 weeks; `cat l2/media/w0*/family/pictures.sha256 | wc -l` prints `51`; `grep -c -- '-line-'` prints `0`; `grep -c '^card-kit-patch-'` prints `7`; `grep -c '^card-kit-dots-'` prints `10`; `grep -c '\.png$'` prints `34`. All greps count field 3.
- AC10-4 for the Forge commit: w01 `2 1`, w04 `2 1`, w05 `14 7`, w06 `14 7`, w07 `6 3` (insertions and deletions of this commit). Together with the Maker commit, the sums per week are `2N N`.
- The second run changes no SHA-256 (the capture holds the before and after tables of the 34 files of the 5 weeks).
- AC10-5: `check-weeks.ts --level 2`: `grep -cE "^  PASS +family-pictures"` prints `7`; `grep -cE "^  (WARN|FAIL) +family-pictures"` prints `0`; no row for st2/8.
- `GREEN_TEST_COMMAND` (with R2-19) and `PROJECT_CHECKS` exit 0. `PROJECT_TESTS` runs at the Verification task.

Forge late (H11). The partial counts are: w01 5 of 6, w02 10, w03 7, w04 6 of 7, w05 0, w06 0, w07 4 of 7. The partial revisions are w01 r3, w02 r2, w03 r2, w04 r2, and w07 r2. The package-build count loop (section 5.11) uses these integers. The full set later uses the next revision numbers (w01 r4, w04 r3, w05 r2, w06 r2, w07 r3), each with its own "Changed since" section. Both builds use the same checks.

### 5.10 Check: the contact sheet of 51 (person-checked)

The orchestrator makes the contact sheet with a script outside the repository (`/tmp/opencode/p10/contact.mjs`, `sharp` composite). Keep scripts and sheets outside `content/`. The sheet is in `measure/runs/storytime_week_package_20261022/p10-contact/`. It has one tile for each of the 51 words, in the table order of the spec, with the week, the word, and the source kind under each tile. A second pass puts each of the 34 PNG-based tiles next to its source PNG (a thumbnail), so the orchestrator compares the JPEG with its source.

The orchestrator opens the sheet (the `read` tool shows the image) and writes the result of each of the 51 in the task line: the word, `ok` or the fault. The faults to look for:

- the wrong word or object (the picture does not show the word);
- line art or a gray picture instead of color (a Forge file with the wrong kind);
- the wrong dot count (the `ten` card has 10 dots in two rows of 5; the nine cards of `one` to `nine` have 1 to 9 dots);
- the wrong patch color (compare with the hex value in the label);
- a cut or a crop that hides the main object at 800 x 800 (the app crops to 96 x 96 with `object-cover`, so the center must hold the object);
- a letter, number, or word inside a card or Forge picture (the card prompts say "no letters, words, or numbers");
- a very different style from the 15 card pictures.

The result for the 15 card pictures is a person check of files that carry only a model-judge pass. The MANIFEST says "No person review yet. Workbooks checks the cards." This task is that check. A fault goes to the PM as a Forge or card redo request. It does not stop the other 50. The task closes with one line for each of the 51. The line "all ok" alone closes nothing (A5). Evidence class: person-checked. It is not owner-approved; Daniel sees the files on 2026-11-16 (H10).

### 5.11 Package build and the MANIFEST check

Build the 7 folders from the commit that holds all 51 `"file"` lines (or the partial set of H11). Names: `w01-storytime-app-package-r3`, and `w02-storytime-app-package-r2` to `w07-storytime-app-package-r2`, under `~/Desktop/handoff/`. The previous folders are `w01-storytime-app-package-r2` and `w02-storytime-app-package` to `w07-storytime-app-package`. The build reads files from `git show <sha>:<path>`, not from the work tree. The work tree can hold an uncommitted edit of another track (rule R4).

Before the build, the Maker records the tree hash of each previous folder: `find <folder> -type f -exec sha256sum {} + | sort | sha256sum`. After the build, the same command gives the same value (no existing folder changes; hand-off README rule 5). Capture: `p10-handoff-check.txt`.

Checks for each folder `F` with previous folder `P` and the commit `<sha>` (the capture prints one labeled line for each check and each folder; a missing line is a failure):

1. `cd F && grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c --quiet -` exits 0. The count of such lines equals `find F -type f ! -name MANIFEST.txt | wc -l` (no unlisted payload file; the count is above 0).
2. `cmp F/l2/w0N.json <(git show <sha>:content/storytime/l2/w0N.json)` exits 0.
3. Every payload file that is a family JPEG or `family/pictures.sha256` equals `git show <sha>:<path>` (`cmp`). The MANIFEST SHA-256 of each family JPEG equals the output SHA-256 in `family/pictures.sha256` (`join` on the path; 0 differences, N rows).
4. `grep -c '^# Changed since ' F/MANIFEST.txt` prints `1`, and the header line equals `# Changed since <P name>:` exactly.
5. The "Changed since" list equals the list of paths whose SHA-256 differs between the MANIFEST of `P` and the MANIFEST of `F` (`join -a1 -a2` of the two sorted `path sha` lists, with a sentinel for a missing side). The capture prints `changed paths expected: <n>` and `listed: <n>` and `diff lines: 0`. For a new file, the old line is `#   old-sha256: ` with nothing after the space (`grep -c '^#   old-sha256: $'` equals the number of new paths: N family JPEGs plus `family/pictures.sha256`; w01 r3 gives 7, w02 r2 gives 11). The count of `^#   new-sha256: $` is `0` (no removed file).
6. The family count of each folder: the loop of the plan (review F3) prints nothing: `for p in 01:r3:6 02:r2:10 03:r2:7 04:r2:7 05:r2:7 06:r2:7 07:r2:7; do IFS=: read n r c <<< "$p"; test "$(grep -c "^[0-9a-f]\{64\}  l2/media/w$n/family/[a-z]*\.jpg$" ~/Desktop/handoff/w$n-storytime-app-package-$r/MANIFEST.txt)" -eq "$c" || echo "w$n: family count differs"; done`. Also `grep -c "^[0-9a-f]\{64\}  l2/media/w$n/family/pictures.sha256$"` is `1`. The loop's sum is 51 (the capture prints `family files in folders: 51`). A partial set uses the integers of 5.9.
7. `source-commit:` and `workbooks-commit:` hold the same 40-hex value, and `git merge-base --is-ancestor <value> HEAD` exits 0. Lines `date:` and `sender:` are present. The MANIFEST holds `source-repo:` and `source-path:`.
8. Path rules: `find F -type f | sed "s|^F/||" | grep -vcE '^[A-Za-z0-9._/-]+$'` prints `0`; no path is longer than 200 characters (`MEDIA_PATH_MAX`); no segment is `.` or `..`. Each `image.file` value of the week file (family and book) matches the receiver pattern `^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$`.
9. Completeness proxy for the receiver: every string value of the week file that ends in a media extension of the receiver list (`mp3|wav|m4a|aac|ogg|opus|mp4|m4v|webm|mov|jpg|jpeg|png|webp|gif|svg|pdf`) exists in `F`. The known local-only file `l2/media/w01/song-phone-poster.jpg` is in the previous w01 folder, so the new folder holds it too. The Maker lists any other string that has no file.

Do not run the Monorepo receiver. A script run in another repository can write there. The PM checks each folder against the A-42 field contract. Facts changed: none.

### 5.12 Scope guard (for each commit of the phase)

Run `git show --name-only --format= <sha>`. The list must lie inside the row of the task. Labeled output: `files: <n>` and `outside: 0`.

| Commit | Allowed paths (full match) |
|---|---|
| Red 1 | `dashboard/__tests__/storytime-package-raster.test.ts` |
| Green 1 | `dashboard/lib/storytime/family-pictures.ts`, `dashboard/scripts/storytime/set-family-pictures.ts` |
| Red 2 | `dashboard/__tests__/storytime-package-family.test.ts` |
| Green 2 | `dashboard/scripts/storytime/set-family-pictures.ts`, `dashboard/scripts/storytime/check-weeks.ts` (and `lib/storytime/family-pictures.ts` only in a separate fix commit) |
| Maker | `content/storytime/l2/w0[1-7].json` (the weeks that the run touched), `content/storytime/l2/media/w0[1-7]/family/[a-z]+\.jpg`, `content/storytime/l2/media/w0[1-7]/family/pictures.sha256`, and the test files of the Red 2 grep list (named in the task line) |
| Forge | the same content paths, and `dashboard/__tests__/storytime-package-family.test.ts` |
| plan commits | `measure/tracks/storytime_week_package_20261022/plan.md` and the captures of this track |

The command: `git show --name-only --format= <sha> | grep -vE '^(<alternation of the allowed paths>)$'` prints nothing, and `git show --name-only --format= <sha> | wc -l` prints the expected count (labeled). The anchored pattern `/family/[a-z]+\.jpg` avoids the book folder `1-my-family` (F9). Never in a commit of this phase: `dashboard/lib/storytime/schema.ts`, `dashboard/lib/storytime/checks.ts`, `dashboard/lib/storytime/print/**`, `dashboard/raw.json`, `video/**`, any Monorepo path. `schema.ts` and `checks.ts` hold uncommitted loops work now. The print card kit (`card-kit.ts`) and `print-fonts.ts` do not change (blast radius): `git diff <phase_base_sha>..HEAD -- dashboard/lib/storytime/print/card-kit.ts dashboard/lib/storytime/print/print-fonts.ts` is not the proof, because the print track edits them. The proof is the per-commit list above.

### 5.13 Anti-pattern coverage

`measure/anti-patterns.md` holds A2 to A7, A9, and A10 as live entries (A1 and A8 are retired; no entry from A11 up).

| Entry | Phase 10 risk | Defense and falsification |
|---|---|---|
| A2 consent-blind publish | The phase changes `file` lines in a published week (w01) and in drafts. It must not change an approval or `meta.status` (H10). | R2-6 and the content commit assert that every byte outside the family block is equal. The per-commit `git diff` shows no `approval` or `status` line. `check-weeks.ts` keeps the `published` detail unchanged (the PROJECT_CHECKS command counts only that FAIL). Falsified by any changed approval line. |
| A3 digit-only labeled count | AC10-1 to AC10-3 count files and lines. | Every count carries a label in the capture (`files: 51`, `rows: 51`, `file lines: 32`). The `51/51` output is matched with `^51/51$`. A grep for a bare digit is not a proof. |
| A4 vacuous pass on nothing done | `--partial` can skip all words; a mapped count can be 0; a gate can pass with no test file; a `grep -v` filter can print nothing on an empty capture. | S4 (exit 1 on zero planned pictures, R2-14, G2-M15). The Red proof asks for the labeled `Test Files` and `Tests` lines and the exact failed count. The `-t` filter and `skip` are banned. `--check` with no Forge file fails (S12). The check returns `undefined` only when no family word has an `image` (R2-17). The Forge check counts 19 words, not "no error". |
| A5 false-claim text vs test reality | Plan lines will say "check pass" or "51/51". | Each claim cites a capture with `exit:` and the labeled line. The plan evidence quotes the command and its last line. |
| A6 registry-note overstatement | The registry or plan can say "pictures done" while the contact check or Daniel's check is open. | The contact-sheet task is `person-checked`, not `owner-approved`. The phase closes with the owner items on the PM's 11-16 list (H10). |
| A7 over-broad filter | The R3 exclude; the scope guard regex; the `family/` path match. | The exclude evidence in section 2.2 (the excluded name 0 times, the sibling name 1 or more). The scope guard uses full-match patterns. All path greps anchor on `/family/` (F9). No filter uses a bare English word. |
| A9 test names an archived track path | The tests could read `measure/tracks/**`. | S19: no `measure/tracks/` string in the two test files (`grep -c` prints `0`). The card folder and Forge folder paths are `~/Desktop/handoff/...`. When that hand-off folder is archived, the shipped case (R2-19) fails with `Missing folder`. The Verification task writes this dependency into `measure/tech-debt.md` (plan_updates P8). |
| A10 generated-facts drift | `measure/generated/` can drift after a track-file change. | The orchestrator runs the project check that its workflow names after the plan commit. This phase changes no structure. No test depends on it. |

### 5.14 Artifact tests and live tests

Artifact tests read committed files and do not run code that renders: R1-1b, R1-2, R1-6 (name strings), R2-1 to R2-4 (pure functions on committed data), R2-18, R2-19 (committed JPEGs and provenance), the scope guard, the `git show` and `cmp` checks, the MANIFEST checks of 5.11, and the AC10-1 to AC10-3 commands.

Live tests run code: R1-1 and R1-3 to R1-5 (markup built now), R1-7 to R1-11 (Chrome), R2-5 to R2-17 (the script on copies), R2-15 (Chrome through the script), every mutant run, `check-weeks.ts` (the wiring), the Maker and Forge runs, and the repeat runs.

An artifact pass does not prove live behavior. Phase 10 closes only with both: the Green gates (live), the Maker and Forge runs with their repeat runs (live), the shipped case (artifact), the MANIFEST checks (artifact), and the contact sheet (person-checked). The model-judge pass of the card pictures and the saturation pre-check are model pre-checks. They approve nothing.

### 5.15 Intentionally red

- `RED_TEST_COMMAND` is red from the Red 1 commit to the Green 1 commit, and from the Red 2 commit to the Green 2 commit. No push happens in these windows (rule R1).
- `PROJECT_TESTS` of every track is red in the same windows (section 2.2). `GREEN_TEST_COMMAND` of Phase 10 is red from the Red 2 commit to the Green 2 commit.
- `check-weeks.ts --level 2` shows 7 `WARN family-pictures` rows from Green 2 to the Maker commit, 2 PASS and 5 WARN from the Maker commit to the Forge commit, and 7 PASS after it. It never shows a FAIL row for this check. The `published` FAIL of st2/1 is the known row of the other tracks; this phase does not change it.
- No test is committed red apart from the two Red files above. The full dashboard suite has 3 known failing tests (tech-debt 2026-09-30); `PROJECT_TESTS` does not include them.

### 5.16 `phase_base_sha`

The orchestrator runs `git rev-parse HEAD` right after the commit of this file lands and before the Red role of Phase 10 starts. This file embeds no SHA for that purpose. The role base `a6bad1a7` is not the phase base. Commits of other tracks can land between the capture and Red 1 (rule R1), so the orchestrator also records `red_base=$(git rev-parse HEAD)` right before each of the two Red roles, and uses it as `--baseline` of the role gate.

## 6. Earlier phases (outline, one line each)

- Phases 1 and 2 (package schema and checks; manual template): accepted. No new test work.
- Phase 3 (hand-off of the first commit) and Phase 4 (week 1 content): open items stay with the owner (Daniel's checks). No new test work.
- Phases 5 and 6 (book audio; song-line pictures): in progress by their own tasks. No new test work from this file.
- Phase 7 (week 1 book pictures; checkpoint `efd94c3`) and Phase 8 (cloud-review fixes; checkpoint `df98fbc`): accepted.
- Phase 9 (weeks 2 to 7 book pictures): the maker work is done. The hand-off task and the verification task stay open (PM confirmation). Phase 10 revisions follow the Phase 9 folders (spec amendment under E5).

## 7. plan_updates (recommended; the orchestrator decides)

- P1. Add a line to the Phase 10 section: "Strategy: `test-strategy.md` (2026-11-07). `phase_base_sha` is captured right after its commit." Add a task line "Pin S1 to S20" before Red 1 (owner: orchestrator).
- P2. H15 names three checkers (the spec review, the contact-sheet check, the PM check of each folder). The strategy adds one review role (Reviews A, B, C in labeled sections) and one limited adversarial round, both after Green 2 and before the Maker task (section 3). Add the two task lines, or remove them (default: keep both; cut the adversarial round first).
- P3. In the Red 2 task line, replace the grep pattern with `grep -rlnE "family-pictures|focus\.family|family\.words|image\??\.file|cover\??\.file|pictures\.sha256|AX-lines" dashboard/__tests__` (F10: the plan pattern misses `storytime-loops-content.test.ts`). Add: "The Maker re-runs this grep at its start."
- P4. Add the rule R4 (section 2.3) to the rule paragraphs of Phase 10, and add "one message to the print and loops sessions at each window open and close" to rule R1 (section 2.1, 2.2).
- P5. In the Green 2 task line: replace "three mutants" with the 20 mutants of 5.7 (the three plan mutants are G2-M1 to G2-M3). In the Green 1 task line: the 10 mutants of 5.5 (the two plan mutants are G1-M1 and G1-M2). Add the live proof lines of 5.7 (7 WARN rows; the `--check` run on w01).
- P6. In the Red 1 task line, add R1-10 (the render-level dot count) and R1-11 (determinism). They are not in spec FR 6. Spec FR 6 is amended by S3 and S7.
- P7. Add the pins S8 to S20 (export names, error tokens, `--check` form, check details) to the spec FR 2 and FR 5. The Red author needs the names. The H8 PNG rules (S15) need the orchestrator's comparison with the FR-9 class C text of the print spec.
- P8. In the Verification task: add "write the A9 dependency (the shipped case reads `~/Desktop/handoff/storytime-l2-card-pictures/` and `.../storytime-l2-family-word-pictures/`) into `measure/tech-debt.md`", and "write the lesson: a vacuous grep (`image\.file` missed `image?.file`) into `measure/lessons-learned.md`".
- P9. In the Forge delivery task: add the pre-checks of 5.9 (steps 1 to 4), the `ok lines: 34` label, and the partial counts for H11 (5, 10, 7, 6, 0, 0, 4).
- P10. In the Package build task: replace the done-when by the nine checks of 5.11 (the capture `p10-handoff-check.txt` prints each labeled line) and add the tree-hash proof that no previous folder changed.
- P11. Add the scope guard (5.12) to each commit task as "Done when: `outside: 0`".

## 8. Baseline of `PROJECT_TESTS`

Method: no new full run. A nearby run with the same test files exists, so this strategy cites it. Between `96659ea3` and `a6bad1a7`, no committed file of `dashboard/` or `content/` changed (`git diff --stat 96659ea3 HEAD -- dashboard content` prints nothing). The uncommitted loops edits are the only difference. No file named `storytime-package-*` exists, so the run held 0 Phase 10 files (`grep -c "storytime-package"` of the capture prints `0`).

Citation 1 (current): the loops Phase 3b Green 1 run. Capture: `measure/runs/storytime_teaching_loops_20261103/jr-green-p3b-96659ea3-project.txt`. Command: `PROJECT_TESTS` of the print and loops plans (the Phase 10 form adds `--maxWorkers=1`). State of the tree at the run: HEAD `96659ea3` with the uncommitted loops Green 1 edits in `dashboard/lib/storytime/schema.ts` and `checks.ts` (they are still uncommitted at `a6bad1a7`). Red window state: the loops Phase 3b window was open (Red 1 `ffe6e74a` committed, Green 1 running). Result: exit 1; `Test Files  1 failed | 58 passed (59)`; `Tests  1 failed | 1253 passed (1254)`; start 03:56:43 on 2026-11-07; duration 937.44 s. The one failure: `storytime-print-weeks-2-8.test.ts` R-P7-3, `Test timed out in 5000ms`. The rerun of that file alone (`jr-green-p3b-96659ea3-project-rerun.txt`) exits 0 with 1 file passed. The 59 files include the loops Red 1 file `storytime-loops-share.test.ts`, which passes with the Green 1 edits.

Citation 2 (older): the loops strategy run at `0e632495` (`strategy-p3b-0e632495-baseline.txt`): exit 1; `Test Files  6 failed | 52 passed (58)`; `Tests  7 failed | 1223 passed (1230)`. The 7 failures were print timeouts and Chrome launch timeouts under load. Commit `4ffdbdca` raised those timeouts. Citation 1 shows 1 remaining load failure of that kind. The loops strategy 9.17 holds the same data.

Use for Phase 10:

- F0 = the file count at the start of Red 1: 59 when the loops Green 1 is committed (58 plus the loops Red 1 file), and 58 plus any other committed file. The orchestrator records F0 from the capture of the loops Green 1 commit, or by `ls dashboard/__tests__/storytime-*.test.ts dashboard/__tests__/covers-*.test.ts dashboard/__tests__/print-pdfx.test.ts | wc -l` (59 at the time of writing).
- Expected after Green 1: F0 + 1 files. Expected after Green 2: F0 + 2 files (61 at the time of writing). Expected tests after Green 2: 1254 plus the `K` values of the two new files.
- The allowed red in a Phase 10 gate: one named load timeout that passes alone on a rerun (record both captures). Any other failure blocks the gate.
- The F0 of the loops strategy (58) changes when a Phase 10 Green lands. Section 2.2 gives the message to the loops session.
- The run takes about 940 s plus the lock wait. A gate that is not in the table of 5.1 does not run `PROJECT_TESTS`.
