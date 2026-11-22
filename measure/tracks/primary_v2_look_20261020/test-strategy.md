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

**Risk classification: medium.** The original proofs changed no product code. A wrong proof sends Daniel to the wrong pages and delays the printer file, now on hold with no date (strategy v1.18). No production write happens before his approval. The F5 remediation below adds a bounded CSS change; its own risk note governs that change.

**phase_base_sha capture point (S5).** The strategy commit is the commit with subject `measure(strategy): primary_v2_look Phase S5 test strategy for the page proofs`. Immediately after that commit lands, the orchestrator captures `phase_base_sha = $(git rev-parse HEAD)`. That SHA is immutable for the phase. Do not use `8b27c9ea` from the role brief; it predates the strategy commit. If the strategy is refreshed, capture the base again after the newest strategy commit. No proof file, driver, or gate run may start before the capture. This paragraph supersedes the historical S4 capture paragraph above for Phase S5. It is now superseded for this refresh by the capture point in "S5 remediation (2026-11-19)" below; use the newest strategy commit only.

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

Capture the immutable base at the strategy commit, as stated above. Assign Review A, Review B, one adversarial round, the UX/browser review (UX_REQUIRED), phase acceptance, and then Daniel's gate. Run no Red or Green role for the original proofs. The F5 remediation below adds one Red/Green task. The capture directory is `/home/daniebo/Desktop/advantage-pr/assets/screenshots/primary-advantage/parity-run2-2026-10-19/student/`. The long lesson is `adventure-9.2/l09.json`. The original proofs needed no product code change.

### S5 remediation (2026-11-19)

Reviews A and B at `c8fe15ba` returned one Blocker and five Major findings. Review A adds Nits F6 to F10; Review B adds Nits F2 to F4. This sub-section records the fixes and restates the gates. It adds P10, strengthens P2 to P6, and adds an F5 Red/Green task. It does not remove a check above.

**phase_base_sha capture point (authoritative for this refresh).** The capture commit is the commit with subject `measure(strategy): primary_v2_look S5 remediation, picture keep fix and proof r2`. Immediately after that commit lands, the orchestrator runs `git rev-parse HEAD` once and sets `phase_base_sha` to that value. The SHA is immutable for the rest of Phase S5. Do not use `14ba57a6` (the first S5 strategy) or `c8fe15ba` (the role base and the review head). Both predate this committed strategy. If another refresh lands, capture the base again after the newest strategy commit. No Red file, Green fix, driver edit, proof build, or gate run starts before the capture.

**Risk classification: medium.** F5 changes print CSS in `dashboard/lib/document-wrapper/chibi-quest-styles.ts` only. The rule is scoped to `.look-chibi-quest`. The classic wrapper never calls `getChibiQuestStyles()`; `workbook-document-wrapper.ts` line 30 is the only production call. A byte-identity test on the two classic golden files bounds the risk. The r2 proof, the UX/browser review, and Daniel's gate prove the visual result. If a fix needs a change in `primary_template.html` or `workbook-document-wrapper.ts`, the risk becomes high. Refresh this strategy again before that work starts.

#### 1. F5 product change: keep the inline picture with its caption

Review A F5: on Adventure 9.2 lesson 9, pages 3 and 4, the hero picture ends page 3 and its caption "The guide welcomes the Explorers." starts page 4. The template already sets `break-inside: avoid` on `.article-image-area` and `.article-image-box` (`primary_template.html` lines 1320 to 1331), but `.article-image-area` floats left at 55% width. Paged.js splits the float. The fix adds a scoped keep rule in the chibi-quest styles only. The classic golden stays byte-identical.

Red file: `dashboard/__tests__/chibi-quest-picture-keep.test.ts`.

The test asserts:

- `getChibiQuestStyles()` holds a rule scoped to the inline figure wrapper. The rule names `.look-chibi-quest .article-image-box`, `.look-chibi-quest .article-image-area`, and `.look-chibi-quest .inline-img-box`. The rule declares both `break-inside: avoid` and `page-break-inside: avoid`. A bare selector or a repeat of the classic template rule does not count. The test reads the declaration under the `.look-chibi-quest` prefix.
- A minimal literal DOM fragment copied from the template lines 1674 to 1687 holds the `<img>` and its `.article-image-caption` inside the same `.article-image-box` wrapper that carries the keep rule. The test reads no package, no Thai, and no image.
- The two classic golden files `content/primary/origins-3.2/print/golden/lesson-05.html` and `lesson-05-no-key.html` stay byte-identical.
- The styles keep the S3 flat-fill rule: no `gradient`, `rgba(`, `opacity`, shadow, or emoji.

RED_TEST_COMMAND (F5):

```
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-picture-keep.test.ts'
```

Red condition: the new file exists and compiles. It fails only on the new keep-rule assertion. The golden byte-identity, flat-CSS, and DOM-fragment assertions pass at Red, because they protect present behavior. A Red that fails on a syntax error or a missing import is not a valid Red. Exit 75 means the pre-flight hold outlasted its wait; rerun and do not record a pass.

GREEN_TEST_COMMAND (F5): the same targeted command, which must exit 0 after the CSS fix.

Green gates for F5. Each runs through one heavy-run wrapper, never nested.

- `GREEN_TEST_COMMAND`: the targeted command above; exit 0.
- `PROJECT_TESTS`: `set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts`; exit 0 apart from the three recorded earlier failures.
- `PROJECT_LINT`: `set -o pipefail; cd dashboard && npx eslint lib/document-wrapper/chibi-quest-styles.ts __tests__/chibi-quest-picture-keep.test.ts --no-error-on-unmatched-pattern`; exit 0.
- `PROJECT_CHECKS`: `set -o pipefail; cd dashboard && npx tsc --noEmit`; exit 0.

Mutants for F5. Record each mutant, the catching test, and the exit code in the run log.

- Remove `break-inside: avoid` from the chibi-quest figure rule: the keep-rule assertion fails.
- Add `!important` to the classic template rule instead: the scoped-rule assertion fails and the golden changes.
- Put the caption outside the `.article-image-box` wrapper: the DOM-fragment assertion fails.
- Change one byte in a golden file: the byte-identity assertion fails.
- Add a gradient to the chibi-quest styles: the flat-fill assertion fails.

