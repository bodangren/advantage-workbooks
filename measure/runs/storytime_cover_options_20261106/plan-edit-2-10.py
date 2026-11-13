#!/usr/bin/env python3
"""Applies the plan.md edits of the Task 2.9 close and Task 2.10 (track storytime_cover_options).

Each edit must match exactly one line. The script exits 1 and writes nothing when a check fails.
Usage: python3 -I -B plan-edit-2-10.py
"""

import sys

PLAN = '/home/daniebo/Desktop/Workbooks/measure/tracks/storytime_cover_options_20261106/plan.md'

TASK_29_OLD = '- [~] Task 2.9 (Print build):'
TASK_29_NEW = '- [x] Task 2.9 (Print build):'
TASK_29_END = ' Evidence: automated'
TASK_29_SHA = ' commit 007b763'
PART12_TABLE = '  - Part 12 replacement table (old -> new SHA-256):'

TASK_210_OLD = '- [ ] Task 2.10 (Look at every page):'
TASK_210_NEW = '- [x] Task 2.10 (Look at every page):'
TASK_210_END = ' Evidence: person-checked'
TASK_210_SHA = ' commit 3875c04'

EVIDENCE_29 = (
    '  - Close of Task 2.9 (2026-11-13, jr-green, route claude-code/claude-sonnet-5-5#high, no coder; '
    'role base a975d755). `print-gate.txt` ends with PASS_LINES=45 and FAIL_LINES=0. Deviation D-3 '
    'applies: the fast gate is the existence of the named print files and the 5 named sheets. The '
    'capture `fast-gate-2-9-named.txt` (commit 3875c049) shows that 9 of 9 named files exist: the 4 '
    'print files `_PDFX-1a.pdf` (student r5, teacher r5, readers-a3, readers-leaf) and the 5 sheets '
    '`all.png`, `readers-a3.png`, `readers-leaf.png`, `student-alt-hlogo-r5.png`, and '
    '`teacher-alt-hlogo-r5.png`. The raw counts of the plan fast gate are 14 print files and 21 '
    'contact sheets. They are information for D-3 only, because the folder keeps the older book '
    'variants for the record. The 4 print-check mutants of `test-strategy.md` section 4.10 are in '
    '`print-mutants-2-9h.txt` (MUTANTS_CAUGHT=4). The precondition holds: Task 2.8 is `[x]` in '
    'commit cfd21e65. The MANIFEST SHA-256 is 8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87 '
    '(8f1901a3). The build of part 12 is commit 007b7636. Evidence: automated.'
)

EVIDENCE_210 = (
    '  - Look result (2026-11-13): the orchestrator (claude-code/claude-opus-5-5[1m]) checked the 32 '
    'pages at HEAD a975d755, and `look-phase2.md` holds 32 pass lines and 0 fault lines. The 3 gates '
    'print 32, 0 (grep exits 1, as expected for a count of 0), and 32. The capture is '
    '`measure/runs/storytime_cover_options_20261106/look-phase2-gates.txt` (commit 3875c049). The '
    'MANIFEST SHA-256 is 8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87. '
    'Evidence: person-checked.'
)


def only(lines, prefix):
    """Returns the index of the one line that starts with the prefix."""
    found = [i for i, line in enumerate(lines) if line.startswith(prefix)]
    if len(found) != 1:
        print('FAIL: %d matches for %r' % (len(found), prefix))
        sys.exit(1)
    return found[0]


def main():
    """Applies the edits and prints the changed line numbers."""
    with open(PLAN, encoding='utf-8') as handle:
        text = handle.read()
    lines = text.split('\n')
    i29 = only(lines, TASK_29_OLD)
    i210 = only(lines, TASK_210_OLD)
    ipart12 = only(lines, PART12_TABLE)
    if not lines[i29].endswith(TASK_29_END) or not lines[i210].endswith(TASK_210_END):
        print('FAIL: a task line does not end as expected')
        sys.exit(1)
    if ipart12 + 1 != i210:
        print('FAIL: the part 12 table line is not directly before Task 2.10')
        sys.exit(1)
    lines[i29] = TASK_29_NEW + lines[i29][len(TASK_29_OLD):] + TASK_29_SHA
    lines[i210] = TASK_210_NEW + lines[i210][len(TASK_210_OLD):] + TASK_210_SHA
    out = lines[:ipart12 + 1] + [EVIDENCE_29] + [lines[i210], EVIDENCE_210] + lines[i210 + 1:]
    with open(PLAN, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out))
    print('TASK_29_LINE', i29 + 1)
    print('EVIDENCE_29_LINE', ipart12 + 2)
    print('TASK_210_LINE', ipart12 + 3)
    print('EVIDENCE_210_LINE', ipart12 + 4)


main()
