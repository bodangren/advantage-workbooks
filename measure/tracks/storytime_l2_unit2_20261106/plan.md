# Plan: storytime_l2_unit2_20261106

Spec: [spec.md](./spec.md). Series plan: [../../storytime-series-plan.md](../../storytime-series-plan.md). Track start: 2026-11-07. Week texts: 2026-11-07 to 2026-11-14. Daniel's English check: 2026-11-18. Print-ready (Daniel approves the print proof): 2026-12-08. All dates are internal.

## Rules for every task

- Unit 1 goes first. When a unit 1 task needs a session slot, the unit 1 task gets it. Unit 1 dates: the Phase 8 close of `storytime_print_r1_20261025`, Daniel's check sitting on 2026-11-16, the release proof on 2026-11-20, Daniel's approval on 2026-11-24, and the print order on 2026-11-25.
- Stage rule (spec FR-1): until the Phase 4 move task, the week files of unit 2 live in `content/storytime/drafts/l2/`. No task writes a file under `content/storytime/l2/` or `dashboard/` before the unit 1 print order.
- Tests first (Phase 4). The Red task writes failing tests and commits them. The Green task makes them pass. A review role does not fix code; it reports.
- New tests load the shipped week files `content/storytime/l2/w01.json` to `w08.json` and the unit 2 week files. Each new check has a mutation test on a copy in a temporary folder. Keep a copy of a source file before an in-place mutation, and compare it after a stopped run (lessons-learned, 2026-10-22).
- A task becomes `[x]` only with its commit SHA and its evidence class: owner-approved, person-checked, automated, or peer-report. Write each SHA as `commit <sha>`.
- A task that waits for Daniel stays `[ ]`, so that its phase stays open. Use `[b] … — deferred:daniel` only for a task that Daniel takes out of the unit. The checker does not count a `[b]` line in any gate or at closeout.
- Use the word "deferred" only in that trailer. In other text, write "later" or "waits for" (the checker drops any task line that contains the word).
- Heavy jobs (vitest runs, tsc, Chrome, PDF renders, Ghostscript, PDF/X builds, contact sheets, and the picture check of a batch) run with ONE command: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'` (PM rule, advantage-pr 0e091de, 2026-10-25). It takes the lock and runs the pre-flight inside the lock. Exit 75 means that the pre-flight hold lasted longer than its wait. Never nest a heavy-run, and never use a plain `flock` on the lock inside a heavy job, because a nested plain flock deadlocks. Report a "heavy-run: lock wait over 600 s" line to the PM session.
- No pnpm in any form. No `npm install`. No `npm ci`. Run `git checkout -- pnpm-lock.yaml` after a gate if the lock file changed.
- Commit with `git commit -- <paths>` only. No amend, reset, revert, stash, or push. Never stage `video/**`, `dashboard/raw.json`, the `measure/runs/` files of other tracks, or `measure/tracks/storytime_print_r1_20261025/plan.md` (another session edits it).
- Do not change `content/storytime/l2/w01.json` to `w08.json`. Do not change the Phase 8 files of the print track (`dashboard/lib/storytime/print/card-kit.ts`, `pictures.ts`, and the card kit tests) until the print track closes.
- The repository is public. No test item, test paper, answer key, or test audio goes into this track.
- Thai: Claude drafts the Thai, and only Daniel checks it. No Thai goes to another person or to a model for a check. A review role gets the English review extract only.
- No paid generation without Daniel's go: Forge renders and Lyria songs. For mmx speech, the PM confirms the cost class before the run.
- Before a task changes a file outside `measure/`, mark the task `[~]` in this plan (`measure/workflow.md`).
- This repo has no `measure/generate.sh` or `measure/doctor.sh`. The doctor step of Phases 1 to 3 is `STAGE_CHECKS`, and of Phases 4 to 6 it is `PROJECT_CHECKS`.
- Rule R1: at most one open Red window across this track and the unit 1 tracks. A Red window starts when a failing test file first exists in the work tree, and it ends at the Green commit that passes `PROJECT_TESTS`. The Phase 4 Red starts only after the print order task of `storytime_print_r1_20261025` is complete and the orchestrator gives the go.

## Gate commands (orchestrator environment)

