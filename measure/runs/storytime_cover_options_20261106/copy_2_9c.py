#!/usr/bin/env python3
"""Copies the 10 A2 r2 cover files of the build into the hand-off folder (Task 2.9 part 3).

Track storytime_cover_options_20261106.

From the r2 build of `/tmp/opencode/c29c/pr-a2r2/storytime/covers-quest-v1/`:
- from `student/`: front.png, back.png, cover.pdf, build-report.json, and the PDF/X file;
- from `teacher/`: teacher-front.png, teacher-back.png, teacher-cover.pdf, build-report.json, and
  the PDF/X file.
The 9 picture, Chrome PDF, and report files get the `-alt-hlogo-r2` name; the 2 PDF/X files get the
`-alt-hlogo-r2` block before `_PDFX-1a`.

This script also writes `README-alt-hlogo-r2.txt` in the folder root.

Every copy is a byte copy. The script proves each SHA-256 pair equal and prints the values. It stops
when a target file already exists, when a source file is missing, or when a guard file changed.

Usage: python3 -I -B copy_2_9c.py
"""

import hashlib
import os
import shutil

HANDOFF = '/home/daniebo/Desktop/print-ready/storytime/covers-quest-v1'
BUILD = '/tmp/opencode/c29c/pr-a2r2/storytime/covers-quest-v1'

STUDENT_PDFX = 'Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf'
TEACHER_PDFX = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf'

COPIES = [
    ('student', 'front.png', 'student/front-alt-hlogo-r2.png'),
    ('student', 'back.png', 'student/back-alt-hlogo-r2.png'),
    ('student', 'cover.pdf', 'student/cover-alt-hlogo-r2.pdf'),
    ('student', 'build-report.json', 'student/build-report-alt-hlogo-r2.json'),
    ('student', STUDENT_PDFX,
     'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf'),
    ('teacher', 'teacher-front.png', 'teacher/teacher-front-alt-hlogo-r2.png'),
    ('teacher', 'teacher-back.png', 'teacher/teacher-back-alt-hlogo-r2.png'),
    ('teacher', 'teacher-cover.pdf', 'teacher/teacher-cover-alt-hlogo-r2.pdf'),
    ('teacher', 'build-report.json', 'teacher/build-report-alt-hlogo-r2.json'),
    ('teacher', TEACHER_PDFX,
     'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf'),
]

# The 6 print files of the folder keep their SHA-256 values.
GUARDS = [
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf',
     '920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf',
     '8ae118b644765eaeab537b503cab76bc7bb573d9dae6d3b4ed567c465dc5d6fa'),
    ('teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate_PDFX-1a.pdf',
     'd2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37'),
    ('teacher-candidate/'
     'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf',
     '665c044f6e828e618fc4c488564d26c6e63ddaf3d61432b3dba8aebd7596bf1a'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf',
     '1d2bcd99b347836a0dc48b8518064edb919947c0c0b26e076f05e1973f304e0e'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo_PDFX-1a.pdf',
     'f0c43292cca3add0fbfa99e8da651198f158489ad18086f33b370ac54644bf60'),
]

README = """Storytime Advantage · Level 2 Unit 1 · A2 r2 covers
=====================================================

Purpose
-------

This folder holds the A2 r2 covers of the Level 2 Unit 1 student book and teacher book.
Task 2.9 part 3 of track storytime_cover_options_20261106 writes these files.
The A2 r2 files end in `-alt-hlogo-r2`.

What changed in r2
------------------

The PM look check of 2026-11-11 found one fault. In the `-alt-hlogo` files, the logo filled only
about 50 % of the back tile width.
r2 makes the tile narrower. The front tile is 167.2 mm wide, and the back tile is 110.6 mm wide.
The logo now fills about 80 % of its tile in both directions, and the logo sits centered in the tile.
The plaques and all text did not change.
The build command is the A2 command with `--top hlogo`, and the code is the Green code 93ad740f.

The 10 files
------------

Student book:
- `student/front-alt-hlogo-r2.png`
- `student/back-alt-hlogo-r2.png`
- `student/cover-alt-hlogo-r2.pdf`
- `student/build-report-alt-hlogo-r2.json`
- `student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf`

Teacher book:
- `teacher/teacher-front-alt-hlogo-r2.png`
- `teacher/teacher-back-alt-hlogo-r2.png`
- `teacher/teacher-cover-alt-hlogo-r2.pdf`
- `teacher/build-report-alt-hlogo-r2.json`
- `teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf`

The 2 `_PDFX-1a.pdf` files are the printer files.
The 2 `cover-alt-hlogo-r2.pdf` and `teacher-cover-alt-hlogo-r2.pdf` files are the Chrome PDFs.

The record and the pick
-----------------------

The old `-alt-hlogo` files stay for the record.
Daniel picks between r5 (no suffix) and A2 r2 for both books, with no new build.
"""


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    """Lists the sources, runs the 10 copies, writes the README, and runs the guard."""
    for folder in ('student', 'teacher'):
        path = os.path.join(BUILD, folder)
        names = sorted(os.listdir(path))
        print('SOURCE_LISTING %s %d: %s' % (folder, len(names), ' '.join(names)))

    for folder, source_name, target_rel in COPIES:
        if source_name not in os.listdir(os.path.join(BUILD, folder)):
            print('SOURCE_MISSING %s/%s' % (folder, source_name))
            return 1
    readme_path = os.path.join(HANDOFF, 'README-alt-hlogo-r2.txt')
    if os.path.exists(readme_path):
        print('TARGET_EXISTS ' + readme_path)
        return 1
    for _, _, target_rel in COPIES:
        target = os.path.join(HANDOFF, target_rel)
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1

    pairs = 0
    for folder, source_name, target_rel in COPIES:
        source = os.path.join(BUILD, folder, source_name)
        target = os.path.join(HANDOFF, target_rel)
        shutil.copyfile(source, target)
        source_sha = sha256(source)
        target_sha = sha256(target)
        equal = source_sha == target_sha
        pairs += 1 if equal else 0
        print('COPY %s/%s -> %s bytes=%d sha256=%s pair_equal=%s'
              % (folder, source_name, target_rel, os.path.getsize(target), target_sha,
                 str(equal).lower()))
    print('COPIES %d' % len(COPIES))
    print('SHA_PAIRS_EQUAL %d' % pairs)

    with open(readme_path, 'w', encoding='utf-8') as handle:
        handle.write(README)
    print('README %s bytes=%d sha256=%s'
          % (readme_path, os.path.getsize(readme_path), sha256(readme_path)))

    guard_ok = 0
    for rel, expected in GUARDS:
        path = os.path.join(HANDOFF, rel)
        digest = sha256(path) if os.path.exists(path) else 'missing'
        ok = digest == expected
        guard_ok += 1 if ok else 0
        print('GUARD %s sha256=%s expected=%s ok=%s' % (rel, digest, expected, str(ok).lower()))
    print('GUARDS_OK %d' % guard_ok)
    return 0 if pairs == len(COPIES) and guard_ok == len(GUARDS) else 1


if __name__ == '__main__':
    raise SystemExit(main())
