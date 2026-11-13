#!/usr/bin/env python3
"""Inserts the 2 Part 12 evidence lines under Task 2.9 of the plan (Task 2.9 part 12).

Track storytime_cover_options_20261106. The script inserts exactly 2 lines directly after the
Part 11 replacement table sub-line of Task 2.9, which starts with
`  - Part 11 replacement table (old -> new SHA-256):`, and before the line of Task 2.10. It asserts
the neighbour first, so a moved anchor stops the run.

It also asserts the numbers of the run before the insert: the build capture exits 0 with the 2 build
strings and 4 lines `All checks pass.`; the filled copy, edge, stripe, compare, page, copy, sheet,
and MANIFEST captures hold the values of the plan line; the final check log holds `PASS_LINES=45`
and `FAIL_LINES=0` with CHECK_13 and CHECK_14 PASS; the old MANIFEST SHA-256 is `288d8478...` with
131 lines, and the new MANIFEST holds 133 lines with 11 changed lines and 2 new lines (the 2 page 1
PNGs). The table of the old and new SHA-256 values comes from `manifest-old-2-9l.txt` and
`MANIFEST.txt`, in the order of the MANIFEST, and every changed pair must differ. The 10 pages and
the 5 sheets come from the hand-off folder.

Usage: python3 -I -B plan_insert_2_9l.py

It prints the anchor line number, the table sizes, the inserted line count, and the new line count.
It writes no other line.
"""

import hashlib
import os

from PIL import Image

REPO = '/home/daniebo/Desktop/Workbooks'
PLAN = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/plan.md')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9l.txt')
GATE = os.path.join(RUNS, 'print-gate.txt')
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')

ANCHOR = '  - Part 11 replacement table (old -> new SHA-256):'
AFTER = '- [ ] Task 2.10 (Look at every page)'
OLD_SHA = '288d84782a6dfa0faaf60c95b83e3006094691be7d181a5eb75291a2a54f994b'
NEW_SHA = '8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87'
OLD_LINES = 131
NEW_LINES = 133
EXPECTED_CHANGED = 11
EXPECTED_NEW = 2
PASS_LINES = 45
FAIL_LINES = 0

# The captures and the strings that each must hold.
CAPTURE_RULES = [
    ('build-2-9l.txt', ['HEAVY_EXIT: 0', 'Covers of Level 2 Unit 1 set 1: 32 pages, 44 files']),
    ('filled-copy-2-9l.txt', ['MTIME_AFTER_BUILD_START True', 'SHA_DIFFERS_FROM_PART11 True',
                              'COPY_SHA256 e05f9db1f187e6a9ea883a634ca3739e18407d6f9c294898821f0fcdac7a84c5',
                              'TOP_ROWS_MIRROR r=0..167 from source row 335 - r: True',
                              'BOTTOM_ROWS_MIRROR r=2831..2999 from source row 5661 - r: True',
                              'OTHER_ROWS_EQUAL_SOURCE True', 'FILLED_COPY_OK True']),
    ('edge-before-2-9l.txt', ['white_edge_rows=0 white_edge_cols=3', '6b42938e']),
    ('edge-after-2-9l.txt', ['WHITE_EDGE_ROWS_TOTAL 0', 'd3d4e65e']),
    ('edge-after-ign3-2-9l.txt', ['WHITE_EDGE_ROWS_TOTAL 0', 'WHITE_EDGE_COLS_TOTAL 0',
                                  'EDGE_OK true']),
    ('stripe-before-2-9l.txt', ['STRIPES top=2 bottom=1', 'STRIPE band=top y=100',
                                'STRIPE band=bottom y=3408']),
    ('stripe-after-2-9l.txt', ['STRIPES top=0 bottom=0', 'FAILED_FILES 0']),
    ('compare-2-9l.txt', ['A3_OTHER_EQUAL 13 of 13', 'LEAF_EQUAL 14 of 14', 'BOOK_EQUAL 4 of 4',
                          'HELLO_A3_DIFFERS true', 'COMPARE_OK true']),
    ('replace-2-9l.txt', ['REPLACED 34', 'PAIR_EQUAL 34', 'COPY_OK true']),
    ('edge-page1-before-2-9l.txt', ['white_edge_rows=583 white_edge_cols=873']),
    ('edge-page1-after-2-9l.txt', ['WHITE_EDGE_ROWS_TOTAL 0', 'WHITE_EDGE_COLS_TOTAL 0',
                                   'FILES 2']),
    ('page12-2-9l.txt', ['PAGE12_OK true', '15e56a3fec114c19fc4189c3222850a045aab29c38637ee49fd6a412cacce667']),
    ('copy-back-2-9l.txt', ['PAIR_EQUAL_PDFS 2', 'RENDER_EQUALS_OLD_PNG true', 'COPY_BACK_OK true',
                            'PAGE1_PNG l2-w01-hello-a3-page1.png',
                            'PAGE1_PNG l2-w01-nan-can-nod-a3-page1.png']),
    ('contact-run-2-9l.txt', ['CONTACT_OK true', 'REPLACED 3', 'CREATED 0']),
    ('manifest-check-2-9l.txt', ['MANIFEST_OK true', 'NEW_LINE_COUNT 133', 'NEW_NAMES 2',
                                 'REMOVED_NAMES 0', 'EQUAL_LINES 120', 'CHANGED_LINES 11',
                                 'SHA256SUM_C_OK_LINES 133', 'SHA256SUM_C_FAILED_LINES 0']),
    ('gate-functions-2-9l.txt', ['CHECK_FUNCTIONS_BYTE_EQUAL true', 'HELPER_LINES_NEW 254',
                                 'CHECK_1_TO_12_LINES_NEW 331']),
]

