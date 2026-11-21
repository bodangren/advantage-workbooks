# Plan: dependency refresh of dashboard and storytime-song

Track: `deps_refresh_20261121`. Spec: [spec.md](./spec.md). Type: chore. Lane: light.

Dates: Phases D1 and D2 (critical and high) by 2026-11-23. Phase D3 (the rest) by 2026-11-25. D1 runs first. D2 runs after D1.

Heavy commands: run every heavy command (lint, type check, tests, build) inside ONE wrapper, never nested: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit 75 means: the pre-flight hold outlasted its wait. The audit gate and `npm audit` are light commands. Run them directly.

Light lane: each phase closes with its manual verification task and a checkpoint commit (PM light-lane order, as in the storytime tracks).

Staging: stage by exact path only. Never stage `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, or anything under `measure/runs/primary_v2_look_20261020/`.

Dependency decisions (orchestrator, 2026-11-21, spec-review F6):

- `pagedjs-cli`: no downgrade to 0.0.7. Keep the latest 0.4.x. Clear the `puppeteer`, `tar-fs`, `ws`, and `pac-proxy-agent` chains with npm `overrides` in `dashboard/package.json`. The classic golden print tests (inside `PROJECT_TESTS`) and `PROJECT_BUILD` must pass. If a chain cannot be cleared, allowlist it with all F3 fields and re-check date 2026-12-15.
- `@remotion`: one command, `npx remotion upgrade` in `video/storytime-song/`. Then pin every `remotion` and `@remotion/*` package to the same exact version (no caret): the newest 4.0.x that clears zod `GHSA-mrhx-c7xc-m3w5`. Record the version in this plan after Green.

## Gate commands (orchestrator environment)

```bash
# The mid-red and green gates read RED_TEST_COMMAND and GREEN_TEST_COMMAND (unsuffixed).
# The orchestrator sets the pair to the phase commands before each role run:
#   Phase D1: RED_TEST_COMMAND="$RED_TEST_COMMAND_D1"; GREEN_TEST_COMMAND="$GREEN_TEST_COMMAND_D1"
#   Phase D2: RED_TEST_COMMAND="$RED_TEST_COMMAND_D2"; GREEN_TEST_COMMAND="$GREEN_TEST_COMMAND_D2"
#   Phase D3: RED_TEST_COMMAND="$RED_TEST_COMMAND_D3"; GREEN_TEST_COMMAND="$GREEN_TEST_COMMAND_D3"

# Phase D1: dashboard critical and high (the audit gate; fails on the before state)
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
PROJECT_TESTS='set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts --exclude __tests__/constants.test.ts --exclude __tests__/origins-thai-support.test.ts'
# PROJECT_TESTS excludes: known failures of other tracks. constants.test.ts and origins-thai-support.test.ts: measure/runs/levels_5_9_20261006/green-g2-baseline-r2.txt. storytime-unit2-sound-stage.test.ts: the open Red of track storytime_l2_unit2_20261106 (PM 2026-11-18).
# While Phase S8 Red of track primary_v2_look_20261020 stays open (Red commit ad9fd95c, log measure/runs/primary_v2_look_20261020/red-s8-7a8e602c.log), the orchestrator adds "--exclude __tests__/default-look-new-editions.test.ts" to PROJECT_TESTS. Remove that exclude after S8 Green.
PROJECT_BUILD='set -o pipefail; cd dashboard && npm run build'            # scripts.build: "next build"

# video/storytime-song gates (the real commands of video/storytime-song/package.json scripts)
PROJECT_LINT_VIDEO='set -o pipefail; cd video/storytime-song && npm run lint'          # scripts.lint: "eslint src && tsc"
PROJECT_CHECKS_VIDEO='set -o pipefail; cd video/storytime-song && npx tsc --noEmit'    # tsc also runs inside npm run lint; tsconfig sets noEmit: true
PROJECT_TESTS_VIDEO='set -o pipefail; cd video/storytime-song && npm test'             # scripts.test: "node --test tests/*.test.mjs"
PROJECT_BUILD_VIDEO='set -o pipefail; cd video/storytime-song && npm run build'        # scripts.build: "remotion bundle"
```

Every lint, type-check, test, and build command above runs inside ONE heavy-run wrapper, never nested. Each RED_TEST_COMMAND and GREEN_TEST_COMMAND is the audit gate `measure/tracks/deps_refresh_20261121/audit-gate.mjs`. The gate script is test code. The Red role owns it from Phase D1 on.

## Phase D1: dashboard critical and high (by 2026-11-23)

- [x] Task: Red role (Tests first): run the gate on the phase base. Save the fresh output to `measure/runs/deps_refresh_20261121/red-d1-<short sha>.txt`. The `<short sha>` is the phase base. Then change `audit-gate.mjs` (F3, D1 only): Red commit: `5a86f10a`.
    - Every `ALLOWLIST` entry needs advisory id, package, severity, reason, and re-check date (YYYY-MM-DD).
    - The gate fails on an entry that lacks a field or that holds a past re-check date.
    - The gate writes the audit JSON it read to a dated snapshot file in `measure/runs/deps_refresh_20261121/`, so the result is reproducible.
    - The gate fails on any critical advisory, allowlist or not. A critical advisory may not stay.
    - A high advisory may stay only with all fields. That matches the PM done-when "or each one left is named with its reason".
    - The gate must still exit 1 after the change: no advisory is allowlisted yet. Mark this task with its commit id and commit. The Red commit advances HEAD past the phase base. The track-commit evidence stays as the "before" record.
    - Before record (2026-11-21, track commit `d8c3e935`): the gate exits 1 with 67 advisories without an allowlist reason. The critical packages: `@vitest/coverage-v8`, `handlebars`, `next`, `protobufjs`, `proxy-addr`, `vitest`. Evidence: `measure/runs/deps_refresh_20261121/red-gate-dashboard.txt`. The full list: `measure/runs/deps_refresh_20261121/audit-before-counts.txt`.
    - Red evidence (2026-11-21, phase base `5e104447`): `node measure/tracks/deps_refresh_20261121/audit-gate.mjs dashboard` exits 1 with 67 advisories at high or above and 0 allowlisted. Fresh output: `measure/runs/deps_refresh_20261121/red-d1-5e104447.txt`. Self-test (`--self-test`, fixed fake data, no network): 10 rule checks pass; output: `measure/runs/deps_refresh_20261121/red-d1-5e104447-selftest.txt`. Snapshot of the audit JSON read: `measure/runs/deps_refresh_20261121/audit-snapshot-dashboard-20261121T012823Z.json`. Red commit: `5a86f10a`.
    - Remediation (Review A A-D1-1, A-D1-2): commit `7e59e1f0`. The gate binds each entry to both identity fields (entry.package matches the advisory name; id-keyed entries also match the advisory id) and rejects impossible calendar re-check dates. Self-test: 13 rule checks pass (10 old plus 3 new negatives); output: `measure/runs/deps_refresh_20261121/red-d1r2-873d6a93-selftest.txt`. Dashboard gate exits 0 with the 3 sharp entries allowed; output: `measure/runs/deps_refresh_20261121/red-d1r2-873d6a93-gate.txt`. Snapshot: `measure/runs/deps_refresh_20261121/audit-snapshot-dashboard-20261121T032036Z.json`. Result log: `measure/runs/deps_refresh_20261121/red-d1r2-873d6a93.log`.
    - Remediation 2 (Review A A-D1-1 pkg key, A-D1-3): commit `56e84d8a`. A `pkg:`-keyed entry now covers an advisory only when entry.id and entry.package both match. The impossible-date self-test uses future date 2027-02-30 and asserts the calendar error text. Self-test: 14 rule checks pass; output: `measure/runs/deps_refresh_20261121/red-d1r3-caac6888-selftest.txt`. Dashboard gate exits 0 with the 3 sharp entries allowed; output: `measure/runs/deps_refresh_20261121/red-d1r3-caac6888-gate.txt`. Snapshot: `measure/runs/deps_refresh_20261121/audit-snapshot-dashboard-20261121T032951Z.json`. Result log: `measure/runs/deps_refresh_20261121/red-d1r3-caac6888.log`.
- [x] Task: Implement: run npm in `dashboard/` only. Fix every critical advisory. Fix every high advisory, or give it a full allowlist entry (F3 fields). Apply the `pagedjs-cli` decision above (npm `overrides`, no 0.0.7 downgrade). Do not keep a package major upgrade that breaks the build without the gates passing. Green commit: `e2898c4c`. Criticals cleared: next 16.4.6, vitest and @vitest/coverage-v8 4.1.12, handlebars 4.7.10, protobufjs 7.6.6, proxy-addr 2.0.8. The puppeteer 25 override clears the pagedjs chains; pagedjs-cli stays 0.4.3. sharp stays 0.34.5 because 0.35.5 breaks three pinned print tests; its three high advisories hold full allowlist entries with re-check 2026-12-15. eslint-config-next stays 16.1.6 and eslint-plugin-react-hooks is pinned to 7.0.1 because 7.1.x flags six pre-existing product patterns. Version table: `measure/runs/deps_refresh_20261121/versions-d1-dashboard.txt`.
    - PA-D1-1: two product files changed outside the spec scope in commit `e2898c4c`: `dashboard/lib/bank-plan.ts` (local `use` renamed `recordUse`; needed, the original fails lint with 1 error under the new eslint plugin) and `dashboard/lib/cover-picture.ts` (type-only `OverlayOptions` import; not needed for tsc, kept as behavior-neutral; a revert would reopen the review chain).
- [x] Task: Verify: run `GREEN_TEST_COMMAND_D1`, `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS` and `PROJECT_BUILD`; save the after-audit JSON to `measure/runs/deps_refresh_20261121/audit-after-d1-dashboard.json`. Evidence commit: `e2898c4c`. The audit gate and its self-test exit 0. Lint, the type check and the build exit 0. `PROJECT_TESTS` exits 1 on three failures of `__tests__/default-look-new-editions.test.ts`. That file is the open Red of track `primary_v2_look`, commit `ad9fd95c`, present at phase base. Its Red log `measure/runs/primary_v2_look_20261020/red-s8-7a8e602c.log` records the same three failures. Every other test file passes, including the classic golden print tests. Logs: `measure/runs/deps_refresh_20261121/green-d1-*.txt`. The after audit holds 0 critical, 1 high (allowlisted sharp), 1 moderate and 2 low advisories.
    - Print-path check (PM 2026-11-21, C-D1-1): commit `33c94f59`. Live path verdict: MATCH. The round 11 driver renders quest5-l01 at 14 pages and adventure92-l09 at 16 pages with Playwright + Paged.js, the same counts as round 11. Both pdffonts lists name the same 7 embedded CID TrueType faces. S5 checks P1 to P20 each exit 0. Evidence: `measure/runs/deps_refresh_20261121/green-d1r2-print-live.txt`. pagedjs-cli verdict: page count 17 versus 14, font list MATCH. Only the pagedjs-cli render runs under puppeteer 25; the live render runs with Playwright + Paged.js. Chrome 157.0.8103.78 installs to ~/.cache/puppeteer. The first render fails on the sandbox; the same render with `--browserArgs="--no-sandbox"` exits 0. No live code calls pagedjs-cli or puppeteer. Evidence: `measure/runs/deps_refresh_20261121/green-d1r2-print-pagedjs-cli.txt`.
    - B-D1-1 (Review B nit): commit `33c94f59`. The three sharp ALLOWLIST reasons now name the three print test files and their test names from the sharp 0.35.5 first-run capture: `measure/runs/deps_refresh_20261121/green-d1-sharp-0355-capture.txt`. J18 (storytime-loops-share) failed with a dirty content folder, so it is not tied to sharp alone. Gate logic is unchanged. The self-test exits 0 with 19 rule checks and the dashboard gate exits 0. Snapshot: `measure/runs/deps_refresh_20261121/audit-snapshot-dashboard-20261121T044828Z.json`. Result log: `measure/runs/deps_refresh_20261121/green-d1r2-057627d4.log`.
- [x] Task: Measure - User Manual Verification 'Phase D1: dashboard critical and high' (Protocol in workflow.md). Closed at the D1 checkpoint: no visible change; replaced by the print-path comparison with round 11 and the phase acceptance (phase-acceptance-d1-a274e5e4.json). Acceptance at `a274e5e4`.

D1 accepted 2026-11-21 at `a274e5e4`. Dashboard before (package level) 6 critical, 23 high, 15 moderate, 2 low; after 0 critical, 1 high (sharp, allowlisted to 2026-12-15), 1 moderate (qs), 2 low (katex, pagedjs-cli). D3 carries: qs, katex, pagedjs-cli (proposal: remove the unused pagedjs-cli and its exclusive overrides), 5 inert overrides, eslint-config-next 16.1.6.

## Phase D2: video/storytime-song critical and high (by 2026-11-23; runs after D1)

Before D2 Green, the orchestrator tells the PM, so the owner of track `storytime_song_video_20261022` knows the upgrade is coming. This phase changes only `video/storytime-song/package.json` and `video/storytime-song/package-lock.json`. `scripts/render.mjs` and every other file of track `storytime_song_video_20261022` stay unstaged and unchanged. The video gates run in a checkout that holds that track's uncommitted `scripts/render.mjs` work. Record the observed gate state. Change nothing of that track.

- [x] Task: Red role (Tests first): run the gate on the phase base. Save the fresh output to `measure/runs/deps_refresh_20261121/red-d2-<short sha>.txt`. No gate change in this phase: the F3 change landed in D1. The gate must exit 1. Mark this task with its commit id and commit. Red commit: `da364afb`.
    - Red evidence (2026-11-21, phase base `c40b6b6f`): `node measure/tracks/deps_refresh_20261121/audit-gate.mjs video` exits 1 with 1 advisory at high or above (zod `GHSA-mrhx-c7xc-m3w5`, high). Fresh output: `measure/runs/deps_refresh_20261121/red-d2-c40b6b6f.txt`. Self-test (`--self-test`, fixed fake data, no network): exit 0, 19 rule checks pass; output: `measure/runs/deps_refresh_20261121/red-d2-c40b6b6f-selftest.txt`. Snapshot of the audit JSON read: `measure/runs/deps_refresh_20261121/audit-snapshot-video-20261121T054448Z.json`. Result log: `measure/runs/deps_refresh_20261121/red-d2-c40b6b6f.log`.
    - Before record (2026-11-21, track commit `d8c3e935`): the gate exits 1 with one advisory: zod `GHSA-mrhx-c7xc-m3w5` (high). The 10 high entries all trace to it. Evidence: `measure/runs/deps_refresh_20261121/red-gate-video.txt`.
- [x] Task: Implement: run npm in `video/storytime-song/` only. Apply the `@remotion` decision above: one command, `npx remotion upgrade`, a patch upgrade inside 4.0.x, then pin every `remotion` and `@remotion/*` package to the same exact version (no caret), the newest 4.0.x that clears zod `GHSA-mrhx-c7xc-m3w5`. Record the pinned version in this plan after Green. Do not keep a package major upgrade that breaks the build without the gates passing. Green commit: `a3d0e909`. Pinned version: 4.0.545.
    - `npx remotion upgrade` selected 4.0.545, inside 4.0.x, but its npm install exited 1 with EALLOWSCRIPTS. The user `.npmrc` sets `allow-scripts=@opencode/cli`, which npm 11.17 rejects for a project-scoped install. No file changed from that command. The sanctioned fallback ran `npm install --save-exact` with explicit 4.0.545 versions and the inherited `npm_config_allow_scripts` cleared. Every direct `remotion` and `@remotion/*` package now holds the exact version 4.0.545. The transitive zod moved from 4.5.4 to 4.6.7. Version table: `measure/runs/deps_refresh_20261121/versions-d2-video.txt`.
    - PA-D2-1: the 4.0.545 pin also moves the active bundler: `@rspack/core` 1.7.11 -> 2.3.0 and `@rspack/plugin-react-refresh` 1.6.1 -> 2.0.2 (12 major lockfile moves, all rspack; `remotion.config.ts` sets `Config.setRspack(true)`). Transitive `webpack` moves 5.112.0 -> 5.105.0 (pinned by `@remotion/bundler`; no advisory at either version). The bundle and the composition listing pass; no frame render ran in D2. The orchestrator asks the PM to have the song-video owner run one short placeholder render before the 2026-11-25 Forge-art work.
    - PA-D2-3: the orchestrator told the PM before D2 Green (report of 2026-11-21, after the D1 acceptance at `a274e5e4`) and checked that no Remotion process ran at Green start. The `npm install --save-exact` fallback was allowed in the orchestrator Green brief of 2026-11-21: `npx remotion upgrade` failed its install with EALLOWSCRIPTS from the user `~/.npmrc` allow-scripts line; the fallback installs the same versions that the upgrade printed.
- [x] Task: Verify: `GREEN_TEST_COMMAND_D2` exits 0 (the orchestrator sets the pair first). `PROJECT_LINT_VIDEO`, `PROJECT_CHECKS_VIDEO`, `PROJECT_TESTS_VIDEO`, and `PROJECT_BUILD_VIDEO` exit 0 in heavy-runs. Save the after-audit JSON to `measure/runs/deps_refresh_20261121/audit-after-d2-video.json`. Evidence commit: `a3d0e909`.
    - The gate exits 0 on `video`, `--self-test` exits 0, and the gate still exits 0 on `dashboard`. Each video heavy gate exits 0. The after-audit holds 0 critical, 0 high, and 10 moderate package entries from 1 advisory (minimatch `GHSA-g3hv-75wg-m249`); D3 needs one fix or one allowlist entry for video. Logs: `measure/runs/deps_refresh_20261121/green-d2-*.txt`. The after-audit JSON: `measure/runs/deps_refresh_20261121/audit-after-d2-video.json`.
- [x] Task: Measure - User Manual Verification 'Phase D2: video/storytime-song critical and high' (Protocol in workflow.md). Closed at the D2 checkpoint: no visible change; replaced by the bundle and composition-listing checks and the phase acceptance (phase-acceptance-d2-d7d6984d.json). Acceptance at `d7d6984d`.

D2 accepted 2026-11-21 at `d7d6984d`. Video before (package entries) 0 critical, 10 high, 10 moderate, 0 low; after 0 critical, 0 high, 10 moderate (1 advisory, minimatch), 0 low.

## Phase D3: the rest of the updates and the moderate/low list (by 2026-11-25)

- [ ] Task: Red role (Tests first): run the gate on the phase base. Save the fresh output to `measure/runs/deps_refresh_20261121/red-d3-<short sha>.txt`. No gate change in this phase. The gate must exit 1. Mark this task with its commit id and commit.
    - Before record (2026-11-21, track commit `d8c3e935`): the gate exits 1 with 127 advisories without an allowlist reason across both projects. Evidence: `measure/runs/deps_refresh_20261121/red-gate-both-moderate.txt`.
- [ ] Task: Implement: update the rest of the packages of both projects. Give each remaining moderate or low advisory a full allowlist entry (F3 fields) with its reason (no upstream fix, or a breaking major deferred). Defer a breaking major that does not fit by 2026-11-25. Record its reason here and in the allowlist.
    - PM decision (2026-11-21, word for word): "your default is accepted. Remove pagedjs-cli and the overrides that only it needs (the puppeteer chain). PM checked: the print scripts use @playwright/test chromium + node_modules/pagedjs/dist/paged.polyfill.js; no code imports pagedjs-cli or puppeteer. Keep the pagedjs package (the polyfill). D3 proof stays: render one real book with scripts/print/make-book-pdf.ts after the change and compare the page count and a contact sheet with the last proof."
    - Remove `pagedjs-cli` from `dashboard/package.json`. The removal supersedes the D1 keep above. Remove each npm override that only the pagedjs-cli chain needs. Decide by `npm ls` after the removal: an override whose package is gone from the tree goes; an override with another parent, for example `ws`, stays if a parent still needs it. Keep `pagedjs` (the polyfill).
    - D3 also handles: `qs` (moderate), `katex` and `pagedjs-cli` (low; `pagedjs-cli` goes with the removal), the 5 inert overrides, `eslint-config-next` 16.1.6 (match `next` 16.4.6 if the gates pass, else defer with its reason), and `minimatch` in video (1 advisory, `GHSA-g3hv-75wg-m249`; one fix or one allowlist entry).
- [ ] Task: Verify: `GREEN_TEST_COMMAND_D3` exits 0 (the orchestrator sets the pair first). `GREEN_TEST_COMMAND_D1` and `GREEN_TEST_COMMAND_D2` still exit 0. All eight project gates exit 0 in heavy-runs. Save the after-audit JSON of both projects to `measure/runs/deps_refresh_20261121/audit-after-d3-dashboard.json` and `audit-after-d3-video.json`. Write the remaining moderate and low list with reasons to `measure/runs/deps_refresh_20261121/audit-after-counts.txt`.
    - D3 proof (PM decision, 2026-11-21): after the removal, render one real book with `dashboard/scripts/print/make-book-pdf.ts` into `/tmp/opencode/` (never `~/Desktop/print-ready`). Compare its page count and a contact sheet with the last proof of the same book. Name the proof file here. Never use port 3005 (live cutover freeze).
- [ ] Task: Measure - User Manual Verification 'Phase D3: the rest of the updates and the moderate/low list' (Protocol in workflow.md). This task is deferred to track close: no visible change. Phase acceptance checks the audit counts and the gate exits; the orchestrator states them to the PM.

## Close

- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`.
    - Add to `measure/lessons-learned.md`: "npx remotion upgrade fails with EALLOWSCRIPTS while ~/.npmrc holds an allow-scripts line; use npm install --save-exact with the versions it prints."
- [ ] Push: the orchestrator runs safe-push (fast-forward only, no deploy) and records the pushed SHA here. No human gate applies.
