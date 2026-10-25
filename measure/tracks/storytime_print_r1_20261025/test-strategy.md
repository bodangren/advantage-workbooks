# Test Strategy: storytime_print_r1_20261025

Written 2026-10-25 by the strategy role at e30399b. Updated 2026-10-25 at 104215e (r2) for the amended spec and plan: the black-and-white workbook, the color A3 reader PDFs, picture spec v1, and Phase 1 cycle 2 (Red 2, Green 2, Content 2). Phase 1 has full detail (cycle 1 in sections 4.3 to 4.5, cycle 2 in section 4.13). Phases 2 to 10 have an outline; the strategy role refreshes each outline before its phase starts.

## 1. Sources and measured facts

Inputs: `spec.md`, `plan.md`, `measure/anti-patterns.md` (A1 to A10), `measure/lessons-learned.md`, `measure/tech-debt.md`, and the checker `~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py`.

Facts measured on 2026-10-25 at e30399b:

- F1. `RED_TEST_COMMAND` exits 1 before any Red work, because no file matches (`No test files found`). A non-zero exit alone is not a Red proof (A4).
- F2. The checker counts only lines that match `^- \[([ ~x])\] (.+)`. A `[b]` line is not counted in any phase count or in the closeout check. Probe: a plan with `[x]`, `[ ]`, `[b]`, and `[ ]` gave total 3, not 4.
- F3. The checker drops a `[ ]` task from the count when its first line contains the substring "deferred" in any case. The skill text says that free text does not drop a task; the code does. `plan.md` has 0 hits for "deferred" today.
- F4. The SHA check is `\b[0-9a-f]{7,40}\b`. The word "defaced" passed it in the probe. An 8-digit date such as 20261025 also passes when it stands alone.
- F5. The jr-green, review, and phase-acceptance gates fail while the phase has one counted task that is not `[x]`. The mid-red gate needs one `[~]` task while counted tasks stay open.
- F6. `w01.json` has no `approval` key. `checks.ts` line 313 builds the `published` check from every entry of `w.approval`. A seventh part `print` with a draft default goes into that check.
- F7. `ApprovalSchema` (`lib/lesson-package/schema.ts`) holds `status` and `date` only. FR-1.3 needs Daniel's exact words too.
- F8. `PROJECT_CHECKS` accepts one FAIL line, and only `published` (st2/1, spec P14). A second FAIL line from the new print check fails the gate.

Facts measured on 2026-10-25 at 104215e (r2). The strategy role ran no vitest, tsc, or gate, because the Green mutant run M1 to M10 was active. Code facts come from `git show HEAD:<file>`.

- F9. `ApprovalSchema` (`lib/lesson-package/schema.ts` line 17) is a plain `z.object` with `status` and `date`. Zod strips unknown keys, so a week with `approval.text.source` parses today and loses the key. A test that only asserts "parses" passes before Green 2 (A4). R14 must assert the parsed values.
- F10. The cycle 1 test helper `withPrint()` (`__tests__/storytime-print-contract.test.ts` line 79) holds `{ text: 'and', pictureWord: 'net' }`. Under the R13 rule, the cycle 1 test "R3: passes the complete week 1 block" goes red. Red 2 must change this value to `nut`.
- F11. The checker counts a SHA only on the first line of a task (`^- \[([ ~x])\] (.+)`). The Green task (plan line 71) has its SHA on a sub-bullet (line 76). Probe D below gives `FAIL: some completed [x] tasks lack commit SHA evidence`.
- F12. `content/storytime/l2/print/pictures.json` at HEAD is an array of 192 rows: 112 story pages, 14 covers, 63 check rows, 3 practice lines (`nose`, `nest`, `net`). Test R10 compares `pictures.json` only. No test compares the committed `pictures.md` with its generator (A10 gap).
- F13. No color row id ends with `-line` today (0 collisions). The slug comes from the page text, so a later text such as "A line." can make a color name that equals a line-art name.
- F14. The monorepo `storytime_advantage_program_20261021/plan.md` lines 67, 80, 82, and 155 are the same at 2ae13a4c6 (the spec source) and at 3504b8d7a (the file head on 2026-10-25). The lines cite Daniel's Thai check passes of 2026-10-22. No line holds Daniel's own words.
- F15. Commit 4d78b21 (2026-10-23) has the message line `Daniel, 2026-10-23, in the Workbooks session: "publish week 1"`.
- F16. Geometry risk for Phases 2 and 4: two A6 pages side by side are 2 × 105 = 210 mm, the full A4 width. A leaf torn at the perforation 12 mm from the spine is 198 mm wide. A strip of two full A6 pages does not fit the torn leaf (open point P15, section 6).

Checker probe of 2026-10-25 (r2) on a temporary git repo in `/tmp/opencode/probe-strategy-r2/`, with a copy of `plan.md` at 104215e. The real plan did not change. Phase heading: `Phase 1: Contracts and the picture list (2026-10-26 to 2026-10-28)`. Results are the checker output lines:

| Probe | State | Result |
|---|---|---|
| A | mid-red, a test-only commit, plan unchanged (Content `[~]`, Red 2 `[ ]`), baseline = HEAD before Red 2 | `PASS: mid-red gate passed` |
| B | mid-red, Red 2 `[x]` with a first-line SHA after the Green `[x]` task, Green 2 `[~]`, same baseline | `PASS: mid-red gate passed` |
| C | as B, baseline = a commit before the cycle 1 Green code | `FAIL: Mid Red changed non-test/non-Measure files` (`dashboard/lib/code.ts`) |
| C2 | as B, `RED_TEST_COMMAND=true` | `FAIL: RED_TEST_COMMAND failed (expected failure, exit 0)` |
| D | jr-green, all 9 Phase 1 tasks `[x]`, the Green task SHA only on a sub-bullet | `FAIL: some completed [x] tasks lack commit SHA evidence` |
| E | as D, the SHA on the first line of the Green task | `PASS: jr-green gate passed` |
| F | as E, Hand-off `[ ]` | `FAIL: current phase still has 1 non-deferred incomplete tasks` |

