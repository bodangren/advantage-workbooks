# Test strategy: storytime_song_video_20261022 (P1 and P2, PM scope 2026-11-22)

Role: measure-strategy. Track: `storytime_song_video_20261022`.
HEAD at authoring: `9256a77bc87ba5f480a696f5cf8579e05e92ee09` (short `9256a77b`).
This HEAD is the role base. It is not the phase base.
Phase headings used by the orchestrator gate (exact text):

- `## Phase 1: Compositor with placeholder art`
- `## Phase 2: Forge art`
- `## Phase 3: Hand-off`

## 1. Decisions folded into this revision

1. The Daniel hold of 2026-10-22 (plan line 13) is lifted. Daniel approved the week 1 classroom and phone videos with Forge art on 2026-11-04 (plan lines 18-19). The hold no longer blocks the weeks 2-7 open items or the re-render.
2. The Forge art is ready. `~/Desktop/handoff/storytime-song-art/` holds `MANIFEST.tsv` with 108 data rows, 100 cut-outs (Pat, Sam, Mia, May; 25 frames each) and the w04 and w07 scene sets (4 files each). All 108 SHA-256 values match. Source commit `65e233fb`. The two scene sets are byte-identical. Lily has no rows and stays a placeholder. w07 has no stage file and uses the default classroom. The folder is read-only input. Copy only the files that a week uses. Never move, rename, or delete a file in the handoff folder.
3. Karaoke is not in release 1 (decision 2026-10-26). The karaoke cut stays deferred. It does not block a Phase 1 gate.
4. `video/storytime-song/scripts/render.mjs` has uncommitted edits of unknown owner. They add `--cut karaoke`. Do not stage or change that file. The re-render uses the committed `all`, `classroom`, and `phone` behavior. The renders do not depend on the uncommitted edit; the edit is functionally the same for those three cuts. If a checkout drops the edit, the renders still run.

## 2. Gate commands (orchestrator environment)

```bash
RED_TEST_COMMAND='set -o pipefail; cd video/storytime-song && node --test --test-concurrency=1 tests/bubbles.test.mjs tests/placeholders.test.mjs tests/manifest-intake.test.mjs tests/forge-contracts.test.mjs tests/prepare-snapshot.test.mjs tests/forge-inset.test.mjs tests/prepare-robustness.test.mjs tests/review-a-r5.test.mjs tests/phase-acceptance-p1.test.mjs tests/phase2-look.test.mjs tests/may-2d.test.mjs tests/phase2-boxes.test.mjs tests/phase2-security.test.mjs'    # must fail before Green; files run serially because prepare() writes shared public/<week> output dirs
GREEN_TEST_COMMAND='set -o pipefail; cd video/storytime-song && node --test --test-concurrency=1 tests/bubbles.test.mjs tests/placeholders.test.mjs tests/manifest-intake.test.mjs tests/forge-contracts.test.mjs tests/prepare-snapshot.test.mjs tests/forge-inset.test.mjs tests/prepare-robustness.test.mjs tests/review-a-r5.test.mjs tests/phase-acceptance-p1.test.mjs tests/phase2-look.test.mjs tests/may-2d.test.mjs tests/phase2-boxes.test.mjs tests/phase2-security.test.mjs'   # must pass after Green
PROJECT_LINT='set -o pipefail; cd video/storytime-song && npm run lint'          # runs eslint src && tsc
PROJECT_CHECKS='set -o pipefail; cd video/storytime-song && npx tsc --noEmit'
PROJECT_TESTS='set -o pipefail; cd video/storytime-song && npm test'             # node --test tests/*.test.mjs
HEAVY_RENDER='HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=3000 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c "set -o pipefail; cd video/storytime-song && node scripts/render.mjs l2/wNN --concurrency 2"'
```

`package.json` defines `test` as `node --test tests/*.test.mjs` and `lint` as `eslint src && tsc`.
Every gate command and every render runs through ONE heavy-run wrapper, never nested.
Substitute the real week for `l2/wNN` in `HEAVY_RENDER` (w02 to w07).
Exit 75 from the wrapper means the pre-flight wait ended before memory was free. Retry once with the same command.
Capture the wrapper exit code outside the wrapper when a piped capture needs the true code.
Red authors the thirteen named test files. If Red picks other names, the orchestrator updates this block and plan.md before Green.