```bash
RED_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-unit2-*.test.ts'    # Phase 4: must fail after Red, before Green
GREEN_TEST_COMMAND='cd dashboard && CI=true npx vitest run __tests__/storytime-unit2-*.test.ts'  # Phase 4: must pass after Green
PROJECT_TESTS='cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
PROJECT_LINT='cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-unit2-*.test.ts'
PROJECT_CHECKS='cd dashboard && npx tsx scripts/storytime/check-weeks.ts --level 2 && npx tsc --noEmit'  # Phases 4 to 6; the form of the print track since its review round 8 (F52, e6dd383d): check-weeks exits 1 on any FAIL, so a FAIL or a crash fails the gate; the whole command runs inside one heavy-run wrapper; no nested heavy-run
STAGE_CHECKS='cd dashboard && T=$(mktemp -d) && mkdir -p "$T/content" && cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/" && for f in ../content/storytime/drafts/l2/w*.json; do [ -e "$f" ] && cp --remove-destination "$f" "$T/content/storytime/l2/"; done; out=$(WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json" npx tsx scripts/storytime/check-weeks.ts --level 2 2>&1); rc=$?; rm -rf "$T"; printf "%s\n" "$out"; test $rc -eq 0 && test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -eq 0'  # Phases 1 to 3: the week gate of the PM brief on a stage root; no heavy-run (no vitest, tsc, Chrome, PDF, or Ghostscript)
UX_REQUIRED=never   # print files: the visual checks are the contact-sheet tasks and Daniel's checks
PRINT_GATE='cd dashboard && npx tsx scripts/print/make-pdfx.ts <print file> --check'   # exit 0 for each print file
```

`PICTURE_LIST_U2` (Phase 2) writes the unit 2 picture list from the staged files. Run it from the repository root. It removes the two output links in the stage root first, so that the maker writes real files there and never writes through a link into `content/storytime/l2/print/`:

```bash
cd dashboard && T=$(mktemp -d) && mkdir -p "$T/content" && cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/" \
  && rm -f "$T/content/storytime/l2/print/pictures.json" "$T/content/storytime/l2/print/pictures.md" \
  && cp ../content/storytime/drafts/l2/w*.json "$T/content/storytime/l2/" \
  && WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json" npx tsx scripts/storytime/print-pictures.ts --level 2 \
  && mkdir -p ../content/storytime/drafts/l2/print \
  && python3 -I - "$T/content/storytime/l2/print/pictures.json" "$T/content/storytime/l2/print/pictures.md" ../content/storytime/drafts/l2/print/pictures-u2.json ../content/storytime/drafts/l2/print/pictures-u2.md <<'PY'
import json, re, sys
src_json, src_md, out_json, out_md = sys.argv[1:5]
rows = [r for r in json.load(open(src_json)) if r["week"] >= 9]
open(out_json, "w").write(json.dumps(rows, indent=2, ensure_ascii=False) + "\n")
parts = re.split(r"(?m)^(?=## Week )", open(src_md).read())
keep = [p for p in parts[1:] if int(re.match(r"## Week (\d+)", p).group(1)) >= 9]
head = "# Storytime Advantage — print picture list (Level 2, Unit 2)\n\nThe rows of weeks 9 to 16, cut from the stage output of `print-pictures.ts --level 2`. `pictures-u2.json` is the machine list; this page is the readable copy.\n\n"
open(out_md, "w").write(head + "".join(keep))
print(len(rows), "rows;", ", ".join(f"week {w}: {sum(1 for r in rows if r['week'] == w)}" for w in sorted({r['week'] for r in rows})))
PY
rc=$?; rm -rf "$T"; test $rc -eq 0
```

`PICTURE_CHECK_U2 <Forge folder>` (Phase 2) is the stage 1 check of a Forge delivery. It writes no file. Run it inside one heavy-run wrapper:

```bash
cd dashboard && T=$(mktemp -d) && mkdir -p "$T/content" && cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/" \
  && cp ../content/storytime/drafts/l2/w*.json "$T/content/storytime/l2/" \
  && WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json" npx tsx scripts/storytime/check-storytime-pictures.ts --batch "<Forge folder>" --level 2 --weeks 9,10,11,12,13,14,15,16; rc=$?; rm -rf "$T"; test $rc -eq 0
```

