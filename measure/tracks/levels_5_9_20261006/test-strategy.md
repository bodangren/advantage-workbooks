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
