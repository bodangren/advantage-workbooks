# Spec Review: levels_5_9_20261006

Author model: opencode-go/glm-5.3#high

## Round 1

Date: 2026-11-19
Reviewer: spec-review subagent, opencode-go/deepseek-v4.1-flash

### What this track proposes

This track delivers 550 packages for levels 5-9: 154 workbook lessons and 396 bank articles for the 11 books, with media, tags, and coverage reports. Commit 8dcd980f adds Tasks 1.G1 to 1.G5. The tasks extend `dashboard/scripts/plan-dedup.ts` with level, target, printed, and output options, and they keep the levels 1-4 output byte-identical. Task 1.G3 runs the grouping at levels 5-9 with the targets 50, 100, 100, 150, and 150. Daniel decides in the level review whether a kept old article is rebuilt or deleted, and no deletion runs before Phase 7.

### How the current system works, per this spec

Today `dashboard/scripts/plan-dedup.ts` reads one inventory file and the fixed printed file `docs/content-plans/data/legacy-levels-1-4-2026-10-02.json`. It groups the online articles of each level by the cosine of a word bag (title 3, summary 2, passage 1) with average-link clustering, down to the level target minus the printed count. It keeps the best article of each group by student use, then approval, then date. It writes two fixed files under `docs/content-plans/` and resolves both against `REPO_ROOT`. The module runs `main` at import, so an import prints the usage text.

### Findings

- F1 [Blocker] plan.md Gate commands, Task 1.G1, Task 1.G3: `DedupOptions.outJson` and `outMd` carry the defaults `docs/content-plans/data/duplicates-levels-1-4.json` and `docs/content-plans/level-plans/duplicates.md`, and the script writes both with `path.join(REPO_ROOT, ...)` today (plan-dedup.ts lines 115 and 116), while Task 1.G3 passes `--out-json ../docs/content-plans/data/duplicates-levels-5-9.json` from `dashboard/`; no test pins where the default paths land, because the byte-identity run and the fixture run pass explicit temporary paths. Rationale: the plan leaves a file location choice to the implementer; a REPO_ROOT base sends the 1.G3 run to `~/Desktop/docs/...` with exit 0, a cwd base sends the default run to `dashboard/docs/...`, and no gate catches either.
- F2 [Major] spec.md Decisions, grouping targets, and Task 1.G3: the paragraph says the 550 new packages already fill the book targets with new ids, and it still expects level 5 to keep 50 of 92 online articles; D4 decides keep and rebuild the best of each group, and the new paragraph leaves rebuild-or-delete to Daniel. Rationale: the run reports 50 kept old articles on top of the 50 new level 5 packages, so the level holds 100 articles and no reader can tell whether the level total is 50 or 100.
- F3 [Major] plan.md PROJECT_TESTS: the command is the storytime print command, copied word for word, and it names no file that the change touches. Rationale: `plan-dedup.ts` imports `articleBag` and `cosine` from `lib/lesson-package/similarity.ts`, no test in the repository imports that module, and the plan itself records that PROJECT_TESTS holds no plan-dedup case; the gate adds runtime and no regression signal for this change.
- F4 [Major] Task 1.G3: the task accepts the metadata inventory or a passages inventory and names no rule that chooses between them. Rationale: the metadata file holds no summary and no passage (271 articles, 0 with summary, 0 with passage), so the similarity compares titles only; the run then supplies the delete list for Daniel's level 5 review, and weak groups can put a wrong article in the delete column.
- F5 [Major] Task 1.G1, Done when: the clause 'each new rule has a mutant that a test catches' cannot be checked in a Red window. Rationale: a mutant of the implementation needs the implementation, so the clause belongs to Task 1.G2 or to Task 1.G5, and the Red gate has no way to show it.
- F6 [Major] Task 1.G1, new options: the rule 'no file with a new option given means: no article is printed' leaves three cases open: `--out-json` without `--levels` or `--printed`; `--levels 1,2,3,4` written out; and a `--printed` file that does not exist. Rationale: the level 2 keep count (24) depends on the default printed file, so each reading gives a different result or a different exit code, and no test names the mixed cases.
- F7 [Major] Task 1.G1, edge cases: no test covers a level whose printed count is at or above its target, and that case makes `keepCount` negative (plan-dedup.ts line 92) and the cluster then throws on an undefined group (lines 55 to 67). Rationale: a `--printed` file for a small level reaches the crash, and the plan leaves the behavior to the implementer.
- F8 [Nit] Task 1.G1, heading test: the targets line is given as 'for example `Targets: level 5 = 50, ...`' and the last paragraph only 'names the given out-json path'. Rationale: the exact strings that the test asserts are the Red's choice.
- F9 [Nit] Task 1.G1 and Task 1.G2: the cited file `set-book-pictures.ts` line 170 is `dashboard/scripts/storytime/set-book-pictures.ts`. Rationale: a reader searches the wrong folder for the guard form.
- F10 [Nit] Task 1.G2 and Task 1.G3: the JSON `source` string on an inventory with no `readAt` reads 'inventory of undefined' (plan-dedup.ts line 115), and no test asserts it. Rationale: the committed artifact that Daniel reads would hold a broken sentence.
