# Test Strategy: storytime_print_r1_20261025

Written 2026-10-25 by the strategy role at e30399b. Phase 1 has full detail. Phases 2 to 10 have an outline; the strategy role refreshes each outline before its phase starts.

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

## 2. Risk classification and review gates

| Phase | Risk | Review A | Review B | Review C | Adversarial | UX browser |
|---|---|---|---|---|---|---|
| 1 Contracts and picture list | high | yes | yes, data and validation | yes | yes | not applicable |
| 2 Student book, week 1 | high | yes | yes, HTML escape and QR input | yes | yes | not applicable |
| 3 Teacher book print, week 1 | medium | yes | limited (file paths) | yes | yes | not applicable |
| 4 Books, week 1 | high | yes | yes, Forge files are outside input | yes | yes | not applicable |
| 5 Covers, week 1 | medium | yes | yes, Forge art | yes | yes | not applicable |
| 6 Week 1 proof, owner gate | critical | proof check | no code | no code | no | not applicable |
| 7 Weeks 2 to 8 | high | yes | yes | yes | yes | not applicable |
| 8 Card kit | medium | yes | limited | yes | yes | not applicable |
| 9 Release proof, print order | critical | proof check | yes, files leave the company | order sheet | stale-file attack | not applicable |
| 10 Hand-off | low | memory files | no | no | no | not applicable |

Review B applies to Phase 1. The phase changes the validation boundary of a published week package. It adds a script that writes files from a CLI argument, and it sends a list to another team. The phase has no network call, no secret, no paid call, and no authentication surface. Review B checks the Zod boundary (unknown keys fail), the `--level` path input (an integer from 1 to 4 only), the write folder (`content/storytime/l<n>/print/` only), and the data that goes to Forge (no local paths, no credentials).

UX browser review: `UX_REQUIRED=never`. The outputs are print files, not app screens. These checks replace it: (1) a contact sheet of every page at 100 dpi, and the agent opens every page and lists defects (rule 6.5); (2) `PRINT_GATE` on every print file; (3) person checks (QR scan, cut test, object count); (4) Daniel's proof checks. If the orchestrator runs the UX role, the role writes `ux_applicability: not_applicable` and `webbridge_status: not_run`.

## 3. Evidence classes

Each task note names one or more classes: owner-approved (Daniel only), person-checked (a named person did a physical check), automated (a gate command with its exit code), model pre-check (rule 6.7, never an approval), peer-report (a peer session reply, such as the PM session). A self-report closes no task (rule 7.2). A PM relay of Daniel's words is a peer-report, not owner-approved.

## 4. Phase 1 in full: Contracts and the picture list

### 4.1 Task order and owners

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
2. Open `pictures.md` and count the week 1 rows by use. Compare them with R5.
3. Confirm that `git status --porcelain video/` is unchanged by this phase.
4. Confirm each `[x]` SHA with `git cat-file -e <sha>^{commit}` (F4).

Phase 1 has no owner gate, so this task does not wait for Daniel.

### 4.7 Phase closeout gate

- `role-gate --role jr-green` PASS.
- Review A, B, and C JSON `pass` on one HEAD; adversarial JSON `pass` with `PROJECT_TESTS`; phase acceptance `pass` on an immutable HEAD.
- The mutation table of 4.4 is complete, with every mutant caught.
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

- `RED_TEST_COMMAND` is red only between the Red commit and the Green commit.
- `check-weeks.ts --level 2` keeps one FAIL, `published` for st2/1 (P14). Its detail text gets "print not approved" only if rule G5 is rejected.
- The full dashboard suite has 3 known failing tests (tech-debt, 2026-09-30). `PROJECT_TESTS` does not include them.
- No other test may be committed red.

## 5. Phases 2 to 10: outline