### Immutable phase base

Immediately after the commit that holds this strategy, the plan gate block, and the strategy log, the orchestrator runs `git rev-parse HEAD` and records that value as `phase_base_sha`. The value must be captured before Task 7 Red creates the first test file. Do not use `9256a77b` as `phase_base_sha`; it predates the strategy commit.

## 3. Phase 1: Compositor with placeholder art

Risk: **high**. The compositor changes, and week 1 is approved by Daniel. A pixel change in week 1 breaks an approved asset.

### 3.1 Gates

- Red command: `RED_TEST_COMMAND`. Run it before Green. It must exit non-zero with each new test failing for the missing behavior.
- Green gate: `GREEN_TEST_COMMAND` exits 0; `PROJECT_LINT` exits 0; `PROJECT_CHECKS` exits 0; `PROJECT_TESTS` exits 0. The T1.8 live proof exits 0.
- Closeout gate: every Phase 1 task line is `[x]` or carries `deferred:`; Review A and one adversarial round have results; no week 1 media file is changed in git; the evidence file is written under `measure/runs/storytime_song_video_20261022/`.

### 3.2 Tests (each row has a falsification condition)

| Id | Test and fixture | Live or artifact | Falsification condition |
|---|---|---|---|
| T1.1 | `tests/bubbles.test.mjs`. Fixture: `buildSpec(week, duration)` for `l2/w06.json`. Assert 4 bubbles with text `Meow, meow!`, `Woof, woof!`, `Tweet, tweet!`, `Quack, quack!`. Assert each `start` equals the first sound word `start` in `song.times`, and each `end` equals the segment end. Assert each bubble token occurs in that line's word list. | Artifact (pure data) | Hard-coded bubble text, or a time shifted by one frame, fails. |
| T1.2 | `tests/bubbles.test.mjs`. Scan every spec string and every bubble string for U+0E00..U+0E7F. Print `Thai characters: 0` as a labeled integer. Apply the same filter to the shipped week files: drop `th` keys, drop strings with Thai, then assert 0. | Artifact | One Thai character in output makes the count 1 and fails. |
| T1.3 | `tests/bubbles.test.mjs`. Pure `bubbleAt(spec, t)`. Assert no bubble before `start` and after `end`, and one at the midpoint for each w06 bubble. Assert no bubble for a line with no sound word. | Artifact | A bubble shown at all times fails. |
| T1.4 | `tests/bubbles.test.mjs`. Static guard: the bubble component renders `bubbles[].text` and holds no `Img` or `staticFile` call. Assert each w02-w07 image prompt carries the sentence `No letters, words, or numbers anywhere.`; count prompts and matches as labeled integers. | Artifact | An image used for bubble letters, or a prompt without the sentence, fails. |
| T1.5 | `tests/placeholders.test.mjs`. Fixture: `l2/w02.json`, `l2/w04.json`, `l2/w06.json`, `l2/w07.json`. Assert actors come from `image.characters` or the CLASS fallback in `prepare.mjs`. Assert each unmapped actor resolves to the placeholder `Figure` or `Puppy`. Assert `placeholderOf(prompt)` names the animals of w06 (cat, dog, bird, fish, frog, duck) and the props of w07 (box, ball, doll, car, kite, drum, train, top). | Artifact | A hard-coded week list, or a missing animal or prop, fails. |
| T1.6 | `tests/placeholders.test.mjs`. Pure bounce function. Assert the y offset is 0 on a beat and inside `[4, 12]` px at mid-beat, for both cuts. Assert it is applied to every placeholder animal and prop of w06 and w07. | Artifact | A static y value fails. |
| T1.7 | `tests/bubbles.test.mjs`. Geometry from `src/layout.ts`. Assert the landscape bubble box lies inside the 1920x1080 frame and does not intersect `LANDSCAPE_BOX` or `INSET`. Assert the portrait bubble box `box.portrait` lies inside the 1080x1920 frame, does not intersect `PORTRAIT_BOXES.lyrics` or `PORTRAIT_BOXES.gesture`, and stays in the top scene band (height 607.5 px at the portrait scene scale). Use explicit numeric boxes, not a digit regex. | Artifact | A bubble moved over the lyric text or the inset fails. |
| T1.8 | `tests/week1-regression.test.mjs`. The guard asserts (a) the approved `w01/song.mp4` and `w01/song-phone.mp4` files are unchanged in git and still match `measure/runs/storytime_song_video_20261022/red-p1-w01-frames.txt`, (b) the evidence names a same-toolchain comparison of the phase-base source and the new source for frames 753 and 1652 with equal hashes, parsed from labeled lines, (c) the evidence records the toolchain drift as information, and (d) the evidence `Result:` line is PASS. Labeled evidence lines: `same-toolchain <file> frame <N> base sha256: <64hex>` and `same-toolchain <file> frame <N> new sha256: <64hex>` for each of the 4 baseline rows, `toolchain drift approved vs current match count: <a> of 4`, `toolchain drift PSNR dB: <n>`, `prepare full w01 spec sha256: <64hex>` matching `tests/fixtures/w01-prepare-spec-1ffd649b.json`, `base stills source: base-tree prepare output and base-tree public assets`, and `Result: PASS`. Week 1 bubble count stays 0. | Live | A moved approved file, a missing same-toolchain pair, an unequal pair, or a `Result: MISMATCH` line fails. |
| T1.9 | The evidence records `render exit classroom: <int>` and `render exit phone: <int>`, each parsed as a labeled integer and equal to 0, plus `git status --porcelain` empty for the two approved media files. | Live | A non-zero exit, a missing labeled exit line, or a changed media file fails. |

