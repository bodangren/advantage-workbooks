"""The S5 contact sheets (track primary_v2_look_20261020, Phase S5, round 2).

It rasterizes every page of a proof PDF at 100 dpi and builds one contact sheet
per proof: the printed page on the left, the app capture of the same step on
the right. Each row names every step that starts on the page and the step that
continues from the page before. The Thai article translation page gets its own
label and no capture. A caption wraps inside its room and never overprints.

It prints file names, page numbers, and step names only; it prints no Thai text
and it opens no image of the page content.

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
ROW_H, GAP, HEAD = 1123, 28, 70
CAPTION_LINES, LINE_H = 3, 38
CAPTION = CAPTION_LINES * LINE_H
GAP_LIMIT = 20.0
DPI = 100
THAI = re.compile('[\u0e00-\u0e7f]')
WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">([^<]*)</word>')

# The printed steps of the Chibi Quest look (plan.md, task S4.1) and the app step
# of each (the app steps of step-map.ts: steps 9 and 10 map to two app steps each,
# and step 11 maps to none, so those three rows carry no capture).
STEPS = {
    1: ('Introduction', 'lesson-step01-intro-desktop.png'),
    2: ('Preview Vocabulary', 'lesson-step02-preview-vocabulary-desktop.png'),
    3: ('First Reading', 'lesson-step03-first-reading-desktop.png'),
    4: ('Vocabulary Collection', 'lesson-step04-vocabulary-collection-desktop.png'),
    5: ('Deep Reading', 'lesson-step05-deep-reading-desktop.png'),
    6: ('Sentence Collection', 'lesson-step06-sentence-collection-desktop.png'),
    7: ('Multiple Choice', 'lesson-step07-mcq-desktop.png'),
    8: ('Short Answer', 'lesson-step08-short-answer-desktop.png'),
    9: ('Vocabulary Practice', None),
    10: ('Sentence Practice', None),
    11: ('Guided Writing', None),
    12: ('Language Questions', 'lesson-step13-language-questions-desktop.png'),
    13: ('Lesson Summary', 'lesson-step14-summary-desktop.png'),
}


def page_geometry(pdf, page):
    """The step names at the top of the page, the gap above the first of them, and the Thai count."""
    out = subprocess.run(['pdftotext', '-bbox', '-f', str(page), '-l', str(page), pdf, '-'], capture_output=True, text=True).stdout
    words = [(float(x), float(y), text) for x, y, text in WORD.findall(out)]
    if not words:
        return [], -1.0, 0, 0
    top = min(y for _x, y, _text in words)
    lines = {}
    for x, y, text in words:
        lines.setdefault(round(y), []).append((x, text))
    found = {}
    for y, items in lines.items():
        line = ''.join(text for _x, text in sorted(items))
        for number in sorted(STEPS):
            if STEPS[number][0].replace(' ', '') in line:
                found[number] = min(found.get(number, y), y)
    ordered = sorted(found.items(), key=lambda item: item[1])
    thai = sum(len(THAI.findall(text)) for _x, _y, text in words)
    total = sum(len(text) for _x, _y, text in words)
    gap = ordered[0][1] - top if ordered else -1.0
    return [number for number, _y in ordered], gap, thai, total


def page_rows(pdf, pages):
    """The step data of every page: what starts on it and what continues."""
    rows = []
    previous = 0
    for page in range(1, pages + 1):
        found, gap, thai, total = page_geometry(pdf, page)
        translation = not found and total > 0 and thai * 2 > total
        continued = 0
        if not translation and previous and previous not in found and (not found or gap > GAP_LIMIT):
            continued = previous
        primary = 0 if translation else (found[0] if found else continued)
        rows.append({'page': page, 'found': found, 'continued': continued, 'primary': primary, 'translation': translation})
        if found:
            previous = found[-1]
    return rows


def label_text(row):
    """The caption of one row: every start and the continuation."""
    label = f'printed page {row["page"]}'
    if row['translation']:
        return f'{label} - Thai article translation (no app step)'
    parts = []
    if row['continued']:
        parts.append(f'continues step {row["continued"]}: {STEPS[row["continued"]][0]}')
    for number in row['found']:
        parts.append(f'starts step {number}: {STEPS[number][0]}')
    if not parts:
        parts.append('front matter')
    return f'{label} - ' + '; '.join(parts)


def wrap_label(label, font, max_width):
    """The label split into drawn lines that each fit the room."""
    segments = [part.strip() for part in label.split(';') if part.strip()]
    lines, current = [], ''
    for segment in segments:
        candidate = f'{current}; {segment}' if current else segment
        if font.getlength(candidate) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = ''
        for word in segment.split():
            candidate = f'{current} {word}' if current else word
            if font.getlength(candidate) <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
    if current:
        lines.append(current)
    return lines


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
    steps = page_rows(pdf, pages)
    rows = []
    for index, tile in enumerate(tiles):
        step = steps[index]
        capture = STEPS[step['primary']][1] if step['primary'] else None
        rows.append({**step, 'tile': tile, 'capture': capture, 'label': label_text(step)})

    def scaled_width(path):
        """The width of an image when its height is the row height."""
        with Image.open(path) as image:
            return round(ROW_H * image.width / image.height)

    page_w = scaled_width(tiles[0])
    capture_w = scaled_width(os.path.join(captures, STEPS[1][1]))
    big = ImageFont.truetype(FONT, 44)
    small = ImageFont.truetype(FONT, 30)
    width = GAP + page_w + GAP + capture_w + GAP
    height = HEAD + GAP + len(rows) * (ROW_H + CAPTION + GAP)
    canvas = Image.new('RGB', (width, height), '#EEF1F5')
    draw = ImageDraw.Draw(canvas)
    draw.text((GAP, GAP - 6), f'{tag}: {pages} printed pages at {DPI} dpi, next to the app capture of the same step', font=big, fill='#16264A')
    top = HEAD + GAP
    for row in rows:
        page_image = Image.open(row['tile']).convert('RGB')
        page_image = page_image.resize((page_w, ROW_H), Image.LANCZOS)
        canvas.paste(page_image, (GAP, top))
        draw.rectangle((GAP - 1, top - 1, GAP + page_w, top + ROW_H), outline='#9AA6BA')
        lines = wrap_label(row['label'], small, page_w)
        if len(lines) > CAPTION_LINES:
            raise SystemExit(f'label of page {row["page"]} needs {len(lines)} lines of {CAPTION_LINES}')
        for number, line in enumerate(lines):
            draw.text((GAP, top + ROW_H + 8 + number * LINE_H), line, font=small, fill='#333333')
        x = GAP + page_w + GAP
        if row['capture']:
            capture_image = Image.open(os.path.join(captures, row['capture'])).convert('RGB')
            capture_image = capture_image.resize((capture_w, ROW_H), Image.LANCZOS)
            canvas.paste(capture_image, (x, top))
            draw.rectangle((x - 1, top - 1, x + capture_w, top + ROW_H), outline='#9AA6BA')
            draw.text((x, top + ROW_H + 8), f'app capture: {row["capture"]}', font=small, fill='#333333')
        else:
            draw.rectangle((x - 1, top - 1, x + capture_w, top + ROW_H), outline='#9AA6BA', fill='#FFFFFF')
            if row['translation']:
                note = 'Thai article translation: no app step.'
            elif row['primary']:
                note = f'This printed step has no single app step: {STEPS[row["primary"]][0]}.'
            else:
                note = 'Front matter: no app step.'
            draw.text((x + 24, top + 24), note, font=small, fill='#333333')
            if row['primary']:
                draw.text((x + 24, top + 74), f'printed step {row["primary"]}: {STEPS[row["primary"]][0]}', font=small, fill='#333333')
        top += ROW_H + CAPTION + GAP
    sheet = os.path.join(folder, f'{tag}-contact.jpg')
    canvas.save(sheet, quality=82)
    return sheet, rows, pages


def main(argv):
    """Builds the contact sheet of one proof."""
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--folder', required=True)
    parser.add_argument('--captures', required=True)
    args = parser.parse_args(argv)
    sheet, rows, pages = build(args.pdf, args.tag, args.folder, args.captures)
    mapping = os.path.join(args.folder, f'{args.tag}-pages.tsv')
    with open(mapping, 'w', encoding='utf-8') as handle:
        handle.write('page\tprinted_step\tprinted_name\tcapture\talso_starts\tcontinues\tlabel\n')
        for row in rows:
            name = STEPS[row['primary']][0] if row['primary'] else 'Thai article translation'
            others = ' '.join(str(number) for number in row['found'][1:]) or '-'
            continues = str(row['continued']) if row['continued'] else '-'
            handle.write(f'{row["page"]}\t{row["primary"]}\t{name}\t{row["capture"] or "-"}\t{others}\t{continues}\t{row["label"]}\n')
    print(f'CONTACT {args.tag}: {sheet} ({pages} pages, {len(rows)} tiles)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
