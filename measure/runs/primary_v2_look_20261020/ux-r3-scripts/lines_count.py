"""Count writing lines (thin tan rules) on page renders and report their pitches. Prints only numbers.

A writing line is a rule 3 to 4 px thick at 300 dpi, mean gray 141 to 147, and at least 25 mm
long. Pictures give false rules, so a page with a picture counts only the rules outside the
picture boxes that the caller names with picture_pages (page:ymin_mm:ymax_mm; the rest of that
page counts).

Usage: python3 -I -B lines_count.py <image-dir> <label> <skip-spec>
  skip-spec: comma list such as 3:45:999,4:0:999 (skip rules whose y lies in the band on that page)
"""

import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rules import rules_of  # noqa: E402


def parse_skip(spec):
    """Parse 'page:ymin:ymax,...' into a dict of page to list of bands."""
    out = {}
    if not spec or spec == '-':
        return out
    for item in spec.split(','):
        page, lo, hi = item.split(':')
        out.setdefault(int(page), []).append((float(lo), float(hi)))
    return out


def main(argv):
    """Prints the per-page writing line counts, the total, and the neighbour pitches."""
    folder, label, spec = argv[0], argv[1], argv[2]
    skip = parse_skip(spec)
    total = 0
    pitches_all = []
    per_page = []
    for path in sorted(glob.glob(os.path.join(folder, 'p-*.png'))):
        page = int(re.search(r'p-(\d+)\.png', path).group(1))
        lines = []
        for center, x0, x1, thick, gray in rules_of(path, 300.0):
            if not (3 <= thick <= 4 and 141 <= gray <= 147 and x1 - x0 >= 25.0):
                continue
            if any(lo <= center <= hi for lo, hi in skip.get(page, [])):
                continue
            lines.append((center, x0, x1))
        pitches = []
        for a, b in zip(lines, lines[1:]):
            gap = b[0] - a[0]
            if gap < 12.0 and abs(a[1] - b[1]) < 2.0 and abs(a[2] - b[2]) < 2.0:
                pitches.append(gap)
        total += len(lines)
        pitches_all.extend(pitches)
        per_page.append((page, len(lines), pitches))
    for page, count, pitches in per_page:
        print('%s p%02d writing_lines %2d  neighbour pitches mm: %s' % (
            label, page, count, ' '.join('%.2f' % p for p in pitches) if pitches else '-'))
    if pitches_all:
        mean = sum(pitches_all) / len(pitches_all)
        print('%s TOTAL writing_lines %d; neighbour pitches %d: min %.2f mean %.3f max %.2f mm; below 7.9 mm: %d; below 8.0 mm: %d' % (
            label, total, len(pitches_all), min(pitches_all), mean, max(pitches_all),
            sum(1 for p in pitches_all if p < 7.9), sum(1 for p in pitches_all if p < 8.0)))
    else:
        print('%s TOTAL writing_lines %d; no neighbour pitches' % (label, total))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