### 3.3 Fixtures, mocks, and live proof

- Fixtures: the shipped week packages under `content/storytime/l2/`, read through the Thai filter. Small synthetic `Spec` objects for geometry and timing. No mock week replaces a shipped week in T1.1 or T1.8.
- Mocks: none for ffprobe or ffmpeg. The live proof uses the real binaries and the real media.
- Live proof: T1.8 and T1.9 decode real rendered frames. A passing artifact test never counts as proof that a bubble is on screen.

### 3.4 Architecture guardrails and changed-contract risks

- Keep the video project outside `dashboard/`. Do not touch the dashboard lockfile.
- Video files stay out of git. Week package files stay unchanged.
- `Bubble` and `Line.bubbles` already exist in `src/types.ts`. Reuse them. Do not add a new schema key.
- `forge.mjs` currently throws when a cut-out is missing. Phase 1 must not change that contract yet. Phase 2 changes it with a fallback (T2.4).
- Keep `INSET` and `PORTRAIT_BOXES` as the single source of placement numbers. Do not copy their values into the bubble component.
- Keep the 3 s start shift and the 1.5 s poster time. The regression test reads real frames.
- Do not stage `scripts/render.mjs`, `dashboard/AGENTS.md`, `dashboard/raw.json`, or `measure/runs/primary_v2_look_20261020/**`.

### 3.5 Deliberately red aggregate suite

During Red, `PROJECT_TESTS` includes the new red files and will fail. Do not use it as a Red gate. If an agent must run the aggregate suite early, run the five existing files only (`tests/forge.test.mjs`, `tests/layout.test.mjs`, `tests/line-pictures.test.mjs`, `tests/prepare.test.mjs`, `tests/timeline.test.mjs`) and label the capture "red window; new files excluded". At Green, restore `npm test` and require exit 0. Never edit a test to hide an intentional Red failure.

### 3.6 Artifact tests versus live behavior tests

T1.1 to T1.7 check data, source, and geometry. They are cheap and deterministic. T1.8 and T1.9 check rendered pixels. A green artifact suite with a stale media file is a false pass. The closeout gate requires both kinds.

## 4. Phase 2: Forge art

