#!/usr/bin/env python3
"""Runs the print gate checks of the Task 2.9 part 7 covers (track storytime_cover_options_20261106).

This script joins `print_gate_2_9f.py` (the reader print files) and `print_gate_2_9c.py` (the book
print files), with the new r3 names and the new counts of part 7. It keeps the labeled line form
`CHECK_<n>_<NAME>_<GROUP>: <values>, rule: <rule>, PASS` or `FAIL`.

Reader checks, on the 2 reader print files:
  CHECK_1  PRINT_GATE (`npx tsx scripts/print/make-pdfx.ts <file> --check` in the dashboard) exits 0
           and prints "All checks pass.".
  CHECK_2  `pdfinfo -box`: 14 pages; the A3 page is 420 x 297 mm and the leaf page is 198 x 148.5 mm,
           each within 0.5 mm; the TrimBox equals the page size within 0.5 pt.
  CHECK_3  `pdffonts`: at least 1 font, every font embedded, no Type 3 font.
  CHECK_4  the D6 text proof from one tsx probe: 14 rows, then `pdftotext -f p -l p` for each page.
           Rule A: the page holds its title at least once, "Storytime Advantage" 0 times, and the
           band word 0 times. Rule L: the page holds its title and "Storytime Advantage" at least
           once each. Counts only.
  CHECK_5  `pdfimages -list`: information only, the largest image of each page.
  CHECK_7  `gs -q -o - -sDEVICE=inkcov` of the leaf file: C, M, and Y are 0.00000 on each page.
  CHECK_9  the copied `build-report.json` of each reader folder: 14 page rows and 0 fail rows.
  CHECK_10 the 3 approved files of FR-11.7 keep their SHA-256 prefix, and `git status --porcelain`
           of the path list prints nothing.

Book checks, on the 2 new r3 print files:
  CHECK_11 PRINT_GATE: exit 0, 1 line "All checks pass.", 2 pages, PDF 1.3, a PDF/X-1a marker.
  CHECK_12 2 pages of A4 size within 0.2 mm, and a TrimBox delta at most 0.5 pt.
  CHECK_13 the fonts.
  CHECK_14 the A2 rule: the front holds "Level 2" and the title of its kind and 0 whole words
           "Storytime" or "Advantage"; the back holds 0 whole words "Storytime".
  CHECK_15 the art of each page is 2480 x 3508 px at 299 ppi or more.
  CHECK_16 the Thai byte check on the Chrome PDFs: the front holds no Thai, and each back equals
           `BACK_LINES.contact`. Counts only.
  CHECK_17 the QR check: qr pass in the report, and 0 of 841 modules differ on the back page.
  CHECK_18 the build report: 2 page rows and 0 fail rows.
  CHECK_19 the student back holds the story line and the 5 panel headings once; the teacher back
           holds no student panel.
  CHECK_20 the build report holds no error, and the build output holds no "is empty" line.
  CHECK_21 the A2 top parts: with the top style hlogo each of the 4 sides holds 0 game-bar, 0
           series-banner, 0 series-logo, 0 logo-box, and 1 logo-tile.
  CHECK_22 the front page holds "Level 2 · Unit 1" once and its book line once, and the count of
           "sprout" (any case) on the teacher front is 0 (the standing rule S5 of the cover track,
           2026-11-11).
  CHECK_23 one layout line of page 1 holds "Level 2 · Unit 1" and the book line.
  CHECK_24 each page of each print file holds exactly one image, the art.
  CHECK_25 each print file holds 0 Type 3 fonts.
  CHECK_26 the 8 pinned print files of the folder keep their SHA-256 values.

The 3 counts of part 7, from `pdftotext`:
  CHECK_27 the band word "sprout" (any case) occurs 0 times on each page of the A3 file and of the
           leaf file.
  CHECK_28 "Storytime Advantage" occurs at least once on each of the 14 pages of the leaf file.
  CHECK_29 page 1 of the r3 teacher file holds "sprout" 0 times.

Usage: python3 -I -B print_gate_2_9g.py <out txt file> [pictures dir]

It writes one labeled line per check into the out file and prints the same lines. It never prints
Thai text: every text check prints a count only, and every Thai line is dropped before a print. It
runs inside one heavy-run wrapper (the caller does that).
"""

