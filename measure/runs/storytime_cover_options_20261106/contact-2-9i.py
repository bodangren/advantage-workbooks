"""The 5 contact sheets of the Task 2.9 part 9 covers (track storytime_cover_options_20261106).

Model: `measure/runs/storytime_cover_options_20261106/contact-2-9g.py`, the same font, the same gap,
the same heading, the same file name under each tile, and the same panel sources. The panels come
from the hand-off folder, so the 14 A3 tiles and the 14 leaf tiles show the new art of this round.

Two groups of sheets in the scratch folder `/tmp/opencode/c29i/sheets/`:

The 3 replaced sheets (the form of `contact-2-9g.py`):
  readers-a3.png: the 14 A3 reader cover pages, 7 columns and 2 rows.
  readers-leaf.png: the 14 leaf reader cover pages, the same grid and the same order.
  all.png: the 32 pages of this build in one sheet, 4 columns and 8 rows: the 4 r4 book pages
  (student front, student back, teacher front, teacher back), then the 14 A3 pages, then the 14 leaf
  pages.
Each sheet then replaces its target in the hand-off folder. Before each write the script reads the
old SHA-256 of the target from `MANIFEST.txt` and asserts that the file on disk holds that value.

The 2 new sheets (the form of `contact-2-9c.py`):
  student-alt-hlogo-r4.png: the r4 student front and back side by side, each 1400 px high.
  teacher-alt-hlogo-r4.png: the r4 teacher front and back the same way.
The script refuses to write a target that exists. It copies no other file, and it is create-only for
the scratch folder.

Usage: python3 -I -B contact-2-9i.py <hand-off folder>

The script prints only the paths, the sizes, the tile counts, and the SHA-256 values. It opens no
Thai text and shows no picture.
"""

import hashlib
import os
import shutil
import sys

from PIL import Image, ImageDraw, ImageFont

REPO = '/home/daniebo/Desktop/Workbooks'
FONT = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
SHEETS_DIR = '/tmp/opencode/c29i/sheets'
GAP = 28
HEAD = 70
LABEL_H = 52
ROW_H_2UP = 1400

MANIFEST_SHA = '64a8dd2f03787668679d0f226d496e4d3eacc73b71e002add4cef4d8d6448407'

# The 14 reader rows in the page order of the build (probe `readers_rows_2_9f.tsx`).
READER_STEMS = [
    'l2-w01-hello', 'l2-w01-nan-can-nod',
    'l2-w02-how-many', 'l2-w02-can-i',
    'l2-w03-paint', 'l2-w03-the-pan',
    'l2-w04-my-family', 'l2-w04-pam',
    'l2-w05-i-have-two', 'l2-w05-sam-and-pam',
    'l2-w06-i-can-see', 'l2-w06-tap-tap',
    'l2-w07-is-it-a-ball', 'l2-w07-the-top',
]

BOOK_PANELS = [
    'student/front-alt-hlogo-r4.png',
    'student/back-alt-hlogo-r4.png',
    'teacher/teacher-front-alt-hlogo-r4.png',
    'teacher/teacher-back-alt-hlogo-r4.png',
]

SHEET_NAMES = ['readers-a3.png', 'readers-leaf.png', 'all.png']
NEW_SHEETS = ['student-alt-hlogo-r4.png', 'teacher-alt-hlogo-r4.png']


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


def load(path, row_h):
    """Opens one page PNG and scales it to the row height."""
    image = Image.open(path).convert('RGB')
    return image.resize((round(row_h * image.width / image.height), row_h), Image.LANCZOS)


def grid(panels, columns, row_h, heading, label_px):
    """Builds one sheet of tiles and labels and returns the canvas."""
    big, small = ImageFont.truetype(FONT, 56), ImageFont.truetype(FONT, label_px)
    row_count = (len(panels) + columns - 1) // columns
    col_width = max(item.width for item, _label in panels)
    width = GAP + columns * (col_width + GAP)
    height = GAP + HEAD + row_count * (row_h + LABEL_H + GAP)
    canvas = Image.new('RGB', (width, height), '#EEF1F5')
    draw = ImageDraw.Draw(canvas)
    draw.text((GAP, GAP + 10), heading, font=big, fill='#16264A')
    for index, (image, label) in enumerate(panels):
        row, column = divmod(index, columns)
        x = GAP + column * (col_width + GAP) + (col_width - image.width) // 2
        y = GAP + HEAD + row * (row_h + LABEL_H + GAP)
        canvas.paste(image, (x, y))
        draw.rectangle((x - 1, y - 1, x + image.width, y + row_h), outline='#9AA6BA')
        draw.text((x, y + row_h + 8), label, font=small, fill='#333333')
    return canvas


def two_up(images, labels):
    """Builds one sheet of 2 pages side by side and returns the canvas."""
    small = ImageFont.truetype(FONT, 36)
    width = sum(item.width for item in images) + GAP * (len(images) + 1)
    height = ROW_H_2UP + 40 + GAP * 2
    canvas = Image.new('RGB', (width, height), '#EEF1F5')
    draw = ImageDraw.Draw(canvas)
    x = GAP
    for image, label in zip(images, labels):
        canvas.paste(image, (x, GAP))
        draw.rectangle((x - 1, GAP - 1, x + image.width, GAP + ROW_H_2UP), outline='#9AA6BA')
        draw.text((x, GAP + ROW_H_2UP + 8), label, font=small, fill='#333333')
        x += image.width + GAP
    return canvas


