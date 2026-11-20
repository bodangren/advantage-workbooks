"""Summarize text sizes from a spans TSV (see spans.py). Prints no page text.

Usage: python3 -I -B sizes.py <spans.tsv> <label>
"""

import sys
from collections import defaultdict


def main(argv):
    """Prints the minimum size, the count of spans under 8 pt, and the size table by font."""
    path, label = argv[0], argv[1]
    by_font = defaultdict(lambda: defaultdict(int))
    under8 = 0
    total = 0
    smallest = None
    smallest_rows = []
    thai_sizes = defaultdict(int)
    for index, line in enumerate(open(path, encoding='utf-8')):
        if index == 0:
            continue
        page, font, size, x0, y0, x1, y1, nchars, thai = line.rstrip('\n').split('\t')
        size = float(size)
        nchars = int(nchars)
        thai = int(thai)
        if nchars == 0:
            continue
        total += nchars
        short = font.split('+')[-1].replace('-Identity-H', '')
        by_font[short][round(size, 2)] += nchars
        if thai:
            thai_sizes[round(size, 2)] += thai
        if size < 7.95:
            under8 += nchars
        if smallest is None or size < smallest:
            smallest = size
    print('%s total_chars %d smallest_pt %.3f chars_under_7.95pt %d' % (label, total, smallest, under8))
    for font in sorted(by_font):
        table = by_font[font]
        row = ', '.join('%.2f pt: %d' % (size, table[size]) for size in sorted(table))
        print('%s %s -> %s' % (label, font, row))
    print('%s thai chars by size -> %s' % (
        label, ', '.join('%.2f pt: %d' % (size, thai_sizes[size]) for size in sorted(thai_sizes))))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