Risk: **critical**. The input is a 108-file external handoff, the copy feeds a public repository, and 24 render outputs must be correct. A wrong scale or a missing fallback corrupts every week.

### 4.1 Gates

- Red command: `RED_TEST_COMMAND`, extended with the manifest-intake file. It must fail before Green.
- Green gate: GREEN tests, `PROJECT_LINT`, `PROJECT_CHECKS`, and `PROJECT_TESTS` exit 0. T2.1 to T2.6 pass. Intake evidence exists before the first render.
- Closeout gate: T2.7 records 24 outputs with ffprobe, SHA-256, 24 frames, and 24 render exit codes. T2.8 and T2.9 pass on decoded frames. T1.8 still passes. Phase 2 task lines are `[x]` or carry `deferred:`. Review A, narrow Review B, Review C, one adversarial round, and the Storytime or Daniel frame-sheet look check have results.

### 4.2 Tests (each row has a falsification condition)

| Id | Test and fixture | Live or artifact | Falsification condition |
|---|---|---|---|
| T2.1 | `tests/manifest-intake.test.mjs`. Read `MANIFEST.tsv`. Assert the header is `file`, `character_or_week`, `source_commit`, `sha256`. Assert 108 data rows, 25 rows for each of pat, sam, mia, may, and 4 rows for each of w04 and w07, as labeled integers. Assert `source_commit` is `65e233fb` on every row. Assert every SHA-256 matches the file. Assert every path is relative, has no `..`, and exists. | Artifact | A missing row, a wrong byte, an absolute path, or a wrong commit fails. |
| T2.2 | `tests/manifest-intake.test.mjs`. For `classroom.png`, `rug.png`, `classroom.txt`, and `manifest.json`, assert the SHA-256 of `scenes/w04/<f>` equals that of `scenes/w07/<f>`. Assert 4 comparisons. | Artifact | One changed byte in the w07 scene set fails. |
| T2.3 | `tests/forge-contracts.test.mjs` (A-F4). Run `copyManifestSubset` into a temp folder with only the files a week uses. Assert the temp folder holds exactly those files, each SHA-256 equals the manifest, and the handoff tree is unchanged. Assert the call returns the project-relative copies and Lily rows are never copied. | Artifact plus live copy | An absolute return path, a copied Lily row, or a changed handoff byte fails. |
| T2.4 | `tests/manifest-intake.test.mjs` T2.4 plus `tests/forge-contracts.test.mjs` (A-F2). Adapter contract. The TSV input must equal the `ForgeArt` shape of `src/types.ts`: numeric `scale`, `canvas`, `foot`, `cast`, `gestures`, `idle`, `gestureBox`, and `scenes`, with no `framesByGesture` key. Every path stays project-relative and never names the handoff folder. Gesture frames stay per package name as `src/types.ts` defines them: the `gestures` and `idle` maps equal the approved Adventurer inset from the phase-base prepare (fixture `tests/fixtures/w01-prepare-spec-1ffd649b.json`, generated from `git show 1ffd649b`), not handoff cut-outs. The cut-out frames are counted under `cast`, 25 rows per character for pat, sam, mia, and may. No cut-out path appears in `gestures` or `idle`. | Artifact | An absolute handoff path, a missing `gestures` map, or a leaked slug group fails. |
| T2.5 | `tests/manifest-intake.test.mjs`. Assert no stage file exists for w07 in the handoff. Assert `sceneOf` gives `classroom` for w07 lines. Assert prepare sets `spec.art` to `forge` for the weeks with cut-outs and keeps the scene default for w07. | Artifact | A required stage file, or a wrong scene id, fails. |
| T2.6 | `tests/manifest-intake.test.mjs`. For every week 2 to 7, derive the covered actors from the manifest cut-out rows, excluding the scrapped 3D May for w07 (`SCRAPPED_3D`, PM 2026-11-23), and run the render entry `prepare(rel)`. A week with one or more covered actors prepares `forge` art: each covered actor keeps a project-relative cut-out in `spec.forge.cast`, each copied cast file exists on disk, each missing actor (Lily, Ben, the w04 family) resolves to a placeholder, no cut-out gesture or idle frame feeds the inset, every on-disk forge file is manifest-listed or an approved Adventurer inset file, and Lily is never copied. Only a week with no covered actor keeps placeholder art with an empty forge folder. Assert the w04 and w07 scene rows when the manifest holds them, with w07 lines on the classroom default. | Artifact | A covered week that prepares placeholder art, a covered actor with no cast entry or no copied file, a cut-out gesture in any week inset, a week copied outside its manifest subset, or a Lily cut-out fails. |
| T2.10 | `tests/forge-contracts.test.mjs` (A-F1). Missing-cast fallback at spec and prop level. With Forge art on, every w04 actor without a cut-out (Lily, Ben, the w04 family) resolves through `resolveActorArt` to a placeholder; present cast resolves to Forge. `Actors.tsx` guards each `forge.cast[name]` lookup before `staticFile`. No render runs. | Artifact | An unguarded `staticFile(forge.cast[name])` on a missing actor, or no placeholder fallback, fails. |
| T2.11 | `tests/prepare-snapshot.test.mjs` (Review A note). The week 1 guard covers `prepare.mjs` output. `buildSpec(l2/w01)` from the current `prepare.mjs` deep-equals the fixture `tests/fixtures/w01-spec-1ffd649b.json` generated from `git show 1ffd649b:video/storytime-song/scripts/prepare.mjs`. `prepare("l2/w01")` full output deep-equals the fixture `tests/fixtures/w01-prepare-spec-1ffd649b.json` generated by running the phase-base prepare in a scratch tree. The week 1 compare evidence carries labeled `prepare snapshot spec sha256:`, `prepare full w01 spec sha256:`, and `base stills source: base-tree prepare output and base-tree public assets` lines. | Artifact | A prepare change that alters week 1, or evidence without the snapshot lines, fails. |
| T2.13 | `tests/prepare-robustness.test.mjs` (A-F6). The handoff path is injectable through the `STORYTIME_SONG_ART_DIR` environment variable, defaulting to `~/Desktop/handoff/storytime-song-art`. With the variable pointed at a missing temp path, `prepare` does not throw: weeks without a previously copied set (w04) keep placeholder art, and week 1 keeps its previously copied media forge art and equals the phase-base full-output fixture. | Artifact | A missing handoff that throws, or a week 1 that drifts from the phase base, fails. |
| T2.14 | `tests/prepare-robustness.test.mjs` (A-F7). The production copy verifies each copied file against its manifest row and fails on a mismatch, proved with a temp handoff whose manifest carries a wrong SHA-256 for a used cut-out. | Artifact | A changed handoff byte that reaches a render without an integrity failure fails. |
| T2.12 | `tests/forge-contracts.test.mjs` (A-F3 and C-F1). Render-path wiring. `scripts/render.mjs` keeps calling `prepare(rel)`, and that entry point consults the handoff manifest so a week with cut-outs (w02 Pat) prepares Forge art with project-relative paths. `prepareWithManifest` has a caller on the render path. | Artifact | A `prepare` that ignores `MANIFEST.tsv`, or an uncalled `prepareWithManifest`, fails. |
| P2-F6 | `tests/phase2-boxes.test.mjs`. The w04 family placeholders stand on the Forge room floor: person-kind figures at a plausible standing height with feet on the floor band, clear of the rug centre, the lyric box, the inset card, and each other (no overlap above 15 percent). Height floor is cut-relative: 0.22 to 0.45 of the 1080 classroom frame, and 0.22 to 0.45 of the 607.5 px phone scene band (133 to 273 px). Red P2 r9 reconciliation: a 22 percent frame floor needs 422.4 px, but the Figure aspect (P2-F8) needs 298.2 px of width for that height while the phone band holds one 427.5 px slot, so both rules cannot hold; the shipped 200 px row fills a third of the scene, a larger relative share than the classroom row fills of its frame. | Artifact | A prop box for a family member, feet off the floor band, a covered rug centre, or a phone figure outside 133 to 273 px fails. |
| P2-F8 | `tests/phase2-boxes.test.mjs` (Review A r3 F1). Drawn figure geometry. For every week 2-7 line in both cuts, each figure-kind box from `actorBoxes` must hold the drawn Figure: the body centre and the full svg extent (width height times 240 over 340, body centred at half width, Figure.tsx) lie inside the box. Every drawn body (weeks without a scene video) lies fully inside the frame. | Artifact | A figure wider than its box, a body centre past the frame edge, or a body outside the frame fails. |
| P2-F9 | `tests/phase2-boxes.test.mjs` (Review A r3 F2). Shot window tiling. Shots tile exactly per week 2-7, and the Song shot Sequence must not extend past the next shot start unless Actors slides out. | Artifact | An exit tail without a slide-out fails. |
| T2.7 | Render evidence. For each week 2 to 7, run `HEAVY_RENDER` once (six runs, never nested). Record every exit code. Assert 24 outputs: `song.mp4`, `song-phone.mp4`, `song-poster.jpg`, `song-phone-poster.jpg` per week. ffprobe: classroom 1920x1080 H.264 plus AAC; phone 720x1280 H.264 plus AAC; posters 1280x720 and 720x1280. Record SHA-256 per output. Extract 24 frames at 10 s and 40 s (two cuts times two times times six weeks). Keep the naming `frames-wNN-<cut>-<time>.jpg`. | Live | A non-zero exit, a wrong stream, a wrong size, or a missing frame fails. |
| T2.8 | Live bubble and bounce proof. For w06, decode a frame just before each sound word and a frame inside the bubble window. Assert the bubble region hash changes only in the inside frame. Decode two consecutive frames at a sound word and assert the animal region hash changes. | Live | A bubble never drawn, or a static animal, fails. |
| T2.9 | Live no-overlap proof. At the w06 and w07 bubble times, assert the lyric box and the inset region hashes match the same frames without a bubble. | Live | A bubble drawn over the lyric text or the inset fails. |

