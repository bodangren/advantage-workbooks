#!/usr/bin/env python3
"""Task 5.1 contact sheets (track storytime_l2_unit2_20261106).

Renders every page of each PDF of the proof folder with pdftoppm at a low resolution and puts
12 pages on one sheet (4 columns, 3 rows, the page number under each page). The sheets go to
<proof folder>/contact-sheets/. Run it inside one heavy-run.

Usage: python3 -I t51-contact-sheets.py <proof folder>
"""
import glob
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

COLS, ROWS, DPI, CELL_W = 4, 3, 40, 480


def sheets(pdf, out_dir):
    stem = os.path.splitext(os.path.basename(pdf))[0]
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['pdftoppm', '-r', str(DPI), '-png', pdf, os.path.join(tmp, 'p')], check=True)
        pages = sorted(glob.glob(os.path.join(tmp, 'p-*.png')), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))
        per = COLS * ROWS
        made = 0
        for start in range(0, len(pages), per):
            imgs = [Image.open(p).convert('RGB') for p in pages[start:start + per]]
            scaled = [im.resize((CELL_W, int(im.height * CELL_W / im.width))) for im in imgs]
            cell_h = max(im.height for im in scaled) + 24
            sheet = Image.new('RGB', (COLS * (CELL_W + 10) + 10, ROWS * (cell_h + 10) + 10), 'white')
            draw = ImageDraw.Draw(sheet)
            for i, im in enumerate(scaled):
                x = 10 + (i % COLS) * (CELL_W + 10)
                y = 10 + (i // COLS) * (cell_h + 10)
                sheet.paste(im, (x, y))
                draw.rectangle([x - 1, y - 1, x + im.width, y + im.height], outline='gray')
                draw.text((x, y + im.height + 4), f'page {start + i + 1}', fill='black')
            made += 1
            sheet.save(os.path.join(out_dir, f'{stem}-sheet-{made:02d}.jpg'), quality=80)
        return len(pages), made


def main():
    folder = sys.argv[1]
    out_dir = os.path.join(folder, 'contact-sheets')
    os.makedirs(out_dir, exist_ok=True)
    pdfs = sorted(glob.glob(os.path.join(folder, '*.pdf')) + glob.glob(os.path.join(folder, 'teacher-cover', '*_PDFX-1a.pdf')))
    total_pages = total_sheets = 0
    for pdf in pdfs:
        if pdf.endswith('-chrome.pdf'):
            continue
        n, m = sheets(pdf, out_dir)
        total_pages += n
        total_sheets += m
        print(f'{os.path.basename(pdf)}: {n} pages, {m} sheets')
    print(f'total: {total_pages} pages on {total_sheets} sheets in {out_dir}')


if __name__ == '__main__':
    main()
