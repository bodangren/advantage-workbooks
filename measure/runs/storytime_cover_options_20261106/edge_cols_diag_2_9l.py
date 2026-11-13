#!/usr/bin/env python3
"""Reads the right-edge columns of the A3 cover PNGs (Task 2.9 part 12, diagnosis only).

Track storytime_cover_options_20261106. The edge check of part 12 found 3 white columns at the right
edge of each of the 14 A3 reader cover PNGs. This script reads the last 6 columns of each file and
prints, for each column, the lowest and the highest R, G, and B value over all rows. It also prints
the same values for the old hand-off file of w01-1. It writes nothing and shows no picture.

Usage: python3 -I -B edge_cols_diag_2_9l.py <png file> ...
"""

import sys

from PIL import Image


def main(argv):
    """Prints the per-column extrema of the last 6 columns of each file."""
    for path in argv:
        with Image.open(path) as source:
            image = source.convert('RGB')
        parts = []
        for offset in range(6, 0, -1):
            x = image.width - offset
            extrema = image.crop((x, 0, x + 1, image.height)).getextrema()
            parts.append('x=%d low=(%d,%d,%d) high=(%d,%d,%d)'
                         % (x, extrema[0][0], extrema[1][0], extrema[2][0],
                            extrema[0][1], extrema[1][1], extrema[2][1]))
        print('COLS %s size=%dx%d | %s' % (path.split('/')[-1], image.width, image.height,
                                            ' | '.join(parts)))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
