# Test strategy: Phase 1 grouping tasks (1.G1 to 1.G5)

Track: `levels_5_9_20261006`. Phase: "Phase 1: Decisions, inventory, tools, calibration".
Scope: Tasks 1.G1 to 1.G5 only. Other Phase 1 items are history or wait for Daniel.
Role base SHA: `4717eb95`. Date: 2026-11-19. Spec review passed in round 3.

## 1. phase_base_sha capture point

The orchestrator captures the immutable `phase_base_sha` at this exact point: run
`git rev-parse HEAD` immediately after the strategy commit lands and before any Red
work starts (before Task 1.G1 creates `dashboard/__tests__/plan-dedup.test.ts`).
That HEAD is the phase base. `4717eb95` is the role base and predates the strategy
commit; it must never be used as `phase_base_sha`. This document embeds no phase SHA.

## 2. Contract under test

`dashboard/scripts/plan-dedup.ts` gains exports: `Article`, `DedupOptions`,
`parseDedupArgs`, `planDedup` (pure), `displayPath`, and `main` (IO). New flags:
`--levels`, `--targets`, `--printed`, `--out-json`, `--out-md`. `main` parses, reads
the inventory, calls `planDedup`, writes exactly two files, prints log lines, returns 0.
A parse error prints `message` then usage to stderr and returns 2. No database write,
no network call, and no deletion occur in this phase.

The four highest risks:

1. **Byte identity of the levels 1–4 run.** A default run must reproduce the two
   committed files (`duplicates-levels-1-4.json`, `duplicates.md`) byte for byte.
   Falsification: any byte difference in either file fails the Red and Green gates.
2. **Path display (F11).** No output file holds an absolute path. The intro and the
   `source` string name a path only through `displayPath`. Falsification: a scan of both
   output files finds `REPO_ROOT` or `os.tmpdir()`.
3. **Printed-count guard (F7).** `keepCount` is never negative. When a level's printed
   count reaches its target, the run clusters nothing and writes no group of it.
   Falsification: `keepCount < 0`, a thrown cluster error, or an extra group.
4. **Missing-file errors (F13).** A missing `--printed` file gives
   `printed file not found: <given path>`, then usage, on stderr, with exit 2.
   Falsification: a crash, a wrong path in the text, exit 0, or stdout output.

## 3. Review gates assigned

| Gate | Applies | Scope and falsification |
|---|---|---|
| Review A, correctness | Yes, lead review | Verify every Task 1.G1 rule against `plan-dedup.ts` and the two outputs. One review role of a model family other than the Red and Green families audits the head. Reports only; fixes nothing. Falsified by any open Blocker. |
| Review B, security | Yes, narrowly scoped | Overrides the plan default. The CLI has file IO and writes into a public repository. Scope: (a) no absolute path in either output (F11); (b) the local passages inventory and any private metadata copy stay out of git, proven by `git status --porcelain`; (c) passage text in the committed JSON matches the levels 1–4 precedent and carries no private field beyond the established `use` counts. Falsified by a machine path, a staged private input, or a new private field. Result: `review-b-p1g-<sha8>.json`. |
| Review C, UX/API | Yes, CLI scope only | No route or user flow changes. The CLI contract is the API: flag names, defaults, cwd-relative resolution, exit codes, stderr text, output locations, and pure-versus-write behavior. Falsified by a contract break in Review A's contract table. Result: `review-c-p1g-<sha8>.json`. |
| Adversarial testing | Yes, one focused round | Attack surfaces: path resolution (F1), `displayPath` (F11), `keepCount` (F7), missing file (F13), import side effect, no-`readAt` (F10), and the negative count. Reuse the Green mutants. Falsified by a surviving mutant or an unhandled surface. |
| UX browser review | No | The change is a Node CLI and two text files. There is no browser page, route, DOM, CSS, Paged.js render, or interactive flow. Output is inspected as text and git diff, not in a browser. |

Review A result: `measure/runs/levels_5_9_20261006/review-a-p1g-<sha8>.json`.
Each review result holds findings, verdict, and the head SHA it audited.

## 4. Phase gates

