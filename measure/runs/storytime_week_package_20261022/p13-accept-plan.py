#!/usr/bin/env python3
"""Phase 13 acceptance step 4: mark the plan task line [x] and append Evidence."""

import re

PLAN = ("/home/daniebo/Desktop/Workbooks/measure/tracks/"
        "storytime_week_package_20261022/plan.md")
THAI = re.compile("[฀-๿]")

OLD = ("- [ ] Task: Phase acceptance (Measure - User Manual Verification 'Phase 13', "
       "protocol in workflow.md).")
NEW = ("- [x] Task: Phase acceptance (Measure - User Manual Verification 'Phase 13', "
       "protocol in workflow.md).")

EVIDENCE = (
    "  - Evidence (2026-11-16, phase acceptance, audited head 0b90be77, route "
    "opencode-go/mimo-v2.6-flash, family MiMo, other than GLM, Anthropic, MiniMax "
    "and Kimi): the verdict is pass, 0 blocking findings. `p13-testmap.txt` prints "
    "`findings: 0` (the 6 code files of the phase each have a test file; "
    "`schema.ts` holds a JSDoc change only; 1 cross-track exception is named with "
    "its coverage: `make-line-art-hair-fill.ts` of print commit e0350881, tested "
    "through `storytime-print-r6v2-fixes.test.ts` and `p9a-green-hair.txt`). "
    "`PROJECT_TESTS` exits 0 at HEAD with no R3 exclude (`p13-accept-project.txt`: "
    "Test Files 73 passed, Tests 1825 passed); `PROJECT_LINT` exits 0 "
    "(`p13-accept-lint.txt`); `PROJECT_CHECKS` exits 0 (`p13-accept-checks.txt`); "
    "the live check rows are in `p13-accept-checkrows.txt` (exit 0) and the "
    "AC13-1 to AC13-4 live commands in `p13-accept-ac-live.txt` (exit 0). "
    "`p13-acceptance.txt` holds one PASS line for each criterion AC13-1 to AC13-14 "
    "(exit 0). `p13-accept-handoff.txt`: `sha256sum -c --quiet MANIFEST.txt` exits 0 "
    "in each of the 7 folders (w01 r6, w02 to w07 r5). PM confirmation "
    "(plan.md line 618): \"The 7 package folders check OK against their MANIFEST "
    "hashes (PM read 01:1x).\" PM acceptance (plan.md line 617): \"w08: your default "
    "accepted, no w08 app package; the hand-off has 7 folders (w01 r6, w02-w07 r5), "
    "and the PM line says so.\" Owner answer (plan.md line 613): Daniel answered "
    "\"Approved\" on 2026-11-15 at 18:37 ICT for the 3 files of the PM item. "
    "Prerequisites: Review A round 2 pass (196dc950, 0 blockers), Packages Step B "
    "7 of 7 folders, and Phase 13 paths byte-unchanged from 196dc950 to 0b90be77 "
    "(only approval.* keys moved in the week files). Memory edits: "
    "`measure/tech-debt.md` holds 50 lines (row 47 items 2 and 3 updated, the two "
    "2026-11-16 loops rows merged into one, the heard-check row added because "
    "`p13-sentences-heard.txt` holds a `heard differs` line) and "
    "`measure/lessons-learned.md` holds 50 lines (the 2 lessons of this line merged "
    "into the 2026-11-13 lesson line as (3) and (4)). Captures: p13-testmap.txt, "
    "p13-accept-project.txt, p13-accept-lint.txt, p13-accept-checks.txt, "
    "p13-accept-checkrows.txt, p13-accept-ac-live.txt, p13-acceptance.txt, "
    "p13-accept-handoff.txt, p13-accept-gitstate.txt, p13-accept-memory.txt "
    "(the memory check), result phase-acceptance-p13-0b90be77.json."
)


def main():
    text = open(PLAN, encoding="utf-8").read()
    assert text.count(OLD) == 1, "task marker hits: %d" % text.count(OLD)
    assert EVIDENCE not in text, "evidence already present"
    thai_before = len(THAI.findall(text))
    text = text.replace(OLD, NEW, 1)
    # insert the Evidence sub-bullet right after the task's last sub-bullet
    anchor = ("  - The task writes these lessons into `measure/lessons-learned.md`. "
              "Each lesson is one line. When the file has more than 50 lines, the "
              "task merges a lesson into the nearest existing lesson and records "
              "the line count.")
    idx = text.find(anchor)
    assert idx != -1, "anchor not found"
    end = text.find("\n", idx)
    assert end != -1
    assert not THAI.search(EVIDENCE), "Thai in evidence line"
    text = text[:end + 1] + EVIDENCE + "\n" + text[end + 1:]
    thai_after = len(THAI.findall(text))
    assert thai_after == thai_before, "Thai count changed: %d -> %d" % (
        thai_before, thai_after)
    with open(PLAN, "w", encoding="utf-8") as fh:
        fh.write(text)
    print("plan.md: task line marked [x], Evidence sub-bullet inserted")
    print("thai chars unchanged: %d" % thai_after)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