Probe conclusions: (1) both gates accept a second Red task after a Green task that is `[x]`; the checker reads markers, not task order. (2) Probe A shows that the `[~]` check of the mid-red gate is vacuous in cycle 2, because the Content task is `[~]` already. (3) The mid-red `--baseline` must be the HEAD right before Red 2, not `phase_base_sha` (probe C). (4) The jr-green role gate needs all 9 tasks `[x]`, each with a first-line SHA.

## 2. Risk classification and review gates

| Phase | Risk | Review A | Review B | Review C | Adversarial | UX browser |
|---|---|---|---|---|---|---|
| 1 Contracts and picture list | high | yes | yes, data and validation; approval records (A2, data provenance) | yes | yes | not applicable |
| 2 Student workbook, week 1 | high | yes | yes, HTML escape and QR input | yes | yes | not applicable |
| 3 Teacher book print, week 1 | medium | yes | limited (file paths) | yes | yes | not applicable |
| 4 Readers, week 1 (workbook strips and color A3 PDFs) | high | yes | yes, Forge files and `manifest.json` are outside input | yes, the A3 PDF is a new non-PDF/X output | yes | not applicable |
| 5 Covers, week 1 | medium | yes | yes, Forge art | yes | yes | not applicable |
| 6 Week 1 proof, owner gate | critical | proof check | no code; the A3 file list is checked | no code | no | not applicable |
| 7 Weeks 2 to 8 | high | yes | yes, the week blocks and the Forge batches | yes | yes | not applicable |
| 8 Card kit | medium | yes | limited | yes | yes | not applicable |
| 9 Release proof, print order | critical | proof check | yes, files leave the company; the teacher A3 file list | order sheet | stale-file attack | not applicable |
| 10 Hand-off | low | memory files | no | no | no | not applicable |

Review B applies to Phase 1. The phase changes the validation boundary of a published week package. It adds a script that writes files from a CLI argument, and it sends a list to another team. The phase has no network call, no secret, no paid call, and no authentication surface. Review B checks the Zod boundary (unknown keys fail), the `--level` path input (an integer from 1 to 4 only), the write folder (`content/storytime/l<n>/print/` only), and the data that goes to Forge (no local paths, no credentials).

Cycle 2 adds approval records to the 8 week files. These records gate publication, so Review B also checks data provenance (A2): (1) each `source` exists at its pinned commit and states a pass on the recorded date; (2) no record holds `words` that its source does not hold; (3) the week 1 parts `images`, `audio`, and `song` stay draft, so the `published` check of st2/1 stays FAIL; (4) the records are a default that Daniel checks (spec P14), and the hand-off page says so.

UX browser review: `UX_REQUIRED=never`. The outputs are print files, not app screens. These checks replace it: (1) a contact sheet of every page at 100 dpi, and the agent opens every page and lists defects (rule 6.5); (2) `PRINT_GATE` on every print file; (3) person checks (QR scan, cut test, object count); (4) Daniel's proof checks. If the orchestrator runs the UX role, the role writes `ux_applicability: not_applicable` and `webbridge_status: not_run`.

## 3. Evidence classes

Each task note names one or more classes: owner-approved (Daniel only), person-checked (a named person did a physical check), automated (a gate command with its exit code), model pre-check (rule 6.7, never an approval), peer-report (a peer session reply, such as the PM session). A self-report closes no task (rule 7.2). A PM relay of Daniel's words is a peer-report, not owner-approved.

## 4. Phase 1 in full: Contracts and the picture list

### 4.1 Task order and owners

The table below is the cycle 1 order (done up to step 3). Section 4.13.1 gives the cycle 2 order, which replaces steps 3 to 7.

The checker needs every counted task of the phase closed before the jr-green gate (F5). The order below lets the gates pass.

| Order | Task | Owner | Evidence | Closes when |
|---|---|---|---|---|
| 0 | Strategy (this file) | strategy role | automated | committed |
| 1 | Red | mid-red | automated | Red commit; Green task set to `[~]` |
| 2 | Green | jr-green | automated | four gates pass |
| 3 | Content (week 1 `print` block) | jr-green writes; one independent review subagent of another model family reads | automated + peer-report | the print-text check passes, and each review finding is fixed or answered |
| 4 | Hand-off to the PM session | orchestrator | peer-report | the PM session confirms receipt (see rule G1) |
| 5 | Manual Verification | orchestrator | automated + orchestrator check | the steps in 4.6 pass; checkpoint commit |
| 6 | jr-green role gate | orchestrator | automated | `role-gate --role jr-green` PASS |
| 7 | Review A, B, C, then adversarial, then phase acceptance | audit roles | automated | each audit JSON is `pass` on one HEAD |

The Content task comes after the Green code, because the Green tests need the week 1 block. It comes before the jr-green gate, because the gate runs `GREEN_TEST_COMMAND`. A review finding after step 6 gives a remediation commit; then Reviews A, B, and C run again on the new HEAD.

### 4.2 Phase base SHA

The orchestrator captures `phase_base_sha` with `git rev-parse HEAD` right after the commit of this file lands. It does this before it starts Mid Red. The first Red commit has the strategy commit as its parent. This file holds no SHA for that purpose.

