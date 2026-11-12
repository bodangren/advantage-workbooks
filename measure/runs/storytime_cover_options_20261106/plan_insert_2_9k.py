#!/usr/bin/env python3
"""Inserts the 2 Part 11 evidence lines under Task 2.9 of the plan (Task 2.9 part 11).

Track storytime_cover_options_20261106. The script inserts exactly 2 lines directly after the last
Part 10 sub-line of Task 2.9, which starts with `  - Part 10 new files (SHA-256):`, and before the
line of Task 2.10. It asserts the neighbour first, so a moved anchor stops the run.

It also asserts the numbers of the run before the insert: the build capture exits 0 with the 2 build
strings and 4 lines `All checks pass.`; the edge check captures hold the numbers of the plan line;
the final check log holds `PASS_LINES=44` and `FAIL_LINES=1` with CHECK_13 PASS and CHECK_14 as the
only FAIL line; the old MANIFEST SHA-256 is `f8c0377e...` with 131 lines, and the new MANIFEST holds
131 lines with 11 changed lines and 0 new lines. The table of the 11 old and new SHA-256 values comes
from `manifest-old-2-9k.txt` and `MANIFEST.txt`, in the order of the MANIFEST, and every pair must
differ. The 8 full-size pages and the 5 sheets come from the hand-off folder.

Usage: python3 -I -B plan_insert_2_9k.py

It prints the anchor line number, the table sizes, the inserted line count, and the new line count.
It writes no other line.
"""

import hashlib
import os

from PIL import Image

REPO = '/home/daniebo/Desktop/Workbooks'
PLAN = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/plan.md')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9k.txt')
GATE = os.path.join(RUNS, 'print-gate.txt')
BUILD = os.path.join(RUNS, 'build-2-9k.txt')
EDGE_BEFORE = os.path.join(RUNS, 'edge-before-2-9k.txt')
EDGE_AFTER = os.path.join(RUNS, 'edge-after-2-9k.txt')
EDGE_P1_BOX_BEFORE = os.path.join(RUNS, 'edge-page1-box-before-2-9k.txt')
EDGE_P1_BOX_AFTER = os.path.join(RUNS, 'edge-page1-box-after-2-9k.txt')
COMPARE = os.path.join(RUNS, 'compare-2-9k.txt')
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')

ANCHOR = '  - Part 10 new files (SHA-256):'
AFTER = '- [ ] Task 2.10 (Look at every page)'
OLD_SHA = 'f8c0377ec34f333f062bb96800f51e206f4d075b8f10241b3435126cf2ccec41'
NEW_SHA = '288d84782a6dfa0faaf60c95b83e3006094691be7d181a5eb75291a2a54f994b'
OLD_LINES = 131
NEW_LINES = 131
EXPECTED_CHANGED = 11
PASS_LINES = 44
FAIL_LINES = 1

PAGES = [
    'student/front-alt-hlogo-r5.png',
    'student/back-alt-hlogo-r5.png',
    'teacher/teacher-front-alt-hlogo-r5.png',
    'teacher/teacher-back-alt-hlogo-r5.png',
    'readers-a3/l2-w01-hello-a3-cover.png',
    'reader-back-r5/l2-w01-hello-a3-page12.png',
    'readers-leaf/l2-w01-nan-can-nod-leaf-cover.png',
    'reader-back-r5/l2-w01-nan-can-nod-leaf-page12.png',
]

SHEETS = ['readers-a3.png', 'readers-leaf.png', 'all.png',
          'student-alt-hlogo-r5.png', 'teacher-alt-hlogo-r5.png']


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


def has(path, *needles):
    """Returns True when the file holds every needle."""
    text = open(path, encoding='utf-8').read()
    return all(needle in text for needle in needles)


