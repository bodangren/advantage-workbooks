#!/usr/bin/env python3
"""Copies the 10 teacher cover v2 files of the 2 builds into the hand-off folder.

Task 2.9 part 2 teacher v2, track storytime_cover_options_20261106.

From the r5 build: teacher-front.png, teacher-back.png, teacher-cover.pdf, build-report.json, and
the PDF/X file under its built name.
From the A2 build: the same 5 files under the `-alt-hlogo` names.

Every copy is a byte copy. The script proves each SHA-256 pair equal and prints the values. It stops
when the teacher folder already exists, when a source file is missing, or when a guard file changed.
It copies no student file and no file into teacher-candidate/.

Usage: python3 -I -B copy_teacher_2_9b.py
"""

import hashlib
import os
import shutil
import sys

REPO = '/home/daniebo/Desktop/Workbooks'
HANDOFF = '/home/daniebo/Desktop/print-ready/storytime/covers-quest-v1'
TEACHER = os.path.join(HANDOFF, 'teacher')
BUILD_R5 = '/tmp/opencode/c29v2/pr-r5/storytime/covers-quest-v1/teacher'
BUILD_A2 = '/tmp/opencode/c29v2/pr-a2/storytime/covers-quest-v1/teacher'

PDFX_NAME = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf'
PDFX_A2_NAME = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo_PDFX-1a.pdf'

COPIES = [
    (BUILD_R5, 'teacher-front.png', 'teacher-front.png'),
    (BUILD_R5, 'teacher-back.png', 'teacher-back.png'),
    (BUILD_R5, 'teacher-cover.pdf', 'teacher-cover.pdf'),
    (BUILD_R5, 'build-report.json', 'build-report.json'),
    (BUILD_R5, PDFX_NAME, PDFX_NAME),
    (BUILD_A2, 'teacher-front.png', 'teacher-front-alt-hlogo.png'),
    (BUILD_A2, 'teacher-back.png', 'teacher-back-alt-hlogo.png'),
    (BUILD_A2, 'teacher-cover.pdf', 'teacher-cover-alt-hlogo.pdf'),
    (BUILD_A2, 'build-report.json', 'build-report-alt-hlogo.json'),
    (BUILD_A2, PDFX_NAME, PDFX_A2_NAME),
]

# The 4 old print files of the folder: Task 2.9 part 1. They must keep their values.
GUARDS = [
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf',
     '920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d'),
    ('teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate_PDFX-1a.pdf',
     'd2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf',
     '8ae118b644765eaeab537b503cab76bc7bb573d9dae6d3b4ed567c465dc5d6fa'),
    ('teacher-candidate/'
     'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf',
     '665c044f6e828e618fc4c488564d26c6e63ddaf3d61432b3dba8aebd7596bf1a'),
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    """Runs the 10 copies and the guard."""
    if os.path.exists(TEACHER):
        print('TEACHER_FOLDER_EXISTS ' + TEACHER)
        return 1
    os.makedirs(TEACHER)
    pairs = 0
    for source_dir, source_name, target_name in COPIES:
        source = os.path.join(source_dir, source_name)
        target = os.path.join(TEACHER, target_name)
        if not os.path.exists(source):
            print('SOURCE_MISSING ' + source)
            return 1
        shutil.copyfile(source, target)
        source_sha = sha256(source)
        target_sha = sha256(target)
        equal = source_sha == target_sha
        pairs += 1 if equal else 0
        print('COPY %s -> %s bytes=%d sha256=%s pair_equal=%s'
              % (source_name, target_name, os.path.getsize(target), target_sha, str(equal).lower()))
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
    print('TEACHER_FILES_BEFORE_README %d' % len(os.listdir(TEACHER)))
    return 0 if pairs == len(COPIES) and guard_ok == len(GUARDS) else 1


if __name__ == '__main__':
    raise SystemExit(main())
