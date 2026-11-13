#!/usr/bin/env python3
"""Runs the final print gate checks of Task 2.9 part 12 (track storytime_cover_options_20261106).

This script is `print_gate_final_2_9k.py` after F7b and F8 (part 12). CHECK_1 to CHECK_12 and the
helper functions stay byte-equal (`gate-functions-2-9l.py` proves it). CHECK_13 keeps its rule and
adds the stripe rule D-F7b-2 on the w01-1 A3 cover PNG to its verdict. CHECK_14 keeps its whole
page 1 rule and must now PASS. One new information line, INFO_14, gives the mean absolute difference
per channel between page 1 of each A3 file and its A3 cover PNG.

The part 10 script was `print_gate_final.py` with the 12 checks of the Task 2.9 plan line and the 2 book
sets. The final log covers the 6 print files of both book sets: the A3 reader file, the leaf reader
file, the student r2 file, the teacher r2 file, the student r5 file, and the teacher r5 file,
and the reader back files of `reader-back-r5/`.

The checks of the plan line, with the check numbers of the final log:
  CHECK_1  PRINT_GATE on each of the 6 print files: exit 0, "All checks pass.", and no FAIL line.
  CHECK_2  `pdfinfo -box`: the page counts (14, 14, 2, 2, 2, 2), the page sizes (A3 420 x 297 mm,
           leaf 198 x 148.5 mm, books A4), and a TrimBox delta at most 0.5 pt.
  CHECK_3  `pdffonts` on each of the 6 print files: at least 1 font, every font embedded, no
           Type 3 font.
  CHECK_4  the text of the 36 pages of the 6 print files: the 14 A3 pages hold their reader title;
           the 14 leaf pages hold their reader title and "Storytime Advantage"; each book front
           holds "Level 2" and its book title; each book back holds 0 whole words "Storytime" or
           "Advantage" (D-1 of the log header).
  CHECK_5  `pdfimages -list`: the page-size art of each A4 page at 299 ppi or more (the 4 book
           files). The A3 art at 242 ppi and the leaf art at 300 ppi are information only (the PM
           accepted 242 ppi for the A3 posters on 2026-11-11).
  CHECK_6  the Thai byte check on the 4 Chrome PDFs of the 2 book sets, never on a PDF/X file
           (F13): the front holds no Thai, and each back equals `BACK_LINES.contact`.
  CHECK_7  `gs -q -o - -sDEVICE=inkcov` of the leaf print file: C, M, and Y at 0.00000 on each
           page.
  CHECK_8  the build reports show `qr` `pass`, and the independent QR crop check gives 29 x 29
           modules with 0 of 841 different.
  CHECK_9  the 6 build reports hold their page rows (14, 14, 2, 2, 2, 2) and 0 fail rows.
  CHECK_10 the approved files of FR-11.7 keep their SHA-256 prefix, and `git status --porcelain`
           of the plan's path list prints nothing.
  CHECK_11 the 5 named contact sheets open as PNG files, and all.png is byte-equal to a rebuild
           from the 32 page PNGs.
  CHECK_12 the reader back folder `reader-back-r5/` with the rule (a) to (d) of part 10 (the
           orchestrator definition, after F5 and F6): (a) the A3 page 12 holds "Words in this book"
           1 time, the band word 0 times, and "Storytime Advantage" 0 times; (b) the workbook leaf
           page that holds page 12 and page 1: the page 12 half holds the phrase 1 time, the band
           word 0, and the series line 0; the page 1 half holds the band word 0; (c) every page of
           the 3 reader back files holds the band word 0; (d) the ink coverage of the workbook file:
           C, M, and Y at 0.00000 on every page. PRINT_GATE exits 0 on the workbook PDF/X file, and
           the 2 A3 files hold 12 pages each.
  CHECK_13 the F7 white edge rule (part 12, `edge_white_2_9l.py`): the 14 A3 cover PNGs of
           `readers-a3/` hold 0 white edge rows (no pixel ignored) and 0 white edge columns (the
           outermost 3 px of each side ignored, D-P11-1), and page 1 of the 2 A3 files of
           `reader-back-r5/` at 100 ppi holds 0 in the cover box (the header note says why the box
           is used); part 12 adds: the w01-1 A3 cover PNG holds 0 stripes (rule D-F7b-2,
           `stripe_check_2_9l.py`).
  CHECK_14 whole page 1 of the 2 A3 files of `reader-back-r5/` at 100 ppi, 2 px ignored, holds 0
           white edge rows and 0 white edge columns. F8 is closed when it passes (D-P11-2).
  INFO_13  one information line with no verdict: page 1 of the A3 print file at 150 ppi.
  INFO_14  one information line with no verdict: the mean absolute difference per channel between
           page 1 of each A3 file at 100 ppi and its A3 cover PNG resized to the same size.

The log header holds the 3 deviations D-1 to D-3, the MANIFEST SHA-256 at the start and at the end,
and the file scope. The log ends with `PASS_LINES=<n>` and `FAIL_LINES=<n>`.

Usage:
  python3 -I -B print_gate_final.py <out txt file>
  python3 -I -B print_gate_final.py --single <check> <file> [extra]

The single mode runs one check on one file for the 4 mutants of Task 2.9 part 8: check 4 (with the
title as the extra argument), check 5, check 6 (with `back` as the extra argument), check 7, and
`gate` (the stand-alone PRINT_GATE). It prints one line with the values and PASS or FAIL, and it
exits 1 on FAIL.

It never prints Thai text: every Thai check prints counts only, and every Thai line is dropped
before a print. It runs inside one heavy-run wrapper (the caller does that).
"""

import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys

from PIL import Image, ImageChops, ImageStat

REPO = '/home/daniebo/Desktop/Workbooks'
DASHBOARD = os.path.join(REPO, 'dashboard')
QR_CHECK = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/options/qr_check.mjs')
BACK_TEXT = os.path.join(REPO, 'dashboard/lib/covers/back-text.ts')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
PROBE = os.path.join(RUNS, 'readers_rows_2_9f.tsx')
CONTACT_SCRIPT = os.path.join(RUNS, 'contact-2-9l.py')
EDGE_SCRIPT = os.path.join(RUNS, 'edge_white_2_9l.py')
STRIPE_SCRIPT = os.path.join(RUNS, 'stripe_check_2_9l.py')
STRIPE_BANDS = ((60, 140), (3368, 3448))
PAGE1_BOX = (0, 0, 780, 585)
PNG_SEAM_PX = 3
SCRATCH = '/tmp/opencode/c29l-gate'
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')
MANIFEST_SHA_EXPECTED = '8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87'

THAI_LO, THAI_HI = 0x0E00, 0x0E7F
SERIES_NAME = 'Storytime Advantage'

A3_PDFX = 'readers-a3/Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf'
LEAF_PDFX = 'readers-leaf/Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf'

