#!/usr/bin/env python3
"""Compares the scratch build of part 11 with the hand-off MANIFEST (Task 2.9 part 11 step 3c).

Track storytime_cover_options_20261106. The build of part 11 wrote 44 files into
`/tmp/opencode/c29k/pr/storytime/covers-quest-v1/`. F7 changes the art of one cover only: the week 1
"hello" A3 reader cover. This script reads the SHA-256 values of the hand-off `MANIFEST.txt` (the
part 10 file, SHA-256 `f8c0377e...`) and compares them with the build:

- the 13 other A3 reader cover PNGs must be byte-equal;
- the 14 leaf reader cover PNGs must be byte-equal;
- the 4 r5 book PNGs must be byte-equal (the build names `student/front.png`, `student/back.png`,
  `teacher/teacher-front.png`, and `teacher/teacher-back.png`; the hand-off names hold the
  `-alt-hlogo-r5` block, as in `copy_2_9j.py`);
- the A3 reader cover PNG of w01-1 "hello" must differ.

It reads files and prints one line per pair, the 4 counts, and the verdict. It writes nothing. It
exits 1 when any PNG other than the w01-1 A3 cover differs, or when the w01-1 A3 cover is equal.

Usage: python3 -I -B compare_2_9k.py
"""

import hashlib
import os

BUILD = '/tmp/opencode/c29k/pr/storytime/covers-quest-v1'
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')
MANIFEST_SHA = 'f8c0377ec34f333f062bb96800f51e206f4d075b8f10241b3435126cf2ccec41'

READER_STEMS = [
    'l2-w01-hello', 'l2-w01-nan-can-nod',
    'l2-w02-how-many', 'l2-w02-can-i',
    'l2-w03-paint', 'l2-w03-the-pan',
    'l2-w04-my-family', 'l2-w04-pam',
    'l2-w05-i-have-two', 'l2-w05-sam-and-pam',
    'l2-w06-i-can-see', 'l2-w06-tap-tap',
    'l2-w07-is-it-a-ball', 'l2-w07-the-top',
]
CHANGED_STEM = 'l2-w01-hello'

BOOK_PNGS = [
    ('student/front.png', 'student/front-alt-hlogo-r5.png'),
    ('student/back.png', 'student/back-alt-hlogo-r5.png'),
    ('teacher/teacher-front.png', 'teacher/teacher-front-alt-hlogo-r5.png'),
    ('teacher/teacher-back.png', 'teacher/teacher-back-alt-hlogo-r5.png'),
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
    """Compares the pairs and prints the counts."""
    manifest_sha = sha256(MANIFEST)
    print('MANIFEST_SHA256 ' + manifest_sha)
    print('MANIFEST_SHA_EXPECTED ' + str(manifest_sha == MANIFEST_SHA).lower())
    if manifest_sha != MANIFEST_SHA:
        return 1
    rows = read_manifest(MANIFEST)

    a3_equal = leaf_equal = book_equal = 0
    hello_differs = False
    differing_other = []
    for stem in READER_STEMS:
        rel = 'readers-a3/%s-a3-cover.png' % stem
        built = sha256(os.path.join(BUILD, rel))
        disk = sha256(os.path.join(HANDOFF, rel))
        equal = built == rows[rel]
        print('CMP_A3 %s build=%s manifest=%s disk_equals_manifest=%s equal=%s'
              % (rel, built, rows[rel], str(disk == rows[rel]).lower(), str(equal).lower()))
        if stem == CHANGED_STEM:
            hello_differs = not equal
        else:
            a3_equal += 1 if equal else 0
            if not equal:
                differing_other.append(rel)
    for stem in READER_STEMS:
        rel = 'readers-leaf/%s-leaf-cover.png' % stem
        built = sha256(os.path.join(BUILD, rel))
        equal = built == rows[rel]
        print('CMP_LEAF %s build=%s manifest=%s equal=%s'
              % (rel, built, rows[rel], str(equal).lower()))
        leaf_equal += 1 if equal else 0
        if not equal:
            differing_other.append(rel)
    for built_rel, hand_rel in BOOK_PNGS:
        built = sha256(os.path.join(BUILD, built_rel))
        equal = built == rows[hand_rel]
        print('CMP_BOOK %s vs %s build=%s manifest=%s equal=%s'
              % (built_rel, hand_rel, built, rows[hand_rel], str(equal).lower()))
        book_equal += 1 if equal else 0
        if not equal:
            differing_other.append(hand_rel)

    print('A3_OTHER_EQUAL %d of 13' % a3_equal)
    print('LEAF_EQUAL %d of 14' % leaf_equal)
    print('BOOK_EQUAL %d of 4' % book_equal)
    print('HELLO_A3_DIFFERS %s' % str(hello_differs).lower())
    for rel in differing_other:
        print('DIFFERS_UNEXPECTED ' + rel)
    ok = a3_equal == 13 and leaf_equal == 14 and book_equal == 4 and hello_differs
    print('COMPARE_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
