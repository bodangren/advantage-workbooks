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

## Round 2

Date: 2026-11-19
Reviewer: spec-review subagent, opencode-go/deepseek-v4.1-flash

### What this track proposes

This track delivers 550 packages for levels 5-9: 154 workbook lessons and 396 bank articles for the 11 books, with media, tags, and coverage reports. Commit c01f7789 amends the grouping tasks 1.G1 to 1.G5: it extends `dashboard/scripts/plan-dedup.ts` with level, target, printed, and output options, it fixes the path rule and the error cases, and it keeps the levels 1-4 output byte-identical. Task 1.G3 makes a provisional grouping of the old level 5-9 articles from a passages inventory, after the PM's go, with the targets 50, 100, 100, 150, and 150 as a provisional default. The output has no delete column, and Daniel decides for each kept old article between rebuild and delete. No deletion runs before Phase 7.

### How the current system works, per this spec

Today `dashboard/scripts/plan-dedup.ts` reads one inventory file and the fixed printed file `docs/content-plans/data/legacy-levels-1-4-2026-10-02.json`. It groups the online articles of each level by the cosine of a word bag (title 3, summary 2, passage 1) with average-link clustering, down to the level target minus the printed count. It keeps the best article of each group by student use, then approval, then date. It writes two fixed files under `docs/content-plans/` and resolves both against `REPO_ROOT`. The module runs `main` at import, so an import prints the usage text.

### Findings

- F1 CLOSED: plan.md line 34 gives the path rule for every given path and for the defaults, line 38 tests the 2 default write paths, and line 49 runs 1.G3 from `dashboard/`.
- F2 CLOSED: spec.md line 57 makes the keep count provisional, names Daniel's per-article choice, and states the passages-only input; plan.md line 49 states the provisional output with no delete column.
- F3 CLOSED: plan.md line 22 runs the whole dashboard suite with the unit 2 Red file excluded, and line 27 states the coverage of the new test and `similarity.ts`.
- F4 CLOSED: plan.md line 49 names the passages inventory as the only input, the PM's go, and the metadata file as not an input.
- F5 CLOSED: plan.md line 47 removes the mutant clause from Red; line 48 places it in Green.
- F6 CLOSED: plan.md line 35 defines the printed file in all cases, line 39 names the mixed-option tests, and line 45 names the missing file.
- F7 CLOSED: plan.md line 43 gives the test, and line 48 gives the rule, for a level whose printed count is at or above its target.
- F8 CLOSED: plan.md line 41 fixes the heading, the 3 intro paragraphs, the table header, and the level line.
- F9 CLOSED: plan.md lines 46 and 48 give `dashboard/scripts/storytime/set-book-pictures.ts` line 170.
- F10 CLOSED: plan.md line 44 gives the no-`readAt` test, and line 48 gives the rule.
- F11 [Blocker] plan.md Task 1.G1 exact output strings (line 41), Task 1.G2 (line 48), and the path rule (line 34): the levels 5-9 intro says the passages stay in `<the given out-json path>`, but the path rule resolves every given path, `DedupOptions.outJson` is `string`, and the plan never says whether that field holds the typed string or the resolved path; with the resolved path, the 1.G3 run prints `/home/<user>/Desktop/Workbooks/docs/content-plans/data/duplicates-levels-5-9.json` into the committed `duplicates-levels-5-9.md`, and the exact-string test cannot tell, because it passes an absolute temporary path. Rationale: the implementer must choose between the typed string and the resolved path, and the wrong choice writes a machine path into a public document.
- F12 [Nit] plan.md line 36: the default-parse bullet says the call "returns [...] the default printed file", while the interface holds `printedIds: ReadonlySet<string>` and line 35 says the parse fills the ids. Rationale: the test author must read one sentence through the other.
- F13 [Nit] plan.md line 45 and line 48: G1 groups a missing `--printed` file with the cases that "print the usage text and exit 2", and G2 says that case "prints an error message that names the file"; the failure type `{ ok: false; usage: string }` has no field for the message. Rationale: the text that reaches stderr is open, and the test can assert either form.
- F14 [Nit] spec.md line 57: "Each level total includes the 550 new packages" and "keep = target - printed: level 5 keeps 50 of 92" keep 50 old articles on top of the 50 new level 5 packages, and no sentence states the resulting level total. Rationale: the provisional label keeps the decision closed, but a reader can take either 50 or 100 as the level total.
- F15 [Nit] plan.md line 49: the Done-when pins level 5 at 92 online and levels 6 to 9 at 88, 4, 38, and 49, and these numbers come from the 2026-10-08 copy, while 1.G3 reads the live legacy database at run time. Rationale: a drift in the database fails the gate without a code fault; name the expectations as the 2026-10-08 values and let the run record the current ones.