READER_VARIANTS = [
    {'key': 'A', 'label': 'A3', 'name': 'readers-a3', 'pdfx': os.path.join(HANDOFF, A3_PDFX),
     'report': os.path.join(HANDOFF, 'readers-a3', 'build-report.json'),
     'size_mm': (420.0, 297.0), 'pages': 14,
     'rule_text': 'the page holds its reader title'},
    {'key': 'L', 'label': 'LEAF', 'name': 'readers-leaf', 'pdfx': os.path.join(HANDOFF, LEAF_PDFX),
     'report': os.path.join(HANDOFF, 'readers-leaf', 'build-report.json'),
     'size_mm': (198.0, 148.5), 'pages': 14,
     'rule_text': 'the page holds its reader title and the series text'},
]

BOOK_VARIANTS = [
    {'key': 'student-r2', 'label': 'STUDENT_R2', 'kind': 'Student Book', 'pages': 2,
     'pdfx': os.path.join(HANDOFF, 'student',
                          'Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf'),
     'chrome': os.path.join(HANDOFF, 'student', 'cover-alt-hlogo-r2.pdf'),
     'back_png': os.path.join(HANDOFF, 'student', 'back-alt-hlogo-r2.png'),
     'report': os.path.join(HANDOFF, 'student', 'build-report-alt-hlogo-r2.json')},
    {'key': 'teacher-r2', 'label': 'TEACHER_R2', 'kind': 'Teacher Book', 'pages': 2,
     'pdfx': os.path.join(HANDOFF, 'teacher',
                          'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf'),
     'chrome': os.path.join(HANDOFF, 'teacher', 'teacher-cover-alt-hlogo-r2.pdf'),
     'back_png': os.path.join(HANDOFF, 'teacher', 'teacher-back-alt-hlogo-r2.png'),
     'report': os.path.join(HANDOFF, 'teacher', 'build-report-alt-hlogo-r2.json')},
    {'key': 'student-r5', 'label': 'STUDENT_R5', 'kind': 'Student Book', 'pages': 2,
     'pdfx': os.path.join(HANDOFF, 'student',
                          'Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r5_PDFX-1a.pdf'),
     'chrome': os.path.join(HANDOFF, 'student', 'cover-alt-hlogo-r5.pdf'),
     'back_png': os.path.join(HANDOFF, 'student', 'back-alt-hlogo-r5.png'),
     'report': os.path.join(HANDOFF, 'student', 'build-report-alt-hlogo-r5.json')},
    {'key': 'teacher-r5', 'label': 'TEACHER_R5', 'kind': 'Teacher Book', 'pages': 2,
     'pdfx': os.path.join(HANDOFF, 'teacher',
                          'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r5_PDFX-1a.pdf'),
     'chrome': os.path.join(HANDOFF, 'teacher', 'teacher-cover-alt-hlogo-r5.pdf'),
     'back_png': os.path.join(HANDOFF, 'teacher', 'teacher-back-alt-hlogo-r5.png'),
     'report': os.path.join(HANDOFF, 'teacher', 'build-report-alt-hlogo-r5.json')},
]

PRINT_FILES = [
    {'label': 'A3', 'path': READER_VARIANTS[0]['pdfx'], 'pages': 14, 'size_mm': (420.0, 297.0),
     'tolerance_mm': 0.5},
    {'label': 'LEAF', 'path': READER_VARIANTS[1]['pdfx'], 'pages': 14, 'size_mm': (198.0, 148.5),
     'tolerance_mm': 0.5},
    {'label': 'STUDENT_R2', 'path': BOOK_VARIANTS[0]['pdfx'], 'pages': 2, 'size_mm': (210.0, 297.0),
     'tolerance_mm': 0.2},
    {'label': 'TEACHER_R2', 'path': BOOK_VARIANTS[1]['pdfx'], 'pages': 2, 'size_mm': (210.0, 297.0),
     'tolerance_mm': 0.2},
    {'label': 'STUDENT_R5', 'path': BOOK_VARIANTS[2]['pdfx'], 'pages': 2, 'size_mm': (210.0, 297.0),
     'tolerance_mm': 0.2},
    {'label': 'TEACHER_R5', 'path': BOOK_VARIANTS[3]['pdfx'], 'pages': 2, 'size_mm': (210.0, 297.0),
     'tolerance_mm': 0.2},
]

APPROVED = [
    ('/home/daniebo/Desktop/print-ready/storytime/print-v3/l2u1/cover.pdf', '2964d9b678afc7a0'),
    ('/home/daniebo/Desktop/print-ready/storytime/print-v3/l2u1/'
     'Storytime-Advantage-L2-U1-Student-Book-Cover-v3_PDFX-1a.pdf', 'e0e0365a4ece8a5b'),
    ('/home/daniebo/Desktop/print-ready/storytime/teacher-cover-l2u1/'
     'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v1_PDFX-1a.pdf', '3b992af216dc2238'),
]

GIT_PATHS = ['dashboard/lib/storytime/print', 'dashboard/lib/covers', 'dashboard/scripts/print',
             'dashboard/scripts/storytime/make-storytime-*cover*.ts', 'content/storytime/covers']

QR_CROP_MM = (146.0, 210.0, 186.5, 250.5)

STORY_TEXT = 'Hello, I am Nan. Nan can nod. A nest, a net, a nut, a nose.'
HEADINGS = ['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']

SHEET_NAMES = ['all.png', 'readers-a3.png', 'readers-leaf.png',
               'student-alt-hlogo-r5.png', 'teacher-alt-hlogo-r5.png']
R2_SHEETS = ['student-alt-hlogo-r2.png', 'teacher-alt-hlogo-r2.png']

BAND_WORD = 'sprout'
TRIMBOX_TOLERANCE_PT = 0.5
A4_PPI_MIN = 299.0

