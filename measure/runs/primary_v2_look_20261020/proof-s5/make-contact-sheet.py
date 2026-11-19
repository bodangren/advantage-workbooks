"""The S5 contact sheets (track primary_v2_look_20261020, Phase S5).

It rasterizes every page of a proof PDF at 100 dpi and builds one contact sheet
per proof: the printed page on the left, the app capture of the same step on
the right. Printed steps 9, 10, and 11 have no single app step, so their rows
carry the printed name. It prints file names, page numbers, and step names
only; it prints no Thai text and it opens no image.

Usage: python3 -I -B make-contact-sheet.py --pdf <file.pdf> --tag <name>
         --folder <proof folder> --captures <capture folder>
"""

import argparse
import os
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

REPO = '/home/daniebo/Desktop/Workbooks'
FONT = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
ROW_H, GAP, HEAD, CAPTION = 1123, 28, 70, 54
DPI = 100

# The printed steps of the Chibi Quest look (plan.md, task S4.1) and the app step
# of each (the app steps of step-map.ts: steps 9 and 10 map to two app steps each,
# and step 11 maps to none, so those three rows carry no capture).
STEPS = [
    (1, 'Introduction', 'lesson-step01-intro-desktop.png'),
    (2, 'Preview Vocabulary', 'lesson-step02-preview-vocabulary-desktop.png'),
    (3, 'First Reading', 'lesson-step03-first-reading-desktop.png'),
    (4, 'Vocabulary Collection', 'lesson-step04-vocabulary-collection-desktop.png'),
    (5, 'Deep Reading', 'lesson-step05-deep-reading-desktop.png'),
    (6, 'Sentence Collection', 'lesson-step06-sentence-collection-desktop.png'),
    (7, 'Multiple Choice', 'lesson-step07-mcq-desktop.png'),
    (8, 'Short Answer', 'lesson-step08-short-answer-desktop.png'),
    (9, 'Vocabulary Practice', None),
    (10, 'Sentence Practice', None),
    (11, 'Guided Writing', None),
    (12, 'Language Questions', 'lesson-step13-language-questions-desktop.png'),
    (13, 'Lesson Summary', 'lesson-step14-summary-desktop.png'),
]


def page_names(pdf, page):
    """The printed step names that a page holds, in the order of the page."""
    text = subprocess.run(['pdftotext', '-f', str(page), '-l', str(page), pdf, '-'], capture_output=True, text=True).stdout
    flat = re.sub(r'\s+', '', text)
    found = []
    for number, name, _capture in STEPS:
        key = re.sub(r'\s+', '', name)
        position = flat.find(key)
        if position >= 0:
            found.append((position, number))
    found.sort()
    return [number for _position, number in found]


def page_steps(pdf, pages):
    """The printed step of every page and the other steps that start on it."""
    steps = []
    current = 0
    for page in range(1, pages + 1):
        found = page_names(pdf, page)
        if found:
            current = found[-1]
        steps.append({'step': found[0] if found else current, 'others': found[1:]})
    return steps


def rasterize(pdf, pages, folder):
    """Rasterizes every page of the PDF at 100 dpi and returns the tile files."""
    os.makedirs(folder, exist_ok=True)
    prefix = os.path.join(folder, 'page')
    subprocess.run(['pdftoppm', '-r', str(DPI), '-png', pdf, prefix], check=True)
    tiles = []
    for page in range(1, pages + 1):
        candidate = f'{prefix}-{page:02d}.png'
        if not os.path.exists(candidate):
            candidate = f'{prefix}-{page}.png'
        tiles.append(candidate)
    return tiles


