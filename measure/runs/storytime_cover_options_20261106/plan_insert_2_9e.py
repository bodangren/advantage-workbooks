#!/usr/bin/env python3
"""Inserts the Part 5 evidence line under Task 2.9 of the plan (Task 2.9 part 5).

Track storytime_cover_options_20261106. The script inserts exactly 1 line directly after the
`PM order 2026-11-11` line of Task 2.9, and before the line of Task 2.10. It asserts the 2 neighbours
first, so a moved anchor stops the run.

Usage: python3 -I -B plan_insert_2_9e.py

It prints the anchor line numbers, the inserted line count, and the new line count. It writes no
other line.
"""

import os

PLAN = ('/home/daniebo/Desktop/Workbooks/measure/tracks/storytime_cover_options_20261106/'
        'plan.md')
ANCHOR = '  - PM order 2026-11-11, word for word: "PM: receipt received;'
AFTER = '- [ ] Task 2.10 (Look at every page)'

LINE = (
    '  - Part 5 readers r2 (2026-11-11, jr-green, model deepseek/deepseek-flash#high; role base '
    '295d6d5d; the Green code 75c847db): one heavy-run runs `cd dashboard && npx tsx '
    'scripts/storytime/make-storytime-quest-covers.ts --level 2 --unit 1 --version 1 --top hlogo '
    '--pictures-dir /tmp/opencode/c29e/pictures --print-ready-root /tmp/opencode/c29e/pr --print`; '
    'it exits 0 on the first attempt and prints `Covers of Level 2 Unit 1 set 1: 32 pages, 44 files` '
    'with 4 lines `All checks pass.`. '
    'The pictures folder `/tmp/opencode/c29e/pictures/` holds 31 files: 29 hard links with 29 of 29 '
    'equal SHA-256 pairs and the same inode, the edge-filled back '
    '`881e93b2a87385eb15e5cf0240df8629c501a10f0375284f9cec2fe09eda37c4` (its source keeps '
    '`5411e37ec7044d7afd70726ee5fffeccd985225ef0b0da4283db8e6a3979b7bf`), and the prepared teacher '
    'front `0901411875407c09bd69e779f5aad31b36147d84d0e742feee6316712bf96283`. '
    '`copy_readers_2_9e.py` copies 34 files as byte copies into `readers-a3/` and `readers-leaf/` of '
    '`covers-quest-v1`, with 34 of 34 pairs equal; the 4 book PNGs equal the shipped r2 files and '
    'the 4 book PDFs differ. '
    'The checks of `print-gate-2-9e.txt` give `PASS_LINES=14` and `FAIL_LINES=1`: C1 exits 0 on both '
    'files with 1 line `All checks pass.` each; C2 holds 14 pages each, A3 420.20 x 297.01 mm, leaf '
    '197.95 x 148.51 mm, and a TrimBox delta of 0.000 pt. '
    'C3 holds 2 fonts on the A3 file and 3 on the leaf file, all embedded, with 0 Type 3; C5 '
    '(information) holds 4000 x 3000 px at 242.0 ppi and 2337 x 1753 px at 300.0 ppi; C7 holds C, M, '
    'and Y at 0.00000 on all 14 leaf pages; C9 holds 14 page rows and 0 fail rows in both reports. '
    'C10 holds the 3 approved prefixes and an empty `git status` path list, and C16 holds the 8 '
    'pinned SHA-256 values. '
    'C4 PASS on the A3 file: each page holds its title once, "Storytime Advantage" 0 times, and the '
    'band word 0 times (the D6 proof). '
    'C4 FAIL on the leaf file: "Storytime Advantage" reads 0 times on 13 of 14 pages, because the '
    'series box of 30 mm at 9 pt wraps the name and the second word falls to the page edge (captures '
    '`leaf-series-counts-2-9e.txt` and `leaf-series-ink-2-9e.txt`). '
    'The 3 sheets are `readers-a3.png` 7154 x 1658 px, `readers-leaf.png` 6755 x 1658 px, and '
    '`all.png` 3648 x 5698 px; `MANIFEST.txt` holds 85 lines with SHA-256 '
    '`34384529f605a733282e314540953bcb7c39f830076d0b323297f6b3d5b481b8`, and its 48 old lines are '
    'byte-equal. '
    'A new Red and Green pair fixes the leaf series line; the 17 leaf files, '
    '`contact-sheets/readers-leaf.png`, and `contact-sheets/all.png` are then replaced, with the old '
    'and new SHA-256 values in the plan. Task 2.9 stays `[~]`. Evidence: automated.'
)


def main():
    """Inserts the line after the 2 asserted neighbours."""
    text = open(PLAN, encoding='utf-8').read()
    lines = text.splitlines()
    anchors = [index for index, item in enumerate(lines) if item.startswith(ANCHOR)]
    print('ANCHOR_LINES %d' % len(anchors))
    if len(anchors) != 1:
        return 1
    index = anchors[0]
    print('ANCHOR_LINE %d' % (index + 1))
    print('NEXT_LINE_OK %s' % str(lines[index + 1].startswith(AFTER)).lower())
    if not lines[index + 1].startswith(AFTER):
        return 1
    if LINE in lines:
        print('ALREADY_INSERTED true')
        return 1
    out = lines[:index + 1] + [LINE] + lines[index + 1:]
    print('OLD_LINE_COUNT %d' % len(lines))
    print('NEW_LINE_COUNT %d' % len(out))
    print('INSERTED %d' % (len(out) - len(lines)))
    with open(PLAN, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
