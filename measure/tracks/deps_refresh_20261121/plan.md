# Plan: dependency refresh of dashboard and storytime-song

Track: `deps_refresh_20261121`. Spec: [spec.md](./spec.md). Type: chore. Lane: light.

Dates: Phases D1 and D2 (critical and high) by 2026-11-23. Phase D3 (the rest) by 2026-11-25. Critical first.

Heavy commands: run every heavy command (lint, type check, tests, build) inside ONE wrapper, never nested: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit 75 means: the pre-flight hold outlasted its wait. The audit gate and `npm audit` are light commands. Run them directly.

Light lane: each phase closes with its manual verification task and a checkpoint commit (PM light-lane order, as in the storytime tracks).

## Gate commands (orchestrator environment)

```bash
# Phase D1: dashboard critical and high (the audit gate; fails now, passes after Green)
RED_TEST_COMMAND_D1='node measure/tracks/deps_refresh_20261121/audit-gate.mjs dashboard'
GREEN_TEST_COMMAND_D1='node measure/tracks/deps_refresh_20261121/audit-gate.mjs dashboard'

# Phase D2: video/storytime-song critical and high
RED_TEST_COMMAND_D2='node measure/tracks/deps_refresh_20261121/audit-gate.mjs video'
GREEN_TEST_COMMAND_D2='node measure/tracks/deps_refresh_20261121/audit-gate.mjs video'

# Phase D3: the rest of the updates; the gate rises to moderate and above
RED_TEST_COMMAND_D3='node measure/tracks/deps_refresh_20261121/audit-gate.mjs both --min moderate'
GREEN_TEST_COMMAND_D3='node measure/tracks/deps_refresh_20261121/audit-gate.mjs both --min moderate'

# dashboard gates (the real commands of dashboard/package.json scripts)
PROJECT_LINT='set -o pipefail; cd dashboard && npm run lint'              # scripts.lint: "eslint"
PROJECT_CHECKS='set -o pipefail; cd dashboard && npx tsc --noEmit'        # package.json has no type-check script; tsc --noEmit is the project type check
PROJECT_TESTS='set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts --exclude __tests__/constants.test.ts --exclude __tests__/origins-thai-support.test.ts'   # scripts.test: "vitest", scripts.test:run: "vitest run"; the 3 excludes are known failures of other tracks
PROJECT_BUILD='set -o pipefail; cd dashboard && npm run build'            # scripts.build: "next build"

# video/storytime-song gates (the real commands of video/storytime-song/package.json scripts)
PROJECT_LINT_VIDEO='set -o pipefail; cd video/storytime-song && npm run lint'          # scripts.lint: "eslint src && tsc"
PROJECT_CHECKS_VIDEO='set -o pipefail; cd video/storytime-song && npx tsc --noEmit'    # tsc also runs inside npm run lint; tsconfig sets noEmit: true
PROJECT_TESTS_VIDEO='set -o pipefail; cd video/storytime-song && npm test'             # scripts.test: "node --test tests/*.test.mjs"
PROJECT_BUILD_VIDEO='set -o pipefail; cd video/storytime-song && npm run build'        # scripts.build: "remotion bundle"
```

Every lint, type-check, test, and build command above runs inside ONE heavy-run wrapper, never nested. Each RED_TEST_COMMAND and GREEN_TEST_COMMAND is the audit gate: it exits non-zero while any advisory at or above the phase minimum is not on the allowlist of the gate script with its reason. The gate script is `measure/tracks/deps_refresh_20261121/audit-gate.mjs`, committed with this track.

## Phase D1: dashboard critical and high (by 2026-11-23)

- [ ] Task: Tests (first): run `RED_TEST_COMMAND_D1`. The gate exits 1 with the critical and high advisories of `dashboard/`. Save the output to `measure/runs/deps_refresh_20261121/`.
    - Red evidence (2026-11-21, the track commit): the gate exits 1. It lists 67 advisories without an allowlist reason. Evidence: `measure/runs/deps_refresh_20261121/red-gate-dashboard.txt`. The critical packages: `@vitest/coverage-v8`, `handlebars`, `next`, `protobufjs`, `proxy-addr`, `vitest`. The full list with advisory ids: `measure/runs/deps_refresh_20261121/audit-before-counts.txt`.
