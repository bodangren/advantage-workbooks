"""The contact sheets of the Task 2.9 part 1 A2 alternate (track storytime_cover_options_20261106).

Model: `measure/tracks/storytime_cover_options_20261106/options/contact.py` and the r5 script
`measure/runs/storytime_cover_options_20261106/contact-2-9a.py`.

Usage: python3 -I -B contact-2-9a-a2.py <hand-off folder> <build root>

Three PNG files in <hand-off folder>/contact-sheets/:
  student-alt-hlogo.png: the A2 student front and back of the build output side by side, each
  1400 px high, with the file name under each.
  teacher-candidate-alt-hlogo.png: the A2 teacher front and back of the build output the same way,
  with the heading "CANDIDATE: fallback front art".
  student-r5-vs-alt-hlogo.png: the r5 student front of the hand-off folder on the left and the A2
  student front of the build output on the right, the same height, each with its label under it.

The 2 r5 sheets stay unchanged. The script reads no Thai text and prints only the paths and the
sizes.
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
    build_root = os.path.abspath(argv[1])
    sheets_dir = os.path.join(out_folder, 'contact-sheets')
    os.makedirs(sheets_dir, exist_ok=True)

    student = [load(os.path.join(build_root, 'student', 'front.png')),
               load(os.path.join(build_root, 'student', 'back.png'))]
    teacher = [load(os.path.join(build_root, 'teacher', 'teacher-front.png')),
               load(os.path.join(build_root, 'teacher', 'teacher-back.png'))]
    compare = [load(os.path.join(out_folder, 'student', 'front.png')),
               load(os.path.join(build_root, 'student', 'front.png'))]

    plan = [
        ('student-alt-hlogo.png', sheet(student, None, ['front.png', 'back.png'])),
        ('teacher-candidate-alt-hlogo.png',
         sheet(teacher, 'CANDIDATE: fallback front art',
               ['teacher-front.png', 'teacher-back.png'])),
        ('student-r5-vs-alt-hlogo.png',
         sheet(compare, None, ['r5 (option A)', 'A2 (horizontal logo)'])),
    ]
    for name, canvas in plan:
        path = os.path.join(sheets_dir, name)
        canvas.save(path)
        print(path, canvas.size)


if __name__ == '__main__':
    main(sys.argv[1:])
