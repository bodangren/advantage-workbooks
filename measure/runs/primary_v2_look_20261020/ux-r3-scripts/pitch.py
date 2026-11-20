"""Line pitch and font of the 12 pt article text on each page, from a spans TSV (see spans.py).

A line is one baseline value. A pitch is the gap between two baselines of the same text block
(gaps over 60 pt break the block). Prints no page text.

Usage: python3 -I -B pitch.py <spans.tsv> <label>
"""

import sys
from collections import defaultdict
from statistics import median


def main(argv):
    """Prints, for each page, the 12 pt Quicksand block pitches and the left edge of the block."""
    path, label = argv[0], argv[1]
    pages = defaultdict(list)
    for index, line in enumerate(open(path, encoding='utf-8')):
        if index == 0:
            continue
        page, font, size, x0, y0, x1, y1, nchars, thai = line.rstrip('\n').split('\t')
        if abs(float(size) - 12.0) > 0.05 or 'QuicksandLight-Regular' not in font:
            continue
        pages[int(page)].append((float(x0), float(y0)))
    for page in sorted(pages):
        spans = pages[page]
        # Group by column: left column starts near x=57 pt, the hero-row column starts right of x=250 pt.
        for name, low, high in (('left', 0, 250), ('right', 250, 1000)):
            baselines = sorted(set(round(y) for x, y in spans if low <= x < high))
            if len(baselines) < 2:
                if baselines:
                    print('%s p%d %s: 1 line, baseline %d' % (label, page, name, baselines[0]))
                continue
            gaps = [b - a for a, b in zip(baselines, baselines[1:])]
            in_block = [g for g in gaps if g < 60]
            xs = sorted(x for x, y in spans if low <= x < high)
            print('%s p%d %s: lines %d, first baseline %d, last %d, in-block pitches median %.1f min %d max %d, left edge min x %.0f pt (%.1f mm)' % (
                label, page, name, len(baselines), baselines[0], baselines[-1],
                median(in_block) if in_block else -1,
                min(in_block) if in_block else -1, max(in_block) if in_block else -1,
                xs[0], xs[0] * 25.4 / 72))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
