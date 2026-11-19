# Test strategy: primary_v2_look_20261020

## Scope and base

Track: `primary_v2_look_20261020`. This file holds the risk-based test strategy for Phase S4. S4 gives the 13 printed steps their app names in the `chibi-quest` look. S4 changes static print text only. It does not change a route, a flag, or the `look` option of S1.

No earlier phase has a strategy file in this track. This file opens the record with S4.

**phase_base_sha capture point.** After the commit of this strategy file lands, the orchestrator captures `phase_base_sha = $(git rev-parse HEAD)` at once. This capture is immutable for the phase. Do not use the SHA in the role brief (`d42e36b0`); that commit predates this strategy. If the strategy is refreshed, capture the base again after the newest strategy commit. The Red test file, the Green code, and every gate run judge the diff from that captured base.

## Phase S4: App step names in the v2 books

**Risk classification: medium.** The change touches a template that every book prints. A wrong name or a cross-look leak would ship in a printed book. The change adds no input, no route, and no rendering logic. Tests assert exact strings and byte identity, so the risk is bounded.

### Owned scope (from plan.md)

- S4.1 (done, plan text only): the step-name table and its source lines.
- S4.2 (Red): new file `dashboard/__tests__/chibi-quest-step-names.test.ts`.
- S4.3 (Green): the 13 `h2.section-title` strings in `dashboard/templates/primary_template.html`, gated by the `chibi_quest` flag; the `Key Vocabulary` heading in `dashboard/lib/document-wrapper/sections/teacher-guide.ts`; the one-line look pass in `dashboard/lib/workbook-document-wrapper.ts` line 98. No change in `dashboard/lib/teacher-manual/`.
- Phase gates: Reviews A and B, one adversarial round, phase acceptance, and the checkpoint.

### Top risks

1. The classic golden files `content/primary/origins-3.2/print/golden/lesson-05.html` and `lesson-05-no-key.html` must stay byte-identical.
2. Step 6 keeps its ` – {{grammar_search_term}}` conditional in both looks (template line 1806).
3. Steps 9, 10, and 11 keep their printed names: Vocabulary Practice, Sentence Practice, Guided Writing. No single app step maps to them.
4. `dashboard/lib/teacher-manual/` stays pinned. `i18n/en.ts` and `app-section.ts` keep the classic step names and the STEP_MAP.
5. The answer key and the in-book teacher pages also change by look. `Multiple Choice:` and `Short Answer Hint:` stay; `Key Vocabulary` becomes `Preview Vocabulary` only for `chibi-quest`.
6. The TOC lists lesson titles only. It holds no step name and must not change.

### Targeted Red command

Every heavy command uses one wrapper. Do not nest wrappers.

```
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-step-names.test.ts'
```

Red condition: the new file exists and compiles. It fails only on the new step-name assertions. The golden byte-identity, classic-name, and pinned-i18n assertions pass at Red, because they protect present behavior. A Red that fails on a syntax error or a missing import is not a valid Red. Exit 75 from the wrapper means the pre-flight hold outlasted its wait; rerun, and do not record a pass.

### Green gate

Run four commands. Each command uses one heavy-run wrapper, never nested.

- `GREEN_TEST_COMMAND`: the targeted vitest command above. It must exit 0.
- `PROJECT_TESTS`: `set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts`. It must exit 0 apart from the recorded earlier failures below.
- `PROJECT_LINT`: `set -o pipefail; cd dashboard && npx eslint lib/document-wrapper/sections/teacher-guide.ts lib/workbook-document-wrapper.ts __tests__/chibi-quest-step-names.test.ts --no-error-on-unmatched-pattern`. It must exit 0. eslint does not lint the `.html` template; the tests cover the template text.
- `PROJECT_CHECKS`: `set -o pipefail; cd dashboard && npx tsc --noEmit`. It must exit 0.

Each new rule must have a mutant that a named test catches. Record the mutant, the catching test, and the exit code in the run log.

### Closeout gate