### 4.3 Red

Command: `RED_TEST_COMMAND` (`cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts`).

File: `dashboard/__tests__/storytime-print-contract.test.ts`. The commit holds only this file and plan markers in `measure/`.

Red proof (all three must be true):

1. The command exits non-zero.
2. The output has the labeled line `Tests  <n> failed` with n of 1 or more. The output does not have `No test files found` (F1).
3. Each failure is an assertion failure or a missing export inside a test body. Load new modules (`lib/storytime/print/*`) with `await import()` inside each test, so that a missing module fails single tests and not the file load.

Characterization tests pass at Red, and the Red log names them: the 8 shipped weeks parse with the current schema. They guard the additive change (FR-1.4).

Tests (plan lines 54 to 58, with these additions):

- R1. The 8 shipped weeks parse, and `approval.print.status` is `draft` for each week.
- R2. A week 1 copy with a full `print` block parses. A copy with an unknown key in the block fails. A copy with an unknown part name fails.
- R3. The print-text check gives no error on the shipped week 1 with its block. On a copy with one A7 word removed from the practice sheet, it gives the error id `print-practice`. Addition: on a copy with the teacher-only words "Look at the page" added to the practice sheet, it gives an error too (spec FR-1.2: "A difference is an error").
- R4. A week with no `print` block gives a WARN with a fixed id (proposal: `print-missing`), not a FAIL. Weeks 2 to 8 have no block until Phase 7, and `PROJECT_CHECKS` accepts only the `published` FAIL (F8). A test asserts that week 1 has the block and that its print checks have status PASS, so that a deleted block does not pass silently (A4).
- R5. Picture list of week 1, counted by use label: 16 story-page rows, 2 cover rows, 9 check-row rows with the ids nest, cat, fish, dog, nose, bus, hat, cup, net in data order, and one practice-line row for each picture word of the block. Assert each count exactly, not a total (A3).
- R6. Size class by use: story page A, cover B, check row and practice line C (FR-9). The plan bullet "a size class A, B, or C" alone is too weak (A3).
- R7. Every file name matches `^l2-w\d{2}-[a-z-]+-v\d+\.png$`. Ids and file names are unique across weeks 1 to 8. The week part of the name equals the row week.
- R8. Week 8 (`books: []`) gives 0 story-page rows and 0 cover rows and does not throw.
- R9. Approval contract (F6, F7): an approved `print` part with no date or no words fails the parse. A published week with six approved app parts and a draft `print` part gives no `published` problem for `print` (rule G5; the orchestrator confirms the rule before Red).
- R10. Drift guard (A10): the committed `content/storytime/l2/print/pictures.json` equals the output of the list function on the shipped weeks. This test is red at Red, because the file does not exist.

Mutation tests run on copies in a folder from `fs.mkdtemp` (rule 11.1). Tests do not change a source file in place.

### 4.4 Green

Gate: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0. `tsc` runs under `flock ~/Desktop/primary-parity-progress/heavy.lock`. Run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed. The first `PROJECT_CHECKS` run records the `tsc` result, because the plan baseline did not run it (A5).

Live behavior proof: run `npx tsx scripts/storytime/print-pictures.ts --level 2` in `dashboard/`, then `git diff --exit-code content/storytime/l2/print/`. Exit 0 proves that the committed list is the script output. Run `npx tsx scripts/storytime/check-weeks.ts --level 2` and record the FAIL lines: only `published` for st2/1.

Mutation proof (the Green log records `mutants: <n>, caught: <n>` as labeled integers):

| Id | Mutant | Must fail |
|---|---|---|
| M1 | The text check skips step A7 | R3 |
| M2 | The text check ignores extra words | R3 addition |
| M3 | `print` approval without `.default(DRAFT)` | R1 |
| M4 | The `print` block schema accepts unknown keys | R2 |
| M5 | The list drops the cover rows | R5 |
| M6 | Story pages get class C | R6 |
| M7 | A file name without `-v1` | R7 |
| M8 | The `published` rule counts `print` | R9 |
| M9 | A missing block gives PASS for week 1 | R4 |
| M10 | The script writes a list that differs from the committed file | R10 |

A mutant that changes a source file in place needs a copy first, and a compare after the run (lessons-learned, 2026-10-22).

### 4.5 Content task

The block in `content/storytime/l2/w01.json` comes from steps A3, A7, C3, and D4. Week 1 values: letter n with the A3 formation words; practice lines that hold "A nest. A net." and the tricky word "and"; C3 dictation of n and the trace word "a"; D4 trace text "Hello, I am" and a name line. Automated proof: the print-text check passes, and `check-weeks.ts` gives no new FAIL. Peer-report proof: one independent review subagent reads the block against the scripts, read-only, and reports findings with file, line, current text, proposed text, and severity (lessons-learned, 2026-10-22). Its log goes to `measure/runs/storytime_print_r1_20261025/`. Daniel sees the block in the week 1 proof (Phase 6); Phase 1 does not wait for him.

### 4.6 Manual Verification (orchestrator)

1. Run the four Green gates and record each exit code.
2. Open `pictures.md` and count the week 1 rows by use. Compare them with R5. Cycle 2: confirm the header "Version 2", a line-art name on every row, and the practice rows `nose`, `nest`, `nut`.
3. Confirm that `git status --porcelain video/` is unchanged by this phase.
4. Confirm each `[x]` SHA with `git cat-file -e <sha>^{commit}` (F4). Confirm that each `[x]` task has its SHA on its first line (F11).
5. Cycle 2: run `npx tsx scripts/storytime/check-weeks.ts --level 2` in `dashboard/`. The only FAIL line is `published` for st2/1, with the detail `images not approved; audio not approved; song not approved`.

