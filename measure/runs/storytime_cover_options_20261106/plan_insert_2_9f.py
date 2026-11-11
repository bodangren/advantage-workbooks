#!/usr/bin/env python3
"""Inserts the 2 Part 6 evidence lines under Task 2.9 of the plan (Task 2.9 part 6).

Track storytime_cover_options_20261106. The script inserts exactly 2 lines directly after the
`PM decision 2026-11-11: the A3 reader art prints at 242 ppi` line of Task 2.9, and before the line
of Task 2.10. It asserts the 2 neighbours first, so a moved anchor stops the run.

It also asserts the numbers of the run before the insert: `PASS_LINES=15` and `FAIL_LINES=0` in
`print-gate-2-9f.txt`, the old MANIFEST SHA-256 `34384529...`, and 85 lines with 37 changed lines in
the new MANIFEST. The table of the 37 old and new SHA-256 values comes from `manifest-old-2-9f.txt`
and `MANIFEST.txt`, in the order of the MANIFEST, and every pair must differ.

Usage: python3 -I -B plan_insert_2_9f.py

It prints the anchor line number, the table size, the inserted line count, and the new line count.
It writes no other line.
"""

import hashlib
import os

REPO = '/home/daniebo/Desktop/Workbooks'
PLAN = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/plan.md')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9f.txt')
GATE = os.path.join(RUNS, 'print-gate-2-9f.txt')
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')

ANCHOR = '  - PM decision 2026-11-11: the A3 reader art prints at 242 ppi'
AFTER = '- [ ] Task 2.10 (Look at every page)'
OLD_SHA = '34384529f605a733282e314540953bcb7c39f830076d0b323297f6b3d5b481b8'
NEW_SHA = '6cf6c806f56dde9787b23b462bbe06a35d4dd3c0e828d40be6899c3599a496f2'
EXPECTED_LINES = 85
EXPECTED_CHANGED = 37

LINE_1 = (
    '  - Part 6 readers r2b (2026-11-11, jr-green, model deepseek/deepseek-flash#high; role base '
    'c8c3312f; the Green code b78f8da3): one heavy-run build exits 0 on the first attempt and prints '
    '`Covers of Level 2 Unit 1 set 1: 32 pages, 44 files` with 4 lines `All checks pass.`. '
    '`copy_readers_2_9f.py` replaces the 34 reader files and `contact-2-9f.py` replaces the 3 '
    'sheets, and every old SHA-256 value matches the old MANIFEST before the write. '
    '34 of 34 copies equal the build output. '
    'The checks of `print-gate-2-9f.txt` give `PASS_LINES=15` and `FAIL_LINES=0`. '
    'C4 passes on both files: the A3 pages hold their title at least once, "Storytime Advantage" 0 '
    'times, and the band word 0 times; the leaf pages hold their title at least once and "Storytime '
    'Advantage" at least once on each of the 14 pages. '
    'The old MANIFEST SHA-256 is `34384529f605a733282e314540953bcb7c39f830076d0b323297f6b3d5b481b8`. '
    'The new MANIFEST holds 85 lines with SHA-256 '
    '`6cf6c806f56dde9787b23b462bbe06a35d4dd3c0e828d40be6899c3599a496f2`, its 48 book lines are '
    'byte-equal, and 37 lines changed. '
    'The table of the 37 old and new SHA-256 values is the next sub-line. '
    'Task 2.9 stays `[~]`. Evidence: automated.'
)


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


def table_line():
    """Returns the second line with the 37 old and new SHA-256 values in the MANIFEST order."""
    old_rows = {name: digest for name, digest, _size in read_rows(OLD_COPY)}
    entries = []
    for name, digest, _size in read_rows(MANIFEST):
        old_digest = old_rows.get(name)
        if old_digest is None:
            print('NEW_NAME ' + name)
            return None
        if old_digest == digest:
            continue
        entries.append('%s %s -> %s' % (name, old_digest, digest))
    print('TABLE_ENTRIES %d' % len(entries))
    if len(entries) != EXPECTED_CHANGED:
        return None
    return ('  - Part 6 replacement table (old -> new SHA-256): ' + '; '.join(entries)
            + '. Evidence: automated.')


def main():
    """Inserts the 2 lines after the 2 asserted neighbours."""
    gate_text = open(GATE, encoding='utf-8').read()
    gate_ok = 'PASS_LINES=15' in gate_text and 'FAIL_LINES=0' in gate_text
    print('GATE_LINES_OK %s' % str(gate_ok).lower())
    if not gate_ok:
        return 1
    old_digest = sha256(OLD_COPY)
    new_digest = sha256(MANIFEST)
    print('OLD_COPY_SHA256 ' + old_digest)
    print('OLD_COPY_SHA_EXPECTED %s' % str(old_digest == OLD_SHA).lower())
    print('NEW_MANIFEST_SHA256 ' + new_digest)
    print('NEW_MANIFEST_SHA_EXPECTED %s' % str(new_digest == NEW_SHA).lower())
    line_count = len(read_rows(MANIFEST))
    print('NEW_MANIFEST_LINES %d' % line_count)
    if old_digest != OLD_SHA or new_digest != NEW_SHA or line_count != EXPECTED_LINES:
        return 1
    appended = table_line()
    if appended is None:
        return 1

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
    if LINE_1 in lines or appended in lines:
        print('ALREADY_INSERTED true')
        return 1
    out = lines[:index + 1] + [LINE_1, appended] + lines[index + 1:]
    print('OLD_LINE_COUNT %d' % len(lines))
    print('NEW_LINE_COUNT %d' % len(out))
    print('INSERTED %d' % (len(out) - len(lines)))
    with open(PLAN, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