Heavy-runs use one command: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
Never nest a heavy-run. Exit 75 means the pre-flight hold exceeded its wait; rerun once.

### Task 1.G1 — Red (risk: medium)

- **Targeted Red command (heavy-run):**
  `cd dashboard && CI=true npx vitest run __tests__/plan-dedup.test.ts`
  It must fail after Red, before Green. Capture exit code and the labeled
  `Tests <n> failed` line. "No test files found" is a vacuous result and fails this gate.
- **Green gate:** Not applicable to Red. The new file must fail only because the
  exports and flags do not exist yet.
- **Closeout gate:** Commit only `dashboard/__tests__/plan-dedup.test.ts`. Plan keeps
  the task `[~]` until its Green ships. Evidence: automated. Falsified by a pass before
  Green or by a failure outside the new file.

### Task 1.G2 — Green (risk: high)

- **Targeted Red command:** the same `RED_TEST_COMMAND`; now expected to pass.
- **Green gate (heavy-runs):** `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`,
  `PROJECT_CHECKS` all exit 0. `GREEN_TEST_COMMAND` and `RED_TEST_COMMAND` are the same
  command. Add the mutant gate: each new rule has a mutant that a test catches.
  Falsified by a gate exit != 0 or a surviving mutant.
- **Closeout gate:** commit only `dashboard/scripts/plan-dedup.ts`. Plan turns `[x]` with
  `commit <sha>` and evidence class `automated`. Falsified by a changed second file.

### Task 1.G3 — Provisional run (risk: high)

- **Targeted Red (pre-condition; must fail before the run):** the two output files
  `docs/content-plans/data/duplicates-levels-5-9.json` and
  `docs/content-plans/level-plans/duplicates-levels-5-9.md` do not exist yet;
  the local passages inventory exists and holds `summary` and `passage`; the PM go is
  recorded. Falsified by an existing output or a metadata-only input.
- **Green gate:** one heavy-run of the plan's 1.G3 command from `dashboard/`, exit 0.
  Then: two output files exist; per-level counts and keep counts are recorded in
  `measure/runs/levels_5_9_20261006/g3-run.txt`; a second run gives the same two files
  under `cmp`; `git status --porcelain` shows only the two intended new files; neither
  output contains `REPO_ROOT`, `os.tmpdir()`, or `/home/`; the MD has no delete column;
  the heading and intro match Task 1.G1 strings. A difference from 92, 88, 4, 38, 49
  is a labeled note in `g3-run.txt` and in the evidence line, not a failure (F15, F17).
- **Closeout gate:** commit holds only the two output files. Falsified by a staged
  passages inventory, a machine path, or a third changed file.

### Task 1.G4 — Reviews (risk: medium)

- **Targeted Red (pre-condition):** no review result file exists for the head.
- **Green gate:** Review A, scoped Review B, and scoped Review C report on the head.
  Result files exist. No open Blocker. Each finding is fixed or answered in the plan.
  Falsified by a missing result file or an open Blocker.
- **Closeout gate:** plan records each result file and the answer to each finding.
  Evidence: automated and peer-report. The adversarial round from §3 runs before the
  acceptance task; it reports into the same result directory.

### Task 1.G5 — Phase acceptance (risk: medium)

- **Targeted Red (pre-condition):** Tasks 1.G1 to 1.G3 are `[x]` with commit SHA;
  no phase-acceptance result file exists for the head yet.
- **Green gate:** the acceptance role states the exit code of each gate:
  `RED_TEST_COMMAND`, `GREEN_TEST_COMMAND` (heavy-run), `PROJECT_TESTS`, `PROJECT_LINT`,
  `PROJECT_CHECKS` (heavy-runs), all 0. Falsified by any non-zero exit or a gate not run.
- **Closeout gate:** `phase-acceptance-p1g-<sha8>.json` holds PASS with 0 open blockers
  for Tasks 1.G1 to 1.G3; the plan records the result file. Evidence: peer-report.

## 5. Fixtures, mocks, and live-behavior proof