Changed-contract risk: `getChibiQuestStyles()` is called once in production (`workbook-document-wrapper.ts` line 30) and by three test files. Keep its signature. Do not add a parameter. A second production caller is a changed contract and needs a fresh strategy. The fix changes no template path, so the classic golden does not change. Treat the `chibi-quest-styles.ts` commit as an S7 `styles.ts` trigger: send its commit id to the PM for the monorepo session.

Live-behavior proof for F5: the CSS test is an artifact test. The real page split is proven only by the r2 Adventure 9.2 contact sheet, the UX/browser review, and Daniel's look. Do not record the CSS assertion as visual proof.

#### 2. Green proof task: driver and checks for proof-s5-r2

Owner: Green, after the F5 product fix and its four Green gates pass. Scope: `measure/runs/primary_v2_look_20261020/proof-s5/` and `.gitignore`. No product source changes in this task.

Build a new folder `~/Desktop/print-ready/primary-v2-look/proof-s5-r2/`. Render with the book name and level so the header matches the printed book. Use one heavy-run wrapper per command, never nested.

```
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && npx tsx scripts/render-lesson-html.ts ../content/primary/quest-5/l01.json --out ../measure/runs/primary_v2_look_20261020/proof-s5/quest5-l01.html --look chibi-quest --series "Quest 5" --level A1'
```

The second command uses `../content/primary/adventure-9.2/l09.json`, output `adventure92-l09.html`, `--series "Adventure 9.2"`, and `--level A2+`. Run the Thai filter first as in step 1 above. The filter prints 0 Thai characters before any non-Claude role reads a package. Keep all proof binaries outside the repository.

Fixes to the driver and checks:

- P10 (new): read the `workbook-title` string of each proof. Require `Primary Advantage • Quest 5 • A1` and `Primary Advantage • Adventure 9.2 • A2+`. Fail when the book name is absent or when "Primary Advantage" occurs twice. Falsification: the r1 string `Primary Advantage • Primary Advantage • A1` fails P10.
- P2 (strengthened): fail when `pdffonts` lists 0 fonts. Read the `emb` column as `parsePdffonts` in `lib/print/pdfx.ts` does; do not test `yes` not in row. Falsification: an empty folder or a row `Helvetica Type 1 WinAnsi no no yes` fails.
- P3 (strengthened): each of the 13 S4.1 names occurs exactly once, in order; the nine classic-only names occur 0 times. Falsification: a doubled render or a swapped pair fails.
- P4 (strengthened): compare the PDF page count with the page-box count returned by `renderPagedPdf`, not with tiles made from the same PDF. Falsification: a frozen render with a low page-box count fails.
- P5 (strengthened): assert each TSV pair against the step-to-capture table of the plan. Fail when an `img src` file is missing. Falsification: a reversed capture column or a missing picture fails.
- P6 (strengthened): fail when 0 filtered files are found. Falsification: a missing filter folder fails.
- Contact sheet (Review A F2): shorten or wrap the five overprinting captions. Label a page by the step at its top. Give the Thai translation page its own label and no capture. Falsification: a label wider than its room or a translation page paired with the Lesson Summary capture fails the sheet check.
- Overwrite (Review B F1): refuse to write when the target `--out` already exists. Keep the round-identity refusal. Falsification: a second run against an existing PDF exits 1 and changes no file.
- CDN (Review B F2): strip the unpkg script tag in the driver, as `make-book-pdf.ts` does, in addition to the DNS mapping. Falsification: a proof HTML that still holds the unpkg tag fails.
- P9 (Review B F3): match the prefix `Primary-Advantage-Quest-5`. Falsification: a renamed printer file in `~/Desktop/print-ready/` fails P9.
- `.gitignore` (Review B F4): add the two proof HTML names `measure/runs/primary_v2_look_20261020/proof-s5/quest5-l01.html` and `measure/runs/primary_v2_look_20261020/proof-s5/adventure92-l09.html`. Falsification: `git status --porcelain` lists either file as untracked.

P1, P7, P8, and P9 stay as above. P8 adds `git status --porcelain` over the render pathspecs. Review A r4 F21 showed that the original eight-path scope missed nine render imports and the font folder. "S5 fix round 2 (2026-11-20)" below gives the authoritative scope. All checks P1 to P10 run through one heavy-run wrapper each; record every exit code. "All checks pass" is written only when all ten exit 0.

F6 to F9 stay deferred as tech debt. F10 is for the plan author: fix the stale Quest 5 date in `plan.md` and `spec.md`, name `proof-s5-r2` and `manifest-r2` in the S5 task, and add the `seriesName`, `levelNumber`, and `cefrLevel` assertions to the S6 test list. The strategy role owns none of those files.

#### 3. Order of work

Run these steps in order. Do not start a later step while an earlier gate is open.

1. Capture `phase_base_sha` at the refresh commit.
2. Red F5: write the Red file and run RED_TEST_COMMAND; record the failure.
3. Green F5: apply the CSS fix and run the four Green gates. Send the commit id to the PM for S7.
4. Green proof task: fix the driver and checks, build `proof-s5-r2`, and run P1 to P10.
5. Review A and Review B again on the new head.
6. One adversarial round, then the UX/browser review (UX_REQUIRED).
7. Phase acceptance on the new head.
8. Daniel's human gate. S6 stays blocked until his dated approval line.

An open Blocker at any step stops the sequence.

#### 4. Review applicability

Review applicability is unchanged from the S5 section above unless the F5 code change alters it. The fix stays inside `chibi-quest-styles.ts`, so no review gate is added or dropped.

- Review A, correctness: applies as lead. Add the picture-keep rule, the classic golden byte-identity, the P10 header, the strengthened P2 to P6, and the corrected contact-sheet labels to its checks.
- Review B, security: applies, narrow. Add the no-overwrite refusal, the CDN tag strip, the printer-file prefix, and the `.gitignore` rule to its checks.
- Review C, route or CLI contract: does not apply. No route, flag, or option changes.
- Adversarial testing: applies, one round. Add the five F5 mutants and the P2 to P6 falsification fixtures.
- UX and API review: UX applies and is required (UX_REQUIRED). The API side is Review C and does not apply. Add the fixed page-3 and page-4 split to the visual checks.
- Browser review: applies (UX_REQUIRED), for the same reason. It audits the r2 proof HTML and contact sheets, not a dev route.