### 4.3 Fixtures, mocks, and live proof

- Fixture: the read-only handoff folder. Tests read it through a path join that forbids `..` and absolute paths.
- Mock: a temp copy of the handoff for T2.3 only. No mock ffprobe or ffmpeg.
- Live proof: T2.3 copy, T2.7 renders, T2.8 and T2.9 decoded frames. Keep every exit code and hash in `green-p2-<sha8>-renders.txt` under `measure/runs/storytime_song_video_20261022/`.

### 4.4 Architecture guardrails and changed-contract risks

- The handoff folder is read-only. Copy only needed files into `content/storytime/l2/media/wNN/forge/` and `video/storytime-song/public/l2/wNN/forge/`.
- The TSV schema differs from the existing `manifest.json` schema. The adapter is the only place that maps between them.
- `forgeSpec` now needs per-actor fallback. This is a changed contract from "throw on a missing cut-out". Guard it with T2.4 and keep the old behavior covered by `tests/forge.test.mjs`.
- The new cut-outs hold 25 gesture frames per classmate. Keep the approved Adventurer gesture inset from week 1. Do not switch the inset to a classmate in this revision.
- Week 1 stays approved. Do not re-render week 1 with the new art except for the regression comparison in T1.8. Keep the w01 media files unchanged.
- `render.mjs` stays unstaged. Use `--concurrency 2` and the heavy lock. No `--cut karaoke`.
- No week package edits, no paid generation, no push.

