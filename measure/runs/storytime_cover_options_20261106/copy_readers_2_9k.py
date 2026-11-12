#!/usr/bin/env python3
"""Replaces the 34 reader cover files of the hand-off folder (Task 2.9 part 11).

Track storytime_cover_options_20261106. The build of Task 2.9 part 11 wrote 44 files into
`/tmp/opencode/c29k/pr/storytime/covers-quest-v1/`. This script replaces the 34 files of the 2 reader
folders, `readers-a3/` and `readers-leaf/`, in `~/Desktop/print-ready/storytime/covers-quest-v1/`.

Hard rules:
- It replaces only the 34 files of the 2 reader folders. It copies no book file.
- It reads the old SHA-256 of each target from `MANIFEST.txt` and asserts that the file on disk holds
  that value before the write. A moved target stops the run.
- It uses `shutil.copyfile`, so every target is a new byte copy. It never makes a hard link.
- It asserts 17 files in each source folder and 17 files in each target folder.
- It records each write as `REPLACE <name> old=<sha> new=<sha> pair_equal=<true|false>` and asserts
  34 lines with 34 pairs equal.
- For the 8 book files of this build it prints one information line only. The line names the shipped
  `-alt-hlogo-r3` file and whether the SHA-256 equals it. No rule rides on that line.

Usage: python3 -I -B copy_readers_2_9k.py

It prints counts and SHA-256 values only. It opens no PDF and no picture.
"""

import hashlib
import os
import shutil

REPO = '/home/daniebo/Desktop/Workbooks'
OUT_ROOT = '/tmp/opencode/c29k/pr/storytime/covers-quest-v1'
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')
MANIFEST_SHA = 'f8c0377ec34f333f062bb96800f51e206f4d075b8f10241b3435126cf2ccec41'

READER_FOLDERS = ['readers-a3', 'readers-leaf']
FILES_PER_READER_FOLDER = 17
EXPECTED_REPLACEMENTS = 34

# The 8 book files of this build and their shipped r3 partners. Information lines only.
BOOK_PAIRS = [
    ('student/front.png', 'student/front-alt-hlogo-r3.png'),
    ('student/back.png', 'student/back-alt-hlogo-r3.png'),
    ('student/cover.pdf', 'student/cover-alt-hlogo-r3.pdf'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf',
     'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r3_PDFX-1a.pdf'),
    ('teacher/teacher-front.png', 'teacher/teacher-front-alt-hlogo-r3.png'),
    ('teacher/teacher-back.png', 'teacher/teacher-back-alt-hlogo-r3.png'),
    ('teacher/teacher-cover.pdf', 'teacher/teacher-cover-alt-hlogo-r3.pdf'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf',
     'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r3_PDFX-1a.pdf'),
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read_manifest(path):
    """Returns the manifest as a dict of the relative name and its SHA-256."""
    rows = {}
    with open(path, encoding='utf-8') as handle:
        for line in handle.read().splitlines():
            parts = line.split('  ')
            if len(parts) != 3:
                continue
            rows[parts[2]] = parts[0]
    return rows


def main():
    """Replaces the 34 files and prints the pairs."""
    if not os.path.isdir(OUT_ROOT):
        print('OUT_ROOT_MISSING ' + OUT_ROOT)
        return 1
    manifest_sha = sha256(MANIFEST)
    print('MANIFEST_SHA256 ' + manifest_sha)
    print('MANIFEST_SHA_EXPECTED ' + str(manifest_sha == MANIFEST_SHA).lower())
    if manifest_sha != MANIFEST_SHA:
        return 1
    old_rows = read_manifest(MANIFEST)
    print('MANIFEST_LINES %d' % len(old_rows))

    # Rule 1: 17 files in each source folder.
    for name in READER_FOLDERS:
        source_dir = os.path.join(OUT_ROOT, name)
        names = sorted(os.listdir(source_dir))
        print('SOURCE_FILES %s %d' % (name, len(names)))
        if len(names) != FILES_PER_READER_FOLDER:
            print('SOURCE_FILE_COUNT_FAILED ' + name)
            return 1

    replaced = 0
    pair_equal = 0
    for name in READER_FOLDERS:
        source_dir = os.path.join(OUT_ROOT, name)
        target_dir = os.path.join(HANDOFF, name)
        for entry in sorted(os.listdir(source_dir)):
            source = os.path.join(source_dir, entry)
            target = os.path.join(target_dir, entry)
            rel = name + '/' + entry
            if rel not in old_rows:
                print('NOT_IN_MANIFEST ' + rel)
                return 1
            if not os.path.exists(target):
                print('TARGET_MISSING ' + target)
                return 1
            old_sha = sha256(target)
            if old_sha != old_rows[rel]:
                print('OLD_SHA_MISMATCH %s manifest=%s disk=%s' % (rel, old_rows[rel], old_sha))
                return 1
            shutil.copyfile(source, target)
            new_sha = sha256(target)
            equal = new_sha == sha256(source)
            replaced += 1
            pair_equal += 1 if equal else 0
            print('REPLACE %s old=%s new=%s pair_equal=%s'
                  % (rel, old_sha, new_sha, str(equal).lower()))

    print('REPLACED %d' % replaced)
    print('PAIR_EQUAL %d' % pair_equal)

    # Rule 2: 17 files in each target folder.
    for name in READER_FOLDERS:
        target_dir = os.path.join(HANDOFF, name)
        count = len(os.listdir(target_dir))
        print('TARGET_FILES %s %d' % (name, count))
        if count != FILES_PER_READER_FOLDER:
            print('TARGET_FILE_COUNT_FAILED ' + name)
            return 1

    # Information lines only: the 8 book files against the shipped r3 partners.
    for built, shipped in BOOK_PAIRS:
        built_path = os.path.join(OUT_ROOT, built)
        shipped_path = os.path.join(HANDOFF, shipped)
        built_sha = sha256(built_path)
        shipped_sha = sha256(shipped_path) if os.path.exists(shipped_path) else 'missing'
        print('INFO_BOOK %s vs %s equals_r3=%s built_sha256=%s r3_sha256=%s'
              % (built, shipped, str(built_sha == shipped_sha).lower(), built_sha, shipped_sha))

    ok = replaced == EXPECTED_REPLACEMENTS and pair_equal == replaced
    print('REPLACE_LINES %d' % replaced)
    print('COPY_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
