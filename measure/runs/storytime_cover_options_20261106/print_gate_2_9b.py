#!/usr/bin/env python3
"""Runs the print gate checks of the Task 2.9 part 2 teacher cover v2, both top variants.

Track storytime_cover_options_20261106. This script merges the checks of `print_gate_2_9a_r5.py`
(the r5 v2 file set) and `print_gate_2_9a_a2.py` (the A2 v2 file set), on the 2 new teacher print
files and their Chrome PDFs, page PNGs, and build reports only. One labeled PASS or FAIL line for
each check and each variant.

Changes to the Part 1 checks:
(1) PRINT_GATE (`make-pdfx.ts <print file> --check` in the dashboard) must exit 0 with
    "All checks pass." on both files. The check 1 deviation of Part 1 is closed by commit 805a2911,
    so check 1 has no exception and this script exits 1 on any FAIL line.
(2) The teacher front page art of both variants is 2480 x 3508 px at 299 ppi or more.
(3) The new check 17: the build report of each variant names the teacher front picture with the
    SHA-256 of the prepared file of STEP 1.3, if the report holds picture SHA-256 values; else the
    line says "not in report".

Kept: the Thai checks as counts only (front 0 Thai characters; back equal to BACK_LINES.contact),
the QR check (qr pass and 0 of 841 modules different), and the A2 rules of the hlogo variant
(check 3, check 11, check 16).

Usage: python3 -I -B print_gate_2_9b.py <out txt file>

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
GAME_BAR_SCRIPT = os.path.join(RUNS, 'game_bar_count_r3.tsx')
HLOGO_SCRIPT = os.path.join(RUNS, 'hlogo_parts_count_2_9a_a2.tsx')
BUILD_R5 = os.path.join(RUNS, 'build-2-9b-r5.txt')
BUILD_A2 = os.path.join(RUNS, 'build-2-9b-a2.txt')
SCRATCH = '/tmp/opencode/c29v2'
PICTURES_DIR = os.path.join(SCRATCH, 'pictures')
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
TEACHER = os.path.join(HANDOFF, 'teacher')

THAI_LO, THAI_HI = 0x0E00, 0x0E7F

PDFX_R5 = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf'
PDFX_A2 = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo_PDFX-1a.pdf'

# The SHA-256 of the prepared teacher front of STEP 1.3.
PREPARED_FRONT_SHA = '0901411875407c09bd69e779f5aad31b36147d84d0e742feee6316712bf96283'

# The 4 old print files of the folder (Task 2.9 part 1) keep their SHA-256 values.
GUARDS = [
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf',
     '920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d'),
    ('teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate_PDFX-1a.pdf',
     'd2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf',
     '8ae118b644765eaeab537b503cab76bc7bb573d9dae6d3b4ed567c465dc5d6fa'),
    ('teacher-candidate/'
     'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf',
     '665c044f6e828e618fc4c488564d26c6e63ddaf3d61432b3dba8aebd7596bf1a'),
]

QR_CROP_MM = (146.0, 210.0, 186.5, 250.5)

STORY_TEXT = 'Hello, I am Nan. Nan can nod. A nest, a net, a nut, a nose.'
HEADINGS = ['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']
LEVEL_LINE = 'Level 2 · Unit 1'
TOP_PARTS = ['game-bar', 'series-banner', 'series-logo', 'logo-box', 'logo-tile']
SERIES_NAME = 'Storytime Advantage'

VARIANTS = [
    {'key': 'r5', 'label': 'R5',
     'pdfx': os.path.join(TEACHER, PDFX_R5),
     'chrome': os.path.join(TEACHER, 'teacher-cover.pdf'),
     'back_png': os.path.join(TEACHER, 'teacher-back.png'),
     'report': os.path.join(TEACHER, 'build-report.json'),
     'build': BUILD_R5},
    {'key': 'a2', 'label': 'A2',
     'pdfx': os.path.join(TEACHER, PDFX_A2),
     'chrome': os.path.join(TEACHER, 'teacher-cover-alt-hlogo.pdf'),
     'back_png': os.path.join(TEACHER, 'teacher-back-alt-hlogo.png'),
     'report': os.path.join(TEACHER, 'build-report-alt-hlogo.json'),
     'build': BUILD_A2},
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


def pdfinfo_pages(path):
    """Returns the page count of a PDF."""
    code, out = run(['pdfinfo', '-box'], [path])
    found = re.search(r'^Pages:\s+(\d+)', out, re.M)
    return int(found.group(1)) if found else 0


def trimbox_deltas(path):
    """Returns one row per page: the page number, the page size, and 2 deltas of the TrimBox."""
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
            rows.append((page, (width, height), abs(width - trim_w), abs(height - trim_h)))
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
        rows.append((page, page_size, abs(page_size[0] - page_trim[0]), abs(page_size[1] - page_trim[1])))
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


def gate(path):
    """Runs the stand-alone PRINT_GATE on one print file."""
    done = subprocess.run(['npx', 'tsx', 'scripts/print/make-pdfx.ts', path, '--check'],
                          cwd=DASHBOARD, capture_output=True, text=True)
    output = done.stdout + done.stderr
    return done.returncode, output


def game_bar_counts():
    """Renders the 2 fronts and returns their game bar element counts."""
    done = subprocess.run(['npx', 'tsx', GAME_BAR_SCRIPT, PICTURES_DIR], cwd=DASHBOARD,
                          capture_output=True, text=True)
    counts = {}
    for line in done.stdout.splitlines():
        found = re.search(r'GAME_BAR_COUNT kind=(\S+) game_bar_elements=(\d+)', line)
        if found:
            counts[found.group(1)] = int(found.group(2))
    return counts, done.returncode


def hlogo_parts():
    """Renders the 4 sides with the top style hlogo and returns their part counts."""
    done = subprocess.run(['npx', 'tsx', HLOGO_SCRIPT, PICTURES_DIR], cwd=DASHBOARD,
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


def report_picture_sha(path):
    """Returns the 64-hex values of a build report and whether a picture SHA value is named."""
    text = open(path, encoding='utf-8').read()
    values = re.findall(r'\b[0-9a-f]{64}\b', text)
    named = bool(re.search(r'"[A-Za-z]*[Ss]ha256[A-Za-z]*"\s*:', text))
    return values, named


def main(argv):
    """Runs the checks and writes the labeled lines."""
    out_txt = argv[0]
    lines = []
    verdicts = []

    def line(text, ok):
        lines.append(text)
        verdicts.append(ok)

    builds = {variant['key']: open(variant['build'], encoding='utf-8').read() for variant in VARIANTS}
    approved = approved_contact_thai()

    # Check 1: the stand-alone PRINT_GATE, no exception.
    for variant in VARIANTS:
        code, output = gate(variant['pdfx'])
        passes = output.count('All checks pass.')
        fails = [item.strip() for item in output.splitlines() if item.strip().startswith('FAIL')]
        ok = code == 0 and passes == 1 and not fails
        line('CHECK_1_PRINT_GATE_%s: exit=%d, "All checks pass." count=%d, FAIL lines=%d%s, %s'
             % (variant['label'], code, passes, len(fails),
                (', reason: ' + ' | '.join(fails)) if fails else '', 'PASS' if ok else 'FAIL'), ok)

    # Check 2: 2 pages, and the TrimBox equals the page size within 0.5 pt.
    for variant in VARIANTS:
        rows = trimbox_deltas(variant['pdfx'])
        worst = max((max(row[2], row[3]) for row in rows), default=0.0)
        ok = len(rows) == 2 and worst <= 0.5
        line('CHECK_2_PAGES_TRIMBOX_%s: pages=%d max_trimbox_delta_pt=%.3f, rule: 2 pages and a '
             'TrimBox delta at most 0.5 pt, %s'
             % (variant['label'], len(rows), worst, 'PASS' if ok else 'FAIL'), ok)

    # Check 3: the text of each page. The r5 rule: the front page holds the series name, Level 2,
    # and the title of its kind, and the back page holds the series name. The A2 rule: the front
    # page holds Level 2 and the title of its kind and 0 whole words Storytime or Advantage; the
    # back page holds 0 whole words Storytime.
    for variant in VARIANTS:
        parts = []
        ok = True
        pages = pdfinfo_pages(variant['pdfx'])
        for page in range(1, pages + 1):
            text = joined(page_text(variant['pdfx'], page))
            level = text.count('Level 2')
            title = text.count('Teacher Book')
            series = text.count(SERIES_NAME)
            story_word = whole_words(text, 'Storytime')
            advantage = whole_words(text, 'Advantage')
            if variant['key'] == 'r5':
                if page == 1:
                    page_ok = series >= 1 and level >= 1 and title >= 1
                else:
                    page_ok = series >= 1
            else:
                if page == 1:
                    page_ok = level >= 1 and title >= 1 and story_word == 0 and advantage == 0
                else:
                    page_ok = story_word == 0
            ok = ok and page_ok
            parts.append('page %d level_2=%d teacher_book=%d series=%d word_Storytime=%d '
                         'word_Advantage=%d' % (page, level, title, series, story_word, advantage))
        rule = ('the front page holds the series name, Level 2, and Teacher Book, and the back page '
                'holds the series name' if variant['key'] == 'r5'
                else 'the front page holds Level 2 and Teacher Book and 0 whole words Storytime or '
                     'Advantage, and the back page holds 0 whole words Storytime')
        line('CHECK_3_TEXT_COUNTS_%s: %s, rule: %s, %s'
             % (variant['label'], ', '.join(parts), rule, 'PASS' if ok else 'FAIL'), ok)

    # Check 4: the fonts.
    for variant in VARIANTS:
        total, embedded, type3 = fonts(variant['pdfx'])
        ok = total >= 1 and embedded == total and type3 == 0
        line('CHECK_4_FONTS_%s: fonts=%d embedded=%d type3=%d, rule: every font is embedded and no '
             'Type 3 font, %s' % (variant['label'], total, embedded, type3,
                                  'PASS' if ok else 'FAIL'), ok)

    # Check 5: the art of each page is 2480 x 3508 px at 299 ppi or more. The front page line is
    # the changed check (2) of this round.
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
            if page == 1:
                page_ok = page_ok and width == 2480 and height == 3508
            ok = ok and page_ok
            parts.append('page %d art=%dx%d ppi=%.1fx%.1f' % (page, width, height, xppi, yppi))
        line('CHECK_5_ART_PPI_%s: %s, rule: each page art is 2480 x 3508 px at 299 ppi or more, and '
             'the teacher front page art of both variants is 2480 x 3508 px at 299 ppi or more, %s'
             % (variant['label'], ', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # Check 6: the Thai byte check on the Chrome PDFs only, counts only (spec FR-10.2).
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

    # Check 9: the teacher back page holds no student panel. The 5 panel headings and the story
    # text appear 0 times.
    for variant in VARIANTS:
        text = english_only(page_text(variant['chrome'], 2))
        story_count = text.count(STORY_TEXT)
        heading_counts = {name: len(re.findall(r'\b' + re.escape(name) + r'\b', text)) for name in HEADINGS}
        ok = story_count == 0 and all(count == 0 for count in heading_counts.values())
        line('CHECK_9_TEACHER_BACK_NO_PANEL_%s: story_text_count=%d, %s, rule: the teacher back page '
             'holds no student panel, %s'
             % (variant['label'], story_count,
                ', '.join('%s=%d' % (name, count) for name, count in heading_counts.items()),
                'PASS' if ok else 'FAIL'), ok)

    # Check 10: the build report holds no error, and the build output holds no line with "is empty".
    for variant in VARIANTS:
        rows, fails, qr, errors = report_rows(variant['report'])
        empty_lines = sum(1 for item in builds[variant['key']].splitlines() if 'is empty' in item)
        ok = errors == 0 and empty_lines == 0
        line('CHECK_10_NO_EMPTY_FIELD_%s: build report errors=%d, build output lines with "is empty"=%d, '
             '%s' % (variant['label'], errors, empty_lines, 'PASS' if ok else 'FAIL'), ok)

    # Check 11: the r5 fronts hold no game bar element. The A2 rule: with the top style hlogo each
    # of the 4 sides holds 0 game-bar, 0 series-banner, 0 series-logo, 0 logo-box, and 1 logo-tile.
    counts, code = game_bar_counts()
    student_bars = counts.get('student-front', -1)
    teacher_bars = counts.get('teacher-front', -1)
    ok = student_bars == 0 and teacher_bars == 0 and code == 0
    line('CHECK_11_NO_GAME_BAR_R5: student front game-bar elements=%d, teacher front game-bar '
         'elements=%d, rule: the 2 fronts hold no game bar (renderQuestCover), %s'
         % (student_bars, teacher_bars, 'PASS' if ok else 'FAIL'), ok)

    rows, code = hlogo_parts()
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
        kind_count = text.count('Teacher Book')
        sprout_count = text.count('Sprout')
        ok = level_count == 1 and kind_count == 1 and sprout_count == 1
        line('CHECK_12_FRONT_LINES_%s: page 1 level_line=%d book_line=%d sprout=%d, rule: the front '
             'page holds "Level 2 · Unit 1" once, "Teacher Book" once, and "Sprout" once, %s'
             % (variant['label'], level_count, kind_count, sprout_count,
                'PASS' if ok else 'FAIL'), ok)

    # Check 13: one layout line of page 1 holds the level line and the book line, and the teacher
    # page holds the band label once.
    for variant in VARIANTS:
        lines_text = [item for item in page_text_layout(variant['chrome'], 1).splitlines()
                      if not has_thai(item)]
        one_line = [item for item in lines_text
                    if 'Level 2' in item and 'Unit 1' in item and 'Teacher Book' in item]
        level_on_line = [item for item in one_line if LEVEL_LINE in item]
        sprout_count = sum(item.count('Sprout') for item in lines_text)
        ok = len(level_on_line) == 1 and sprout_count == 1
        line('CHECK_13_PLAQUE_ONE_LINE_%s: page 1 layout_lines_with_level_and_book=%d sprout=%d, '
             'rule: one layout line holds "Level 2 · Unit 1" and "Teacher Book", and "Sprout" holds '
             'once, %s' % (variant['label'], len(level_on_line), sprout_count,
                           'PASS' if ok else 'FAIL'), ok)

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

    # Check 16: the 4 old print files of the folder keep their SHA-256 values.
    parts = []
    ok = True
    for rel, expected in GUARDS:
        path = os.path.join(HANDOFF, rel)
        digest = sha256(path) if os.path.exists(path) else 'missing'
        item_ok = digest == expected
        ok = ok and item_ok
        parts.append('%s matches=%s' % (rel.split('/')[-1], str(item_ok).lower()))
    line('CHECK_16_GUARD_FILES: %s, rule: the 4 old print files of Task 2.9 part 1 hold their SHA-256 '
         'values, %s' % (', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # Check 17 (new): the build report of each variant names the teacher front picture with the
    # SHA-256 of the prepared file of STEP 1.3, if the report holds picture SHA-256 values.
    for variant in VARIANTS:
        values, named = report_picture_sha(variant['report'])
        if not values and not named:
            line('CHECK_17_REPORT_FRONT_SHA_%s: not in report, rule: the build report holds no '
                 'picture SHA-256 value, %s' % (variant['label'], 'PASS'), True)
            continue
        ok = PREPARED_FRONT_SHA in values
        line('CHECK_17_REPORT_FRONT_SHA_%s: report holds picture SHA values=%d, prepared front sha256 '
             'named=%s, %s' % (variant['label'], len(values), str(ok).lower(),
                               'PASS' if ok else 'FAIL'), ok)

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