| Item | Purpose | Falsification condition |
|---|---|---|
| Rebuilt levels 1–4 inventory: 272 online articles (level from group), 28 printed with empty summary and passage, `readAt` `2026-10-02T02:41:26.855Z`, sorted by `raLevel` then `createdAt` | Byte-identity input; the original passage inventory is not in this repository | Any byte difference in the two committed outputs |
| Copies of the two committed outputs in a temporary folder | Compare there; write nothing in the repository tree | A write lands under `docs/content-plans/` during the test |
| `vi.spyOn(fs, 'writeFileSync')` on the default run from `dashboard/` | Stub the two writes; assert count 2, the two default absolute paths, and byte-equal content | A different write count, path, or content |
| Small levels 5–9 fixture inventory | `main` with `--levels 5,6,7,8,9` and the plan targets; exit 0; two files in the temporary folder; `git status --porcelain` unchanged | A third file, a non-zero exit, or a repository change |
| Printed-count fixture (>= target) | `keepCount` 0, no groups, exact level line | A cluster call, a group, or the wrong line |
| No-`readAt` fixture named `legacy-levels-5-9-2026-10-08.json`, written outside `REPO_ROOT` | `source` and intro read `inventory of legacy-levels-5-9-2026-10-08.json` (F16) | The string `undefined` or the repo-relative form |
| Mixed-option and bad-option cases from Task 1.G1 | Defaults stay fixed; each error returns `{ ok: false; message; usage }`, exit 2 | A crash, exit 0, or a changed default |
| Missing `--printed` file | Exact message, then usage, on stderr; exit 2 | Wrong path text, stdout output, or exit 0 |
| Output scan of both files | Path display (F11) | `REPO_ROOT` or `os.tmpdir()` in either file |

**Mocks:** only the `writeFileSync` spy and temporary folders. No network mock is needed.
**Live-behavior proof:** run `main` from `dashboard/` against the temporary paths; check
exit codes and stderr; check `git status --porcelain`; compare two G3 runs with `cmp`.

## 6. Architecture guardrails and changed-contract risks

- `planDedup` stays pure. `main` owns all file IO. The module top guards the direct-run
  call, as `dashboard/scripts/storytime/set-book-pictures.ts` line 170 does. Falsification:
  importing the script prints usage or sets an exit code.
- `Article` becomes exported; `LEVEL_TARGETS` keeps the levels 1–4 values.
  `lib/lesson-package/similarity.ts` stays unchanged; `PROJECT_TESTS` covers it.
- Path rule (F1): every given path resolves against the cwd with `path.resolve`; defaults
  are absolute `REPO_ROOT` paths built at parse time; options keep the absolute paths.
- Display rule (F11): `displayPath` uses the forward-slash repo-relative form inside
  `REPO_ROOT`, else `path.basename`.
- The new level list gets the exact Task 1.G1 strings; levels 1–4 keep today's heading,
  intro, table, and level lines word for word.
- No pnpm, no `npm install`, no `npm ci`. Commit with `git commit -- <paths>` only. No
  amend, reset, revert, stash, or push. Never stage `video/**`, `dashboard/raw.json`, or
  another track's `measure/runs/` files.
- Changed contract: new exports, new flags, and new output files for levels 5–9. The
  two levels 1–4 outputs must not change. The passages inventory stays local and out of git.

## 7. Intentionally-red aggregate-suite handling

`PROJECT_TESTS` runs the whole dashboard suite and excludes
`__tests__/storytime-unit2-sound-stage.test.ts`. That Red file belongs to another track
(`storytime_l2_unit2_20261106`). The config exclude (`dashboard/vitest.config.ts`) and
the CLI exclude both hold in vitest 4.0.18. Do not fix it, do not stage it, and do not
report it as this phase's failure. Remove the exclude only after that track's Task 3.6
Green closes. During the Red window, `plan-dedup.test.ts` is the only new failure; the
aggregate suite must not be used to declare the Red phase green.

## 8. Artifact tests versus live-behavior tests

Byte-identity and exact-string tests are **artifact tests**: they pin the text of two
committed documents. They do not prove the CLI writes to the right location. Task 1.G1's
exact-string test passes absolute temporary paths, so it cannot detect a machine path in
the MD (F11). The **live-behavior tests** are the `writeFileSync` spy with path
assertions, the output scan for `REPO_ROOT` and `os.tmpdir()`, `git status --porcelain`
after each run, the missing-file error path, and the `cmp` of two G3 runs. Green and
acceptance must show both classes pass. A passing artifact test alone is not evidence.