Baseline at 504fb6a2 (2026-11-06, measured by the planning session): `check-weeks.ts --level 2` exits 0 with 8 packages, 0 failed checks, and 1 warning (st2/8 `print-missing`). `STAGE_CHECKS` with no staged file gives the same report after the path prefix is removed, in 1.5 seconds. The first part of `PICTURE_LIST_U2` (the maker on a stage root) writes a list that `cmp` finds equal to the committed 227-row list, and `git status --porcelain content/storytime` stays empty. The whole block ran with a test copy of `w07.json` as week 9 in a temporary drafts folder and a temporary output folder: it wrote 28 rows of week 9, and the repository stayed clean. The planning session ran no vitest, tsc, or PDF build, so it gives no new `PROJECT_TESTS` number.

Graph note: `graph.db` is from 2026-08-08 (stale), so the blast-radius lines come from `grep`, not from `build-graph`.

## Phases and dates

| Phase | Dates | End gate |
|---|---|---|
| 1 Week texts | 2026-11-07 to 2026-11-18 | Daniel approves the English of weeks 9 to 16 |
| 2 Picture list for Forge | 2026-11-14 to 2026-11-23 | Daniel's look at the delivered pictures |
| 3 Thai parts for Daniel's check | 2026-11-19 to 2026-11-28 | Daniel approves the Thai |
| 4 Unit scope and the move | 2026-11-26 to 2026-11-30 | The week files are in `content/storytime/l2/`; `PROJECT_CHECKS` and `PROJECT_TESTS` pass; the unit 1 outputs stay the same |
| 5 Print build | 2026-12-01 to 2026-12-08 | Daniel approves the unit 2 print proof |
| 6 Hand-offs | 2026-12-01 to 2026-12-09 | The app packages, the QR check, project memory, and the facts-changed list |

Risk: Daniel's checks are the main limit of the speed (series plan, section 6). Unit 1 has 5 owner dates to 2026-11-24. If his English check of unit 2 comes after 2026-11-18, every later date of this track moves by the same number of days.

Risk: Phase 4 changes the makers that built the approved unit 1 files. The unit 1 output snapshot (spec FR-6.6) guards them, and Phase 4 starts only after the unit 1 print order.

## Phase 1: Week texts (2026-11-07 to 2026-11-18)

_Blast radius: no code. New files under `content/storytime/drafts/l2/` only; `readLevelWeeks` does not read that folder (spec FR-1)._

- [ ] Task: record the stage baseline (2026-11-07). Run `STAGE_CHECKS` with no staged file. Done when: its report equals the `check-weeks.ts --level 2` report after the path prefix is removed (8 packages, 0 failed checks, 1 warning), and `git status --porcelain content/storytime` is empty after the run. Evidence: automated.
- [ ] Task: w09 (2026-11-07): element 8 d; sight words are, has, cannot; frame "I like ___. Yum!"; food and drink. Write `content/storytime/drafts/l2/w09.json` (spec FR-2), and set its phoneme fields with `set-phoneme-audio.ts --file`. Done when: `STAGE_CHECKS` passes and shows st2/9 with no FAIL line and no `print-missing` warning; the independent English review findings are fixed or answered in this line; the commit holds only the staged file and its review log under `measure/runs/storytime_l2_unit2_20261106/`. Evidence: automated and peer-report.
- [ ] Task: w10 (2026-11-08): element 9 -an -ad; sight words they, too, were; frame "Put on your ___."; clothes. Done when: as for w09, for st2/10.
- [ ] Task: w11 (2026-11-09): element 10 short e; sight words me, of; frame "Where is ___? In/On/Under."; home. Done when: as for w09, for st2/11.
- [ ] Task: w12 (2026-11-10): element 11 h; sight words goes, it, said, that; frame "Open your book."; school. Done when: as for w09, for st2/12.
- [ ] Task: w13 (2026-11-11): element 12 -ot -op; sight words do, for, like; frame "I can run/hop/jump."; actions. Done when: as for w09, for st2/13.
- [ ] Task: w14 (2026-11-12): element 13 f; sight word you ("this" is a review word, D6); frame "It is hot/cold."; weather. Done when: as for w09, for st2/14.
- [ ] Task: w15 (2026-11-13): element 14 g; sight words his, no, my; frame "Look, a ___!"; transport. Done when: as for w09, for st2/15.
- [ ] Task: w16 (2026-11-14): the review week "Unit 2 Review" in the shape of `w08.json`, with Benchmark 2 in the week 8 shape (spec FR-3, D5). Done when: as for w09, for st2/16; the benchmark letters are the 12 taught letters; days 1 to 4 cover weeks 9 to 15.
- [ ] Task: the unit read of weeks 9 to 16 (2026-11-14). Read the 8 staged files together, after the per-week reviews. Check by hand what a one-week check cannot see (lessons-learned, 2026-10-02): each family word is on a book page or in a song line; no story, title, or twist repeats a week of weeks 1 to 16; each new sight word is new once; the cast looks stay as in unit 1. Done when: `STAGE_CHECKS` passes, and the findings and their fixes are in `measure/runs/storytime_l2_unit2_20261106/unit-read.md`. Evidence: automated and person-checked.
- [ ] Task (Hand-off 1): the English text file for Daniel (2026-11-14). Build `make-manual-pdf.ts --file <the 8 staged files> --lang en --loops --out ~/Desktop/print-ready/storytime/text-review/Storytime-Advantage-L2-U2-weeks-9-16-English-text.pdf` in one heavy-run. Record its SHA-256 here. Send the file, the SHA-256, and the open questions of the spec to the PM session. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task (Owner gate): Daniel's English check of weeks 9 to 16, by 2026-11-18 (D9). Apply the changes that he asks for, with a new text file and his new words. Record his exact words, the date, and the file SHA-256 in `approval.text` of each staged file. Done when: `STAGE_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task (Hand-off 2): the song request (after the English approval, about 2026-11-19). Send the 7 lyric sheets and style briefs to the PM session for Lyria 3 Pro, 3 candidates a song (about 1.68 USD; Daniel's go, D10). Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task: Measure - User Manual Verification 'Phase 1: Week texts' (Protocol in workflow.md). The phase has an owner gate: Daniel's English check.