Each review role uses a model family other than the Red and Green families. It reports and fixes nothing. No open Blocker may remain at closeout.

#### 5. Anti-pattern coverage and falsification for the remediation

A1 and A8 are retired. A2 to A10 are active. A11 is reserved in the catalog and has no definition, so no class is defined for it. Every test below has a falsification condition.

| Anti-pattern | Defense in the remediation | Falsification condition |
|---|---|---|
| A2, consent-blind publish gate | P9 prefix match and P10 header, plus no printer file before the dated approval in `plan.md`. | A `Primary-Advantage-Quest-5*` file exists before the approval line. The gate fails. |
| A3, digit-only as a labeled count | P1 and P4 parse labeled integers from `pdfinfo` and the page-box result. The F5 test asserts exact CSS declarations, not a digit count. | A date passes a bare regex but fails the labeled parse. The CSS test passes on a wrong digit count. |
| A4, vacuous-pass on nothing-done | P3 asserts 13 exact names once each before the absence assertions. The F5 test asserts the keep rule before the golden byte assertion. | An empty render passes "no classic name" but fails the count. A CSS file with no keep rule fails the F5 test. |
| A5, false-claim text versus test reality | Record the real exit of RED_TEST_COMMAND, GREEN_TEST_COMMAND, the three Green gates, and P1 to P10. | Red exits 0 before Green, or a recorded non-zero exit carries a pass claim. The claim is false. |
| A6, registry-note overstatement | No approval claim before the dated note. No "resolved" claim while a Review A Blocker is open. | An approval claim without the dated note is false. |
| A7, over-broad filter swallowing real hits | P3, P6, and P10 use exact strings. P5 uses the exact step-to-capture table. No bare English filter token. | A filter that drops a line holding "never" hides a classic-name leak. P3 fails. |
| A9, pre-existing test references archived track paths | The Red file and the driver name live paths only. A static check resolves each `measure/tracks/<id>` reference. | A reference to `measure/archive/<id>` fails the resolve check. |
| A10, generated-facts drift after structural change | P8 records HEAD, package SHA256, and `git status --porcelain` over the four render pathspecs of "S5 fix round 2". The S7 handoff sends the F5 commit id. | A stale package or an uncommitted edit of a render input fails P8. A test-only edit passes. |

### Handoff to the orchestrator (remediation)

Capture the immutable base at the refresh commit, not at a SHA that predates it. Assign the F5 Red role and the F5 Green role first. Then assign the Green proof task for `proof-s5-r2`. Then assign Reviews A and B again, one adversarial round, the UX/browser review (UX_REQUIRED), phase acceptance, and Daniel's gate. Use the RED_TEST_COMMAND and GREEN_TEST_COMMAND of the F5 block above. Keep the three earlier `PROJECT_TESTS` failures and the storytime exclude as recorded earlier failures; do not fix them in this phase. Do not stage `strategy-s5-8b27c9ea.log`, the review files, the HTML files, `video/**`, or `dashboard/raw.json`. No push, amend, or reset.

#### Shipped design and checks (2026-11-20)

Review A at `338e68eb` returned one Blocker (F11, a squashed hero), one Major (F13, two weak test assertions), and Nits F12 and F14 to F17. Green shipped the fixes in commits `0b2bd81f`, `9b95646e`, `95345e90`, and `178a4e2f`. Proof round r5 passes P1 to P13 (`checks-r5.txt`, 13 checks, 0 failures). This part records the shipped design. It supersedes the r3 requirement in section 1 that the keep rule names three wrappers, and it renames the F5 subject from an inline picture to the hero picture. The r3 text stays as the record of that round.

**phase_base_sha capture point (this refresh).** The capture commit has subject `measure(strategy): primary_v2_look S5 shipped design and checks P11 to P13 (review A F14)`. Immediately after that commit lands, the orchestrator runs `git rev-parse HEAD` once and sets `phase_base_sha` to that value. Do not use `a5f1938a` (role base), `82c58b7e` (the r3 strategy), or an earlier SHA. If another refresh lands, capture the base again after the newest strategy commit.

**Risk classification: medium.** The shipped rules sit in `chibi-quest-styles.ts` and carry a `.look-chibi-quest` scope. The classic wrapper never calls `getChibiQuestStyles()`. The classic golden and `lib/teacher-manual/` stay unchanged. Six Red assertions, P11, P12, P13, and Daniel's gate bound the visual risk. No route, flag, or option changed.

**The three shipped rules and the reason for each.**

| Rule | Reason |
|---|---|
| `.look-chibi-quest .inline-img-box { break-inside: avoid; page-break-inside: avoid; }` (`0b2bd81f`, scoped in `9b95646e`) | It follows the S3 rule "inline pictures do not split" (`spec.md` line 72). It is scoped to the chibi-quest look. Test 2 guards it. |
| No keep rule on the hero wrappers `.article-image-area` and `.article-image-box` in the chibi-quest styles (`9b95646e`) | An avoid rule on those wrappers made Paged.js drop the hero (round 2 probe, `proof-s5/g1-hero-drop.txt`). Test 3 guards the absence. The classic template keeps its own avoid rules at `primary_template.html` lines 1320 to 1331. |
| `.look-chibi-quest .hero-img-box img { width: auto; max-width: 100%; max-height: 240px; }` (`95345e90` added the cap, `178a4e2f` added `width: auto`) | The cap keeps the hero caption on the picture's page (P12). `width: auto` with `max-width: 100%` keeps the square source square (P13). The cap alone gave x-ppi 435 and y-ppi 640 (`check-P13-r4.txt`, exit 1). The shipped rule gives 640 and 640 (`checks-r5.txt` P13). All 154 hero sources are 1600 x 1600. |

**P11 to P13 in the form of the P1 to P10 table.** Each check runs through one heavy-run wrapper. Record each exit code. "All checks pass" is written only when all 13 exit 0.