Phase 1 has no owner gate, so this task does not wait for Daniel.

### 4.7 Phase closeout gate

- `role-gate --role jr-green` PASS.
- Review A, B, and C JSON `pass` on one HEAD; adversarial JSON `pass` with `PROJECT_TESTS`; phase acceptance `pass` on an immutable HEAD.
- The mutation tables of 4.4 (M1 to M10) and 4.13.4 (M11 to M22) are complete, with every mutant caught.
- Every `[x]` task has a real SHA (F4) and an evidence class.

### 4.8 Adversarial targets

- Make the text check pass when it must fail: case changes ("Nest"), punctuation ("A nest A net"), a curly quote, a word that occurs only in `easier` or `harder`.
- A block with an empty practice sheet, or a line with only a picture word.
- Two weeks that give the same file name.
- `--level 9`, `--level ../x`, and a missing `--level` on the picture script.
- Week 8 and a week with `books: []`.

### 4.9 Changed contracts and guardrails

- `StorytimeWeekSchema` has 9 callers (plan line 50). The change is additive. `storytime-week.test.ts`, `storytime-manual.test.ts`, and `storytime-phonemes.test.ts` stay green without edits.
- `STORYTIME_APPROVAL_PARTS` and the `published` rule (F6) are the riskiest wiring. Review C checks both.
- The picture-list JSON is an interface to Forge. Its row id is the key of the Forge `manifest.json` (FR-9). Review C checks that the fields of FR-2.2 are present.
- `w01.json` is published. The `print` block adds a key and changes no other field. Review C compares the other fields of the file before and after the commit.
- New code lives in `lib/storytime/print/` and `scripts/storytime/`. It does not import from `app/` or from the Primary print templates.

### 4.10 Anti-pattern coverage, Phase 1

| A | Defense |
|---|---|
| A2 | R9: an approved `print` part needs Daniel's words and the date. |
| A3 | Exact counts by use label (R5, R6); labeled `Tests  <n> failed` at Red; labeled mutant counts; SHA checked with `git cat-file` (F4). |
| A4 | Red proof excludes `No test files found` (F1); R4 refuses a silent pass when the week 1 block is gone. |
| A5 | Task notes quote measured exit codes only; the `tsc` result is measured, not assumed. |
| A6 | `tracks.md` says nothing about print readiness in Phase 1. |
| A7 | No word filter in the print-text check; it compares exact word lists. The checker "deferred" filter is A7-class (F3, rule G2). |
| A9 | New tests load `content/storytime/l2/*.json` only, not track paths. |
| A10 | R10 drift guard on the committed picture list. |

A1 and A8 are retired. A8 had the same class as the `[ ]` question in rule G3.

### 4.11 Artifact tests and live tests

Artifact tests read committed files: the picture list, plan markers, and approval data. Live tests run the code: the check on the shipped weeks, the picture script with the drift diff, and `check-weeks.ts`. A pass of an artifact test does not prove live behavior. Phase 1 needs both.

### 4.12 Intentionally red

- `RED_TEST_COMMAND` is red only between the Red commit and the Green commit. Cycle 2: red from the Red 2 commit to the list version 2 commit of the same jr-green run (section 4.13.1). No push happens inside that window.
- `check-weeks.ts --level 2` keeps one FAIL, `published` for st2/1 (P14). Its detail text gets "print not approved" only if rule G5 is rejected. After Content 2, the detail is exactly `images not approved; audio not approved; song not approved`. This FAIL stays until Daniel approves new week 1 media; it is intended.
- The full dashboard suite has 3 known failing tests (tech-debt, 2026-09-30). `PROJECT_TESTS` does not include them.
- No other test may be committed red.

### 4.13 Phase 1 cycle 2: Red 2, Green 2, Content 2 (plan lines 80 to 86)

Cycle 2 adds the FR-9 v1 fields to the picture list, the picture-word rule (review finding F1), and the P14 approval records. Risk: high. The approval records change the publication gate of a published week (A2).

#### 4.13.1 Task order and owners

`phase_base_sha` stays fbefeff. The orchestrator does not capture it again. Right after the commit of this strategy update lands, the orchestrator records `red2_base=$(git rev-parse HEAD)`. It uses `red2_base` as `--baseline` of the mid-red gate (probe C) and of the jr-green gate.

| Order | Task | Owner | Evidence | Closes when |
|---|---|---|---|---|
| 0 | Strategy r2 (this update) | strategy role | automated | committed; then `red2_base` is recorded |
| 1 | Red 2 | mid-red | automated | the Red 2 commit; Red 2 `[x]` with `commit <sha>` on its first line; Green 2 `[~]` |
| 2 | Green 2 code | jr-green, one run | automated | commit G2a: `schema.ts`, `text-check.ts`, `pictures.ts` (and `checks.ts` only if the wiring needs it) |
| 3 | Content 2 data | jr-green, same run | automated | commit G2b: `w01.json` to `w08.json`, the approval blocks and the F1 line only |
| 4 | Green 2 script rerun | jr-green, same run | automated | commit G2c: `pictures.json` and `pictures.md`, list version 2, the script output on the G2b data |
| 5 | Green 2 gates | jr-green, same run | automated | the four gates and the live proofs of 4.13.5 pass on G2c; Green 2 `[x]`; Content 2 stays `[~]` |
| 6 | Content 2 review | orchestrator starts one read-only review subagent | peer-report | the review log is in `measure/runs/storytime_print_r1_20261025/` |
| 7 | Review follow-up | jr-green | automated + peer-report | each finding is fixed or answered; Content `[x]` and Content 2 `[x]` |
| 8 | Hand-off | orchestrator | peer-report | the PM session confirms receipt of list version 2 |
| 9 | Manual Verification | orchestrator | automated + orchestrator check | the steps of 4.6 pass |
| 10 | jr-green role gate, then Reviews A, B, C, adversarial, phase acceptance | orchestrator, audit roles | automated | as 4.7 |