## Phase 2: Picture list for Forge (2026-11-14 to 2026-11-23)

_Blast radius: no code. New files under `content/storytime/drafts/l2/print/` and in this track folder._

- [ ] Task: the picture list of unit 2 (2026-11-14 to 2026-11-15). Run `PICTURE_LIST_U2`, and commit `content/storytime/drafts/l2/print/pictures-u2.json` and `pictures-u2.md`. Done when: every row is of a week from 9 to 16; no file name is also in `content/storytime/l2/print/pictures.json`; the row count of each week is in the commit message; a second run gives the same two files (`cmp`). Evidence: automated.
- [ ] Task: the Forge brief (2026-11-15). Write `measure/tracks/storytime_l2_unit2_20261106/forge-brief.md` (spec FR-4.4): the scenes, the props, and the cast of each week; the unit 1 cast only (D4); the style rules with the class table of FR-9 version 1; the row count; the cost estimate at the unit 1 rate; and the delivery rule (a Forge folder with `manifest.json`; the copy into `content/storytime/l2/print/pictures/` in Phase 4). Done when: the brief names every row id of `pictures-u2.json`. Evidence: automated (an id count) and peer-report.
- [ ] Task (Hand-off 3): send the picture list and the Forge brief to the PM session for Forge (2026-11-15). Forge can stage its inputs at once; it starts no paid render before the owner gate below. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task (Owner gate): Daniel's go for the paid Forge renders of unit 2, after his English approval (about 2026-11-19; D10). Record his words in this line. Evidence: owner-approved.
- [ ] Task: the list after the English approval (about 2026-11-19). Run `PICTURE_LIST_U2` again on the approved text. If a row changed, commit the new list and send the difference to the PM session. Done when: the committed list equals a new run (`cmp`). Evidence: automated.
- [ ] Task: the delivery check (about 2026-11-21 to 2026-11-22). Run `PICTURE_CHECK_U2` on each Forge delivery folder in one heavy-run. Done when: every requested row passes, and the report is in `measure/runs/storytime_l2_unit2_20261106/`. Evidence: automated.
- [ ] Task (Owner gate): Daniel's look at the unit 2 pictures, by 2026-11-23. Record his exact words and the date in `approval.images` of each staged file. Done when: `STAGE_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task: Measure - User Manual Verification 'Phase 2: Picture list for Forge' (Protocol in workflow.md). The phase has an owner gate: Daniel's look.

## Phase 3: Thai parts for Daniel's check (2026-11-19 to 2026-11-28)

_Blast radius: no code. The Thai fields of the staged files only._

