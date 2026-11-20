"""Measure the hero picture and the paragraph 1 column on page 3 from a 300 dpi render. Numbers only.

The hero is the first tall non-white run in the left band (x 18 to 106 mm) below the marking key.
The text column is the non-white box in the right band (x 106 to 192 mm) in the same y range.

Usage: python3 -I -B hero.py <page-png> <label> <y-start-mm>
"""

import sys

from PIL import Image

DPI = 300.0
PX = DPI / 25.4


def runs(profile, gap_px):
    """Group indexes with a True flag into runs separated by gaps of at least gap_px."""
    out = []
    start = None
    last = None
    for index, flag in enumerate(profile):
        if flag:
            if start is None:
                start = index
            elif index - last > gap_px:
                out.append((start, last))
                start = index
            last = index
    if start is not None:
        out.append((start, last))
    return out


def main(argv):
    """Prints the hero box, the text column box, the gutter, and the vertical blanks."""
    path, label, y_start = argv[0], argv[1], float(argv[2])
    image = Image.open(path).convert('L')
    width, height = image.size
    y0 = int(y_start * PX)
    y1 = int(262 * PX)

    def band(x_lo, x_hi):
        box = image.crop((int(x_lo * PX), y0, int(x_hi * PX), y1))
        data = box.tobytes()
        w, h = box.size
        rows = [any(value < 235 for value in data[r * w:(r + 1) * w]) for r in range(h)]
        cols = [False] * w
        for r in range(h):
            row = data[r * w:(r + 1) * w]
            for c in range(w):
                if row[c] < 235:
                    cols[c] = True
        return rows, cols, w, h

    rows, cols, w, h = band(18, 106)
    row_runs = runs(rows, int(1.0 * PX))
    print('%s left band: %d vertical runs (y mm): %s' % (
        label, len(row_runs),
        '; '.join('%.1f-%.1f (h %.1f)' % ((y0 + a) / PX, (y0 + b) / PX, (b - a + 1) / PX) for a, b in row_runs)))
    if row_runs:
        a, b = row_runs[0]
        hero = image.crop((int(18 * PX), y0 + a, int(106 * PX), y0 + b + 1))
        data = hero.tobytes()
        hw, hh = hero.size
        xs = [c for c in range(hw) if any(data[r * hw + c] < 235 for r in range(hh))]
        print('%s hero box: x %.2f-%.2f mm (w %.2f mm), y %.2f-%.2f mm (h %.2f mm)' % (
            label, 18 + xs[0] / PX, 18 + xs[-1] / PX, (xs[-1] - xs[0] + 1) / PX,
            (y0 + a) / PX, (y0 + b) / PX, (b - a + 1) / PX))
        hero_right = 18 + xs[-1] / PX
        hero_top = (y0 + a) / PX
        hero_bottom_with_caption = (y0 + row_runs[-1][1]) / PX
    else:
        hero_right = hero_top = hero_bottom_with_caption = None

    rows2, cols2, w2, h2 = band(106, 192)
    row_runs2 = runs(rows2, int(8.0 * PX))
    col_runs = runs(cols2, int(10.0 * PX))
    if row_runs2 and col_runs:
        top = (y0 + row_runs2[0][0]) / PX
        bottom = (y0 + row_runs2[-1][1]) / PX
        left = 106 + col_runs[0][0] / PX
        right = 106 + col_runs[-1][1] / PX
        print('%s text column box: x %.2f-%.2f mm (w %.2f mm), y %.2f-%.2f mm (h %.2f mm)' % (
            label, left, right, right - left, top, bottom, bottom - top))
        if hero_right is not None:
            print('%s gutter between hero and text: %.2f mm; text top minus hero top: %.2f mm; text bottom minus left-band bottom (caption): %.2f mm' % (
                label, left - hero_right, top - hero_top, bottom - hero_bottom_with_caption))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
