#!/usr/bin/env python3
"""Counts the hairline stripes of an A3 reader cover PNG (Task 2.9 part 12 step 3b, rule D-F7b-2).

Track storytime_cover_options_20261106. The PNG is 4961 x 3508 px. The hairline of F7b sits at
about 8.5 mm = 100 px from the top edge and from the bottom edge.

The rule: take the row mean (mean of R, G, and B over the columns of the window, 3 to 4957 as the
default) for each row of the top band, y 60 to 140, and of the bottom band, y 3368 to 3448. A row y
is a stripe when its mean is more than 15 above both rows y - D and y + D, or more than 15 below
both rows, with D = 2 as the default.

Usage: python3 -I -B stripe_check_2_9l.py [--distance D] [--window X0,X1] [--expect positive|zero] <png> ...

`--window X0,X1` takes the columns X0 to X1 inclusive. `--expect positive` exits 1 when one file
holds no stripe in the top band or none in the bottom band. `--expect zero` exits 1 when one file
holds a stripe in either band. It prints the stripe rows and the counts for each file. It shows no
picture.
"""

import hashlib
import sys

from PIL import Image

BANDS = {'top': (60, 140), 'bottom': (3368, 3448)}
THRESHOLD = 15.0


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def row_means(image, x0, x1):
    """Returns a dict of the row y and the mean of R, G, and B over the columns x0 to x1."""
    width, height = image.size
    data = image.tobytes()
    stride = width * 3
    count = (x1 - x0 + 1) * 3
    means = {}
    for y in range(height):
        start = y * stride + x0 * 3
        means[y] = sum(data[start:start + count]) / count
    return means


def stripes(means, low, high, distance):
    """Returns the stripe rows of one band as a list of (y, mean, mean y-D, mean y+D)."""
    found = []
    for y in range(low, high + 1):
        here = means[y]
        before = means[y - distance]
        after = means[y + distance]
        above = here - before > THRESHOLD and here - after > THRESHOLD
        below = before - here > THRESHOLD and after - here > THRESHOLD
        if above or below:
            found.append((y, here, before, after))
    return found


def main(argv):
    """Runs the check on each file and prints the counts."""
    distance = 2
    window = (3, 4957)
    expect = None
    rest = list(argv)
    while rest and rest[0].startswith('--'):
        option = rest.pop(0)
        if option == '--distance':
            distance = int(rest.pop(0))
        elif option == '--window':
            first, last = rest.pop(0).split(',')
            window = (int(first), int(last))
        elif option == '--expect':
            expect = rest.pop(0)
        else:
            print('UNKNOWN_OPTION ' + option)
            return 2
    failed = 0
    print('RULE distance=%d window=%d..%d threshold=%.0f bands=top %d..%d bottom %d..%d'
          % (distance, window[0], window[1], THRESHOLD, BANDS['top'][0], BANDS['top'][1],
             BANDS['bottom'][0], BANDS['bottom'][1]))
    for path in rest:
        image = Image.open(path).convert('RGB')
        print('FILE %s size=%dx%d sha256=%s' % (path, image.width, image.height, sha256(path)))
        means = row_means(image, window[0], window[1])
        counts = {}
        for name, (low, high) in BANDS.items():
            found = stripes(means, low, high, distance)
            counts[name] = len(found)
            for y, here, before, after in found:
                print('  STRIPE band=%s y=%d mean=%.2f mean_minus=%.2f mean_plus=%.2f'
                      % (name, y, here, before, after))
            lo = min(means[y] for y in range(low, high + 1))
            hi = max(means[y] for y in range(low, high + 1))
            print('  BAND_MEAN_RANGE band=%s min=%.2f max=%.2f' % (name, lo, hi))
        print('  STRIPES top=%d bottom=%d' % (counts['top'], counts['bottom']))
        if expect == 'positive' and (counts['top'] == 0 or counts['bottom'] == 0):
            failed += 1
        if expect == 'zero' and (counts['top'] or counts['bottom']):
            failed += 1
    print('EXPECT %s FAILED_FILES %d' % (expect, failed))
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