def main(argv):
    """Builds the 5 sheets, replaces the 3 targets, and writes the 2 new targets."""
    out_folder = os.path.abspath(argv[0])
    manifest = os.path.join(out_folder, 'MANIFEST.txt')
    manifest_sha = sha256(manifest)
    print('MANIFEST_SHA256 ' + manifest_sha)
    print('MANIFEST_SHA_EXPECTED ' + str(manifest_sha == MANIFEST_SHA).lower())
    if manifest_sha != MANIFEST_SHA:
        return 1
    old_rows = read_manifest(manifest)

    targets = [os.path.join(SHEETS_DIR, name) for name in SHEET_NAMES + NEW_SHEETS]
    for target in targets:
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1
    sheets_dir = os.path.join(out_folder, 'contact-sheets')
    for name in NEW_SHEETS:
        target = os.path.join(sheets_dir, name)
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1

    a3_rows = [('readers-a3/%s-a3-cover.png' % stem) for stem in READER_STEMS]
    leaf_rows = [('readers-leaf/%s-leaf-cover.png' % stem) for stem in READER_STEMS]
    for rel in a3_rows + leaf_rows + BOOK_PANELS:
        if not os.path.exists(os.path.join(out_folder, rel)):
            print('MISSING ' + rel)
            return 1

    a3_panels = [(load(os.path.join(out_folder, rel), 700), rel) for rel in a3_rows]
    leaf_panels = [(load(os.path.join(out_folder, rel), 700), rel) for rel in leaf_rows]
    all_panels = [(load(os.path.join(out_folder, rel), 620), rel) for rel in BOOK_PANELS]
    all_panels += [(load(os.path.join(out_folder, rel), 620), rel) for rel in a3_rows]
    all_panels += [(load(os.path.join(out_folder, rel), 620), rel) for rel in leaf_rows]

    os.makedirs(SHEETS_DIR, exist_ok=True)
    plan = [
        ('readers-a3.png', grid(a3_panels, 7, 700, 'Readers A3, 14 pages', 30)),
        ('readers-leaf.png', grid(leaf_panels, 7, 700, 'Readers leaf, 14 pages', 30)),
        ('all.png', grid(all_panels, 4, 620, 'Level 2 Unit 1 covers, 32 pages', 26)),
    ]
    for name, canvas in plan:
        path = os.path.join(SHEETS_DIR, name)
        canvas.save(path)
        print('%s tiles=%d size=%dx%d bytes=%d'
              % (path, len(all_panels) if name == 'all.png'
                 else (len(a3_panels) if name == 'readers-a3.png' else len(leaf_panels)),
                 canvas.width, canvas.height, os.path.getsize(path)))
    print('SHEETS 3')

    replaced = 0
    for name in SHEET_NAMES:
        rel = 'contact-sheets/' + name
        source = os.path.join(SHEETS_DIR, name)
        target = os.path.join(out_folder, rel)
        if rel not in old_rows:
            print('NOT_IN_MANIFEST ' + rel)
            return 1
        if not os.path.exists(target):
            print('TARGET_MISSING ' + target)
            return 1
        old_sha = sha256(target)
        if old_sha != old_rows[rel]:
            print('OLD_SHA_MISMATCH %s manifest=%s disk=%s' % (rel, old_rows[rel], old_sha))
            return 1
        shutil.copyfile(source, target)
        new_sha = sha256(target)
        if new_sha != sha256(source):
            print('PAIR_NOT_EQUAL ' + rel)
            return 1
        replaced += 1
        print('REPLACE %s old=%s new=%s' % (rel, old_sha, new_sha))
    print('REPLACED %d' % replaced)

    new_plan = [
        ('student-alt-hlogo-r4.png', ['student/front-alt-hlogo-r4.png',
                                      'student/back-alt-hlogo-r4.png']),
        ('teacher-alt-hlogo-r4.png', ['teacher/teacher-front-alt-hlogo-r4.png',
                                      'teacher/teacher-back-alt-hlogo-r4.png']),
    ]
    created = 0
    for name, labels in new_plan:
        images = [load(os.path.join(out_folder, rel), ROW_H_2UP) for rel in labels]
        canvas = two_up(images, labels)
        source = os.path.join(SHEETS_DIR, name)
        canvas.save(source)
        target = os.path.join(sheets_dir, name)
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1
        shutil.copyfile(source, target)
        new_sha = sha256(target)
        if new_sha != sha256(source):
            print('PAIR_NOT_EQUAL ' + name)
            return 1
        created += 1
        print('CREATE contact-sheets/%s size=%dx%d bytes=%d sha256=%s'
              % (name, canvas.width, canvas.height, os.path.getsize(target), new_sha))
    print('CREATED %d' % created)

    ok = replaced == len(SHEET_NAMES) and created == len(NEW_SHEETS)
    print('CONTACT_OK ' + str(ok).lower())
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