import hashlib
import json
import os
import re
import subprocess
import sys

from PIL import Image

REPO = '/home/daniebo/Desktop/Workbooks'
DASHBOARD = os.path.join(REPO, 'dashboard')
QR_CHECK = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/options/qr_check.mjs')
BACK_TEXT = os.path.join(REPO, 'dashboard/lib/covers/back-text.ts')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
PROBE = os.path.join(RUNS, 'readers_rows_2_9f.tsx')
PARTS_SCRIPT = os.path.join(RUNS, 'hlogo_parts_count_2_9a_a2.tsx')
BUILD_CAPTURE = os.path.join(RUNS, 'build-2-9g.txt')
SCRATCH = '/tmp/opencode/c29g'
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')

THAI_LO, THAI_HI = 0x0E00, 0x0E7F
SERIES_NAME = 'Storytime Advantage'

A3_PDFX = 'readers-a3/Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf'
LEAF_PDFX = 'readers-leaf/Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf'

READER_VARIANTS = [
    {'key': 'A', 'label': 'A3', 'name': 'readers-a3', 'pdfx': os.path.join(HANDOFF, A3_PDFX),
     'report': os.path.join(HANDOFF, 'readers-a3', 'build-report.json'),
     'size_mm': (420.0, 297.0), 'rule_text': 'the page holds its title, and 0 "Storytime Advantage"'},
    {'key': 'L', 'label': 'LEAF', 'name': 'readers-leaf', 'pdfx': os.path.join(HANDOFF, LEAF_PDFX),
     'report': os.path.join(HANDOFF, 'readers-leaf', 'build-report.json'),
     'size_mm': (198.0, 148.5), 'rule_text': 'the page holds its title and "Storytime Advantage"'},
]

STUDENT_PDFX = ('student/'
                'Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r3_PDFX-1a.pdf')
TEACHER_PDFX = ('teacher/'
                'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r3_PDFX-1a.pdf')

BOOK_VARIANTS = [
    {'key': 'student', 'label': 'STUDENT_R3', 'kind': 'Student Book',
     'pdfx': os.path.join(HANDOFF, STUDENT_PDFX),
     'chrome': os.path.join(HANDOFF, 'student', 'cover-alt-hlogo-r3.pdf'),
     'back_png': os.path.join(HANDOFF, 'student', 'back-alt-hlogo-r3.png'),
     'report': os.path.join(HANDOFF, 'student', 'build-report-alt-hlogo-r3.json')},
    {'key': 'teacher', 'label': 'TEACHER_R3', 'kind': 'Teacher Book',
     'pdfx': os.path.join(HANDOFF, TEACHER_PDFX),
     'chrome': os.path.join(HANDOFF, 'teacher', 'teacher-cover-alt-hlogo-r3.pdf'),
     'back_png': os.path.join(HANDOFF, 'teacher', 'teacher-back-alt-hlogo-r3.png'),
     'report': os.path.join(HANDOFF, 'teacher', 'build-report-alt-hlogo-r3.json')},
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

# The 8 pinned print files of the hand-off folder.
GUARDS = [
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf',
     '920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf',
     '8ae118b644765eaeab537b503cab76bc7bb573d9dae6d3b4ed567c465dc5d6fa'),
    ('teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate_PDFX-1a.pdf',
     'd2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37'),
    ('teacher-candidate/'
     'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf',
     '665c044f6e828e618fc4c488564d26c6e63ddaf3d61432b3dba8aebd7596bf1a'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf',
     '1d2bcd99b347836a0dc48b8518064edb919947c0c0b26e076f05e1973f304e0e'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo_PDFX-1a.pdf',
     'f0c43292cca3add0fbfa99e8da651198f158489ad18086f33b370ac54644bf60'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf',
     'bc00778ebcc91787b708a5dec353f75aa4559218404e598bcc596ec07daf6663'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf',
     '6a50cdb2767c3afe734d96d1d38657d11f48e11289b008753d89c9a955cdeefd'),
]

