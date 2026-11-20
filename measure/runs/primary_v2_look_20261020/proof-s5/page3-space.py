"""Measure text vertical extent on one proof page, without printing page text.

Uses pdftotext -bbox word boxes. Prints counts and y coordinates only.

Usage: python3 -I -B page3-space.py <pdf> <page>
"""

import re
import subprocess
import sys

WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">')


def main(argv):
    """Prints the number of words and their y range on one page."""
    pdf, page = argv[0], argv[1]
    out = subprocess.run(
        ['pdftotext', '-f', page, '-l', page, '-bbox', pdf, '-'],
        capture_output=True, text=True,
    ).stdout
    boxes = [(float(m.group(2)), float(m.group(4)), float(m.group(1))) for m in WORD.finditer(out)]
    if not boxes:
        print('page %s: no words' % page)
        return 0
    ys = sorted(set(round(b[0]) for b in boxes))
    print('page %s: words %d, y_min %.1f, y_max %.1f, distinct baselines %d' % (
        page, len(boxes), min(b[0] for b in boxes), max(b[1] for b in boxes), len(ys)))
    print('baseline sample %s' % ','.join(str(y) for y in ys[:40]))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
