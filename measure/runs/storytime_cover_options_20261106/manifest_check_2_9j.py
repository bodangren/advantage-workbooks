#!/usr/bin/env python3
"""Rewrites and checks the MANIFEST.txt of the hand-off folder (Task 2.9 part 10).

Track storytime_cover_options_20261106. The manifest writer is
`measure/tracks/storytime_cover_options_20261106/options/manifest.py`, the same call as
`manifest_check_2_9g.py`.

Steps:
1. It saves the old MANIFEST.txt (114 lines, the part 9 file) as `manifest-old-2-9j.txt` in this
   folder. It asserts that the old file holds the SHA-256
   `1ff3dfd361c66ee2e334826cd0da489adff137cdee85f00ddaa8d7b3ddc0a384`.
2. It runs the writer on the folder. It also runs the writer with `--check`.
3. It checks: every new line holds the form `<sha256>  <bytes>  <path>` and matches the file on
   disk; every file of the folder except MANIFEST.txt has exactly one line; the line count is 131;
   exactly 88 lines are byte-equal to the old file (the 60 lines of part 9, the 17 r4 lines
   of part 9, and 11 A3 reader cover PNGs that the F3 to F6 fixes leave byte-identical); exactly 26 lines changed, and their names are the 3 sheets, the 4 reader PDFs, the 2 reader
   build reports, the 14 leaf cover PNGs, and the 3 A3 cover PNGs of w01-2, w07-1, and w07-2;
   exactly 17 lines are new, and their names are the 10 r5 book files, the 2 new sheets, and the
   5 files of `reader-back-r5/`.
4. It checks that the 2 r2 print files of Daniel's pick keep their old line byte-equal.
5. It builds a 2-column projection of the new lines in `/tmp/opencode/c29j/manifest-2col.txt` and
   runs `sha256sum -c` on it. Reason: `sha256sum` reads 2 columns, and this manifest holds 3. Every
   line must print OK.
6. It prints the line count, the changed names, and the SHA-256 of the new MANIFEST.txt.

Usage: python3 -I -B manifest_check_2_9j.py <hand-off folder>
"""

import hashlib
import os
import subprocess
import sys

REPO = '/home/daniebo/Desktop/Workbooks'
RUNS = os.path.join(REPO, 'measure/runs/storytime_cover_options_20261106')
WRITER = os.path.join(REPO, 'measure/tracks/storytime_cover_options_20261106/options/manifest.py')
OLD_COPY = os.path.join(RUNS, 'manifest-old-2-9j.txt')
PROJECTION = '/tmp/opencode/c29j/manifest-2col.txt'
OLD_SHA = '1ff3dfd361c66ee2e334826cd0da489adff137cdee85f00ddaa8d7b3ddc0a384'
OLD_LINES_EXPECTED = 114
EXPECTED_LINES = 131
EXPECTED_CHANGED = 26
EXPECTED_UNCHANGED = 88
EXPECTED_NEW = 17

READER_FOLDERS = ['readers-a3', 'readers-leaf']
SHEETS = ['contact-sheets/readers-a3.png', 'contact-sheets/readers-leaf.png',
          'contact-sheets/all.png']
