#!/usr/bin/env python3
"""Copies the 10 r3 book cover files of the build into the hand-off folder (Task 2.9 part 7).

Track storytime_cover_options_20261106.

From the r3 build of `/tmp/opencode/c29g/pr/storytime/covers-quest-v1/`:
- from `student/`: front.png, back.png, cover.pdf, build-report.json, and the PDF/X file;
- from `teacher/`: teacher-front.png, teacher-back.png, teacher-cover.pdf, build-report.json, and
  the PDF/X file.
The 9 picture, Chrome PDF, and report files get the `-alt-hlogo-r3` name; the 2 PDF/X files get the
`-alt-hlogo-r3` block before `_PDFX-1a`.

This script follows `copy_2_9c.py` of part 3, with the r3 names and the new build folder. It writes
no README, because the brief of part 7 names the 10 book files only.

Every copy is a byte copy. The script proves each SHA-256 pair equal and prints the values. It stops
when a target file already exists, when a source file is missing, or when a guard file changed. The
guard files are the 8 pinned print files of the folder: the 6 files of part 1, part 2, and part 3,
and the 2 r2 print files of Daniel's pick. The r2 files, the r5 files, and the old `-alt-hlogo`
files stay untouched.

Usage: python3 -I -B copy_2_9g.py
"""

import hashlib
import os
import shutil

HANDOFF = '/home/daniebo/Desktop/print-ready/storytime/covers-quest-v1'
BUILD = '/tmp/opencode/c29g/pr/storytime/covers-quest-v1'

STUDENT_PDFX = 'Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf'
TEACHER_PDFX = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf'

COPIES = [
    ('student', 'front.png', 'student/front-alt-hlogo-r3.png'),
    ('student', 'back.png', 'student/back-alt-hlogo-r3.png'),
    ('student', 'cover.pdf', 'student/cover-alt-hlogo-r3.pdf'),
    ('student', 'build-report.json', 'student/build-report-alt-hlogo-r3.json'),
    ('student', STUDENT_PDFX,
     'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r3_PDFX-1a.pdf'),
    ('teacher', 'teacher-front.png', 'teacher/teacher-front-alt-hlogo-r3.png'),
    ('teacher', 'teacher-back.png', 'teacher/teacher-back-alt-hlogo-r3.png'),
    ('teacher', 'teacher-cover.pdf', 'teacher/teacher-cover-alt-hlogo-r3.pdf'),
    ('teacher', 'build-report.json', 'teacher/build-report-alt-hlogo-r3.json'),
    ('teacher', TEACHER_PDFX,
     'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r3_PDFX-1a.pdf'),
]

# The 8 pinned print files of the folder keep their SHA-256 values.
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
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf',
     'bc00778ebcc91787b708a5dec353f75aa4559218404e598bcc596ec07daf6663'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf',
     '6a50cdb2767c3afe734d96d1d38657d11f48e11289b008753d89c9a955cdeefd'),
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    """Lists the sources, runs the 10 copies, and runs the guard."""
    for folder in ('student', 'teacher'):
        path = os.path.join(BUILD, folder)
        names = sorted(os.listdir(path))
        print('SOURCE_LISTING %s %d: %s' % (folder, len(names), ' '.join(names)))

    for folder, source_name, target_rel in COPIES:
        if source_name not in os.listdir(os.path.join(BUILD, folder)):
            print('SOURCE_MISSING %s/%s' % (folder, source_name))
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
