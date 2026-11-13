#!/usr/bin/env python3
"""Runs the print gates of the r6 book covers (Task (Green, F10), step 8, D-F10-12).

Track storytime_cover_options_20261106. The scope is the r6 folder
`~/Desktop/print-ready/storytime/covers-quest-v1-books-r6/`: the 2 PDF/X-1a files (4 print pages:
student front, student back, teacher front, teacher back), the 2 Chrome PDFs, the 4 page PNGs, the 2
build reports, and the contact sheet.

The helper functions (run, sha256, thai_only, joined, whole_words, page_text, page_sizes_mm,
trimbox_deltas, fonts, images, report_rows, approved_contact_thai, crop_qr, qr_modules, gate) come
from `print_gate_final_2_9l.py` by import, so they stay byte-equal to the r5 gate.

The checks, in the numbering of the r5 log where a check is the same:
  CHECK_1  PRINT_GATE on each of the 2 PDF/X files: exit 0, "All checks pass.", and no FAIL line.
  CHECK_2  `pdfinfo -box`: 2 pages of 210 x 297 mm within 0.2 mm, a TrimBox delta at most 0.5 pt.
  CHECK_3  `pdffonts`: at least 1 font, every font embedded, no Type 3 font.
  CHECK_4  CHANGED for r6 (D-F10-12, Q20): page 1 holds "Storytime Advantage" at least once (white
           space joined), "Level 2", and the book line; page 2 (the back) holds 0 whole words
           "Storytime" and "Advantage", because the back keeps the logo picture. The r5 rule pinned
           0 series words on page 1 too (D-1 of `print-gate.txt`).
  CHECK_5  `pdfimages -list`: the art of each A4 page is 2480 x 3508 px at 299 ppi or more.
  CHECK_6  the Thai byte check on the 2 Chrome PDFs, never on a PDF/X file (F13): page 1 holds 0
           Thai characters, and page 2 holds the Thai of `BACK_LINES.contact` (counts only).
  CHECK_8  the QR check of the build report and the independent module check (0 of 841 modules
           differ on the back page).
  CHECK_9  the 2 build reports hold 2 page rows each and 0 fail rows.
  CHECK_10 the 3 approved files keep their SHA-256 prefix, and `git status --porcelain` of the
           shared cover paths prints nothing.
  CHECK_11 the contact sheet opens as PNG.
  CHECK_12 the r6 back PNGs equal the r5 back PNGs of the accepted folder (M-F10-12).
  CHECK_13 the accepted `MANIFEST.txt` of `covers-quest-v1` hashes to 8f1901a3... at the start and
           at the end of the gate.

Usage: python3 -I -B print_gate_f10.py <out txt file>

Each check line starts with PASS or FAIL. The log ends with the lines `SUMMARY PASS_LINES=<n>` and
`SUMMARY FAIL_LINES=<n>`. It never prints Thai text: the Thai check
prints counts only. It runs inside one heavy-run wrapper (the caller does that).
"""

import importlib.util
import os
import subprocess
import sys

from PIL import Image

RUNS = os.path.dirname(os.path.abspath(__file__))
_SPEC = importlib.util.spec_from_file_location('gate_r5', os.path.join(RUNS, 'print_gate_final_2_9l.py'))
R5 = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(R5)

HOME = os.path.expanduser('~')
OUT = os.path.join(HOME, 'Desktop/print-ready/storytime/covers-quest-v1-books-r6')
ACCEPTED = os.path.join(HOME, 'Desktop/print-ready/storytime/covers-quest-v1')
ACCEPTED_MANIFEST = os.path.join(ACCEPTED, 'MANIFEST.txt')
ACCEPTED_SHA = '8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87'
SCRATCH = '/tmp/opencode/p2f10/gate'
SHEET = os.path.join(OUT, 'contact-sheets', 'books-r6.png')

