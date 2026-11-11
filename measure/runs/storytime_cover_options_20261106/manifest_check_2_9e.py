#!/usr/bin/env python3
"""Rewrites and checks the MANIFEST.txt of the hand-off folder (Task 2.9 part 5).

Track storytime_cover_options_20261106. The manifest writer is
`measure/tracks/storytime_cover_options_20261106/options/manifest.py`, the same call as
`manifest_check_2_9c.py`.

Steps:
1. It saves the old MANIFEST.txt (48 lines) as `manifest-old-2-9e.txt` in this folder. It asserts
   that the old file holds the SHA-256
   `2aa88d4082df1c94bd3f67d2792b1e0065e139375592b6479e9f4faedb96043d`.
2. It runs the writer on the folder.
3. It checks: every old line is byte-equal in the new file; every new line holds the form
   `<sha256>  <bytes>  <path>` and matches the file on disk; every file of the folder except
   MANIFEST.txt has exactly one line; the line count is 85 (48 old, 34 reader files, 3 sheets).
4. It prints the line count and the SHA-256 of the new MANIFEST.txt.

Usage: python3 -I -B manifest_check_2_9e.py <hand-off folder>
"""

import hashlib
import os
import subprocess
import sys

REPO = '/home/daniebo/Desktop/Workbooks'
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
WRITER = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/options/manifest.py')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9e.txt')
OLD_SHA = '2aa88d4082df1c94bd3f67d2792b1e0065e139375592b6479e9f4faedb96043d'
OLD_LINES_EXPECTED = 48
EXPECTED_LINES = 85


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main(argv):
    """Runs the 4 steps and prints the counts."""
    root = os.path.abspath(argv[0])
    manifest = os.path.join(root, 'MANIFEST.txt')
    old_digest = sha256(manifest)
    print('OLD_MANIFEST_SHA256 ' + old_digest)
    print('OLD_MANIFEST_SHA_EXPECTED ' + str(old_digest == OLD_SHA).lower())
    if old_digest != OLD_SHA:
        print('MANIFEST_OK false')
        return 1
    with open(manifest, 'rb') as source, open(OLD_COPY, 'wb') as handle:
        handle.write(source.read())
    print('OLD_COPY %s bytes=%d' % (OLD_COPY, os.path.getsize(OLD_COPY)))

    done = subprocess.run(['python3', '-I', '-B', WRITER, root], capture_output=True, text=True)
    print('WRITER_EXIT %d: %s' % (done.returncode, done.stdout.strip()))

    new_lines = open(manifest, encoding='utf-8').read().splitlines()
    old_lines = open(OLD_COPY, encoding='utf-8').read().splitlines()

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
    print('OLD_LINE_COUNT_EXPECTED %s' % str(len(old_lines) == OLD_LINES_EXPECTED).lower())
    print('NEW_LINE_COUNT %d' % len(new_lines))
    print('NEW_LINE_COUNT_EXPECTED %s' % str(len(new_lines) == EXPECTED_LINES).lower())
    print('MANIFEST_SHA256 ' + sha256(manifest))
    print('MANIFEST_BYTES %d' % os.path.getsize(manifest))
    ok = (done.returncode == 0 and old_in_new == len(old_lines)
          and len(old_lines) == OLD_LINES_EXPECTED and matched == len(new_lines)
          and not bad and files == listed and len(new_lines) == len(files)
          and len(new_lines) == EXPECTED_LINES)
    print('MANIFEST_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