Q-a (Green 2 and Content 2 in one jr-green run): confirmed, with one correction. The run does not close the gates "after both" tasks. It closes the Green 2 gates after the G2c commit. Content 2 stays `[~]` until its review (step 6). Reason: the Green 2 gate needs the Content 2 data. R4 of cycle 1 and R13 need the F1 fix in `w01.json`, and R14 needs the records. The jr-green role gate needs all 9 tasks `[x]` (probe F), so it runs at step 10.

Q-b (the owner of the rerun): Green 2 owns the rerun, as commit G2c after the G2b data commit. Then the committed list version 2 is the script output of the final code on the final data. R10 and R10b prove it, and the live proof (rerun plus `git diff --exit-code`) proves it again. The rerun does not go into the Content 2 commit. Then the Content 2 reviewer can read the hand-made data apart from the generated list.

The first Content task (now `[~]`) closes at step 7. Its first line becomes `- [x] Task (Content): ... commit 1c4b47a; F1 fixed in commit <G2b sha>.` Evidence: automated plus peer-report (review log `print-block-review-1c4b47a.log`). F2 to F6 are notes for Daniel's week 1 proof. The Hand-off page lists them.

The Content 2 review subagent: read-only, model family other than GLM (the Green model). Default: `minimax-cn-coding-plan/MiniMax-M3#high`, because it found F1 and can confirm the fix; use Kimi if its quota allows. Session name: "Content 2 review · P1 · storytime_print_r1". It reads: (1) each approval record against its source at the pinned commit; (2) the F1 line; (3) the list version 2 diff: the row `l2-w01-practice-line-net` is gone, the row `l2-w01-practice-line-nut` is new, and every other row changes only by the new fields (`lineArtFileName`, `width`, `height`). It reports findings with file, line, current text, proposed text, and severity.

A Green 2 mutant run must not overlap the M1 to M10 run, because both change files in place.

#### 4.13.2 Red 2

Command: `RED_TEST_COMMAND`. Files: the new `dashboard/__tests__/storytime-print-contract-v2.test.ts`, and a one-value change in `dashboard/__tests__/storytime-print-contract.test.ts` line 79: `pictureWord: 'net'` becomes `pictureWord: 'nut'` (F10). The commit holds only these two test files and plan markers. The mid-red gate accepts both test files (probe B).

Red proof: as 4.3, items 1 to 3. Also: the cycle 1 tests stay green at Red 2 (the `nut` change passes under the cycle 1 code). The Red log gives `Tests  <n> failed | <m> passed` as labeled integers, and names each failing test. Because probe A shows a vacuous `[~]` check, the orchestrator also runs `grep -c '^- \[~\] Task (Green 2)' measure/tracks/storytime_print_r1_20261025/plan.md` and expects `1`.

Tests (exact ids, exact counts; new modules load with `await import()` inside each test):

- R11. Line-art names (FR-2.3, FR-9).
    - Each row has `lineArtFileName` equal to `fileName.replace(/-v(\d+)\.png$/, '-line-v$1.png')`.
    - Each line-art name matches `^l2-w\d{2}-[a-z-]+-line-v\d+\.png$`.
    - On the shipped weeks 1 to 8, the union of the 192 color names and the 192 line-art names has 384 distinct values.
    - Collision guard (F13): on a temporary week 1 copy with a story page text "A line." next to a page text "A.", the color name and the line-art names stay distinct, or the list throws with the two ids. A silent duplicate fails the test.
- R12. Picture spec v1 constants (FR-9).
    - The export `STORYTIME_PICTURE_SPEC` is exactly `{ A: { width: 4000, height: 3000 }, B: { width: 4000, height: 3000 }, C: { width: 1500, height: 1500 } }`.
    - Each row has `width` and `height` equal to the constant of its `sizeClass`. The two outputs of a row share these fields, so the line art has the same pixel size (FR-9).
    - The shipped list counts by use, as labeled integers: story-page 112, cover 14, check-row 63, practice-line 3, card 0, sticker 0.
- R13. The picture-word rule, error id `print-picture-word` (status `fail`).
    - Rule: compare lower-case word tokens, with punctuation removed (the `stem` of `text-check.ts`). The picture word of a practice line is not a token of another practice line of the block. It is a week word: a token of a reader page text, a picture word of `check.items`, or a word of `home.words`.
    - A week 1 copy with `net` on the "and" line gives `print-picture-word` FAIL. The detail names the line ("and") and the other line ("A nest. A net.").
    - A copy with `Net` on the "and" line also fails (case).
    - A copy with `zebra` on the "and" line fails (not a week word).
    - A copy with `nest` on the line "A nest. A net." passes: a word on its own line is allowed (A7: the rule must not be over-broad).
    - `checkStorytimeWeek` on the net copy gives the same FAIL, and the `published` detail of a published copy contains `print-picture-word fails`.
    - The shipped week 1 gives `print-picture-word` PASS. This test is red at Red 2 and turns green only after G2b (F1 fix).
