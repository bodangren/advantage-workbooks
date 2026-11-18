"""The contact sheet of the Storytime cover options (track storytime_cover_options_20261106, FR-5.2).

Usage: python3 -I -B contact.py <hand-off folder>

One PNG: one row per option (student front, student back, teacher front, A3 reader cover, reader
leaf), every mockup at the same height, with the option letter and its plain-words line.
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
FONT = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
KINDS = [('student-front', 'Student book, front'), ('student-back', 'Student book, back'), ('teacher-front', 'Teacher book, front'),
         ('reader-a3', 'Reader cover, A3 color'), ('reader-leaf', 'Reader cover, tear-out leaf')]
ROW_H, GAP, HEAD = 640, 28, 70


def main(argv):
    out = os.path.abspath(argv[0])
    lines = json.load(open(os.path.join(HERE, 'options.json'), encoding='utf-8'))
    big, small = ImageFont.truetype(FONT, 34), ImageFont.truetype(FONT, 22)
    rows = []
    for option in 'ABC':
        ims = []
        for kind, label in KINDS:
            im = Image.open(os.path.join(out, 'png', f'option-{option}-{kind}.png')).convert('RGB')
            ims.append((label, im.resize((round(ROW_H * im.width / im.height), ROW_H), Image.LANCZOS)))
        rows.append((option, ims))
    width = max(sum(i.width for _, i in ims) + GAP * (len(ims) + 1) for _, ims in rows)
    height = len(rows) * (HEAD + ROW_H + 40 + GAP) + GAP
    sheet = Image.new('RGB', (width, height), '#EEF1F5')
    d = ImageDraw.Draw(sheet)
    y = GAP
    for option, ims in rows:
        d.text((GAP, y + 10), f'Option {option}: {lines[option]["name"]}. {lines[option]["line"]}', font=big, fill='#16264A')
        x, top = GAP, y + HEAD
        for label, im in ims:
            sheet.paste(im, (x, top))
            d.rectangle((x - 1, top - 1, x + im.width, top + ROW_H), outline='#9AA6BA')
            d.text((x, top + ROW_H + 8), label, font=small, fill='#333333')
            x += im.width + GAP
        y = top + ROW_H + 40 + GAP
    path = os.path.join(out, 'contact-sheet.png')
    sheet.save(path)
    print(path, sheet.size)


if __name__ == '__main__':
    main(sys.argv[1:])
