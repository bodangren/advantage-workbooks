#!/usr/bin/env python3
"""The edge fill of the option A back art (track storytime_cover_options_20261106, Task 2.9 part 11).

This is `fix-back-edge-2-9g.py` with only the output folder changed. It fills the noise strip at
the left edge of the back art in a temporary copy. It makes no new art call and it writes nothing
under content/.

The rule: for every row, the column x of the output takes the column 27 minus x of the source, for
x from 0 to 13. Every other pixel of the output equals the source.

Usage: python3 -I -B fix-back-edge-2-9k.py

It prints the size, the mode, the count of differing pixels outside the strip, the mean absolute
difference of the adjacent columns for x from 0 to 12 before and after, and the SHA-256 of the
source and of the output. It never opens or shows a page image.
"""

import hashlib
import os

from PIL import Image, ImageOps

REPO = '/home/daniebo/Desktop/Workbooks'
SOURCE = os.path.join(REPO, 'content/storytime/l2/print/pictures/l2-u1-cover-quest-back-v1-300ppi.png')
TARGET_FOLDER = '/tmp/opencode/c29k/pictures'
TARGET = os.path.join(TARGET_FOLDER, 'l2-u1-cover-quest-back-v1-300ppi.png')

STRIP_COLUMNS = 14
MIRROR_END = 28
DENSITY = 300


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def adjacent_difference(image, x):
    """Returns the mean absolute difference of the column x and the column x plus 1, over all rows."""
    left = image.crop((x, 0, x + 1, image.height)).tobytes()
    right = image.crop((x + 1, 0, x + 2, image.height)).tobytes()
    total = sum(abs(a - b) for a, b in zip(left, right))
    return total / len(left)


def main():
    """Fills the strip and prints the checks."""
    os.makedirs(TARGET_FOLDER, exist_ok=True)
    if os.path.exists(TARGET):
        print('TARGET_EXISTS ' + TARGET)
        return 1
    source = Image.open(SOURCE)
    source = source.convert('RGB')
    out = source.copy()

    band = source.crop((MIRROR_END - STRIP_COLUMNS, 0, MIRROR_END, source.height))
    flipped = ImageOps.mirror(band)
    out.paste(flipped, (0, 0))

    out.save(TARGET, format='PNG', dpi=(DENSITY, DENSITY))

    result = Image.open(TARGET)
    print('SOURCE_SIZE ' + '%dx%d' % source.size)
    print('OUTPUT_SIZE ' + '%dx%d' % result.size)
    print('OUTPUT_MODE ' + result.mode)
    print('OUTPUT_HAS_ALPHA ' + str(result.mode in ('RGBA', 'LA', 'PA') or 'transparency' in result.info))
    print('OUTPUT_DENSITY ' + str(result.info.get('dpi')))

    # Every pixel outside the strip must equal the source.
    source_bytes = source.crop((STRIP_COLUMNS, 0, source.width, source.height)).tobytes()
    out_bytes = result.crop((STRIP_COLUMNS, 0, result.width, result.height)).tobytes()
    differing = sum(1 for a, b in zip(source_bytes, out_bytes) if a != b)
    print('DIFFERING_PIXELS_OUTSIDE_STRIP ' + str(differing))

    # The strip must hold the mirror of the source columns.
    mirror_ok = True
    for x in range(STRIP_COLUMNS):
        left = out.crop((x, 0, x + 1, out.height)).tobytes()
        right = source.crop((MIRROR_END - 1 - x, 0, MIRROR_END - x, source.height)).tobytes()
        if left != right:
            mirror_ok = False
    print('STRIP_IS_MIRROR ' + str(mirror_ok))

    before = [adjacent_difference(source, x) for x in range(STRIP_COLUMNS)]
    after = [adjacent_difference(result, x) for x in range(STRIP_COLUMNS)]
    for x in range(STRIP_COLUMNS):
        print('ADJACENT_DIFF x=%d before=%.4f after=%.4f' % (x, before[x], after[x]))
    print('ADJACENT_DIFF_MEAN before=%.4f after=%.4f'
          % (sum(before) / len(before), sum(after) / len(after)))
    print('SOURCE_SHA256 ' + sha256(SOURCE))
    print('OUTPUT_SHA256 ' + sha256(TARGET))
    print('EDGE_FILL_OK ' + str(differing == 0 and mirror_ok
                                and result.size == (2480, 3508) and result.mode == 'RGB'))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