- R14. The approval records (spec FR-1.3 and P14).
    - R14a, schema: on a temporary copy, each of the six app parts with `{ status: 'approved', date: '2026-10-23', words: 'Synthetic test words; not an owner decision.', source: 'Synthetic test source.' }` parses to an equal object (`toEqual`). "Parses" alone is not the test (F9). An approved app part with only `status` and `date` still parses (no new rule).
    - R14b, record (a): for each shipped week w of 1 to 8, `approval.thai` equals exactly `{ status: 'approved', date: '2026-10-22', source: SRC_THAI[w] }`, with no `words` key. `SRC_THAI[w]` is `reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line <n>`, with n = 67 (week 1), 80 (weeks 2 to 4), 82 (weeks 5 to 7), 155 (week 8). The pinned commit makes the line number checkable (F14).
    - R14c, record (b): `w01.json` `approval.text` and `approval.scripts` each equal exactly `{ status: 'approved', date: '2026-10-23', words: 'publish week 1', source: 'Workbooks commit 4d78b21 (decision S29)' }` (F15).
    - R14d, record (c) and the rest: `w01.json` `images`, `audio`, and `song` equal `{ status: 'draft' }`. In weeks 2 to 8, every part except `thai` equals `{ status: 'draft' }`. In all 8 weeks, `print` equals `{ status: 'draft' }`.
    - R14e: the `published` check of the shipped st2/1 has status `fail` and the detail exactly `images not approved; audio not approved; song not approved`.
- R10b. Drift guard of the readable list (F12, A10): the committed `pictures.md` equals `pictureListMarkdown(rows, 2)` of the shipped weeks. Its header line says "Version 2". Each row line holds the line-art name and the pixel size.

Mutation copies: the tests change copies in `fs.mkdtemp` folders only, as cycle 1.

#### 4.13.3 Green 2

Code: `pictures.ts` (the `lineArtFileName`, `width`, and `height` fields, `STORYTIME_PICTURE_SPEC`, list version 2 in the markdown), `text-check.ts` (the `print-picture-word` check), and `schema.ts` (`source` and `words` on the six app parts).

Guardrail: do not change `ApprovalSchema` in `lib/lesson-package/schema.ts`. Primary lesson packages use it. Use a Storytime extension in `lib/storytime/schema.ts`, for example `ApprovalSchema.extend({ source: z.string().min(1).optional(), words: z.string().min(1).optional() })`. Recommendation: make the extension `.strict()`, so that a misspelled key (`wrods`) fails and is not stripped (A7). This is a shape rule, not a new approval rule. If the orchestrator rejects it, R14a drops the typo case.

Content 2 data (commit G2b): edit with Python and keep the JSON format of each file. The diff of each week file holds the `approval` block, and for `w01.json` also the F1 line (`"pictureWord": "nut"`). Review C compares all other keys before and after (parsed equality).

#### 4.13.4 Mutation proof, cycle 2

The Green 2 log records `mutants: <n>, caught: <n>` as labeled integers. A data mutant changes a week file in place: keep a copy first, and compare it after the run (lessons-learned, 2026-10-22).

| Id | Mutant | Must fail |
|---|---|---|
| M11 | `lineArtFileName` equals `fileName` | R11 (pattern, 384 distinct) |
| M12 | `-line` after the version (`-v1-line.png`) | R11 |
| M13 | Class A at 3000 × 2250 (spec v0) | R12 |
| M14 | Class C at 4000 × 3000 | R12 |
| M15 | The `print-picture-word` check is not called | R13 (net copy) |
| M16 | The other-line compare is case-sensitive | R13 (`Net` copy) |
| M17 | The week-word test is removed | R13 (`zebra` copy) |
| M18 | The rule also compares a picture word with its own line | R13 (shipped week 1, `nest`) |
| M19 | The six app parts use the plain `ApprovalSchema` (keys stripped) | R14a |
| M20 | Data: `w01.json` `approval.images` approved with a date | R14d, R14e |
| M21 | Data: `w03.json` thai source line 82 in place of 80 | R14b |
| M22 | `pictureListMarkdown` writes "Version 1" | R10b |

#### 4.13.5 Gates and live proofs, cycle 2

Green gate: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0 on G2c, with `tsc` under the heavy lock. Run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed.

Live proofs: (1) `npx tsx scripts/storytime/print-pictures.ts --level 2`, then `git diff --exit-code -- ../content/storytime/l2/print/` exits 0; (2) `check-weeks.ts --level 2` gives one FAIL line, `published` for st2/1, with the R14e detail; (3) `jq length content/storytime/l2/print/pictures.json` gives 192.

Closeout gate of cycle 2: the jr-green role gate with `--baseline <red2_base>` PASS (probe E), then 4.7.

#### 4.13.6 Evidence class of each new task

| Task | Evidence class | Not enough alone |
|---|---|---|
| Red 2 | automated (labeled Red counts) | a non-zero exit (F1) |
| Green 2 | automated (four gates, live proofs, M11 to M22) | the Green self-report (rule 7.2) |
| Content 2 | automated (R13, R14 green) plus peer-report (review log) | not owner-approved: the P14 mapping is a default that Daniel checks |
| Content (cycle 1) | automated plus peer-report (`print-block-review-1c4b47a.log`) | the F1 fix needs its own commit |
| Hand-off | peer-report (PM receipt) | a sent message without a reply |

#### 4.13.7 Anti-pattern coverage, cycle 2