- [ ] Task: Implement: run npm in `dashboard/` only. Update the packages until the critical and high advisories are gone. Do not keep a package major upgrade that breaks the build without the gates passing. For each advisory that stays, add its id with its reason to the `ALLOWLIST` of the gate script.
- [ ] Task: Verify: `GREEN_TEST_COMMAND_D1` exits 0. `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`, and `PROJECT_BUILD` exit 0 in heavy-runs. Save the after-audit JSON to `measure/runs/deps_refresh_20261121/audit-after-d1-dashboard.json`.
- [ ] Task: Measure - User Manual Verification 'Phase D1: dashboard critical and high' (Protocol in workflow.md)

## Phase D2: video/storytime-song critical and high (by 2026-11-23)

- [ ] Task: Tests (first): run `RED_TEST_COMMAND_D2`. The gate exits 1 with the critical and high advisories of `video/storytime-song/`. Save the output to `measure/runs/deps_refresh_20261121/`.
    - Red evidence (2026-11-21, the track commit): the gate exits 1 with one advisory: zod `GHSA-mrhx-c7xc-m3w5` (high). The 10 high entries of the audit all trace to it. Evidence: `measure/runs/deps_refresh_20261121/red-gate-video.txt`. npm names the fix: `@remotion/cli` 4.0.545, not a major. Default: update all `@remotion/*` packages together, through the project's own upgrade script (`npm run upgrade`, `remotion upgrade`) or a direct npm install, so the versions stay aligned.
- [ ] Task: Implement: run npm in `video/storytime-song/` only. Update the packages until the critical and high advisories are gone. Do not keep a package major upgrade that breaks the build without the gates passing. For each advisory that stays, add its id with its reason to the `ALLOWLIST` of the gate script.
- [ ] Task: Verify: `GREEN_TEST_COMMAND_D2` exits 0. `PROJECT_LINT_VIDEO`, `PROJECT_CHECKS_VIDEO`, `PROJECT_TESTS_VIDEO`, and `PROJECT_BUILD_VIDEO` exit 0 in heavy-runs. Save the after-audit JSON to `measure/runs/deps_refresh_20261121/audit-after-d2-video.json`.
- [ ] Task: Measure - User Manual Verification 'Phase D2: video/storytime-song critical and high' (Protocol in workflow.md)

## Phase D3: the rest of the updates and the moderate/low list (by 2026-11-25)

- [ ] Task: Tests (first): run `RED_TEST_COMMAND_D3`. The gate exits 1 with every advisory at moderate or above that has no allowlist reason. Save the output to `measure/runs/deps_refresh_20261121/`.
    - Red evidence (2026-11-21, the track commit): the gate exits 1. It lists 127 advisories without an allowlist reason across both projects. Evidence: `measure/runs/deps_refresh_20261121/red-gate-both-moderate.txt`.
- [ ] Task: Implement: update the rest of the packages of both projects. Give each remaining moderate or low advisory an `ALLOWLIST` entry with its reason (no upstream fix, or a breaking major deferred). Defer a breaking major that does not fit by 2026-11-25. Record its reason here and in the allowlist.
- [ ] Task: Verify: `GREEN_TEST_COMMAND_D3` exits 0. `GREEN_TEST_COMMAND_D1` and `GREEN_TEST_COMMAND_D2` still exit 0. All eight project gates exit 0 in heavy-runs. Save the after-audit JSON of both projects to `measure/runs/deps_refresh_20261121/audit-after-d3-dashboard.json` and `audit-after-d3-video.json`. Write the remaining moderate and low list with reasons to `measure/runs/deps_refresh_20261121/audit-after-counts.txt`.
- [ ] Task: Measure - User Manual Verification 'Phase D3: the rest of the updates and the moderate/low list' (Protocol in workflow.md)

## Close

- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`.
- [ ] Push the work (spec done-when). The push is a human gate: the orchestrator asks the PM before it pushes.