NEW_NAMES = [
    'student/front-alt-hlogo-r5.png',
    'student/back-alt-hlogo-r5.png',
    'student/cover-alt-hlogo-r5.pdf',
    'student/build-report-alt-hlogo-r5.json',
    'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r5_PDFX-1a.pdf',
    'teacher/teacher-front-alt-hlogo-r5.png',
    'teacher/teacher-back-alt-hlogo-r5.png',
    'teacher/teacher-cover-alt-hlogo-r5.pdf',
    'teacher/build-report-alt-hlogo-r5.json',
    'teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r5_PDFX-1a.pdf',
    'contact-sheets/student-alt-hlogo-r5.png',
    'contact-sheets/teacher-alt-hlogo-r5.png',
    'reader-back-r5/Storytime-Advantage-L2-Readers-W01-v1_PDFX-1a.pdf',
    'reader-back-r5/Storytime-Advantage-L2-W01-hello-A3-v1.pdf',
    'reader-back-r5/Storytime-Advantage-L2-W01-nan-can-nod-A3-v1.pdf',
    'reader-back-r5/l2-w01-hello-a3-page12.png',
    'reader-back-r5/l2-w01-nan-can-nod-leaf-page12.png',
]
IDENTICAL_A3 = [
    "readers-a3/l2-w01-hello-a3-cover.png",
    "readers-a3/l2-w02-can-i-a3-cover.png",
    "readers-a3/l2-w02-how-many-a3-cover.png",
    "readers-a3/l2-w03-paint-a3-cover.png",
    "readers-a3/l2-w03-the-pan-a3-cover.png",
    "readers-a3/l2-w04-my-family-a3-cover.png",
    "readers-a3/l2-w04-pam-a3-cover.png",
    "readers-a3/l2-w05-i-have-two-a3-cover.png",
    "readers-a3/l2-w05-sam-and-pam-a3-cover.png",
    "readers-a3/l2-w06-i-can-see-a3-cover.png",
    "readers-a3/l2-w06-tap-tap-a3-cover.png",
]
PICK = [
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


def read_rows(path):
    """Returns the manifest as a dict of the relative name and its `<sha>  <bytes>` prefix."""
    rows = {}
    with open(path, encoding='utf-8') as handle:
        for line in handle.read().splitlines():
            parts = line.split('  ')
            if len(parts) != 3:
                continue
            rows[parts[2]] = (parts[0], parts[1])
    return rows


def main(argv):
    """Runs the 6 steps and prints the counts."""
    root = os.path.abspath(argv[0])
    manifest = os.path.join(root, 'MANIFEST.txt')
    old_digest = sha256(manifest)
    print('OLD_MANIFEST_SHA256 ' + old_digest)
    print('OLD_MANIFEST_SHA_EXPECTED ' + str(old_digest == OLD_SHA).lower())
    if old_digest != OLD_SHA:
        print('MANIFEST_OK false')
        return 1
    with open(manifest, 'rb') as source, open(OLD_COPY, 'wb') as handle:
        handle.write(source.read())
    print('OLD_COPY %s bytes=%d' % (OLD_COPY, os.path.getsize(OLD_COPY)))

    done = subprocess.run(['python3', '-I', '-B', WRITER, root], capture_output=True, text=True)
    print('WRITER_EXIT %d: %s' % (done.returncode, done.stdout.strip()))
    check = subprocess.run(['python3', '-I', '-B', WRITER, root, '--check'],
                           capture_output=True, text=True)
    print('WRITER_CHECK_EXIT %d: %s' % (check.returncode, check.stdout.strip()))

    new_lines = open(manifest, encoding='utf-8').read().splitlines()
    old_lines = open(OLD_COPY, encoding='utf-8').read().splitlines()

    old_in_new = sum(1 for line in old_lines if line in new_lines)
    print('OLD_LINES %d' % len(old_lines))
    print('OLD_LINES_IN_NEW %d' % old_in_new)

    matched = 0
    bad = []
    listed = set()
    for line in new_lines:
        parts = line.split('  ')
        if len(parts) != 3:
            bad.append('FORM ' + line)
            continue
        digest, size_text, rel = parts
        listed.add(rel)
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            bad.append('MISSING ' + rel)
            continue
        if sha256(path) != digest or str(os.path.getsize(path)) != size_text:
            bad.append('MISMATCH ' + rel)
            continue
        matched += 1
    print('LINES_MATCHED %d' % matched)
    print('LINES_BAD %d' % len(bad))
    for item in bad:
        print('BAD ' + item)

    files = set()
    for base, _, names in os.walk(root):
        for name in names:
            rel = os.path.relpath(os.path.join(base, name), root)
            if rel == 'MANIFEST.txt':
                continue
            files.add(rel)
    print('FILES %d' % len(files))
    print('FILES_NOT_LISTED %d' % len(files - listed))
    print('LINES_NOT_ON_DISK %d' % len(listed - files))
    print('OLD_LINE_COUNT_EXPECTED %s' % str(len(old_lines) == OLD_LINES_EXPECTED).lower())
    print('NEW_LINE_COUNT %d' % len(new_lines))
    print('NEW_LINE_COUNT_EXPECTED %s' % str(len(new_lines) == EXPECTED_LINES).lower())

    # The 26 replaced names, the 88 unchanged names, and the 17 new names.
    old_rows = read_rows(OLD_COPY)
    new_rows = read_rows(manifest)
    changed, added = set(), set()
    unchanged = 0
    for rel, value in new_rows.items():
        if rel in old_rows and old_rows[rel] == value:
            unchanged += 1
        elif rel in old_rows:
            changed.add(rel)
        else:
            added.add(rel)
    planned = set()
    for folder in READER_FOLDERS:
        source_dir = os.path.join(root, folder)
        for entry in os.listdir(source_dir):
            planned.add(folder + '/' + entry)
    for rel in SHEETS:
        planned.add(rel)
    print('UNCHANGED_LINES %d' % unchanged)
    print('UNCHANGED_LINES_EXPECTED %s' % str(unchanged == EXPECTED_UNCHANGED).lower())
    print('CHANGED_LINES %d' % len(changed))
    print('CHANGED_LINES_EXPECTED %s' % str(len(changed) == EXPECTED_CHANGED).lower())
    print('CHANGED_SUBSET_OF_PLANNED %s' % str(changed <= planned).lower())
    print('PLANNED_UNCHANGED_MATCH %s' % str((planned - changed) == set(IDENTICAL_A3)).lower())
    print('NEW_LINES %d' % len(added))
    print('NEW_LINES_EXPECTED %s' % str(len(added) == EXPECTED_NEW).lower())
    print('NEW_NAMES_MATCH_PLANNED %s' % str(added == set(NEW_NAMES)).lower())
    for rel in sorted(changed):
        print('CHANGED %s old=%s new=%s' % (rel, old_rows.get(rel, ('missing',))[0],
                                            new_rows[rel][0]))
    for rel in sorted(added):
        print('ADDED %s new=%s' % (rel, new_rows[rel][0]))

    # The 2 r2 print files of Daniel's pick keep their old line byte-equal.
    pick_ok = 0
    for rel, expected in PICK:
        value = new_rows.get(rel)
        line = '%s  %s  %s' % (value[0], value[1], rel) if value else ''
        same = value is not None and value[0] == expected and line in old_lines
        pick_ok += 1 if same else 0
        print('PICK_LINE %s sha256=%s expected=%s byte_equal=%s'
              % (rel, value[0] if value else 'missing', expected, str(same).lower()))
    print('PICK_LINES_EQUAL %d' % pick_ok)

    # sha256sum -c on the 2-column projection.
    os.makedirs(os.path.dirname(PROJECTION), exist_ok=True)
    with open(PROJECTION, 'w', encoding='utf-8') as handle:
        for line in new_lines:
            digest, _size, rel = line.split('  ')
            handle.write('%s  %s\n' % (digest, rel))
    sum_check = subprocess.run(['sha256sum', '-c', PROJECTION], cwd=root,
                               capture_output=True, text=True)
    ok_lines = sum(1 for item in sum_check.stdout.splitlines() if item.endswith(': OK'))
    failed_lines = sum(1 for item in sum_check.stdout.splitlines() if item.endswith(': FAILED'))
    print('SHA256SUM_C_EXIT %d' % sum_check.returncode)
    print('SHA256SUM_C_OK_LINES %d' % ok_lines)
    print('SHA256SUM_C_FAILED_LINES %d' % failed_lines)
    print('SHA256SUM_C_OK_EXPECTED %s' % str(ok_lines == EXPECTED_LINES).lower())

    print('MANIFEST_SHA256 ' + sha256(manifest))
    print('MANIFEST_BYTES %d' % os.path.getsize(manifest))
    ok = (done.returncode == 0 and check.returncode == 0
          and old_in_new == EXPECTED_UNCHANGED
          and len(old_lines) == OLD_LINES_EXPECTED and matched == len(new_lines)
          and not bad and files == listed and len(new_lines) == len(files)
          and len(new_lines) == EXPECTED_LINES and unchanged == EXPECTED_UNCHANGED
          and len(changed) == EXPECTED_CHANGED and changed <= planned
          and (planned - changed) == set(IDENTICAL_A3)
          and len(added) == EXPECTED_NEW and added == set(NEW_NAMES)
          and pick_ok == len(PICK) and sum_check.returncode == 0
          and ok_lines == EXPECTED_LINES and failed_lines == 0)
    print('MANIFEST_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
