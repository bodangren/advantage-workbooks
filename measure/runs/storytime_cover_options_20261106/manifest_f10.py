#!/usr/bin/env python3
"""Writes MANIFEST.txt of the r6 folder (Task (Green, F10), step 9, D-F10-11).

Track storytime_cover_options_20261106. One line for each file of
`~/Desktop/print-ready/storytime/covers-quest-v1-books-r6/`, in the form of `covers-quest-v1`:
the SHA-256, 2 spaces, the size in bytes, 2 spaces, and the relative path. The names are relative,
with no `..` and no absolute path, the lines are sorted by path, and the manifest does not list
itself. The script refuses a manifest that exists, and it stops when the folder holds a file other
than the 11 files of D-F10-11.

Usage: python3 -I -B manifest_f10.py
"""

import hashlib
import os

OUT = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1-books-r6')
MANIFEST = os.path.join(OUT, 'MANIFEST.txt')

EXPECTED = sorted([
    'contact-sheets/books-r6.png',
    'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r6_PDFX-1a.pdf',
    'student/back-alt-hlogo-r6.png',
    'student/build-report-alt-hlogo-r6.json',
    'student/cover-alt-hlogo-r6.pdf',
    'student/front-alt-hlogo-r6.png',
    'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r6_PDFX-1a.pdf',
    'teacher/build-report-alt-hlogo-r6.json',
    'teacher/teacher-back-alt-hlogo-r6.png',
    'teacher/teacher-cover-alt-hlogo-r6.pdf',
    'teacher/teacher-front-alt-hlogo-r6.png',
])


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    """Lists the files, checks the set, and writes the manifest."""
    if os.path.exists(MANIFEST):
        print('MANIFEST_EXISTS ' + MANIFEST)
        return 1
    found = sorted(os.path.relpath(os.path.join(base, name), OUT)
                   for base, _, names in os.walk(OUT) for name in names)
    if found != EXPECTED:
        print('FILE_SET_DIFFERS extra=%s missing=%s'
              % (sorted(set(found) - set(EXPECTED)), sorted(set(EXPECTED) - set(found))))
        return 1
    rows = ['%s  %d  %s' % (sha256(os.path.join(OUT, rel)), os.path.getsize(os.path.join(OUT, rel)), rel)
            for rel in found]
    with open(MANIFEST, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(rows) + '\n')
    print('\n'.join(rows))
    print('MANIFEST_LINES %d' % len(rows))
    print('MANIFEST_SHA256 ' + sha256(MANIFEST))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
