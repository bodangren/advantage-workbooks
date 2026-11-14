"""Contact sheets of every page of the 4 book proof files (P9, book proof r6, 2026-11-14).

Format of proof-unit1-v15/contact-sheets-student: 8 pages per sheet (4 columns, 2 rows),
file names sheet-001-008.png, a page number under each tile.
Run with: python3 -I p9_books_r6_contact.py
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

PROOF = "/home/daniebo/Desktop/print-ready/storytime/proof-books-r6-v1"
SETS = [
    ("student-cover", "student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r6_PDFX-1a.pdf", 2, 1),
    ("student-book", "student/Storytime-Advantage-L2-U1-Student-Book-v17_PDFX-1a.pdf", 136, 17),
    ("teacher-cover", "teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r6_PDFX-1a.pdf", 2, 1),
    ("teacher-book", "teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-v2_PDFX-1a.pdf", 224, 28),
]
COLS, ROWS, PER = 4, 2, 8
GAP = 10
TILE_W = 1237
TILE_H = round(TILE_W * 841.92 / 594.96)
LABEL_H = 70
SHEET_W = COLS * TILE_W + (COLS + 1) * GAP
SHEET_H = ROWS * (TILE_H + LABEL_H) + (ROWS + 1) * GAP
DPI = 150
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 44)


def page_count(pdf):
    out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True, check=True).stdout
    return int(re.search(r"^Pages:\s+(\d+)", out, re.M).group(1))


def render(pdf, first, last, tmp):
    prefix = os.path.join(tmp, "p")
    subprocess.run(
        ["pdftoppm", "-r", str(DPI), "-f", str(first), "-l", str(last), "-png", pdf, prefix],
        check=True,
    )
    files = {}
    for name in os.listdir(tmp):
        m = re.match(r"p-0*(\d+)\.png$", name)
        if m:
            files[int(m.group(1))] = os.path.join(tmp, name)
    return files


def make_sheet(pdf, first, last, out_path, tmp):
    files = render(pdf, first, last, tmp)
    sheet = Image.new("RGB", (SHEET_W, SHEET_H), "white")
    draw = ImageDraw.Draw(sheet)
    for i, page in enumerate(range(first, last + 1)):
        col, row = i % COLS, i // COLS
        x = GAP + col * (TILE_W + GAP)
        y = GAP + row * (TILE_H + LABEL_H + GAP)
        with Image.open(files[page]) as im:
            tile = im.convert("RGB").resize((TILE_W, TILE_H), Image.LANCZOS)
        sheet.paste(tile, (x, y))
        draw.rectangle([x - 1, y - 1, x + TILE_W, y + TILE_H], outline=(150, 150, 150), width=2)
        label = str(page)
        w = draw.textlength(label, font=FONT)
        draw.text((x + (TILE_W - w) / 2, y + TILE_H + 10), label, fill=(0, 0, 0), font=FONT)
    sheet.save(out_path, optimize=True)
    for f in files.values():
        os.remove(f)


def main():
    ok = True
    for name, rel, want_pages, want_sheets in SETS:
        pdf = os.path.join(PROOF, rel)
        pages = page_count(pdf)
        out_dir = os.path.join(PROOF, "contact-sheets", name)
        os.makedirs(out_dir, exist_ok=True)
        sheets = 0
        covered = 0
        for first in range(1, pages + 1, PER):
            last = min(first + PER - 1, pages)
            tmp = tempfile.mkdtemp(prefix="p9r6-")
            try:
                out = os.path.join(out_dir, "sheet-%03d-%03d.png" % (first, last))
                make_sheet(pdf, first, last, out, tmp)
            finally:
                shutil.rmtree(tmp, ignore_errors=True)
            sheets += 1
            covered += last - first + 1
        verdict = "OK" if (pages == want_pages and covered == want_pages and sheets == want_sheets) else "MISMATCH"
        if verdict != "OK":
            ok = False
        print("%s: pages=%d covered=%d sheets=%d expected_sheets=%d %s dir=%s" % (
            name, pages, covered, sheets, want_sheets, verdict, out_dir))
        sys.stdout.flush()
    print("RESULT: %s" % ("ALL OK" if ok else "MISMATCH"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
