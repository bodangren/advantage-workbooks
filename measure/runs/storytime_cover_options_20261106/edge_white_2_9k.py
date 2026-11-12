#!/usr/bin/env python3
"""The white edge check of the F7 band (Task 2.9 part 11, track storytime_cover_options_20261106).

F7 fixed a white band at the top edge of the A3 reader cover of week 1, "hello". This script finds
such a band in a PNG file or in page 1 of a PDF file. It samples every pixel.

The rule: a white row is a row in which every pixel has R, G, and B at 250 or more. A white column
is the same for a column. The script counts the white rows from the top edge inward until the first
row that is not white, then from the bottom edge, and the same for the white columns from the left
edge and the right edge. `white_edge_rows` is the top count plus the bottom count. `white_edge_cols`
is the left count plus the right count. No pixel is ignored unless `--ignore N` is given. With
`--ignore N` the outermost N pixels on each side are cut off first (the rasterizer seam of a PDF page
render), and the rule runs on the rest.

Usage:
  python3 -I -B edge_white_2_9k.py [--box X0,Y0,X1,Y1] [--ignore N] [--expect positive|zero] <png file> ...
  python3 -I -B edge_white_2_9k.py --pdf [--box X0,Y0,X1,Y1] [--ignore N] [--expect positive|zero] <scratch dir> <pdf> ...

`--box` cuts a pixel box out of the image first. Page 1 of an A3 reader file holds the cover as a
leaf-size box (198 x 148.5 mm, 780 x 585 px at 100 ppi) in the top-left corner and the rest of the
sheet is white by layout, so the check on that page runs on the box `0,0,780,585`.

The `--pdf` form renders page 1 of each PDF at 100 ppi with `pdftoppm` into the scratch directory
(create-only, named by a number and the PDF name) and checks the render.

`--expect zero` makes the script exit 1 when one file holds a white edge row or column. `--expect
positive` makes it exit 1 when one file holds no white edge row. With no `--expect` it exits 0.

The module also gives `edge_counts(path, ignore)` and `render_page1(pdf, scratch, tag)` for the check
log script. It prints counts, names, sizes, and SHA-256 values only. It shows no picture.
"""

import hashlib
import os
import subprocess
import sys

from PIL import Image, ImageChops

WHITE_MIN = 250
RENDER_PPI = 100


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def min_channel(image):
    """Returns an L image that holds the lowest of R, G, and B for each pixel."""
    red, green, blue = image.convert('RGB').split()
    return ImageChops.darker(ImageChops.darker(red, green), blue)


def white_run(lowest, count, line_box):
    """Counts the white lines from index 0 inward until the first line that is not white.

    `line_box(i)` returns the crop box of line i. A line is white when its lowest value is at least
    WHITE_MIN, so every pixel of the line has R, G, and B at WHITE_MIN or more.
    """
    run = 0
    while run < count:
        low = lowest.crop(line_box(run)).getextrema()[0]
        if low < WHITE_MIN:
            break
        run += 1
    return run


def edge_counts(path, ignore=0, box=None):
    """Returns (width, height, top, bottom, left, right) white edge counts of one image file.

    `box` is an optional (x0, y0, x1, y1) crop in pixels. It is cut first, then `ignore` pixels are
    cut off each side of the crop, and the rule runs on the rest.
    """
    with Image.open(path) as source:
        image = source.convert('RGB')
    if box:
        image = image.crop(box)
    if ignore:
        image = image.crop((ignore, ignore, image.width - ignore, image.height - ignore))
    lowest = min_channel(image)
    width, height = lowest.size
    top = white_run(lowest, height, lambda i: (0, i, width, i + 1))
    bottom = white_run(lowest, height, lambda i: (0, height - 1 - i, width, height - i))
    left = white_run(lowest, width, lambda i: (i, 0, i + 1, height))
    right = white_run(lowest, width, lambda i: (width - 1 - i, 0, width - i, height))
    return width, height, top, bottom, left, right


def render_page1(pdf, scratch, tag, ppi=RENDER_PPI):
    """Renders page 1 of a PDF at `ppi` (default 100) into the scratch folder; returns the PNG path."""
    os.makedirs(scratch, exist_ok=True)
    stem = os.path.join(scratch, '%s-%s' % (tag, os.path.basename(pdf)[:-4]))
    if os.path.exists(stem + '.png'):
        raise FileExistsError(stem + '.png')
    done = subprocess.run(['pdftoppm', '-f', '1', '-l', '1', '-r', str(ppi), '-png',
                           '-singlefile', pdf, stem], capture_output=True, text=True)
    if done.returncode != 0:
        raise RuntimeError('pdftoppm exit %d' % done.returncode)
    return stem + '.png'


def report(label, path, ignore, box=None):
    """Prints one EDGE line and returns (white edge rows, white edge columns)."""
    width, height, top, bottom, left, right = edge_counts(path, ignore, box)
    print('EDGE %s size=%dx%d box=%s ignore=%d top=%d bottom=%d left=%d right=%d '
          'white_edge_rows=%d white_edge_cols=%d sha256=%s'
          % (label, width, height, ','.join(str(v) for v in box) if box else 'none', ignore, top,
             bottom, left, right, top + bottom, left + right, sha256(path)))
    return top + bottom, left + right


def main(argv):
    """Runs the check on the files and prints one line for each."""
    ignore, expect, pdf_mode, box = 0, None, False, None
    rest = list(argv)
    while rest and rest[0].startswith('--'):
        option = rest.pop(0)
        if option == '--ignore':
            ignore = int(rest.pop(0))
        elif option == '--box':
            box = tuple(int(part) for part in rest.pop(0).split(','))
        elif option == '--expect':
            expect = rest.pop(0)
        elif option == '--pdf':
            pdf_mode = True
        else:
            print('UNKNOWN_OPTION ' + option)
            return 2
    scratch = None
    if pdf_mode:
        scratch = rest.pop(0)
    results = []
    for index, item in enumerate(rest):
        if pdf_mode:
            png = render_page1(item, scratch, 'p%d' % index)
            label = os.path.basename(item) + ' page1'
            results.append(report(label, png, ignore, box))
        else:
            results.append(report(item, item, ignore, box))
    rows_total = sum(row[0] for row in results)
    cols_total = sum(row[1] for row in results)
    print('FILES %d' % len(results))
    print('FILES_WITH_WHITE_EDGE_ROWS %d' % sum(1 for row in results if row[0] > 0))
    print('FILES_WITH_WHITE_EDGE_COLS %d' % sum(1 for row in results if row[1] > 0))
    print('WHITE_EDGE_ROWS_TOTAL %d' % rows_total)
    print('WHITE_EDGE_COLS_TOTAL %d' % cols_total)
    if expect == 'zero':
        ok = rows_total == 0 and cols_total == 0
    elif expect == 'positive':
        ok = all(row[0] > 0 for row in results)
    else:
        ok = True
    print('EDGE_EXPECT %s EDGE_OK %s' % (expect, str(ok).lower()))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
