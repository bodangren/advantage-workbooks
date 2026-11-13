#!/usr/bin/env python3
"""Page 1 raster compare of the 14 reader covers (Task "Hand-off from storytime_cover_options", Phase 9).

Track storytime_print_r1_20261025. The script compares page 1 of each of the 14 color A3 reader
files, and the cover strip of each of the 14 reader leaves in the student book, with the accepted
option A reader covers in `covers-quest-v1/`. It prints one line for each reader and a summary.

Method (the same for the A3 files and the leaves):
- Each page renders with `pdftoppm` at 300 ppi into a scratch folder.
- A3 file: the page 1 raster is compared with (1) the accepted page PNG after a resize to the size
  of the PNG (the accepted PNG is 4961 px wide; the PDF page is 4963 px wide), and (2) the raster of
  the matching page of the accepted source PDF `reader-covers-a3.pdf`, with no resize.
- Leaf: the cover strip is cut from the A4 student book page (the strip is turned 180 degrees and
  lies 12 mm from the left edge and at the top), turned back, aligned to the best of 81 offsets
  (plus or minus 4 px), and compared with the raster of the matching page of the accepted source PDF
  `reader-leaf-covers.pdf` in gray. The student book prints the leaf mark of the workbook
  (`<title> . sheet 1 of 3`) and the cut line; these two zones are masked and named.
- A negative control compares each leaf strip with the cover of the next reader. The control
  must differ by a large margin.

Usage: python3 -I -B p9_compare.py <check folder> <scratch folder>
"""

import json
import os
import re
import subprocess
import sys

from PIL import Image, ImageChops, ImageStat

HOME = os.path.expanduser('~')
ACCEPTED = os.path.join(HOME, 'Desktop/print-ready/storytime/covers-quest-v1')
LEAF_MARK_BOX = (1650, 1680, 2338, 1754)
CUT_LINE_BOX = (0, 0, 2338, 10)
A3_PNG_MEAN_MAX = 2.0
A3_PNG_SHARE64_MAX = 0.005
A3_SRC_MAX_DIFF = 2
LEAF_MEAN_MAX = 2.5
LEAF_SHARE48_MAX = 0.002
CONTROL_RATIO_MIN = 3.0
SLUG = re.compile(r'W(\d\d)-(.+)-A3-v\d+\.pdf$')
# The reader order of the build: the two readers of each week, as the student book prints them.
READERS = [(1, 'hello'), (1, 'nan-can-nod'), (2, 'how-many'), (2, 'can-i'), (3, 'paint'), (3, 'the-pan'),
           (4, 'my-family'), (4, 'pam'), (5, 'i-have-two'), (5, 'sam-and-pam'), (6, 'i-can-see'), (6, 'tap-tap'),
           (7, 'is-it-a-ball'), (7, 'the-top')]


def run(args):
    """Runs one command and returns its stdout text."""
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def render(pdf, page, out_base, ppi=300):
    """Renders one page to a PNG and returns the image path."""
    run(['pdftoppm', '-r', str(ppi), '-f', str(page), '-l', str(page), '-png', pdf, out_base])
    folder, base = os.path.split(out_base)
    for name in sorted(os.listdir(folder)):
        if name.startswith(base + '-') and name.endswith('.png'):
            return os.path.join(folder, name)
    raise RuntimeError('no raster for ' + out_base)


def page_order(report_path):
    """Returns the file names of a build report in page order."""
    with open(report_path, encoding='utf-8') as handle:
        return [entry['file'] for entry in json.load(handle)['pages']]


def gray_stats(a, b, mask_boxes=()):
    """Returns the mean, the max, and the share of pixels above 64 and above 48 of a gray diff."""
    diff = ImageChops.difference(a, b)
    for box in mask_boxes:
        diff.paste(0, box)
    hist = diff.histogram()
    total = sum(hist)
    return (ImageStat.Stat(diff).mean[0], diff.getextrema()[1], sum(hist[65:]) / total, sum(hist[49:]) / total)


def title_in(text, slug):
    """Tells whether the normalized page text holds the reader title of the slug."""
    norm = '-' + re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-') + '-'
    return '-' + slug + '-' in norm


