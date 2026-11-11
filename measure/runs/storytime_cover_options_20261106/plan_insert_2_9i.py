#!/usr/bin/env python3
"""Inserts the 3 Part 9 evidence lines under Task 2.9 of the plan (Task 2.9 part 9).

Track storytime_cover_options_20261106. The script inserts exactly 3 lines directly after the last
Part 7 sub-line of Task 2.9, which starts with `  - Part 7 new files (SHA-256):`, and before the line
of Task 2.10. It asserts the neighbour first, so a moved anchor stops the run.

It also asserts the numbers of the run before the insert: the build capture exits 0 with the 2 build
strings and 4 lines `All checks pass.`; the final check log holds `PASS_LINES=43` and `FAIL_LINES=0`;
the old MANIFEST SHA-256 is `64a8dd2f...` with 97 lines, and the new MANIFEST holds 114 lines with 37
changed lines and 17 new lines. The table of the 37 old and new SHA-256 values comes from
`manifest-old-2-9i.txt` and `MANIFEST.txt`, in the order of the MANIFEST, and every pair must differ.
The table of the 17 new files and the 5 sheets and the 8 full-size pages of the standing order of
2026-11-11 come from `MANIFEST.txt` and the hand-off folder.

Usage: python3 -I -B plan_insert_2_9i.py

It prints the anchor line number, the table sizes, the inserted line count, and the new line count.
It writes no other line.
"""

import hashlib
import os

from PIL import Image

REPO = '/home/daniebo/Desktop/Workbooks'
PLAN = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/plan.md')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9i.txt')
GATE = os.path.join(RUNS, 'print-gate.txt')
BUILD = os.path.join(RUNS, 'build-2-9i.txt')
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')

ANCHOR = '  - Part 7 new files (SHA-256):'
AFTER = '- [ ] Task 2.10 (Look at every page)'
OLD_SHA = '64a8dd2f03787668679d0f226d496e4d3eacc73b71e002add4cef4d8d6448407'
OLD_LINES = 97
NEW_LINES = 114
EXPECTED_CHANGED = 37
EXPECTED_NEW = 17
PASS_LINES = 43

PAGES = [
    'student/front-alt-hlogo-r4.png',
    'student/back-alt-hlogo-r4.png',
    'teacher/teacher-front-alt-hlogo-r4.png',
    'teacher/teacher-back-alt-hlogo-r4.png',
    'readers-a3/l2-w01-hello-a3-cover.png',
    'reader-back-r4/l2-w01-hello-a3-page12.png',
    'readers-leaf/l2-w01-nan-can-nod-leaf-cover.png',
    'reader-back-r4/l2-w01-nan-can-nod-leaf-page12.png',
]

SHEETS = ['readers-a3.png', 'readers-leaf.png', 'all.png',
          'student-alt-hlogo-r4.png', 'teacher-alt-hlogo-r4.png']


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


def entries(names):
    """Returns one entry per relative file: the name, the pixel size, and the SHA-256."""
    out = []
    for rel in names:
        path = os.path.join(HANDOFF, rel)
        if not os.path.exists(path):
            print('FILE_MISSING ' + rel)
            return None
        with Image.open(path) as image:
            width, height = image.size
        out.append('%s %dx%d px %s' % (rel, width, height, sha256(path)))
    print('ENTRIES %d' % len(out))
    return '; '.join(out)


