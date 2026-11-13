#!/usr/bin/env python3
"""Replaces the 2 A3 reader back files of the hand-off folder (Task 2.9 part 12 step 5).

Track storytime_cover_options_20261106. The build of part 12 wrote the 2 A3 reader back files, with
the F7 edge-filled art on page 1, into `/tmp/opencode/c29l/reader-back/` (made through a scratch
folder of the print folder, because `make-readers-pdf.ts` accepts no other output folder). This
script replaces the 2 A3 files in `~/Desktop/print-ready/storytime/covers-quest-v1/reader-back-r5/`
and renders page 12 of the hello file again.

Hard rules:
- It reads the old SHA-256 of each target from `MANIFEST.txt` (the part 10 file, SHA-256
  `f8c0377e...`) and asserts that the file on disk holds that value before the write.
- It uses `shutil.copyfile` and proves each pair equal. It never makes a hard link and it never
  deletes a file. It copies no other file: the workbook file stays as it is.
- It renders page 12 of the new hand-off hello file at 300 ppi into the scratch folder
  `/tmp/opencode/c29l/page12-final/`, and replaces `l2-w01-hello-a3-page12.png` with the render
  after the same old-SHA guard. It prints whether the render is byte-equal to the old PNG.

Usage: python3 -I -B copy_back_2_9l.py

It prints counts and SHA-256 values only. It shows no picture.
"""

import hashlib
import os
import shutil
import subprocess

SOURCE = '/tmp/opencode/c29l/reader-back'
SCRATCH = '/tmp/opencode/c29l/page12-final'
HANDOFF = os.path.join(os.path.expanduser('~'), 'Desktop/print-ready/storytime/covers-quest-v1')
MANIFEST = os.path.join(HANDOFF, 'MANIFEST.txt')
MANIFEST_SHA = '288d84782a6dfa0faaf60c95b83e3006094691be7d181a5eb75291a2a54f994b'

A3_FILES = [
    'Storytime-Advantage-L2-W01-hello-A3-v1.pdf',
    'Storytime-Advantage-L2-W01-nan-can-nod-A3-v1.pdf',
]
HELLO_PNG = 'l2-w01-hello-a3-page12.png'
OLD_HELLO_PNG_SHA = '15e56a3fec114c19fc4189c3222850a045aab29c38637ee49fd6a412cacce667'
PAGE = 12
RENDER_PPI = 300

# D-P12-1: page 1 of each new A3 file at 300 ppi, written as a new name in reader-back-r5/.
PAGE1_PNGS = [
    (A3_FILES[0], 'l2-w01-hello-a3-page1.png'),
    (A3_FILES[1], 'l2-w01-nan-can-nod-a3-page1.png'),
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


def guarded_replace(rel, source):
    """Checks the old SHA-256 of one target against the MANIFEST, copies, and prints the pair."""
    target = os.path.join(HANDOFF, rel)
    if rel not in OLD_ROWS:
        print('NOT_IN_MANIFEST ' + rel)
        return None
    if not os.path.exists(target):
        print('TARGET_MISSING ' + rel)
        return None
    old_sha = sha256(target)
    if old_sha != OLD_ROWS[rel]:
        print('OLD_SHA_MISMATCH %s manifest=%s disk=%s' % (rel, OLD_ROWS[rel], old_sha))
        return None
    shutil.copyfile(source, target)
    new_sha = sha256(target)
    equal = new_sha == sha256(source)
    print('REPLACE %s old=%s new=%s pair_equal=%s' % (rel, old_sha, new_sha, str(equal).lower()))
    return old_sha, new_sha, equal


OLD_ROWS = {}


def main():
    """Replaces the 2 A3 files, renders page 12 of the hello file, and replaces its PNG."""
    manifest_sha = sha256(MANIFEST)
    print('MANIFEST_SHA256 ' + manifest_sha)
    print('MANIFEST_SHA_EXPECTED ' + str(manifest_sha == MANIFEST_SHA).lower())
    if manifest_sha != MANIFEST_SHA:
        return 1
    OLD_ROWS.update(read_manifest(MANIFEST))
    print('OLD_HELLO_PNG_EXPECTED %s' % str(OLD_ROWS['reader-back-r5/' + HELLO_PNG]
                                           == OLD_HELLO_PNG_SHA).lower())

    replaced = pairs = 0
    for name in A3_FILES:
        result = guarded_replace('reader-back-r5/' + name, os.path.join(SOURCE, name))
        if result is None:
            return 1
        replaced += 1
        pairs += 1 if result[2] else 0
    print('REPLACED_PDFS %d' % replaced)
    print('PAIR_EQUAL_PDFS %d' % pairs)

    os.makedirs(SCRATCH, exist_ok=True)
    render = os.path.join(SCRATCH, HELLO_PNG)
    if os.path.exists(render):
        print('TARGET_EXISTS ' + render)
        return 1
    done = subprocess.run(['pdftoppm', '-f', str(PAGE), '-l', str(PAGE), '-r', str(RENDER_PPI),
                           '-png', '-singlefile',
                           os.path.join(HANDOFF, 'reader-back-r5', A3_FILES[0]), render[:-4]],
                          capture_output=True, text=True)
    print('RENDER_EXIT %d' % done.returncode)
    if done.returncode != 0:
        return 1
    render_sha = sha256(render)
    print('RENDER_SHA256 ' + render_sha)
    print('RENDER_EQUALS_OLD_PNG %s' % str(render_sha == OLD_HELLO_PNG_SHA).lower())
    result = guarded_replace('reader-back-r5/' + HELLO_PNG, render)
    if result is None:
        return 1
    page1_ok = True
    for pdf_name, png_name in PAGE1_PNGS:
        target = os.path.join(HANDOFF, 'reader-back-r5', png_name)
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1
        done = subprocess.run(['pdftoppm', '-f', '1', '-l', '1', '-r', str(RENDER_PPI),
                               '-png', '-singlefile',
                               os.path.join(HANDOFF, 'reader-back-r5', pdf_name), target[:-4]],
                              capture_output=True, text=True)
        print('PAGE1_RENDER_EXIT %s %d' % (png_name, done.returncode))
        if done.returncode != 0:
            return 1
        print('PAGE1_PNG %s sha256=%s bytes=%d' % (png_name, sha256(target), os.path.getsize(target)))
        page1_ok = page1_ok and os.path.exists(target)
    ok = replaced == 2 and pairs == 2 and result[2] and page1_ok
    print('COPY_BACK_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
