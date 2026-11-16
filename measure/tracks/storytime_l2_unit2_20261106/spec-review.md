# Spec Review: storytime_l2_unit2_20261106

Author model: claude-code/claude-opus-5-5[1m]

## Round 1

Date: 2026-11-06
Reviewer: measure-spec-review, model volcengine-agent-plan/glm-5.3-flash
Audited commit: f1c041ece422273a3ebe3d754d011fec48d2a388
Verdict: fail (1 Blocker, 1 Nit)
Evidence: `measure/runs/storytime_l2_unit2_20261106/spec-review-f1c041ec.json` and `.log`

### What this track proposes

This track builds Level 2 Unit 2 of Storytime Advantage (weeks 9 to 16): eight week packages staged in content/storytime/drafts/l2/ and checked by a stage-root gate, the Forge picture list and brief through the PM session, and Daniel's owner gates for the English text, the pictures, the Thai, and the print proof. A Phase 4 code change makes the unit 1 print makers read the unit from meta.unit, adds the letters d, e, h, f, and g to the tracing guides, fixes two checks of tech debt 2026-11-05, and moves the staged files into content/storytime/l2/ after the unit 1 print order of 2026-11-25. Phase 5 builds the print files with the existing makers; Phase 6 hands off the songs, the book audio, the app packages, and the QR check. Print-ready target 2026-12-08; no file under content/storytime/l2/ or dashboard/ changes before the unit 1 print order.

### How the current system works, per this spec

The system ships Level 2 Unit 1 as eight week files in content/storytime/l2/, validated by StorytimeWeekSchema and check-weeks.ts. The print makers in dashboard/scripts/storytime read every week file of the level folder and pin unit 1 values: the student book title and file name, the map sticker, the benchmark label, the card kit title, and step-map-u1.json. Three unit 1 tests pin the counts (8 weeks, a 227-row picture list, and the committed list equal to the maker output), so a new week file in that folder breaks them. Paid Forge renders and Lyria songs need Daniel's go, only Daniel checks Thai, and the phoneme fields come from his 45-sound bank.

### Findings

- F1 [Blocker] spec.md FR-6.2, plan.md Phases 2 and 4: the unit 2 card picture entries have no authoring task, owner, or default. The card picture file is hand-authored content (one word, week, and Forge prompt per card; readLevelCardPictures, dashboard/lib/storytime/files.ts line 118; the CP-8 test, dashboard/__tests__/storytime-print-card-pictures.test.ts line 227, counts 196 book rows plus 31 card rows), the card kit prints an empty labelled box for an undelivered card row and does not fail (dashboard/lib/storytime/print/card-kit.ts line 474), and FR-4.3 keeps the unit 2 card rows out of the Phase 2 picture list and the Forge brief. No task authors the unit 2 entries, adds them to the Forge brief and the paid renders, or checks their delivery. Rationale: a design choice (which unit 2 words get card pictures, and the prompt text) is left to the implementer; the Phase 5 card kit then prints cards without pictures, a silent quality drop against unit 1 that no gate catches.
- F2 [Nit] plan.md STAGE_CHECKS, spec.md FR-2.7: the per-week gate condition 'no print-missing warning' is not machine-checked. STAGE_CHECKS tests only the check-weeks exit code and the count of FAIL lines, so the warning condition relies on the executor reading the report. Rationale: a checker that runs only the gate command can accept a week that shows the warning.

### Author Response

- F1: FIX
- F2: FIX

Where the fixes are (author record, 2026-11-06):

