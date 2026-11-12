#!/usr/bin/env python3
"""Renders page 12 of the 2 new reader back files and checks the band word (Task 2.9 part 10 step 5c).

Track storytime_cover_options_20261106. The 2 heavy builds of step 5 wrote 3 files into
`~/Desktop/print-ready/storytime/covers-quest-v1/reader-back-r5/`: the 2 color A3 reader files and
the K-only workbook PDF/X file.

The rule of this round (orchestrator definition of part 10, after F5 and F6): the A4 workbook leaf
holds 2 reader pages, page 12 (the word-list page) and page 1 (the quest reader cover). F5 makes the
quest reader cover page 1 of each reader in the reader build, so the fold labels of the page 1 sides
lie below the fold and page 1 prints no band word. F6 removes the "Storytime Advantage" text line
from page 12; the logo picture stays. So this script reads the 2 halves of the leaf page separately
with `pdftotext -x 0 -y Y -W 596 -H 421`, and it applies the page-12 rule to the half that holds
"Words in this book".

The rule (a) to (d) of part 10:
(a) A3 page 12: "Words in this book" 1 time, the band word "Sprout" (any case) 0 times, and
    "Storytime Advantage" 0 times.
(b) The workbook leaf page that holds page 12 and page 1: the page 12 half holds the phrase 1 time,
    the band word 0, and "Storytime Advantage" 0; the page 1 half holds the band word 0.
(c) Every page of the 3 reader back files: the band word 0.
(d) The ink coverage of the workbook file: C, M, and Y 0.00000 on every page.

Steps:
1. It lists the files of the folder with their byte size and SHA-256.
2. It asserts 12 pages of 420 x 297 mm (within 0.5 mm) on each of the 2 A3 files.
3. It renders page 12 of the "hello" A3 file at 300 ppi to `l2-w01-hello-a3-page12.png`.
4. It finds the workbook page that holds page 12 of "Nan Can Nod": a page whose Thai-filtered text
   holds "Words in this book"; the page that also holds "Nan Can Nod", else the second such page in
   page order. It prints the rule that chose the page and renders it at 300 ppi to
   `l2-w01-nan-can-nod-leaf-page12.png`.
5. Rule (a) and rule (b), with the exact counts of part 10.
6. Rule (c): the band word on each page of the 2 A3 files and of the workbook file.
7. Rule (d): `gs -q -o - -sDEVICE=inkcov` on the workbook PDF/X file: C, M, and Y at 0.00000 on each
   page.
8. One information line: the same counts on the same page of the old build
   `~/Desktop/print-ready/storytime/readers-w01-final/`.
9. The pixel size and the SHA-256 of the 2 PNGs. The pixel size is computed from the page size at
   300 ppi, rounded to whole pixels.

Usage: python3 -I -B page12_2_9j.py

It prints counts, names, sizes, and SHA-256 values only. It drops every Thai line of a PDF text
before a count, and it never opens or shows a page image.
"""

import hashlib
import os
import re
import subprocess

ROOT = os.path.join(os.path.expanduser('~'),
                    'Desktop/print-ready/storytime/covers-quest-v1/reader-back-r5')
OLD_ROOT = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/readers-w01-final')
HELLO_A3 = 'Storytime-Advantage-L2-W01-hello-A3-v1.pdf'
NOD_A3 = 'Storytime-Advantage-L2-W01-nan-can-nod-A3-v1.pdf'
WORKBOOK = 'Storytime-Advantage-L2-Readers-W01-v1_PDFX-1a.pdf'
HELLO_PNG = 'l2-w01-hello-a3-page12.png'
NOD_PNG = 'l2-w01-nan-can-nod-leaf-page12.png'

PAGE = 12
PAGES_EXPECTED = 12
A3_MM = (420.0, 297.0)
A3_TOLERANCE_MM = 0.5
RENDER_PPI = 300
CROP_W, CROP_H = 596, 421
HALVES = [('TOP', 0), ('BOTTOM', 421)]

