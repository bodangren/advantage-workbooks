#!/usr/bin/env python3
"""Hard links the student front and the 28 reader art files into the scratch pictures folder.

Task 2.9 part 3 A2 r2, track storytime_cover_options_20261106. This script follows
`link_pictures_2_9b.py` of part 2, with only the scratch root changed.

The names come from `planQuestBuild` of `dashboard/scripts/storytime/make-storytime-quest-covers.ts`
(capture `plan-names-2-9b.txt`): the student front and the 28 reader art files.

Hard rules:
- It never links the back art. A name that holds "back" stops the run. Reason: the edge-fill script
  once wrote through a link into the shipped back art of the A2 round.
- It links nothing else, so the pictures folder holds 31 files when the back and the teacher front
  are added by their own scripts.
- It prints counts and SHA-256 and inode pairs only. It opens no picture.

Usage: python3 -I -B link_pictures_2_9c.py
"""

import hashlib
import os

REPO = '/home/daniebo/Desktop/Workbooks'
SOURCE_DIR = os.path.join(REPO, 'content/storytime/l2/print/pictures')
TARGET_DIR = '/tmp/opencode/c29c/pictures'

STUDENT_FRONT = 'l2-u1-cover-quest-student-front-v1-300ppi.png'
STUDENT_FRONT_SHA = '9087de2811caed07c6f3c7c75a0fffe4a52f7e99b03b1fbd094e5b55ebe3881f'

PICTURES = [
    'l2-w01-cover-hello-v1.png',
    'l2-w01-cover-hello-line-v1.png',
    'l2-w01-cover-nan-can-nod-v1.png',
    'l2-w01-cover-nan-can-nod-line-v1.png',
    'l2-w02-cover-how-many-v1.png',
    'l2-w02-cover-how-many-line-v1.png',
    'l2-w02-cover-can-i-v1.png',
    'l2-w02-cover-can-i-line-v1.png',
    'l2-w03-cover-paint-v1.png',
    'l2-w03-cover-paint-line-v1.png',
    'l2-w03-cover-the-pan-v1.png',
    'l2-w03-cover-the-pan-line-v1.png',
    'l2-w04-cover-my-family-v1.png',
    'l2-w04-cover-my-family-line-v1.png',
    'l2-w04-cover-pam-v1.png',
    'l2-w04-cover-pam-line-v1.png',
    'l2-w05-cover-i-have-two-v1.png',
    'l2-w05-cover-i-have-two-line-v1.png',
    'l2-w05-cover-sam-and-pam-v1.png',
    'l2-w05-cover-sam-and-pam-line-v1.png',
    'l2-w06-cover-i-can-see-v1.png',
    'l2-w06-cover-i-can-see-line-v1.png',
    'l2-w06-cover-tap-tap-v1.png',
    'l2-w06-cover-tap-tap-line-v1.png',
    'l2-w07-cover-is-it-a-ball-v1.png',
    'l2-w07-cover-is-it-a-ball-line-v1.png',
    'l2-w07-cover-the-top-v1.png',
    'l2-w07-cover-the-top-line-v1.png',
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    """Links the 29 files and prints the pairs."""
    names = [STUDENT_FRONT] + PICTURES
    if len(PICTURES) != 28:
        print('PICTURE_NAME_COUNT %d FAIL' % len(PICTURES))
        return 1
    for name in names:
        if 'back' in name:
            print('REFUSED_BACK_NAME ' + name)
            return 1

    os.makedirs(TARGET_DIR, exist_ok=True)
    sha_ok = inode_ok = 0
    for name in names:
        source = os.path.join(SOURCE_DIR, name)
        target = os.path.join(TARGET_DIR, name)
        if os.path.exists(target) or os.path.islink(target):
            print('TARGET_EXISTS ' + name)
            return 1
        if not os.path.exists(source):
            print('SOURCE_MISSING ' + name)
            return 1
        os.link(source, target)
        same_sha = sha256(source) == sha256(target)
        same_inode = os.stat(source).st_ino == os.stat(target).st_ino
        sha_ok += 1 if same_sha else 0
        inode_ok += 1 if same_inode else 0
        print('LINK %s sha_equal=%s inode_equal=%s inode=%d'
              % (name, str(same_sha).lower(), str(same_inode).lower(), os.stat(target).st_ino))

    print('LINKS %d' % len(names))
    print('SHA_PAIRS_EQUAL %d' % sha_ok)
    print('INODE_PAIRS_EQUAL %d' % inode_ok)
    front_sha = sha256(os.path.join(TARGET_DIR, STUDENT_FRONT))
    print('STUDENT_FRONT_SHA256 ' + front_sha)
    print('STUDENT_FRONT_SHA_EXPECTED ' + str(front_sha == STUDENT_FRONT_SHA).lower())
    files = sorted(os.listdir(TARGET_DIR))
    print('PICTURES_DIR_FILES %d' % len(files))
    return 0 if sha_ok == len(names) and inode_ok == len(names) else 1


if __name__ == '__main__':
    raise SystemExit(main())
