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
