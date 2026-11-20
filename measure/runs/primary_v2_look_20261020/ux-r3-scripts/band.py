"""List the font size, font, and extent of the spans inside one y band of one page (no page text).

Usage: python3 -I -B band.py <spans.tsv> <page> <y-min-pt> <y-max-pt> <label>
"""

import sys
from collections import defaultdict


def main(argv):
    """Prints one summary row for each (baseline, font, size) group in the band."""
    path, page, lo, hi, label = argv[0], int(argv[1]), float(argv[2]), float(argv[3]), argv[4]
    groups = defaultdict(lambda: [10 ** 9, -10 ** 9, 0])
    for index, line in enumerate(open(path, encoding='utf-8')):
        if index == 0:
            continue
        pg, font, size, x0, y0, x1, y1, nchars, thai = line.rstrip('\n').split('\t')
        if int(pg) != page or not (lo <= float(y0) <= hi):
            continue
        key = (round(float(y0)), font.split('+')[-1].replace('-Identity-H', ''), float(size))
        group = groups[key]
        group[0] = min(group[0], float(x0))
        group[1] = max(group[1], float(x1))
        group[2] += int(nchars)
    for key in sorted(groups):
        group = groups[key]
        print('%s p%d baseline %d pt (%.1f mm) %s %.2f pt x %.0f-%.0f pt (%.1f-%.1f mm) chars %d' % (
            label, page, key[0], key[0] * 25.4 / 72, key[1], key[2],
            group[0], group[1], group[0] * 25.4 / 72, group[1] * 25.4 / 72, group[2]))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