def build(pdf, tag, folder, captures):
    """Builds the contact sheet of one proof and returns the page rows."""
    info = subprocess.run(['pdfinfo', '-box', pdf], capture_output=True, text=True).stdout
    pages = int(re.search(r'^Pages:\s+(\d+)', info, re.M).group(1))
    tiles = rasterize(pdf, pages, os.path.join(folder, f'{tag}-pages'))
    steps = page_steps(pdf, pages)
    rows = []
    for index, tile in enumerate(tiles):
        step = steps[index]['step']
        name = next((n for number, n, _c in STEPS if number == step), '')
        capture = next((c for number, _n, c in STEPS if number == step), None)
        others = [(other, next((n for number, n, _c in STEPS if number == other), '')) for other in steps[index]['others']]
        rows.append({'page': index + 1, 'step': step, 'name': name, 'capture': capture, 'tile': tile, 'others': others})

    def scaled_width(path):
        """The width of an image when its height is the row height."""
        with Image.open(path) as image:
            return round(ROW_H * image.width / image.height)

    page_w = scaled_width(tiles[0])
    capture_w = scaled_width(os.path.join(captures, STEPS[0][2]))
    big = ImageFont.truetype(FONT, 44)
    small = ImageFont.truetype(FONT, 30)
    head_h = HEAD
    width = GAP + page_w + GAP + capture_w + GAP
    height = head_h + GAP + len(rows) * (ROW_H + CAPTION + GAP)
    canvas = Image.new('RGB', (width, height), '#EEF1F5')
    draw = ImageDraw.Draw(canvas)
    draw.text((GAP, GAP - 6), f'{tag}: {pages} printed pages at {DPI} dpi, next to the app capture of the same step', font=big, fill='#16264A')
    top = head_h + GAP
    for row in rows:
        page_image = Image.open(row['tile']).convert('RGB')
        page_image = page_image.resize((page_w, ROW_H), Image.LANCZOS)
        canvas.paste(page_image, (GAP, top))
        draw.rectangle((GAP - 1, top - 1, GAP + page_w, top + ROW_H), outline='#9AA6BA')
        label = f'printed page {row["page"]}'
        if row['step']:
            label += f' - step {row["step"]}: {row["name"]}'
        else:
            label += ' - front matter'
        for other in row['others']:
            label += f' (this page also starts step {other[0]}: {other[1]})'
        draw.text((GAP, top + ROW_H + 8), label, font=small, fill='#333333')
        x = GAP + page_w + GAP
        if row['capture']:
            capture_path = os.path.join(captures, row['capture'])
            capture_image = Image.open(capture_path).convert('RGB')
            capture_image = capture_image.resize((capture_w, ROW_H), Image.LANCZOS)
            canvas.paste(capture_image, (x, top))
            draw.rectangle((x - 1, top - 1, x + capture_w, top + ROW_H), outline='#9AA6BA')
            draw.text((x, top + ROW_H + 8), f'app capture: {row["capture"]}', font=small, fill='#333333')
        else:
            draw.rectangle((x - 1, top - 1, x + capture_w, top + ROW_H), outline='#9AA6BA', fill='#FFFFFF')
            note = 'No single app step.'
            if row['step']:
                note = f'This printed step has no single app step: {row["name"]}.'
            draw.text((x + 24, top + 24), note, font=small, fill='#333333')
            draw.text((x + 24, top + 74), f'printed step {row["step"]}: {row["name"]}', font=small, fill='#333333')
        top += ROW_H + CAPTION + GAP
    sheet = os.path.join(folder, f'{tag}-contact.jpg')
    canvas.save(sheet, quality=82)
    return sheet, rows, pages


def main(argv):
    """Builds the contact sheet of every proof."""
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--folder', required=True)
    parser.add_argument('--captures', required=True)
    args = parser.parse_args(argv)
    sheet, rows, pages = build(args.pdf, args.tag, args.folder, args.captures)
    mapping = os.path.join(args.folder, f'{args.tag}-pages.tsv')
    with open(mapping, 'w', encoding='utf-8') as handle:
        handle.write('page\tprinted_step\tprinted_name\tcapture\talso_starts\n')
        for row in rows:
            others = ' '.join(f'{number}:{name}' for number, name in row['others'])
            handle.write(f'{row["page"]}\t{row["step"]}\t{row["name"]}\t{row["capture"] or "-"}\t{others or "-"}\n')
    print(f'CONTACT {args.tag}: {sheet} ({pages} pages, {len(rows)} tiles)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