The phase acceptance role runs on the head after S4.3. Gates: `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` exit 0, and `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0 in heavy-runs. The role states the exit code of each gate. It writes `measure/runs/primary_v2_look_20261020/phase-acceptance-s4-<sha8>.json` with PASS and 0 open blockers. It records that result file in `plan.md`. The checkpoint commit and its git note then follow the workflow protocol. If any gate other than the recorded earlier failures exits non-zero, the closeout gate fails.

### Fixtures, mocks, and live-behavior proof

- Fixture A, lesson render: `content/primary/quest-5/l01.json`. Parse it with `LessonPackageSchema`, build it with `buildWorkbookLesson`, then render it with `renderMultipleLessons(..., { type: 'primary', look: 'chibi-quest' })`. This is the render route of `chibi-quest-kit.test.ts`.
- Fixture B, byte identity: the two golden files under `content/primary/origins-3.2/print/golden/`.
- Fixture C, book document: `wrapWorkbookDocument` with `look: 'chibi-quest'`, `tocEntries`, `answerKey`, and a `teacherGuide` entry.
- Fixture D, pinned text: `dashboard/lib/teacher-manual/i18n/en.ts` and `dashboard/lib/teacher-manual/app-section.ts`.
- Mocks: none. The render functions are pure string builders. No network, database, or timer mock is needed.
- Live-behavior proof: none in S4. All assertions are on produced HTML strings or on source bytes. No browser, no PDF render, and no font check. Visual proof of the printed names belongs to S5 page proofs. The S3 print-kit review already covered the visual CSS.

### Artifact tests and live behavior tests

Every S4 test is an artifact test. It reads a static input or a source file and compares HTML strings or bytes. No test starts a server, opens a browser, rasterizes a page, or checks a font. Do not record an artifact test as live-behavior proof. The byte identity of the classic golden is the strongest output guard, and it remains a string comparison.

### Architecture guardrails and changed-contract risks

- The `chibi_quest` flag comes from `dashboard/lib/template-renderer.ts` line 148 (`options.look === 'chibi-quest'`). The template must gate all 13 renamed titles on that flag. Classic output keeps the present strings.
- `generateTeacherGuideSection` has one caller: `wrapWorkbookDocument` at `dashboard/lib/workbook-document-wrapper.ts` line 98. The graph inspection confirmed the single call edge. The look passes through that one line. A second caller or a new signature would be a changed contract and needs its own test.
- `dashboard/lib/teacher-manual/` is pinned by the spec. The test reads `i18n/en.ts` and `app-section.ts` and asserts that the classic names and the STEP_MAP stay. A change there fails the test.
- `step-map.ts` is read-only in the monorepo. This repository does not edit it. The S4.1 table cites its lines and the app title lines of `messages/en.json`.
- The `look` option, its values, and the `classic` default do not change in S4. The `--look` CLI flag and the compile route of S1 stay as they are.
- A commit on `primary_template.html` triggers S7. After the golden check, send the commit id to the PM for the monorepo session.

### Intentionally-red aggregate suite

`PROJECT_TESTS` includes files from other tracks. Three tests fail at the tracked baseline `afbfcf0e` and later. They also fail at the role base:

- `dashboard/__tests__/constants.test.ts`: "includes Adventures 1.0 as a primary workbook option".
- `dashboard/__tests__/origins-thai-support.test.ts`: `origins-2-a0` and `origins-3.1-a0`.

Evidence: `measure/runs/levels_5_9_20261006/green-g2-baseline-r2.txt`. The acceptance role records these as earlier failures outside this track. The exclude of `__tests__/storytime-unit2-sound-stage.test.ts` stays until that track's Task 3.6 Green closes. Any other failure in `PROJECT_TESTS` fails the gate. Do not fix these tests in S4.

### Review gate applicability

- **Review A, correctness: applies. Lead review.** Check every name against the S4.1 table: all 13, in order, in the right look. Check the byte-identical classic output, the step 6 conditional, the steps 9 to 11 names, and the unchanged `lib/teacher-manual/`. Result file: `measure/runs/primary_v2_look_20261020/review-a-s4-<sha8>.json`.
- **Review B, security: applies, narrow.** For this template text change there is no new input and no new route. The check is that no look leaks its names into the other, and that no new string uses un-escaped lesson data. The changed teacher-guide heading is a literal; the surrounding vocabulary still passes through `escapeHtml`. Result file: `review-b-s4-<sha8>.json`.
- **Review C, route or CLI contract: does not apply. Confirmed.** No route, flag, or option changes. The `look` option of S1 is unchanged. The plan's "not applicable" is correct.
- **Adversarial testing: applies. One round.** Attack surfaces: a name misspelled; a step missed; a classic name left in the chibi-quest output; an app name leaked into the classic output; the pinned `lib/teacher-manual/` touched; the golden changed; the step 6 conditional dropped. Reuse the Green mutants. Result file: `adversarial-s4-<sha8>.json`.
- **UX and API review: does not apply in S4.** The API side of that gate is Review C, which does not apply. The UX side was covered by the S3 visual kit review. S4 changes text only.
- **Browser review: does not apply.** No dev route serves the print HTML. The HTML comes from a render function and is asserted as a string. A browser render adds no coverage beyond the artifact tests. Visual confirmation of the printed names is deferred to S5 page proofs.

Each review role from a model family other than the Red and Green families audits the head. It reports, and it fixes nothing. No open Blocker may remain at closeout.

### Anti-pattern coverage and falsification

The catalog has A2 to A10 active. A1 and A8 are retired. A2, the consent-blind publish gate, has no publish gate in S4; record it as not applicable. Each defense below has a falsification condition. A falsification condition is the specific mutant that makes the test fail.

| Anti-pattern | Defense test | Falsification condition |
|---|---|---|
| A3, digit-only as a labeled count | Assert each of the 13 exact title strings, in order. Assert the nine classic-only exact names are absent. Do not use `rg '[0-9]+'` or a bare header count. | A test that only counts 13 headers passes when names are wrong. The exact-string test fails when one name differs. |
| A4, vacuous-pass on nothing-done | Assert that the render produced 13 `section-title` headers before the absence assertions, as `chibi-quest-kit.test.ts` already does. | A test that only checks "no classic name" passes on an empty render. The length check fails on zero headers. |
| A5, false-claim text versus test reality | Run each gate command and record its real exit code. Red must fail before Green. Green must exit 0 after. | If `RED_TEST_COMMAND` exits 0 before Green, the Red claim is false. If a Green gate exits non-zero, the pass claim is false. |
| A6, registry-note overstatement | Before any "resolved" or closeout claim, read the adversarial JSON and require 0 blocking findings. | A claim of pass while `adversarial-s4-*.json` holds a Blocker is false. |
| A7, over-broad filter swallowing real hits | Check absence with exact strings for each of the nine classic names and each app-only name. Do not exclude by bare English words such as "never". | A filter that drops lines containing "Before" hides a step 1 leak. The exact-string absence check still fails. |
| A9, pre-existing test references archived track paths | The new test references live paths only. A static gate resolves each `measure/tracks/<id>/plan.md` reference and fails when that id lives in `measure/archive/`. | A test that points at an archived track dir breaks forever. The resolve gate fails. |
| A10, generated-facts drift after structural change | The S4.3 Done condition requires the `primary_template.html` commit id to go to the PM for S7, after the golden check. | A template commit with no PM handoff leaves the monorepo print output stale. The S7 gate fails. |

Mutant set for Green. Each mutant must be caught by a named test:

- Rename one of the 13 titles to a wrong string.
- Swap two adjacent titles.
- Leave one classic name in the chibi-quest output.
- Leak one app name into the classic output.
- Delete the step 6 grammar conditional.
- Change a steps 9 to 11 name.
- Alter one pinned string in `teacher-manual/`.
- Change one byte in a golden file.

Record each mutant, the test that caught it, and the exit code in the run log.

### Handoff to the orchestrator

Capture the immutable `phase_base_sha` at the commit of this file, before Red starts. Assign Review A, Review B, one adversarial round, and phase acceptance. Skip Review C, UX review, and browser review for the reasons above. Use the targeted Red command for S4.2, the four Green commands for S4.3, and the acceptance gate for closeout. Treat the three other-track failures as recorded earlier failures.

---

## Phase S5: Page proofs for Daniel

**Risk classification: medium.** No product code changes. A wrong proof sends Daniel to the wrong pages and delays the printer file due 2026-11-06. No production write happens before his approval.

**phase_base_sha capture point (S5).** The strategy commit is the commit with subject `measure(strategy): primary_v2_look Phase S5 test strategy for the page proofs`. Immediately after that commit lands, the orchestrator captures `phase_base_sha = $(git rev-parse HEAD)`. That SHA is immutable for the phase. Do not use `8b27c9ea` from the role brief; it predates the strategy commit. If the strategy is refreshed, capture the base again after the newest strategy commit. No proof file, driver, or gate run may start before the capture. This paragraph supersedes the historical S4 capture paragraph above for Phase S5.

### Inputs and what exists

- Quest 5 lesson 1 is `content/primary/quest-5/l01.json`.
- The longest Adventure 9 lesson is `content/primary/adventure-9.2/l09.json`, "The Explorers' Last Trip". Measure: English word count of the printed prose. The count uses the `text`, `bank`, `print`, and `activities` sections of a package after the Thai filter. The score is 1310 words, the highest of the 42 Adventure 9 packages. Its article paragraphs hold 476 words, the second highest. Filter evidence: `THAI_PROOF: 0 Thai characters in 42 filtered output files`.
- `primary/` holds projects for Origins 2, Origins 3.1, Origins 3.2, Quest 4, and Adventures 1.0. It holds no project for Quest 5 or Adventure 9.x. Those books exist only as packages in `content/primary/`.
- `scripts/render-lesson-html.ts` already renders packages through `renderMultipleLessons` and `wrapWorkbookDocument`. Those are the render and document functions of the compile page. The script accepts `--look`. It also derives the look from the book folder with `bookLook()`. `lib/look.ts` lists Quest 5 and Adventure 9.x in `CHIBI_QUEST_BOOKS`. Both derive `chibi-quest`.
- `make-book-pdf.ts` needs a dashboard project in `primary/`. `make-lesson-pdfs.ts` needs a key in `PRINT_BOOKS`. Neither key exists for these two books.

### Proof generation: no product code change

No new render option is needed. `--look` and `bookLook()` already work. No dashboard project is needed. `render-lesson-html.ts` reads the packages directly. PDF generation reuses `renderPagedPdf` from `lib/print/render.ts`, the function `make-book-pdf.ts` calls. The driver is a proof-only script under `measure/runs/primary_v2_look_20261020/proof-s5/`. It is not product source. It changes no template, no font, and no contract.

Red and Green do not apply to this phase. No Red file is written. No product code is committed. If the orchestrator instead wants a product CLI flag, for example `make-lesson-pdfs.ts --package`, that is a code change. It becomes a Red/Green task with a Red file under `dashboard/__tests__/`. Refresh this strategy before that work starts. That path is not the default.

Driver steps, in order:

1. Run the Thai filter as the first command that touches a package. The script drops `th` and `*_th` keys, strings with a character from U+0E00 to U+0E7F, and the part after ` | `. It writes filtered copies under `/tmp/opencode/thai-filtered/` and prints the proof line. Stop when the Thai count is not 0.
2. Render each proof HTML with the same render route as the compile page. Use one heavy-run wrapper per command. Do not nest wrappers.
   ```
   HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && npx tsx scripts/render-lesson-html.ts ../content/primary/quest-5/l01.json --out ../measure/runs/primary_v2_look_20261020/proof-s5/quest5-l01.html --look chibi-quest'
   ```
   The second command uses `../content/primary/adventure-9.2/l09.json` and output `adventure92-l09.html`.
3. Assert that each HTML holds `look-chibi-quest` on the wrapper body. A classic look fails the proof.
4. Make each Chrome PDF with `renderPagedPdf` and the Paged.js polyfill from `node_modules`. Write to a new versioned folder `~/Desktop/print-ready/primary-v2-look/proof-s5-r<N>/`. Never overwrite a fixed proof folder. Refuse a folder that already holds a different hash.
5. Rasterize every page at about 100 dpi into one contact sheet per proof. Place the app capture of the same step next to its printed page. The captures live at `/home/daniebo/Desktop/advantage-pr/assets/screenshots/primary-advantage/parity-run2-2026-10-19/student/lesson-step*.png`. Each printed step page carries the capture for that step number. Steps 9 to 11 print without one app step; label those rows with their printed names. Keep `before-restyle` and `night` captures out of the sheet. A page without a tile fails the sheet check.

Output paths:

- `~/Desktop/print-ready/primary-v2-look/proof-s5-r<N>/quest5-l01.pdf`
- `~/Desktop/print-ready/primary-v2-look/proof-s5-r<N>/quest5-l01-contact.jpg`
- `~/Desktop/print-ready/primary-v2-look/proof-s5-r<N>/adventure92-l09.pdf`
- `~/Desktop/print-ready/primary-v2-look/proof-s5-r<N>/adventure92-l09-contact.jpg`
- Driver, manifest, and check logs under `measure/runs/primary_v2_look_20261020/proof-s5/`.

### Automated proof checks

No targeted Red command exists for S5. No Green gate exists. The checks below are the automated gate. Run each through one heavy-run wrapper. Record each exit code.

| ID | Check | Falsification condition |
|---|---|---|
| P1 | `pdfinfo -box` through `parsePdfinfo`; width 595.28 pt and height 807.87 pt, slack 2 | An A4 page at 841.89 pt high fails. |
| P2 | `pdffonts`; every font embedded; no Type 3 font | A synthetic bold face listed as Type 3 fails. |
| P3 | `pdftotext`; the 13 exact names of the S4.1 table in order; the nine classic-only names absent | A swapped pair or a leftover "Before You Read" fails. |
| P4 | Labeled `Pages:` integer from `pdfinfo`; greater than 0; equal to the contact-sheet tile count | A frozen render gives a low count and fails. |
| P5 | One rasterized tile per page, about 100 dpi, paired with the matching app capture; sheet file exists | A sheet missing one page fails. |
| P6 | Thai filter proof; 0 Thai characters in filtered output; only filtered output reaches a non-Claude role | One Thai character in the output fails the run. |
| P7 | Wrapper body holds `look-chibi-quest`; no classic body class | A proof rendered in the classic look fails. |
| P8 | Manifest records git HEAD and package SHA256 | A proof from a stale package fails the identity check. |
| P9 | No `Primary-Advantage-Quest-5_PDFX-1a.pdf` under `~/Desktop/print-ready/` before approval | Its presence before the approval line fails the gate. |

### Fixtures, mocks, and live-behavior proof

- Fixtures: the two filtered packages; the app capture directory named above; the S4.1 step-name table in `plan.md`; the proof driver under `measure/runs/`.
- Mocks: none. Chrome, Paged.js, poppler, and picture download are real. A missing picture fails the proof. Do not substitute a blank image.
- Live-behavior proof: yes. S5 is the first live phase of this track. A real Chrome PDF, real font embedding, and real page rasterization form the proof. S4 was artifact-only. Do not record an artifact check as live proof.

### Artifact tests versus live behavior tests

The checks P1 to P4 and P6 to P9 read produced bytes or source text. They are artifact checks. P5 reads rasterized pages; it is live proof. Daniel's look of the sheets is a human gate, not a test. Record his notes and date in `plan.md`.

### Architecture guardrails and changed-contract risks

- `bookLook()` in `lib/look.ts` lists both book folders. If a folder is removed, the look falls back to classic. Pass `--look chibi-quest` and assert P7.
- `render-lesson-html.ts` sets `mediaBase` from the package path. Keep the packages in `content/primary/<book>/`. Moving them breaks picture URLs; P1 and P5 fail.
- Paged.js can freeze on a dropped animation frame (lessons-learned, 2026-08-03). `renderPagedPdf` sets a 900 s timeout. P4 catches a low page count. Rerun once. If it freezes again, stop and report.
- The classic CSS uses `!important` rules (lessons-learned, 2026-10-20). A CSS check passes while the PDF hides text. Only the contact sheet and Daniel's look prove visibility.
- A fixed output folder can overwrite an approved proof (lessons-learned, 2026-10-30). Use a new versioned folder and refuse a hash mismatch.
- `pdftotext` drops Thai tone marks in PDF/X (lessons-learned, 2026-10-02). These proofs are Chrome PDFs. Thai correctness is the filter proof plus Daniel's reading.
- No product source, golden, or pinned path changes. S7 is not triggered.

### Intentionally-red aggregate suite

S5 adds no vitest file and no Red command. If the orchestrator runs `PROJECT_TESTS` as a regression guard, three earlier failures stay: `constants.test.ts` "includes Adventures 1.0 as a primary workbook option", and `origins-thai-support.test.ts` cases origins-2-a0 and origins-3.1-a0. The exclude of `__tests__/storytime-unit2-sound-stage.test.ts` stays. Evidence: `measure/runs/levels_5_9_20261006/green-g2-baseline-r2.txt`. Do not fix these tests in S5. Any other failure fails the gate. The `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` of the top gate block do not apply to this phase.

### Review gate applicability

- **Review A, correctness: applies. Lead review.** Check the two input packages, the chibi-quest look, the 13 names in S4.1 order, the page and font checks, and the pairing of each printed page with its app capture. Result file: `measure/runs/primary_v2_look_20261020/review-a-s5-<sha8>.json`.
- **Review B, security: applies, narrow.** The driver downloads pictures and writes outside the repository. Check that only filtered input reaches a non-Claude role, that no proof file lands inside the repository, and that a fixed-name overwrite is refused. No new product input path exists. Result file: `review-b-s5-<sha8>.json`.
- **Review C, route or CLI contract: does not apply.** No route, flag, or option changes. `--look` and `bookLook()` already exist.
- **Adversarial testing: applies. One round.** Attack surfaces: a wrong lesson chosen; a classic look; A4 instead of the book page; a missing or reordered step name; a classic name left in; a Thai leak; a page without a contact-sheet tile; a capture paired with the wrong step; a stale PDF after a package edit; a printer file made before approval. Result file: `adversarial-s5-<sha8>.json`.
- **UX and API review: UX applies and is required (UX_REQUIRED).** The API side is Review C and does not apply. This phase judges printed pages against app captures. String checks cannot judge a visual match. The role records screenshots of each sheet and the paired capture. If the browser tool is unavailable, report `webbridge_status: not_run` with the reason. Daniel's gate stays binding.
- **Browser review: applies (UX_REQUIRED), for the same reason.** It audits the proof HTML and contact sheets, not a dev route.

Each review role from a model family other than the Red and Green families audits the head. It reports; it fixes nothing. No open Blocker may remain at closeout.

### Anti-pattern coverage and falsification

A1 and A8 are retired. The active classes are A2 to A10. Each defense below names the check above and its falsification condition.

| Anti-pattern | Defense in S5 | Falsification condition |
|---|---|---|
| A2, consent-blind publish gate | P9. The proof-to-printer step needs Daniel's dated approval in `plan.md`; S6 stays blocked. | A printer PDF exists before the approval line. The gate fails. |
| A3, digit-only as a labeled count | P1 and P4 parse labeled integers from `pdfinfo`; never `rg '[0-9]+'`. | A date passes a bare digit regex. The labeled parse fails on a wrong count. |
| A4, vacuous-pass on nothing-done | P4 asserts `Pages:` greater than 0 before the absence assertions of P3. | An empty PDF passes "no classic name" but fails `Pages: 0`. |
| A5, false-claim text versus test reality | Record the real exit of each check P1 to P9; write "all checks pass" only when all exit 0. | A recorded non-zero exit with a pass claim is false. |
| A6, registry-note overstatement | P9 and plan text: no approval claim before the dated approval note. | An approval claim without the dated note is false. |
| A7, over-broad filter swallowing real hits | P6 uses the U+0E00 to U+0E7F class and exact step strings; no bare English filter tokens. | A filter that drops a line holding "never" hides a classic-name leak. P3 fails. |
| A9, pre-existing test references archived track paths | The driver and this strategy name live paths only. A static check resolves each `measure/tracks/<id>` reference. | A reference to `measure/archive/<id>` fails the resolve check. |
| A10, generated-facts drift after structural change | P8 records HEAD and package SHA256 in the manifest. No template or font file changes. | A proof from a stale package has a manifest that differs from HEAD. The check fails. |

### Human gate and closeout gate

- Closeout gate: after checks P1 to P9 and the four reviews pass, the phase acceptance role writes `measure/runs/primary_v2_look_20261020/phase-acceptance-s5-<sha8>.json` with PASS and 0 open blockers. It records that file in `plan.md`. The checkpoint commit and git note then follow the workflow protocol. A non-zero check or an open Blocker fails the gate.
- Human gate, S5 task 2: Daniel looks at both contact sheets. Evidence class: human approval and manual verification. The plan records the date, his notes word for word, each fix, and the new proof version path for each round. Repeat the proofs until he approves. Record the approval line with date in `plan.md`. The Phase S5 manual verification task closes on that line. The deferred S4 manual gate closes on the same proofs.
- Given no approval, no printer file is made. S6 stays blocked.

### Handoff to the orchestrator

Capture the immutable base at the strategy commit, as stated above. Assign Review A, Review B, one adversarial round, the UX/browser review (UX_REQUIRED), phase acceptance, and then Daniel's gate. Run no Red or Green role for S5. The capture directory is `/home/daniebo/Desktop/advantage-pr/assets/screenshots/primary-advantage/parity-run2-2026-10-19/student/`. The long lesson is `adventure-9.2/l09.json`. No product code change is needed.
