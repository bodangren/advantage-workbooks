#!/usr/bin/env python3
"""Cause lines of the 28 page compares of Phase 9, Task "Hand-off from storytime_cover_options".

Track storytime_print_r1_20261025. This script reads the rasters that `p9_compare.py` wrote into its
scratch folder and prints one line for each of the 28 pages: the cause class of each difference and
its region. It changes no threshold of `p9_compare.py`. It adds the evidence that the first
thresholds missed:

- A3 page 1: the differing pixels against the raster of the accepted source PDF are counted, and the
  bounding box is named. Pixels that lie in one text line of 150 rows or less are glyph edge noise.
- Leaf: the cover strip of the student book is K-only gray, so it is compared with the K-only
  accepted PDF/X leaf `Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf` (the same
  Ghostscript gray conversion as the book), after a Gaussian blur of 5 px and a 4 x BOX reduction,
  so that a registration shift of one pixel does not count. The leaf mark rows (the bottom 70 rows)
  and the cut line rows (the top 12 rows) are masked: the mark is the workbook leaf mark of
  `readers.ts` and the accepted leaf covers hold no mark.
- A page with blocks that differ by more than 30 grey levels in more than 0.5 % of the area is a
  content difference. Its bounding box is named.

Usage: python3 -I -B p9_cause.py <scratch folder of p9_compare.py>
"""

import os
import subprocess
import sys

from PIL import Image, ImageChops, ImageFilter, ImageStat

ACCEPTED = os.path.expanduser('~/Desktop/print-ready/storytime/covers-quest-v1')
READERS = [(1, 'hello', 9), (1, 'nan-can-nod', 15), (2, 'how-many', 27), (2, 'can-i', 33), (3, 'paint', 45),
           (3, 'the-pan', 51), (4, 'my-family', 63), (4, 'pam', 69), (5, 'i-have-two', 81), (5, 'sam-and-pam', 87),
           (6, 'i-can-see', 99), (6, 'tap-tap', 105), (7, 'is-it-a-ball', 117), (7, 'the-top', 123)]
LEAF_PDFX_ORDER = None
MASK_BOTTOM = 70
MASK_TOP = 12
CONTENT_BLOCK = 30
CONTENT_SHARE = 0.005


def find(scratch, prefix, slug):
    """Finds the raster of a reader in the scratch folder."""
    for name in sorted(os.listdir(scratch)):
        if name.startswith(prefix + slug + '-') and name.endswith('.png'):
            return os.path.join(scratch, name)
    raise RuntimeError('missing raster ' + prefix + slug)


def a3_line(scratch, week, slug):
    """Returns the cause line of one A3 page."""
    new = Image.open(find(scratch, 'a3-', slug)).convert('RGB')
    src = Image.open(find(scratch, 'a3src-', slug)).convert('RGB')
    diff = ImageChops.difference(new, src)
    gray = diff.convert('L')
    hist = gray.histogram()
    over2, over8 = sum(hist[3:]), sum(hist[9:])
    mx = max(band[1] for band in diff.getextrema())
    box = gray.point(lambda v: 255 if v > 2 else 0).getbbox()
    if box is None:
        return 'A3 w%02d %-13s none: raster equals the accepted source page (max diff %d)' % (week, slug, mx)
    rows = box[3] - box[1]
    cls = 'text glyph edge noise' if rows <= 150 else 'WIDE DIFFERENCE'
    return 'A3 w%02d %-13s %s: %d px above 2 and %d px above 8 of 17.4 M, max %d, one band rows %d-%d, cols %d-%d' % (
        week, slug, cls, over2, over8, mx, box[1], box[3], box[0], box[2])


def leaf_line(scratch, week, slug, student_page, pdfx_page, pdfx):
    """Returns the cause line of one leaf."""
    sb = [n for n in os.listdir(scratch) if n.startswith('sb-') and n.endswith('-%03d.png' % student_page)][0]
    page = Image.open(os.path.join(scratch, sb)).convert('L')
    strip = page.crop((0, 6, 2338, 6 + 1754)) if False else page.crop((0, 0, page.size[0], 1760)).rotate(180).crop((0, 6, 2338, 6 + 1754))
    subprocess.run(['pdftoppm', '-r', '300', '-f', str(pdfx_page), '-l', str(pdfx_page), '-gray', '-png', pdfx, os.path.join(scratch, 'leafx-' + slug)], check=True)
    ref = Image.open(find(scratch, 'leafx-', slug)).convert('L').crop((0, 0, 2338, 1754))
    prep = lambda im: im.filter(ImageFilter.GaussianBlur(5)).resize((2338 // 4, 1754 // 4), Image.BOX)
    diff = ImageChops.difference(prep(strip), prep(ref))
    diff.paste(0, (0, (1754 - MASK_BOTTOM) // 4, 2338 // 4, 1754 // 4 + 1))
    diff.paste(0, (0, 0, 2338 // 4, MASK_TOP // 4 + 1))
    hist = diff.histogram()
    total = sum(hist)
    share = sum(hist[CONTENT_BLOCK + 1:]) / total
    mean = ImageStat.Stat(diff).mean[0]
    box = diff.point(lambda v: 255 if v > CONTENT_BLOCK else 0).getbbox()
    where = '' if box is None else ', blocks above %d at cols %d-%d rows %d-%d' % (CONTENT_BLOCK, box[0] * 4, box[2] * 4, box[1] * 4, box[3] * 4)
    if share > CONTENT_SHARE:
        return 'Leaf w%02d %-13s CONTENT DIFFERENCE: blur mean %.2f, %.3f %% of the area above %d%s' % (week, slug, mean, share * 100, CONTENT_BLOCK, where)
    return 'Leaf w%02d %-13s registration and resample noise only: blur mean %.2f, %.3f %% of the area above %d%s' % (week, slug, mean, share * 100, CONTENT_BLOCK, where)


def main(argv):
    """Prints the 28 cause lines."""
    scratch = argv[0]
    import json
    pdfx = os.path.join(ACCEPTED, 'readers-leaf/Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf')
    with open(os.path.join(ACCEPTED, 'readers-leaf/build-report.json'), encoding='utf-8') as handle:
        order = [entry['file'] for entry in json.load(handle)['pages']]
    bad = 0
    for week, slug, _ in READERS:
        print(a3_line(scratch, week, slug))
    for week, slug, student_page in READERS:
        pdfx_page = order.index('readers-leaf/l2-w%02d-%s-leaf-cover.png' % (week, slug)) + 1
        line = leaf_line(scratch, week, slug, student_page, pdfx_page, pdfx)
        bad += 1 if 'CONTENT DIFFERENCE' in line else 0
        print(line)
    print('SUMMARY leaf content differences: %d of 14' % bad)
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
