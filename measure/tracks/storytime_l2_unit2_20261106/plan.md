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
STAGE_CHECKS='cd dashboard || exit 1; T=$(mktemp -d) && test -d "$T" || exit 1; mkdir -p "$T/content" && cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/" || { rm -rf "$T"; exit 1; }; for f in ../content/storytime/drafts/l2/w*.json; do [ -e "$f" ] || continue; cp --remove-destination "$f" "$T/content/storytime/l2/" || { rm -rf "$T"; exit 1; }; done; out=$(WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json" npx tsx scripts/storytime/check-weeks.ts --level 2 2>&1); rc=$?; rm -rf "$T"; printf "%s\n" "$out"; test $rc -eq 0 && test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -eq 0 && printf "%s\n" "$out" | awk "/^st2\// {k=\$1} /^  WARN +print-missing/ {if (k ~ /^st2\/(9|1[0-5])\$/) n++} END {if (n) print \"STAGE_CHECKS: \" n \" teaching week(s) of unit 2 without a print block\"; exit n>0}"'  # Phases 1 to 3: the week gate of the PM brief on a stage root, and a print-missing warning of a teaching week (st2/9 to st2/15) fails it (F2); the review weeks st2/8 and st2/16 have no print block, as in unit 1; a failed `cd`, `mktemp`, or `cp` exits 1 before check-weeks runs, because an empty `WORKBOOKS_ROOT` reads the real repository (`lib/filesystem.ts` line 41; F4); no heavy-run (no vitest, tsc, Chrome, PDF, or Ghostscript)
UX_REQUIRED=never   # print files: the visual checks are the contact-sheet tasks and Daniel's checks
PRINT_GATE='cd dashboard && npx tsx scripts/print/make-pdfx.ts <print file> --check'   # exit 0 for each print file
```

The three stage commands below share one setup. Run each one from the repository root, as one `( set -e … )` subshell that removes its stage root on exit. The setup removes the output links `pictures.json` and `pictures.md` and the link `card-pictures.json` in the stage root first. Then it writes a real `card-pictures.json` there: the 31 unit 1 entries and the staged unit 2 entries. So no maker writes through a link into `content/storytime/l2/print/`.

`CARD_MATCH_U2` (Phase 2) prints the picture match of every picture-type card of weeks 9 to 16 by the PM match rule of 2026-11-05, with every row of the stage list counted as delivered (the view after the Forge delivery). It writes no file in the repository. It exits 1 when a card has no match (`none`):

```bash
(
set -e
cd dashboard
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/content"
cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/"
P="$T/content/storytime/l2/print"
rm -f "$P/pictures.json" "$P/pictures.md" "$P/card-pictures.json"
cp ../content/storytime/drafts/l2/w*.json "$T/content/storytime/l2/"
python3 -I - ../content/storytime/l2/print/card-pictures.json ../content/storytime/drafts/l2/print/card-pictures-u2.json "$P/card-pictures.json" <<'PY'
import json, os, sys
unit1, unit2, out = sys.argv[1:4]
entries = json.load(open(unit1)) + (json.load(open(unit2)) if os.path.exists(unit2) else [])
open(out, "w").write(json.dumps(entries, indent=2, ensure_ascii=False) + "\n")
PY
export WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json"
npx tsx scripts/storytime/print-pictures.ts --level 2 > /dev/null
npx tsx -e "$(cat <<'TS'
import fs from 'fs';
import path from 'path';
import { readLevelWeeks, STORYTIME_ROOT } from './lib/storytime/files';
import { storytimeCardKit, storytimeCardPictureMatchLines } from './lib/storytime/print/card-kit';
const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((w) => (w.week && w.week.meta.week >= 9 ? [w.week] : []));
const rows = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json'), 'utf8'));
const all = new Set<string>(rows.map((row: { id: string }) => row.id));
const lines = storytimeCardPictureMatchLines(storytimeCardKit(weeks).cards, rows, all, new Map());
const none = lines.filter((line) => (line.split('\t')[2] ?? '').startsWith('none'));
console.log(lines.join('\n'));
console.log(`weeks ${weeks.map((w) => w.meta.week).join(',')}; picture-type cards ${lines.length}; none ${none.length}`);
process.exitCode = none.length ? 1 : 0;
TS
)"
)
```

`PICTURE_LIST_U2` (Phase 2) writes the unit 2 picture list from the staged week files and the staged card entries:

```bash
(
set -e
cd dashboard
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/content"
cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/"
P="$T/content/storytime/l2/print"
rm -f "$P/pictures.json" "$P/pictures.md" "$P/card-pictures.json"
cp ../content/storytime/drafts/l2/w*.json "$T/content/storytime/l2/"
python3 -I - ../content/storytime/l2/print/card-pictures.json ../content/storytime/drafts/l2/print/card-pictures-u2.json "$P/card-pictures.json" <<'PY'
import json, os, sys
unit1, unit2, out = sys.argv[1:4]
entries = json.load(open(unit1)) + (json.load(open(unit2)) if os.path.exists(unit2) else [])
open(out, "w").write(json.dumps(entries, indent=2, ensure_ascii=False) + "\n")
PY
export WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json"
npx tsx scripts/storytime/print-pictures.ts --level 2 > /dev/null
mkdir -p ../content/storytime/drafts/l2/print
python3 -I - "$P/pictures.json" "$P/pictures.md" ../content/storytime/drafts/l2/print/pictures-u2.json ../content/storytime/drafts/l2/print/pictures-u2.md <<'PY'
import json, re, sys
src_json, src_md, out_json, out_md = sys.argv[1:5]
rows = [r for r in json.load(open(src_json)) if r["week"] >= 9]
open(out_json, "w").write(json.dumps(rows, indent=2, ensure_ascii=False) + "\n")
parts = re.split(r"(?m)^(?=## Week )", open(src_md).read())
keep = [p for p in parts[1:] if int(re.match(r"## Week (\d+)", p).group(1)) >= 9]
head = "# Storytime Advantage — print picture list (Level 2, Unit 2)\n\nThe rows of weeks 9 to 16, with the card rows of unit 2, cut from the stage output of `print-pictures.ts --level 2`. `pictures-u2.json` is the machine list; this page is the readable copy.\n\n"
open(out_md, "w").write(head + "".join(keep))
cards = sum(1 for r in rows if r["use"] == "card")
print(len(rows), "rows,", cards, "card rows;", ", ".join(f"week {w}: {sum(1 for r in rows if r['week'] == w)}" for w in sorted({r['week'] for r in rows})))
PY
)
```

`PICTURE_CHECK_U2` (Phase 2) is the stage 1 check of a Forge delivery, book rows and card rows. It writes no file. Set `FORGE_FOLDER` to the absolute path of the delivery folder, and run it inside one heavy-run wrapper:

```bash
(
set -e
cd dashboard
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/content"
cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/"
P="$T/content/storytime/l2/print"
rm -f "$P/card-pictures.json"
cp ../content/storytime/drafts/l2/w*.json "$T/content/storytime/l2/"
python3 -I - ../content/storytime/l2/print/card-pictures.json ../content/storytime/drafts/l2/print/card-pictures-u2.json "$P/card-pictures.json" <<'PY'
import json, os, sys
unit1, unit2, out = sys.argv[1:4]
entries = json.load(open(unit1)) + (json.load(open(unit2)) if os.path.exists(unit2) else [])
open(out, "w").write(json.dumps(entries, indent=2, ensure_ascii=False) + "\n")
PY
export WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json"
npx tsx scripts/storytime/check-storytime-pictures.ts --batch "$FORGE_FOLDER" --level 2 --weeks 9,10,11,12,13,14,15,16
)
```

Baseline at 504fb6a2 (2026-11-06, measured by the planning session): `check-weeks.ts --level 2` exits 0 with 8 packages, 0 failed checks, and 1 warning (st2/8 `print-missing`). `STAGE_CHECKS` with no staged file gives the same report after the path prefix is removed, in 1.5 seconds. The first part of the picture list (the maker on a stage root) writes a list that `cmp` finds equal to the committed 227-row list, and `git status --porcelain content/storytime` stays empty.

Round 1 fixes (measured at f1c041ec on 2026-11-06, with a test copy of `w07.json` as week 9 in a temporary drafts folder and a temporary output folder; the repository stayed clean after each run):

- `STAGE_CHECKS`: exit 0 with no staged file; exit 0 with the test week; exit 1 with the message "STAGE_CHECKS: 1 teaching week(s) of unit 2 without a print block" after the `print` block was removed from the test week. The st2/8 warning does not fail it.
- `CARD_MATCH_U2`: the 17 picture-type cards of the test week matched unit 1 rows (exit 0). With one family card changed to "zebra" and no entry, it printed `none: no row` and exited 1. With one staged entry for "zebra", the card matched `l2-w09-card-zebra` and it exited 0.
- `PICTURE_LIST_U2`: 29 rows of week 9, among them the card row `l2-w09-card-zebra`.
- `PICTURE_CHECK_U2`: with an empty delivery folder, the checker ran and exited 2 ("no manifest.json"), as its usage text says.

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

Risk: Phase 4 changes the makers that built the approved unit 1 files. The unit 1 output snapshot (spec FR-6.7) guards them, and Phase 4 starts only after the unit 1 print order.

## Phase 1: Week texts (2026-11-07 to 2026-11-18)

_Blast radius: no code. New files under `content/storytime/drafts/l2/` only; `readLevelWeeks` does not read that folder (spec FR-1)._

- [x] Task 1.1: record the stage baseline (2026-11-07). Run `STAGE_CHECKS` with no staged file. Done when: its report equals the `check-weeks.ts --level 2` report after the path prefix is removed (8 packages, 0 failed checks, 1 warning), and `git status --porcelain content/storytime` is empty after the run. Evidence: automated. 703849f
- [~] Task 1.2: w09 (2026-11-07): element 8 d; sight words are, has, cannot; frame "I like ___. Yum!"; food and drink. Write `content/storytime/drafts/l2/w09.json` (spec FR-2), and set its phoneme fields with `set-phoneme-audio.ts --file`. Done when: `STAGE_CHECKS` passes (it fails on a FAIL line and on a `print-missing` warning of st2/9 to st2/15); the independent English review findings are fixed or answered in this line; the commit holds only the staged file and its review log under `measure/runs/storytime_l2_unit2_20261106/`. Evidence: automated and peer-report. Progress 2026-11-06: staged in cc10fbf, self-check 3a01e35 (`measure/runs/storytime_l2_unit2_20261106/w09-self-check.txt`): STAGE_CHECKS exit 0, st2/9 38 PASS, 0 FAIL, 0 WARN; the hand rules of FR-2.8 hold. Open: the independent English review (this session starts no subagent; the orchestrator runs it on the Task 1.11 extract). Fix 2026-11-07: d1822c6 (unit read U1 and U2).
- [~] Task 1.3: w10 (2026-11-08): element 9 -an -ad; sight words they, too, were; frame "Put on your ___."; clothes. Done when: as for w09, for st2/10. Progress 2026-11-06: staged in fd5a067 (`measure/runs/storytime_l2_unit2_20261106/w10-self-check.txt`): STAGE_CHECKS exit 0, st2/10 38 PASS, 0 FAIL, 0 WARN; the hand rules of FR-2.8 hold. Open: the independent English review (the orchestrator runs it on the Task 1.11 extract). Fixes: 67d8b02 (the decodable is in Tom's home with Tom and Dad) and 84b9e68 (the song leaders are table 1).
- [~] Task 1.4: w11 (2026-11-09): element 10 short e; sight words me, of; frame "Where is ___? In/On/Under."; home. Done when: as for w09, for st2/11. Progress 2026-11-06: staged in 685dd11 (`measure/runs/storytime_l2_unit2_20261106/w11-self-check.txt`): STAGE_CHECKS exit 0, st2/11 38 PASS, 0 FAIL, 0 WARN; the hand rules of FR-2.8 hold. Open: the independent English review (the orchestrator runs it on the Task 1.11 extract). Fix: 84b9e68 (the song leaders are table 2).
- [~] Task 1.5: w12 (2026-11-10): element 11 h; sight words goes, it, said, that; frame "Open your book."; school. Done when: as for w09, for st2/12. Progress 2026-11-06: staged in 70e2b77 (`measure/runs/storytime_l2_unit2_20261106/w12-self-check.txt`): STAGE_CHECKS exit 0, st2/12 38 PASS, 0 FAIL, 0 WARN; the hand rules of FR-2.8 hold. Deviation Q-B (default): `SightWordsSchema` allows 1 to 3 words a step, so "goes" moves from week 12 to week 14; the other route is a schema change through the Measure roles. Open: the independent English review (the orchestrator runs it on the Task 1.11 extract).
- [~] Task 1.6: w13 (2026-11-11): element 12 -ot -op; sight words do, for, like; frame "I can run/hop/jump."; actions. Done when: as for w09, for st2/13. Progress 2026-11-07: staged in 6f16d0e (`measure/runs/storytime_l2_unit2_20261106/w13-self-check.txt`): STAGE_CHECKS exit 0, st2/13 38 PASS, 0 FAIL, 0 WARN; the hand rules of FR-2.8 hold. Deviation Q-C (default): the frame is "I can ___.", because `frameCount` cannot match the slash words. Open: the independent English review (the orchestrator runs it on the Task 1.11 extract). Fix 2026-11-07: aeb0198 (unit read U6: the 7 family pictures show cast children, not an unnamed child) and d1822c6 (U2).
- [~] Task 1.7: w14 (2026-11-12): element 13 f; sight word you ("this" is a review word, D6); frame "It is hot/cold."; weather. Done when: as for w09, for st2/14. Progress 2026-11-07: staged in 4635431 (`measure/runs/storytime_l2_unit2_20261106/w14-self-check.txt`): STAGE_CHECKS exit 0, st2/14 38 PASS, 0 FAIL, 0 WARN; the hand rules of FR-2.8 hold. Deviations (defaults): Q-B ("goes" from week 12) and Q-D (the frame is "It is ___.", the week 3 text). Open: the independent English review (the orchestrator runs it on the Task 1.11 extract).
- [~] Task 1.8: w15 (2026-11-13): element 14 g; sight words his, no, my; frame "Look, a ___!"; transport. Done when: as for w09, for st2/15. Progress 2026-11-07: staged in 3529feb (`measure/runs/storytime_l2_unit2_20261106/w15-self-check.txt`): STAGE_CHECKS exit 0, st2/15 38 PASS, 0 FAIL, 0 WARN; the hand rules of FR-2.8 hold. Deviations (defaults): none; the check row 3 asks for the last sound /g/ (position "last"). Open: the independent English review (the orchestrator runs it on the Task 1.11 extract).
- [~] Task 1.9: w16 (2026-11-14): the review week "Unit 2 Review" in the shape of `w08.json`, with Benchmark 2 in the week 8 shape (spec FR-3, D5). Done when: as for w09, for st2/16; st2/16 may show the `print-missing` warning, as st2/8 does, because a review week has no print block (spec FR-3.3); the benchmark letters are the 12 taught letters; days 1 to 4 cover weeks 9 to 15. Progress 2026-11-07: staged in bf2474b (`measure/runs/storytime_l2_unit2_20261106/w16-self-check.txt`): STAGE_CHECKS exit 0, st2/16 18 PASS, 0 FAIL, 1 WARN (the allowed `print-missing`, as st2/8); the benchmark letters and sound cards are the 12 taught letters; days 1 to 4 cover weeks 9 to 15. Deviation (default): Q-E (12 letter boxes on the paper part, pass 8 of 12, because the check `benchmark` needs the 12 taught letters). Open: the independent English review (the orchestrator runs it on the Task 1.11 extract).
- [x] Task 1.10: the unit read of weeks 9 to 16 (2026-11-14). Read the 8 staged files together, after the per-week reviews. Check by hand what a one-week check cannot see (lessons-learned, 2026-10-02): each family word is on a book page or in a song line; no story, title, or twist repeats a week of weeks 1 to 16; each new sight word is new once; the cast looks stay as in unit 1. Done when: `STAGE_CHECKS` passes, and the findings and their fixes are in `measure/runs/storytime_l2_unit2_20261106/unit-read.md`. Evidence: automated and person-checked. Done 2026-11-07 in d1822c6 (`measure/runs/storytime_l2_unit2_20261106/unit-read.md`): 2 findings fixed (U1: the week 9 twist repeated week 2, so the page 8 picture changed; U2: the recall sound cards of all 8 files had no audio, so they now have the strip audio), 3 items kept (U3 to U5, defaults). STAGE_CHECKS exit 0 (st2/9 to st2/15 38 PASS each, st2/16 18 PASS). Deviation: the read came before the independent per-week reviews (FR-2.8), which are open; a review change to a week needs a second read of that week.
- [~] Task 1.11 (Hand-off 1): the English text file for Daniel (2026-11-14). Build `make-manual-pdf.ts --file <the 8 staged files> --lang en --loops --out ~/Desktop/print-ready/storytime/text-review/Storytime-Advantage-L2-U2-weeks-9-16-English-text.pdf` in one heavy-run. Record its SHA-256 here. Send the file, the SHA-256, and the open questions of the spec to the PM session. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task 1.12 (Owner gate): Daniel's English check of weeks 9 to 16, by 2026-11-18 (D9). Apply the changes that he asks for, with a new text file and his new words. Record his exact words, the date, and the file SHA-256 in `approval.text` of each staged file. Done when: `STAGE_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task 1.13 (Hand-off 2): the song request (after the English approval, about 2026-11-19). Send the 7 lyric sheets and style briefs to the PM session for Lyria 3 Pro, 3 candidates a song (about 1.68 USD; Daniel's go, D10). Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task 1.14: Measure - User Manual Verification 'Phase 1: Week texts' (Protocol in workflow.md). The phase has an owner gate: Daniel's English check.

## Phase 2: Picture list for Forge (2026-11-14 to 2026-11-23)

_Blast radius: no code. New files under `content/storytime/drafts/l2/print/` and in this track folder._

- [~] Task 2.1: the card picture entries of unit 2 (2026-11-14; spec FR-4.3, D13). Run `CARD_MATCH_U2` on the staged weeks. The match rule is the PM rule of 2026-11-05 with the Phase 8 extensions: a card row of the same word, then a check-row, practice-line, or d4-prompt row of the same word (case a), then a story page that shows only that object (case b). A row of unit 1 counts, so a unit 1 picture of the same word is used again. The 8 color words print as a color patch, and the number words one to nine print as the numeral with dots (owner decision, 2026-11-06). Each card word with `none: no row` gets one entry in `content/storytime/drafts/l2/print/card-pictures-u2.json`: the word, the first week of weeks 9 to 16 that names the card, and a Forge prompt in the unit 1 card style of `content/storytime/l2/print/card-pictures.json` (one object or one person who does the action, then the fixed end "One clear picture, the main thing large in the middle, a plain light background. No letters, words, or numbers anywhere."). Done when: `CARD_MATCH_U2` exits 0 with 0 `none` lines; every entry has a week from 9 to 16 and the fixed end; no entry word is also in the unit 1 card file; the match report is in `measure/runs/storytime_l2_unit2_20261106/card-match-u2.txt`. Evidence: automated.
- [ ] Task 2.2: the picture list of unit 2 (2026-11-14 to 2026-11-15). Run `PICTURE_LIST_U2`, and commit `content/storytime/drafts/l2/print/pictures-u2.json` and `pictures-u2.md`. The list holds the book rows of weeks 9 to 16 and one card row for each entry of `card-pictures-u2.json`. Done when: every row is of a week from 9 to 16; the card row count equals the entry count; no file name is also in `content/storytime/l2/print/pictures.json`; the row count of each week is in the commit message; a second run gives the same two files (`cmp`). Evidence: automated.
- [ ] Task 2.3: the Forge brief (2026-11-15). Write `measure/tracks/storytime_l2_unit2_20261106/forge-brief.md` (spec FR-4.4): the scenes, the props, and the cast of each week; the unit 1 cast only (D4); the style rules with the class table of FR-9 version 1; the card rows of unit 2 with their prompts (class C, the unit 1 card style); the row count; the cost estimate at the unit 1 rate; and the delivery rule (a Forge folder with `manifest.json`; the copy into `content/storytime/l2/print/pictures/` in Phase 4). Done when: the brief names every row id of `pictures-u2.json`, book rows and card rows. Evidence: automated (an id count) and peer-report.
- [ ] Task 2.4 (Hand-off 3): send the picture list and the Forge brief to the PM session for Forge (2026-11-15). Forge can stage its inputs at once; it starts no paid render before the owner gate below. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task 2.5 (Owner gate): Daniel's go for the paid Forge renders of unit 2, book rows and card rows, after his English approval (about 2026-11-19; D10). Record his words in this line. Evidence: owner-approved.
- [ ] Task 2.6: the card entries and the list after the English approval (about 2026-11-19). Run `CARD_MATCH_U2` and `PICTURE_LIST_U2` again on the approved text. Add an entry for each new `none` card, and remove the entry of a word that no card names now. If a row changed, commit the new files and send the difference to the PM session. Done when: `CARD_MATCH_U2` exits 0, and the committed list equals a new run (`cmp`). Evidence: automated.
- [ ] Task 2.7: the delivery check (about 2026-11-21 to 2026-11-22). Run `PICTURE_CHECK_U2` on each Forge delivery folder in one heavy-run. It checks the book rows and the card rows. Done when: every requested row passes, the card rows included, and the report is in `measure/runs/storytime_l2_unit2_20261106/`. A card row that Forge cannot deliver goes to the PM session with its row id, and the task stays open until the row passes or Daniel takes the card picture out with his words in this line. Evidence: automated.
- [ ] Task 2.8 (Owner gate): Daniel's look at the unit 2 pictures, the card pictures included, by 2026-11-23. Record his exact words and the date in `approval.images` of each staged file. Done when: `STAGE_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task 2.9: Measure - User Manual Verification 'Phase 2: Picture list for Forge' (Protocol in workflow.md). The phase has an owner gate: Daniel's look.

## Phase 3: Thai parts for Daniel's check (2026-11-19 to 2026-11-28)

_Blast radius: no code. The Thai fields of the staged files only._

- [ ] Task 3.1: the Thai teacher book draft (2026-11-19 to 2026-11-21), after the English approval (spec FR-5.5). Bring every Thai field of the 8 staged files in line with the approved English. Build `make-manual-pdf.ts --file <the 8 staged files> --lang th --loops --out ~/Desktop/print-ready/storytime/text-review/Storytime-Advantage-L2-U2-weeks-9-16-Thai-teacher-book-draft.pdf` in one heavy-run, and make the contact sheets of every page. Done when: `STAGE_CHECKS` passes (the `thai` and `thai-lines` rows pass for st2/9 to st2/16); the writer looked at every page render and found no broken Thai line; the PDF SHA-256 is in this line. Evidence: automated and person-checked.
- [ ] Task 3.2 (Hand-off 4): send the Thai parts to the PM session for Daniel (2026-11-21): the PDF, its SHA-256, the home card lines of weeks 9 to 16, and the list of new Thai terms. No Thai goes to another person or to a model. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task 3.3 (Owner gate): Daniel's Thai check of weeks 9 to 16, by 2026-11-28 (D9). Apply his changes. Record his exact words, the date, and the source in `approval.thai` of each staged file. Done when: `STAGE_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task 3.4: Measure - User Manual Verification 'Phase 3: Thai parts for Daniel's check' (Protocol in workflow.md). The phase has an owner gate: Daniel's Thai check.

## Phase 4: Unit scope and the move (2026-11-26 to 2026-11-30)

_Blast radius (from `grep`, 2026-11-06): `readLevelWeeks` (`lib/storytime/files.ts`; 13 scripts and 7 test files); `storytimePrintPictures` and `print-pictures.ts`; `make-student-book-pdf.ts` with `student-book.ts` and `student-book-cli.ts`; `make-teacher-book-print.ts`; `make-card-kit-pdf.ts`; `make-step-map.ts` with `step-pages.ts` and `step-map.ts`; `letter-strokes.ts`; `checks.ts`. Start condition: the print order task of `storytime_print_r1_20261025` is complete, and the orchestrator gives the go (rule R1)._

- [ ] Task 4.1 (Red): `__tests__/storytime-unit2-scope.test.ts` (spec FR-6). The tests cover: the makers take the unit from `meta.unit` (the student book title and file name, the map sticker, the song line, the benchmark label, the card kit title, the unit weeks of the teacher book, `step-map-u2.json`, and the unit 2 picture list at `l2/print/u2/`); with the unit 2 weeks in a temporary `l2/` folder, the unit 1 week reads see weeks 1 to 8 only; the unit 2 card entries at `l2/print/u2/card-pictures.json` give the card rows of unit 2, and the card match of unit 2 covers every row of the level (a unit 1 picture of the same word matches); the guides of d, e, h, f, and g; a review strip card with an untaught item fails; a check item with two right pictures fails; the unit 1 output snapshot. Done when: `RED_TEST_COMMAND` fails only in the new tests, and the commit holds only files under `__tests__/`. Evidence: automated.
- [ ] Task 4.2 (Green): implement spec FR-6.2 to FR-6.7. Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` pass in heavy-runs; each new rule has a mutant that a test catches; the unit 1 output snapshot is unchanged. Evidence: automated.
- [ ] Task 4.3: the move (about 2026-11-29). Move the 8 staged files into `content/storytime/l2/` with `git mv`, and move `card-pictures-u2.json` to `content/storytime/l2/print/u2/card-pictures.json`. Make the unit 2 picture list and step map with the makers. Copy the delivered pictures into `content/storytime/l2/print/pictures/` and compare each SHA-256 with the Forge manifest. Done when: `PROJECT_CHECKS` passes with 0 FAIL lines (the gate of the PM brief, `check-weeks.ts --level 2`); `PROJECT_TESTS` passes; the card rows of `l2/print/u2/pictures.json` equal the card rows of the staged `pictures-u2.json`; `git status --porcelain content/storytime/drafts` is empty. Evidence: automated.
- [ ] Task 4.4: Measure - User Manual Verification 'Phase 4: Unit scope and the move' (Protocol in workflow.md). The phase has no owner gate of its own.

## Phase 5: Print build (2026-12-01 to 2026-12-08)

_Blast radius: no code. Print outputs only; the makers are the Phase 4 makers._

- [ ] Task 5.1: the proof build of unit 2 (2026-12-01 to 2026-12-03), each maker in its own heavy-run: the student book (`make-student-book-pdf.ts --level 2 --weeks 9,10,11,12,13,14,15,16 --proof`), the Thai teacher book (`make-teacher-book-print.ts --level 2 --weeks 9,10,11,12,13,14,15,16 --lang th --loops`), the 14 color A3 readers (`make-readers-pdf.ts --level 2 --weeks 9,10,11,12,13,14,15 --a3-color`), the teacher book cover (`make-storytime-teacher-cover.ts --level 2 --unit 2`), and the step map. Done when: each print file passes `PRINT_GATE`; each file is newer than the last commit of its sources; the contact sheets of every page exist; `pdffonts` shows the planned fonts; `check-qr.ts` decodes the 8 week addresses `/th/st/2/9` to `/th/st/2/16`. Evidence: automated.
- [ ] Task 5.2: the card kit of unit 2 (2026-12-02 to 2026-12-03; spec FR-7.3). Build `make-card-kit-pdf.ts --level 2 --weeks 9,10,11,12,13,14,15,16` in one heavy-run, after the delivery check of Phase 2 and the Phase 4 copy of the card pictures. Done when: each kit file passes `PRINT_GATE`; the `card-picture-match.txt` of the build has 0 lines whose source is `none`, so no card prints an empty box; a `none` line stops the task until the line has a named reason that the PM session records with Daniel's words in this line; the match report is copied to `measure/runs/storytime_l2_unit2_20261106/`. Evidence: automated.
- [ ] Task 5.3 (Owner gate): Daniel's go for the unit 2 student book cover (spec FR-7.2). The covers of the other 13 books wait for Daniel until after release 1. Record his words in this line. Evidence: owner-approved.
- [ ] Task 5.4: the unit 2 student book cover, after the go above. Fill the Level 2 Unit 2 row of `content/storytime/covers/books.json` (picture recipe and panel), and build `make-storytime-book-cover.ts --level 2 --unit 2 --print` in one heavy-run. Done when: the build passes its checks and `PRINT_GATE`. Evidence: automated.
- [ ] Task 5.5 (Hand-off 5): send the proof files to the PM session for the print-curriculum audit (checklist A1 to J1) and for Daniel (2026-12-04): the proof PDFs, the fold-test PDF, the teacher book PDF, the week data, the step map, and the QR list. Fix each finding and send the fix batch for the re-audit. Done when: the audit gate has 0 blockers and 0 majors. Evidence: peer-report.
- [ ] Task 5.6 (Owner gate): Daniel approves the unit 2 print proof, by 2026-12-08. Record his exact words and the date in `approval.print` of `w09.json` to `w16.json`. Done when: `PROJECT_CHECKS` passes, and the 8 files hold the record. Evidence: owner-approved.
- [ ] Task 5.7: the final print files after the approval (by 2026-12-09): build with `--final` where the maker has it, in heavy-runs. Done when: each final file passes `PRINT_GATE`, and the list of files with their SHA-256 is in `measure/runs/storytime_l2_unit2_20261106/print-files.md`. Evidence: automated.
- [ ] Task 5.8: Measure - User Manual Verification 'Phase 5: Print build' (Protocol in workflow.md). The phase has an owner gate: Daniel's proof approval.

## Phase 6: Hand-offs (2026-12-01 to 2026-12-09)

_Blast radius: no code. Media and package fields of weeks 9 to 16._

- [ ] Task 6.1: the song audio of weeks 9 to 15, after Daniel's picks. Put each chosen take at `l2/media/w<nn>/song.mp3`, and set `song.lines` and `song.times` from a transcript (local faster-whisper, no lyric prompt). Record his words in `approval.song`. Done when: `PROJECT_CHECKS` passes, and `song-sheet` gives no warning, or the warning names the sung difference. Evidence: automated and owner-approved.
- [ ] Task 6.2: the book audio of weeks 9 to 15 with `book-audio.ts --level 2 --week <n>`, after the PM confirms the cost class of mmx speech. Run a recognizer on every short clip and make a new take when it hears other words (lessons-learned, 2026-10-24). Record Daniel's listen check in `approval.audio`. Done when: `PROJECT_CHECKS` passes. Evidence: automated and owner-approved.
- [ ] Task 6.3: the app pictures of weeks 9 to 15 with `set-book-pictures.ts --level 2 --week <n>`. Done when: `PROJECT_CHECKS` passes, and the `book-pictures` row passes for st2/9 to st2/15. Evidence: automated.
- [ ] Task 6.4 (Hand-off 6): send the app packages of weeks 9 to 16 to the PM session for Monorepo, with a SHA-256 list (the pattern of `storytime_week_package_20261022` Phase 9). Done when: the PM session confirms receipt and the Monorepo check. Evidence: peer-report.
- [ ] Task 6.5 (Check, person): after the Monorepo load, a person scans the QR codes on one printed page of each week from 9 to 16 with a phone. Record the address that opens and the result. Done when: every address answers on the live host. Evidence: person-checked.
- [ ] Task 6.6: project memory. Update `measure/tech-debt.md` and `measure/lessons-learned.md` (50 lines or less each). Done when: both files are at or below 50 lines and name the findings of this track. Evidence: automated.
- [ ] Task 6.7 (Hand-off 7): the report and the facts-changed list in `measure/runs/storytime_l2_unit2_20261106/report.md`, to the PM session. Set `actual_tasks` and the deviation notes in `metadata.json`. Done when: the PM session confirms receipt. Evidence: peer-report.
- [ ] Task 6.8: Measure - User Manual Verification 'Phase 6: Hand-offs' (Protocol in workflow.md). The phase has no owner gate of its own.
