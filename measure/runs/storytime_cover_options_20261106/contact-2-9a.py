"""The contact sheets of the Task 2.9 part 1 covers (track storytime_cover_options_20261106, FR-5.2).

Model: measure/tracks/storytime_cover_options_20261106/options/contact.py

Usage: python3 -I -B contact-2-9a.py <hand-off folder>

Two PNG files in <hand-off folder>/contact-sheets/:
  student.png: the student front and back side by side, each 1400 px high, with the file name
  under each.
  teacher-candidate.png: the teacher front candidate and the teacher back candidate the same
  way, with the heading "CANDIDATE: fallback front art".

The script reads no Thai text and prints only the sizes.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

REPO = '/home/daniebo/Desktop/Workbooks'
FONT = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
ROW_H, GAP, HEAD = 1400, 28, 70
SHEETS = [
    ('student.png', 'student', ['front.png', 'back.png'], None),
    ('teacher-candidate.png', 'teacher-candidate',
     ['teacher-front-candidate.png', 'teacher-back-candidate.png'], 'CANDIDATE: fallback front art'),
]


def main(argv):
    """Builds the two sheets and prints their paths and sizes."""
    out_folder = os.path.abspath(argv[0])
    os.makedirs(os.path.join(out_folder, 'contact-sheets'), exist_ok=True)
    big, small = ImageFont.truetype(FONT, 56), ImageFont.truetype(FONT, 36)
    for name, folder, files, heading in SHEETS:
        images = []
        for file_name in files:
            image = Image.open(os.path.join(out_folder, folder, file_name)).convert('RGB')
            images.append((file_name, image.resize((round(ROW_H * image.width / image.height), ROW_H), Image.LANCZOS)))
        width = sum(item.width for _, item in images) + GAP * (len(images) + 1)
        height = HEAD + ROW_H + 40 + GAP * 2
        canvas = Image.new('RGB', (width, height), '#EEF1F5')
        draw = ImageDraw.Draw(canvas)
        x = GAP
        top = GAP + (HEAD if heading else 0)
        if heading:
            draw.text((GAP, GAP + 10), heading, font=big, fill='#16264A')
        for file_name, image in images:
            canvas.paste(image, (x, top))
            draw.rectangle((x - 1, top - 1, x + image.width, top + ROW_H), outline='#9AA6BA')
            draw.text((x, top + ROW_H + 8), file_name, font=small, fill='#333333')
            x += image.width + GAP
        path = os.path.join(out_folder, 'contact-sheets', name)
        canvas.save(path)
        print(path, canvas.size)


if __name__ == '__main__':
    main(sys.argv[1:])