def main():
    """Inserts the 2 lines after the asserted neighbour."""
    gate_text = open(GATE, encoding='utf-8').read()
    fail_rows = [row for row in gate_text.splitlines() if row.endswith(', FAIL')]
    gate_ok = (('PASS_LINES=%d' % PASS_LINES) in gate_text
               and ('FAIL_LINES=%d' % FAIL_LINES) in gate_text
               and len(fail_rows) == 1 and fail_rows[0].startswith('CHECK_14_READER_PAGE1_FILL:')
               and any(row.startswith('CHECK_13_EDGE_WHITE:') and row.endswith(', PASS')
                       for row in gate_text.splitlines())
               and 'CHECK_12_READER_BACK: workbook gate exit=0' in gate_text
               and ('MANIFEST_SHA256_START ' + NEW_SHA) in gate_text
               and ('MANIFEST_SHA256_END ' + NEW_SHA) in gate_text)
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
    edge_ok = (has(EDGE_BEFORE, 'top=100 bottom=82', 'white_edge_rows=182', 'd4e04a3f')
               and has(EDGE_AFTER, 'WHITE_EDGE_ROWS_TOTAL 0', 'WHITE_EDGE_COLS_TOTAL 42',
                       'FILES 14')
               and has(EDGE_P1_BOX_BEFORE, 'top=31', 'white_edge_rows=31')
               and has(EDGE_P1_BOX_AFTER, 'WHITE_EDGE_ROWS_TOTAL 0', 'WHITE_EDGE_COLS_TOTAL 0',
                       'FILES 2')
               and has(COMPARE, 'A3_OTHER_EQUAL 13 of 13', 'LEAF_EQUAL 14 of 14',
                       'BOOK_EQUAL 4 of 4', 'HELLO_A3_DIFFERS true', 'COMPARE_OK true'))
    print('EDGE_LINES_OK %s' % str(edge_ok).lower())
    if not edge_ok:
        return 1

    old_digest = sha256(OLD_COPY)
    new_digest = sha256(MANIFEST)
    print('OLD_COPY_SHA256 ' + old_digest)
    print('OLD_COPY_SHA_EXPECTED %s' % str(old_digest == OLD_SHA).lower())
    print('NEW_MANIFEST_SHA256 ' + new_digest)
    print('NEW_MANIFEST_SHA_EXPECTED %s' % str(new_digest == NEW_SHA).lower())
    old_rows = read_rows(OLD_COPY)
    new_rows = read_rows(MANIFEST)
    print('OLD_MANIFEST_LINES %d' % len(old_rows))
    print('NEW_MANIFEST_LINES %d' % len(new_rows))
    if (old_digest != OLD_SHA or new_digest != NEW_SHA or len(old_rows) != OLD_LINES
            or len(new_rows) != NEW_LINES):
        return 1

    old_by_name = {name: digest for name, digest, _size in old_rows}
    changed_entries, new_entries = [], []
    for name, digest, _size in new_rows:
        old_digest_of = old_by_name.get(name)
        if old_digest_of is None:
            new_entries.append(name)
        elif old_digest_of != digest:
            changed_entries.append('%s %s -> %s' % (name, old_digest_of, digest))
    print('TABLE_ENTRIES %d' % len(changed_entries))
    print('NEW_ENTRIES %d' % len(new_entries))
    if len(changed_entries) != EXPECTED_CHANGED or new_entries:
        return 1

    page_line = entries(PAGES)
    sheet_line = entries(['contact-sheets/' + name for name in SHEETS])
    if page_line is None or sheet_line is None:
        return 1

    line_1 = (
        '  - Part 11 A3 rebuild after F7 (2026-11-13, jr-green, model '
        'claude-code/claude-sonnet-5-5#high, no coder; role base ca28008a; the Green F7 code '
        '310ad128; the Red model of F7 is opencode/minimax-m3.1-flash-free#high): one heavy-run '
        'build exits 0 on the first attempt (7 min 15 s) and prints `Covers of Level 2 Unit 1 set 1: '
        '32 pages, 44 files` with 4 lines `All checks pass.`. The 31 pictures equal part 10 (29 hard '
        'links with `SHA_PAIRS_EQUAL 29` and `INODE_PAIRS_EQUAL 29`, the back `881e93b2...`, the '
        'teacher front `09014118...`). The filled copy '
        '`/tmp/storytime-art-edge-fill/99ee1b8d1fe0e9ad-l2-w01-cover-hello-v1.png` (SHA-256 '
        '`e0b8dc48adaeea48e07023e6b0f5ae39f70422bb040f65af4012e010e874e79f`) has a modification '
        'time after the build start. Edge check `edge_white_2_9k.py` (a white row or column holds '
        'only pixels with R, G, and B at 250 or more; every pixel sampled): the old hand-off A3 '
        'cover of w01-1 `d4e04a3f...` holds 182 white edge rows (top 100, bottom 82), so the check '
        'catches F7; the new one `6b42938e...` holds 0, and the 14 new A3 PNGs hold 0 white edge '
        'rows. D-P11-1 (orchestrator): the 3 right columns (x 4958 to 4960, pure white) are in all '
        '14 PNGs and in the 13 unchanged ones; they are the Chrome sub-pixel seam of 0.25 mm, the '
        'same seam as the accepted F7-6 rule, so for the 14 A3 PNGs CHECK_13 counts rows with no '
        'pixel ignored and columns with the outermost 3 px of each side ignored; the raw count '
        '(42) is information. The 13 other A3 PNGs, the 14 leaf PNGs, and the 4 r5 book PNGs are '
        'byte-equal to the part 10 MANIFEST, and the w01-1 A3 PNG differs (`COMPARE_OK true`). '
        '`copy_readers_2_9k.py` replaces the 34 reader files (`REPLACED 34`, `PAIR_EQUAL 34`); each '
        'old SHA-256 matched its MANIFEST line before the write. The reader back A3 build '
        '(`make-readers-pdf.ts --a3-color`, 1 attempt, exit 0, 1 min 04 s) accepts only an output '
        'folder inside `~/Desktop/print-ready/storytime/`, so it wrote into the scratch folder '
        '`~/Desktop/print-ready/storytime/_scratch-c29k/reader-back/` (it stays in place; the 2 '
        'PDFs are the sources of the copy). Page 1 of the 2 new A3 files, in the cover box '
        '(780 x 585 px at 100 ppi, 2 px ignored on each side of the box), holds 0 white edge rows '
        'and 0 white edge columns; the old hello file holds 31 white rows at the top of the box. '
        'Page 12 (`page12_2_9k.py`, `PAGE12_OK true`) equals part 10: the hello page 12 PNG '
        '4963x3508 px is byte-equal to `15e56a3f...`. The 2 A3 files replace the old ones with the '
        'old-SHA guard. Sheets: `readers-a3.png` and `all.png` are replaced; `readers-leaf.png` '
        'stays byte-equal. MANIFEST: old `' + OLD_SHA + '` with 131 lines; new `' + new_digest
        + '` with 131 lines, 0 new names, 0 removed names, 120 byte-equal lines, 11 changed lines '
        '(the 4 planned names, plus the 7 PDF and report files of `readers-a3/`, `readers-leaf/`, '
        'and the nan-can-nod A3 file); `sha256sum -c` gives 131 OK and 0 FAILED. Final check log '
        '`print-gate.txt`: `PASS_LINES=44` and `FAIL_LINES=1`, `MANIFEST_SHA256_START` equal to '
        '`END`, CHECK_1 to CHECK_12 byte-equal to part 10 (helper region 254 lines, check region '
        '331 lines, `CHECK_FUNCTIONS_BYTE_EQUAL true`). CHECK_13_EDGE_WHITE PASS (the F7 scope). '
        'CHECK_14_READER_PAGE1_FILL is the only FAIL line (D-P11-2): whole page 1 of the 2 A3 files '
        'at 100 ppi with 2 px ignored holds 1166 white edge rows and 1746 white edge columns; reason '
        '"F8 open: the cover is clipped to the leaf box". Information line INFO_13: page 1 of '
        '`readers-a3/Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf` at 150 ppi '
        '(2478x1750 px, 2 px ignored) holds 0 white edge rows and 0 white edge columns. F8 (open): '
        'page 1 of the A3 readers shows only the top-left 198 x 148.5 mm of the A3 cover, with no '
        'title plaque and no logo, and the rest of the sheet is white while pages 2 and 12 fill the '
        'sheet; the cause is `readers.ts` line 510, where `.reader-page > .quest-cover-picture` has '
        'the leaf size and the a3-color cover renders at 420 x 297 mm; F8 is in the old r5 file '
        'too, so F7 did not cause it; the next Red and Green round fixes it. F7b (open; D-P11-3, '
        'the orchestrator words): "the mirror copies the soft edge rows of the Forge art (row 167 '
        'at the top, mean 193.7 with 697 light pixels; rows 2831 to 2833 at the bottom, means 98.2, '
        '88.5, 148.1, against 105.6 for the floor). This leaves a hairline of about 0.2 mm at about '
        '8.5 mm from the top and bottom edges of the w01-1 A3 cover. The next round changes the '
        'fill to topRows 168 and bottomRows 169." The 8 full-size pages of the standing order of '
        '2026-11-11 (the w01-1 A3 cover is new; the page 12 PNGs and the book pages are unchanged): '
        + page_line + '. The 5 sheets: ' + sheet_line
        + '. Task 2.9 stays `[~]`. Evidence: automated.'
    )
    line_2 = ('  - Part 11 replacement table (old -> new SHA-256): ' + '; '.join(changed_entries)
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
    if line_1 in lines or line_2 in lines:
        print('ALREADY_INSERTED true')
        return 1
    out = lines[:index + 1] + [line_1, line_2] + lines[index + 1:]
    print('OLD_LINE_COUNT %d' % len(lines))
    print('NEW_LINE_COUNT %d' % len(out))
    print('INSERTED %d' % (len(out) - len(lines)))
    with open(PLAN, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
