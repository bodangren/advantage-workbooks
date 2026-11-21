# Spec: dependency refresh of dashboard and storytime-song

Track: `deps_refresh_20261121`. Type: chore. Lane: light.

## Source

Daniel, 2026-11-21 07:52, via the PM (P1 assignment), word for word:

> "We do not need to migrate to a new provider yet but I want to make sure that our packages are up to date because these past 2 weeks have been hundreds of vulnerabilities"

PM audit of 2026-11-21: `dashboard/` holds 6 critical, 23 high, and 15 moderate advisories. `video/storytime-song/` holds 10 high and 10 moderate advisories.

## Goal

Refresh the packages of both projects. Update every package to the latest version that works. Fix all critical and high advisories first. List each remaining moderate or low advisory with its reason.

## Before state (2026-11-21)

The audit ran read-only. No install, update, or fix ran before it.

- `dashboard/`: 6 critical, 23 high, 15 moderate, 2 low; 46 total. Evidence: `measure/runs/deps_refresh_20261121/audit-before-dashboard.json`.
- `video/storytime-song/`: 0 critical, 10 high, 10 moderate; 20 total. Evidence: `measure/runs/deps_refresh_20261121/audit-before-video.json`.
- Critical and high package names with their advisory ids: `measure/runs/deps_refresh_20261121/audit-before-counts.txt`.

The 10 high entries of `video/storytime-song/` all trace to one advisory: zod `GHSA-mrhx-c7xc-m3w5`.

## Done-when

- No critical advisory stays in either project. A critical advisory may not be allowlisted.
- Every high advisory is fixed, or it holds a full allowlist entry: advisory id, package, severity, reason, and re-check date (YYYY-MM-DD). This meets the PM done-when "or each one left is named with its reason".
- Each remaining moderate or low advisory is listed with its reason (no upstream fix, or a breaking major deferred).
- Lint, the type check, the tests, and the build pass for both projects through `heavy-run.sh`.
- The orchestrator pushed the work with safe-push (fast-forward only, no deploy) and recorded the pushed SHA.

## Dates

- Critical and high: by 2026-11-23.
- The rest of the updates: by 2026-11-25.

## Scope

- `dashboard/` only: `dashboard/package.json` and `dashboard/package-lock.json`.
- `video/storytime-song/` only: `video/storytime-song/package.json` and `video/storytime-song/package-lock.json`.
- Phase D2 changes only those two video package files. `scripts/render.mjs` and every other file of track `storytime_song_video_20261022` stay unstaged and unchanged. The orchestrator tells the PM before D2 Green, so the song-video owner knows. D2 runs after D1.
- Both projects use npm. The repository has no root `package.json`.

## Rules

- Stage by exact path only. Never stage `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, or anything under `measure/runs/primary_v2_look_20261020/`.
- Do not keep a package major upgrade that breaks the build without the gates passing.
- Defer a breaking major that does not fit by 2026-11-25. Record its reason in the plan and in the allowlist of the gate script.
- Lockfile changes come only from npm run in that project folder.
- No Thai text in any file of this track.
- Run every heavy command (lint, type check, tests, build) inside ONE wrapper, never nested: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit 75 means: the pre-flight hold outlasted its wait.

## Dependency decisions (orchestrator, 2026-11-21, spec-review F6)

- `pagedjs-cli`: no downgrade to 0.0.7. Keep the latest 0.4.x. Clear the `puppeteer`, `tar-fs`, `ws`, and `pac-proxy-agent` chains with npm `overrides` in `dashboard/package.json`. The classic golden print tests and the dashboard build must pass. If a chain cannot be cleared, allowlist it with all allowlist fields and re-check date 2026-12-15.
- `@remotion`: one command, `npx remotion upgrade` in `video/storytime-song/`. Then pin every `remotion` and `@remotion/*` package to the same exact version (no caret): the newest 4.0.x that clears zod `GHSA-mrhx-c7xc-m3w5`. The @remotion step is a patch upgrade inside 4.0.x. Record the version in the plan after Green.

## Out of scope

- A provider migration (Daniel: "We do not need to migrate to a new provider yet").
- The monorepo, `tutor-advantage`, and every other folder with its own package files.
- Content, templates, and print files: no change.
