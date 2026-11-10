"""The contact sheets of the Task 2.9 part 3 A2 r2 covers, student book and teacher book (track storytime_cover_options_20261106).

Model: `measure/runs/storytime_cover_options_20261106/contact-2-9b.py`, which follows
`measure/runs/storytime_cover_options_20261106/contact-2-9a-a2.py`.

Usage: python3 -I -B contact-2-9c.py <hand-off folder>

Four PNG files in <hand-off folder>/contact-sheets/:
  student-alt-hlogo-r2.png: the r2 student front and back of the hand-off folder side by side, each
  1400 px high, with the file name under each.
  teacher-alt-hlogo-r2.png: the r2 teacher front and back the same way.
  student-r5-vs-alt-hlogo-r2.png: 4 panels in one row, the r5 student front, the r5 student back,
  the r2 student front, and the r2 student back, each with its file name under it.
  teacher-r5-vs-alt-hlogo-r2.png: the same 4 panels for the teacher book.

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
    """Builds the 4 sheets and prints their paths and sizes."""
    out_folder = os.path.abspath(argv[0])
    student = os.path.join(out_folder, 'student')
    teacher = os.path.join(out_folder, 'teacher')
    sheets_dir = os.path.join(out_folder, 'contact-sheets')
    targets = [
        os.path.join(sheets_dir, 'student-alt-hlogo-r2.png'),
        os.path.join(sheets_dir, 'teacher-alt-hlogo-r2.png'),
        os.path.join(sheets_dir, 'student-r5-vs-alt-hlogo-r2.png'),
        os.path.join(sheets_dir, 'teacher-r5-vs-alt-hlogo-r2.png'),
    ]
    for target in targets:
        if os.path.exists(target):
            print('TARGET_EXISTS ' + target)
            return 1
    os.makedirs(sheets_dir, exist_ok=True)

    r2_labels = ['student/front-alt-hlogo-r2.png', 'student/back-alt-hlogo-r2.png']
    r2 = [load(os.path.join(student, 'front-alt-hlogo-r2.png')),
          load(os.path.join(student, 'back-alt-hlogo-r2.png'))]
    t_r2_labels = ['teacher/teacher-front-alt-hlogo-r2.png',
                   'teacher/teacher-back-alt-hlogo-r2.png']
    t_r2 = [load(os.path.join(teacher, 'teacher-front-alt-hlogo-r2.png')),
            load(os.path.join(teacher, 'teacher-back-alt-hlogo-r2.png'))]
    compare_labels = ['student/front.png', 'student/back.png',
                      'student/front-alt-hlogo-r2.png', 'student/back-alt-hlogo-r2.png']
    compare = [load(os.path.join(student, 'front.png')),
               load(os.path.join(student, 'back.png')),
               load(os.path.join(student, 'front-alt-hlogo-r2.png')),
               load(os.path.join(student, 'back-alt-hlogo-r2.png'))]
    t_compare_labels = ['teacher/teacher-front.png', 'teacher/teacher-back.png',
                        'teacher/teacher-front-alt-hlogo-r2.png',
                        'teacher/teacher-back-alt-hlogo-r2.png']
    t_compare = [load(os.path.join(teacher, 'teacher-front.png')),
                 load(os.path.join(teacher, 'teacher-back.png')),
                 load(os.path.join(teacher, 'teacher-front-alt-hlogo-r2.png')),
                 load(os.path.join(teacher, 'teacher-back-alt-hlogo-r2.png'))]

    plan = [
        ('student-alt-hlogo-r2.png', sheet(r2, None, r2_labels)),
        ('teacher-alt-hlogo-r2.png', sheet(t_r2, None, t_r2_labels)),
        ('student-r5-vs-alt-hlogo-r2.png', sheet(compare, None, compare_labels)),
        ('teacher-r5-vs-alt-hlogo-r2.png', sheet(t_compare, None, t_compare_labels)),
    ]
    for name, canvas in plan:
        path = os.path.join(sheets_dir, name)
        canvas.save(path)
        print(path, canvas.size)
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