BOOKS = [
    {'key': 'student-r6', 'label': 'STUDENT_R6', 'kind': 'Student Book', 'pages': 2,
     'pdfx': os.path.join(OUT, 'student',
                          'Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r6_PDFX-1a.pdf'),
     'chrome': os.path.join(OUT, 'student', 'cover-alt-hlogo-r6.pdf'),
     'back_png': os.path.join(OUT, 'student', 'back-alt-hlogo-r6.png'),
     'r5_back_png': os.path.join(ACCEPTED, 'student', 'back-alt-hlogo-r5.png'),
     'report': os.path.join(OUT, 'student', 'build-report-alt-hlogo-r6.json')},
    {'key': 'teacher-r6', 'label': 'TEACHER_R6', 'kind': 'Teacher Book', 'pages': 2,
     'pdfx': os.path.join(OUT, 'teacher',
                          'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r6_PDFX-1a.pdf'),
     'chrome': os.path.join(OUT, 'teacher', 'teacher-cover-alt-hlogo-r6.pdf'),
     'back_png': os.path.join(OUT, 'teacher', 'teacher-back-alt-hlogo-r6.png'),
     'r5_back_png': os.path.join(ACCEPTED, 'teacher', 'teacher-back-alt-hlogo-r5.png'),
     'report': os.path.join(OUT, 'teacher', 'build-report-alt-hlogo-r6.json')},
]

HEADER = [
    'PRINT GATE LOG - Task (Green, F10), the r6 book covers (track storytime_cover_options_20261106)',
    'DATE 2026-11-13',
    'ROLE measure-jr-green, model claude-code/claude-opus-5-5, role base b17ac103',
    'SCOPE the 2 PDF/X-1a files of covers-quest-v1-books-r6 (4 print pages: student front, student '
    'back, teacher front, teacher back), the 2 Chrome PDFs, the 2 back PNGs, the 2 build reports, '
    'and contact-sheets/books-r6.png.',
    'D-F10-12 (check 4, changed for r6): page 1 holds "Storytime Advantage" (white space joined), '
    '"Level 2", and the book line; page 2 holds 0 whole words "Storytime" and "Advantage". The r5 '
    'rule (D-1 of print-gate.txt) pinned 0 series words on page 1, and that rule let a front with '
    'no title pass.',
]


