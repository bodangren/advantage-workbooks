#!/usr/bin/env python3
"""Phase acceptance step 5: write the memory rows and close the plan task line.

- measure/tech-debt.md: merge the 3 Phase 8 review rows of 2026-11-05 of this
  track into one row (the registry merge style), and append 1 new row with the
  3 Phase 12 items of the acceptance task line. 50 lines before, 49 after.
- measure/lessons-learned.md: insert the 2 lessons of the acceptance task line
  after the last Recurring Gotchas bullet. 50 lines before, 52 after.
- measure/tracks/storytime_week_package_20261022/plan.md: mark the Phase
  acceptance task line [x] and append its evidence sub-line.

The script asserts the before and after line counts, asserts 0 Thai characters
in every added line, and prints what it did.
"""
import re
import sys

BASE = "/home/daniebo/Desktop/Workbooks"
TD = BASE + "/measure/tech-debt.md"
LL = BASE + "/measure/lessons-learned.md"
PLAN = BASE + "/measure/tracks/storytime_week_package_20261022/plan.md"
THAI = re.compile(r"[\u0e00-\u0e7f]")

MERGED_ROW = (
    "| 2026-11-05 | storytime_week_package_20261022 | Three Phase 8 review rows, merged on "
    "2026-11-13 to keep this file at 50 lines. (1) Findings 7 and 8, `phonemes.ts`: `bankSound` "
    "maps \"x\" and \"qu\" to the bank labels but not the IPA forms \"/ks/\" and \"/kw/\"; a held "
    "\"/ee/\" or \"ooo\" turns into the short vowel; \"/th/\" has no bank entry (finding 7, line 51); "
    "`soundLabels` skips a held digraph such as \"shhh\", so the day has fewer recordings than sounds "
    "and nothing is reported (finding 8, line 65). (2) Findings 3 and 9, `checks.ts`: the review-strip "
    "rule trusts the `week` field of each card, so an untaught item with an earlier week passes "
    "(finding 3, line 300); `check-answers` verifies only that the answer is one of the pictures, so "
    "an item with two right answers passes (finding 9, line 332). (3) Findings 10 to 14 (low): the "
    "message of `checks.ts:248` prints `imageOf` 0-based beside a 1-based line (10); a strip card week "
    "has no level, so a review cannot cross a level (11, `checks.ts:300`); the record sheet counts a "
    "picture-sort item as a letter (12, `manual.ts:259`); `family.max` is bounded 8 to 10, but w08 has "
    "18 family words and no check sees it (13, `schema.ts:116`); `soundBook` on a read-along hides the "
    "decodable page-count check, and `mergeMaterials` keys items by case (14, `checks.ts:206`, "
    "`manual.ts:146`). No shipped week fails. | Medium | Open | (1) Fix before the first week that "
    "uses x, qu, ee, or th. (2) Fix before any new week after w08 is written: compare the card with "
    "the taught graphemes and tricky words, and check that exactly one picture has the sound. (3) No "
    "trigger; fix when one of these files changes next. Source: "
    "`handoff/cloud-wb-reports-1103/wb-storytime-checks-review.md`. |"
)

NEW_ROW = (
    "| 2026-11-13 | storytime_week_package_20261022 | Three Phase 12 rows. (1) The sentence maker "
    "needs the faster-whisper venv outside the repositories "
    "(`~/.local/share/storytime-word-audio-venv`, `WHISPER_PYTHON`, spec K9). (2) The sentence clips "
    "are made again for each sentence text change, because the check `sentence-clips` compares the "
    "text and no bank holds them. (3) The package builder is a script under `measure/runs/` and has "
    "no unit test. | Low | Open | (1) Set `WHISPER_PYTHON` on each maker run (spec K9). (2) A "
    "sentence-clip bank, or a cache copy into the content tree, when a revision round edits sentence "
    "text. (3) Its proof is the nine checks of the Packages task; a unit case can come with the "
    "read-along revision round. |"
)

ROW_PREFIXES = [
    "| 2026-11-05 | storytime_week_package_20261022 | Phase 8 review findings 7 and 8",
    "| 2026-11-05 | storytime_week_package_20261022 | Phase 8 review findings 3 and 9",
    "| 2026-11-05 | storytime_week_package_20261022 | Phase 8 review findings 10 to 14",
]

LESSON_ANCHOR = "- (2026-11-09, storytime_cover_options_20261106, Task 2.8)"
LESSONS = [
    "- (2026-11-13, storytime_week_package_20261022) A \"no slice\" rule needs a positive control: "
    "a real cut must fail the test. The D11 case cuts a window of a synthetic source, re-encodes it, "
    "and expects true; the M12 mutant (`looksLikeCut` always false) fails it; the Review A probe on "
    "real book audio gave 7 of 7 controls true and 56 shipped clips false.",
    "- (2026-11-13, storytime_week_package_20261022) The book audio cache holds per-sentence "
    "generations that a package cannot read, so a clip that must ship is generated or copied into the "
    "content tree; the sentence maker reads only the week JSON and writes under "
    "`l2/media/w0<n>/sentences/`.",
]