- [ ] Task: the Thai teacher book draft (2026-11-19 to 2026-11-21), after the English approval (spec FR-5.5). Bring every Thai field of the 8 staged files in line with the approved English. Build `make-manual-pdf.ts --file <the 8 staged files> --lang th --loops --out ~/Desktop/print-ready/storytime/text-review/Storytime-Advantage-L2-U2-weeks-9-16-Thai-teacher-book-draft.pdf` in one heavy-run, and make the contact sheets of every page. Done when: `STAGE_CHECKS` passes (the `thai` and `thai-lines` rows pass for st2/9 to st2/16); the writer looked at every page render and found no broken Thai line; the PDF SHA-256 is in this line. Evidence: automated and person-checked.
- [ ] Task (Hand-off 4): send the Thai parts to the PM session for Daniel (2026-11-21): the PDF, its SHA-256, the home card lines of weeks 9 to 16, and the list of new Thai terms. No Thai goes to another person or to a model. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task (Owner gate): Daniel's Thai check of weeks 9 to 16, by 2026-11-28 (D9). Apply his changes. Record his exact words, the date, and the source in `approval.thai` of each staged file. Done when: `STAGE_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task: Measure - User Manual Verification 'Phase 3: Thai parts for Daniel's check' (Protocol in workflow.md). The phase has an owner gate: Daniel's Thai check.

## Phase 4: Unit scope and the move (2026-11-26 to 2026-11-30)

_Blast radius (from `grep`, 2026-11-06): `readLevelWeeks` (`lib/storytime/files.ts`; 13 scripts and 7 test files); `storytimePrintPictures` and `print-pictures.ts`; `make-student-book-pdf.ts` with `student-book.ts` and `student-book-cli.ts`; `make-teacher-book-print.ts`; `make-card-kit-pdf.ts`; `make-step-map.ts` with `step-pages.ts` and `step-map.ts`; `letter-strokes.ts`; `checks.ts`. Start condition: the print order task of `storytime_print_r1_20261025` is complete, and the orchestrator gives the go (rule R1)._

- [ ] Task (Red): `__tests__/storytime-unit2-scope.test.ts` (spec FR-6). The tests cover: the makers take the unit from `meta.unit` (the student book title and file name, the map sticker, the song line, the benchmark label, the card kit title, the unit weeks of the teacher book, `step-map-u2.json`, and the unit 2 picture list at `l2/print/u2/`); with the unit 2 weeks in a temporary `l2/` folder, the unit 1 week reads see weeks 1 to 8 only; the guides of d, e, h, f, and g; a review strip card with an untaught item fails; a check item with two right pictures fails; the unit 1 output snapshot. Done when: `RED_TEST_COMMAND` fails only in the new tests, and the commit holds only files under `__tests__/`. Evidence: automated.
- [ ] Task (Green): implement spec FR-6.2 to FR-6.6. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass in heavy-runs; each new rule has a mutant that a test catches; the unit 1 output snapshot is unchanged. Evidence: automated.
- [ ] Task: the move (about 2026-11-29). Move the 8 staged files into `content/storytime/l2/` with `git mv`. Make the unit 2 picture list and step map with the makers. Copy the delivered pictures into `content/storytime/l2/print/pictures/` and compare each SHA-256 with the Forge manifest. Done when: `PROJECT_CHECKS` passes with 0 FAIL lines (the gate of the PM brief, `check-weeks.ts --level 2`); `PROJECT_TESTS` passes; `git status --porcelain content/storytime/drafts` is empty. Evidence: automated.
- [ ] Task: Measure - User Manual Verification 'Phase 4: Unit scope and the move' (Protocol in workflow.md). The phase has no owner gate of its own.

## Phase 5: Print build (2026-12-01 to 2026-12-08)

_Blast radius: no code. Print outputs only; the makers are the Phase 4 makers._