QR_CROP_MM = (146.0, 210.0, 186.5, 250.5)

STORY_TEXT = 'Hello, I am Nan. Nan can nod. A nest, a net, a nut, a nose.'
HEADINGS = ['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']
LEVEL_LINE = 'Level 2 · Unit 1'
TOP_PARTS = ['game-bar', 'series-banner', 'series-logo', 'logo-box', 'logo-tile']
A4_MM = (210.0, 297.0)

PAGE_COUNT = 14
SIZE_TOLERANCE_MM = 0.5
TRIMBOX_TOLERANCE_PT = 0.5
BAND_WORD = 'sprout'


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


def page_text_layout(path, page):
    """Returns the text of one page in the layout form."""
    code, out = run(['pdftotext', '-layout', '-f', str(page), '-l', str(page)], [path, '-'])
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
    size = re.search(r'^Page size:\s+([\d.]+) x ([\d.]+)', out, re.M)
    rows = []
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


def hlogo_parts(pictures_dir):
    """Renders the 4 sides with the top style hlogo and returns their part counts."""
    done = subprocess.run(['npx', 'tsx', PARTS_SCRIPT, pictures_dir], cwd=DASHBOARD,
                          capture_output=True, text=True)
    rows = {}
    for line in done.stdout.splitlines():
        found = re.search(r'HLOGO_PARTS kind=(\S+) (.*)', line)
        if not found:
            continue
        values = {}
        for token in found.group(2).split():
            key, _, value = token.partition('=')
            try:
                values[key] = int(value)
            except ValueError:
                values[key] = -1
        rows[found.group(1)] = values
    return rows, done.returncode


def gate(path):
    """Runs the stand-alone PRINT_GATE on one print file."""
    done = subprocess.run(['npx', 'tsx', 'scripts/print/make-pdfx.ts', path, '--check'],
                          cwd=DASHBOARD, capture_output=True, text=True)
    return done.returncode, done.stdout + done.stderr


