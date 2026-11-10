#!/usr/bin/env python3
"""Runs the print gate checks of the Task 2.9 part 1 A2 alternate (track storytime_cover_options_20261106).

Model: `measure/tracks/storytime_cover_options_20261106/test-strategy.md` section 4.10 and the spec
rules FR-10.2 and FR-11.3, plus the checks 1 to 15 of the r5 run, with the A2 rules of check 3 and
check 11 and the new check 16.

Usage: python3 -I -B print_gate_2_9a_a2.py <hand-off folder> <out txt file> <build root> [pictures dir]

The hand-off folder holds the 2 new A2 print files under their new names and the 2 r5 print files.
The build root is the folder of the build output; it holds the `student` and `teacher` subfolders
with the Chrome PDFs, the page PNGs, and the build reports.

It writes one labeled line per check into the out file. It prints counts and PASS/FAIL lines only.
It never prints Thai text: every Thai line is dropped before any print, and the Thai check prints
the count of Thai characters only.

Check 1 is the recorded deviation of Task 2.9 check 1 (PM decision 2026-11-10). The script exits 0
when check 1 is the only failing line, and exits 1 when any other check fails.
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
BUILD_CAPTURE = os.path.join(RUNS, 'build-2-9a-a2.txt')
GATE_CAPTURE = '/tmp/opencode/c29a2/print-gate-run.txt'
PARTS_SCRIPT = os.path.join(RUNS, 'hlogo_parts_count_2_9a_a2.tsx')
SCRATCH = '/tmp/opencode/c29a2'
THAI_LO, THAI_HI = 0x0E00, 0x0E7F

# The 2 new A2 print files of the hand-off folder, and the 2 r5 print files that stay.
STUDENT_A2 = 'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf'
TEACHER_A2 = ('teacher-candidate/'
              'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf')
STUDENT_R5 = 'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf'
TEACHER_R5 = ('teacher-candidate/'
              'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate_PDFX-1a.pdf')
STUDENT_R5_SHA = '920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d'
TEACHER_R5_SHA = 'd2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37'

# The QR box of a back page: the box is 50 x 50 mm at (141, 205) mm, with a 0.6 mm brown border and
# the QR SVG at 3 mm inside the border, 44 x 44 mm (lib/storytime/print/cover-quest.ts).
QR_CROP_MM = (146.0, 210.0, 186.5, 250.5)

STORY_TEXT = 'Hello, I am Nan. Nan can nod. A nest, a net, a nut, a nose.'
HEADINGS = ['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']
LEVEL_LINE = 'Level 2 · Unit 1'
TOP_PARTS = ['game-bar', 'series-banner', 'series-logo', 'logo-box', 'logo-tile']


def run(cmd, args):
    """Runs one command and returns its stdout."""
    done = subprocess.run(cmd + args, capture_output=True, text=True)
    if done.returncode != 0:
        return ''
    return done.stdout


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
    out = run(['pdfinfo', '-box'], [path])
    found = re.search(r'^Pages:\s+(\d+)', out, re.M)
    return int(found.group(1)) if found else 0


def trimbox_deltas(path):
    """Returns the TrimBox size minus the page size, in points, for each page."""
    out = run(['pdfinfo', '-box'], [path])
    pages = pdfinfo_pages(path)
    size = re.search(r'^Page size:\s+([\d.]+) x ([\d.]+)', out, re.M)
    trim = re.search(r'^TrimBox:\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)', out, re.M)
    rows = []
    if size and trim:
        width, height = float(size.group(1)), float(size.group(2))
        trim_w = float(trim.group(3)) - float(trim.group(1))
        trim_h = float(trim.group(4)) - float(trim.group(2))
        for page in range(1, pages + 1):
            rows.append((page, (width, height), (trim_w, trim_h), abs(width - trim_w), abs(height - trim_h)))
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
        rows.append((page, page_size, page_trim, abs(page_size[0] - page_trim[0]),
                     abs(page_size[1] - page_trim[1])))
    return rows


def page_text(path, page):
    """Returns the text of one page."""
    return run(['pdftotext', '-f', str(page), '-l', str(page)], [path, '-'])


def page_text_layout(path, page):
    """Returns the text of one page in the layout form."""
    return run(['pdftotext', '-layout', '-f', str(page), '-l', str(page)], [path, '-'])


def fonts(path):
    """Returns the font count, the embedded count, and the Type 3 count of a PDF."""
    out = run(['pdffonts'], [path])
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
    out = run(['pdfimages', '-list'], [path])
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


def main(argv):
    """Runs the checks and writes the labeled lines."""
    out_folder = os.path.abspath(argv[0])
    out_txt = argv[1]
    build_root = os.path.abspath(argv[2])
    pictures_dir = argv[3] if len(argv) > 3 else os.path.join(SCRATCH, 'pictures')
    lines = []
    verdicts = []

    student_a2 = os.path.join(out_folder, STUDENT_A2)
    teacher_a2 = os.path.join(out_folder, TEACHER_A2)
    student_chrome = os.path.join(build_root, 'student', 'cover.pdf')
    teacher_chrome = os.path.join(build_root, 'teacher', 'teacher-cover.pdf')
    student_report = os.path.join(build_root, 'student', 'build-report.json')
    teacher_report = os.path.join(build_root, 'teacher', 'build-report.json')
    student_back_png = os.path.join(build_root, 'student', 'back.png')
    teacher_back_png = os.path.join(build_root, 'teacher', 'teacher-back.png')

    # Check 1: PRINT_GATE stand-alone, and the gate inside the build that had the source PDF.
    gate = ''
    if os.path.exists(GATE_CAPTURE):
        gate = open(GATE_CAPTURE, encoding='utf-8').read()
    student_gate = re.search(r'STUDENT_GATE_EXIT=(\d+)', gate)
    teacher_gate = re.search(r'TEACHER_GATE_EXIT=(\d+)', gate)
    student_gate_code = int(student_gate.group(1)) if student_gate else -1
    teacher_gate_code = int(teacher_gate.group(1)) if teacher_gate else -1
    ok1 = student_gate_code == 0 and teacher_gate_code == 0
    reasons = ' | '.join(line.strip() for line in gate.splitlines() if line.strip().startswith('FAIL'))
    build_text = open(BUILD_CAPTURE, encoding='utf-8').read()
    build_passes = build_text.count('All checks pass.')
    build_gate_line = ('the gate inside the build passed %d of 4 with the source PDF'
                        % build_passes)
    lines.append(f'CHECK_1_PRINT_GATE: student exit={student_gate_code}, teacher exit={teacher_gate_code}, '
                 + ('PASS' if ok1 else 'FAIL') + (f', reason: {reasons}' if reasons else '')
                 + f', recorded deviation of Task 2.9 check 1 (PM decision 2026-11-10), {build_gate_line}')
    verdicts.append(ok1)

    # Check 2: pages and TrimBox of the 2 new A2 print files.
    parts = []
    ok2 = True
    for label, path in (('student', student_a2), ('teacher', teacher_a2)):
        rows = trimbox_deltas(path)
        pages = len(rows)
        worst = max((max(row[3], row[4]) for row in rows), default=0.0)
        ok = pages == 2 and worst <= 0.5
        ok2 = ok2 and ok
        parts.append(f'{label} pages={pages} max_trimbox_delta_pt={worst:.3f} ' + ('ok' if ok else 'bad'))
    lines.append('CHECK_2_PAGES_TRIMBOX: ' + ', '.join(parts) + ', ' + ('PASS' if ok2 else 'FAIL'))
    verdicts.append(ok2)

    # Check 3 (A2): the front page holds Level 2 and the title of its kind, and no whole word of the
    # series name; the name is only in the logo tile, an image. The back page holds no whole word
    # "Storytime"; the kept contact lines may hold reading-advantage.
    parts = []
    ok3 = True
    for label, path, kind in (('student', student_a2, 'Student Book'), ('teacher', teacher_a2, 'Teacher Book')):
        pages = pdfinfo_pages(path)
        for page in range(1, pages + 1):
            text = joined(page_text(path, page))
            level = text.count('Level 2')
            title = text.count(kind)
            story = whole_words(text, 'Storytime')
            advantage = whole_words(text, 'Advantage')
            if page == 1:
                ok = level >= 1 and title >= 1 and story == 0 and advantage == 0
            else:
                ok = story == 0
            ok3 = ok3 and ok
            parts.append(f'{label} page {page} level_2={level} kind={title} '
                         f'word_Storytime={story} word_Advantage={advantage}')
    lines.append('CHECK_3_TEXT_COUNTS_A2: ' + ', '.join(parts)
                 + ', rule: the front page holds "Level 2" and the title of its kind, and 0 whole '
                   'words "Storytime" or "Advantage" (case-sensitive; the name is only in the logo '
                   'tile); the back page holds 0 whole words "Storytime" (the kept contact lines may '
                   'hold reading-advantage), ' + ('PASS' if ok3 else 'FAIL'))
    verdicts.append(ok3)

    # Check 4: fonts of the 2 new A2 print files.
    parts = []
    ok4 = True
    for label, path in (('student', student_a2), ('teacher', teacher_a2)):
        total, embedded, type3 = fonts(path)
        ok = total >= 1 and embedded == total and type3 == 0
        ok4 = ok4 and ok
        parts.append(f'{label} fonts={total} embedded={embedded} type3={type3}')
    lines.append('CHECK_4_FONTS: ' + ', '.join(parts) + ', ' + ('PASS' if ok4 else 'FAIL'))
    verdicts.append(ok4)

    # Check 5: the art ppi of the page-size image of each page of the 2 new A2 print files.
    parts = []
    ok5 = True
    for label, path in (('student', student_a2), ('teacher', teacher_a2)):
        rows = images(path)
        pages = pdfinfo_pages(path)
        for page in range(1, pages + 1):
            on_page = [row for row in rows if row[0] == page]
            if not on_page:
                ok5 = False
                parts.append(f'{label} page {page} no image')
                continue
            best = max(on_page, key=lambda row: row[1] * row[2])
            _, width, height, xppi, yppi = best
            ok = xppi >= 299 and yppi >= 299 and width >= 2480 and height >= 3508
            ok5 = ok5 and ok
            parts.append(f'{label} page {page} art={width}x{height} ppi={xppi:.1f}x{yppi:.1f}')
    lines.append('CHECK_5_ART_PPI: ' + ', '.join(parts) + ', ' + ('PASS' if ok5 else 'FAIL'))
    verdicts.append(ok5)

    # Check 6: the Thai byte check on the Chrome PDFs only (spec FR-10.2).
    parts = []
    ok6 = True
    approved = approved_contact_thai()
    for label, path in (('student', student_chrome), ('teacher', teacher_chrome)):
        pages = pdfinfo_pages(path)
        for page in range(1, pages + 1):
            found = thai_only(page_text(path, page))
            if page == 1:
                ok = found == ''
                rule = 'front holds no Thai'
            else:
                ok = found == approved
                rule = 'back Thai equals BACK_LINES.contact'
            ok6 = ok6 and ok
            parts.append(f'{label} page {page} thai_chars={len(found)} ({rule})')
    lines.append('CHECK_6_THAI: ' + ', '.join(parts) + f', approved contact lines thai_chars={len(approved)}, '
                 + ('PASS' if ok6 else 'FAIL'))
    verdicts.append(ok6)

    # Check 7: the QR check of the build reports and the independent module check.
    student_rows, student_fails, student_qr, student_errors = report_rows(student_report)
    teacher_rows, teacher_fails, teacher_qr, teacher_errors = report_rows(teacher_report)
    crop_qr(student_back_png, os.path.join(SCRATCH, 'qrcheck', 'assets', 'line-qr.png'))
    crop_qr(teacher_back_png, os.path.join(SCRATCH, 'qrcheck-teacher', 'assets', 'line-qr.png'))
    student_modules, student_differ, student_qr_code = qr_modules(os.path.join(SCRATCH, 'qrcheck'))
    teacher_modules, teacher_differ, teacher_qr_code = qr_modules(os.path.join(SCRATCH, 'qrcheck-teacher'))
    ok7 = (student_qr == 'pass' and teacher_qr == 'pass' and student_modules == 29 and teacher_modules == 29
           and student_differ == 0 and teacher_differ == 0)
    lines.append(f'CHECK_7_QR: report student qr={student_qr}, teacher qr={teacher_qr}; '
                 f'student back.png {student_differ} of {student_modules * student_modules} modules differ, '
                 f'teacher back {teacher_differ} of {teacher_modules * teacher_modules} modules differ, '
                 + ('PASS' if ok7 else 'FAIL'))
    verdicts.append(ok7)

    # Check 8: the build report page rows.
    total_rows = student_rows + teacher_rows
    total_fails = student_fails + teacher_fails
    ok8 = total_rows == 4 and total_fails == 0
    lines.append(f'CHECK_8_BUILD_REPORT_ROWS: student rows={student_rows} fail_rows={student_fails}, '
                 f'teacher rows={teacher_rows} fail_rows={teacher_fails}, total rows={total_rows} '
                 f'fail_rows={total_fails}, ' + ('PASS' if ok8 else 'FAIL'))
    verdicts.append(ok8)

    # Check 9: the story line of the student back page, and the five panel headings.
    text = english_only(page_text(student_chrome, 2))
    story_count = text.count(STORY_TEXT)
    heading_counts = {name: len(re.findall(r'\b' + re.escape(name) + r'\b', text)) for name in HEADINGS}
    ok9 = story_count == 1 and all(count == 1 for count in heading_counts.values())
    lines.append('CHECK_9_STORY_LINE: student cover.pdf page 2 story_text_count=%d, %s, '
                 % (story_count, ', '.join(f'{name}={count}' for name, count in heading_counts.items()))
                 + ('PASS' if ok9 else 'FAIL'))
    verdicts.append(ok9)

    # Check 10: the student build report holds no error, and the build output holds no
    # line with "is empty".
    empty_lines = sum(1 for line in build_text.splitlines() if 'is empty' in line)
    ok10 = student_errors == 0 and empty_lines == 0
    lines.append(f'CHECK_10_NO_EMPTY_FIELD: student build report errors={student_errors}, '
                 f'build output lines with "is empty"={empty_lines}, ' + ('PASS' if ok10 else 'FAIL'))
    verdicts.append(ok10)

    # Check 11 (A2): with the top style hlogo each of the 4 sides holds the logo tile as the only
    # top chrome: no game bar, no series banner, no series logo, no logo box, and one logo tile.
    rows, parts_code = hlogo_parts(pictures_dir)
    parts = []
    ok11 = parts_code == 0 and len(rows) == 4
    for kind in ('student-front', 'student-back', 'teacher-front', 'teacher-back'):
        values = rows.get(kind, {})
        counts = {name: values.get(name, -1) for name in TOP_PARTS}
        ok = (counts['game-bar'] == 0 and counts['series-banner'] == 0 and counts['series-logo'] == 0
              and counts['logo-box'] == 0 and counts['logo-tile'] == 1)
        ok11 = ok11 and ok
        parts.append(f'{kind} ' + ' '.join(f'{name}={counts[name]}' for name in TOP_PARTS))
    lines.append('CHECK_11_HLOGO_TOP_PARTS: ' + ', '.join(parts)
                 + ', rule: with the top style hlogo each of the 4 sides holds 0 game-bar, '
                   '0 series-banner, 0 series-logo, 0 logo-box, and 1 logo-tile '
                   '(renderQuestCover of dashboard/lib/storytime/print/cover-quest.ts), '
                 + ('PASS' if ok11 else 'FAIL'))
    verdicts.append(ok11)

    # Check 12: the front page of each Chrome PDF holds its level line and its book line
    # once, and the teacher front holds the band label once.
    parts = []
    ok12 = True
    level_pattern = re.compile(r'Level\s*2\s*·\s*Unit\s*1')
    for label, path, kind in (('student', student_chrome, 'Student Book'),
                              ('teacher', teacher_chrome, 'Teacher Book')):
        text = joined(english_only(page_text(path, 1)))
        level_count = len(level_pattern.findall(text))
        kind_count = text.count(kind)
        sprout_count = text.count('Sprout')
        if label == 'student':
            ok = level_count == 1 and kind_count == 1 and sprout_count == 0
        else:
            ok = level_count == 1 and kind_count == 1 and sprout_count == 1
        ok12 = ok12 and ok
        parts.append(f'{label} page 1 level_line={level_count} book_line={kind_count} sprout={sprout_count}')
    lines.append('CHECK_12_FRONT_LINES: ' + ', '.join(parts)
                 + ', rule: the front page holds "Level 2 · Unit 1" once and its book line once, '
                   'and the teacher front holds the band label "Sprout" once, ' + ('PASS' if ok12 else 'FAIL'))
    verdicts.append(ok12)

    # Check 13: the layout text of page 1 holds the level line and the book line on one
    # line, and the teacher page holds the band label once.
    parts = []
    ok13 = True
    for label, path, kind in (('student', student_chrome, 'Student Book'),
                              ('teacher', teacher_chrome, 'Teacher Book')):
        lines_text = [line for line in page_text_layout(path, 1).splitlines()
                      if not has_thai(line)]
        one_line = [line for line in lines_text
                    if 'Level 2' in line and 'Unit 1' in line and kind in line]
        level_on_line = [line for line in one_line if LEVEL_LINE in line]
        sprout_count = sum(line.count('Sprout') for line in lines_text)
        ok = len(level_on_line) == 1
        if label == 'teacher':
            ok = ok and sprout_count == 1
        else:
            ok = ok and sprout_count == 0
        ok13 = ok13 and ok
        parts.append(f'{label} page 1 layout_lines_with_level_and_book={len(level_on_line)} sprout={sprout_count}')
    lines.append('CHECK_13_PLAQUE_ONE_LINE: ' + ', '.join(parts)
                 + ', rule: one layout line of page 1 holds "Level 2 · Unit 1" and its book line, '
                   'and the teacher front holds "Sprout" once, ' + ('PASS' if ok13 else 'FAIL'))
    verdicts.append(ok13)

    # Check 14: each page of each new A2 print file holds exactly one image, the art. The logo
    # tile and the QR stay vector.
    parts = []
    ok14 = True
    for label, path in (('student', student_a2), ('teacher', teacher_a2)):
        rows = images(path)
        pages = pdfinfo_pages(path)
        for page in range(1, pages + 1):
            count = len([row for row in rows if row[0] == page])
            ok = count == 1
            ok14 = ok14 and ok
            parts.append(f'{label} page {page} images={count}')
    lines.append('CHECK_14_ONE_IMAGE_PER_PAGE: ' + ', '.join(parts)
                 + ', rule: each page holds exactly one image, the art, so the logo tile and the QR '
                   'stay vector, ' + ('PASS' if ok14 else 'FAIL'))
    verdicts.append(ok14)

    # Check 15: each new A2 print file holds no Type 3 font.
    parts = []
    ok15 = True
    for label, path in (('student', student_a2), ('teacher', teacher_a2)):
        total, embedded, type3 = fonts(path)
        ok = type3 == 0
        ok15 = ok15 and ok
        parts.append(f'{label} type3_fonts={type3} fonts={total} embedded={embedded}')
    lines.append('CHECK_15_NO_TYPE3_FONTS: ' + ', '.join(parts)
                 + ', rule: 0 Type 3 fonts in each print file, ' + ('PASS' if ok15 else 'FAIL'))
    verdicts.append(ok15)

    # Check 16 (new): the 2 r5 print files hold their r5 SHA-256 values, so the A2 alternate
    # changed nothing of the r5 hand-off.
    parts = []
    ok16 = True
    for label, rel, expected in (('student', STUDENT_R5, STUDENT_R5_SHA),
                                  ('teacher', TEACHER_R5, TEACHER_R5_SHA)):
        path = os.path.join(out_folder, rel)
        digest = sha256(path) if os.path.exists(path) else 'missing'
        ok = digest == expected
        ok16 = ok16 and ok
        parts.append(f'{label} r5 file sha256={digest} matches_r5={str(ok).lower()}')
    lines.append('CHECK_16_R5_FILES_UNCHANGED: ' + ', '.join(parts)
                 + ', rule: the 2 r5 print files hold their r5 SHA-256 values, '
                 + ('PASS' if ok16 else 'FAIL'))
    verdicts.append(ok16)

    with open(out_txt, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    for line in lines:
        print(line)
    failing = [lines[index] for index, ok in enumerate(verdicts) if not ok]
    other = [line for line in failing if not line.startswith('CHECK_1_')]
    print('PRINT_GATE_SUMMARY lines=%d fail_lines=%d other_fail_lines=%d'
          % (len(lines), len(failing), len(other)))
    return 0 if not other else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