- [ ] Task: the proof build of unit 2 (2026-12-01 to 2026-12-03), each maker in its own heavy-run: the student book (`make-student-book-pdf.ts --level 2 --weeks 9,10,11,12,13,14,15,16 --proof`), the Thai teacher book (`make-teacher-book-print.ts --level 2 --weeks 9,10,11,12,13,14,15,16 --lang th --loops`), the 14 color A3 readers (`make-readers-pdf.ts --level 2 --weeks 9,10,11,12,13,14,15 --a3-color`), the card kit (`make-card-kit-pdf.ts --level 2 --weeks 9,10,11,12,13,14,15,16`), the teacher book cover (`make-storytime-teacher-cover.ts --level 2 --unit 2`), and the step map. Done when: each print file passes `PRINT_GATE`; each file is newer than the last commit of its sources; the contact sheets of every page exist; `pdffonts` shows the planned fonts; `check-qr.ts` decodes the 8 week addresses `/th/st/2/9` to `/th/st/2/16`. Evidence: automated.
- [ ] Task (Owner gate): Daniel's go for the unit 2 student book cover (spec FR-7.2). The covers of the other 13 books wait for Daniel until after release 1. Record his words in this line. Evidence: owner-approved.
- [ ] Task: the unit 2 student book cover, after the go above. Fill the Level 2 Unit 2 row of `content/storytime/covers/books.json` (picture recipe and panel), and build `make-storytime-book-cover.ts --level 2 --unit 2 --print` in one heavy-run. Done when: the build passes its checks and `PRINT_GATE`. Evidence: automated.
- [ ] Task (Hand-off 5): send the proof files to the PM session for the print-curriculum audit (checklist A1 to J1) and for Daniel (2026-12-04): the proof PDFs, the fold-test PDF, the teacher book PDF, the week data, the step map, and the QR list. Fix each finding and send the fix batch for the re-audit. Done when: the audit gate has 0 blockers and 0 majors. Evidence: peer-report.
- [ ] Task (Owner gate): Daniel approves the unit 2 print proof, by 2026-12-08. Record his exact words and the date in `approval.print` of `w09.json` to `w16.json`. Done when: `PROJECT_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task: the final print files after the approval (by 2026-12-09): build with `--final` where the maker has it, in heavy-runs. Done when: each final file passes `PRINT_GATE`, and the list of files with their SHA-256 is in `measure/runs/storytime_l2_unit2_20261106/print-files.md`. Evidence: automated.
- [ ] Task: Measure - User Manual Verification 'Phase 5: Print build' (Protocol in workflow.md). The phase has an owner gate: Daniel's proof approval.

## Phase 6: Hand-offs (2026-12-01 to 2026-12-09)

_Blast radius: no code. Media and package fields of weeks 9 to 16._

- [ ] Task: the song audio of weeks 9 to 15, after Daniel's picks. Put each chosen take at `l2/media/w<nn>/song.mp3`, and set `song.lines` and `song.times` from a transcript (local faster-whisper, no lyric prompt). Record his words in `approval.song`. Done when: `PROJECT_CHECKS` passes, and `song-sheet` gives no warning, or the warning names the sung difference. Evidence: automated and owner-approved.
- [ ] Task: the book audio of weeks 9 to 15 with `book-audio.ts --level 2 --week <n>`, after the PM confirms the cost class of mmx speech. Run a recognizer on every short clip and make a new take when it hears other words (lessons-learned, 2026-10-24). Record Daniel's listen check in `approval.audio`. Done when: `PROJECT_CHECKS` passes. Evidence: automated and owner-approved.
- [ ] Task: the app pictures of weeks 9 to 15 with `set-book-pictures.ts --level 2 --week <n>`. Done when: `PROJECT_CHECKS` passes, and the `book-pictures` row passes for st2/9 to st2/15. Evidence: automated.
- [ ] Task (Hand-off 6): send the app packages of weeks 9 to 16 to the PM session for Monorepo, with a SHA-256 list (the pattern of `storytime_week_package_20261022` Phase 9). Done when: the PM session confirms receipt and the Monorepo check. Evidence: peer-report.
- [ ] Task (Check, person): after the Monorepo load, a person scans the QR codes on one printed page of each week from 9 to 16 with a phone. Record the address that opens and the result. Done when: every address answers on the live host. Evidence: person-checked.
- [ ] Task: project memory. Update `measure/tech-debt.md` and `measure/lessons-learned.md` (50 lines or less each). Done when: both files are at or below 50 lines and name the findings of this track. Evidence: automated.
- [ ] Task (Hand-off 7): the report and the facts-changed list in `measure/runs/storytime_l2_unit2_20261106/report.md`, to the PM session. Set `actual_tasks` and the deviation notes in `metadata.json`. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task: Measure - User Manual Verification 'Phase 6: Hand-offs' (Protocol in workflow.md). The phase has no owner gate of its own.