- F1, spec: new terms "Picture-type card" and "Card picture entry"; FR-4.3 (the unit 2 card entries by the unit 1 rule, with default D13); FR-4.4 (the card rows in the Forge brief); FR-4.5 (one paid go for the book rows and the card rows); FR-4.6 (the delivery check of the card rows before the Phase 5 card kit); FR-6.4 (the unit 2 card match covers every row of the level); FR-6.8 (the move of the card entries to `l2/print/u2/card-pictures.json`); FR-7.3 (the card kit gate: 0 `none` lines, or a named reason with Daniel's words); question 6 (the reuse of a unit 1 picture, default yes).
- F1, plan: the new command `CARD_MATCH_U2`; `PICTURE_LIST_U2` and `PICTURE_CHECK_U2` merge the 31 unit 1 entries and the staged unit 2 entries into a real file of the stage root. Task 2.1 authors `content/storytime/drafts/l2/print/card-pictures-u2.json`. Tasks 2.2 and 2.3 put the card rows in the list and the Forge brief. Task 2.5 puts them in Daniel's paid render go. Task 2.6 runs the match again after the English approval. Task 2.7 checks their delivery with `PICTURE_CHECK_U2`. Task 2.8 adds them to Daniel's look. Tasks 4.1 and 4.3 test and move the entries. Task 5.2 is the card kit gate.
- F2, spec: FR-2.7 now says that `STAGE_CHECKS` fails on a `print-missing` warning of a teaching week (st2/9 to st2/15), by an `awk` step in the command. FR-3.3 states why the review week st2/16 may carry the warning: a review week has no print block, as st2/8.
- F2, plan: `STAGE_CHECKS` has the `awk` step. The done-when lines of Tasks 1.2 to 1.9 use the command; Task 1.9 names the st2/16 exception.
- Measured on 2026-11-06 with a test copy of `w07.json` as week 9 (plan, "Round 1 fixes"): `STAGE_CHECKS` exits 1 on a week 9 copy without a print block, and 0 with the block. `CARD_MATCH_U2` exits 1 with a `none` line, and 0 after the entry exists. The repository stayed clean after each run.

## Round 2

Date: 2026-11-06
Reviewer: measure-spec-review, model unknown (the round 2 result does not name it; round 1 used volcengine-agent-plan/glm-5.3-flash)
Audited commit: 37897969dc7035198840b31194a26ac29c483e6a
Verdict: pass (no Blocker, 2 Nit)
Evidence: `measure/runs/storytime_l2_unit2_20261106/spec-review-37897969.json` and `.log`

F1 and F2 are closed in the committed text (the reviewer's checks 1 and 2).

### What this track proposes

This track builds Level 2 Unit 2 of Storytime Advantage (weeks 9 to 16): eight week packages staged in content/storytime/drafts/l2/ under a stage-root gate, a picture list and Forge brief for the book rows and the unit 2 card rows through the PM session, and Daniel's owner gates for the English text, the pictures, the Thai, and the print proof. The card picture rule follows unit 1 (D13): a card word first reuses a picture of the same word from the level's rows, the 8 color words and the number words print as patch and dots, and each word with no match gets one authored entry with a Forge prompt, gated by CARD_MATCH_U2 with 0 none lines. A Phase 4 code change makes the print makers read the unit from meta.unit, adds the letters d, e, h, f, and g to the tracing guides, fixes two checks of tech debt 2026-11-05, and moves the staged files and the card entries into content/storytime/l2/ after the unit 1 print order of 2026-11-25. Phase 5 builds the print files with the existing makers, and the card kit gate needs 0 none lines or a named reason with Daniel's words. Phase 6 hands off the songs, the book audio, the app packages, the QR check, and the facts-changed list; print-ready target 2026-12-08.

### How the current system works, per this spec

The system ships Level 2 Unit 1 as eight week files in content/storytime/l2/, validated by StorytimeWeekSchema and check-weeks.ts, which shows one print-missing warning for the review week st2/8. The print makers read every week file of the level folder and pin unit 1 values (the student book title and file name, the map sticker, the benchmark label, the card kit title, step-map-u1.json, and the picture list at l2/print/), and three unit 1 tests pin the counts, so a new week file in that folder breaks them. The card kit takes card pictures from l2/print/card-pictures.json (31 unit 1 entries); an undelivered card row prints an empty labelled box and does not fail, and the color and number cards print a patch and dots by Daniel's decision of 2026-11-06. Paid Forge renders and Lyria songs need Daniel's go, only Daniel checks the Thai, and the phoneme fields come from his 45-sound bank.

### Findings

- F3 [Nit] metadata.json: the counts are stale after the revision. estimated_tasks is 45 while plan.md holds 47 task lines (grep count), and deviation_notes says 'the spec lists 5 questions with defaults' while spec.md now lists 6. Rationale: bookkeeping that does not change what the implementer builds; Task 6.7 already sets actual_tasks and the deviation notes at closeout.
- F4 [Nit] plan.md Gate commands STAGE_CHECKS: a mktemp -d failure leaves T unset, and the semicolon after the setup loop still runs the check-weeks call with WORKBOOKS_ROOT empty, so it checks the real repository (8 packages, weeks 1 to 8) and the gate can pass without reading any staged week. Rationale: probe at HEAD showed the empty-WORKBOOKS_ROOT run exits 0; the false pass needs a mktemp failure, and the structure predates this revision, so it stays a Nit.

### Author Response

- F3: FIX
- F4: FIX

Where the fixes are (author record, 2026-11-06):

- F3: `metadata.json` now says 47 estimated tasks, the defaults D1 to D13, and 6 questions, and it records the two review rounds.
- F4: the `STAGE_CHECKS` line of `plan.md` exits 1 when `cd dashboard`, `mktemp -d`, the linked copy, or the copy of a staged week fails. An empty `WORKBOOKS_ROOT` reads the real repository (`dashboard/lib/filesystem.ts` line 41), so the gate now stops before check-weeks runs.
- F4 test (`measure/runs/storytime_l2_unit2_20261106/f4-stage-checks-test.txt`): with a fake `mktemp` that exits 1, the old line exited 0 on the real repository, and the new line exited 1. With a fake `cp` that exits 1, the new line exited 1. A normal run of the new line exited 0.


## Amendment review: hyphen word keys and the lint gate (2026-11-16)

Author model: opencode-go/deepseek-v4.1-flash
Reviewer model: opencode-go/mimo-v2.6-flash
Verdict: FAIL (3 Blockers, 2 Majors, 3 Nits; confidence high; retry escalate_human; audited head 0dcb45d4).

### Findings
- F1 [Blocker] plan.md Task 1.13b done-when: shipped tests pin the old hyphen rule, so PROJECT_TESTS cannot exit 0 after D-U2-K2, and no task line allows the needed test edit. Rationale: dashboard/__tests__/storytime-package-clips.test.ts line 1201 requires bookWordKey('teddy-bear') to throw 'not a word key', line 1237 requires wordClipPath(2,1,'teddy-bear') to throw, Task 1.13a allows only the new test file, and Task 1.13b allows no test edit.
- F2 [Blocker] spec.md Amendment D-U2-K2 and plan.md Task 1.13b scope: the key pattern also lives in dashboard/lib/storytime/schema.ts lines 116, 130, 174, and 773, outside the two allowed files. Rationale: schema.ts repeats the key regex on every wordClips and trickyWordClips record key, so a week file with a 't-shirt' clip key stays invalid when the clip maps come in Phase 6, while D-U2-K2 claims the rule for every week; no task or decision places the schema change.
- F3 [Blocker] spec.md Amendment tasks 1.13a to 1.13c: the tasks write dashboard/ files before the unit 1 print order of 2026-11-25, and the amendment records no exception. Rationale: FR-1.1, FR-9, the Overview, the plan stage rule, and the Phase 1 blast-radius line forbid it, and the Phase 1 acceptance proved the rule held (38 Phase 1 files, none under dashboard/), so the implementer meets two opposed standing rules and must choose.
- F4 [Major] spec.md Amendment D-U2-K3: the claim 'never throws on the data of one week' covers throw sites that the rule and the named Red cases do not describe. Rationale: word-clips.ts lines 421 and 428 throw 'opening: no word form in line <i>', reached from checkPracticeClips at check-weeks.ts lines 447 to 449, with no pinned row, status, or test case.
- F5 [Major] spec.md Amendment D-U2-K3: the row count for a week with two or more key errors is open. Rationale: practiceWordKeys aborts at the first bad word (word-clips.ts lines 441 to 445), so a catch at check-weeks.ts line 213 reports one word while per-word validation reports each, and neither the spec nor a named test picks one design; the PIN of the practiceWordKeys shape (storytime-package-practice-clips.test.ts line 22) constrains but does not choose.
- F6 [Nit] spec.md Amendment D-U2-K2 heard forms: two of the three forms cannot occur as heard text. Rationale: heardText removes space and hyphen (word-clips.ts lines 33 and 217 to 219), so only 'tshirt' matches in the pipeline; pin whether Red calls heardPasses with raw strings or goes through heardText.
- F7 [Nit] plan.md Task 1.13a: the temporary copy for the check-weeks case and the unit 1 baseline are unpinned. Rationale: the case should build its stage root as STAGE_CHECKS does (WORKBOOKS_ROOT over a symlink farm of content plus the staged week), and 'unit 1 rows of st2/1 to st2/8 unchanged' needs a named reference such as a capture at 0dcb45d4.
- F8 [Nit] spec.md Amendment D-U2-K3: the exact FAIL row text is open. Rationale: 'with the week and the word' pins content but not format, Red coins the string that Green must match, and the report already prints a week line; name whether the week sits in the detail or in that line.