HEADER = [
    'PRINT GATE FINAL LOG - Task 2.9 part 12 (track storytime_cover_options_20261106)',
    'DATE 2026-11-13',
    'ROLE jr-green, model claude-code/claude-sonnet-5-5#high, role base ef21fdbf',
    'SCOPE the 6 print files of the 2 book sets (A3, LEAF, STUDENT_R2, TEACHER_R2, STUDENT_R5, '
    'TEACHER_R5: 36 pages), the 4 Chrome PDFs of the 2 book sets, the 6 build reports, and the 5 '
    'named contact sheets, and the files of `reader-back-r5/`. The plan counts 32 pages for the '
    '4-file release set; the r2 book set adds 4 pages.',
    'D-1 (check 4): with the shipped top style hlogo, the series name "Storytime Advantage" is the '
    'logo picture (rule 1 of the standing cover rules, by file hash), not text, on the book pages '
    'and the A3 pages. Check 4 requires the series text on the 14 leaf pages (the footer) and the '
    'kind title text on all 32 pages.',
    'D-2 (check 11): the 5 sheets of the release candidate are contact-sheets/all.png (the 32 page '
    'PNGs with the r5 books), readers-a3.png, readers-leaf.png, student-alt-hlogo-r5.png, and '
    'teacher-alt-hlogo-r5.png. The r2 sheets student-alt-hlogo-r2.png and teacher-alt-hlogo-r2.png '
    'also open as PNG.',
    'D-3 (the fast gate): the folder holds the plain r5 (no suffix), the old alt-hlogo, the r2, the '
    'r3, the r4, and the new r5 book variants for the record, so '
    '"ls ... *_PDFX-1a.pdf | wc -l" prints more than 4. The fast gate is the existence of the 6 named '
    'print files, and the 5 named sheets.',
    'CHECK 6 FILE NOTE: the Thai byte check runs on the 4 Chrome PDFs (student/cover-alt-hlogo-r2.pdf, '
    'teacher/teacher-cover-alt-hlogo-r2.pdf, student/cover-alt-hlogo-r5.pdf, '
    'teacher/teacher-cover-alt-hlogo-r5.pdf), never on a PDF/X file (F13).',
    'CHECK 13 NOTE (part 12, after F7): the white edge rule is `edge_white_2_9l.py`. A white row or '
    'column holds only pixels with R, G, and B at 250 or more. Part A: the 14 A3 cover PNGs of '
    '`readers-a3/` (4961 x 3508 px) hold 0 white edge rows with no pixel ignored, and 0 white edge '
    'columns with the outermost 3 px of each side ignored (D-P11-1: the 3 right columns, x 4958 to '
    '4960, are the Chrome sub-pixel seam of 0.25 mm, the same seam as the accepted F7-6 rule; the '
    'raw counts are printed as information). Part B: page 1 of the 2 A3 files of `reader-back-r5/` '
    'at 100 ppi, rule on the cover box (780 x 585 px, top-left corner) with 2 px ignored on each '
    'side of the box. Part C (part 12, D-F7b-2): the row mean over the columns 3 to 4957 of the w01-1 '
    'A3 cover PNG (4961 x 3508 px) in the top band y 60 to 140 and the bottom band y 3368 to 3448; '
    'a row is a stripe when its mean is more than 15 above or below both rows 2 away. The rule '
    'needs 0 stripes in each band (`stripe_check_2_9l.py`).',
    'CHECK 14 NOTE (part 12, D-P11-2): whole page 1 of the 2 A3 files of `reader-back-r5/` at 100 ppi '
    'with 2 px ignored must hold 0 white edge rows and 0 white edge columns. In part 11 it failed '
    '(F8): page 1 showed only the top-left 198 x 148.5 mm of the A3 cover. The Green fix is the '
    'page 1 rule of `readers.ts` in commit 12f7aa75. The rule is unchanged.',
    'INFO D-P12 (part 12): F7b is the hairline of about 0.2 mm at about 8.5 mm from the top and '
    'bottom edges of the w01-1 A3 cover (D-P11-3). The Green fix is the fill rows topRows 168 and '
    'bottomRows 169 in `pictures-edge-fill.json` (commit 12f7aa75). D-P12-1: page 1 of each new A3 '
    'reader file is in the hand-off folder as a PNG at 300 ppi.',
]


def run(cmd, args, cwd=None):
    """Runs one command and returns the exit code and the stdout."""
    done = subprocess.run(cmd + args, capture_output=True, text=True, cwd=cwd)
    return done.returncode, done.stdout


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def has_thai(text):
    """Returns True when the text holds one Thai character."""
    return any(THAI_LO <= ord(ch) <= THAI_HI for ch in text)


def thai_only(text):
    """Returns the Thai characters of a text, in order."""
    return ''.join(ch for ch in text if THAI_LO <= ord(ch) <= THAI_HI)


def joined(text):
    """Returns the text with every run of white space as one space."""
    return re.sub(r'\s+', ' ', text)


def english_only(text):
    """Returns the text with every Thai line dropped and the white space joined."""
    kept = [line for line in text.splitlines() if not has_thai(line)]
    return joined(' '.join(kept)).strip()


def whole_words(text, word):
    """Returns the count of the whole words of a text, case-sensitive."""
    return len(re.findall(r'\b' + re.escape(word) + r'\b', text))


def band_count(text):
    """Returns the count of the band word of Level 2 in any case."""
    return len(re.findall(BAND_WORD, text, re.I))


def page_text(path, page):
    """Returns the text of one page."""
    code, out = run(['pdftotext', '-f', str(page), '-l', str(page)], [path, '-'])
    return out


def pdfinfo_pages(path):
    """Returns the page count of a PDF."""
    code, out = run(['pdfinfo', '-box'], [path])
    found = re.search(r'^Pages:\s+(\d+)', out, re.M)
    return int(found.group(1)) if found else 0


def page_sizes_mm(path):
    """Returns one row per page: the page number and the page size in mm."""
    code, out = run(['pdfinfo', '-box'], [path])
    pages = pdfinfo_pages(path)
    rows = []
    size = re.search(r'^Page size:\s+([\d.]+) x ([\d.]+)', out, re.M)
    if size:
        width = float(size.group(1)) * 25.4 / 72
        height = float(size.group(2)) * 25.4 / 72
        for page in range(1, pages + 1):
            rows.append((page, (width, height)))
        return rows
    sizes = {}
    for line in out.splitlines():
        found = re.match(r'^Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)', line)
        if found:
            sizes[int(found.group(1))] = (float(found.group(2)) * 25.4 / 72,
                                          float(found.group(3)) * 25.4 / 72)
    for page in sorted(sizes):
        rows.append((page, sizes[page]))
    return rows


def trimbox_deltas(path):
    """Returns the TrimBox size minus the page size, in points, for each page."""
    code, out = run(['pdfinfo', '-box'], [path])
    pages = pdfinfo_pages(path)
    size = re.search(r'^Page size:\s+([\d.]+) x ([\d.]+)', out, re.M)
    trim = re.search(r'^TrimBox:\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)', out, re.M)
    rows = []
    if size and trim:
        width, height = float(size.group(1)), float(size.group(2))
        trim_w = float(trim.group(3)) - float(trim.group(1))
        trim_h = float(trim.group(4)) - float(trim.group(2))
        for page in range(1, pages + 1):
            rows.append((page, abs(width - trim_w), abs(height - trim_h)))
        return rows
    sizes, trims = {}, {}
    for line in out.splitlines():
        found = re.match(r'^Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)', line)
        if found:
            sizes[int(found.group(1))] = (float(found.group(2)), float(found.group(3)))
        found = re.match(r'^Page\s+(\d+) TrimBox:\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)', line)
        if found:
            trims[int(found.group(1))] = (float(found.group(4)) - float(found.group(2)),
                                          float(found.group(5)) - float(found.group(3)))
    for page in sorted(sizes):
        page_size, page_trim = sizes[page], trims.get(page, (0.0, 0.0))
        rows.append((page, abs(page_size[0] - page_trim[0]), abs(page_size[1] - page_trim[1])))
    return rows


def fonts(path):
    """Returns the font count, the embedded count, and the Type 3 count of a PDF."""
    code, out = run(['pdffonts'], [path])
    rows = [line for line in out.splitlines()[2:] if line.strip()]
    total = embedded = type3 = 0
    for line in rows:
        tokens = line.split()
        index = None
        for position in range(1, len(tokens) - 2):
            if tokens[position] in ('yes', 'no') and tokens[position + 1] in ('yes', 'no') \
                    and tokens[position + 2] in ('yes', 'no'):
                index = position
                break
        if index is None:
            continue
        total += 1
        if tokens[index] == 'yes':
            embedded += 1
        if 'Type 3' in ' '.join(tokens[1:index - 1]):
            type3 += 1
    return total, embedded, type3