def a3_checks(check, scratch, order):
    """Compares page 1 of each A3 file. Returns the number of readers that fail."""
    names = sorted(os.listdir(os.path.join(check, 'readers-a3')))
    src_pdf = os.path.join(ACCEPTED, 'readers-a3/reader-covers-a3.pdf')
    fails = 0
    print('A3 compare: %d files' % len(names))
    for name in names:
        week, slug = SLUG.search(name).groups()
        png_name = 'readers-a3/l2-w%s-%s-a3-cover.png' % (week, slug)
        pdf = os.path.join(check, 'readers-a3', name)
        new = Image.open(render(pdf, 1, os.path.join(scratch, 'a3-' + slug))).convert('RGB')
        accepted = Image.open(os.path.join(ACCEPTED, png_name)).convert('RGB')
        resized = new.resize(accepted.size, Image.LANCZOS)
        png_mean, png_max, png_s64, _ = gray_stats(resized.convert('L'), accepted.convert('L'))
        page = order.index(png_name) + 1
        source = Image.open(render(src_pdf, page, os.path.join(scratch, 'a3src-' + slug))).convert('RGB')
        src_max = max(band[1] for band in ImageChops.difference(new, source).getextrema()) if new.size == source.size else 999
        text = run(['pdftotext', '-f', '1', '-l', '1', pdf, '-'])
        title = title_in(text, slug)
        ok = png_mean <= A3_PNG_MEAN_MAX and png_s64 <= A3_PNG_SHARE64_MAX and src_max <= A3_SRC_MAX_DIFF and title
        fails += 0 if ok else 1
        print('A3 w%s %-14s png_mean=%.3f png_share64=%.5f src_page=%2d src_maxdiff=%s title_text=%s %s' % (
            week, slug, png_mean, png_s64, page, src_max, 'yes' if title else 'NO', 'PASS' if ok else 'FAIL'))
    return fails


def strip_of(page_png):
    """Cuts the cover strip from an A4 student page and turns it back to the upright position."""
    page = Image.open(page_png).convert('L')
    return page.crop((0, 0, page.size[0], 1760)).rotate(180)


def leaf_checks(check, scratch, order, student_pdf):
    """Compares the cover strip of each leaf. Returns the number of readers that fail."""
    src_pdf = os.path.join(ACCEPTED, 'readers-leaf/reader-leaf-covers.pdf')
    slugs = [(week, slug, None) for week, slug in READERS]
    sources = {}
    for week, slug, _ in slugs:
        png_name = 'readers-leaf/l2-w%02d-%s-leaf-cover.png' % (week, slug)
        sources[slug] = Image.open(render(src_pdf, order.index(png_name) + 1, os.path.join(scratch, 'leafsrc-' + slug))).convert('L')
    fails = 0
    print('Leaf compare: %d readers' % len(slugs))
    for index, (week, slug, _) in enumerate(slugs):
        # The reader pairs of a week start at student page 9 + 18 (week - 1), the second reader 6 pages later.
        student_page = 9 + 18 * (week - 1) + (6 if index % 2 else 0)
        strip = strip_of(render(student_pdf, student_page, os.path.join(scratch, 'sb-%02d' % student_page)))
        src = sources[slug]
        w, h = src.size
        best = None
        for dx in range(0, 5):
            for dy in range(2, 11):
                cut = strip.crop((dx, dy, dx + w, dy + h))
                mean = ImageStat.Stat(ImageChops.difference(cut, src)).mean[0]
                if best is None or mean < best[0]:
                    best = (mean, dx, dy)
        _, dx, dy = best
        cut = strip.crop((dx, dy, dx + w, dy + h))
        small = lambda image: image.resize((w // 4, h // 4), Image.BOX)
        masks = [tuple(v // 4 for v in LEAF_MARK_BOX), tuple(v // 4 for v in CUT_LINE_BOX)]
        mean, mx, _, share48 = gray_stats(small(cut), small(src), masks)
        other = sources[slugs[(index + 1) % len(slugs)][1]]
        control = gray_stats(small(cut), small(other), masks)[0]
        text = run(['pdftotext', '-f', str(student_page), '-l', str(student_page), '-x', '34', '-y', '0', '-W', '561', '-H', '421', student_pdf, '-'])
        mark = re.search(r'sheet\s*1\s*of\s*3', text) is not None and title_in(text, slug)
        ok = mean <= LEAF_MEAN_MAX and share48 <= LEAF_SHARE48_MAX and control >= CONTROL_RATIO_MIN * max(mean, 0.5)
        fails += 0 if ok else 1
        print('Leaf w%02d %-14s student_page=%3d offset=(%d,%d) mean=%.3f max=%d share48=%.5f control_mean=%.3f mark_and_title_text=%s %s' % (
            week, slug, student_page, dx, dy, mean, mx, share48, control, 'yes' if mark else 'NO', 'PASS' if ok else 'FAIL'))
    return fails


def main(argv):
    """Runs both compares and prints the summary."""
    check, scratch = argv[0], argv[1]
    os.makedirs(scratch, exist_ok=True)
    a3_fails = a3_checks(check, scratch, page_order(os.path.join(ACCEPTED, 'readers-a3/build-report.json')))
    student = os.path.join(check, 'student-book/Storytime-Advantage-L2-U1-Student-Book-v16_PDFX-1a.pdf')
    leaf_fails = leaf_checks(check, scratch, page_order(os.path.join(ACCEPTED, 'readers-leaf/build-report.json')), student)
    print('SUMMARY a3_fail=%d leaf_fail=%d of 28 compares' % (a3_fails, leaf_fails))
    return 0 if a3_fails + leaf_fails == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
