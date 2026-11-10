#!/usr/bin/env python3
"""Runs the print gate checks of the Task 2.9 part 3 A2 r2 covers, the student book and the teacher book.

Track storytime_cover_options_20261106. This script follows `print_gate_2_9a_a2.py` (the A2 checks of
a student file set and a teacher file set) and `print_gate_2_9b.py` (the teacher v2 rules), on the 2
new r2 print files and their Chrome PDFs, page PNGs, and build reports only. One labeled PASS or
FAIL line for each check and each book.

Rules kept from Part 1 and Part 2:
(1) PRINT_GATE (`make-pdfx.ts <print file> --check` in the dashboard) must exit 0 with
    "All checks pass." on both files. There is no exception, and this script exits 1 on any FAIL line.
(2) The pages, the page size, the TrimBox, the PDF/X marker, and the fonts (0 Type 3).
(3) The art ppi: the teacher front page art is 2480 x 3508 px at 299 ppi or more.
(4) The Thai checks as counts only: the front holds 0 Thai characters, and each back equals
    BACK_LINES.contact.
(5) The QR check: qr pass, and 0 of 841 modules differ.
(6) The A2 rules: check 3 (the text of each page), check 11 (the top parts of the 4 sides), and
    check 16 (the 6 print files of the folder keep their SHA-256 values).

Usage: python3 -I -B print_gate_2_9c.py <out txt file> [pictures dir]

It writes one labeled line per check into the out file and prints the same lines. It never prints
Thai text: every text check prints a count only, and every Thai line is dropped before a print.

It runs inside one heavy-run wrapper (the caller does that).
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
PARTS_SCRIPT = os.path.join(RUNS, 'hlogo_parts_count_2_9a_a2.tsx')
BUILD_CAPTURE = os.path.join(RUNS, 'build-2-9c-a2r2.txt')
SCRATCH = '/tmp/opencode/c29c'
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')

THAI_LO, THAI_HI = 0x0E00, 0x0E7F

STUDENT_PDFX = 'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf'
TEACHER_PDFX = ('teacher/'
                'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf')

VARIANTS = [
    {'key': 'student', 'label': 'STUDENT', 'kind': 'Student Book',
     'pdfx': os.path.join(HANDOFF, STUDENT_PDFX),
     'chrome': os.path.join(HANDOFF, 'student', 'cover-alt-hlogo-r2.pdf'),
     'back_png': os.path.join(HANDOFF, 'student', 'back-alt-hlogo-r2.png'),
     'report': os.path.join(HANDOFF, 'student', 'build-report-alt-hlogo-r2.json')},
    {'key': 'teacher', 'label': 'TEACHER', 'kind': 'Teacher Book',
     'pdfx': os.path.join(HANDOFF, TEACHER_PDFX),
     'chrome': os.path.join(HANDOFF, 'teacher', 'teacher-cover-alt-hlogo-r2.pdf'),
     'back_png': os.path.join(HANDOFF, 'teacher', 'teacher-back-alt-hlogo-r2.png'),
     'report': os.path.join(HANDOFF, 'teacher', 'build-report-alt-hlogo-r2.json')},
]

# The 6 print files of the folder keep their SHA-256 values.
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
]

QR_CROP_MM = (146.0, 210.0, 186.5, 250.5)

STORY_TEXT = 'Hello, I am Nan. Nan can nod. A nest, a net, a nut, a nose.'
HEADINGS = ['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']
LEVEL_LINE = 'Level 2 · Unit 1'
TOP_PARTS = ['game-bar', 'series-banner', 'series-logo', 'logo-box', 'logo-tile']
SERIES_NAME = 'Storytime Advantage'
A4_MM = (210.0, 297.0)


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


def page_text(path, page):
    """Returns the text of one page."""
    code, out = run(['pdftotext', '-f', str(page), '-l', str(page)], [path, '-'])
    return out


def page_text_layout(path, page):
    """Returns the text of one page in the layout form."""
    code, out = run(['pdftotext', '-layout', '-f', str(page), '-l', str(page)], [path, '-'])
    return out


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
            rows.append((int(parts[0]), int(parts[3]), int(parts[4]), float(parts[-4]), float(parts[-3])))
        except ValueError:
            continue
    return rows


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


def approved_contact_thai():
    """Returns the Thai characters of BACK_LINES.contact (the five approved contact lines)."""
    text = open(BACK_TEXT, encoding='utf-8').read()
    start = text.find('contact')
    end = text.find(']', start)
    return thai_only(text[start:end])


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

    approved = approved_contact_thai()
    build_text = open(BUILD_CAPTURE, encoding='utf-8').read()
    empty_lines = sum(1 for item in build_text.splitlines() if 'is empty' in item)

    gates = {}

    # Check 1: the stand-alone PRINT_GATE, no exception. It also prints the page count, the PDF
    # version, and the PDF/X marker of the file.
    for variant in VARIANTS:
        code, output = gate(variant['pdfx'])
        gates[variant['key']] = (code, output)
        passes = output.count('All checks pass.')
        fails = [item.strip() for item in output.splitlines() if item.strip().startswith('FAIL')]
        found = re.search(r':\s+(\d+) pages,\s+([\d.]+) MB,\s+PDF ([\d.]+),\s+'
                          r'(PDF/X-1a:\d+|no PDF/X marker)', output)
        pages = int(found.group(1)) if found else 0
        pdf_version = found.group(3) if found else 'none'
        pdfx = found.group(4) if found else 'none'
        ok = (code == 0 and passes == 1 and not fails and pages == 2
              and pdf_version == '1.3' and pdfx.startswith('PDF/X-1a:'))
        line('CHECK_1_PRINT_GATE_%s: exit=%d, "All checks pass." count=%d, FAIL lines=%d, '
             'pages=%d pdf=%s pdfx=%s%s, %s'
             % (variant['label'], code, passes, len(fails), pages, pdf_version, pdfx,
                (', reason: ' + ' | '.join(fails)) if fails else '', 'PASS' if ok else 'FAIL'), ok)

    # Check 2: 2 pages of A4 size, and the TrimBox equals the page size within 0.5 pt.
    for variant in VARIANTS:
        sizes = page_sizes_mm(variant['pdfx'])
        deltas = trimbox_deltas(variant['pdfx'])
        worst = max((max(row[1], row[2]) for row in deltas), default=0.0)
        size_ok = len(sizes) == 2 and all(abs(width - A4_MM[0]) <= 0.2 and abs(height - A4_MM[1]) <= 0.2
                                          for _, (width, height) in sizes)
        ok = size_ok and len(deltas) == 2 and worst <= 0.5
        first = sizes[0][1] if sizes else (0.0, 0.0)
        line('CHECK_2_PAGES_SIZE_TRIMBOX_%s: pages=%d size_mm=%.1fx%.1f max_trimbox_delta_pt=%.3f, '
             'rule: 2 pages of A4 size and a TrimBox delta at most 0.5 pt, %s'
             % (variant['label'], len(sizes), first[0], first[1], worst,
                'PASS' if ok else 'FAIL'), ok)

    # Check 3 (A2): the front page holds Level 2 and the title of its kind and 0 whole words
    # Storytime or Advantage; the back page holds 0 whole words Storytime.
    for variant in VARIANTS:
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
        line('CHECK_3_TEXT_COUNTS_%s: %s, rule: the front page holds "Level 2" and "%s" and 0 whole '
             'words "Storytime" or "Advantage", and the back page holds 0 whole words "Storytime", %s'
             % (variant['label'], ', '.join(parts), variant['kind'],
                'PASS' if ok else 'FAIL'), ok)

    # Check 4: the fonts, embedded, and no Type 3 font.
    for variant in VARIANTS:
        total, embedded, type3 = fonts(variant['pdfx'])
        ok = total >= 1 and embedded == total and type3 == 0
        line('CHECK_4_FONTS_%s: fonts=%d embedded=%d type3=%d, rule: every font is embedded and no '
             'Type 3 font, %s' % (variant['label'], total, embedded, type3,
                                  'PASS' if ok else 'FAIL'), ok)

    # Check 5: the art of each page is 2480 x 3508 px at 299 ppi or more.
    for variant in VARIANTS:
        parts = []
        ok = True
        rows = images(variant['pdfx'])
        pages = pdfinfo_pages(variant['pdfx'])
        for page in range(1, pages + 1):
            on_page = [row for row in rows if row[0] == page]
            if not on_page:
                ok = False
                parts.append('page %d no image' % page)
                continue
            best = max(on_page, key=lambda row: row[1] * row[2])
            _, width, height, xppi, yppi = best
            page_ok = xppi >= 299 and yppi >= 299 and width == 2480 and height == 3508
            ok = ok and page_ok
            parts.append('page %d art=%dx%d ppi=%.1fx%.1f' % (page, width, height, xppi, yppi))
        line('CHECK_5_ART_PPI_%s: %s, rule: each page art is 2480 x 3508 px at 299 ppi or more, %s'
             % (variant['label'], ', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # Check 6: the Thai byte check on the Chrome PDFs, counts only (spec FR-10.2).
    for variant in VARIANTS:
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
        line('CHECK_6_THAI_%s: %s, approved contact lines thai_chars=%d, %s'
             % (variant['label'], ', '.join(parts), len(approved), 'PASS' if ok else 'FAIL'), ok)

    # Check 7: the QR check of the build report and the independent module check.
    for variant in VARIANTS:
        rows, fails, qr, errors = report_rows(variant['report'])
        folder = os.path.join(SCRATCH, 'qrcheck-' + variant['key'])
        crop_qr(variant['back_png'], os.path.join(folder, 'assets', 'line-qr.png'))
        modules, differ, code = qr_modules(folder)
        ok = qr == 'pass' and modules == 29 and differ == 0 and code == 0
        line('CHECK_7_QR_%s: report qr=%s; %d of %d modules differ on the back page, rule: qr pass '
             'and 0 of 841 modules different, %s'
             % (variant['label'], qr, differ, modules * modules, 'PASS' if ok else 'FAIL'), ok)

    # Check 8: the build report page rows.
    for variant in VARIANTS:
        rows, fails, qr, errors = report_rows(variant['report'])
        ok = rows == 2 and fails == 0
        line('CHECK_8_BUILD_REPORT_ROWS_%s: rows=%d fail_rows=%d, rule: 2 page rows and 0 fail rows, '
             '%s' % (variant['label'], rows, fails, 'PASS' if ok else 'FAIL'), ok)

    # Check 9: the student back page holds the story line and the 5 panel headings once. The teacher
    # back page holds no student panel.
    for variant in VARIANTS:
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
        line('CHECK_9_BACK_PANEL_%s: story_text_count=%d, %s, rule: %s, %s'
             % (variant['label'], story_count,
                ', '.join('%s=%d' % (name, count) for name, count in heading_counts.items()),
                rule, 'PASS' if ok else 'FAIL'), ok)

    # Check 10: each build report holds no error, and the build output holds no "is empty" line.
    for variant in VARIANTS:
        rows, fails, qr, errors = report_rows(variant['report'])
        ok = errors == 0 and empty_lines == 0
        line('CHECK_10_NO_EMPTY_FIELD_%s: build report errors=%d, build output lines with "is empty"=%d, '
             '%s' % (variant['label'], errors, empty_lines, 'PASS' if ok else 'FAIL'), ok)

    # Check 11 (A2): with the top style hlogo each of the 4 sides holds 0 game-bar, 0 series-banner,
    # 0 series-logo, 0 logo-box, and 1 logo-tile.
    rows, code = hlogo_parts(pictures_dir)
    parts = []
    ok = code == 0 and len(rows) == 4
    for kind in ('student-front', 'student-back', 'teacher-front', 'teacher-back'):
        values = rows.get(kind, {})
        found = {name: values.get(name, -1) for name in TOP_PARTS}
        kind_ok = (found['game-bar'] == 0 and found['series-banner'] == 0
                   and found['series-logo'] == 0 and found['logo-box'] == 0
                   and found['logo-tile'] == 1)
        ok = ok and kind_ok
        parts.append(kind + ' ' + ' '.join('%s=%d' % (name, found[name]) for name in TOP_PARTS))
    line('CHECK_11_HLOGO_TOP_PARTS_A2: %s, rule: with the top style hlogo each of the 4 sides holds '
         '0 game-bar, 0 series-banner, 0 series-logo, 0 logo-box, and 1 logo-tile, %s'
         % (', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # Check 12: the front page of each Chrome PDF holds its level line and its book line once, and
    # the teacher front holds the band label once.
    level_pattern = re.compile(r'Level\s*2\s*·\s*Unit\s*1')
    for variant in VARIANTS:
        text = joined(english_only(page_text(variant['chrome'], 1)))
        level_count = len(level_pattern.findall(text))
        kind_count = text.count(variant['kind'])
        sprout_count = text.count('Sprout')
        sprout_expected = 1 if variant['key'] == 'teacher' else 0
        ok = level_count == 1 and kind_count == 1 and sprout_count == sprout_expected
        line('CHECK_12_FRONT_LINES_%s: page 1 level_line=%d book_line=%d sprout=%d, rule: "Level 2 · '
             'Unit 1" once, "%s" once, and "Sprout" %d time(s), %s'
             % (variant['label'], level_count, kind_count, sprout_count, variant['kind'],
                sprout_expected, 'PASS' if ok else 'FAIL'), ok)

    # Check 13: one layout line of page 1 holds the level line and the book line.
    for variant in VARIANTS:
        lines_text = [item for item in page_text_layout(variant['chrome'], 1).splitlines()
                      if not has_thai(item)]
        one_line = [item for item in lines_text
                    if 'Level 2' in item and 'Unit 1' in item and variant['kind'] in item]
        level_on_line = [item for item in one_line if LEVEL_LINE in item]
        sprout_count = sum(item.count('Sprout') for item in lines_text)
        sprout_expected = 1 if variant['key'] == 'teacher' else 0
        ok = len(level_on_line) == 1 and sprout_count == sprout_expected
        line('CHECK_13_PLAQUE_ONE_LINE_%s: page 1 layout_lines_with_level_and_book=%d sprout=%d, '
             'rule: one layout line holds "Level 2 · Unit 1" and "%s", and "Sprout" %d time(s), %s'
             % (variant['label'], len(level_on_line), sprout_count, variant['kind'],
                sprout_expected, 'PASS' if ok else 'FAIL'), ok)

    # Check 14: each page of each print file holds exactly one image, the art. The logos and the QR
    # stay vector.
    for variant in VARIANTS:
        parts = []
        ok = True
        rows = images(variant['pdfx'])
        pages = pdfinfo_pages(variant['pdfx'])
        for page in range(1, pages + 1):
            count = len([row for row in rows if row[0] == page])
            ok = ok and count == 1
            parts.append('page %d images=%d' % (page, count))
        line('CHECK_14_ONE_IMAGE_PER_PAGE_%s: %s, rule: each page holds exactly one image, the art, '
             '%s' % (variant['label'], ', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # Check 15: no Type 3 font.
    for variant in VARIANTS:
        total, embedded, type3 = fonts(variant['pdfx'])
        ok = type3 == 0
        line('CHECK_15_NO_TYPE3_FONTS_%s: type3_fonts=%d fonts=%d embedded=%d, rule: 0 Type 3 fonts, '
             '%s' % (variant['label'], type3, total, embedded, 'PASS' if ok else 'FAIL'), ok)

    # Check 16: the 6 print files of the folder keep their SHA-256 values.
    parts = []
    ok = True
    for rel, expected in GUARDS:
        path = os.path.join(HANDOFF, rel)
        digest = sha256(path) if os.path.exists(path) else 'missing'
        item_ok = digest == expected
        ok = ok and item_ok
        parts.append('%s matches=%s' % (rel.split('/')[-1], str(item_ok).lower()))
    line('CHECK_16_GUARD_PRINT_FILES: %s, rule: the 6 print files of the folder keep their SHA-256 '
         'values, %s' % (', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    with open(out_txt, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    for item in lines:
        print(item)
    passes = sum(1 for item in verdicts if item)
    failing = [lines[index] for index, item in enumerate(verdicts) if not item]
    print('PRINT_GATE_SUMMARY lines=%d pass_lines=%d fail_lines=%d'
          % (len(lines), passes, len(failing)))
    for item in failing:
        print('FAILING ' + item.split(':')[0])
    return 0 if not failing else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
