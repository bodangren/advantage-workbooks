#!/usr/bin/env python3
"""The r6 book contact sheet (Task (Green, F10), step 7, track storytime_cover_options_20261106).

Model: `contact-2-9j.py` of part 10, the same font, the same gap, the same heading, and the same file
name under each tile. One sheet in 2 rows (D-F10-11):
  row 1: the student front and the student back;
  row 2: the teacher front and the teacher back.
Each tile is the whole page at the page aspect 210 : 297, with no crop (lesson of F9: a PM crop cut
a tile). The script writes `contact-sheets/books-r6.png` in the r6 folder and refuses a target that
exists. It then reads the saved sheet again, cuts each tile out at its known place, and proves that
the tile equals its page PNG resized to the tile size, within 3 grey levels of mean difference per
channel. It also proves that each tile keeps the page aspect within 1 px.

Usage: python3 -I -B contact_f10.py

The script prints only the paths, the sizes, the differences, and the SHA-256 value. It opens no
Thai text and shows no picture.
"""

import hashlib
import os

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

REPO = '/home/daniebo/Desktop/Workbooks'
FONT = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
OUT = '/home/daniebo/Desktop/print-ready/storytime/covers-quest-v1-books-r6'
TARGET = os.path.join(OUT, 'contact-sheets', 'books-r6.png')
GAP = 28
# 100, not the 70 of contact-2-9j.py: with 70 the tiles cut the foot of the 56 px heading (look of
# the first books-r6.png, 2026-11-13).
HEAD = 100
LABEL_H = 52
ROW_H = 1400
MAX_MEAN_DIFF = 3.0

ROWS = [
    ['student/front-alt-hlogo-r6.png', 'student/back-alt-hlogo-r6.png'],
    ['teacher/teacher-front-alt-hlogo-r6.png', 'teacher/teacher-back-alt-hlogo-r6.png'],
]


def sha256(path):
    """Returns the SHA-256 of one file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def load(path):
    """Opens one page PNG and scales the whole page to the row height."""
    image = Image.open(path).convert('RGB')
    return image.resize((round(ROW_H * image.width / image.height), ROW_H), Image.LANCZOS)


def main():
    """Builds the sheet, writes it, and proves each tile."""
    if os.path.exists(TARGET):
        print('TARGET_EXISTS ' + TARGET)
        return 1
    for row in ROWS:
        for rel in row:
            if not os.path.exists(os.path.join(OUT, rel)):
                print('MISSING ' + rel)
                return 1

    tiles = [[(load(os.path.join(OUT, rel)), rel) for rel in row] for row in ROWS]
    col_width = max(image.width for row in tiles for image, _ in row)
    width = GAP + 2 * (col_width + GAP)
    height = GAP + HEAD + len(tiles) * (ROW_H + LABEL_H + GAP)
    canvas = Image.new('RGB', (width, height), '#EEF1F5')
    draw = ImageDraw.Draw(canvas)
    big, small = ImageFont.truetype(FONT, 56), ImageFont.truetype(FONT, 30)
    draw.text((GAP, GAP + 10), 'Level 2 Unit 1 book covers r6, 4 pages', font=big, fill='#16264A')
    places = []
    for row_index, row in enumerate(tiles):
        for column, (image, rel) in enumerate(row):
            x = GAP + column * (col_width + GAP) + (col_width - image.width) // 2
            y = GAP + HEAD + row_index * (ROW_H + LABEL_H + GAP)
            canvas.paste(image, (x, y))
            draw.rectangle((x - 1, y - 1, x + image.width, y + ROW_H), outline='#9AA6BA')
            draw.text((x, y + ROW_H + 8), rel, font=small, fill='#333333')
            places.append((rel, x, y, image.width))

    os.makedirs(os.path.dirname(TARGET), exist_ok=True)
    canvas.save(TARGET)
    print('SHEET %s size=%dx%d bytes=%d sha256=%s'
          % (TARGET, canvas.width, canvas.height, os.path.getsize(TARGET), sha256(TARGET)))

    saved = Image.open(TARGET).convert('RGB')
    passed = 0
    for rel, x, y, tile_width in places:
        page = Image.open(os.path.join(OUT, rel)).convert('RGB')
        aspect_width = ROW_H * 210 / 297
        aspect_ok = abs(tile_width - aspect_width) <= 1 and abs(ROW_H * page.width / page.height - aspect_width) <= 1
        tile = saved.crop((x, y, x + tile_width, y + ROW_H))
        reference = page.resize((tile_width, ROW_H), Image.LANCZOS)
        means = ImageStat.Stat(ImageChops.difference(tile, reference)).mean
        ok = aspect_ok and max(means) <= MAX_MEAN_DIFF
        passed += 1 if ok else 0
        print('TILE %s at=%d,%d size=%dx%d page=%dx%d aspect_ok=%s mean_diff=%s ok=%s'
              % (rel, x, y, tile_width, ROW_H, page.width, page.height, str(aspect_ok).lower(),
                 ','.join('%.3f' % value for value in means), str(ok).lower()))
    print('WHOLE_TILES %d of %d' % (passed, len(places)))
    return 0 if passed == len(places) == 4 else 1


if __name__ == '__main__':
    raise SystemExit(main())
