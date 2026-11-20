"""Word box checks from pdftotext -bbox: overlapping words and words outside the side margins.

Prints counts and positions only. It prints no page text and no Thai text.

Usage: python3 -I -B words.py <pdf> <label>
"""

import re
import subprocess
import sys

PT_TO_MM = 25.4 / 72.0
LEFT_MM = 20.0
RIGHT_MM = 190.0
TOL_MM = 0.6


def main(argv):
    """Counts overlapping word pairs and words outside the side margins on each page."""
    pdf, label = argv[0], argv[1]
    xml = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
    pages = re.split(r'<page ', xml)[1:]
    total_words = 0
    total_overlap = 0
    total_outside = 0
    for index, page in enumerate(pages, start=1):
        boxes = []
        for match in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">', page):
            boxes.append(tuple(float(match.group(i)) for i in range(1, 5)))
        total_words += len(boxes)
        outside = [b for b in boxes
                   if b[0] * PT_TO_MM < LEFT_MM - TOL_MM or b[2] * PT_TO_MM > RIGHT_MM + TOL_MM]
        overlap = 0
        boxes_sorted = sorted(boxes)
        for i, a in enumerate(boxes_sorted):
            for b in boxes_sorted[i + 1:]:
                if b[0] >= a[2]:
                    break
                ix = min(a[2], b[2]) - max(a[0], b[0])
                iy = min(a[3], b[3]) - max(a[1], b[1])
                if ix > 0.5 and iy > 0.5:
                    area = ix * iy
                    small = min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))
                    if small > 0 and area / small > 0.2:
                        overlap += 1
        total_overlap += overlap
        total_outside += len(outside)
        if outside or overlap:
            print('%s p%02d words %d overlap pairs %d outside side margins %d (x mm %s)' % (
                label, index, len(boxes), overlap, len(outside),
                ' '.join('%.1f-%.1f' % (b[0] * PT_TO_MM, b[2] * PT_TO_MM) for b in outside[:4])))
    print('%s TOTAL words %d, overlap pairs %d, outside side margins (%.1f to %.1f mm +-%.1f) %d' % (
        label, total_words, total_overlap, LEFT_MM, RIGHT_MM, TOL_MM, total_outside))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