PAGES = [
    'student/front-alt-hlogo-r5.png',
    'student/back-alt-hlogo-r5.png',
    'teacher/teacher-front-alt-hlogo-r5.png',
    'teacher/teacher-back-alt-hlogo-r5.png',
    'readers-a3/l2-w01-hello-a3-cover.png',
    'reader-back-r5/l2-w01-hello-a3-page12.png',
    'readers-leaf/l2-w01-nan-can-nod-leaf-cover.png',
    'reader-back-r5/l2-w01-nan-can-nod-leaf-page12.png',
    'reader-back-r5/l2-w01-hello-a3-page1.png',
    'reader-back-r5/l2-w01-nan-can-nod-a3-page1.png',
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


def main():
    """Inserts the 2 lines after the asserted neighbour."""
    gate_text = open(GATE, encoding='utf-8').read()
    gate_rows = gate_text.splitlines()
    fail_rows = [row for row in gate_rows if row.endswith(', FAIL')]
    gate_ok = (('PASS_LINES=%d' % PASS_LINES) in gate_text
               and ('FAIL_LINES=%d' % FAIL_LINES) in gate_text and not fail_rows
               and any(row.startswith('CHECK_13_EDGE_WHITE:') and row.endswith(', PASS')
                       and 'stripes top=0 bottom=0' in row for row in gate_rows)
               and any(row.startswith('CHECK_14_READER_PAGE1_FILL:') and row.endswith(', PASS')
                       and 'white_edge_rows=0 white_edge_cols=0' in row for row in gate_rows)
               and any(row.startswith('INFO_14_PAGE1_VS_COVER_PNG:') for row in gate_rows)
               and 'CHECK_12_READER_BACK: workbook gate exit=0' in gate_text
               and ('MANIFEST_SHA256_START ' + NEW_SHA) in gate_text
               and ('MANIFEST_SHA256_END ' + NEW_SHA) in gate_text)
    print('GATE_LINES_OK %s' % str(gate_ok).lower())
    if not gate_ok:
        return 1
    info_14 = next(row for row in gate_rows if row.startswith('INFO_14_PAGE1_VS_COVER_PNG:'))
    build_text = open(os.path.join(RUNS, 'build-2-9l.txt'), encoding='utf-8').read()
    build_ok = build_text.count('All checks pass.') == 4
    print('BUILD_PASS_LINES_OK %s' % str(build_ok).lower())
    if not build_ok:
        return 1
    for name, needles in CAPTURE_RULES:
        text = open(os.path.join(RUNS, name), encoding='utf-8').read()
        missing = [needle for needle in needles if needle not in text]
        print('CAPTURE_OK %s %s' % (name, str(not missing).lower()))
        if missing:
            print('CAPTURE_MISSING ' + '; '.join(missing))
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
        '  - Part 12 A3 rebuild after F7b and F8 (2026-11-13, jr-green, route '
        'claude-code/claude-sonnet-5-5#high, no coder; recorded substitution: the role table names '
        'volcengine-agent-plan/glm-5.3-flash#high, and `ra-quota pick green --not-family minimax` '
        'gave this route; role base ef21fdbf; the Green F7b and F8 code 12f7aa75; the Red model of '
        'F7b and F8 is opencode/minimax-m3.1-flash-free#high, so the families differ). The build '
        'is one heavy-run job that exits 0 on the first attempt and prints `Covers of Level 2 Unit 1 '
        'set 1: 32 pages, 44 files` with 4 lines `All checks pass.`. The 31 pictures equal part 11 '
        '(29 hard links, the back `881e93b2...`, the teacher front `09014118...`). The filled copy '
        '`/tmp/storytime-art-edge-fill/99ee1b8d1fe0e9ad-l2-w01-cover-hello-v1.png` has a '
        'modification time after the build start and the SHA-256 '
        '`e05f9db1f187e6a9ea883a634ca3739e18407d6f9c294898821f0fcdac7a84c5` (part 11: '
        '`e0b8dc48...`). Its rows follow D-F7b-1: the output row r equals the source row 335 - r for '
        'r 0 to 167, the source row 5661 - r for r 2831 to 2999, and every other pixel equals the '
        'source (`filled_check_2_9l.py`, `FILLED_COPY_OK True`). Edge check on the w01-1 A3 cover '
        'PNG (`edge_white_2_9l.py`, 4961 x 3508 px): the part 11 file `6b42938e...` holds 0 white '
        'edge rows; the new file `d3d4e65e...` holds 0 white edge rows with no pixel ignored and '
        '0 white edge columns with the outermost 3 px ignored (D-P11-1; the raw 3 right columns '
        'are information, as in part 11). Stripe check D-F7b-2 (`stripe_check_2_9l.py`; the row '
        'mean over the columns 3 to 4957 in the bands y 60 to 140 and y 3368 to 3448; a stripe is a '
        'row more than 15 above or below both rows 2 away): the part 11 file holds 2 stripes in '
        'the top band (y 100 and 101, means 194.3 and 190.4 against about 165) and 1 in the '
        'bottom band (y 3408, mean 159.5 against about 118), so the rule catches F7b; the new '
        'file holds 0 and 0. The 13 other A3 PNGs, the 14 leaf PNGs, and the 4 r5 book PNGs are '
        'byte-equal to the part 11 MANIFEST, and only the w01-1 A3 PNG differs (`COMPARE_OK true`). '
        '`copy_readers_2_9l.py` replaces the 34 reader files (`REPLACED 34`, `PAIR_EQUAL 34`) '
        'with the old-SHA guard; a backup of every replaced file is in `/tmp/opencode/c29l/old/`. '
        'The reader back A3 build (`make-readers-pdf.ts --a3-color`, 1 attempt, exit 0) wrote into '
        'the scratch folder `~/Desktop/print-ready/storytime/_scratch-c29l/reader-back/` (the script '
        'accepts only an output folder inside `~/Desktop/print-ready/storytime/`; `_scratch-c29k/` '
        'stays as it is). Whole page 1 of the hello A3 file at 100 ppi with 2 px ignored: part 11 '
        'holds 583 white edge rows and 873 white edge columns; the 2 new A3 files hold 0 and 0, so '
        'F8 is closed. Page 12 (`page12_2_9l.py`, `PAGE12_OK true`) is unchanged: the hello page '
        '12 render at 300 ppi is byte-equal to `15e56a3f...`. D-P12-1 (orchestrator): page 1 of '
        'each new A3 reader file, rendered at 300 ppi, is in the hand-off folder as the new names '
        '`reader-back-r5/l2-w01-hello-a3-page1.png` and '
        '`reader-back-r5/l2-w01-nan-can-nod-a3-page1.png`, so that the PM can see the F8 fix. '
        'Sheets: `readers-a3.png` and `all.png` are replaced; `readers-leaf.png` stays byte-equal. '
        'MANIFEST: old `' + OLD_SHA + '` with 131 lines; new `' + new_digest
        + '` with 133 lines, 2 new names (the 2 page 1 PNGs), 0 removed names, 120 byte-equal '
        'lines, and 11 changed lines (the 5 planned names, plus the PDF/X file, the report, and the '
        'combined PDF in each of `readers-a3/` and `readers-leaf/`); `sha256sum -c` gives 133 OK '
        'and 0 FAILED. Final check log `print-gate.txt`: `PASS_LINES=45` and `FAIL_LINES=0`, '
        '`MANIFEST_SHA256_START` equal to `END`, CHECK_1 to CHECK_12 and the helper functions '
        'byte-equal to part 11 (helper region 254 lines, check region 331 lines). CHECK_13 PASS '
        '(14 A3 PNGs with 0 white edge rows and 0 white edge columns, the 2 page 1 cover boxes '
        'with 0 and 0, and the w01-1 stripe count 0 in each band). CHECK_14 PASS (whole page 1 of '
        'the 2 A3 files: 0 white edge rows, 0 white edge columns). Information line INFO_14, the '
        'mean absolute difference per channel between page 1 at 100 ppi and its A3 cover PNG '
        'resized to the same size: ' + info_14[len('INFO_14_PAGE1_VS_COVER_PNG: '):].replace(
            ', information only (no verdict)', '')
        + '. F7b and F8 are closed in the hand-off files. The 10 pages of the standing order of '
        '2026-11-11 and D-P12-1 (the w01-1 A3 cover and the 2 page 1 PNGs are new; the other pages '
        'are unchanged): ' + page_line + '. The 5 sheets: ' + sheet_line
        + '. Task 2.9 stays `[~]`. Evidence: automated.'
    )
    line_2 = ('  - Part 12 replacement table (old -> new SHA-256): ' + '; '.join(changed_entries)
              + '. New names: ' + '; '.join(new_entries) + '. Evidence: automated.')

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
