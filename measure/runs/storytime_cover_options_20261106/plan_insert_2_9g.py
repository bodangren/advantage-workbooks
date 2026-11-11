#!/usr/bin/env python3
"""Inserts the 3 Part 7 evidence lines under Task 2.9 of the plan (Task 2.9 part 7).

Track storytime_cover_options_20261106. The script inserts exactly 3 lines directly after the line
that starts with `  - Part 6 replacement table (old -> new SHA-256):`, and before the line of
Task 2.10. It asserts the neighbour first, so a moved anchor stops the run.

It also asserts the numbers of the run before the insert: the build capture exits 0 with the 2 build
strings, the print gate holds `FAIL_LINES=0` and 4 lines `All checks pass.`, the old MANIFEST SHA-256
is `6cf6c806...` with 85 lines, and the new MANIFEST holds 97 lines with 37 changed lines and 12 new
lines. The table of the 37 old and new SHA-256 values comes from `manifest-old-2-9g.txt` and
`MANIFEST.txt`, in the order of the MANIFEST, and every pair must differ. The table of the 12 new
files comes from `MANIFEST.txt`. The 6 full-size pages of the standing order of 2026-11-11 go into
the first line with their pixel size and their SHA-256.

Usage: python3 -I -B plan_insert_2_9g.py

It prints the anchor line number, the table sizes, the inserted line count, and the new line count.
It writes no other line.
"""

import hashlib
import os

from PIL import Image

REPO = '/home/daniebo/Desktop/Workbooks'
PLAN = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/plan.md')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9g.txt')
GATE = os.path.join(RUNS, 'print-gate-2-9g.txt')
BUILD = os.path.join(RUNS, 'build-2-9g.txt')
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')

ANCHOR = '  - Part 6 replacement table (old -> new SHA-256):'
AFTER = '- [ ] Task 2.10 (Look at every page)'
OLD_SHA = '6cf6c806f56dde9787b23b462bbe06a35d4dd3c0e828d40be6899c3599a496f2'
OLD_LINES = 85
NEW_LINES = 97
EXPECTED_CHANGED = 37
EXPECTED_NEW = 12