## 9. Anti-pattern coverage

Active entries in `measure/anti-patterns.md`: A2–A10. A1 and A8 are retired. No A11 entry
exists in this repository's catalog. Each defense below gives its falsification condition.

| Phase | Anti-pattern | Defense and falsification |
|---|---|---|
| G1, G2, G5 | A3, digit-only as a labeled count | Parse labeled integers from the level line (`<all> articles: <printed> printed, <online> online. Keep <keep>…`), not a bare `[0-9]+`. Falsified by a count that matches a date or a year. |
| G1, G2, G5 | A4, vacuous pass on nothing done | Assert positive fixtures: 272 online plus 28 printed, two non-empty byte-equal files, exactly two writes, and at least one group below target. Falsified by empty outputs or zero writes. |
| G1, G2, G5 | A5, false claim text versus test reality | Record the exit code and the `Tests <n> failed` line for each cited command. No "all checks pass" text without a captured exit 0. Falsified by a cited gate that exits non-zero. |
| G4, G5 | A6, registry-note overstatement | The plan records a review or acceptance claim only with its result file and exit code. No "resolved" or PASS claim while a finding or blocker is open. Falsified by a missing result file. |
| G1, G3, G5 | A7, over-broad filter swallowing hits | Exclude only the named storytime test file. Scan paths with path tokens (`/home/`, `os.tmpdir()`), not bare English words. Falsified by a banned line dropped through a word filter. |
| G3, G4, G5 | A2, consent-blind publish gate | The two outputs are published to a public repository. Require the path display proof and a clean `git status --porcelain` with no private input staged. Falsified by a machine path or a staged passages inventory. |
| G1, G5 | A9, test references archived track paths | The new test imports the live `dashboard/scripts/plan-dedup.ts`, not an archived or `measure/tracks/<id>/plan.md` path. Falsified by a reference to an archived location. |
| G1, G2, G3, G5 | A10, generated-facts drift | The byte-identity test and the G3 `cmp` pin the two generated outputs after each structural change. Falsified by an unreviewed diff in either output. |

## 10. Non-blocking question for the orchestrator

Review B treats the `passage` field in the committed levels 5–9 JSON as in scope, because
it carries text from a private inventory into a public repository. Default: allow it,
since the committed levels 1–4 JSON uses the same contract, and require the PM to confirm
that the level 5–9 passages are approved public content before Task 1.G3 commits.
This question does not block the strategy or the Red work.

---

## Phase 7R: Rebuild map (Task 7.0)

Track: `levels_5_9_20261006`. Phase heading: `## Phase 7R: Rebuild map (Daniel 2026-11-19)`.
Task: Task 7.0. Role base SHA: `5da7c561`. Date: 2026-11-19.
Scope: Task 7.0 only. Sections 1 to 10 above stay unchanged.

### 7R.1 phase_base_sha capture point

The orchestrator captures the immutable `phase_base_sha` at this exact point: run
`git rev-parse HEAD` immediately after the strategy commit lands and before any Red
work starts (before Task 7.0 creates `dashboard/__tests__/rebuild-map.test.ts`).
That HEAD is the phase base. `5da7c561` is the role base and predates the strategy
commit; it must never be used as `phase_base_sha`. This section embeds no phase SHA.

### 7R.2 Contract under test

The plan fixes three file names and no function signatures. This strategy pins the
default contract so Red can write tests and Green can implement them. The orchestrator
changes a name only by amending the plan.

The new script `dashboard/scripts/rebuild-map.ts` exports this contract:

- `export interface KeepGroup { level: number; keep: string }`.
- `export interface PackageRef { level: number; id: string }`. An id is `book/lesson`,
  for example `quest-5/l01` or `bank-5/b001`.
