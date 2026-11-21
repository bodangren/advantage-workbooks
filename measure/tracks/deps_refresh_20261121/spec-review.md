# Spec review: deps_refresh_20261121

Author model: opencode-go/glm-5.3#high

## Round 1

Date: 2026-11-21
Reviewer: measure-spec-review / opencode-go/hy4-flash-free#high

### What this track proposes
This track refreshes npm packages in dashboard/ and video/storytime-song/ to the latest versions that work. It fixes all critical and high advisories by 2026-11-23 and lists each remaining moderate or low advisory with its reason by 2026-11-25. Lint, the type check, the tests, and the build must pass through heavy-run.sh, and the work must be pushed. Three phases use a committed audit gate as the Red test and the Green test.

### How the current system works, per this spec
The spec records 46 advisories in dashboard/ and 20 in video/storytime-song/; all 10 high entries of the video project trace to zod GHSA-mrhx-c7xc-m3w5. Both projects use npm with separate package files and no root package.json. The committed audit-gate.mjs runs npm audit --json and fails while any advisory at or above the phase minimum has no ALLOWLIST reason, and its Red evidence is committed at the track commit. The video project belongs to the active track storytime_song_video_20261022, whose scripts/render.mjs has uncommitted changes.

### Findings
- F1 [Blocker] plan.md Gate commands (orchestrator environment): the plan defines RED_TEST_COMMAND_D1, RED_TEST_COMMAND_D2, RED_TEST_COMMAND_D3, GREEN_TEST_COMMAND_D1, GREEN_TEST_COMMAND_D2, and GREEN_TEST_COMMAND_D3, but the mid-red and green gates read RED_TEST_COMMAND and GREEN_TEST_COMMAND; the plan gives no mapping from the numbered names to the gate names. Rationale: the zero-decision check forbids a wiring choice left to the implementer, and with no mapping a gate can run with an unset variable.
- F2 [Blocker] plan.md Red tasks (Phases D1, D2, D3): the track commit d8c3e935 already holds audit-gate.mjs and all three red-gate-*.txt evidence files, and each Red task only repeats 'run the gate and save the output'; no task names a new artifact or a commit step. Rationale: the mid-red gate fails when HEAD equals the baseline, so Red must advance HEAD with one new commit per phase, which the plan does not enable.
- F3 [Major] audit-gate.mjs ALLOWLIST: the gate passes an advisory at high or above when ALLOWLIST holds its id and any reason string, and the gate enforces neither a reason format nor a re-check date. Rationale: the done-when asks for 0 critical and 0 high advisories, so a high advisory can stay and still pass the green gate, and a reason with no re-check date never expires.
- F4 [Major] plan.md scope and video/storytime-song: the plan limits file changes to package.json and package-lock.json, which protects scripts/render.mjs, but it does not state that other files stay unstaged, does not coordinate the @remotion 4.0.537 to 4.0.545 upgrade with the active track storytime_song_video_20261022, and does not note that the video gates read that track's uncommitted scripts/render.mjs. Rationale: the upgrade can break the other track mid-composition, and the other track's dirty work can break these gates.
- F5 [Major] plan.md Close: the plan calls the push a human gate. Rationale: safe-push is fast-forward only and deploys nothing, the PM done-when requires the push, and human gates cover paid generation, deploys, deletions, and public dates; the plan should name safe-push and record the pushed SHA.
- F6 [Major] plan.md dependency decisions: the @remotion default in the D2 Red evidence offers two methods (upgrade script or direct npm install) and sets no exact-pin rule, and neither spec.md nor plan.md records a pagedjs-cli 0.0.7 downgrade decision or default. Rationale: the zero-decision check requires one dependency choice per phase, and an implicit default leaves Red and Green to choose and gives no record to contest.
- F7 [Nit] plan.md gate commands, PROJECT_TESTS: the dashboard test command excludes three named test files as known failures of other tracks while the done-when says that tests pass. Rationale: the plan should cite the record for each exclusion so that the partial run stays auditable.

## Round 2

Date: 2026-11-21
Reviewer: measure-spec-review / opencode-go/hy4-flash-free#high

### What this track proposes
This track refreshes npm packages in dashboard/ and video/storytime-song/ to the latest versions that work. It fixes all critical advisories and all high advisories by 2026-11-23, or gives each remaining high advisory a full allowlist entry. It lists each remaining moderate or low advisory with its reason by 2026-11-25. Lint, the type check, the tests, and the build pass for both projects through heavy-run.sh. The orchestrator pushes the work with safe-push and records the SHA.

### How the current system works, per this spec
The spec records 46 advisories in dashboard/ and 20 in video/storytime-song/; all 10 high entries of the video project trace to zod GHSA-mrhx-c7xc-m3w5. Both projects use npm with separate package files and no root package.json. The audit gate in audit-gate.mjs runs npm audit --json and fails while any advisory at or above the phase minimum has no ALLOWLIST reason. Its Red evidence is committed at track commit d8c3e935 as the before record. The video project belongs to the active track storytime_song_video_20261022, whose scripts/render.mjs has uncommitted changes.

### Findings
- None
