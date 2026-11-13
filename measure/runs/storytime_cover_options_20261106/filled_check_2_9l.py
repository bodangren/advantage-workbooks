#!/usr/bin/env python3
"""Checks the filled copy of the w01-1 art against rule D-F7b-1 (Task 2.9 part 12 step 2).

Track storytime_cover_options_20261106. The build writes the copy to
`/tmp/storytime-art-edge-fill/99ee1b8d1fe0e9ad-l2-w01-cover-hello-v1.png`. This script checks:
- the mtime of the copy is after the build start (the epoch in `/tmp/opencode/c29l/build-start.txt`);
- the SHA-256 of the copy is not the part 11 value `e0b8dc48...`;
- the output row r equals the source row 335 - r for r from 0 to 167;
- the output row r equals the source row 5661 - r for r from 2831 to 2999;
- every other pixel of the output equals the source.

Usage: python3 -I -B filled_check_2_9l.py

It reads files and prints counts only. It shows no picture.
"""

import hashlib
import os

from PIL import Image

COPY = '/tmp/storytime-art-edge-fill/99ee1b8d1fe0e9ad-l2-w01-cover-hello-v1.png'
SOURCE = '/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures/l2-w01-cover-hello-v1.png'
BUILD_START = '/tmp/opencode/c29l/build-start.txt'
PART11_SHA = 'e0b8dc48adaeea48e07023e6b0f5ae39f70422bb040f65af4012e010e874e79f'
TOP_ROWS = 168
BOTTOM_ROWS = 169


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    """Runs the checks and prints the verdict."""
    start = int(open(BUILD_START).read().strip())
    stat = os.stat(COPY)
    print('COPY_MTIME %d' % int(stat.st_mtime))
    print('BUILD_START %d' % start)
    print('MTIME_AFTER_BUILD_START %s' % (stat.st_mtime > start))
    digest = sha256(COPY)
    print('COPY_BYTES %d' % stat.st_size)
    print('COPY_SHA256 ' + digest)
    print('SHA_DIFFERS_FROM_PART11 %s' % (digest != PART11_SHA))
    print('SOURCE_SHA256 ' + sha256(SOURCE))

    source = Image.open(SOURCE).convert('RGB')
    copy = Image.open(COPY).convert('RGB')
    print('SIZES source=%dx%d copy=%dx%d' % (source.width, source.height, copy.width, copy.height))
    width, height = source.size
    stride = width * 3
    src = source.tobytes()
    out = copy.tobytes()
    bottom_start = height - BOTTOM_ROWS

    def row(data, y):
        return data[y * stride:(y + 1) * stride]

    top_ok = all(row(out, r) == row(src, 2 * TOP_ROWS - 1 - r) for r in range(TOP_ROWS))
    bottom_ok = all(row(out, r) == row(src, 2 * bottom_start - 1 - r) for r in range(bottom_start, height))
    others_ok = all(row(out, r) == row(src, r) for r in range(TOP_ROWS, bottom_start))
    print('TOP_ROWS_MIRROR r=0..%d from source row %d - r: %s' % (TOP_ROWS - 1, 2 * TOP_ROWS - 1, top_ok))
    print('BOTTOM_ROWS_MIRROR r=%d..%d from source row %d - r: %s'
          % (bottom_start, height - 1, 2 * bottom_start - 1, bottom_ok))
    print('OTHER_ROWS_EQUAL_SOURCE %s' % others_ok)
    ok = (stat.st_mtime > start and digest != PART11_SHA and top_ok and bottom_ok and others_ok
          and (width, height) == (4000, 3000))
    print('FILLED_COPY_OK %s' % ok)
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