- `export interface RebuildMapOptions { duplicates: string; contentRoot: string; outJson: string }`.
- `export function parseRebuildMapArgs(argv: string[]): { ok: true; options: RebuildMapOptions } | { ok: false; message: string; usage: string }`.
- `export function buildRebuildMap(groups: KeepGroup[], packages: PackageRef[]): { content: string; log: string[] }`.
  The function is pure and writes nothing. `content` is the full JSON text of the map.
- `export function main(argv: string[]): number`. It parses, reads the duplicates JSON,
  enumerates the packages, calls `buildRebuildMap`, writes one file, prints the log lines,
  and returns 0. A parse error prints `message`, then usage, to stderr and returns 2.
  No database write and no network call occur. A module-top guard holds the direct-run
  call, as `plan-dedup.ts` line 317 does.

Flags and defaults: `--duplicates <path>` defaults to `<REPO_ROOT>/docs/content-plans/data/duplicates-levels-5-9.json`;
`--content-root <path>` defaults to `<REPO_ROOT>/content/primary`;
`--out-json <path>` defaults to `<REPO_ROOT>/docs/content-plans/data/rebuild-map-levels-5-9.json`.
Every given path resolves against the working directory with `path.resolve`.

The default map JSON holds `source`, `levels`, `map`, and `newIds`. Each `levels` row
carries a labeled `level`, `kept`, `packages`, and `mapped` count. Each `map` row carries
`level`, `keepId`, and `package`. Each `newIds` row carries `level` and `package`.
The map is one-to-one: each kept id appears once and each package appears once across
`map` and `newIds`. No output holds an absolute path.

### 7R.3 Package source, named exactly

No single manifest lists all 550 new packages. The packages are the top-level `*.json`
files in `content/primary/<book>/`. A workbook book holds 14 `lNN.json` files. A bank
book holds `bNNN.json` files. The level grouping and the counts come from
`LEVEL_BOOKS`, `WORKBOOK_LESSONS`, and `BANK_COUNTS` in
`dashboard/lib/lesson-package/bank-plan.ts`. The folder reader is `loadPackageFolder`
in `dashboard/lib/lesson-package/files.ts`; it orders parsed packages by `meta.number`.

Verified counts: level 5 is `quest-5` 14 plus `bank-5` 36 = 50; level 6 is
`quest-6.1` 14 plus `quest-6.2` 14 plus `bank-6` 72 = 100; level 7 is
`adventure-7.1` 14 plus `adventure-7.2` 14 plus `bank-7` 72 = 100; level 8 is
`adventure-8.1` 14 plus `adventure-8.2` 14 plus `adventure-8.3` 14 plus `bank-8` 108
= 150; level 9 is `adventure-9.1` 14 plus `adventure-9.2` 14 plus `adventure-9.3` 14
plus `bank-9` 108 = 150.

Default when no plan line fixes a source: enumerate these folders, use `LEVEL_BOOKS`
for the workbook books and `bank-<level>` for the bank, and count through
`WORKBOOK_LESSONS` and `BANK_COUNTS`. `docs/content-plans/data/duplicates-levels-5-9.json`
supplies the kept ids: 50, 88, 4, 38, 49.

### 7R.4 Pairing rule and determinism

Default pairing rule: sort kept ids by their order in the `groups` array of the
committed duplicates JSON (level 5 to 9, group order inside a level). Sort packages
by source order inside a level: the books of `LEVEL_BOOKS[level]` in array order, then
`bank-<level>`; inside a folder, use the `loadPackageFolder` order. Pair the i-th kept
id of a level with the i-th package of that level. The remaining packages of a level
go to `newIds`. Level 5 uses all 50 packages; levels 6 to 9 leave 12, 96, 112, and 101
packages for new ids. The orchestrator overrides this rule only from a plan amendment.

Determinism check: call `buildRebuildMap` twice on the same inputs and compare the two
`content` strings byte for byte. Run `main` twice into two temporary output paths and
compare the two files byte for byte. Falsified by any different byte or order.

### 7R.5 Risks and contract tests in `rebuild-map.test.ts`

Red writes the test file before any script exists. Fixture-based tests use small made-up
ids and `book/lesson` strings. One test uses the real committed inputs. Every row holds
its falsification condition.