| Phase | Red command | Green gate | Closeout gate | Riskiest behavior and mutant |
|---|---|---|---|---|
| 2 | `RED_TEST_COMMAND` on `storytime-print-student-book.test.ts` | four gates + `PRINT_GATE` | contact sheet, every page opened; person scans 2 QR codes (person-checked) | spread on a right page; answer mark on the check page; home card removed; one trim constant (mutant: a hard-coded A4 size) |
| 3 | `storytime-print-teacher-book.test.ts` | four gates + `PRINT_GATE` | text gate 0 differences or each listed | text gate passes when it reads the PDF/X file (Thai tone marks lost); mutant: one changed Thai word gives 0 differences |
| 4 | `storytime-print-books.test.ts` | four gates + `PRINT_GATE` in `final` mode | three picture stages; person count (rule 9.2) | `final` mode with a missing picture; picture-check passes RGBA, CMYK, or 1024 px |
| 5 | `storytime-print-covers.test.ts` | four gates; Primary cover tests green | Daniel approves the cover pictures (owner-approved) | copy check bypass ("cefr", a non-breaking hyphen in "Pre‑A1"); alpha in the composed side |
| 6 | none (no code) | `PRINT_GATE` on each proof file | Daniel's exact words and date in `approval.print` of `w01.json` (owner-approved) | a proof file older than its sources; no answer counted as approval (rule 0.3) |
| 7 | the extended print tests | four gates + `PRINT_GATE` for each file | contact sheets of all files; one review subagent per week block (peer-report) | week 8 review pages and the Benchmark 1 page; R4 WARN turns into a PASS for all 8 weeks |
| 8 | `storytime-print-card-kit.test.ts` | four gates + `PRINT_GATE` | person cuts one sheet of each size (person-checked) | a hand-written expected list that copies the code (A3); mutant: one removed materials item |
| 9 | none | `PRINT_GATE` + date check against `git log -1 --format=%cI -- <sources>` | Daniel's approval and his go to send (owner-approved) | a stale print file; a QR URL that gives HTTP 404 (P4) |
| 10 | none | `PROJECT_TESTS`, `PROJECT_LINT`, `PROJECT_CHECKS` | final acceptance, closeout | memory files over 50 lines; an empty "facts changed" list sent as a valid answer |

Model pre-check (Phases 4, 5, and 7): no paid run before Daniel names the models and the price (P7). The rubric first fails the known bad picture and passes a picture that Daniel approved.

Phase 2 guardrail: do not change `STORYTIME_QR_HOST` before Daniel answers P4. Tests assert that each QR input equals `storytimeQrUrl(<data url>)`, not a fixed host. Proofs carry the mark "QR target open".

## 6. Rules for the checker

G1 (Hand-off timing). The hand-off is a counted Phase 1 task, so the list goes to the PM session before Reviews A, B, and C. Recommendation: move the Hand-off task to the first place of Phase 2, after Phase 1 acceptance. Then a reviewed list goes to Forge, and the 2026-10-28 date holds if Phase 1 ends on 2026-10-27. Fallback, if the task stays in Phase 1: the message calls the list "version 1, before review", and a review change sends version 2 (rule 12.2).

G2 (The word "deferred"). Use "deferred" only in the structural trailer `— deferred:<owner>` of a `[b]` line. In other task text, write "later" or "waits for". The checker drops any task whose first line holds the substring (F3).

G3 (Owner gates). One rule for this track: a task that waits for Daniel stays `[ ]`. Use `[b] … — deferred:daniel` only for a task that Daniel takes out of release 1 (for example, the A3 big book print, P8). Reason: the checker does not count a `[b]` line in any gate, and the closeout check does not count it either (F2). A `[b]` owner gate lets closeout pass with no approval, and that breaks AC-7 and AC-8. A `[ ]` owner gate keeps its phase open until Daniel answers. This is a recorded deviation from the skill marker list.

G4 (SHA evidence). Write each SHA as `commit <sha>`. The acceptance roles check each one with `git cat-file -e` (F4).

G5 (The `published` rule). Keep the `published` check on the six app parts. The print approval is a separate later gate, and FR-1.4 says that callers keep working. The orchestrator confirms this rule before Red; if it is rejected, test R9 and the P14 text change.

## 7. PM answers of 2026-10-25 (peer-report)

| Answer | Effect on this strategy |
|---|---|
| (a) Forge may start the week 1 pictures now | P12 is answered. The Phase 4 picture task can run when the batch comes. |
| (b) The text of weeks 1 to 8 and the Thai checks carry | P13 is answered. The tests use the shipped files as the master. No task makes book or check text again. |
| (c) The 11-05 stop rule does not apply to the week 1 print approval | P5 changes. On 2026-11-09, Phase 6 tells Daniel the Phase 7 date risk (plan line 46), not the old stop rule. |
| The app is in reading-advantage-monorepo | This conflicts with `storytime-advantage/docs/s1-s28-survival.md` (S23 dies; own service). P4 stays open. |

Still open with Daniel: P1 (7 + 7 + 7), P2 (print spec), P3 (picture style), P4 (QR link), the words that count as an approval, and P6 to P11. None of them blocks Phase 1: the picture list follows the data, and FR-9 version 0 is the default that Forge can use now.