THAI_LO, THAI_HI = 0x0E00, 0x0E7F
WORDS_LINE = 'words in this book'
SERIES_LINE = 'storytime advantage'
BAND_WORD = 'sprout'
NOD_TITLE = 'Nan Can Nod'


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


def english_only(text):
    """Returns the text with every Thai line dropped."""
    return '\n'.join(line for line in text.splitlines() if not has_thai(line))


def page_text(path, page, crop=None):
    """Returns the Thai-filtered text of one page, or of one crop of it."""
    args = ['pdftotext', '-f', str(page), '-l', str(page)]
    if crop is not None:
        top = crop
        args += ['-x', '0', '-y', str(top), '-W', str(CROP_W), '-H', str(CROP_H)]
    done = subprocess.run(args + [path, '-'], capture_output=True, text=True)
    return english_only(done.stdout)


def count(text, needle):
    """Returns the count of a needle in any case."""
    return len(re.findall(re.escape(needle), text, re.I))


def counts(text):
    """Returns the 3 counts of one page text: the phrase, the series line, the band word."""
    return (count(text, WORDS_LINE), count(text, SERIES_LINE), count(text, BAND_WORD))


def pdfinfo(path):
    """Returns the pdfinfo -box output."""
    done = subprocess.run(['pdfinfo', '-box', path], capture_output=True, text=True)
    return done.stdout


def page_rows(path):
    """Returns (page count, page size in points, page size in mm) from pdfinfo -box."""
    out = pdfinfo(path)
    found = re.search(r'^Pages:\s+(\d+)', out, re.M)
    pages = int(found.group(1)) if found else 0
    size = re.search(r'^Page size:\s+([\d.]+) x ([\d.]+)', out, re.M)
    points = (float(size.group(1)), float(size.group(2))) if size else (0.0, 0.0)
    millimetres = (points[0] * 25.4 / 72, points[1] * 25.4 / 72)
    return pages, points, millimetres


def expected_px(points):
    """Returns the pixel size of a page at 300 ppi, rounded to whole pixels."""
    return (int(round(points[0] * RENDER_PPI / 72)), int(round(points[1] * RENDER_PPI / 72)))


def png_size(path):
    """Returns the pixel size of a PNG from its IHDR block."""
    with open(path, 'rb') as handle:
        head = handle.read(33)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        return (0, 0)
    return (int.from_bytes(head[16:20], 'big'), int.from_bytes(head[20:24], 'big'))


def render(path, page, target):
    """Renders one page at 300 ppi into a PNG of one page."""
    done = subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-r', str(RENDER_PPI),
                           '-png', '-singlefile', path, target[:-4]],
                          capture_output=True, text=True)
    return done.returncode


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