| Risk | Contract test | Falsification condition |
|---|---|---|
| Wrong level pairing | Fixture with level 5 and level 6 groups. Assert each `map` row's `level` equals the keep group's level and the package's level. The real-input test checks all 229 rows. | A level 5 keep id paired with a level 6 package. |
| One package takes two ids | Assert each `package` value in `map` and `newIds` appears once. | A repeated `book/lesson` string. |
| One id mapped twice | Assert each `keepId` in `map` appears once. | A repeated keep id. |
| A missing kept id | Assert set equality between the fixture keeps and the `map` keeps. The real-input test parses 229 keep ids from the committed JSON. | A missing id or an extra id. |
| Non-deterministic order | Call the pure function twice and compare bytes. Run `main` twice into temporary paths and compare the two files. | A differing byte or a shuffled order. |
| Count mismatch | Parse labeled `kept`, `packages`, and `mapped` integers from each `levels` row. Assert keeps 50, 88, 4, 38, 49 and packages 50, 100, 100, 150, 150. The real-input test asserts `map.length` is 229. | A bare digit match on a date or id, or a wrong count. |
| An unknown level | Fixture with level 4 and level 10. Assert `{ ok: false; message; usage }`, exit 2, and no output file. | A silent map of the unknown level. |
| A database write or network access | Scan the script source for `pg`, `@reading-advantage/db`, `mysql`, `fetch`, `http`, `https`, `axios`, `net`, `tls`, and `child_process`. Spy on `globalThis.fetch` and assert no call. Spy on `fs.writeFileSync` and assert exactly one write at the given out path. Check `git status --porcelain`. | A forbidden import, a fetch call, an extra write, or a repository change. |
| Path display | Scan `content` for `REPO_ROOT`, `os.tmpdir()`, and `/home/`. | An absolute path in the output. |
| Clean import | Import the script and assert no console output and no change to `process.exitCode`. | Usage text on import or a changed exit code. |
| Bad options | Fixtures for an unknown flag, a missing value, a missing `--duplicates`, and a missing duplicates file. Assert message, usage, exit 2, and no write. | A crash, exit 0, or a written file. |

The real-input test reads the committed duplicates JSON and enumerates the real package
folders. It calls `buildRebuildMap` and asserts 229 rows, the five keep counts, the five
package counts, one-to-one ids and packages, and two identical `content` strings. It
fails before Green because the script exports do not exist.

### 7R.6 Phase gates

Heavy-runs use one command: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
Never nest a heavy-run. Exit 75 means the hold exceeded its wait; rerun once. The
wrapper drops `${PIPESTATUS[0]}`, so both plan commands carry `set -o pipefail`.

The plan states both commands. Keep them unchanged:

```bash
RED_TEST_COMMAND='set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/rebuild-map.test.ts'
GREEN_TEST_COMMAND='set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/rebuild-map.test.ts'
```

**Task 7.0 Red step (risk: medium).**

- Targeted Red command: `RED_TEST_COMMAND` in a heavy-run. It must fail after Red and
  before Green. Capture the exit code and the labeled `Tests <n> failed` line.
  "No test files found" is a vacuous result and fails this gate.
- Green gate: not applicable to Red. The new file must fail only because the script
  and its exports do not exist yet.
- Closeout gate: commit only `dashboard/__tests__/rebuild-map.test.ts`. The plan keeps
  the task `[~]` until Green ships. Evidence: automated. Falsified by a pass before
  Green or by a failure outside the new file.

**Task 7.0 Green step (risk: high).**

- Targeted Red command: the same `RED_TEST_COMMAND`; now expected to pass.
- Green gate (heavy-runs): `RED_TEST_COMMAND`, `GREEN_TEST_COMMAND`, `PROJECT_TESTS`,
  `PROJECT_LINT`, and `PROJECT_CHECKS` all exit 0. Add the mutant gate: each new rule
  has a mutant that a named test catches. Add the two-run byte comparison of 7R.4.
  Falsified by a gate exit != 0, a surviving mutant, or a differing byte.
- Closeout gate: commit only `dashboard/scripts/rebuild-map.ts` and
  `docs/content-plans/data/rebuild-map-levels-5-9.json`. The plan turns the task `[x]`
  with `commit <sha>` and evidence class `automated`. Falsified by a changed third file
  or by a staged passages inventory.

