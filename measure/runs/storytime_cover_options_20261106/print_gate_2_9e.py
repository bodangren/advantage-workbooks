#!/usr/bin/env python3
"""Runs the print gate checks of the Task 2.9 part 5 reader covers (track storytime_cover_options_20261106).

This script follows `print_gate_2_9c.py` and keeps its labeled line form:
`CHECK_<n>_<NAME>_<GROUP>: <values>, rule: <rule>, PASS` or `FAIL`.

Checks:
  C1  PRINT_GATE (`npx tsx scripts/print/make-pdfx.ts <file> --check` in the dashboard) exits 0
      and prints "All checks pass." on both reader print files.
  C2  `pdfinfo -box`: 14 pages each; the A3 page is 420 x 297 mm and the leaf page is
      198 x 148.5 mm, each within 0.5 mm; the TrimBox equals the page size within 0.5 pt.
  C3  `pdffonts`: at least 1 font, every font embedded, no Type 3 font.
  C4  the D6 text proof: 14 reader rows from one tsx probe (`week`, `slug`, `title`, `litBand` of
      `questReaders()`), then `pdftotext -f p -l p` for each page p in the row order. Rule A: the
      page holds its title at least once, "Storytime Advantage" 0 times, and the upper-case band
      word 0 times. Rule L: the page holds its title at least once and "Storytime Advantage" at
      least once. It prints counts only, never the page text.
  C5  `pdfimages -list`: information only. The size and the x-ppi and y-ppi of the largest image
      of each page.
  C7  `gs -q -o - -sDEVICE=inkcov` of the leaf print file: C, M, and Y are 0.00000 on each of the
      14 pages.
  C9  the copied `build-report.json` of each reader folder: 14 page rows and 0 fail rows.
  C10 the 3 approved files of FR-11.7 keep their SHA-256 prefix, and the path list of
      `git status --porcelain` prints nothing.
  C16 the 8 pinned print files of the folder keep their SHA-256 values.

Usage: python3 -I -B print_gate_2_9e.py <out txt file>

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

REPO = '/home/daniebo/Desktop/Workbooks'
DASHBOARD = os.path.join(REPO, 'dashboard')
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
PROBE = os.path.join(RUNS, 'readers_rows_2_9e.tsx')
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')

THAI_LO, THAI_HI = 0x0E00, 0x0E7F
SERIES_NAME = 'Storytime Advantage'

A3_PDFX = 'readers-a3/Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf'
LEAF_PDFX = 'readers-leaf/Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf'

VARIANTS = [
    {'key': 'A', 'label': 'A3', 'name': 'readers-a3', 'pdfx': os.path.join(HANDOFF, A3_PDFX),
     'report': os.path.join(HANDOFF, 'readers-a3', 'build-report.json'),
     'size_mm': (420.0, 297.0), 'rule_text': 'the page holds its title, and 0 "Storytime Advantage"'},
    {'key': 'L', 'label': 'LEAF', 'name': 'readers-leaf', 'pdfx': os.path.join(HANDOFF, LEAF_PDFX),
     'report': os.path.join(HANDOFF, 'readers-leaf', 'build-report.json'),
     'size_mm': (198.0, 148.5), 'rule_text': 'the page holds its title and "Storytime Advantage"'},
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

PAGE_COUNT = 14
SIZE_TOLERANCE_MM = 0.5
TRIMBOX_TOLERANCE_PT = 0.5


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


def joined(text):
    """Returns the text with every run of white space as one space."""
    return re.sub(r'\s+', ' ', text)


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
    """Returns the page row count and the fail row count of one build report."""
    data = json.load(open(path, encoding='utf-8'))
    pages = data.get('pages', [])
    fails = 0
    for row in pages:
        checks = row.get('checks', {})
        if any(value == 'fail' for value in checks.values()):
            fails += 1
    return len(pages), fails


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


def gate(path):
    """Runs the stand-alone PRINT_GATE on one print file."""
    done = subprocess.run(['npx', 'tsx', 'scripts/print/make-pdfx.ts', path, '--check'],
                          cwd=DASHBOARD, capture_output=True, text=True)
    return done.returncode, done.stdout + done.stderr


def main(argv):
    """Runs the checks and writes the labeled lines."""
    out_txt = argv[0]
    lines = []
    verdicts = []

    def line(text, ok):
        lines.append(text)
        verdicts.append(ok)

    rows, probe_code = reader_rows()

    # C1: the stand-alone PRINT_GATE.
    for variant in VARIANTS:
        code, output = gate(variant['pdfx'])
        passes = output.count('All checks pass.')
        fails = [item.strip() for item in output.splitlines() if item.strip().startswith('FAIL')]
        ok = code == 0 and passes >= 1 and not fails
        line('CHECK_1_PRINT_GATE_%s: exit=%d, "All checks pass." count=%d, FAIL lines=%d%s, '
             'rule: exit 0 with "All checks pass." and no FAIL line, %s'
             % (variant['label'], code, passes, len(fails),
                (', reason: ' + ' | '.join(fails)) if fails else '', 'PASS' if ok else 'FAIL'), ok)

    # C2: the page count, the page size in mm, and the TrimBox.
    for variant in VARIANTS:
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

    # C3: the fonts.
    for variant in VARIANTS:
        total, embedded, type3 = fonts(variant['pdfx'])
        ok = total >= 1 and embedded == total and type3 == 0
        line('CHECK_3_FONTS_%s: fonts=%d embedded=%d type3=%d, rule: at least 1 font, every font '
             'embedded, no Type 3 font, %s'
             % (variant['label'], total, embedded, type3, 'PASS' if ok else 'FAIL'), ok)

    # C4: the D6 text proof, counts only.
    for variant in VARIANTS:
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
            band_count = text.count(row['litBand'].upper())
            if variant['key'] == 'A':
                page_ok = title_count >= 1 and series_count == 0 and band_count == 0
            else:
                page_ok = title_count >= 1 and series_count >= 1
            ok = ok and page_ok
            parts.append('p%d title=%d series=%d bandword=%d'
                         % (page, title_count, series_count, band_count))
        line('CHECK_4_TEXT_COUNTS_%s: rows=%d, %s, rule: each of the 14 pages in row order %s, %s'
             % (variant['label'], len(rows), ' '.join(parts), variant['rule_text'],
                'PASS' if ok else 'FAIL'), ok)

    # C5: information only, the largest image of each page.
    for variant in VARIANTS:
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

    # C7: the leaf ink coverage.
    coverage, ink_code = ink_coverage(
        os.path.join(HANDOFF, LEAF_PDFX))
    parts = []
    ok = ink_code == 0 and len(coverage) == PAGE_COUNT
    for index, row in enumerate(coverage):
        page_ok = row[0] == 0.0 and row[1] == 0.0 and row[2] == 0.0
        ok = ok and page_ok
        parts.append('p%d C=%.5f M=%.5f Y=%.5f K=%.5f' % (index + 1, row[0], row[1], row[2], row[3]))
    line('CHECK_7_LEAF_INK_%s: gs_exit=%d pages=%d, %s, rule: C, M, and Y are 0.00000 on each of '
         'the 14 pages, %s'
         % ('LEAF', ink_code, len(coverage), ' '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # C9: the copied build reports.
    for variant in VARIANTS:
        page_rows, fail_rows = report_rows(variant['report'])
        ok = page_rows == PAGE_COUNT and fail_rows == 0
        line('CHECK_9_BUILD_REPORT_%s: page_rows=%d fail_rows=%d, rule: %d page rows and 0 fail '
             'rows, %s'
             % (variant['label'], page_rows, fail_rows, PAGE_COUNT, 'PASS' if ok else 'FAIL'), ok)

    # C10: the approved files and the clean path list.
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

    # C16: the 8 pinned print files.
    parts = []
    ok = True
    for rel, expected in GUARDS:
        path = os.path.join(HANDOFF, rel)
        digest = sha256(path) if os.path.exists(path) else 'missing'
        item_ok = digest == expected
        ok = ok and item_ok
        parts.append('%s matches=%s' % (rel.split('/')[-1], str(item_ok).lower()))
    line('CHECK_16_GUARD_PRINT_FILES: %s, rule: the 8 pinned print files keep their SHA-256 values, '
         '%s' % (', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    passes = sum(1 for item in verdicts if item)
    failing = [lines[index] for index, item in enumerate(verdicts) if not item]
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
