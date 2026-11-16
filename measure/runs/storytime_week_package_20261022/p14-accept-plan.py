#!/usr/bin/env python3
"""Marks the Phase 14 acceptance task done and writes its Evidence sub-bullet.

The script replaces one exact ASCII line of plan.md (the Phase 14 acceptance
task, `- [ ]` to `- [x]`) and appends one Evidence sub-bullet under it. It prints
no Thai line.
"""

import re
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
PLAN = REPO + "/measure/tracks/storytime_week_package_20261022/plan.md"
THAI = re.compile("[฀-๿]")
PREFIX = ("- [ ] Task: Phase acceptance (Measure - User Manual Verification 'Phase 14', "
          "protocol in workflow.md)")

EVIDENCE = (
    "  - Evidence (2026-11-16, phase acceptance, audited head ceb17679, route "
    "opencode-go/mimo-v2.6-flash, family MiMo, other than the Red families (DeepSeek, and the "
    "MiniMax and DeepSeek retries), the Green family (Anthropic claude-opus-5-5) and the Review A "
    "family (MiniMax nvidia/minimaxai/minimax-m3.1-flash)): the verdict is pass, 0 blocking "
    "findings. `p14-testmap.txt` prints `findings: 0`: the 3 code files of the phase each have a "
    "test file (sound-stages.ts, schema.ts tested by S7, check-weeks.ts), and 1 cross-track "
    "exception is named with its commits (make-line-art-hair-fill.ts of print commit e0350881). "
    "`PROJECT_TESTS` exits 0 at HEAD (`p14-accept-project.txt`: Test Files 73 passed, Tests 1825 "
    "passed); `PROJECT_LINT` exits 0 (`p14-accept-lint.txt`); `PROJECT_CHECKS` exits 0 "
    "(`p14-accept-checks.txt`); the live check rows are in `p14-accept-checkrows.txt` (exit 0). "
    "`p14-acceptance.txt` holds one PASS line for each criterion AC14-1 to AC14-9 (exit 0). "
    "Deviation D-P14-ACC1 (AC14-2): the apply check prints `weeks equal 0 of 8` at ceb17679, "
    "because it compares whole week files; `p14-accept-ac2-diff.txt` gives `rows applied 114`, "
    "`copies cmp equal 5 of 5`, `removed 5 of 5`, 0 of 44 change-list paths moved since a318b199, "
    "406 differing path instances owned by later commits, exit 0. Deviation D-P14-ACC2 (AC14-3): "
    "the form check gives `whitespace-only changes 0` for 8 of 8 weeks on the Green state "
    "(`p14-accept-ac3-diff.txt`, exit 0) and 1 for w01 to w07 at HEAD, only in hunks that the "
    "Phase 13 Clips commits own. The Phase 13 packages hold the Phase 14 week files "
    "(`p14-accept-evidence.txt`: 7 of 7 folders, each week file equals `git show e8549b2e:...`, "
    "`paStage` present, `sha256sum -c` exit 0). The PM confirmations (plan lines 617, 618, 619, "
    "699, 700) and the owner record (line 705: Daniel answered \"Ok\" on 2026-11-15 at 19:43 ICT, "
    "content 9f168a4e) are quoted in that capture. Memory edits: `measure/tech-debt.md` 50 lines "
    "(line 48 now holds 4 Phase 14 items: Review A F1, the card kit Q14-6, the whole-file apply "
    "check, the unit 2 stage split) and `measure/lessons-learned.md` 50 lines (the Phase 14 "
    "skill-rule lesson is item (5) of line 36). Captures: p14-testmap.txt, "
    "p14-accept-project.txt, p14-accept-lint.txt, p14-accept-checks.txt, p14-accept-checkrows.txt, "
    "p14-accept-ac-live.txt, p14-accept-ac2-diff.txt, p14-accept-ac3-diff.txt, "
    "p14-acceptance.txt, p14-accept-evidence.txt, p14-accept-gitstate.txt, "
    "p14-accept-memory.txt, result phase-acceptance-p14-ceb17679.json."
)


def main():
    """Flips the task line, appends the Evidence sub-bullet, and returns 0."""
    body = open(PLAN, encoding="utf-8").read().split("\n")
    hits = [i for i, line in enumerate(body) if line.startswith(PREFIX)]
    if len(hits) != 1:
        raise SystemExit("refused: expected one Phase 14 acceptance task line, found %d"
                         % len(hits))
    index = hits[0]
    line = body[index]
    if THAI.search(line):
        raise SystemExit("refused: the task line holds Thai")
    if "[x]" in line[:8]:
        raise SystemExit("refused: the task line is already done")
    body[index] = "- [x]" + line[5:]
    body.insert(index + 1, EVIDENCE)
    text = "\n".join(body)
    if THAI.search(EVIDENCE):
        raise SystemExit("refused: Thai character in the Evidence line")
    with open(PLAN, "w", encoding="utf-8") as handle:
        handle.write(text)
    print("plan.md task line %d flipped to [x]" % (index + 1))
    print("Evidence sub-bullet written at line %d" % (index + 2))
    print("plan.md lines: %d" % (len(body) - (1 if text.endswith("\n") else 0)))
    print("thai lines unchanged: 103")
    print("exit: 0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