Phase 7R risk: high. The map feeds the Phase 7 load. A wrong pairing puts new text
under the wrong legacy id. This phase writes no database and makes no deletion.

### 7R.7 Review gates assigned

| Gate | Applies | Scope and falsification |
|---|---|---|
| Review A, correctness | Yes, lead review | Check the pairing rule, the five keep counts, the five package counts, one-to-one ids and packages, determinism, and the real-input test. One reviewer of a model family other than the Red and Green families audits the head. Reports only; fixes nothing. Result: `review-a-p7r-<sha8>.json`. Falsified by an open Blocker. |
| Review B, security | Yes, narrow | Overrides any wider default. Scope: no database import and no network import in the script; no secret in the script, the map, or a capture; no Thai character in either output; `git status --porcelain` shows only intended files. Falsified by a forbidden import, a secret, a Thai character, or a staged private file. Result: `review-b-p7r-<sha8>.json`. |
| Review C, UX/API | No | There is no route, no UI, and no user flow. The CLI contract is covered by Review A and the contract tests of 7R.5. Falsified only if a route or a component enters the change. |
| Adversarial testing | Yes, one focused round | Attack surfaces: duplicate keep ids, duplicate packages, a wrong level, an unknown level, path display, a database or network import, non-determinism, bad options, and the clean import. Reuse the Green mutants. Falsified by a surviving mutant or an unhandled surface. Result: `adversarial-p7r-<sha8>.json`. |
| UX browser review | No | The change is a Node script and one JSON file. There is no page, route, DOM, CSS, Paged.js render, or interactive flow. |

No Thai rule applies to the map inputs. The kept ids are cuid strings and the package
ids are ASCII `book/lesson` strings. Review B still proves 0 Thai characters in both
outputs, because a future edit could add text fields.

### 7R.8 Fixtures, mocks, and live-behavior proof

| Item | Purpose | Falsification condition |
|---|---|---|
| Small keep groups with levels 5 and 6 | Prove same-level pairing and refute a cross-level pair | A level 5 keep paired with a level 6 package |
| Duplicate keep id fixture | Refute a repeat of one id | The pure function maps the id twice |
| Duplicate package fixture | Refute a repeat of one package | One `book/lesson` string appears twice |
| Unknown-level fixture (4 and 10) | Refute a silent map of an unknown level | Exit 0 or an output file |
| Real committed duplicates JSON and real package folders | Prove 229 rows and the five count pairs | A wrong count, a missing id, or a repeated package |
| Two calls to the pure function | Prove byte-identical `content` | Any differing byte |
| Two `main` runs into temporary paths | Prove a byte-identical output file | A differing file |
| `vi.spyOn(fs, 'writeFileSync')` | Assert exactly one write at the given out path | A different count, path, or content |
| `vi.spyOn(globalThis, 'fetch')` and a source scan | Refute a database or network import and call | A forbidden import or a fetch call |
| `git status --porcelain` after a run | Prove no repository change outside the output | A changed or staged file |
| Output scan for path tokens | Refute an absolute path in the map | `REPO_ROOT`, `os.tmpdir()`, or `/home/` |

**Mocks:** the two spies and temporary folders. No database mock is used; the script
must not import a database client at all.
**Live-behavior proof:** run `main` from `dashboard/` with temporary output paths;
check exit codes and stderr; compare two output files; check `git status --porcelain`.

### 7R.9 Architecture guardrails and changed-contract risks

- `buildRebuildMap` stays pure. `main` owns all file IO. The module-top guard holds the
  direct-run call. Falsified by usage text or an exit code change on import.
- The script imports no database client and opens no network socket. Falsified by a
  forbidden import or a `fetch` call.
- Every given path resolves against the cwd. Defaults are absolute `REPO_ROOT` paths.
  No output holds an absolute path. Falsified by a machine path in the JSON.
- The inputs stay unchanged: `plan-dedup.ts`, `duplicates-levels-5-9.json`, and every
  package file. Falsified by a diff in any of them.
