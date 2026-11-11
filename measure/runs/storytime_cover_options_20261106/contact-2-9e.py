"""The 3 contact sheets of the Task 2.9 part 5 reader covers (track storytime_cover_options_20261106).

Model: `measure/runs/storytime_cover_options_20261106/contact-2-9c.py`, the same font, the same gap,
the same heading, and the same file name under each tile.

Usage: python3 -I -B contact-2-9e.py <hand-off folder>

Three PNG files in <hand-off folder>/contact-sheets/:
  readers-a3.png: the 14 A3 reader cover pages, 7 columns and 2 rows, in the row order of
  `questReaders()`.
  readers-leaf.png: the 14 leaf reader cover pages, the same grid and the same order.
  all.png: the 32 pages of this build in one sheet, 4 columns and 8 rows: the 4 shipped r2 book
  pages (student front, student back, teacher front, teacher back), then the 14 A3 pages, then the
  14 leaf pages.

The script is create-only: it stops when a target file exists. It reads no Thai text and prints only
the paths, the sizes, and the tile counts.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

REPO = '/home/daniebo/Desktop/Workbooks'
FONT = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
GAP = 28
HEAD = 70
LABEL_H = 52

# The 14 reader rows in the page order of the build (probe `readers_rows_2_9e.tsx`).
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
    'student/front-alt-hlogo-r2.png',
    'student/back-alt-hlogo-r2.png',
    'teacher/teacher-front-alt-hlogo-r2.png',
    'teacher/teacher-back-alt-hlogo-r2.png',
]


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


def main(argv):
    """Builds the 3 sheets and prints their paths and sizes."""
    out_folder = os.path.abspath(argv[0])
    sheets_dir = os.path.join(out_folder, 'contact-sheets')
    targets = [
        os.path.join(sheets_dir, 'readers-a3.png'),
        os.path.join(sheets_dir, 'readers-leaf.png'),
        os.path.join(sheets_dir, 'all.png'),
    ]
    for target in targets:
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

    os.makedirs(sheets_dir, exist_ok=True)
    plan = [
        ('readers-a3.png', grid(a3_panels, 7, 700, 'Readers A3, 14 pages', 30)),
        ('readers-leaf.png', grid(leaf_panels, 7, 700, 'Readers leaf, 14 pages', 30)),
        ('all.png', grid(all_panels, 4, 620, 'Level 2 Unit 1 covers, 32 pages', 26)),
    ]
    for name, canvas in plan:
        path = os.path.join(sheets_dir, name)
        canvas.save(path)
        print('%s tiles=%d size=%dx%d bytes=%d'
              % (path, len(all_panels) if name == 'all.png'
                 else (len(a3_panels) if name == 'readers-a3.png' else len(leaf_panels)),
                 canvas.width, canvas.height, os.path.getsize(path)))
    print('SHEETS 3')
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
