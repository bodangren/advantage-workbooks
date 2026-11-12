#!/usr/bin/env python3
"""Copies the 10 r5 book cover files of the build into the hand-off folder (Task 2.9 part 10).

Track storytime_cover_options_20261106.

From the r5 build of `/tmp/opencode/c29j/pr/storytime/covers-quest-v1/`:
- from `student/`: front.png, back.png, cover.pdf, build-report.json, and the PDF/X file;
- from `teacher/`: teacher-front.png, teacher-back.png, teacher-cover.pdf, build-report.json, and
  the PDF/X file.
The 9 picture, Chrome PDF, and report files get the `-alt-hlogo-r5` name; the 2 PDF/X files get the
`-alt-hlogo-r5` block before `_PDFX-1a`.

This script follows `copy_2_9i.py` of part 9, with the r5 names and the new build folder. It writes
no README, because the brief of part 10 names the 10 book files only. It also prints one information
line per back page: whether the r5 back PNG equals its r4 back PNG.

Every copy is a byte copy. The script proves each SHA-256 pair equal and prints the values. It stops
when a target file already exists, when a source file is missing, or when a guard file changed. The
guard files are the 10 pinned print files of the folder (the 6 files of part 1, part 2, and part 3,
the 2 r2 print files of Daniel's pick, and the 2 r3 print files of part 7) plus the 10 r4 book files
of part 9. So the r2, the r3, the r4, the plain r5 (no suffix), and the old `-alt-hlogo` files stay
byte-equal.

Usage: python3 -I -B copy_2_9j.py
"""

import hashlib
import os
import shutil

HANDOFF = '/home/daniebo/Desktop/print-ready/storytime/covers-quest-v1'
BUILD = '/tmp/opencode/c29j/pr/storytime/covers-quest-v1'

STUDENT_PDFX = 'Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf'
TEACHER_PDFX = 'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf'

COPIES = [
    ('student', 'front.png', 'student/front-alt-hlogo-r5.png'),
    ('student', 'back.png', 'student/back-alt-hlogo-r5.png'),
    ('student', 'cover.pdf', 'student/cover-alt-hlogo-r5.pdf'),
    ('student', 'build-report.json', 'student/build-report-alt-hlogo-r5.json'),
    ('student', STUDENT_PDFX,
     'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r5_PDFX-1a.pdf'),
    ('teacher', 'teacher-front.png', 'teacher/teacher-front-alt-hlogo-r5.png'),
    ('teacher', 'teacher-back.png', 'teacher/teacher-back-alt-hlogo-r5.png'),
    ('teacher', 'teacher-cover.pdf', 'teacher/teacher-cover-alt-hlogo-r5.pdf'),
    ('teacher', 'build-report.json', 'teacher/build-report-alt-hlogo-r5.json'),
    ('teacher', TEACHER_PDFX,
     'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r5_PDFX-1a.pdf'),
]

# The 10 pinned print files of the folder keep their SHA-256 values, and so do the 10 r4 book files
# of part 9.
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
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r3_PDFX-1a.pdf',
     'ba7b9f17583d560cf4bfb4e69a78f598f39eaf74a78865a57cbdebe47a23a066'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r3_PDFX-1a.pdf',
     '46f27572dc935b0db1bfec4efaa0f66bad74c906f817ac3311bb360a85fcb01c'),
    ('student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r4_PDFX-1a.pdf',
     '21528918237081a70cad8546af239f53397ad3a713af94dcd1bc1f154faa2c27'),
    ('student/back-alt-hlogo-r4.png',
     '9f5b588fa6f6b968b55c1f7c33abdff03f90cf513cd823ea940a645a829b20b3'),
    ('student/build-report-alt-hlogo-r4.json',
     '391f9019feefec5bea643e128091b133bc1045c609160863f1861dbdae169a12'),
    ('student/cover-alt-hlogo-r4.pdf',
     '680454b26f10f8a01a7570ef5f391a7ae90a5c19ba2642806bd032484ed0796e'),
    ('student/front-alt-hlogo-r4.png',
     '6750339526f85e6fbcddb3de8ad93d9b43258b4b943cea4092528babb437d795'),
    ('teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r4_PDFX-1a.pdf',
     '01dd6ea964f59cf65bce019279a44c966188b024a9cbdf0feb231426881fe8b9'),
    ('teacher/build-report-alt-hlogo-r4.json',
     '833249e23ae62e6a43a62ef7daca2fed8e8ca2bb1c5d6243a9908725e440f144'),
    ('teacher/teacher-back-alt-hlogo-r4.png',
     'ad6c3335e4e92ae43eae1d86e50b2a8c4175bc7cbc9eecb23bc83aeb6e13b0a4'),
    ('teacher/teacher-cover-alt-hlogo-r4.pdf',
     '936d20034e71fe74f427a9969a5952de23713d64b0ad48709aec31ca3f60a40f'),
    ('teacher/teacher-front-alt-hlogo-r4.png',
     '6a0d5227a074b9af9ca8822cc62afa3cdfe4d52d8819df43dfdb5fc5e2fe5f3b'),
]

# The 2 back pages of this build and the r4 back pages of part 9 (information only).
BACK_PAIRS = [
    ('student/back-alt-hlogo-r5.png', 'student/back-alt-hlogo-r4.png'),
    ('teacher/teacher-back-alt-hlogo-r5.png', 'teacher/teacher-back-alt-hlogo-r4.png'),
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

    for rel_new, rel_old in BACK_PAIRS:
        new_path = os.path.join(HANDOFF, rel_new)
        old_path = os.path.join(HANDOFF, rel_old)
        new_sha = sha256(new_path)
        old_sha = sha256(old_path)
        print('INFO_BACK_R5_VS_R4 %s vs %s equal=%s r5_sha256=%s r4_sha256=%s'
              % (rel_new, rel_old, str(new_sha == old_sha).lower(), new_sha, old_sha))
    return 0 if pairs == len(COPIES) and guard_ok == len(GUARDS) else 1


if __name__ == '__main__':
    raise SystemExit(main())