| ID | Check | Falsification condition | Round that proved it falsifiable |
|---|---|---|---|
| P11 | `pdfimages -list` count per lesson: package pictures, HTML `file://` srcs, and PDF images. Fail when a picture is absent or an `img src` file is missing. | A text-only PDF gives `package_pictures 3`, `pdf_images 0`, exit 1 (`falsification-r2.txt` line 17). | Round 2, `falsification-r2.txt`. |
| P12 | For each caption of the Thai-filtered package, the `pdftotext` page text holds that caption on the page of its picture; caption and picture counts match. | The r3 Adventure hero caption is on page 4 while its picture is on page 3: `same_page False`, exit 1 (`check-P12-r3.txt`). | Round 3, `check-P12-r3.txt`; also fails on r2 (2 pictures for 3 captions, `counts_match False`). |
| P13 | For every `pdfimages -list` row, x-ppi and y-ppi differ by at most 2 percent. | The r4 hero has x-ppi 435 and y-ppi 640: `ratio_delta 0.3203`, `within_2pct False`, exit 1 (`check-P13-r4.txt`). | Round 4, `check-P13-r4.txt`; r5 passes with 0 of 3 images off (`checks-r5.txt` lines 54 to 62). |

P8 now also compares the manifest `git_head` with HEAD (Review A F16). `checks-r5.txt` line 27 records `same_head True` and `product_changed_since_manifest False`.

**The six assertions of the Red file and what each guards.** The file is `dashboard/__tests__/chibi-quest-picture-keep.test.ts`.

| Assertion | What it guards |
|---|---|
| 1. A scoped rule on `.look-chibi-quest .hero-img-box img` declares `max-height: 240px`, `width: auto`, and `max-width: 100%`; the classic `styles.ts` holds no `hero-img-box`. | F11: the hero keeps its aspect ratio. It also guards look isolation. Removing `width: auto` fails this assertion. |
| 2. A scoped keep rule on `.look-chibi-quest .inline-img-box` declares both keep properties. | The S3 inline-picture rule and F5 retention. Removing either declaration fails. |
| 3. No keep rule on `.look-chibi-quest .article-image-area` or `.look-chibi-quest .article-image-box`. | The P11 hero drop. Adding an avoid rule to either wrapper fails. |
| 4. The real `primary_template.html` holds an `<img>` and an `article-image-caption` inside each `article-image-box inline-img-box` wrapper. | F13: the assertion reads the template, not a literal in the test file. Moving the caption out of the wrapper fails. |
| 5. `lessonDocument` output stays byte-identical to `lesson-05.html` and `lesson-05-no-key.html` for the default, classic, no-key, and classic no-key variants. | The S1 classic byte identity. A one-byte change in a golden fails. |
| 6. The chibi-quest styles hold no gradient, `rgba(`, `hsla(`, `opacity`, shadow, or emoji. | The S3 flat-fill rule and PDF/X-1a. Adding a gradient fails. |

Mutants M6a and M6b were caught (`green-s5g1-r4-mutants.txt`). Add the mutant that keeps `max-height: 240px` and removes `width: auto`; assertion 1 and P13 must fail. Record the mutant, the catching check, and the exit code in the run log.

**Decline of F12.** Keep the inline keep rule. Review A F12 found that it changes no page in the current proofs or in the whole-book renders: the Quest 5 book has 30 inline pictures, and pagination and page text stay the same with and without the rule. Decline the proposed removal. The rule follows the S3 acceptance criterion "inline pictures do not split" (`spec.md` line 72), and a future lesson may need it. The rule is scoped to `.look-chibi-quest`, so the classic output does not change. Assertion 2 guards the rule; assertion 3 keeps the hero wrappers clear. Record any future lesson where the rule changes a page break. No action now.

**Open Nits for Daniel's look.** No Blocker stays after r5. The phase acceptance and Daniel's gate still run.

- F15: PM decision 1 (2026-11-20) closed the choice. The hero prints at full inline width; P14 measures 84.67 mm at r7 and r8. The strip beside the hero closed. Daniel confirms at his look.
- F17: the scoped `margin-top: 4mm` rule (S5.G3) closed the touching headers. P15 measures a 3.89 mm minimum at r7 and r8. Daniel confirms at his look.
- F10: closed for the plan author (2026-11-21). The plan dates read on hold everywhere, and the S6 test list now asserts `seriesName`, `levelNumber`, and `cefrLevel`. The strategy role owns none of those files.

**Review applicability.** Review applicability stays as in the S5 remediation section. The three rules change scoped print CSS only. Review A, correctness, leads and checks R1 to R3, the six assertions, and P11 to P13. Review B, security, stays narrow and unchanged. Review C does not apply; no route, flag, or option changed. Adversarial testing applies, one round, and adds the `width: auto` mutant and the P13 squash fixture. UX and API review keeps UX_REQUIRED; the API side stays not applicable. Browser review applies (UX_REQUIRED) for the r5 proof HTML and contact sheets. Each review role uses a model family other than the Red and Green families. It reports and fixes nothing. No open Blocker may remain at closeout.

#### S5 fix round 2 (2026-11-20)

Review A r4 at `d2c2304c` returned F21, a Blocker: the eight-path P8 scope misses nine render imports and `dashboard/assets/print-fonts`. UX browser review at the same head returned UX-1, a Major: step headers touch the panel above on five pages. The PM set three owner defaults on 2026-11-20 for Daniel's one look. This part records the fixes and supersedes the P8 scope statements above.

**PM design defaults (2026-11-20).**

1. The hero prints at full inline width, 84.8 mm, like the other pictures. The strip beside it closes.
2. For ages 9 to 12: labels at least 8 pt; writing lines at least 8 mm apart; Thai glosses 8 pt upright, not italic.
3. The book keeps its fixed 13 printed steps with its own numbers and names. The app mapping stays in the teacher notes, not on the page. No step number or name changes.

**phase_base_sha capture point.** The capture commit has subject `measure(strategy): primary_v2_look S5 fix round 2, PM look decisions, UX-1, P8 scope (review A F21)`. Immediately after that commit lands, the orchestrator runs `git rev-parse HEAD` once and sets `phase_base_sha` to that value. Do not use `d2c2304c`, `82c58b7e`, or an earlier SHA.

