#!/usr/bin/env python3
"""Measures the ink of the leaf series line (Task 2.9 part 5, the C4 leaf diagnosis).

Track storytime_cover_options_20261106. The C4 check counts the pair "Storytime Advantage" on each
leaf page, and 13 of the 14 pages give 0. This script measures the ink of the series box of a leaf
page: it renders the page with `pdftoppm` at 150 dpi and counts the dark pixels of the first line
band and of the second line band.

The series box is at 68 mm left and 137 mm top, 30 mm wide and 6 mm high, at a line height of
6 mm. Band 1 is y 137 to 143 mm. Band 2 is y 143 to 148.5 mm.

Usage: python3 -I -B leaf_series_ink_2_9e.py <pdf file>

It prints counts only and it never opens or shows an image.
"""

import os
import subprocess
import sys

from PIL import Image

DPI = 150
PX_PER_MM = DPI / 25.4
LEFT_MM, RIGHT_MM = 66.0, 100.0
BAND1 = (137.0, 143.0)
BAND2 = (143.0, 148.5)
DARK = 160


def band_ink(image, top_mm, bottom_mm):
    """Returns the count of dark pixels in one band of the series column."""
    left = round(LEFT_MM * PX_PER_MM)
    right = round(RIGHT_MM * PX_PER_MM)
    top = round(top_mm * PX_PER_MM)
    bottom = min(round(bottom_mm * PX_PER_MM), image.height)
    crop = image.crop((left, top, right, bottom)).convert('L')
    return sum(1 for value in crop.tobytes() if value < DARK)


def main(argv):
    """Renders the pages and prints the ink counts."""
    path = argv[0]
    pages = [int(item) for item in argv[1:]] or [1, 14]
    folder = '/tmp/opencode/c29e/inkprobe'
    os.makedirs(folder, exist_ok=True)
    for page in pages:
        stem = os.path.join(folder, 'page-%d' % page)
        subprocess.run(['pdftoppm', '-r', str(DPI), '-f', str(page), '-l', str(page),
                        '-png', path, stem], check=True)
        name = [item for item in sorted(os.listdir(folder)) if item.startswith('page-%d-' % page)][0]
        image = Image.open(os.path.join(folder, name))
        print('PAGE %d size_px=%dx%d ink_band1=%d ink_band2=%d'
              % (page, image.width, image.height, band_ink(image, *BAND1), band_ink(image, *BAND2)))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