def main():
    """Inserts the 3 lines after the asserted neighbour."""
    gate_text = open(GATE, encoding='utf-8').read()
    gate_ok = ('FAIL_LINES=0' in gate_text and ('PASS_LINES=%d' % PASS_LINES) in gate_text
               and 'CHECK_12_READER_BACK:' in gate_text and 'CHECK_12_READER_BACK: workbook gate '
               'exit=0' in gate_text)
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

    page_line = entries(PAGES)
    sheet_line = entries(['contact-sheets/' + name for name in SHEETS])
    if page_line is None or sheet_line is None:
        return 1

    line_1 = (
        '  - Part 9 rebuild after F1 F2 (2026-11-11, jr-green, model '
        'deepseek/deepseek-flash#high; role base 440a64dc; the Green code 23f746a4): one heavy-run '
        'build exits 0 on the first attempt and prints `Covers of Level 2 Unit 1 set 1: 32 pages, '
        '44 files` with 4 lines `All checks pass.`. The build runs with 31 pictures: 29 hard links '
        '(the student front and the 28 reader art files), the edge-filled back '
        '`881e93b2a87385eb15e5cf0240df8629c501a10f0375284f9cec2fe09eda37c4` from the source '
        '`5411e37ec7044d7afd70726ee5fffeccd985225ef0b0da4283db8e6a3979b7bf`, and the prepared '
        'teacher front `0901411875407c09bd69e779f5aad31b36147d84d0e742feee6316712bf96283`. '
        '`copy_readers_2_9i.py` replaces the 34 reader files with `REPLACED 34` and `PAIR_EQUAL 34`, '
        'and every old SHA-256 value matches the old MANIFEST before the write. `copy_2_9i.py` '
        'writes the 10 r4 book files with `COPIES 10`, `SHA_PAIRS_EQUAL 10`, and `GUARDS_OK 10`; the '
        '2 r4 back PNGs equal the 2 r3 back PNGs (`9f5b588f...` and `ad6c3335...`), so G4 holds. '
        'The 2 reader back files of page 12 are built with `--a3-color` and `--workbook` into '
        '`reader-back-r4/`: 2 A3 files of 12 pages at 420.20 x 297.01 mm and 1 workbook PDF/X file '
        'of 12 pages of 209.89 x 297.01 mm. Page 12: on the hello A3 file "Words in this book" '
        'occurs 1 time and the band word 0 times; the workbook leaf page 7 holds page 12 (the '
        'BOTTOM half, chosen by the rule `with-nan-can-nod`) and page 1 (the TOP half); the page 12 '
        'half holds the phrase 1 time and the band word 0 times. The workbook leaf holds page 12 and '
        'page 1; the page 12 rule reads the page 12 half; page 1 of the print_r1 reader template '
        'still prints the band word, outside this fix. The old build of 2026-11-11 (6 pages) holds '
        'the phrase on page 3 with the band word 2 times on the whole page, and the new build holds '
        'it 1 time on the whole page. The ink coverage of the workbook file: C, M, and Y at 0.00000 on each '
        'of the 12 pages. The page 12 PNGs are 4963x3508 px `13cbdfd3...` and 2479x3508 px '
        '`7fe62a54...`. The 5 sheets: ' + sheet_line + '. The old MANIFEST SHA-256 is '
        '`64a8dd2f03787668679d0f226d496e4d3eacc73b71e002add4cef4d8d6448407` with 97 lines. The new '
        'MANIFEST holds 114 lines with SHA-256 `' + new_digest + '`; 60 lines are byte-equal (the 48 '
        'lines of part 7 and the 12 r3 lines of part 7), 37 lines changed, and 17 lines are new; '
        '`sha256sum -c` on the 2-column projection gives 114 OK and 0 FAILED. The final check log '
        '`print-gate.txt` gives `PASS_LINES=43` and `FAIL_LINES=0`, with 4 lines `All checks pass.` '
        'on the 4 book variants (r2 and r4) and `CHECK_12_READER_BACK` PASS. The 8 full-size pages '
        'of the standing order of 2026-11-11 are ' + page_line + '. '
        'Task 2.9 stays `[~]`. Evidence: automated.'
    )
    line_2 = ('  - Part 9 replacement table (old -> new SHA-256): ' + '; '.join(changed_entries)
              + '. Evidence: automated.')
    line_3 = ('  - Part 9 new files (SHA-256): ' + '; '.join(new_entries)
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