**Risk classification: medium.** All five product changes are scoped print CSS in `dashboard/lib/document-wrapper/chibi-quest-styles.ts`. The classic wrapper never calls `getChibiQuestStyles()`. Two Red files, a byte-identity assertion on the two golden files, P1 to P16, and Daniel's look bound the risk. No route, flag, or option changes. No template change is planned. If a scoped rule cannot win, the only candidate is the float and image rules in `primary_template.html` (lines 902 and 1320 to 1331). That edit would change the classic golden; refresh this strategy before it starts.

**(a) Product changes, Red assertions, and falsifying mutants.** Each change uses a `.look-chibi-quest` selector in `chibi-quest-styles.ts`.

| Change | Red assertion | Falsifying mutant |
|---|---|---|
| Add `margin-top: 4mm` to `.look-chibi-quest div.section-header` (current line 86). This guards UX-1. | The new file `chibi-quest-print-sizes.test.ts` parses the scoped rule and asserts `margin-top` from 3 mm to 5 mm. It asserts no top margin of 0 in that rule. | Remove `margin-top` or set it to 0. The assertion fails and P15 fails at r6. |
| Replace the 240 px cap with `.look-chibi-quest .hero-img-box img { width: 84.8mm; max-width: 100%; height: auto; }` (current line 105). Delete `max-height: 240px` and `width: auto`. | In `chibi-quest-picture-keep.test.ts`, keep assertions 2 to 6. Change assertion 1 to require exact `width: 84.8mm`, `max-width: 100%`, and `height: auto`, and no `max-height`. Update the adversarial width parser to the new declaration. | Restore `max-height: 240px` or set `width: 63.5mm`. Assertion 1 and P14 fail. The hero at 84.8 mm leaves about 9 mm of the 93.5 mm float box instead of 35 mm, so the strip closes. P12 must still keep the caption on the picture page. If P12 fails at 84.8 mm, do not restore the cap; adjust scoped spacing or report a Blocker. |
| Set scoped font-size rules for `.q-label`, `.a-label`, `.para-note-label`, `.tip-label`, `.planning-label`, `.qr-label`, and any other label under 8 pt; use 11 px (8.25 pt). | For each named selector, the scoped rule declares `font-size` of at least 10.67 px. The test asserts the exact selector list, not a digit count. | Set 9 px or move the rule to the classic styles. The assertion fails and P16 fails at r6. |
| Set scoped rules on `.writing-line` and `.writing-line-small` so min-height plus margins give at least 8 mm pitch (about 30 px). | The test parses each scoped rule and asserts pitch of at least 30 px from `min-height` plus margins. | Restore `min-height: 20px` with `margin: 4px 0`. The assertion fails. The UX review and Daniel check the printed pitch at r6; no P-check measures lines. |
| Set `.look-chibi-quest .thai-translation { font-size: 11px; font-style: normal; }`. | The scoped rule declares `font-size` of at least 10.67 px and `font-style: normal`. No italic declaration sits in that scoped rule. | Set italic or 9 px. The assertion fails and P16 fails at r6. |

The new Red file also asserts that the classic golden files `lesson-05.html` and `lesson-05-no-key.html` stay byte-identical for the default, classic, no-key, and classic no-key variants. A one-byte change fails it. The new file reads no package, no Thai, and no image.

RED_TEST_COMMAND and GREEN_TEST_COMMAND cover both files:

```
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-print-sizes.test.ts __tests__/chibi-quest-picture-keep.test.ts'
```

The command is RED_TEST_COMMAND before Green and GREEN_TEST_COMMAND after Green. Red condition: the new file exists and compiles; it fails only on the new size assertions; `chibi-quest-picture-keep.test.ts` fails only on assertion 1; the golden byte-identity assertion passes at Red. A syntax error or a missing import is not a valid Red. Exit 75 means the pre-flight hold outlasted its wait; rerun and do not record a pass.

Green gates: GREEN_TEST_COMMAND exits 0. `PROJECT_TESTS` is `set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts` and exits 0 apart from the three recorded earlier failures. `PROJECT_LINT` is `set -o pipefail; cd dashboard && npx eslint lib/document-wrapper/chibi-quest-styles.ts __tests__/chibi-quest-print-sizes.test.ts __tests__/chibi-quest-picture-keep.test.ts --no-error-on-unmatched-pattern` and exits 0. `PROJECT_CHECKS` is `set -o pipefail; cd dashboard && npx tsc --noEmit` and exits 0. Record each mutant, the catching check, and the exit code.

**(b) Driver and checks for proof round 6.**

P8 scope (F21). Use four Git pathspecs: `dashboard`, `:(exclude)dashboard/__tests__`, `content/primary/quest-5`, and `content/primary/adventure-9.2`. Keep the manifest `git_head` compare, the `COMMIT_ID` validation, `--end-of-options`, the artifact hashes, and the head compare. Fixtures: a change to `dashboard/lib/template-renderer.ts` fails P8; a change only under `dashboard/__tests__/` passes P8. Record the scope as these four pathspecs, not as "dashboard and content" (F22). The nine omitted render imports and `dashboard/assets/print-fonts` are now inside the scope.

P14 to P17 use the P1 to P13 table form. Run each through one heavy-run wrapper and record the exit code.

| ID | Check | Falsification condition | Round that proved it falsifiable |
|---|---|---|---|
| P14 | Read `pdfimages -list`. Convert the hero `x_ppi` to printed width in mm. Require 84.8 mm within 1 mm in both lessons. | The r5 hero prints 63.5 mm and fails. A restored 240 px cap fails. | The r5 fixture fails first; r6 must pass. |
| P15 | No step header within 3 mm of the element above. Best automated form: `pdftotext -bbox` word boxes, the topmost word box of each step title, and the bottom of the nearest text or panel border above it on the same page. Fail below 3 mm. If the border is absent from the text layer, use a PIL pixel-column scan at 300 dpi as the UX review did, with the same threshold. Record the method used. | The r5 gaps of 0.0 mm on Quest 5 pages 5 and 6 and Adventure page 8, and 0.25 mm on Quest 5 page 10 and Adventure page 12, fail. | The r5 fixture fails first; r6 must pass. UX review and Daniel stay binding for visual gaps. |
| P16 | From `pdffonts` and the Ghostscript `txtwrite` XML: no text under 8 pt (0.05 pt tolerance) and no italic Thai gloss face. Print counts and English label names only. | The r5 labels at 6.7 pt and 7.3 pt fail. A Sarabun Italic gloss face fails. | The r5 fixture fails first. P16 also failed at r7 on real under-8 pt text and passed at r8 after the F23 fix. |
| P17 | The step 3 header shares its page with the hero picture or paragraph 1 in both proofs. Read the step 3 page, the hero page, and the paragraph 1 start page from the PDF text. | A proof with the step 3 header alone on its page fails. | The first r11 attempt failed P17 on Adventure 9.2 (`proof-s5/checks-r11-attempt1.txt`); r7 to r11 pass. |

