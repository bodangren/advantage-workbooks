"""Page fill, foot blank, header gaps, and page-number position from 300 dpi page renders. Numbers only.

For each page: the lowest ink row above the page number (the content foot), the blank from that row
to the content bottom (265 mm), the share of the content area used, the page number baseline, and
for each wide box border (thick rule 160 mm or longer) the gap to the next ink row in the medal
band (x 20 to 32 mm).

Usage: python3 -I -B gaps.py <image-dir> <label>
"""

import glob
import os
import re
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rules import rules_of  # noqa: E402

DPI = 300.0
PX = DPI / 25.4
CONTENT_TOP_MM = 20.0
CONTENT_BOTTOM_MM = 265.0


def ink_rows(image, x_lo_mm, x_hi_mm, y_lo_mm, y_hi_mm):
    """The set of y values (px) that hold at least one non-white pixel in the box."""
    box = image.crop((int(x_lo_mm * PX), int(y_lo_mm * PX), int(x_hi_mm * PX), int(y_hi_mm * PX)))
    data = box.tobytes()
    w, h = box.size
    out = []
    for r in range(h):
        row = data[r * w:(r + 1) * w]
        if min(row) < 235:
            out.append(int(y_lo_mm * PX) + r)
    return out


def main(argv):
    """Prints one line per page and the header gaps below wide box borders."""
    folder, label = argv[0], argv[1]
    for path in sorted(glob.glob(os.path.join(folder, 'p-*.png'))):
        page = int(re.search(r'p-(\d+)\.png', path).group(1))
        image = Image.open(path).convert('L')
        rows = ink_rows(image, 15, 195, 10, 266)
        num_rows = ink_rows(image, 85, 125, 266, 292)
        top_mm = rows[0] / PX if rows else -1
        foot_mm = rows[-1] / PX if rows else -1
        used = (foot_mm - CONTENT_TOP_MM) / (CONTENT_BOTTOM_MM - CONTENT_TOP_MM) * 100
        num_mm = num_rows[0] / PX if num_rows else -1
        num_end = num_rows[-1] / PX if num_rows else -1
        print('%s p%02d first ink %.1f mm, last ink %.1f mm, blank at foot %.1f mm, content area used %.0f%%, page number ink %.1f-%.1f mm' % (
            label, page, top_mm, foot_mm, CONTENT_BOTTOM_MM - foot_mm, used, num_mm, num_end))
        wide = [r for r in rules_of(path, DPI) if r[3] >= 7 and r[2] - r[1] >= 160.0]
        medal_rows = ink_rows(image, 20, 32, 10, 266)
        medal_set = set(medal_rows)
        for center, x0, x1, thick, gray in wide:
            bottom_px = int(center * PX + thick / 2 + 1)
            nxt = None
            for y in range(bottom_px + 1, int(266 * PX)):
                if y in medal_set:
                    nxt = y
                    break
            if nxt is not None:
                print('    box edge at %.1f mm (thick %d px): next ink in the medal band %.2f mm below' % (
                    center, thick, (nxt - bottom_px) / PX))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
