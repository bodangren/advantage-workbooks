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
Date: 2026-11-16
Audited commit: 0dcb45d489aacbbce0bf8524ef78a6b0bec42fb5
Verdict: fail (3 Blockers, 3 Majors, 5 Nits; confidence high; retry escalate_human)
Evidence: `measure/runs/storytime_l2_unit2_20261106/spec-review-0dcb45d4.json` and `.log`

This completed section replaces the provisional section of the interrupted first dispatch. Its eight findings are kept below with new ids from F5, and three findings are added.

PM decisions recorded (2026-11-16):

- D-U2-K2 accepted: the key and the clip file keep "t-shirt"; the TTS text is "T-shirt"; the heard check accepts "t shirt", "tshirt", and "t-shirt"; check-weeks prints a FAIL row and never crashes.
- The four build session defaults accepted: the lint flag at the end of PROJECT_LINT; the st2/12 song-frame FAIL may stand in Task 1.13b; RED_TEST_COMMAND_U2K plain in the gate block; Task 1.13c sha8 = the head after Task 1.13b.

### Findings

- F5 [Blocker] plan.md Tasks 1.13a and 1.13b, spec.md D-U2-K2: D-U2-K2 flips two pins of dashboard/__tests__/storytime-package-clips.test.ts (lines 1205 to 1211: bookWordKey('teddy-bear') must throw 'not a word key'; line 1237: wordClipPath must throw on a hyphen key), but Task 1.13a allows only the new test file and Task 1.13b allows no test edit and names only word-clips.ts and check-weeks.ts, so PROJECT_TESTS in the 1.13b done-when cannot exit 0. Rationale: the phase gate that no allowed task can satisfy; the plan must name the test file to edit and the role that edits it.
- F6 [Blocker] spec.md D-U2-K2 and plan.md Task 1.13b scope: the same key rule lives in four schema records (dashboard/lib/storytime/schema.ts lines 116, 130, 174, and 773), outside the two allowed files. Rationale: every wordClips and trickyWordClips record key must keep the hyphen when Phase 6 writes the clip maps the amendment promises, or readLevelWeeks (files.ts lines 67 to 81) drops the whole week's rows; the pin at clips.test.ts line 1345 blocks the schema fix too, and no task or decision places that change.
- F7 [Blocker] spec.md Amendment tasks 1.13a to 1.13c and plan.md stage rule: the tasks write files under dashboard/ before the unit 1 print order of 2026-11-25, and the amendment records no exception. Rationale: FR-1.1, FR-9, the plan stage rule, and the Phase 1 blast-radius line ('no code') forbid it until then, the Phase 1 acceptance proved the rule held, so the implementer meets two opposed standing rules and must choose.
- F8 [Major] spec.md D-U2-K3: the claim 'never throws on the data of one week' covers throw sites that the mechanism and the named Red cases do not describe. Rationale: an opening line with no letter-run word form still throws 'opening: no word form in line <i>' (word-clips.ts lines 421 and 428, reached through practiceWordKeys at line 448), with no pinned row, status, or test case; checks.ts holds no throw, so this is the one remaining throw on week data in the check path.
- F9 [Major] spec.md D-U2-K3: the row count for a week with two or more key errors is open. Rationale: practiceWordKeys aborts at the first bad word (word-clips.ts lines 441 to 445), so a catch at check-weeks.ts line 213 reports one word while per-word validation reports each; the decision says 'one FAIL row ... with the week and the word' in the singular, and neither a decision nor a named test picks one design.
- F10 [Major] plan.md Task 1.13a (the check-weeks temporary-copy case): the case names no field for the bad word, no word that stays invalid after D-U2-K2, no assertion that ties the FAIL row to that word, and no form for the temporary stage root. Rationale: a family word lands in the practice-clips row (check-weeks.ts line 213), a book sentence word in the word-clips row (line 92), and an opening-game word still throws after Green (F8); the staged w10 T-shirt stops being invalid after Green, and a loose exit-1 assertion passes on the st2/12 song-frame row, so the case can pass without testing D-U2-K3 or never pass, and Red and Green must choose the field, the word, and the assertions with no record.
- F11 [Nit] plan.md Task 1.13a: the reference for 'the unit 1 rows of st2/1 to st2/8 are unchanged' is unnamed. Rationale: the case needs a fixed baseline, for example a capture at 0dcb45d4, so Red and Review A compare one artifact.
- F12 [Nit] spec.md D-U2-K2 heard forms: two of the three accepted forms cannot occur as heard text. Rationale: heardText removes spaces and hyphens (word-clips.ts lines 33 and 217 to 219), so only 'tshirt' matches in the bank pipeline; pin whether Red calls heardPasses with raw strings or through heardText.
- F13 [Nit] spec.md D-U2-K2: the exact WORD_KEY pattern stays open for a run of two hyphens (t--shirt) and for a hyphen next to an apostrophe group (t-shirt's). Rationale: 'one or more inner hyphens between letter runs' reads both ways, no Red case covers either edge, and Green's regex then decides them without a test.
- F14 [Nit] spec.md D-U2-K3: the FAIL row detail text is not named; the decision says only 'with the week and the word'. Rationale: report.ts prints the detail on the same line as the FAIL marker, so one exact detail form (for example 'not a word key: <word>') keeps Red's assertion, Green's string, and Review A's check on one text.
- F15 [Nit] spec.md D-U2-L1: 'Plan line 31 holds this command' points at PROJECT_TESTS; PROJECT_LINT sits at plan line 32 after RED_TEST_COMMAND_U2K took line 30. Rationale: the cross-reference is off by one; the command itself matches the accepted default.


## Amendment review round 2 (2026-11-16)
Author model: opencode-go/deepseek-v4.1-flash
Reviewer model: opencode-go/muse-spark-1.3-contributor#high
Audited commit: a558b0c1260f0a1d08192201485d014954dca56f
Verdict: pass (no open Blocker, no open Major; confidence high; retry none)
Evidence: measure/runs/storytime_l2_unit2_20261106/spec-review-a558b0c1.json and log

### What this track proposes

This amendment answers the Phase 1 acceptance failures with hyphen word keys and a stable lint gate.
It widens the key rule to inner hyphens, turns key errors into FAIL rows with exit 1, keeps unit 1 output unchanged, and fixes the lint glob.
It adds Red, Green, and Review A tasks with named files, cases, and gates.

### How the current system works, per this spec

Per the spec, bookWordKey rejects inner hyphens and throws from check-weeks before any report prints.
The same key pattern repeats in four schema records, and existing tests pin the throw and the reject.
The lint glob matches no file before Phase 4, and the stage rule bars dashboard writes before the unit 1 print order.

### Findings

- None (all round-1 findings F5 to F15 are closed in this round)

### Closed findings

- F5 closed: Task 1.13a names the pin edits and Task 1.13b changes no test file.
- F6 closed: Task 1.13b names schema.ts and one exported WORD_KEY_PATTERN for the 4 record keys.
- F7 closed: D-U2-K7 exception is in the Overview, FR-1.1, FR-9, the plan stage rule, and the blast line.

## Round r2 of PA-P3-1 (2026-11-17)

Author model: claude-code/claude-opus-5[1m]
Reviewer model: opencode-go/muse-spark-1.3-contributor#high
Reviewed head: cee9f6c5. Verdict: PASS (0 Blockers, 5 Majors, 1 Nit). Role gate: exit 0.

### What this track proposes
PA-P3-1 answers 20 R14 sound-stage FAIL rows in the 8 staged weeks with content edits only: each draft gets stage-2 paStage with first and last positions, and week 9 teaches the final-sound tag. Each unit that asks two positions gets rewritten English that asks one position, while each week still covers both positions across its units; each day-1 line becomes a distinct first-sound review of earlier weeks with bank-clipped words. A Claude author writes the per-unit before/after change list with Thai, Daniel approves it in the Task 3.3 batch with no separate review round, and a non-Claude Green copies the approved text word for word. Red r2 aligns the sound-stage test with these rules and drops the tautology case. Phase 4 app tasks start without the print order while print tasks wait, under one Red window.

### How the current system works, per this spec
check-weeks runs three R14 rows from sound-stages.ts: mix fails any unit that asks two positions, day-1 fails a day-1 line with a new or untaught sound or an out-of-stage position, and plan fails a missing paStage, an out-of-stage position or tag, or a missing stage-start tag. Units come from paSkill, each opening.pa line, each script step with variants and sound loops, check and benchmark items by their position fields, and the home card; the schema pins opening.pa to five entries. At HEAD the drafts carry paStage and the week-9 tag, and 14 R14 rows still fail, plus the accepted st2/12 song-frame row.

### Findings
- F16 [Major] spec.md D-U2-S7: the pre-answer freeze names only English or Thai strings, so item position edits, tag edits, and opening.audio list edits could land before Daniel answers. Rationale: S7 lists English before/after plus Thai after for units, but w11/w15 check.items, w16 benchmark.paper.items, the w11 medial tag, and day-1 audio lists need non-string edits with no freeze and no approval vehicle, which bypasses the owner gate.
- F17 [Major] spec.md D-U2-S3: item-based rows state the outcome but name no field edit, because check.items and benchmark.paper.items positions come from item.position fields, not from English text. Rationale: sound-stages.ts itemPositions (lines 136-140) reads item.position, so the author must choose each page single position and Daniel must approve it, but S3/S7 give no list row form for items, so Green cannot apply them word for word.
- F18 [Major] spec.md D-U2-S2/D-U2-S3: no rule removes the w11 medial-vowel tag from reviewed and no default maps middle-only units, while S2 adds only the week-9 tag. Rationale: the plan branch (sound-stages.ts lines 269-274) fails w11 on the tag and on middle-only step units, and P14-D1 middle-to-first default for w11 is not imported, so the author chooses with no recorded default.
- F19 [Major] spec.md D-U2-S4: new day-1 lines need new opening.audio[0] lists and the clip-gap fallback stays open. Rationale: P14-D8 sets audio[0] to the phoneme files of the new line in order, but S4 names no audio update, and naming the clip gap states no fallback when no bank clip exists, so Green decides lists and gaps with no rule.
- F20 [Major] spec.md D-U2-S8: Phase 4 app tasks start while the U2S Red window stays open, against R1. Rationale: RED_TEST_COMMAND_U2S fails at HEAD so the window stays open until Green passes, and Task 4.1 is a Red task, so starting it now opens a second Red window while S8 claims R1 stays.
- F21 [Nit] spec.md D-U2-S3: the unit list adds the home card and drops the sound loop from the step-unit words, against P14-D1 and the module. Rationale: P14-D1 one-activity sentence names an opening line, a step with variants, a check page, or a benchmark paper with no home card, while soundUnits joins variants and sound loop lines (sound-stages.ts lines 159-169), so the prose differs from the cited authority.

Answers to the six review questions:
1. Paraphrase: see the two sections above.
2. Clearability: all 14 open R14 rows are clearable with content edits and no code or rule change; no row is impossible. Text units clear by English rewrites to one position; w11/w15 check.items and w16 benchmark items clear by item.position edits; w11 plan clears by removing the medial tag from reviewed plus rewrites of middle-asking units; day-1 rows clear by new first-sound lines with bank-clipped words. Caveats are F17-F19.
3. Zero-decision: Red r2 has no design choice (S5 pins rows, counts, 8 distinct day-1 strings, mutations, case f removal). Green part 2 has no choice if the approved list is complete (word for word, bytes). Open choices sit with the 3.5b author plus Daniel: position per unit (default P14-D3/D4/D6/D7 forms; w11 middle defaults to first per P14-D1); day-1 word pairs newest-earlier-first with bank clips (default P14-D4); item page positions (no default recorded, see F17); w11 medial tag removal (default: remove from reviewed); audio[0] lists (default P14-D8 order); clip-gap fallback (default: pick another clippable word, no new audio without Daniel go); R1 sequencing (default: hold Task 4.1 Red until U2S Green closes).
4. Task 3.6 done-when matches the PM order: STAGE_CHECKS with no FAIL row except st2/12 song-frame; the role states each gate exit code; RED_TEST_COMMAND_U2S sits at plan line 31 and must fail after Red before Green.
5. No open path lets week-file English change before Daniel answers: S7 freezes strings, 3.5b changes no week file, Part 2 starts after his answer, and the b14d15ee day-1 copies stand reverted by f32de984. Gap: the freeze names strings only (see F16).
6. Zoom-out: no conflict with D-U2-K* or D15 (S1 keeps the song-frame exception; w12 holds no mix row). P14-D1 one-activity sentence omits the home card that S3 and the module include (see F21). Thai rule holds: Claude writes new Thai, Daniel alone checks it, non-Claude roles copy bytes and print counts, and S7 runs no separate review round.