P16 reads font names and counts; it reads the span sizes from the Ghostscript `txtwrite` XML. It never prints a Thai string. P1 to P13 stay as recorded. Build proof round 6 in `~/Desktop/print-ready/primary-v2-look/proof-s5-r6/`. Refuse an overwrite of an existing PDF. Keep the two proof HTML names in `.gitignore`. Run P1 to P17; write "all checks pass" only when all exit 0.

**(c) Order of work.** Run these steps in order. Stop on an open Blocker.

1. Capture `phase_base_sha` at this strategy commit.
2. Red: write `chibi-quest-print-sizes.test.ts` and change `chibi-quest-picture-keep.test.ts` for the hero; run RED_TEST_COMMAND.
3. Green, product: apply the five scoped CSS changes; run GREEN_TEST_COMMAND and the three other Green gates; send the commit id to the PM for S7.
4. Green, driver: fix P8 and add P14, P15, and P16; build proof r6; run P1 to P16.
5. Review A and Review B again on the new head. F21 must close here.
6. One adversarial round, then the UX browser review. UX-1 must pass P15.
7. Phase acceptance on the new head.
8. Daniel's one look. His PM defaults are the answers unless he overrides them. No printer file is made without his dated approval.

**(d) Records.** The S5 risk line now gives the printer file as "on hold, no date (strategy v1.18)". The stale dates in `spec.md` and `plan.md`, the S6 test list, and the naming of the F5 picture stay with the plan author. The hero-drop record is `proof-s5/g1-hero-drop.txt` (F20). Review applicability stays as above; the new rules change scoped print CSS only, and no route, flag, or option changes.

---

## Phase S8: Default look for new editions

**Risk classification: medium.** The change alters the default look of every Primary Advantage project that has no `look` value. A wrong default sends a new Origins 1 to Quest 4 edition to the wrong look. A missed shipped edition changes a printed book. The change touches no template, no CSS, no font, and no route contract. Tests assert exact look strings, exact edition identities, and byte identity against golden files. Those bounds keep the risk at medium.

**phase_base_sha capture point (S8).** After the commit with subject `measure(strategy): primary_v2_look S8 default look for new editions` lands, the orchestrator runs `git rev-parse HEAD` once and sets `phase_base_sha` to that value. That SHA is immutable for the phase. Do not use `75766085` from the role brief. That commit predates this strategy. If this strategy is refreshed, capture the base again after the newest strategy commit. No Red file, Green code, project edit, or gate run starts before the capture.

### Design default: shipped edition versus new edition

Recorded decision: write `look: "classic"` into the `project.json` of each of the 5 shipped editions. In `dashboard/lib/look.ts`, change the no-look default of `projectLook` from `bookLook(book)` to `chibi-quest`. Keep `bookLook`, `CHIBI_QUEST_BOOKS`, and `parseLook` unchanged.

Reason for this choice:

1. All 5 shipped `project.json` files hold no `look` key today. Adding one gives those editions an explicit classic marker that a new project does not have.
2. `projectLook` receives `ProjectMetadata` (series, number, level, look). It cannot see the project folder id. A pinned list of shipped editions inside `look.ts` cannot tell a shipped Origins 2 edition from a new Origins 2 edition. Both map to the same `origins-2` string. Only an explicit `look: "classic"` in the shipped project makes the two cases differ.
3. `bookLook` stays as it is. The content-folder path of Origins 1 to Quest 4 keeps printing `classic`. Those folders feed the shipped print files. The two golden HTML files and the 70 print files of 08bb160 stay byte-identical.
4. A rewritten edition is told apart by being a new project with no `look` key. A graph-first rewrite creates that project; it does not reuse the shipped project's explicit classic marker. `projectLook` then returns `chibi-quest` for it.

The 5 shipped editions are `primary/origins-2-a0`, `primary/adventures-1.0-a1`, `primary/origins-3.1-a0`, `primary/origins-3.2-a0`, and `primary/quest-4-a1`. Note that `adventures-1.0-a1` declares `seriesName` "Origins" and `levelNumber` "2". It still gets an explicit `look: "classic"`.

### Owned scope (from plan.md)

- S8 task 1 (Green): the no-look default of `projectLook` is `chibi-quest`; the 5 shipped edition `project.json` files carry `look: "classic"`.
- S8 task 2 (Red): new file `dashboard/__tests__/default-look-new-editions.test.ts`. The golden byte-identity tests stay unchanged.
- S8 task 3: no shipped or on-order print file is rebuilt.
- Phase gates: Reviews A, B, and C, one adversarial round, phase acceptance, and the checkpoint.

### Top risks

1. The classic golden files `content/primary/origins-3.2/print/golden/lesson-05.html` and `lesson-05-no-key.html` must stay byte-identical.
2. The 70 print files of 08bb160 must stay byte-identical. `export-print-data.ts` must give no git change.
3. A new Origins 1 to Quest 4 edition with no `look` must get `chibi-quest`. The present code gives it `classic`.
4. Each of the 5 shipped editions must stay `classic`, even when it has no `look` key before Green.
5. `parseLook` must still throw on an unknown look. Do not turn an unknown value into a silent default.
6. The content-folder path through `bookLook` must stay `classic` for Origins 1 to Quest 4.
7. Existing assertions in `dashboard/__tests__/workbook-look.test.ts` that expect classic for a no-look Quest 4 or Origins 3.2 project become stale. Green updates them.

