#!/usr/bin/env python3
"""Rewrites and checks the MANIFEST.txt of the hand-off folder (Task 2.9 part 6).

Track storytime_cover_options_20261106. The manifest writer is
`measure/tracks/storytime_cover_options_20261106/options/manifest.py`, the same call as
`manifest_check_2_9e.py`.

Steps:
1. It saves the old MANIFEST.txt (85 lines) as `manifest-old-2-9f.txt` in this folder. It asserts
   that the old file holds the SHA-256
   `34384529f605a733282e314540953bcb7c39f830076d0b323297f6b3d5b481b8`.
2. It runs the writer on the folder.
3. It checks: every new line holds the form `<sha256>  <bytes>  <path>` and matches the file on
   disk; every file of the folder except MANIFEST.txt has exactly one line; the line count is 85;
   exactly 48 lines are byte-equal to the old file; exactly 37 lines changed, and their names are
   the 34 reader files and the 3 sheets.
4. It prints the line count, the changed names, and the SHA-256 of the new MANIFEST.txt.

Usage: python3 -I -B manifest_check_2_9f.py <hand-off folder>
"""

import hashlib
import os
import subprocess
import sys

REPO = '/home/daniebo/Desktop/Workbooks'
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
WRITER = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/options/manifest.py')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9f.txt')
OLD_SHA = '34384529f605a733282e314540953bcb7c39f830076d0b323297f6b3d5b481b8'
OLD_LINES_EXPECTED = 85
EXPECTED_LINES = 85
EXPECTED_CHANGED = 37
EXPECTED_UNCHANGED = 48

READER_FOLDERS = ['readers-a3', 'readers-leaf']
SHEETS = ['contact-sheets/readers-a3.png', 'contact-sheets/readers-leaf.png',
          'contact-sheets/all.png']


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read_rows(path):
    """Returns the manifest as a dict of the relative name and its `<sha>  <bytes>` prefix."""
    rows = {}
    with open(path, encoding='utf-8') as handle:
        for line in handle.read().splitlines():
            parts = line.split('  ')
            if len(parts) != 3:
                continue
            rows[parts[2]] = (parts[0], parts[1])
    return rows


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

    # The 37 replaced names and the 48 unchanged names.
    old_rows = read_rows(OLD_COPY)
    new_rows = read_rows(manifest)
    changed = set()
    unchanged = 0
    for rel, value in new_rows.items():
        if rel in old_rows and old_rows[rel] == value:
            unchanged += 1
        else:
            changed.add(rel)
    planned = set()
    for folder in READER_FOLDERS:
        source_dir = os.path.join(root, folder)
        for entry in os.listdir(source_dir):
            planned.add(folder + '/' + entry)
    for rel in SHEETS:
        planned.add(rel)
    print('UNCHANGED_LINES %d' % unchanged)
    print('UNCHANGED_LINES_EXPECTED %s' % str(unchanged == EXPECTED_UNCHANGED).lower())
    print('CHANGED_LINES %d' % len(changed))
    print('CHANGED_LINES_EXPECTED %s' % str(len(changed) == EXPECTED_CHANGED).lower())
    print('CHANGED_NAMES_MATCH_PLANNED %s' % str(changed == planned).lower())
    for rel in sorted(changed):
        print('CHANGED %s old=%s new=%s' % (rel, old_rows.get(rel, ('missing',))[0],
                                            new_rows[rel][0]))

    print('MANIFEST_SHA256 ' + sha256(manifest))
    print('MANIFEST_BYTES %d' % os.path.getsize(manifest))
    ok = (done.returncode == 0 and old_in_new == EXPECTED_UNCHANGED
          and len(old_lines) == OLD_LINES_EXPECTED and matched == len(new_lines)
          and not bad and files == listed and len(new_lines) == len(files)
          and len(new_lines) == EXPECTED_LINES and unchanged == EXPECTED_UNCHANGED
          and len(changed) == EXPECTED_CHANGED and changed == planned)
    print('MANIFEST_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