def images(path):
    """Returns the image rows of a PDF: page, width, height, x-ppi, y-ppi."""
    code, out = run(['pdfimages', '-list'], [path])
    rows = []
    for line in out.splitlines()[2:]:
        parts = line.split()
        if len(parts) < 12:
            continue
        try:
            rows.append((int(parts[0]), int(parts[3]), int(parts[4]),
                         float(parts[-4]), float(parts[-3])))
        except ValueError:
            continue
    return rows


def reader_rows():
    """Runs the tsx probe and returns the 14 rows in the page order of the build."""
    done = subprocess.run(['npx', 'tsx', PROBE], cwd=DASHBOARD, capture_output=True, text=True)
    rows = []
    for line in done.stdout.splitlines():
        if has_thai(line):
            continue
        found = re.match(r'^READER_ROW (\d+) week=(\S+) slug=(\S+) title=(.*) litBand=(\S+)$', line)
        if not found:
            continue
        rows.append({'index': int(found.group(1)), 'week': found.group(2), 'slug': found.group(3),
                     'title': found.group(4), 'litBand': found.group(5)})
    return rows, done.returncode


def report_rows(path):
    """Returns the page row count, the fail row count, the qr check, and the error count."""
    data = json.load(open(path, encoding='utf-8'))
    pages = data.get('pages', [])
    errors = data.get('errors', [])
    fails = 0
    qr = 'none'
    for row in pages:
        checks = row.get('checks', {})
        if any(value == 'fail' for value in checks.values()):
            fails += 1
        if str(row.get('file', '')).endswith('back.png'):
            qr = str(checks.get('qr', 'none'))
    return len(pages), fails, qr, len(errors)


def ink_coverage(path):
    """Returns one row per page from the ink coverage device: C, M, Y, K."""
    done = subprocess.run(['gs', '-q', '-o', '-', '-sDEVICE=inkcov', path],
                          capture_output=True, text=True)
    rows = []
    for line in done.stdout.splitlines():
        found = re.match(r'^\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+CMYK', line)
        if found:
            rows.append(tuple(float(found.group(index)) for index in range(1, 5)))
    return rows, done.returncode


def approved_contact_thai():
    """Returns the Thai characters of BACK_LINES.contact (the five approved contact lines)."""
    text = open(BACK_TEXT, encoding='utf-8').read()
    start = text.find('contact')
    end = text.find(']', start)
    return thai_only(text[start:end])


def crop_qr(png_path, target):
    """Cuts the QR box out of a back page PNG and saves it as a PNG."""
    image = Image.open(png_path)
    scale = image.width / 210.0
    left, top, right, bottom = QR_CROP_MM
    box = (round(left * scale), round(top * scale), round(right * scale), round(bottom * scale))
    crop = image.crop(box).convert('L')
    os.makedirs(os.path.dirname(target), exist_ok=True)
    crop.save(target)
    return crop.size


def qr_modules(folder):
    """Runs the QR check of the track on a folder with assets/line-qr.png."""
    done = subprocess.run(['node', QR_CHECK, folder], cwd=REPO, capture_output=True, text=True)
    found = re.search(r'(\d+) x \d+ modules.*?(\d+) modules differ', done.stdout)
    if not found:
        return (0, -1, done.returncode)
    return (int(found.group(1)), int(found.group(2)), done.returncode)


def gate(path):
    """Runs the stand-alone PRINT_GATE on one print file."""
    done = subprocess.run(['npx', 'tsx', 'scripts/print/make-pdfx.ts', path, '--check'],
                          cwd=DASHBOARD, capture_output=True, text=True)
    return done.returncode, done.stdout + done.stderr


def sheet_rows(name):
    """Returns the format, the mode, and the size of one contact sheet."""
    path = os.path.join(HANDOFF, 'contact-sheets', name)
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        return image.format, image.mode, image.size


