#!/usr/bin/env python3
"""Copies the 2 reader cover folders into the hand-off folder (Task 2.9 part 5).

Track storytime_cover_options_20261106. The build of Task 2.9 part 5 wrote 44 files into
`/tmp/opencode/c29e/pr/storytime/covers-quest-v1/`. This script copies the 2 reader folders,
`readers-a3/` and `readers-leaf/`, into `~/Desktop/print-ready/storytime/covers-quest-v1/`.

Hard rules:
- It copies no book file. Only the 34 files of the 2 reader folders move.
- It uses `shutil.copyfile`, so every target is a new byte copy. It never makes a hard link.
- It asserts that neither target folder exists before the first write.
- It asserts 17 files in each source folder and 17 files in each target folder.
- It records each copy with its size, its SHA-256, and the flag `pair_equal`.
- For the 8 book files of this build it prints one information line only. The line names the
  shipped `-alt-hlogo-r2` file and whether the SHA-256 equals it. No rule rides on that line.

Usage: python3 -I -B copy_readers_2_9e.py

It prints counts and SHA-256 values only. It opens no PDF and no picture.
"""

import hashlib
import os
import shutil

REPO = '/home/daniebo/Desktop/Workbooks'
OUT_ROOT = '/tmp/opencode/c29e/pr/storytime/covers-quest-v1'
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')

READER_FOLDERS = ['readers-a3', 'readers-leaf']
FILES_PER_READER_FOLDER = 17

# The 8 book files of this build and their shipped r2 partners. Information lines only.
BOOK_PAIRS = [
    ('student/front.png', 'student/front-alt-hlogo-r2.png'),
    ('student/back.png', 'student/back-alt-hlogo-r2.png'),
    ('student/cover.pdf', 'student/cover-alt-hlogo-r2.pdf'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf',
     'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf'),
    ('teacher/teacher-front.png', 'teacher/teacher-front-alt-hlogo-r2.png'),
    ('teacher/teacher-back.png', 'teacher/teacher-back-alt-hlogo-r2.png'),
    ('teacher/teacher-cover.pdf', 'teacher/teacher-cover-alt-hlogo-r2.pdf'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf',
     'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf'),
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    """Copies the 34 files and prints the pairs."""
    if not os.path.isdir(OUT_ROOT):
        print('OUT_ROOT_MISSING ' + OUT_ROOT)
        return 1

    # Rule 1: neither target folder exists.
    for name in READER_FOLDERS:
        target_dir = os.path.join(HANDOFF, name)
        if os.path.exists(target_dir) or os.path.islink(target_dir):
            print('TARGET_FOLDER_EXISTS ' + target_dir)
            return 1
    print('TARGET_FOLDERS_ABSENT true')

    # Rule 2: 17 files in each source folder.
    for name in READER_FOLDERS:
        source_dir = os.path.join(OUT_ROOT, name)
        names = sorted(os.listdir(source_dir))
        print('SOURCE_FILES %s %d' % (name, len(names)))
        if len(names) != FILES_PER_READER_FOLDER:
            print('SOURCE_FILE_COUNT_FAILED ' + name)
            return 1

    copied = 0
    pair_equal = 0
    for name in READER_FOLDERS:
        source_dir = os.path.join(OUT_ROOT, name)
        target_dir = os.path.join(HANDOFF, name)
        os.makedirs(target_dir, exist_ok=False)
        for entry in sorted(os.listdir(source_dir)):
            source = os.path.join(source_dir, entry)
            target = os.path.join(target_dir, entry)
            if os.path.exists(target):
                print('TARGET_EXISTS ' + target)
                return 1
            shutil.copyfile(source, target)
            source_sha, target_sha = sha256(source), sha256(target)
            equal = source_sha == target_sha
            copied += 1
            pair_equal += 1 if equal else 0
            print('COPY %s/%s bytes=%d sha256=%s pair_equal=%s'
                  % (name, entry, os.path.getsize(target), target_sha, str(equal).lower()))

    print('COPIED %d' % copied)
    print('PAIR_EQUAL %d' % pair_equal)

    # Rule 3: 17 files in each target folder.
    for name in READER_FOLDERS:
        target_dir = os.path.join(HANDOFF, name)
        count = len(os.listdir(target_dir))
        print('TARGET_FILES %s %d' % (name, count))
        if count != FILES_PER_READER_FOLDER:
            print('TARGET_FILE_COUNT_FAILED ' + name)
            return 1

    # Information lines only: the 8 book files against the shipped r2 partners.
    for built, shipped in BOOK_PAIRS:
        built_path = os.path.join(OUT_ROOT, built)
        shipped_path = os.path.join(HANDOFF, shipped)
        built_sha = sha256(built_path)
        shipped_sha = sha256(shipped_path) if os.path.exists(shipped_path) else 'missing'
        print('INFO_BOOK %s vs %s equals_r2=%s built_sha256=%s r2_sha256=%s'
              % (built, shipped, str(built_sha == shipped_sha).lower(), built_sha, shipped_sha))

    ok = copied == 2 * FILES_PER_READER_FOLDER and pair_equal == copied
    print('COPY_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
