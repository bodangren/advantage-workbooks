#!/usr/bin/env python3
"""Checks the new MANIFEST.txt of the hand-off folder (Task 2.9 part 2 teacher v2).

Track storytime_cover_options_20261106. The manifest writer is
`measure/tracks/storytime_cover_options_20261106/options/manifest.py`.

Checks:
1. Every old line (the 19 lines of Task 2.9 part 1, saved before the rewrite) is byte-equal in the
   new file.
2. Every new line holds the form `<sha256>  <bytes>  <path>`, and the SHA-256 and the size of the
   file on disk equal the values of the line.
3. Every file of the folder except MANIFEST.txt has exactly one line.

Usage: python3 -I -B manifest_check_2_9b.py <hand-off folder> <old manifest copy>
"""

import hashlib
import os
import sys


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main(argv):
    """Runs the 3 checks and prints the counts."""
    root = os.path.abspath(argv[0])
    old_path = argv[1]
    manifest = os.path.join(root, 'MANIFEST.txt')
    new_lines = open(manifest, encoding='utf-8').read().splitlines()
    old_lines = open(old_path, encoding='utf-8').read().splitlines()

    old_in_new = sum(1 for line in old_lines if line in new_lines)
    print('OLD_LINES %d' % len(old_lines))
    print('OLD_LINES_IN_NEW %d' % old_in_new)

    matched = 0
    bad = []
    listed = set()
    for line in new_lines:
        parts = line.split('  ')
        if len(parts) != 3:
            bad.append('FORM ' + line)
            continue
        digest, size_text, rel = parts
        listed.add(rel)
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            bad.append('MISSING ' + rel)
            continue
        if sha256(path) != digest or str(os.path.getsize(path)) != size_text:
            bad.append('MISMATCH ' + rel)
            continue
        matched += 1
    print('LINES_MATCHED %d' % matched)
    print('LINES_BAD %d' % len(bad))
    for item in bad:
        print('BAD ' + item)

    files = set()
    for base, _, names in os.walk(root):
        for name in names:
            rel = os.path.relpath(os.path.join(base, name), root)
            if rel == 'MANIFEST.txt':
                continue
            files.add(rel)
    print('FILES %d' % len(files))
    print('FILES_NOT_LISTED %d' % len(files - listed))
    print('LINES_NOT_ON_DISK %d' % len(listed - files))
    print('NEW_LINE_COUNT %d' % len(new_lines))
    print('MANIFEST_SHA256 ' + sha256(manifest))
    print('MANIFEST_BYTES %d' % os.path.getsize(manifest))
    ok = (old_in_new == len(old_lines) and matched == len(new_lines) and not bad
          and files == listed and len(new_lines) == len(files))
    print('MANIFEST_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