def main():
    """Runs the 8 steps and prints the counts."""
    print('ROOT ' + ROOT)
    if not os.path.isdir(ROOT):
        print('ROOT_MISSING')
        return 1
    for name in (HELLO_A3, NOD_A3, WORKBOOK):
        if not os.path.exists(os.path.join(ROOT, name)):
            print('FILE_MISSING ' + name)
            return 1

    # Step 1: the folder before the 2 renders.
    for name in sorted(os.listdir(ROOT)):
        path = os.path.join(ROOT, name)
        print('NEW_FILE %s bytes=%d sha256=%s' % (name, os.path.getsize(path), sha256(path)))

    # Step 2: the page count and the page size of the 2 A3 files.
    sizes_ok = True
    a3_px = (0, 0)
    for name in (HELLO_A3, NOD_A3):
        pages, points, millimetres = page_rows(os.path.join(ROOT, name))
        expected = expected_px(points)
        a3_px = expected
        page_ok = (pages == PAGES_EXPECTED
                   and abs(millimetres[0] - A3_MM[0]) <= A3_TOLERANCE_MM
                   and abs(millimetres[1] - A3_MM[1]) <= A3_TOLERANCE_MM)
        sizes_ok = sizes_ok and page_ok
        print('A3 %s pages=%d size_mm=%.2fx%.2f px_expected=%dx%d ok=%s'
              % (name, pages, millimetres[0], millimetres[1], expected[0], expected[1],
                 str(page_ok).lower()))

    # Step 3: page 12 of the hello A3 file.
    hello_png = os.path.join(ROOT, HELLO_PNG)
    if os.path.exists(hello_png):
        print('TARGET_EXISTS ' + HELLO_PNG)
        return 1
    hello_code = render(os.path.join(ROOT, HELLO_A3), PAGE, hello_png)
    hello_size = png_size(hello_png) if os.path.exists(hello_png) else (0, 0)
    print('HELLO_PAGE %d render_exit=%d px=%dx%d' % (PAGE, hello_code, hello_size[0],
                                                     hello_size[1]))

    # Step 4: the workbook page of page 12 of "Nan Can Nod".
    workbook = os.path.join(ROOT, WORKBOOK)
    pages, work_points, work_mm = page_rows(workbook)
    work_px = expected_px(work_points)
    candidates, both, rows = [], [], {}
    for page in range(1, pages + 1):
        text = page_text(workbook, page)
        found_thai = has_thai(text)
        words = count(text, WORDS_LINE)
        nod = count(text, NOD_TITLE)
        rows[page] = text
        if words >= 1:
            candidates.append(page)
            if nod >= 1:
                both.append(page)
        print('WORKBOOK_PAGE p=%d words_in_this_book=%d nan_can_nod=%d'
              % (page, words, nod))
    print('WORKBOOK_PAGES %d size_mm=%.2fx%.2f px_expected=%dx%d'
          % (pages, work_mm[0], work_mm[1], work_px[0], work_px[1]))
    print('WORD_LIST_PAGES %d' % len(candidates))
    print('NOD_WORD_LIST_PAGES %d' % len(both))
    if both:
        chosen, rule = both[0], 'with-nan-can-nod'
    elif len(candidates) >= 2:
        chosen, rule = candidates[1], 'second-wordlist-page'
    else:
        print('CHOICE_FAILED')
        return 1
    print('CHOICE_RULE ' + rule)
    print('CHOSEN_PAGE %d' % chosen)

    nod_png = os.path.join(ROOT, NOD_PNG)
    if os.path.exists(nod_png):
        print('TARGET_EXISTS ' + NOD_PNG)
        return 1
    nod_code = render(workbook, chosen, nod_png)
    nod_size = png_size(nod_png) if os.path.exists(nod_png) else (0, 0)
    print('NOD_PAGE %d render_exit=%d px=%dx%d' % (chosen, nod_code, nod_size[0], nod_size[1]))

    # Step 5: rule (a) and rule (b) of part 10.
    hello_counts = counts(page_text(os.path.join(ROOT, HELLO_A3), PAGE))
    a3_ok = hello_counts[0] == 1 and hello_counts[1] == 0 and hello_counts[2] == 0
    print('A3_PAGE12 words_in_this_book=%d storytime_advantage=%d sprout=%d ok=%s'
          % (hello_counts[0], hello_counts[1], hello_counts[2], str(a3_ok).lower()))

    halves, word_halves = {}, []
    for label, top in HALVES:
        value = counts(page_text(workbook, chosen, crop=top))
        halves[label] = value
        if value[0] >= 1:
            word_halves.append(label)
        print('WORKBOOK_HALF %s y=%d words_in_this_book=%d storytime_advantage=%d sprout=%d'
              % (label, top, value[0], value[1], value[2]))
    print('WORD_HALVES %d' % len(word_halves))
    if len(word_halves) != 1:
        print('HALF_SPLIT_FAILED')
        return 1
    page12_label = word_halves[0]
    page1_label = 'BOTTOM' if page12_label == 'TOP' else 'TOP'
    page12 = halves[page12_label]
    page1 = halves[page1_label]
    page12_ok = page12[0] == 1 and page12[1] == 0 and page12[2] == 0
    page1_ok = page1[2] == 0
    print('WORKBOOK_PAGE12_HALF %s words_in_this_book=%d storytime_advantage=%d sprout=%d ok=%s'
          % (page12_label, page12[0], page12[1], page12[2], str(page12_ok).lower()))
    print('WORKBOOK_PAGE1_HALF %s words_in_this_book=%d storytime_advantage=%d sprout=%d info_ok=%s'
          % (page1_label, page1[0], page1[1], page1[2], str(page1_ok).lower()))

    # Step 6: rule (c) of part 10, the band word on every page of the 3 reader back files.
    band_ok = True
    for name in (HELLO_A3, NOD_A3, WORKBOOK):
        path = os.path.join(ROOT, name)
        file_pages, _points, _mm = page_rows(path)
        file_ok = file_pages == PAGES_EXPECTED
        for page in range(1, file_pages + 1):
            value = count(page_text(path, page), BAND_WORD)
            file_ok = file_ok and value == 0
            print('BAND %s p=%d sprout=%d' % (name, page, value))
        print('BAND_FILE %s pages=%d ok=%s' % (name, file_pages, str(file_ok).lower()))
        band_ok = band_ok and file_ok

    # Step 7: the same counts on the comparable page of the old build, information only.
    old_workbook = os.path.join(OLD_ROOT, WORKBOOK)
    if os.path.exists(old_workbook):
        old_pages, _old_points, _old_mm = page_rows(old_workbook)
        old_choice, old_both = 0, 0
        for page in range(1, old_pages + 1):
            text = page_text(old_workbook, page)
            words = count(text, WORDS_LINE)
            nod = count(text, NOD_TITLE)
            if words >= 1:
                old_choice = old_choice or page
                if nod >= 1 and not old_both:
                    old_both = page
        old_page = old_both or old_choice
        if old_page:
            old_whole = counts(page_text(old_workbook, old_page))
            print('OLD_BUILD pages=%d search_page=%d page=%d whole words_in_this_book=%d '
                  'storytime_advantage=%d sprout=%d info'
                  % (old_pages, chosen, old_page, old_whole[0], old_whole[1], old_whole[2]))
        else:
            print('OLD_BUILD pages=%d page=none words_in_this_book=0 info' % old_pages)
    else:
        print('OLD_BUILD_MISSING ' + old_workbook)

    # Step 8: the ink coverage of the workbook file.
    coverage, ink_code = ink_coverage(workbook)
    ink_ok = ink_code == 0 and len(coverage) == pages
    for index, row in enumerate(coverage):
        page_ok = row[0] == 0.0 and row[1] == 0.0 and row[2] == 0.0
        ink_ok = ink_ok and page_ok
        print('INK p=%d C=%.5f M=%.5f Y=%.5f K=%.5f ok=%s'
              % (index + 1, row[0], row[1], row[2], row[3], str(page_ok).lower()))
    print('INK_COVERAGE_OK %s' % str(ink_ok).lower())

    # Step 9: the 2 PNGs.
    px_ok = hello_size == a3_px and nod_size == work_px
    for name in (HELLO_PNG, NOD_PNG):
        path = os.path.join(ROOT, name)
        size = png_size(path) if os.path.exists(path) else (0, 0)
        expected = a3_px if name == HELLO_PNG else work_px
        print('PNG %s px=%dx%d px_expected=%dx%d px_ok=%s bytes=%d sha256=%s'
              % (name, size[0], size[1], expected[0], expected[1],
                 str(size == expected).lower(),
                 os.path.getsize(path) if os.path.exists(path) else 0,
                 sha256(path) if os.path.exists(path) else 'missing'))
    print('PNG_SIZE_OK ' + str(px_ok).lower())

    ok = (sizes_ok and a3_ok and page12_ok and page1_ok and band_ok and ink_ok and px_ok
          and hello_code == 0 and nod_code == 0)
    print('A3_RULE_OK %s' % str(a3_ok).lower())
    print('LEAF_RULE_OK %s' % str(page12_ok and page1_ok).lower())
    print('BAND_RULE_OK %s' % str(band_ok).lower())
    print('INK_RULE_OK %s' % str(ink_ok).lower())
    print('PAGE12_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