### Targeted Red command

Every heavy command uses one wrapper. Do not nest wrappers.

```
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/default-look-new-editions.test.ts __tests__/workbook-look.test.ts'
```

Red condition: the new file exists and compiles. It fails only on the new-edition default assertions. The shipped-edition, explicit-look, unknown-look, book-folder, and golden byte-identity assertions pass at Red, because they protect present behavior. `workbook-look.test.ts` still holds its old assertions at Red and passes. A syntax error or a missing import is not a valid Red. Exit 75 means the pre-flight hold outlasted its wait; rerun and do not record a pass.

### Green gate

Run four commands. Each command uses one heavy-run wrapper, never nested.

- `GREEN_TEST_COMMAND`: the targeted vitest command above. It must exit 0. Green also updates the stale assertions in `workbook-look.test.ts` (top risk 7).
- `PROJECT_TESTS`: `set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts`. It must exit 0 apart from the recorded earlier failures below.
- `PROJECT_LINT`: `set -o pipefail; cd dashboard && npx eslint lib/look.ts __tests__/default-look-new-editions.test.ts __tests__/workbook-look.test.ts --no-error-on-unmatched-pattern`. It must exit 0. eslint does not lint the `project.json` files; the tests read them.
- `PROJECT_CHECKS`: `set -o pipefail; cd dashboard && npx tsc --noEmit`. It must exit 0.

Each new rule must have a mutant that a named test catches. Record the mutant, the catching test, and the exit code in the run log.

### Closeout gate

