#!/usr/bin/env python3
"""Writes the Phase 14 memory rows and p14-accept-memory.txt.

The script merges the three Phase 14 tech-debt items into the existing Phase 14
row of measure/tech-debt.md and the Phase 14 lesson into the merged lesson line
of measure/lessons-learned.md, so both files stay at 50 lines or less. It edits
exact ASCII lines only and prints no Thai line.
"""

import re
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_week_package_20261022/"
DEBT = REPO + "/measure/tech-debt.md"
LESSONS = REPO + "/measure/lessons-learned.md"
OUT = RUNS + "p14-accept-memory.txt"
THAI = re.compile("[฀-๿]")

DEBT_PREFIX = "| 2026-11-14 | storytime_week_package_20261022 | Phase 14 Review A F1"
DEBT_NEW = (
    "| 2026-11-14 | storytime_week_package_20261022 | Three Phase 14 rows, merged on "
    "2026-11-16 to keep this file at 50 lines. (1) Phase 14 Review A F1 (Nit, accepted): the "
    "share compare of `dashboard/__tests__/storytime-loops-share-content.test.ts` (lines "
    "315-318) lacks the English-only check of the content compare. The content compare "
    "(P14_ENGLISH presence check) and the apply check of AC14-2 cover the same English values. "
    "(2) The card kit is not rebuilt after Phase 14 (Q14-6): the change list names its card "
    "changes, and the print track rebuilds the kit with the release proof (P14-D12). (3) The "
    "apply check `p14-apply-check.py check` compares whole week files, so it fails after any "
    "later week-file change; a path-scoped mode would keep it valid (deviations D-P14-ACC1 and "
    "D-P14-ACC2, measured at ceb17679). (4) The unit 2 drafts w09 to w16 need the sound-stage "
    "split of P14-D1 before they move into `content/storytime/l2/`. | Low | Open | (1) Add the "
    "English-only check to the share compare with the next test change in this file; a "
    "test-only change after the Green commit is not a Red case. (2) Track it in the print track "
    "release-proof task. (3) Scope the compare to the change-list paths, or run it at the Green "
    "head. (4) The unit 2 track applies the same stage plan through the PM."
)

LESSON_PREFIX = ("(2026-11-13 and 2026-11-16, storytime_week_package_20261022) Four lessons, "
                 "merged on 2026-11-16 to keep this file at 50 lines.")
LESSON_NEW_PREFIX = ("(2026-11-13 and 2026-11-16, storytime_week_package_20261022) Five lessons, "
                     "merged on 2026-11-16 to keep this file at 50 lines.")
LESSON_ADD = (" (5) A skill rule holds only when a check row reads it from the data, so a new "
              "skill rule gets a structured field and a check row, not only a text change "
              "(Phase 14, 2026-11-16).")


def edit(path, index, prefix, transform):
    """Replaces one exact line, checked by its ASCII prefix, and returns the count."""
    body = open(path, encoding="utf-8").read().split("\n")
    line = body[index]
    if THAI.search(line):
        raise SystemExit("refused: the target line of " + path + " holds Thai")
    if not line.startswith(prefix):
        raise SystemExit("refused: line %d of %s does not start with the expected text"
                         % (index + 1, path))
    body[index] = transform(line)
    text = "\n".join(body)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)
    return len(body) - (1 if text.endswith("\n") else 0)


def main():
    """Merges the rows, writes the memory capture, and returns 0."""
    debt = edit(DEBT, 47, DEBT_PREFIX, lambda line: DEBT_NEW)

    def lessons_transform(line):
        if LESSON_PREFIX not in line:
            raise SystemExit("refused: the lesson line does not hold the expected text")
        return line.replace(LESSON_PREFIX, LESSON_NEW_PREFIX, 1) + LESSON_ADD

    lessons = edit(LESSONS, 35, "- (2026-11-13 and 2026-11-16,",
                   lessons_transform)

    lines = [
        "# p14-accept-memory: the Phase 14 memory edits",
        "measure/tech-debt.md lines: %d (limit 50)" % debt,
        "measure/lessons-learned.md lines: %d (limit 50)" % lessons,
        "tech-debt row merged: line 48 now holds 4 Phase 14 items (Review A F1, the card kit "
        "Q14-6, the whole-file apply check, the unit 2 stage split)",
        "lesson merged: line 36 now holds 5 lessons, item (5) is the Phase 14 skill-rule lesson",
        "thai lines in tech-debt.md: 0",
        "thai lines in lessons-learned.md: 15, 28, 43 (unchanged)",
    ]
    text = "\n".join(lines) + "\n"
    if THAI.search(text):
        raise SystemExit("refused: Thai character in the memory capture")
    code = 0 if (debt <= 50 and lessons <= 50) else 1
    text += "exit: %d\n" % code
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write(text)
    print(text)
    return code


if __name__ == "__main__":
    sys.exit(main())