PAGES = [
    'student/front-alt-hlogo-r3.png',
    'student/back-alt-hlogo-r3.png',
    'teacher/teacher-front-alt-hlogo-r3.png',
    'teacher/teacher-back-alt-hlogo-r3.png',
    'readers-a3/l2-w04-my-family-a3-cover.png',
    'readers-leaf/l2-w05-sam-and-pam-leaf-cover.png',
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read_rows(path):
    """Returns one row per manifest line: the name, the SHA-256, and the byte size."""
    rows = []
    with open(path, encoding='utf-8') as handle:
        for line in handle.read().splitlines():
            parts = line.split('  ')
            if len(parts) != 3:
                continue
            rows.append((parts[2], parts[0], parts[1]))
    return rows


def pages_text():
    """Returns the 6 full-size page entries with the size and the SHA-256."""
    entries = []
    for rel in PAGES:
        path = os.path.join(HANDOFF, rel)
        if not os.path.exists(path):
            print('PAGE_MISSING ' + rel)
            return None
        with Image.open(path) as image:
            width, height = image.size
        entries.append('%s %dx%d px %s' % (rel, width, height, sha256(path)))
    print('PAGE_ENTRIES %d' % len(entries))
    return '; '.join(entries)


def sheet_text():
    """Returns the 5 contact sheet entries with the size and the SHA-256."""
    names = ['readers-a3.png', 'readers-leaf.png', 'all.png',
             'student-alt-hlogo-r3.png', 'teacher-alt-hlogo-r3.png']
    entries = []
    for name in names:
        rel = 'contact-sheets/' + name
        path = os.path.join(HANDOFF, rel)
        if not os.path.exists(path):
            print('SHEET_MISSING ' + rel)
            return None
        with Image.open(path) as image:
            width, height = image.size
        entries.append('%s %dx%d px %s' % (rel, width, height, sha256(path)))
    print('SHEET_ENTRIES %d' % len(entries))
    return '; '.join(entries)


def main():
    """Inserts the 3 lines after the asserted neighbour."""
    gate_text = open(GATE, encoding='utf-8').read()
    gate_ok = 'FAIL_LINES=0' in gate_text and 'PASS_LINES=' in gate_text
    print('GATE_LINES_OK %s' % str(gate_ok).lower())
    if not gate_ok:
        return 1
    build_text = open(BUILD, encoding='utf-8').read()
    build_ok = ('HEAVY_EXIT: 0' in build_text
                and 'Covers of Level 2 Unit 1 set 1: 32 pages, 44 files' in build_text
                and build_text.count('All checks pass.') == 4)
    print('BUILD_LINES_OK %s' % str(build_ok).lower())
    if not build_ok:
        return 1

    old_digest = sha256(OLD_COPY)
    new_digest = sha256(MANIFEST)
    print('OLD_COPY_SHA256 ' + old_digest)
    print('OLD_COPY_SHA_EXPECTED %s' % str(old_digest == OLD_SHA).lower())
    print('NEW_MANIFEST_SHA256 ' + new_digest)
    old_rows = read_rows(OLD_COPY)
    new_rows = read_rows(MANIFEST)
    print('OLD_MANIFEST_LINES %d' % len(old_rows))
    print('NEW_MANIFEST_LINES %d' % len(new_rows))
    if old_digest != OLD_SHA or len(old_rows) != OLD_LINES or len(new_rows) != NEW_LINES:
        return 1

    old_by_name = {name: digest for name, digest, _size in old_rows}
    changed_entries, new_entries = [], []
    for name, digest, _size in new_rows:
        old_digest_of = old_by_name.get(name)
        if old_digest_of is None:
            new_entries.append('%s %s' % (name, digest))
        elif old_digest_of != digest:
            changed_entries.append('%s %s -> %s' % (name, old_digest_of, digest))
    print('TABLE_ENTRIES %d' % len(changed_entries))
    print('NEW_ENTRIES %d' % len(new_entries))
    if len(changed_entries) != EXPECTED_CHANGED or len(new_entries) != EXPECTED_NEW:
        return 1

    page_line = pages_text()
    sheet_line = sheet_text()
    if page_line is None or sheet_line is None:
        return 1

    line_1 = (
        '  - Part 7 readers r2c and the standing cover rules (2026-11-11, jr-green, model '
        'deepseek/deepseek-flash#high; role base 0a287f67; the Green code 2aed3e09): one heavy-run '
        'build exits 0 on the first attempt and prints `Covers of Level 2 Unit 1 set 1: 32 pages, '
        '44 files` with 4 lines `All checks pass.`. The build runs with 31 pictures: 29 hard links '
        '(the student front and the 28 reader art files), the edge-filled back '
        '`881e93b2a87385eb15e5cf0240df8629c501a10f0375284f9cec2fe09eda37c4` from the source '
        '`5411e37ec7044d7afd70726ee5fffeccd985225ef0b0da4283db8e6a3979b7bf`, and the prepared '
        'teacher front `0901411875407c09bd69e779f5aad31b36147d84d0e742feee6316712bf96283`. '
        '`copy_readers_2_9g.py` replaces the 34 reader files and `contact-2-9g.py` replaces the 3 '
        'sheets, and every old SHA-256 value matches the old MANIFEST before the write; 34 of 34 '
        'copies equal the build output. `copy_2_9g.py` writes the 10 r3 book files as byte copies '
        'with 10 of 10 SHA-256 pairs equal, and the r2 files, the r5 files, and the old `-alt-hlogo` '
        'files stay untouched. The checks of `print-gate-2-9g.txt` give `FAIL_LINES=0`: '
        '`PRINT_GATE` exits 0 on the 4 print files with `All checks pass.`; the band word `sprout` '
        'occurs 0 times on each page of the A3 file and of the leaf file; "Storytime Advantage" '
        'occurs at least once on each of the 14 leaf pages; and page 1 of the r3 teacher file holds '
        '`sprout` 0 times. The 5 sheets are ' + sheet_line + '. The old MANIFEST SHA-256 is '
        '`6cf6c806f56dde9787b23b462bbe06a35d4dd3c0e828d40be6899c3599a496f2` with 85 lines. The new '
        'MANIFEST holds 97 lines with SHA-256 `' + new_digest + '`; its 48 unchanged lines are '
        'byte-equal, 37 lines changed, and 12 lines are new. The 6 full-size pages of the standing '
        'order of 2026-11-11 are ' + page_line + '. '
        'Task 2.9 stays `[~]`. Evidence: automated.'
    )
    line_2 = ('  - Part 7 replacement table (old -> new SHA-256): ' + '; '.join(changed_entries)
              + '. Evidence: automated.')
    line_3 = ('  - Part 7 new files (SHA-256): ' + '; '.join(new_entries)
              + '. Evidence: automated.')

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
    if line_1 in lines or line_2 in lines or line_3 in lines:
        print('ALREADY_INSERTED true')
        return 1
    out = lines[:index + 1] + [line_1, line_2, line_3] + lines[index + 1:]
    print('OLD_LINE_COUNT %d' % len(lines))
    print('NEW_LINE_COUNT %d' % len(out))
    print('INSERTED %d' % (len(out) - len(lines)))
    with open(PLAN, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