def rebuild_all_sheet(target):
    """Rebuilds all.png from the 32 page PNGs and returns the SHA-256 of the new file."""
    spec = importlib.util.spec_from_file_location('contact_2_9g', CONTACT_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    stems = module.READER_STEMS
    a3_rows = ['readers-a3/%s-a3-cover.png' % stem for stem in stems]
    leaf_rows = ['readers-leaf/%s-leaf-cover.png' % stem for stem in stems]
    panels = [(module.load(os.path.join(HANDOFF, rel), 620), rel) for rel in module.BOOK_PANELS]
    panels += [(module.load(os.path.join(HANDOFF, rel), 620), rel) for rel in a3_rows]
    panels += [(module.load(os.path.join(HANDOFF, rel), 620), rel) for rel in leaf_rows]
    canvas = module.grid(panels, 4, 620, 'Level 2 Unit 1 covers, 32 pages', 26)
    canvas.save(target)
    return len(panels), sha256(target)


def main(argv):
    """Runs the 11 checks and writes the labeled lines."""
    out_txt = argv[0]
    lines = []
    verdicts = []

    def line(text, ok):
        lines.append(text)
        verdicts.append(ok)

    manifest_start = sha256(MANIFEST)

    # CHECK_1: the stand-alone PRINT_GATE on the 6 print files.
    for item in PRINT_FILES:
        code, output = gate(item['path'])
        passes = output.count('All checks pass.')
        fails = [part.strip() for part in output.splitlines() if part.strip().startswith('FAIL')]
        found = re.search(r':\s+(\d+) pages,\s+([\d.]+) MB,\s+PDF ([\d.]+),\s+'
                          r'(PDF/X-1a:\d+|no PDF/X marker)', output)
        pages = int(found.group(1)) if found else 0
        pdf_version = found.group(3) if found else 'none'
        pdfx = found.group(4) if found else 'none'
        ok = code == 0 and passes >= 1 and not fails
        line('CHECK_1_PRINT_GATE_%s: exit=%d, "All checks pass." count=%d, FAIL lines=%d, '
             'pages=%d pdf=%s pdfx=%s%s, rule: exit 0 with "All checks pass." and no FAIL line, %s'
             % (item['label'], code, passes, len(fails), pages, pdf_version, pdfx,
                (', reason: ' + ' | '.join(fails)) if fails else '',
                'PASS' if ok else 'FAIL'), ok)

    # CHECK_2: the page count, the page size in mm, and the TrimBox.
    for item in PRINT_FILES:
        sizes = page_sizes_mm(item['path'])
        deltas = trimbox_deltas(item['path'])
        worst = max((max(row[1], row[2]) for row in deltas), default=999.0)
        width_ok = all(abs(width - item['size_mm'][0]) <= item['tolerance_mm']
                       for _, (width, _height) in sizes)
        height_ok = all(abs(height - item['size_mm'][1]) <= item['tolerance_mm']
                        for _, (_width, height) in sizes)
        ok = len(sizes) == item['pages'] and width_ok and height_ok \
            and len(deltas) == item['pages'] and worst <= TRIMBOX_TOLERANCE_PT
        first = sizes[0][1] if sizes else (0.0, 0.0)
        line('CHECK_2_PAGES_SIZE_TRIMBOX_%s: pages=%d size_mm=%.2fx%.2f max_trimbox_delta_pt=%.3f, '
             'rule: %d pages of %.1f x %.1f mm within %.1f mm and a TrimBox delta at most %.1f pt, %s'
             % (item['label'], len(sizes), first[0], first[1], worst, item['pages'],
                item['size_mm'][0], item['size_mm'][1], item['tolerance_mm'],
                TRIMBOX_TOLERANCE_PT, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_3: the fonts of the 6 print files.
    for item in PRINT_FILES:
        total, embedded, type3 = fonts(item['path'])
        ok = total >= 1 and embedded == total and type3 == 0
        line('CHECK_3_FONTS_%s: fonts=%d embedded=%d type3=%d, rule: at least 1 font, every font '
             'embedded, no Type 3 font, %s'
             % (item['label'], total, embedded, type3, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_4: the text of the 36 pages.
    rows, probe_code = reader_rows()
    for variant in READER_VARIANTS:
        parts = []
        ok = probe_code == 0 and len(rows) == variant['pages']
        for page in range(1, variant['pages'] + 1):
            row = rows[page - 1] if page - 1 < len(rows) else None
            if row is None:
                ok = False
                parts.append('p%d no_row' % page)
                continue
            text = joined(page_text(variant['pdfx'], page))
            title_count = text.count(row['title'])
            series_count = text.count(SERIES_NAME)
            if variant['key'] == 'A':
                page_ok = title_count >= 1
            else:
                page_ok = title_count >= 1 and series_count >= 1
            ok = ok and page_ok
            parts.append('p%d title=%d series=%d' % (page, title_count, series_count))
        line('CHECK_4_TEXT_COUNTS_%s: rows=%d, %s, rule: each of the 14 pages in row order %s, %s'
             % (variant['label'], len(rows), ' '.join(parts), variant['rule_text'],
                'PASS' if ok else 'FAIL'), ok)
    for variant in BOOK_VARIANTS:
        parts = []
        ok = True
        for page in range(1, 3):
            text = joined(page_text(variant['pdfx'], page))
            level = text.count('Level 2')
            kind = text.count(variant['kind'])
            story_word = whole_words(text, 'Storytime')
            advantage = whole_words(text, 'Advantage')
            if page == 1:
                page_ok = level >= 1 and kind >= 1 and story_word == 0 and advantage == 0
            else:
                page_ok = story_word == 0 and advantage == 0
            ok = ok and page_ok
            parts.append('page %d level_2=%d book_line=%d word_Storytime=%d word_Advantage=%d'
                         % (page, level, kind, story_word, advantage))
        line('CHECK_4_TEXT_COUNTS_%s: %s, rule: the front page holds "Level 2" and "%s" and 0 whole '
             'words "Storytime" or "Advantage", and the back page holds 0 whole words "Storytime" '
             'or "Advantage" (D-1: the series name is the logo picture there), %s'
             % (variant['label'], ', '.join(parts), variant['kind'],
                'PASS' if ok else 'FAIL'), ok)

    # CHECK_5: the art of each A4 page is at 299 ppi or more.
    for variant in BOOK_VARIANTS:
        parts = []
        ok = True
        rows_images = images(variant['pdfx'])
        for page in range(1, 3):
            on_page = [row for row in rows_images if row[0] == page]
            if not on_page:
                ok = False
                parts.append('page %d no image' % page)
                continue
            best = max(on_page, key=lambda row: row[1] * row[2])
            _, width, height, xppi, yppi = best
            page_ok = xppi >= A4_PPI_MIN and yppi >= A4_PPI_MIN and width == 2480 and height == 3508
            ok = ok and page_ok
            parts.append('page %d art=%dx%d ppi=%.1fx%.1f' % (page, width, height, xppi, yppi))
        line('CHECK_5_ART_PPI_%s: %s, rule: each A4 page art is 2480 x 3508 px at 299 ppi or more, %s'
             % (variant['label'], ', '.join(parts), 'PASS' if ok else 'FAIL'), ok)
    for variant in READER_VARIANTS:
        parts = []
        rows_images = images(variant['pdfx'])
        for page in range(1, variant['pages'] + 1):
            on_page = [row for row in rows_images if row[0] == page]
            if not on_page:
                parts.append('p%d no_image' % page)
                continue
            best = max(on_page, key=lambda row: row[1] * row[2])
            parts.append('p%d %dx%d %.1fx%.1fppi' % (page, best[1], best[2], best[3], best[4]))
        line('CHECK_5_ART_IMAGE_LIST_%s: %s, rule: information only (the A3 art at 242 ppi and the '
             'leaf art at 300 ppi; the PM accepted 242 ppi for the A3 posters on 2026-11-11), PASS'
             % (variant['label'], ' '.join(parts)), True)

    # CHECK_6: the Thai byte check on the 4 Chrome PDFs, counts only (spec FR-10.2, F13).
    approved = approved_contact_thai()
    for variant in BOOK_VARIANTS:
        parts = []
        ok = True
        for page in range(1, 3):
            found = thai_only(page_text(variant['chrome'], page))
            if page == 1:
                page_ok = found == ''
                rule = 'front holds no Thai'
            else:
                page_ok = found == approved
                rule = 'back Thai equals BACK_LINES.contact'
            ok = ok and page_ok
            parts.append('page %d thai_chars=%d (%s)' % (page, len(found), rule))
        line('CHECK_6_THAI_%s: %s, approved contact lines thai_chars=%d, rule: the Thai byte check '
             'on the Chrome PDF, front holds no Thai and each back equals BACK_LINES.contact, %s'
             % (variant['label'], ', '.join(parts), len(approved), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_7: the leaf ink coverage.
    coverage, ink_code = ink_coverage(os.path.join(HANDOFF, LEAF_PDFX))
    parts = []
    ok = ink_code == 0 and len(coverage) == 14
    for index, row in enumerate(coverage):
        page_ok = row[0] == 0.0 and row[1] == 0.0 and row[2] == 0.0
        ok = ok and page_ok
        parts.append('p%d C=%.5f M=%.5f Y=%.5f K=%.5f' % (index + 1, row[0], row[1], row[2], row[3]))
    line('CHECK_7_LEAF_INK_LEAF: gs_exit=%d pages=%d, %s, rule: C, M, and Y are 0.00000 on each of '
         'the 14 pages, %s'
         % (ink_code, len(coverage), ' '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_8: the QR check of the build report and the independent module check.
    for variant in BOOK_VARIANTS:
        page_rows, fail_rows, qr, errors = report_rows(variant['report'])
        folder = os.path.join(SCRATCH, 'qrcheck-' + variant['key'])
        crop_qr(variant['back_png'], os.path.join(folder, 'assets', 'line-qr.png'))
        modules, differ, code = qr_modules(folder)
        ok = qr == 'pass' and modules == 29 and differ == 0 and code == 0
        line('CHECK_8_QR_%s: report qr=%s; %d of %d modules differ on the back page, rule: qr pass '
             'and 0 of 841 modules different, %s'
             % (variant['label'], qr, differ, modules * modules, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_9: the build report page rows.
    parts = []
    ok = True
    total = 0
    for variant in READER_VARIANTS + BOOK_VARIANTS:
        page_rows, fail_rows, qr, errors = report_rows(variant['report'])
        expected = variant['pages']
        item_ok = page_rows == expected and fail_rows == 0
        ok = ok and item_ok
        total += page_rows
        parts.append('%s rows=%d fail=%d' % (variant['label'], page_rows, fail_rows))
    line('CHECK_9_BUILD_REPORT_ROWS: %s total_rows=%d, rule: the 6 build reports hold their page '
         'rows (14, 14, 2, 2, 2, 2 = 36 for both book sets) and 0 fail rows, %s'
         % (', '.join(parts), total, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_10: the approved files and the clean path list.
    parts = []
    ok = True
    for path, prefix in APPROVED:
        digest = sha256(path) if os.path.exists(path) else 'missing'
        item_ok = digest.startswith(prefix)
        ok = ok and item_ok
        parts.append('%s prefix_matches=%s' % (os.path.basename(path), str(item_ok).lower()))
    status = subprocess.run(['git', 'status', '--porcelain', '--'] + GIT_PATHS, cwd=REPO,
                            capture_output=True, text=True)
    clean = status.stdout.strip() == ''
    ok = ok and clean
    line('CHECK_10_APPROVED_FILES_AND_PATHS: %s, git_status_lines=%d, rule: the 3 approved files '
         'keep their SHA-256 prefix and the path list of git status prints nothing, %s'
         % (', '.join(parts), len(status.stdout.strip().splitlines()), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_11: the 5 named sheets open as PNG, and all.png is a rebuild from the 32 page PNGs.
    parts = []
    ok = True
    for name in SHEET_NAMES:
        try:
            sheet_format, mode, size = sheet_rows(name)
        except Exception:
            ok = False
            parts.append('%s unreadable' % name)
            continue
        item_ok = sheet_format == 'PNG' and mode == 'RGB'
        ok = ok and item_ok
        parts.append('%s %s %dx%d' % (name, sheet_format, size[0], size[1]))
    r2_open = 0
    for name in R2_SHEETS:
        try:
            sheet_format, mode, size = sheet_rows(name)
            if sheet_format == 'PNG':
                r2_open += 1
        except Exception:
            pass
    rebuilt_target = os.path.join(SCRATCH, 'all-recomputed.png')
    panels, rebuilt_sha = rebuild_all_sheet(rebuilt_target)
    disk_sha = sha256(os.path.join(HANDOFF, 'contact-sheets', 'all.png'))
    rebuild_ok = panels == 32 and rebuilt_sha == disk_sha
    ok = ok and rebuild_ok
    line('CHECK_11_CONTACT_SHEETS: %s; r2 sheets open as PNG=%d of 2; all.png rebuild panels=%d '
         'sha256_equal=%s, rule: the 5 named sheets open as PNG and all.png is byte-equal to a '
         'rebuild from the 32 page PNGs, %s'
         % ('; '.join(parts), r2_open, panels, str(rebuilt_sha == disk_sha).lower(),
            'PASS' if ok else 'FAIL'), ok)

    # CHECK_12: the reader back folder of the part 10 F5 and F6 fixes, rule (a) to (d).
    back = os.path.join(HANDOFF, 'reader-back-r5')
    workbook = os.path.join(back, 'Storytime-Advantage-L2-Readers-W01-v1_PDFX-1a.pdf')
    a3_files = [os.path.join(back, 'Storytime-Advantage-L2-W01-hello-A3-v1.pdf'),
                os.path.join(back, 'Storytime-Advantage-L2-W01-nan-can-nod-A3-v1.pdf')]
    parts = []
    ok = True
    code, output = gate(workbook)
    passes = output.count('All checks pass.')
    fails = [part.strip() for part in output.splitlines() if part.strip().startswith('FAIL')]
    workbook_ok = code == 0 and passes >= 1 and not fails
    ok = ok and workbook_ok
    parts.append('workbook gate exit=%d all_checks_pass=%d fail_lines=%d'
                 % (code, passes, len(fails)))
    coverage, ink_code = ink_coverage(workbook)
    ink_ok = ink_code == 0 and len(coverage) == 12
    max_c = max((row[0] for row in coverage), default=-1.0)
    max_m = max((row[1] for row in coverage), default=-1.0)
    max_y = max((row[2] for row in coverage), default=-1.0)
    for row in coverage:
        ink_ok = ink_ok and row[0] == 0.0 and row[1] == 0.0 and row[2] == 0.0
    ok = ok and ink_ok
    parts.append('workbook ink pages=%d max_C=%.5f max_M=%.5f max_Y=%.5f'
                 % (len(coverage), max_c, max_m, max_y))

    def half_text(path, page, top):
        """Returns the Thai-filtered text of one half of one leaf page."""
        done = subprocess.run(['pdftotext', '-f', str(page), '-l', str(page), '-x', '0',
                               '-y', str(top), '-W', '596', '-H', '421', path, '-'],
                              capture_output=True, text=True)
        return english_only(done.stdout)

    a3_ok = True
    for path in a3_files:
        pages = pdfinfo_pages(path)
        a3_ok = a3_ok and pages == 12
        parts.append('%s pages=%d' % (os.path.basename(path).replace('Storytime-Advantage-', ''),
                                      pages))
    ok = ok and a3_ok

    # Rule (a): the A3 page 12 of the hello file.
    hello_text = english_only(page_text(a3_files[0], 12))
    hello_words = len(re.findall(r'words in this book', hello_text, re.I))
    hello_sprout = band_count(hello_text)
    hello_series = hello_text.count(SERIES_NAME)
    hello_ok = hello_words == 1 and hello_sprout == 0 and hello_series == 0
    ok = ok and hello_ok
    parts.append('A3 page 12 phrase=%d band_word=%d series=%d'
                 % (hello_words, hello_sprout, hello_series))

    # Rule (b): the workbook leaf page that holds page 12 and page 1.
    workbook_pages = pdfinfo_pages(workbook)
    candidates, both = [], []
    for page in range(1, workbook_pages + 1):
        text = english_only(page_text(workbook, page))
        if len(re.findall(r'words in this book', text, re.I)) >= 1:
            candidates.append(page)
            if 'nan can nod' in text.lower():
                both.append(page)
    if both:
        chosen_page, choice_rule = both[0], 'with-nan-can-nod'
    elif len(candidates) >= 2:
        chosen_page, choice_rule = candidates[1], 'second-wordlist-page'
    else:
        chosen_page, choice_rule = 0, 'none'
    half_rows = []
    for label, top in (('TOP', 0), ('BOTTOM', 421)):
        text = half_text(workbook, chosen_page, top) if chosen_page else ''
        half_rows.append((label, len(re.findall(r'words in this book', text, re.I)),
                          band_count(text), text.count(SERIES_NAME)))
    halves_with_phrase = [row for row in half_rows if row[1] >= 1]
    if len(halves_with_phrase) == 1:
        page12_row = halves_with_phrase[0]
        page1_row = [row for row in half_rows if row[0] != page12_row[0]][0]
        leaf_ok = (page12_row[1] == 1 and page12_row[2] == 0 and page12_row[3] == 0
                   and page1_row[2] == 0)
        page12_half = page12_row[0]
    else:
        leaf_ok = False
        page12_half = 'none'
    ok = ok and leaf_ok
    parts.append('workbook page=%d rule=%s halves=%s page12_half=%s'
                 % (chosen_page, choice_rule,
                    ' '.join('%s(phrase=%d band_word=%d series=%d)' % row for row in half_rows),
                    page12_half))

    # Rule (c): the band word on every page of the 3 reader back files.
    band_pages, band_hits = 0, 0
    for path in a3_files + [workbook]:
        file_pages = pdfinfo_pages(path)
        for page in range(1, file_pages + 1):
            band_pages += 1
            if band_count(english_only(page_text(path, page))) != 0:
                band_hits += 1
    band_ok = band_pages == 36 and band_hits == 0
    ok = ok and band_ok
    parts.append('band word pages=%d pages_with_band_word=%d' % (band_pages, band_hits))

    line('CHECK_12_READER_BACK: %s, rule: (a) the A3 page 12 holds "Words in this book" 1 time, the '
         'band word 0 times, and "Storytime Advantage" 0 times; (b) the workbook leaf page that holds '
         'page 12 and page 1: the page 12 half holds the phrase 1 time, the band word 0, and the '
         'series line 0, and the page 1 half holds the band word 0; (c) every page of the 3 reader '
         'back files holds the band word 0; (d) PRINT_GATE exits 0 on the workbook PDF/X file and C, '
         'M, and Y are 0.00000 on each page, and the 2 A3 files hold 12 pages each, %s'
         % ('; '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_13: the F7 white edge rule on the 14 A3 cover PNGs and on page 1 of the 2 A3 files.
    spec = importlib.util.spec_from_file_location('edge_white_2_9l', EDGE_SCRIPT)
    edge = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(edge)
    info_lines = []
    png_parts = []
    png_rows = png_cols = raw_cols = 0
    a3_stems = [os.path.basename(path)[:-len('-a3-cover.png')] for path in sorted(
        os.path.join(HANDOFF, 'readers-a3', name)
        for name in os.listdir(os.path.join(HANDOFF, 'readers-a3')) if name.endswith('-a3-cover.png'))]
    for stem in a3_stems:
        path = os.path.join(HANDOFF, 'readers-a3', stem + '-a3-cover.png')
        # D-P11-1: the rows count with no pixel ignored. The columns count with the outermost 3 px
        # of each side ignored (the Chrome sub-pixel seam, 0.25 mm). The raw columns are information.
        width, height, top, bottom, raw_left, raw_right = edge.edge_counts(path, 0)
        _w, _h, _t, _b, left, right = edge.edge_counts(path, 0, (PNG_SEAM_PX, 0,
                                                                   width - PNG_SEAM_PX, height))
        png_rows += top + bottom
        png_cols += left + right
        raw_cols += raw_left + raw_right
        png_parts.append('%s top=%d bottom=%d left=%d right=%d raw_left=%d raw_right=%d'
                         % (stem, top, bottom, left, right, raw_left, raw_right))
    png_rows_ok = len(a3_stems) == 14 and png_rows == 0
    png_cols_ok = len(a3_stems) == 14 and png_cols == 0
    page_parts = []
    page_rows = page_cols = 0
    page_files = ['Storytime-Advantage-L2-W01-hello-A3-v1.pdf',
                  'Storytime-Advantage-L2-W01-nan-can-nod-A3-v1.pdf']
    page_scratch = os.path.join(SCRATCH, 'p1-%d' % os.getpid())
    whole_parts = []
    whole_rows = whole_cols = 0
    renders = []
    for index, name in enumerate(page_files):
        render = edge.render_page1(os.path.join(HANDOFF, 'reader-back-r5', name), page_scratch,
                                   'g%d' % index)
        renders.append(render)
        _w, _h, top, bottom, left, right = edge.edge_counts(render, 2, PAGE1_BOX)
        page_rows += top + bottom
        page_cols += left + right
        page_parts.append('%s top=%d bottom=%d left=%d right=%d'
                          % (name.replace('Storytime-Advantage-', ''), top, bottom, left, right))
        _w, _h, top, bottom, left, right = edge.edge_counts(render, 2)
        whole_rows += top + bottom
        whole_cols += left + right
        whole_parts.append('%s top=%d bottom=%d left=%d right=%d'
                           % (name.replace('Storytime-Advantage-', ''), top, bottom, left, right))
    page_ok = page_rows == 0 and page_cols == 0
    # D-F7b-2: the hairline stripes of the w01-1 A3 cover PNG.
    stripe_spec = importlib.util.spec_from_file_location('stripe_check_2_9l', STRIPE_SCRIPT)
    stripe = importlib.util.module_from_spec(stripe_spec)
    stripe_spec.loader.exec_module(stripe)
    hello_cover = os.path.join(HANDOFF, 'readers-a3', 'l2-w01-hello-a3-cover.png')
    stripe_means = stripe.row_means(Image.open(hello_cover).convert('RGB'), 3, 4957)
    stripe_top = len(stripe.stripes(stripe_means, STRIPE_BANDS[0][0], STRIPE_BANDS[0][1], 2))
    stripe_bottom = len(stripe.stripes(stripe_means, STRIPE_BANDS[1][0], STRIPE_BANDS[1][1], 2))
    stripe_ok = stripe_top == 0 and stripe_bottom == 0
    ok = png_rows_ok and png_cols_ok and page_ok and stripe_ok
    line('CHECK_13_EDGE_WHITE: A3 PNG files=%d white_edge_rows=%d white_edge_cols=%d with the '
         'outermost %d px of each side ignored for the columns (%s), information: raw white edge '
         'columns with no pixel ignored=%d; page 1 cover box files=%d white_edge_rows=%d '
         'white_edge_cols=%d (%s); w01-1 A3 cover stripes top=%d bottom=%d; png_rows_rule=%s '
         'png_cols_rule=%s page1_box_rule=%s stripe_rule=%s, rule: the 14 '
         'A3 cover PNGs of readers-a3 hold 0 white edge rows (R, G, and B at 250 or more; no pixel '
         'ignored) and 0 white edge columns (the outermost %d px of each side ignored; D-P11-1), and '
         'page 1 of the 2 A3 files of reader-back-r5 at 100 ppi holds 0 white edge rows and 0 white '
         'edge columns in the cover box 780 x 585 px with 2 px ignored on each side of the box, and '
         'the w01-1 A3 cover PNG holds 0 stripes in the top band y 60 to 140 and 0 in the bottom '
         'band y 3368 to 3448 (D-F7b-2: the row mean over the columns 3 to 4957 is more than 15 '
         'above or below both rows 2 away), %s'
         % (len(a3_stems), png_rows, png_cols, PNG_SEAM_PX, '; '.join(png_parts), raw_cols,
            len(page_files), page_rows, page_cols, '; '.join(page_parts),
            stripe_top, stripe_bottom,
            'PASS' if png_rows_ok else 'FAIL', 'PASS' if png_cols_ok else 'FAIL',
            'PASS' if page_ok else 'FAIL', 'PASS' if stripe_ok else 'FAIL',
            PNG_SEAM_PX, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_14: whole page 1 of the 2 A3 reader files (F8 open: the cover is clipped to the leaf box).
    whole_ok = whole_rows == 0 and whole_cols == 0
    line('CHECK_14_READER_PAGE1_FILL: whole page 1 of the 2 A3 files of reader-back-r5 at 100 ppi '
         'with 2 px ignored on each side white_edge_rows=%d white_edge_cols=%d (%s), rule: whole '
         'page 1 holds 0 white edge rows and 0 white edge columns%s, %s'
         % (whole_rows, whole_cols, '; '.join(whole_parts),
            '' if whole_ok else ', reason: F8 open: the cover is clipped to the leaf box',
            'PASS' if whole_ok else 'FAIL'), whole_ok)

    # Information only: page 1 of the A3 print file at 150 ppi, 2 px ignored.
    print_render = edge.render_page1(os.path.join(HANDOFF, A3_PDFX), page_scratch, 'x', 150)
    width, height, top, bottom, left, right = edge.edge_counts(print_render, 2)
    info_lines.append('INFO_13_PRINT_FILE_PAGE1: %s page 1 at 150 ppi size=%dx%d ignore=2 top=%d '
                      'bottom=%d left=%d right=%d white_edge_rows=%d white_edge_cols=%d, information '
                      'only (no verdict)'
                      % (A3_PDFX, width, height, top, bottom, left, right, top + bottom,
                         left + right))

    manifest_end = sha256(MANIFEST)
    header = HEADER[:4] + [
        'MANIFEST_SHA256_START ' + manifest_start,
        'MANIFEST_SHA256_END ' + manifest_end,
    ] + HEADER[4:]

    failing = [lines[index] for index, item in enumerate(verdicts) if not item]
    passes = sum(1 for item in verdicts if item)
    # INFO_14: the mean absolute difference per channel between page 1 and its A3 cover PNG.
    diff_parts = []
    for render, cover_stem in zip(renders, ('l2-w01-hello', 'l2-w01-nan-can-nod')):
        page_image = Image.open(render).convert('RGB')
        cover = Image.open(os.path.join(HANDOFF, 'readers-a3', cover_stem + '-a3-cover.png'))
        cover = cover.convert('RGB').resize(page_image.size, Image.LANCZOS)
        means = ImageStat.Stat(ImageChops.difference(page_image, cover)).mean
        diff_parts.append('%s page1 %dx%d vs %s-a3-cover.png resized mean_abs_diff R=%.2f G=%.2f B=%.2f'
                          % (cover_stem, page_image.width, page_image.height, cover_stem,
                             means[0], means[1], means[2]))
    info_lines.append('INFO_14_PAGE1_VS_COVER_PNG: ' + '; '.join(diff_parts)
                      + ', information only (no verdict)')

    lines.extend(info_lines)
    lines.append('PASS_LINES=%d' % passes)
    lines.append('FAIL_LINES=%d' % len(failing))
    with open(out_txt, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(header + lines) + '\n')
    for item in header + lines:
        print(item)
    for item in failing:
        print('FAILING ' + item.split(':')[0])
    return 0 if not failing else 1


def single(argv):
    """Runs one check on one mutant file and prints one line."""
    check = argv[0]
    path = argv[1]
    extra = argv[2:]
    if check == '4':
        title = extra[0]
        parts = []
        ok = True
        pages = pdfinfo_pages(path)
        for page in range(1, pages + 1):
            count = joined(page_text(path, page)).count(title)
            ok = ok and count >= 1
            parts.append('p%d title=%d' % (page, count))
        line = 'SINGLE_4_TEXT: pages=%d %s title="%s", rule: each page holds the title, %s' \
               % (pages, ' '.join(parts), title, 'PASS' if ok else 'FAIL')
    elif check == '5':
        rows_images = images(path)
        pages = pdfinfo_pages(path)
        parts = []
        ok = True
        for page in range(1, pages + 1):
            on_page = [row for row in rows_images if row[0] == page]
            if not on_page:
                ok = False
                parts.append('p%d no_image' % page)
                continue
            best = max(on_page, key=lambda row: row[1] * row[2])
            page_ok = best[3] >= A4_PPI_MIN and best[4] >= A4_PPI_MIN
            ok = ok and page_ok
            parts.append('p%d art=%dx%d ppi=%.1fx%.1f' % (page, best[1], best[2], best[3], best[4]))
        line = 'SINGLE_5_ART_PPI: pages=%d %s, rule: each A4 page art is at 299 ppi or more, %s' \
               % (pages, ' '.join(parts), 'PASS' if ok else 'FAIL')
    elif check == '6':
        approved = approved_contact_thai()
        found = thai_only(page_text(path, 1))
        if extra and extra[0] == 'back':
            ok = found == approved
            line = 'SINGLE_6_THAI: page 1 thai_chars=%d approved=%d equal=%s, rule: the back Thai ' \
                   'equals BACK_LINES.contact, %s' \
                   % (len(found), len(approved), str(found == approved).lower(),
                      'PASS' if ok else 'FAIL')
        else:
            ok = found == ''
            line = 'SINGLE_6_THAI: page 1 thai_chars=%d, rule: the front holds no Thai, %s' \
                   % (len(found), 'PASS' if ok else 'FAIL')
    elif check == '7':
        coverage, ink_code = ink_coverage(path)
        ok = ink_code == 0 and len(coverage) >= 1
        max_c = max((row[0] for row in coverage), default=-1.0)
        max_m = max((row[1] for row in coverage), default=-1.0)
        max_y = max((row[2] for row in coverage), default=-1.0)
        for row in coverage:
            ok = ok and row[0] == 0.0 and row[1] == 0.0 and row[2] == 0.0
        line = 'SINGLE_7_LEAF_INK: pages=%d max_C=%.5f max_M=%.5f max_Y=%.5f, rule: C, M, and Y ' \
               'are 0.00000 on each page, %s' \
               % (len(coverage), max_c, max_m, max_y, 'PASS' if ok else 'FAIL')
    elif check == 'gate':
        code, output = gate(path)
        passes = output.count('All checks pass.')
        fails = [part.strip() for part in output.splitlines() if part.strip().startswith('FAIL')]
        ok = code == 0 and passes >= 1 and not fails
        line = 'SINGLE_GATE: exit=%d all_checks_pass=%d fail_lines=%d, rule: exit 0 with "All ' \
               'checks pass." and no FAIL line, %s' \
               % (code, passes, len(fails), 'PASS' if ok else 'FAIL')
    else:
        print('SINGLE_ERROR unknown check ' + check)
        return 2
    print(line)
    return 0 if ok else 1


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--single':
        sys.exit(single(sys.argv[2:]))
    sys.exit(main(sys.argv[1:]))