### 4.5 Deliberately red aggregate suite

Same rule as section 3.5. The manifest-intake file is red until Green. `PROJECT_TESTS` becomes a gate after Green only.

### 4.6 Artifact tests versus live behavior tests

T2.1 to T2.6 prove the input and the copy. They do not prove a video. T2.7 to T2.9 prove the rendered output. A green intake with a bad render is a failed phase.

## 5. Phase 3: Hand-off

Risk: **low**. Documentation only.
- Red command: not applicable. No new behavior is tested.
- Green gate: links in `measure/tech-debt.md` and `measure/lessons-learned.md` resolve; both files hold 0 Thai characters; `git status --short` shows no product source edit from this role.
- Closeout gate: the Phase 3 line is `[x]`; final acceptance uses the whole-track gate.
- Review gates: Review A applies. Review B, Review C, adversarial, and UX browser do not apply.
- Falsification condition: a broken link or one Thai character fails the doc gate.

## 6. Anti-pattern coverage (A1-A11 catalog read)

`measure/anti-patterns.md` holds A2 to A10 as active (A1 and A8 retired). A11 is reserved and has no definition. Every test above has a falsification condition.

| Class | Phase 1 defense | Phase 2 defense |
|---|---|---|
| A2 consent-blind publish gate | Not applicable: no publish command. Videos reach Storytime by hand. | Not applicable. Review B covers the read-only handoff instead. |
| A3 digit-only as a labeled count | T1.1 asserts 4 bubbles; T1.8 asserts 4 named frame hashes; T2.1 row counts are labeled integers. | T2.1, T2.2, and T2.7 parse labeled integers and assert exact values. No bare digit match. |
| A4 vacuous pass on nothing done | T1.1 and T1.8 require counts greater than zero. | T2.7 requires 24 outputs and 24 exit codes, not merely zero failures. |
| A5 false claim text versus test reality | The plan gate block names commands that must exit 0. Pass claims go into an evidence file only after a capture. | Every render claim cites `green-p2-<sha8>-renders.txt` with real exit codes. |
| A6 registry overstatement | No note claims the weeks 2-7 re-render before frame evidence exists. | No note claims Forge art in weeks 2-7 before T2.7 and T2.9 pass. |
| A7 over-broad filter | No bare English word is an exclusion token. The Thai filter drops `th` keys and named character ranges. | T2.6 uses a named manifest allow-list, not a word filter. |
| A9 stale archived track path in tests | Tests read shipped week files and `video/storytime-song`, never `measure/tracks/<id>/plan.md`. | Same. Static grep guard in T2.6. |
| A10 generated-facts drift | No `measure/generated` fact feeds this flow. Record as not applicable. | Same. |
| A11 (no definition) | Promotion candidate only: the skill text says free-text `deferred` does not drop a task, but `measure_interphase_checks.py` drops it by substring. The plan uses `[x]` plus `deferred:` wording so both readings agree. | Same. No blocking class. |