PLAN_OLD = "- [ ] Task: Phase acceptance (Measure"
PLAN_NEW = "- [x] Task: Phase acceptance (Measure"
PLAN_SUBLINE = (
    "  - Evidence (2026-11-13, phase acceptance, audited head 852a8dba, route "
    "coding-plan/glm-5.3-flash#high): the verdict is pass, 0 blocking findings. `p12-testmap.txt` "
    "prints `findings: 0` (each of the 8 code files of 0c664ccf and 6e272b28 has a test file). "
    "`PROJECT_TESTS` exits 0 at HEAD with no R3 exclude (`p12-accept-tests.txt`: Test Files 67 passed "
    "(67), no timeout). `p12-acceptance.txt` holds one line for each criterion AC12-1 to AC12-12; the "
    "characters are the provenance values 47, 779, 887, and 934 (Review A F2: the helper script prints "
    "875 and 922, the fix is routed). The PM receipt of the 7 folders is on the Packages line "
    "(2026-11-13, about 15:10 ICT). Owner (Workbooks orchestrator) confirmation, 2026-11-13: yes. "
    "Basis: Review A pass (c106badb, 13 of 13 mutants, 0 cuts on 56 clips), the PM receipt of the 7 "
    "folders, the Green gates (454 passed, PROJECT_CHECKS exit 0). The F10 Red window of the cover "
    "track closed at 21:11 (Green code d36a42a1); no loops R3 window was open. Memory edits: the 3 "
    "new tech-debt items are one row; the 3 Phase 8 rows of 2026-11-05 of this track are merged into "
    "one row, so `measure/tech-debt.md` holds 49 lines; `measure/lessons-learned.md` gains the 2 "
    "lessons of this line (52 lines). Route substitution: the first route "
    "`opencode/glm-5.3-flash-free#high` stopped at 22:09 on the free limit; the orchestrator moved "
    "the role to `coding-plan/glm-5.3-flash#high`, the same GLM family."
)


def check_thai(lines, label):
    bad = [i for i, line in enumerate(lines) if THAI.search(line)]
    if bad:
        print(f"THAI IN ADDED LINES of {label}: {bad}")
        sys.exit(1)


def main():
    # tech-debt.md
    with open(TD, "r", encoding="utf-8") as fh:
        lines = fh.read().splitlines()
    assert len(lines) == 50, f"tech-debt before: {len(lines)} lines, expected 50"
    found = []
    kept = []
    for line in lines:
        hit = next((p for p in ROW_PREFIXES if line.startswith(p)), None)
        if hit:
            found.append(hit)
        else:
            kept.append(line)
    assert len(found) == 3, f"found {len(found)} of 3 rows to merge"
    anchor = kept.index([l for l in kept if l.startswith("| 2026-11-05 | storytime_week_package_20261022 | Two Low test gaps")][0])
    # Keep the registry order: the merged Phase 8 row replaces the 3 rows at their first position.
    first_pos = next(i for i, l in enumerate(kept) if l.startswith("| 2026-11-05 | storytime_week_package_20261022 | Phase 8 review") is False and False) if False else None
    # insert merged row where the first Phase 8 row sat: find the row before it
    idx = next(i for i, l in enumerate(kept) if l.startswith("| 2026-11-05 | storytime_week_package_20261022 | Two Low test gaps")) if False else None
    pos = None
    for i, l in enumerate(kept):
        if l.startswith("| 2026-11-05 | storytime_week_package_20261022"):
            pos = i
            break
    assert pos is not None
    kept.insert(pos, MERGED_ROW)
    kept.append(NEW_ROW)
    check_thai([MERGED_ROW, NEW_ROW], "tech-debt")
    assert len(kept) == 49, f"tech-debt after: {len(kept)} lines, expected 49"
    with open(TD, "w", encoding="utf-8") as fh:
        fh.write("\n".join(kept) + "\n")
    print(f"tech-debt.md: merged 3 Phase 8 rows into 1, appended 1 Phase 12 row, {len(kept)} lines")

    # lessons-learned.md
    with open(LL, "r", encoding="utf-8") as fh:
        ll_lines = fh.read().splitlines()
    assert len(ll_lines) == 50, f"lessons before: {len(ll_lines)} lines, expected 50"
    hits = [i for i, l in enumerate(ll_lines) if l.startswith(LESSON_ANCHOR)]
    assert len(hits) == 1, f"lesson anchor hits: {len(hits)}"
    at = hits[0] + 1
    ll_lines[at:at] = LESSONS
    check_thai(LESSONS, "lessons-learned")
    assert len(ll_lines) == 52, f"lessons after: {len(ll_lines)} lines, expected 52"
    with open(LL, "w", encoding="utf-8") as fh:
        fh.write("\n".join(ll_lines) + "\n")
    print(f"lessons-learned.md: inserted 2 lessons after the Task 2.8 bullet, {len(ll_lines)} lines")

    # plan.md
    with open(PLAN, "r", encoding="utf-8") as fh:
        plan = fh.read()
    assert plan.count(PLAN_OLD) == 1, f"plan task marker hits: {plan.count(PLAN_OLD)}"
    plan = plan.replace(PLAN_OLD, PLAN_NEW)
    if not plan.endswith("\n"):
        plan += "\n"
    plan += PLAN_SUBLINE + "\n"
    check_thai([PLAN_SUBLINE], "plan")
    with open(PLAN, "w", encoding="utf-8") as fh:
        fh.write(plan)
    print("plan.md: acceptance task line marked [x], evidence sub-line appended")


if __name__ == "__main__":
    main()