def main(argv):
    """Runs the checks and writes the labeled lines."""
    out_txt = argv[0]
    lines = []
    verdicts = []

    def line(text, ok):
        lines.append(text)
        verdicts.append(ok)

    manifest_start = R5.sha256(ACCEPTED_MANIFEST)

    # CHECK_1: the stand-alone PRINT_GATE on the 2 print files.
    for item in BOOKS:
        code, output = R5.gate(item['pdfx'])
        passes = output.count('All checks pass.')
        fails = [part.strip() for part in output.splitlines() if part.strip().startswith('FAIL')]
        found = R5.re.search(r':\s+(\d+) pages,\s+([\d.]+) MB,\s+PDF ([\d.]+),\s+'
                             r'(PDF/X-1a:\d+|no PDF/X marker)', output)
        pages = int(found.group(1)) if found else 0
        pdf_version = found.group(3) if found else 'none'
        pdfx = found.group(4) if found else 'none'
        ok = code == 0 and passes >= 1 and not fails and pdfx.startswith('PDF/X-1a')
        line('CHECK_1_PRINT_GATE_%s: exit=%d, "All checks pass." count=%d, FAIL lines=%d, pages=%d '
             'pdf=%s pdfx=%s, rule: exit 0 with "All checks pass." and no FAIL line, %s'
             % (item['label'], code, passes, len(fails), pages, pdf_version, pdfx,
                'PASS' if ok else 'FAIL'), ok)

    # CHECK_2: the page count, the page size in mm, and the TrimBox.
    for item in BOOKS:
        sizes = R5.page_sizes_mm(item['pdfx'])
        deltas = R5.trimbox_deltas(item['pdfx'])
        worst = max((max(row[1], row[2]) for row in deltas), default=999.0)
        size_ok = all(abs(width - 210.0) <= 0.2 and abs(height - 297.0) <= 0.2
                      for _, (width, height) in sizes)
        ok = len(sizes) == 2 and size_ok and len(deltas) == 2 and worst <= R5.TRIMBOX_TOLERANCE_PT
        first = sizes[0][1] if sizes else (0.0, 0.0)
        line('CHECK_2_PAGES_SIZE_TRIMBOX_%s: pages=%d size_mm=%.2fx%.2f max_trimbox_delta_pt=%.3f, '
             'rule: 2 pages of 210.0 x 297.0 mm within 0.2 mm and a TrimBox delta at most 0.5 pt, %s'
             % (item['label'], len(sizes), first[0], first[1], worst, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_3: the fonts.
    for item in BOOKS:
        total, embedded, type3 = R5.fonts(item['pdfx'])
        ok = total >= 1 and embedded == total and type3 == 0
        line('CHECK_3_FONTS_%s: fonts=%d embedded=%d type3=%d, rule: at least 1 font, every font '
             'embedded, no Type 3 font, %s'
             % (item['label'], total, embedded, type3, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_4 (changed for r6, D-F10-12): the title text on the front, 0 series words on the back.
    for item in BOOKS:
        parts = []
        ok = True
        for page in range(1, 3):
            text = R5.joined(R5.page_text(item['pdfx'], page))
            series = text.count(R5.SERIES_NAME)
            level = text.count('Level 2')
            kind = text.count(item['kind'])
            story_word = R5.whole_words(text, 'Storytime')
            advantage = R5.whole_words(text, 'Advantage')
            if page == 1:
                page_ok = series >= 1 and level >= 1 and kind >= 1
            else:
                page_ok = story_word == 0 and advantage == 0
            ok = ok and page_ok
            parts.append('page %d series_name=%d level_2=%d book_line=%d word_Storytime=%d '
                         'word_Advantage=%d' % (page, series, level, kind, story_word, advantage))
        line('CHECK_4_TEXT_COUNTS_%s: %s, rule: the front page holds "Storytime Advantage" at least '
             'once, "Level 2", and "%s", and the back page holds 0 whole words "Storytime" or '
             '"Advantage" (D-F10-12), %s'
             % (item['label'], ', '.join(parts), item['kind'], 'PASS' if ok else 'FAIL'), ok)

    # CHECK_5: the art of each A4 page is at 299 ppi or more.
    for item in BOOKS:
        parts = []
        ok = True
        rows = R5.images(item['pdfx'])
        for page in range(1, 3):
            on_page = [row for row in rows if row[0] == page]
            if not on_page:
                ok = False
                parts.append('page %d no image' % page)
                continue
            _, width, height, xppi, yppi = max(on_page, key=lambda row: row[1] * row[2])
            page_ok = xppi >= R5.A4_PPI_MIN and yppi >= R5.A4_PPI_MIN and width == 2480 and height == 3508
            ok = ok and page_ok
            parts.append('page %d art=%dx%d ppi=%.1fx%.1f' % (page, width, height, xppi, yppi))
        line('CHECK_5_ART_PPI_%s: %s, rule: each A4 page art is 2480 x 3508 px at 299 ppi or more, %s'
             % (item['label'], ', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_6: the Thai byte check on the 2 Chrome PDFs, counts only.
    approved = R5.approved_contact_thai()
    for item in BOOKS:
        parts = []
        ok = True
        for page in range(1, 3):
            found = R5.thai_only(R5.page_text(item['chrome'], page))
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
             % (item['label'], ', '.join(parts), len(approved), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_8: the QR check of the build report and the independent module check.
    for item in BOOKS:
        _rows, _fails, qr, _errors = R5.report_rows(item['report'])
        folder = os.path.join(SCRATCH, 'qrcheck-' + item['key'])
        R5.crop_qr(item['back_png'], os.path.join(folder, 'assets', 'line-qr.png'))
        modules, differ, code = R5.qr_modules(folder)
        ok = qr == 'pass' and modules == 29 and differ == 0 and code == 0
        line('CHECK_8_QR_%s: report qr=%s; %d of %d modules differ on the back page, rule: qr pass '
             'and 0 of 841 modules different, %s'
             % (item['label'], qr, differ, modules * modules, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_9: the build report page rows.
    parts = []
    ok = True
    for item in BOOKS:
        page_rows, fail_rows, _qr, errors = R5.report_rows(item['report'])
        ok = ok and page_rows == 2 and fail_rows == 0 and errors == 0
        parts.append('%s rows=%d fail=%d errors=%d' % (item['label'], page_rows, fail_rows, errors))
    line('CHECK_9_BUILD_REPORT_ROWS: %s, rule: each build report holds 2 page rows, 0 fail rows, '
         'and 0 errors, %s' % (', '.join(parts), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_10: the approved files and the clean path list.
    parts = []
    ok = True
    for path, prefix in R5.APPROVED:
        matches = R5.sha256(path).startswith(prefix)
        ok = ok and matches
        parts.append('%s prefix_matches=%s' % (os.path.basename(path), str(matches).lower()))
    done = subprocess.run(['git', 'status', '--porcelain', '--'] + R5.GIT_PATHS, cwd=R5.REPO,
                          capture_output=True, text=True)
    status_lines = [entry for entry in done.stdout.splitlines() if entry.strip()]
    ok = ok and not status_lines
    line('CHECK_10_APPROVED_FILES_AND_PATHS: %s, git_status_lines=%d, rule: the 3 approved files '
         'keep their SHA-256 prefix and the path list of git status prints nothing, %s'
         % (', '.join(parts), len(status_lines), 'PASS' if ok else 'FAIL'), ok)

    # CHECK_11: the contact sheet opens as PNG.
    with Image.open(SHEET) as image:
        image.verify()
    with Image.open(SHEET) as image:
        sheet_format, sheet_size = image.format, image.size
    ok = sheet_format == 'PNG'
    line('CHECK_11_CONTACT_SHEET: books-r6.png %s %dx%d, rule: the sheet opens as PNG (the 4 whole '
         'tiles are proved in green-f10-contact.txt), %s'
         % (sheet_format, sheet_size[0], sheet_size[1], 'PASS' if ok else 'FAIL'), ok)

    # CHECK_12: the r6 back PNGs equal the r5 back PNGs (M-F10-12).
    for item in BOOKS:
        new_sha = R5.sha256(item['back_png'])
        old_sha = R5.sha256(item['r5_back_png'])
        ok = new_sha == old_sha
        line('CHECK_12_BACK_EQUALS_R5_%s: r6=%s r5=%s, rule: the r6 back PNG equals the r5 back PNG, %s'
             % (item['label'], new_sha, old_sha, 'PASS' if ok else 'FAIL'), ok)

    # CHECK_13: the accepted folder manifest at the start and at the end.
    manifest_end = R5.sha256(ACCEPTED_MANIFEST)
    ok = manifest_start == ACCEPTED_SHA and manifest_end == ACCEPTED_SHA
    line('CHECK_13_ACCEPTED_MANIFEST: start=%s end=%s, rule: both equal %s, %s'
         % (manifest_start, manifest_end, ACCEPTED_SHA, 'PASS' if ok else 'FAIL'), ok)

    passes = sum(1 for verdict in verdicts if verdict)
    fails = len(verdicts) - passes
    body = HEADER + [('PASS ' if verdict else 'FAIL ') + text for text, verdict in zip(lines, verdicts)]
    # The prefix keeps `grep -c "^FAIL"` at 0 on a clean log, and the log still ends with FAIL_LINES.
    body += ['SUMMARY PASS_LINES=%d' % passes, 'SUMMARY FAIL_LINES=%d' % fails]
    with open(out_txt, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(body) + '\n')
    print('\n'.join(body))
    return 0 if fails == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