- The map is a new changed contract. The Phase 7 injector reads
  `docs/content-plans/data/rebuild-map-levels-5-9.json`. A wrong shape or a missing row
  breaks that load. Review A checks the shape against Task 7.0 of the plan.
- No pnpm, no `npm install`, no `npm ci`. Commit with `git commit -- <paths>` only.
  No amend, reset, revert, stash, or push. Never stage `video/**`, `dashboard/raw.json`,
  or another track's `measure/runs/` files.

### 7R.10 Intentionally-red aggregate-suite handling

`PROJECT_TESTS` runs the whole dashboard suite and excludes
`__tests__/storytime-unit2-sound-stage.test.ts`, an open Red file of track
`storytime_l2_unit2_20261106`. The config exclude in `dashboard/vitest.config.ts` and
the CLI exclude both hold in vitest 4.0.18. Do not fix it, do not stage it, and do not
report it as this phase's failure. Remove the exclude only after that track's Task 3.6
Green closes.

Three other-track failures predate this phase and reproduce at phase base
`afbfcf0e`: `__tests__/constants.test.ts` 'includes Adventures 1.0 as a primary
workbook option', and two cases in `__tests__/origins-thai-support.test.ts` for
`origins-2-a0` and `origins-3.1-a0`. Evidence: `green-g2-baseline-r2.txt`. Record them
as earlier failures outside this track. Any other failure fails the gate. During the
Red window, `rebuild-map.test.ts` is the only new failure. Never use the aggregate
suite to declare the Red phase green.

### 7R.11 Artifact tests versus live-behavior tests

The real-input invariants, the labeled counts, and the two-call `content` comparison
are **artifact tests**: they pin one committed document. They do not prove where the
script writes or that it avoids the database and network. The **live-behavior tests**
are the `writeFileSync` spy with path assertions, the `fetch` spy and the source scan,
the two `main` runs with byte comparison, the output path scan, and
`git status --porcelain`. Green and acceptance must show both classes pass. A passing
artifact test alone is not evidence.

### 7R.12 Anti-pattern coverage

Active entries in `measure/anti-patterns.md`: A2 to A10. A1 and A8 are retired. No A11
entry exists in this repository's catalog. Each defense holds its falsification
condition.

| Step | Anti-pattern | Defense and falsification |
|---|---|---|
| Red, Green | A3, digit-only as a labeled count | Parse labeled integers from `levels` rows and from the five keep counts. Never use a bare `[0-9]+`. Falsified by a count that matches a date or an id. |
| Red, Green | A4, vacuous pass on nothing done | Assert 229 map rows, 550 packages, and five non-zero keep counts. Falsified by an empty map or zero packages. |
| Red, Green | A5, false claim text versus test reality | Record the exit code and the labeled `Tests <n> failed` line for each cited command. No "all checks pass" text without a captured exit 0. Falsified by a cited gate that exits non-zero. |
| Reviews, closeout | A6, registry-note overstatement | Record a review or acceptance claim only with its result file and audited head SHA. No "resolved" or PASS claim while a finding is open. Falsified by a missing result file. |
| Red, Green | A7, over-broad filter swallowing hits | Exclude only the named storytime test file. Scan path tokens, not bare English words. Falsified by a banned line dropped through a word filter. |
| Red, Green | A2, consent-blind publish gate | The map is published to a public repository and drives a production load. Require no database import, no network import, no secret, no Thai output, and a clean git status. Falsified by a forbidden import, a secret, a Thai character, or a staged private file. |
| Red, Green | A9, test references archived track paths | Import the live `dashboard/scripts/rebuild-map.ts` and read the live content folders. Never reference `measure/archive/<id>/`. Falsified by an archived path in the test. |
| Red, Green | A10, generated-facts drift | The two-run byte comparison and the real-input test pin the generated map after each structural change. Falsified by an unreviewed diff in the map. |

### 7R.13 Defaults chosen, not blocking questions

The plan fixes no script signatures, no map shape, and no package source list. This
section pins defaults in 7R.2, 7R.3, and 7R.4. The orchestrator may change a default
only through a plan amendment. No product decision blocks the strategy or the Red work.