| A | Defense | Falsified when |
|---|---|---|
| A2 | R14b to R14e pin each record to its source; no invented `words`; three week 1 parts stay draft; Review B provenance check | M20 or M21 survives, or a record cites a line that does not say a pass |
| A3 | Exact `toEqual` records; labeled counts 112/14/63/3 and 384 names | a test that asserts "has a source" or a total only |
| A4 | R14a asserts values, not "parses" (F9); the explicit Green 2 `[~]` grep (probe A) | M19 survives |
| A7 | R13 `nest` case (no over-broad rule); `.strict()` app parts | M18 survives |
| A10 | R10 and R10b; the rerun commit G2c | M22 survives, or the live diff is not empty |

### 4.14 Hand-off content (cycle 2)

The Hand-off message sends picture list version 2 and FR-9 v1. It calls the list "version 2, before Reviews A, B, and C". A review change sends version 3 (rule 12.2). The one page for Daniel holds P6, P7, P9, P11, the P2 defaults check, the P14 record mapping check, the F2 to F6 notes, and P15 (F16).

## 5. Phases 2 to 10: outline

| Phase | Red command | Green gate | Closeout gate | Riskiest behavior and mutant |
|---|---|---|---|---|
| 2 | `RED_TEST_COMMAND` on `storytime-print-student-book.test.ts` | four gates + `PRINT_GATE` + the K-channel check | contact sheet, every page opened; person scans 2 QR codes (person-checked) | spread on a right page; answer mark on the check page; home card removed; one trim constant (mutant: a hard-coded A4 size); a gray or `#000` RGB fill that converts to four-color black (mutant: one gray rule); a color picture in the workbook (mutant: a color file name) |
| 3 | `storytime-print-teacher-book.test.ts` | four gates + `PRINT_GATE` | text gate 0 differences or each listed | text gate passes when it reads the PDF/X file (Thai tone marks lost); mutant: one changed Thai word gives 0 differences |
| 4 | `storytime-print-readers.test.ts` | four gates + `PRINT_GATE` on the workbook strips in `final` mode + the A3 checks | three picture stages on both outputs; person count (rule 9.2); a person cuts, folds, and staples one printed reader (person-checked) | strip imposition; duplex registration; `final` mode with a missing picture; picture-check passes RGBA, CMYK, 3000 × 2250, or a color file in the line-art place |
| 5 | `storytime-print-covers.test.ts` | four gates; Primary cover tests green | Daniel approves the workbook and teacher book cover pictures and the two reader cover pictures, line art and color (owner-approved) | copy check bypass ("cefr", a non-breaking hyphen in "Pre‑A1"); alpha in the composed side; a reader cover page without "Sprout" |
| 6 | none (no code) | `PRINT_GATE` on each printer file; the A3 checks on each color A3 PDF | Daniel's exact words and date in `approval.print` of `w01.json` (owner-approved) | a proof file older than its sources; no answer counted as approval (rule 0.3); an A3 PDF on the print order sheet |
| 7 | the extended print tests | four gates + `PRINT_GATE` for each printer file + the A3 checks | contact sheets of all files; one review subagent per week block (peer-report) | week 8 review pages and the Benchmark 1 page; R4 WARN turns into a PASS for all 8 weeks; 14 readers fill 21 leaves |
| 8 | `storytime-print-card-kit.test.ts` | four gates + `PRINT_GATE` | person cuts one sheet of each size (person-checked) | a hand-written expected list that copies the code (A3); mutant: one removed materials item |
| 9 | none | `PRINT_GATE` + date check against `git log -1 --format=%cI -- <sources>`; the A3 checks and the SHA-256 list of the 14 A3 PDFs | Daniel's approval and his go to send (owner-approved) | a stale print file; a QR URL that gives HTTP 404 (P4); an A3 PDF on the printer list |
| 10 | none | `PROJECT_TESTS`, `PROJECT_LINT`, `PROJECT_CHECKS` | final acceptance, closeout | memory files over 50 lines; an empty "facts changed" list sent as a valid answer |

Model pre-check (Phases 4, 5, and 7): no paid run before Daniel names the models and the price (P7). The rubric first fails the known bad picture and passes a picture that Daniel approved. The pre-check runs on both outputs of a row.

### 5.1 Check methods of the amended plan (2026-10-25)

- K-channel check (Phase 2, AC-1, P2 "inside black only"): `gs -q -o - -sDEVICE=inkcov <file>` gives C, M, and Y of `0.00000` on every inside page. A falsifying fixture: a copy with one `rgb(128,128,128)` rule must give C, M, or Y above 0. Reason: `make-pdfx.ts` converts RGB to CMYK, and RGB black can become four-color black. The cover file is 4/0 color and is out of this check.
- Perforation marks (Phases 2 and 4): every reader leaf and every home-card leaf has the mark 12 mm from the spine. The spine is the left edge of a right page and the right edge of a left page. The test reads the page parity from the page order. A mutant that puts every mark on the left edge fails on a left page.
- Strip imposition and page pairs (Phase 4): each reader is 3 strips; strip 1 holds 12/1 (front) and 2/11 (back), strip 2 holds 10/3 and 4/9, strip 3 holds 8/5 and 6/7. Two strips sit on each A4 leaf with a dashed cut line at 148.5 mm. Duplex registration: the back of a strip is in the same position (top or bottom) as its front under a long-edge flip. Each strip has the reader and strip mark. The two readers of a week fill 3 leaves. Mutants: a swapped back side; a pair 1/12 in place of 12/1.
- Strip width (Phase 4, F16): the strip fits the leaf width that is left after the tear. The test asserts the strip width from the profile constant against `210 - 12` mm. This test waits for Daniel's answer to P15.
- Color A3 PDF checks (Phases 4, 6, 7, 9; AC-9): `pdfinfo` gives 12 pages, each `841.89 x 1190.55 pts (A3)`; `pdfimages -list` gives no `cmyk` image; the file has no `GTS_PDFX` output intent (not PDF/X); `pdftotext` finds no "PICTURE MISSING"; each picture is the color file, not the `-line` file. `PRINT_GATE` does not run on these files.
- Two-output picture check (Phases 4 and 7): `picture-check.ts` passes a color PNG (8-bit, 3 channels, sRGB, no alpha, class size) and a line-art PNG (8-bit, 1 channel, no alpha, the same size, white corners `255`). It fails a gray-filled line-art copy: more than 2 percent of the pixels with a value from 32 to 223 (the threshold is a default that the Phase 4 Red author sets on a known good file). It checks each `manifest.json` entry: the file name is a list name, the SHA-256 and the pixel size agree. The 12 px line width and the closed outlines are stage 2 and stage 3 checks, not stage 1.
- Reader covers (Phases 4 and 5): a reader cover is a reader page. The FR-6.3 copy check runs on it ("Sprout", "Storytime Advantage", the week number; no CEFR words). The calm top 30 percent of class B is a person check.
- Proofs (Phases 6 and 9): the print order sheet lists printer jobs only. The 14 A3 PDFs have their own list with the SHA-256 of each file. A test fails a sheet that lists an A3 PDF.

