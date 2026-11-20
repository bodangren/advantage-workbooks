"""Find horizontal rules (writing lines and box borders) on page renders at 300 dpi.

A rule row holds one dark run (gray value under 200) of at least 25 mm. Neighbouring rule rows
form one rule. A thin rule (3 to 6 px at 300 dpi) is a candidate writing line; a thick rule is a
box edge. A page with a picture gives false rules inside the picture (the script skips every rule
that lies inside a picture area when it gets the picture boxes). Prints only numbers.

Usage: python3 -I -B rules.py <image-dir> <label> [dpi] [verbose]
"""

import glob
import os
import re
import sys

from PIL import Image

DARK = 200
MIN_RUN_MM = 25.0


def rules_of(path, dpi):
    """The rules of one page: (y_center_mm, x0_mm, x1_mm, thickness_px, mean_gray) tuples."""
    image = Image.open(path).convert('L')
    width, height = image.size
    table = bytes(1 if value < DARK else 0 for value in range(256))
    raw = image.tobytes()
    data = raw.translate(table)
    px_per_mm = dpi / 25.4
    min_run = int(MIN_RUN_MM * px_per_mm)
    pattern = re.compile(b'\x01{%d,}' % min_run)
    rows = []
    for y in range(height):
        row = data[y * width:(y + 1) * width]
        best = None
        for match in pattern.finditer(row):
            span = (match.start(), match.end())
            if best is None or span[1] - span[0] > best[1] - best[0]:
                best = span
        if best:
            gray = raw[y * width + best[0]:y * width + best[1]]
            rows.append((y, best[0], best[1], sum(gray) / len(gray)))
    groups = []
    for y, x0, x1, gray in rows:
        if groups and y - groups[-1]['y1'] <= 1:
            group = groups[-1]
            group['y1'] = y
            group['x0'] = min(group['x0'], x0)
            group['x1'] = max(group['x1'], x1)
            group['grays'].append(gray)
        else:
            groups.append({'y0': y, 'y1': y, 'x0': x0, 'x1': x1, 'grays': [gray]})
    out = []
    for group in groups:
        thick = group['y1'] - group['y0'] + 1
        center = (group['y0'] + group['y1']) / 2 / px_per_mm
        out.append((center, group['x0'] / px_per_mm, group['x1'] / px_per_mm, thick,
                    sum(group['grays']) / len(group['grays'])))
    return out


def main(argv):
    """Prints each page's rules (verbose) or the thin-rule counts."""
    folder, label = argv[0], argv[1]
    dpi = float(argv[2]) if len(argv) > 2 else 300.0
    verbose = len(argv) > 3 and argv[3] == 'verbose'
    for path in sorted(glob.glob(os.path.join(folder, 'p-*.png'))):
        page = int(re.search(r'p-(\d+)\.png', path).group(1))
        rules = rules_of(path, dpi)
        thin = [r for r in rules if r[3] <= 6]
        print('%s p%02d rules %d (thin %d)' % (label, page, len(rules), len(thin)))
        if verbose:
            for center, x0, x1, thick, gray in rules:
                print('  y %.2f mm  x %.1f-%.1f mm  len %.1f mm  thick %d px  gray %.0f' % (
                    center, x0, x1, x1 - x0, thick, gray))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