def main(argv):
    """Runs the checks and writes the labeled lines."""
    out_txt = argv[0]
    pictures_dir = argv[1] if len(argv) > 1 else os.path.join(SCRATCH, 'pictures')
    lines = []
    verdicts = []

    def line(text, ok):
        lines.append(text)
        verdicts.append(ok)

    rows, probe_code = reader_rows()

    # CHECK_1: the stand-alone PRINT_GATE on the 2 reader print files.
    for variant in READER_VARIANTS:
        code, output = gate(variant['pdfx'])
        passes = output.count('All checks pass.')
        fails = [item.strip() for item in output.splitlines() if item.strip().startswith('FAIL')]
        ok = code == 0 and passes >= 1 and not fails
        line('CHECK_1_PRINT_GATE_%s: exit=%d, "All checks pass." count=%d, FAIL lines=%d%s, '
             'rule: exit 0 with "All checks pass." and no FAIL line, %s'
             % (variant['label'], code, passes, len(fails),
                (', reason: ' + ' | '.join(fails)) if fails else '', 'PASS' if ok else 'FAIL'), ok)

    # CHECK_2: the page count, the page size in mm, and the TrimBox.
    for variant in READER_VARIANTS:
        sizes = page_sizes_mm(variant['pdfx'])
        deltas = trimbox_deltas(variant['pdfx'])
        worst = max((max(row[1], row[2]) for row in deltas), default=999.0)
        width_ok = all(abs(width - variant['size_mm'][0]) <= SIZE_TOLERANCE_MM
                       for _, (width, _height) in sizes)
        height_ok = all(abs(height - variant['size_mm'][1]) <= SIZE_TOLERANCE_MM
                        for _, (_width, height) in sizes)
        ok = len(sizes) == PAGE_COUNT and width_ok and height_ok and len(deltas) == PAGE_COUNT \
            and worst <= TRIMBOX_TOLERANCE_PT
        first = sizes[0][1] if sizes else (0.0, 0.0)
        line('CHECK_2_PAGES_SIZE_TRIMBOX_%s: pages=%d size_mm=%.2fx%.2f max_trimbox_delta_pt=%.3f, '
             'rule: %d pages of %.1f x %.1f mm within %.1f mm and a TrimBox delta at most %.1f pt, %s'
             % (variant['label'], len(sizes), first[0], first[1], worst, PAGE_COUNT,
                variant['size_mm'][0], variant['size_mm'][1], SIZE_TOLERANCE_MM,
                TRIMBOX_TOLERANCE_PT, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_3: the fonts of the 2 reader files.
    for variant in READER_VARIANTS:
        total, embedded, type3 = fonts(variant['pdfx'])
        ok = total >= 1 and embedded == total and type3 == 0
        line('CHECK_3_FONTS_%s: fonts=%d embedded=%d type3=%d, rule: at least 1 font, every font '
             'embedded, no Type 3 font, %s'
             % (variant['label'], total, embedded, type3, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_4: the D6 text proof, counts only.
    for variant in READER_VARIANTS:
        parts = []
        ok = probe_code == 0 and len(rows) == PAGE_COUNT
        for page in range(1, PAGE_COUNT + 1):
            row = rows[page - 1] if page - 1 < len(rows) else None
            if row is None:
                ok = False
                parts.append('page %d no_row' % page)
                continue
            text = joined(page_text(variant['pdfx'], page))
            title_count = text.count(row['title'])
            series_count = text.count(SERIES_NAME)
            bandword_count = text.count(row['litBand'].upper())
            if variant['key'] == 'A':
                page_ok = title_count >= 1 and series_count == 0 and bandword_count == 0
            else:
                page_ok = title_count >= 1 and series_count >= 1
            ok = ok and page_ok
            parts.append('p%d title=%d series=%d bandword=%d'
                         % (page, title_count, series_count, bandword_count))
        line('CHECK_4_TEXT_COUNTS_%s: rows=%d, %s, rule: each of the 14 pages in row order %s, %s'
             % (variant['label'], len(rows), ' '.join(parts), variant['rule_text'],
                'PASS' if ok else 'FAIL'), ok)

    # CHECK_5: information only, the largest image of each page.
    for variant in READER_VARIANTS:
        parts = []
        rows_images = images(variant['pdfx'])
        for page in range(1, PAGE_COUNT + 1):
            on_page = [row for row in rows_images if row[0] == page]
            if not on_page:
                parts.append('p%d no_image' % page)
                continue
            best = max(on_page, key=lambda row: row[1] * row[2])
            parts.append('p%d %dx%d %.1fx%.1fppi' % (page, best[1], best[2], best[3], best[4]))
        line('CHECK_5_ART_IMAGE_LIST_%s: %s, rule: information only, the largest image of each page, '
             'PASS' % (variant['label'], ' '.join(parts)), True)

    # CHECK_7: the leaf ink coverage.
    coverage, ink_code = ink_coverage(os.path.join(HANDOFF, LEAF_PDFX))
    parts = []
    ok = ink_code == 0 and len(coverage) == PAGE_COUNT
    for index, row in enumerate(coverage):
        page_ok = row[0] == 0.0 and row[1] == 0.0 and row[2] == 0.0
        ok = ok and page_ok
        parts.append('p%d C=%.5f M=%.5f Y=%.5f K=%.5f' % (index + 1, row[0], row[1], row[2], row[3]))
    line('CHECK_7_LEAF_INK_LEAF: gs_exit=%d pages=%d, %s, rule: C, M, and Y are 0.00000 on each of '
         'the 14 pages, %s'
         % (ink_code, len(coverage), ' '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_9: the copied build reports.
    for variant in READER_VARIANTS:
        data = json.load(open(variant['report'], encoding='utf-8'))
        page_rows = len(data.get('pages', []))
        fail_rows = 0
        for row in data.get('pages', []):
            if any(value == 'fail' for value in row.get('checks', {}).values()):
                fail_rows += 1
        ok = page_rows == PAGE_COUNT and fail_rows == 0
        line('CHECK_9_BUILD_REPORT_%s: page_rows=%d fail_rows=%d, rule: %d page rows and 0 fail '
             'rows, %s'
             % (variant['label'], page_rows, fail_rows, PAGE_COUNT, 'PASS' if ok else 'FAIL'), ok)

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

    # CHECK_11: the stand-alone PRINT_GATE on the 2 r3 book print files.
    for variant in BOOK_VARIANTS:
        code, output = gate(variant['pdfx'])
        passes = output.count('All checks pass.')
        fails = [item.strip() for item in output.splitlines() if item.strip().startswith('FAIL')]
        found = re.search(r':\s+(\d+) pages,\s+([\d.]+) MB,\s+PDF ([\d.]+),\s+'
                          r'(PDF/X-1a:\d+|no PDF/X marker)', output)
        pages = int(found.group(1)) if found else 0
        pdf_version = found.group(3) if found else 'none'
        pdfx = found.group(4) if found else 'none'
        ok = (code == 0 and passes == 1 and not fails and pages == 2
              and pdf_version == '1.3' and pdfx.startswith('PDF/X-1a:'))
        line('CHECK_11_PRINT_GATE_%s: exit=%d, "All checks pass." count=%d, FAIL lines=%d, '
             'pages=%d pdf=%s pdfx=%s%s, %s'
             % (variant['label'], code, passes, len(fails), pages, pdf_version, pdfx,
                (', reason: ' + ' | '.join(fails)) if fails else '', 'PASS' if ok else 'FAIL'), ok)

    # CHECK_12: 2 pages of A4 size, and the TrimBox.
    for variant in BOOK_VARIANTS:
        sizes = page_sizes_mm(variant['pdfx'])
        deltas = trimbox_deltas(variant['pdfx'])
        worst = max((max(row[1], row[2]) for row in deltas), default=0.0)
        size_ok = len(sizes) == 2 and all(abs(width - A4_MM[0]) <= 0.2
                                          and abs(height - A4_MM[1]) <= 0.2
                                          for _, (width, height) in sizes)
        ok = size_ok and len(deltas) == 2 and worst <= 0.5
        first = sizes[0][1] if sizes else (0.0, 0.0)
        line('CHECK_12_PAGES_SIZE_TRIMBOX_%s: pages=%d size_mm=%.1fx%.1f max_trimbox_delta_pt=%.3f, '
             'rule: 2 pages of A4 size and a TrimBox delta at most 0.5 pt, %s'
             % (variant['label'], len(sizes), first[0], first[1], worst,
                'PASS' if ok else 'FAIL'), ok)

    # CHECK_13: the fonts of the 2 book files.
    for variant in BOOK_VARIANTS:
        total, embedded, type3 = fonts(variant['pdfx'])
        ok = total >= 1 and embedded == total and type3 == 0
        line('CHECK_13_FONTS_%s: fonts=%d embedded=%d type3=%d, rule: every font is embedded and no '
             'Type 3 font, %s' % (variant['label'], total, embedded, type3,
                                  'PASS' if ok else 'FAIL'), ok)

    # CHECK_14 (A2): the front and the back text rules.
    for variant in BOOK_VARIANTS:
        parts = []
        ok = True
        pages = pdfinfo_pages(variant['pdfx'])
        for page in range(1, pages + 1):
            text = joined(page_text(variant['pdfx'], page))
            level = text.count('Level 2')
            title = text.count(variant['kind'])
            story_word = whole_words(text, 'Storytime')
            advantage = whole_words(text, 'Advantage')
            series = text.count(SERIES_NAME)
            if page == 1:
                page_ok = level >= 1 and title >= 1 and story_word == 0 and advantage == 0
            else:
                page_ok = story_word == 0
            ok = ok and page_ok
            parts.append('page %d level_2=%d book_line=%d series=%d word_Storytime=%d '
                         'word_Advantage=%d' % (page, level, title, series, story_word, advantage))
        line('CHECK_14_TEXT_COUNTS_%s: %s, rule: the front page holds "Level 2" and "%s" and 0 whole '
             'words "Storytime" or "Advantage", and the back page holds 0 whole words "Storytime", %s'
             % (variant['label'], ', '.join(parts), variant['kind'],
                'PASS' if ok else 'FAIL'), ok)

    # CHECK_15: the art of each page is 2480 x 3508 px at 299 ppi or more.
    for variant in BOOK_VARIANTS:
        parts = []
        ok = True
        rows_images = images(variant['pdfx'])
        pages = pdfinfo_pages(variant['pdfx'])
        for page in range(1, pages + 1):
            on_page = [row for row in rows_images if row[0] == page]
            if not on_page:
                ok = False
                parts.append('page %d no image' % page)
                continue
            best = max(on_page, key=lambda row: row[1] * row[2])
            _, width, height, xppi, yppi = best
            page_ok = xppi >= 299 and yppi >= 299 and width == 2480 and height == 3508
            ok = ok and page_ok
            parts.append('page %d art=%dx%d ppi=%.1fx%.1f' % (page, width, height, xppi, yppi))
        line('CHECK_15_ART_PPI_%s: %s, rule: each page art is 2480 x 3508 px at 299 ppi or more, %s'
             % (variant['label'], ', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_16: the Thai byte check on the Chrome PDFs, counts only (spec FR-10.2).
    approved = approved_contact_thai()
    for variant in BOOK_VARIANTS:
        parts = []
        ok = True
        pages = pdfinfo_pages(variant['chrome'])
        for page in range(1, pages + 1):
            found = thai_only(page_text(variant['chrome'], page))
            if page == 1:
                page_ok = found == ''
                rule = 'front holds no Thai'
            else:
                page_ok = found == approved
                rule = 'back Thai equals BACK_LINES.contact'
            ok = ok and page_ok
            parts.append('page %d thai_chars=%d (%s)' % (page, len(found), rule))
        line('CHECK_16_THAI_%s: %s, approved contact lines thai_chars=%d, %s'
             % (variant['label'], ', '.join(parts), len(approved), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_17: the QR check of the build report and the independent module check.
    for variant in BOOK_VARIANTS:
        page_rows, fail_rows, qr, errors = report_rows(variant['report'])
        folder = os.path.join(SCRATCH, 'qrcheck-' + variant['key'])
        crop_qr(variant['back_png'], os.path.join(folder, 'assets', 'line-qr.png'))
        modules, differ, code = qr_modules(folder)
        ok = qr == 'pass' and modules == 29 and differ == 0 and code == 0
        line('CHECK_17_QR_%s: report qr=%s; %d of %d modules differ on the back page, rule: qr pass '
             'and 0 of 841 modules different, %s'
             % (variant['label'], qr, differ, modules * modules, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_18: the build report page rows.
    for variant in BOOK_VARIANTS:
        page_rows, fail_rows, qr, errors = report_rows(variant['report'])
        ok = page_rows == 2 and fail_rows == 0
        line('CHECK_18_BUILD_REPORT_ROWS_%s: rows=%d fail_rows=%d, rule: 2 page rows and 0 fail '
             'rows, %s' % (variant['label'], page_rows, fail_rows, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_19: the student back page holds the story line and the 5 panel headings once. The teacher
    # back page holds no student panel.
    for variant in BOOK_VARIANTS:
        text = english_only(page_text(variant['chrome'], 2))
        story_count = text.count(STORY_TEXT)
        heading_counts = {name: len(re.findall(r'\b' + re.escape(name) + r'\b', text))
                          for name in HEADINGS}
        if variant['key'] == 'student':
            ok = story_count == 1 and all(count == 1 for count in heading_counts.values())
            rule = 'the story line and the 5 panel headings appear once'
        else:
            ok = story_count == 0 and all(count == 0 for count in heading_counts.values())
            rule = 'the teacher back page holds no student panel'
        line('CHECK_19_BACK_PANEL_%s: story_text_count=%d, %s, rule: %s, %s'
             % (variant['label'], story_count,
                ', '.join('%s=%d' % (name, count) for name, count in heading_counts.items()),
                rule, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_20: each build report holds no error, and the build output holds no "is empty" line.
    build_text = open(BUILD_CAPTURE, encoding='utf-8').read()
    empty_lines = sum(1 for item in build_text.splitlines() if 'is empty' in item)
    for variant in BOOK_VARIANTS:
        page_rows, fail_rows, qr, errors = report_rows(variant['report'])
        ok = errors == 0 and empty_lines == 0
        line('CHECK_20_NO_EMPTY_FIELD_%s: build report errors=%d, build output lines with "is empty"=%d, '
             '%s' % (variant['label'], errors, empty_lines, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_21 (A2): with the top style hlogo each of the 4 sides holds 0 game-bar, 0 series-banner,
    # 0 series-logo, 0 logo-box, and 1 logo-tile.
    parts_rows, parts_code = hlogo_parts(pictures_dir)
    parts = []
    ok = parts_code == 0 and len(parts_rows) == 4
    for kind in ('student-front', 'student-back', 'teacher-front', 'teacher-back'):
        values = parts_rows.get(kind, {})
        found = {name: values.get(name, -1) for name in TOP_PARTS}
        kind_ok = (found['game-bar'] == 0 and found['series-banner'] == 0
                   and found['series-logo'] == 0 and found['logo-box'] == 0
                   and found['logo-tile'] == 1)
        ok = ok and kind_ok
        parts.append(kind + ' ' + ' '.join('%s=%d' % (name, found[name]) for name in TOP_PARTS))
    line('CHECK_21_HLOGO_TOP_PARTS_A2: %s, rule: with the top style hlogo each of the 4 sides holds '
         '0 game-bar, 0 series-banner, 0 series-logo, 0 logo-box, and 1 logo-tile, %s'
         % (', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_22: the front page holds the level line and the book line once. The teacher front holds
    # the band word 0 times (the standing rule S5). The student count is information only.
    level_pattern = re.compile(r'Level\s*2\s*·\s*Unit\s*1')
    for variant in BOOK_VARIANTS:
        text = joined(english_only(page_text(variant['chrome'], 1)))
        level_count = len(level_pattern.findall(text))
        kind_count = text.count(variant['kind'])
        sprout_count = band_count(text)
        page_ok = level_count == 1 and kind_count == 1
        if variant['key'] == 'teacher':
            page_ok = page_ok and sprout_count == 0
            rule = 'the teacher front holds the band word 0 times'
        else:
            rule = 'the student front band word count is information only'
        ok = page_ok
        line('CHECK_22_FRONT_LINES_%s: page 1 level_line=%d book_line=%d sprout=%d, rule: "Level 2 · '
             'Unit 1" once, "%s" once, and %s, %s'
             % (variant['label'], level_count, kind_count, sprout_count, variant['kind'],
                rule, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_23: one layout line of page 1 holds the level line and the book line.
    for variant in BOOK_VARIANTS:
        layout_lines = [item for item in page_text_layout(variant['chrome'], 1).splitlines()
                        if not has_thai(item)]
        one_line = [item for item in layout_lines
                    if 'Level 2' in item and 'Unit 1' in item and variant['kind'] in item]
        level_on_line = [item for item in one_line if LEVEL_LINE in item]
        sprout_count = sum(band_count(item) for item in layout_lines)
        ok = len(level_on_line) == 1
        line('CHECK_23_PLAQUE_ONE_LINE_%s: page 1 layout_lines_with_level_and_book=%d sprout=%d, '
             'rule: one layout line holds "Level 2 · Unit 1" and "%s", %s'
             % (variant['label'], len(level_on_line), sprout_count, variant['kind'],
                'PASS' if ok else 'FAIL'), ok)

    # CHECK_24: each page of each print file holds exactly one image, the art.
    for variant in BOOK_VARIANTS:
        parts = []
        ok = True
        rows_images = images(variant['pdfx'])
        pages = pdfinfo_pages(variant['pdfx'])
        for page in range(1, pages + 1):
            count = len([row for row in rows_images if row[0] == page])
            ok = ok and count == 1
            parts.append('page %d images=%d' % (page, count))
        line('CHECK_24_ONE_IMAGE_PER_PAGE_%s: %s, rule: each page holds exactly one image, the art, '
             '%s' % (variant['label'], ', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_25: no Type 3 font.
    for variant in BOOK_VARIANTS:
        total, embedded, type3 = fonts(variant['pdfx'])
        ok = type3 == 0
        line('CHECK_25_NO_TYPE3_FONTS_%s: type3_fonts=%d fonts=%d embedded=%d, rule: 0 Type 3 fonts, '
             '%s' % (variant['label'], type3, total, embedded, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_26: the 8 pinned print files of the folder keep their SHA-256 values.
    parts = []
    ok = True
    for rel, expected in GUARDS:
        path = os.path.join(HANDOFF, rel)
        digest = sha256(path) if os.path.exists(path) else 'missing'
        item_ok = digest == expected
        ok = ok and item_ok
        parts.append('%s matches=%s' % (rel.split('/')[-1], str(item_ok).lower()))
    line('CHECK_26_GUARD_PRINT_FILES: %s, rule: the 8 pinned print files of the folder keep their '
         'SHA-256 values, %s' % (', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_27: the band word of Level 2 in any case is 0 on each reader page.
    for variant in READER_VARIANTS:
        parts = []
        ok = True
        for page in range(1, PAGE_COUNT + 1):
            count = band_count(joined(page_text(variant['pdfx'], page)))
            ok = ok and count == 0
            parts.append('p%d bandword=%d' % (page, count))
        line('CHECK_27_BANDWORD_READERS_%s: %s, rule: %s occurs 0 times on each of the 14 pages, %s'
             % (variant['label'], ' '.join(parts), BAND_WORD, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_28: the series name appears at least once on each leaf page.
    parts = []
    ok = True
    for page in range(1, PAGE_COUNT + 1):
        count = joined(page_text(os.path.join(HANDOFF, LEAF_PDFX), page)).count(SERIES_NAME)
        ok = ok and count >= 1
        parts.append('p%d series=%d' % (page, count))
    line('CHECK_28_LEAF_SERIES_EACH_PAGE: %s, rule: "%s" occurs at least once on each of the 14 '
         'pages, %s' % (' '.join(parts), SERIES_NAME, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_29: page 1 of the r3 teacher file holds the band word 0 times.
    teacher = [item for item in BOOK_VARIANTS if item['key'] == 'teacher'][0]
    count = band_count(joined(page_text(teacher['pdfx'], 1)))
    ok = count == 0
    line('CHECK_29_TEACHER_R3_FRONT_SPROUT: page 1 bandword=%d, rule: %s occurs 0 times on page 1 of '
         'the r3 teacher file, %s' % (count, BAND_WORD, 'PASS' if ok else 'FAIL'), ok)

    failing = [lines[index] for index, item in enumerate(verdicts) if not item]
    passes = sum(1 for item in verdicts if item)
    lines.append('PASS_LINES=%d' % passes)
    lines.append('FAIL_LINES=%d' % len(failing))
    with open(out_txt, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    for item in lines:
        print(item)
    for item in failing:
        print('FAILING ' + item.split(':')[0])
    return 0 if not failing else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