Phase 2 guardrail: P4 is answered. `STORYTIME_QR_HOST` stays the S23 host. Tests assert that each QR input equals `storytimeQrUrl(<data url>)`. The address gives HTTP 404 until the monorepo deploy, so the proofs carry the mark "QR target answers after the deploy (monorepo task 7.4)".

## 6. Rules for the checker

G1 (Hand-off timing). The hand-off is a counted Phase 1 task, so the list goes to the PM session before Reviews A, B, and C. Recommendation: move the Hand-off task to the first place of Phase 2, after Phase 1 acceptance. Then a reviewed list goes to Forge, and the 2026-10-28 date holds if Phase 1 ends on 2026-10-27. Fallback, if the task stays in Phase 1: the message calls the list "version 1, before review", and a review change sends version 2 (rule 12.2).

G2 (The word "deferred"). Use "deferred" only in the structural trailer `— deferred:<owner>` of a `[b]` line. In other task text, write "later" or "waits for". The checker drops any task whose first line holds the substring (F3).

G3 (Owner gates). One rule for this track: a task that waits for Daniel stays `[ ]`. Use `[b] … — deferred:daniel` only for a task that Daniel takes out of release 1 (for example, the A3 big book print, P8). Reason: the checker does not count a `[b]` line in any gate, and the closeout check does not count it either (F2). A `[b]` owner gate lets closeout pass with no approval, and that breaks AC-7 and AC-8. A `[ ]` owner gate keeps its phase open until Daniel answers. This is a recorded deviation from the skill marker list.

G4 (SHA evidence). Write each SHA as `commit <sha>`. The acceptance roles check each one with `git cat-file -e` (F4).

G5 (The `published` rule). Keep the `published` check on the six app parts. The print approval is a separate later gate, and FR-1.4 says that callers keep working. The orchestrator confirms this rule before Red; if it is rejected, test R9 and the P14 text change.

G6 (SHA on the first line). The checker reads only the first line of a task (F11, probe D). Put `commit <sha>` on the first line of every `[x]` task. Sub-bullets can hold more evidence.

G7 (Gate baselines in a second cycle). Use the HEAD before Red 2 as `--baseline` for the mid-red and jr-green gates of cycle 2 (probe C). Do not use `phase_base_sha` there. The mid-red `[~]` check is vacuous while another task is `[~]` (probe A), so the orchestrator checks the Green 2 marker by `grep`.

G8 (Open point P15, perforation geometry, F16). A strip of two A6 pages is 210 mm wide, and the torn leaf is 198 mm wide. Track default until Daniel answers: scale the reader page to 99 × 140 mm (the A6 aspect, scale 0.943), so that two pages fit 198 mm. The A3 PDF scale changes to 3.0. Other options for Daniel: (b) keep A6 and put the perforation at the binding edge (the printer must confirm that a perfect binding allows it); (c) keep A6 and accept a 12 mm cut on the inner page. This point blocks the Phase 2 and Phase 4 Red tests on leaf geometry, not Phase 1.

## 7. PM answers of 2026-10-25 (peer-report)

| Answer | Effect on this strategy |
|---|---|
| (a) Forge may start the week 1 pictures now | P12 is answered. The Phase 4 picture task can run when the batch comes. |
| (b) The text of weeks 1 to 8 and the Thai checks carry | P13 is answered. The tests use the shipped files as the master. No task makes book or check text again. |
| (c) The 11-05 stop rule does not apply to the week 1 print approval | P5 changes. On 2026-11-09, Phase 6 tells Daniel the Phase 7 date risk (plan line 46), not the old stop rule. |
| The app is in reading-advantage-monorepo | This conflicts with `storytime-advantage/docs/s1-s28-survival.md` (S23 dies; own service). P4 stays open. |

Update of 2026-10-25 (r2): Daniel's answers D1 and D2 (spec "Decisions of 2026-10-25", peer-report of owner words) answer P1, P3, P4, P5, P8, P12, P13, and P14, and answer P2 in part. P10 is moot. The conflict in the last row is resolved: the prints use the S23 address (P4).

Still open with Daniel: the P2 defaults check, the P14 mapping check, P6, P7, P9, P11, and the new P15 (G8). None of them blocks Phase 1: the picture list follows the data, and FR-9 version 1 is the spec that Forge uses now.