## 7. Review gates and applicability

- Review A (correctness): applies in all three phases. One reviewer of a model family other than Red and Green.
- Review B (security): applies in Phase 2, narrow scope. Check TSV path traversal, 108 SHA-256 values, read-only handoff, no secret or private file staged, no Thai in outputs, and video files out of git. Not applicable in Phase 1 or Phase 3.
- Review C (UX/API): applies in Phase 1 and Phase 2, narrow scope. Check CLI flags, defaults, exit codes, output paths, and the pure layout and intake function contracts. No route or page exists. Not applicable in Phase 3.
- Adversarial testing: applies in Phase 1 and Phase 2, one focused round each. Attack a one-frame time shift, a bubble over the lyric box, a missing manifest row, a changed SHA-256, a missing cut-out, and the week 1 frame hashes. Not applicable in Phase 3.
- UX browser review: **not applicable** in all phases. There is no page, route, DOM, CSS, or interactive flow. Remotion studio is a viewing aid. Visual acceptance comes from decoded frame sheets and the Daniel or Storytime look check (week 1 approved 2026-11-04). Frame captures replace a browser gate.

## 8. Non-blocking defaults handed to the orchestrator

1. The new cut-outs change the actor row only. The Adventurer gesture inset stays as approved in week 1. Default: do not change the inset.
2. Ben, Lily, and the w04 family have no cut-out rows. Default: placeholder for each missing actor. No prepare abort.
3. Week 1 is not re-rendered with the new art. Default: keep the approved files and compare frames only.
4. If a Phase 1 gate reads all task lines, the render-script line is `[x]` and carries `deferred: not in release 1 (decision 2026-10-26)`. Phase 3 stays `[ ]` because it is outside Phase 1; it closes at final acceptance.