Phase acceptance runs on the head after the S8 implementation. Gates: `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` exit 0; `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0 in heavy-runs. The role states the exit code of each gate. It also checks that `git diff --exit-code -- ':(glob)content/primary/**/print/**'` is empty and that no new printer file exists under `~/Desktop/print-ready/`. It writes `measure/runs/primary_v2_look_20261020/phase-acceptance-s8-<sha8>.json` with PASS and 0 open blockers. It records that file in `plan.md`. The checkpoint commit and its git note then follow the workflow protocol. Any gate failure other than the recorded earlier failures fails the closeout gate.

### Test cases in `dashboard/__tests__/default-look-new-editions.test.ts`

1. New edition with no `look` gets `chibi-quest` at each series: `projectLook` of Origins 1, Origins 2, Origins 3.2, Quest 4, Quest 5, and Adventure 9.3, each without a `look` key, returns `chibi-quest`.
2. Rewritten edition: a temporary project with `seriesName` "Origins", `levelNumber` "3.2", and no `look` returns `chibi-quest` through `projectLook`. This is a new project, not the shipped one.
3. Each of the 5 shipped editions stays `classic`: read each `primary/<id>/project.json` and assert `projectLook(meta)` is `classic`. The `adventures-1.0-a1` case covers the Origins 2 declaration in that file.
4. Explicit `look` in `project.json` still wins: a Quest 5 project with `look: "classic"` returns `classic`; an Origins 1 project with `look: "chibi-quest"` returns `chibi-quest`.
5. Unknown `look` still throws: `projectLook({ ..., look: 'riven-lands' })` throws, and `parseLook('riven-lands', where)` throws with the source name in the message.
6. Golden byte identity: `lessonDocument` of the `origins-3.2/print/p05.json` record with no look and with `classic` equals `lesson-05.html`; the no-key variant equals `lesson-05-no-key.html`. One byte of change fails the test.
7. Book-folder path stays classic: `bookLook('origins-1')`, `bookLook('origins-2')`, `bookLook('origins-3.1')`, `bookLook('origins-3.2')`, and `bookLook('quest-4')` each return `classic`. The content folders that feed shipped print files do not change.
8. No shipped print file is rebuilt: the test reads git status over `content/primary` and fails when any tracked print file differs from HEAD. It also fails when a new file appears under that path. The phase check uses the pathspec `':(glob)content/primary/**/print/**'` (PA-S8-1); it matches the tracked print files.

### Fixtures, mocks, and live-behavior proof

- Fixture A, shipped editions: the 5 `primary/<id>/project.json` files. Read only `seriesName`, `levelNumber`, and `look`. No lesson text and no Thai text is read. If any lesson JSON is ever read, run the Thai filter first as the first command.
- Fixture B, byte identity: the two golden files under `content/primary/origins-3.2/print/golden/` and the `p05.json` print record.
- Fixture C, new edition: literal `ProjectMetadata` objects in the test, and a temporary `WORKBOOKS_ROOT` project for the compile route if that path is asserted.
- Fixture D, book folders: the book names passed to `bookLook`. No package file is read.
- Mocks: none. `projectLook`, `bookLook`, and `parseLook` are pure functions. No network, database, or timer mock is needed.
- Live-behavior proof: none in S8. Every assertion reads a returned string, a `project.json` byte, an HTML byte, or a git path. No browser, no PDF render, and no font check is needed.

### Artifact tests and live behavior tests

Every S8 test is an artifact test. Do not record an artifact test as live behavior proof. The byte identity of the two golden files and the git check over the print folder are the strongest output guards. Both are string or byte comparisons. A future rebuild of a shipped book would need a real PDF check; S8 forbids that rebuild.

### Architecture guardrails and changed-contract risks

- `projectLook` has 3 production callers: `bookLessons` at `dashboard/lib/print/book-lessons.ts` line 57, the compile route at `dashboard/app/api/projects/[projectId]/compile/route.ts` line 176, and the render route at `dashboard/app/api/render/route.ts` line 25. The new default changes all three. Green must check each caller.
- `bookLook` has 2 production callers: `bookLessons` at line 61 and `dashboard/scripts/render-lesson-html.ts` line 58. Keep `bookLook` unchanged. A new edition built from a content folder with no `--look` flag still prints `classic`; that path is a package render, not an edition build. An edition build creates a project and uses `projectLook`.
- The `look` option, its two values, and the `--look` flag do not change. The change is a default inside `look.ts`. Review C checks that no route or CLI contract changes.
- `dashboard/__tests__/workbook-look.test.ts` lines 58 and 59 and the compile route case at lines 160 to 163 expect classic for a no-look level 1 to 4 project. Green updates them to `chibi-quest`. This is the changed contract of S8. Record the update in the Green evidence.
- `dashboard/lib/teacher-manual/` and `primary_template.html` stay unchanged. S7 is not triggered.
- Every `git commit` on a template path goes to the PM for the monorepo session (S7). S8 has no such commit.

### Intentionally-red aggregate suite

`PROJECT_TESTS` includes other tracks' files. Keep the three recorded files: exclude `dashboard/__tests__/storytime-unit2-sound-stage.test.ts` until that track's Task 3.6 Green closes; record `dashboard/__tests__/constants.test.ts` "includes Adventures 1.0 as a primary workbook option" and `dashboard/__tests__/origins-thai-support.test.ts` cases `origins-2-a0` and `origins-3.1-a0` as earlier failures outside this track. Evidence: `measure/runs/levels_5_9_20261006/green-g2-baseline-r2.txt`. Do not fix these tests in S8. Any other failure fails the gate.

### Review gate applicability

- **Review A, correctness: applies. Lead review.** Check each new-edition default, each of the 5 shipped editions, the explicit-look rule, the book-folder path, and the golden byte identity. Check that the 5 `project.json` files differ only by the added `look: "classic"` key. Result file: `measure/runs/primary_v2_look_20261020/review-a-s8-<sha8>.json`.
- **Review B, security: applies, narrow.** The change adds no input and no route. Check that an unknown look still throws and that no look string reaches HTML without the existing literal path. Result file: `review-b-s8-<sha8>.json`.
- **Review C, route or CLI contract: applies, narrow.** The `look` option and the `--look` flag are unchanged, but the compile route and the render route change their no-look output for level 1 to 4 projects. Check that the option shape is unchanged and that the new default is intended. Result file: `review-c-s8-<sha8>.json`.
- **Adversarial testing: applies. One round.** Attack surfaces: a new edition left at `classic`; a shipped edition switched to `chibi-quest`; the explicit look ignored; an unknown look accepted; a content folder switched to `chibi-quest`; one golden byte changed; a print file rebuilt; a stale assertion left in `workbook-look.test.ts`. Reuse the Green mutants. Result file: `adversarial-s8-<sha8>.json`.
- **UX and API review: does not apply.** The API side is Review C, which applies above. The UX side changes no visible page, no print CSS, and no print kit. S5 holds the visual review of the printed look.
- **Browser review: does not apply.** No dev route serves the changed output for visual review. The look decision is a pure function and a `project.json` key. A browser render adds no coverage beyond the artifact tests.

Each review role from a model family other than the Red and Green families audits the head. It reports, and it fixes nothing. No open Blocker may remain at closeout.

### Anti-pattern coverage and falsification

The catalog has A2 to A10 active. A1 and A8 are retired. A11 is reserved and has no definition. A2 has no consent publish gate in S8; record it as not applicable. Every defense below names a test or check and its falsification condition.

| Anti-pattern | Defense in S8 | Falsification condition |
|---|---|---|
| A2, consent-blind publish gate | Not applicable. No publish gate runs in S8. The "no rebuild" check of test 8 guards the print folder. | A rebuild or a new print file fails test 8 and the closeout check. |
| A3, digit-only as a labeled count | Assert exact look strings and the exact list of 5 edition ids. Do not use a digit regex or a bare count. | A test that only counts 5 editions passes with the wrong ids. The exact-list test fails. |
| A4, vacuous-pass on nothing-done | Assert that the 5 `project.json` files were read and that the new-edition case list is non-empty before the look assertions. | An empty edition list passes "all classic". The length assertion fails. |
| A5, false-claim text versus test reality | Record the real exit of Red, Green, lint, and tsc. Red must fail before Green. Green must exit 0 after. | Red exits 0 before Green, or a Green gate exits non-zero with a pass claim. The claim is false. |
| A6, registry-note overstatement | No "byte-identical" or "resolved" claim until the golden diff is empty and the adversarial JSON holds 0 Blockers. | A byte-identity claim with a golden diff is false. |
| A7, over-broad filter swallowing real hits | Match edition ids and look strings by exact equality. Do not filter on bare English words. | A filter that drops a line hides a shipped edition. The exact-id test fails. |
| A9, pre-existing test references archived track paths | The new test names live paths only. A static check resolves each `measure/tracks/<id>/plan.md` reference. | A reference to `measure/archive/<id>` fails the resolve check. |
| A10, generated-facts drift after structural change | Test 8 checks the tracked print folder against HEAD. The closeout check also compares no new printer file. The 5 edition ids are read from the files, not copied into a count. | A changed print byte or a new print file fails test 8. |

Mutant set for Green. Record each mutant, the catching test, and the exit code in the run log.

- Set the no-look default of `projectLook` back to `bookLook(book)`: test 1 fails on Origins 1, Origins 2, Origins 3.2, and Quest 4.
- Remove `look: "classic"` from one shipped `project.json`: the shipped-edition test fails on that id.
- Set a shipped `project.json` look to `chibi-quest`: the shipped-edition test fails.
- Make `projectLook` ignore an explicit `look`: the explicit-look test fails.
- Make `parseLook` return `classic` for an unknown look: the unknown-look test fails.
- Switch a content folder such as `bookLook('quest-4')` to `chibi-quest`: the book-folder test fails, and the print-folder guard fails.
- Change one byte in a golden file: the byte-identity test fails.
- Leave one stale classic assertion in `workbook-look.test.ts`: `PROJECT_TESTS` fails after Green.

### Handoff to the orchestrator

Capture the immutable `phase_base_sha` at this strategy commit, before Red starts. Assign the Red role on `dashboard/__tests__/default-look-new-editions.test.ts`, then Green for `lib/look.ts` and the 5 `project.json` files plus the stale assertion updates. Assign Reviews A, B, and C, one adversarial round, and phase acceptance. Skip UX and browser reviews for the reasons above. Use the targeted Red and Green commands of this section. The two tasks under `## Close` fall inside the S8 block, because the gate script splits phases at `## Phase `. Record them as track close, not as S8 tasks. Do not mark any box `[x]` in this role. Keep the three recorded `PROJECT_TESTS` files and the storytime exclude as earlier failures. Do not push.
