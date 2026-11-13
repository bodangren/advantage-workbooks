#!/usr/bin/env python3
"""Copies the 10 r6 book cover files of the build into the new r6 folder (Task (Green, F10), step 6).

Track storytime_cover_options_20261106. This script follows `copy_2_9j.py` of part 10, with the r6
names, the F10 build folder, and the new output folder of D-F10-11.

From the r6 build of `/tmp/opencode/p2f10/pr/storytime/covers-quest-v1/`:
- from `student/`: front.png, back.png, cover.pdf, build-report.json, and the PDF/X file;
- from `teacher/`: teacher-front.png, teacher-back.png, teacher-cover.pdf, build-report.json, and
  the PDF/X file.
The 8 picture, Chrome PDF, and report files get the `-alt-hlogo-r6` name. The 2 PDF/X files get the
`-alt-hlogo-r6` block before `_PDFX-1a`.

Create only: the script stops when the r6 folder exists, when a source file is missing, or when the
accepted folder `covers-quest-v1` changed (its MANIFEST.txt must hash to 8f1901a3... before and
after the copies). Every copy is a byte copy, and the script proves each SHA-256 pair equal. It also
prints one line for each back page: whether the r6 back PNG equals the r5 back PNG (M-F10-12).

Usage: python3 -I -B copy_f10.py
"""

import hashlib
import os
import shutil

ROOT = '/home/daniebo/Desktop/print-ready/storytime'
TARGET = os.path.join(ROOT, 'covers-quest-v1-books-r6')
ACCEPTED = os.path.join(ROOT, 'covers-quest-v1')
ACCEPTED_MANIFEST_SHA = '8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87'
BUILD = '/tmp/opencode/p2f10/pr/storytime/covers-quest-v1'

STUDENT_PDFX = 'Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf'
TEACHER_PDFX = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf'

COPIES = [
    ('student', 'front.png', 'student/front-alt-hlogo-r6.png'),
    ('student', 'back.png', 'student/back-alt-hlogo-r6.png'),
    ('student', 'cover.pdf', 'student/cover-alt-hlogo-r6.pdf'),
    ('student', 'build-report.json', 'student/build-report-alt-hlogo-r6.json'),
    ('student', STUDENT_PDFX,
     'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r6_PDFX-1a.pdf'),
    ('teacher', 'teacher-front.png', 'teacher/teacher-front-alt-hlogo-r6.png'),
    ('teacher', 'teacher-back.png', 'teacher/teacher-back-alt-hlogo-r6.png'),
    ('teacher', 'teacher-cover.pdf', 'teacher/teacher-cover-alt-hlogo-r6.pdf'),
    ('teacher', 'build-report.json', 'teacher/build-report-alt-hlogo-r6.json'),
    ('teacher', TEACHER_PDFX,
     'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r6_PDFX-1a.pdf'),
]

# The r6 back pages and the r5 back pages of the accepted folder (M-F10-12).
BACK_PAIRS = [
    ('student/back-alt-hlogo-r6.png', 'student/back-alt-hlogo-r5.png'),
    ('teacher/teacher-back-alt-hlogo-r6.png', 'teacher/teacher-back-alt-hlogo-r5.png'),
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def accepted_ok(label):
    """Prints and checks the SHA-256 of the accepted MANIFEST.txt."""
    digest = sha256(os.path.join(ACCEPTED, 'MANIFEST.txt'))
    ok = digest == ACCEPTED_MANIFEST_SHA
    print('ACCEPTED_MANIFEST_%s sha256=%s ok=%s' % (label, digest, str(ok).lower()))
    return ok


def main():
    """Checks the guards, runs the 10 copies, and compares the backs."""
    if os.path.exists(TARGET):
        print('TARGET_FOLDER_EXISTS ' + TARGET)
        return 1
    if not accepted_ok('BEFORE'):
        return 1
    for folder in ('student', 'teacher'):
        names = sorted(os.listdir(os.path.join(BUILD, folder)))
        print('SOURCE_LISTING %s %d: %s' % (folder, len(names), ' '.join(names)))
    for folder, source_name, _ in COPIES:
        if not os.path.isfile(os.path.join(BUILD, folder, source_name)):
            print('SOURCE_MISSING %s/%s' % (folder, source_name))
            return 1

    os.makedirs(os.path.join(TARGET, 'student'))
    os.makedirs(os.path.join(TARGET, 'teacher'))
    pairs = 0
    for folder, source_name, target_rel in COPIES:
        source = os.path.join(BUILD, folder, source_name)
        target = os.path.join(TARGET, target_rel)
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1
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

    files = sorted(os.path.relpath(os.path.join(base, name), TARGET)
                   for base, _, names in os.walk(TARGET) for name in names)
    other = [name for name in files if name not in [rel for _, _, rel in COPIES]]
    print('TARGET_FILES %d OTHER_FILES %d' % (len(files), len(other)))

    backs_equal = 0
    for rel_new, rel_old in BACK_PAIRS:
        new_sha = sha256(os.path.join(TARGET, rel_new))
        old_sha = sha256(os.path.join(ACCEPTED, rel_old))
        equal = new_sha == old_sha
        backs_equal += 1 if equal else 0
        print('BACK_R6_VS_R5 %s vs %s equal=%s r6_sha256=%s r5_sha256=%s'
              % (rel_new, rel_old, str(equal).lower(), new_sha, old_sha))
    after = accepted_ok('AFTER')
    return 0 if pairs == len(COPIES) and not other and after else 1


if __name__ == '__main__':
    raise SystemExit(main())
