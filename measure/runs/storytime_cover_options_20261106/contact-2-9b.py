"""The contact sheets of the Task 2.9 part 2 teacher cover v2, both top variants (track storytime_cover_options_20261106).

Model: `measure/runs/storytime_cover_options_20261106/contact-2-9a-a2.py`, which follows
`measure/tracks/storytime_cover_options_20261106/options/contact.py`.

Usage: python3 -I -B contact-2-9b.py <hand-off folder>

Three PNG files in <hand-off folder>/contact-sheets/:
  teacher.png: the r5 v2 teacher front and back of the hand-off folder side by side, each 1400 px
  high, with the file name under each.
  teacher-alt-hlogo.png: the A2 v2 teacher front and back the same way.
  teacher-r5-vs-alt-hlogo.png: the 2 v2 teacher fronts side by side, the same height, each with its
  label under it.

The script is create-only: it stops when a target file exists. It reads no Thai text and prints only
the paths and the sizes.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

REPO = '/home/daniebo/Desktop/Workbooks'
FONT = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
ROW_H, GAP, HEAD = 1400, 28, 70


def sheet(images, heading, labels):
    """Builds one sheet and returns the canvas."""
    big, small = ImageFont.truetype(FONT, 56), ImageFont.truetype(FONT, 36)
    width = sum(item.width for item in images) + GAP * (len(images) + 1)
    height = HEAD + ROW_H + 40 + GAP * 2
    canvas = Image.new('RGB', (width, height), '#EEF1F5')
    draw = ImageDraw.Draw(canvas)
    x = GAP
    top = GAP + (HEAD if heading else 0)
    if heading:
        draw.text((GAP, GAP + 10), heading, font=big, fill='#16264A')
    for image, label in zip(images, labels):
        canvas.paste(image, (x, top))
        draw.rectangle((x - 1, top - 1, x + image.width, top + ROW_H), outline='#9AA6BA')
        draw.text((x, top + ROW_H + 8), label, font=small, fill='#333333')
        x += image.width + GAP
    return canvas


def load(path):
    """Opens one page PNG and scales it to the row height."""
    image = Image.open(path).convert('RGB')
    return image.resize((round(ROW_H * image.width / image.height), ROW_H), Image.LANCZOS)


def main(argv):
    """Builds the 3 sheets and prints their paths and sizes."""
    out_folder = os.path.abspath(argv[0])
    teacher = os.path.join(out_folder, 'teacher')
    sheets_dir = os.path.join(out_folder, 'contact-sheets')
    targets = [
        os.path.join(sheets_dir, 'teacher.png'),
        os.path.join(sheets_dir, 'teacher-alt-hlogo.png'),
        os.path.join(sheets_dir, 'teacher-r5-vs-alt-hlogo.png'),
    ]
    for target in targets:
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1
    os.makedirs(sheets_dir, exist_ok=True)

    r5 = [load(os.path.join(teacher, 'teacher-front.png')),
          load(os.path.join(teacher, 'teacher-back.png'))]
    a2 = [load(os.path.join(teacher, 'teacher-front-alt-hlogo.png')),
          load(os.path.join(teacher, 'teacher-back-alt-hlogo.png'))]
    compare = [load(os.path.join(teacher, 'teacher-front.png')),
               load(os.path.join(teacher, 'teacher-front-alt-hlogo.png'))]

    plan = [
        ('teacher.png', sheet(r5, None, ['teacher-front.png', 'teacher-back.png'])),
        ('teacher-alt-hlogo.png',
         sheet(a2, None, ['teacher-front-alt-hlogo.png', 'teacher-back-alt-hlogo.png'])),
        ('teacher-r5-vs-alt-hlogo.png',
         sheet(compare, None, ['r5 top', 'A2 horizontal logo top'])),
    ]
    for name, canvas in plan:
        path = os.path.join(sheets_dir, name)
        canvas.save(path)
        print(path, canvas.size)
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
