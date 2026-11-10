"""Builds Daniel's look package of the unit 2 pictures (Task 2.8 prep, track storytime_l2_unit2_20261106).

It reads the union of the 3 Forge folders through the committed stage 1 captures, and it writes one
contact sheet for each week, one sheet for the open row hat-pip, rows.tsv, README.md, and MANIFEST.txt
into a new handoff folder. It prints counts, ids, sizes, and hashes only.
"""
import csv, hashlib, json, os, re
from PIL import Image, ImageDraw, ImageFont

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_l2_unit2_20261106/"
H = "/home/daniebo/Desktop/handoff/"
FOLDERS = {"main": H + "storytime-l2u2-book-pictures", "retry1": H + "storytime-l2u2-book-pictures-retry1",
           "repair1": H + "storytime-l2u2-book-pictures-repair1"}
MANIFESTS = {"main": "46f9e723c8fef18647b11bcafa6faa72e8d8442f01ceb0b8f74e812b607a242c",
             "retry1": "0e7a5223ac4c238bd1d84e025835f9443bc825a871e5668c5407398fcb0be748",
             "repair1": "09dfa9f03b12c2042c70fc4a63970e23e7fe15ebb84cd7dfd25993691732de7e"}
CAPS = {k: RUNS + "picture-check-u2-%s.txt" % k for k in FOLDERS}
OUT = H + "storytime-l2u2-picture-look-2026-11-11"
REPORT = RUNS + "picture-look-2-8.txt"
HATPIP = "l2-w10-story-page-put-on-your-hat-pip"
ND = FOLDERS["repair1"] + "/not-delivered/"
HP_COLOR = ND + HATPIP + "-m3-color-print.png"
HP_LINE = ND + HATPIP + "-m3-line-print-2.png"
REASON = "Teacher Kim wears round glasses; Pip has no red collar and no gold tag"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
THAI = re.compile("[฀-๿]")
W, PAD = 2000, 20
CELL = (W - 3 * PAD) // 2
IMG2 = (CELL - PAD) // 2
F_ID = ImageFont.truetype(FONT, 24)
F_TAG = ImageFont.truetype(FONT, 18)
F_TITLE = ImageFont.truetype(BOLD, 34)
GREY = (90, 90, 90)

assert not os.path.exists(OUT), "the output folder exists"
assert not os.path.exists(REPORT), "the report exists"


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


for key, value in MANIFESTS.items():
    assert sha(FOLDERS[key] + "/MANIFEST.txt") == value, "the MANIFEST.txt hash of %s differs" % key
passed = {}
for key, path in CAPS.items():
    passed[key] = {line[6:].strip() for line in open(path, encoding="utf-8").read().splitlines() if line.startswith("pass  ")}
rows = json.load(open(REPO + "/content/storytime/drafts/l2/print/pictures-u2.json", encoding="utf-8"))
assert len(rows) == 229, "the list does not hold 229 rows"


def fit(path, width):
    im = Image.open(path)
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        back = Image.new("RGBA", im.size, "white")
        back.alpha_composite(im)
        im = back
    im = im.convert("RGB")
    return im.resize((width, round(im.size[1] * width / im.size[0])), Image.LANCZOS)


table, weeks, sources = [], {}, {k: 0 for k in FOLDERS}
for row in rows:
    week = row["id"].split("-")[1]
    src = [k for k in FOLDERS if row["id"] in passed[k]]
    assert len(src) in (0, 1), "a row passes in 2 folders: " + row["id"]
    if not src:
        assert row["id"] == HATPIP, "an open row that is not hat-pip: " + row["id"]
        weeks.setdefault(week, []).append((row, None))
        continue
    sources[src[0]] += 1
    color = os.path.join(FOLDERS[src[0]], row["fileName"])
    line = None if row["use"] == "card" else os.path.join(FOLDERS[src[0]], row["lineArtFileName"])
    assert os.path.exists(color), "a missing color file: " + color
    assert line is None or os.path.exists(line), "a missing line file: " + str(line)
    table.append([row["id"], week, row["use"], src[0], row["fileName"], sha(color),
                  row["lineArtFileName"] if line else "", sha(line) if line else ""])
    weeks.setdefault(week, []).append((row, (color, line)))
assert len(table) == 228, "the union does not hold 228 delivered rows"


def cell(row, files):
    if files is None:
        c = Image.new("RGB", (CELL, 300 + 70), "white")
        d = ImageDraw.Draw(c)
        d.rectangle([0, 0, CELL - 1, 300], fill=(225, 225, 225))
        d.text((20, 130), "not delivered: see hat-pip.jpg", font=F_ID, fill="black")
        d.text((0, 330), row["id"], font=F_ID, fill="black")
        return c
    color, line = files
    a = fit(color, IMG2)
    b = fit(line, IMG2) if line else None
    h = max(a.size[1], b.size[1]) if b else a.size[1]
    c = Image.new("RGB", (CELL, h + 70), "white")
    c.paste(a, (0, 0))
    d = ImageDraw.Draw(c)
    if b:
        c.paste(b, (IMG2 + PAD, 0))
        d.text((0, h + 4), "color", font=F_TAG, fill=GREY)
        d.text((IMG2 + PAD, h + 4), "line", font=F_TAG, fill=GREY)
    else:
        d.text((0, h + 4), "color (card: the card kit prints only the color file)", font=F_TAG, fill=GREY)
    d.text((0, h + 30), row["id"], font=F_ID, fill="black")
    return c


def sheet(title, subtitle, cells, path):
    pairs = [cells[i:i + 2] for i in range(0, len(cells), 2)]
    head = 110
    height = head + sum(max(x.size[1] for x in pair) + PAD for pair in pairs) + PAD
    s = Image.new("RGB", (W, height), "white")
    d = ImageDraw.Draw(s)
    d.text((PAD, 16), title, font=F_TITLE, fill="black")
    d.text((PAD, 64), subtitle, font=F_ID, fill=GREY)
    y = head
    for pair in pairs:
        for j, x in enumerate(pair):
            s.paste(x, (PAD + j * (CELL + PAD), y))
        y += max(x.size[1] for x in pair) + PAD
    s.save(path, "JPEG", quality=90)
    return s.size


os.makedirs(OUT)
report, counts = [], {}
for week in sorted(weeks):
    items = weeks[week]
    delivered = sum(1 for _, files in items if files)
    counts[week] = (len(items), delivered)
    name = "contact-sheet-%s.jpg" % week
    size = sheet("Storytime Level 2 unit 2, week %d: %d rows, %d delivered" % (int(week[1:]), len(items), delivered),
                 "Book rows: the color print left, the line print right. Card rows: the color print only.",
                 [cell(row, files) for row, files in items], os.path.join(OUT, name))
    report.append("%s: %d rows, %d delivered, %d x %d px" % (name, len(items), delivered, size[0], size[1]))

a, b = fit(HP_COLOR, CELL), fit(HP_LINE, CELL)
h = max(a.size[1], b.size[1])
s = Image.new("RGB", (W, 110 + h + 110), "white")
d = ImageDraw.Draw(s)
d.text((PAD, 16), HATPIP + ": not delivered (1 of 229 rows)", font=F_TITLE, fill="black")
d.text((PAD, 64), "Left: color m3 (judge pass). Right: line try 3 (both judges fail, class wrong-character).", font=F_ID, fill=GREY)
s.paste(a, (PAD, 110))
s.paste(b, (2 * PAD + CELL, 110))
d.text((PAD, 110 + h + 16), "Judge reason: " + REASON + ".", font=F_ID, fill="black")
d.text((PAD, 110 + h + 56), "Color: %s   Line: %s" % (os.path.basename(HP_COLOR), os.path.basename(HP_LINE)), font=F_TAG, fill=GREY)
s.save(os.path.join(OUT, "hat-pip.jpg"), "JPEG", quality=90)
report.append("hat-pip.jpg: %d x %d px; color %s; line %s" % (s.size[0], s.size[1], sha(HP_COLOR), sha(HP_LINE)))

with open(os.path.join(OUT, "rows.tsv"), "w", encoding="utf-8", newline="") as fh:
    writer = csv.writer(fh, delimiter="\t", lineterminator="\n")
    writer.writerow(["row_id", "week", "use", "source_folder", "color_file", "color_sha256", "line_file", "line_sha256"])
    writer.writerows(table)

per_week = ", ".join("week %d: %d rows (%d delivered)" % (int(w[1:]), n, k) for w, (n, k) in sorted(counts.items()))
per_folder = "; ".join("%s `%s` (MANIFEST.txt SHA-256 %s): %d rows" % (k, FOLDERS[k] + "/", MANIFESTS[k], sources[k]) for k in FOLDERS)
readme = "\n".join([
    "# Storytime Level 2 unit 2: the picture look package (2026-11-11)",
    "",
    "This folder is the look package of Task 2.8, Daniel's look at the unit 2 pictures. The pictures are model evidence, not acceptance.",
    "",
    "## What each file holds",
    "",
    "- `contact-sheet-w09.jpg` to `contact-sheet-w16.jpg`: one sheet for each week. Each cell shows one row of the picture list, with the row id under it. A book row shows the color print on the left and the line print on the right, because the student book prints the line art. A card row shows the color print only, because the card kit prints only the color file.",
    "- `hat-pip.jpg`: the 1 row that Forge did not deliver, `%s`. It shows the color m3 (judge pass) and the line try 3 (both judges fail). The judge reason: %s." % (HATPIP, REASON),
    "- `rows.tsv`: one line for each delivered row, with the week, the use, the source folder, and the file name and SHA-256 of the color file and of the line file.",
    "- `MANIFEST.txt`: the SHA-256 of every other file of this folder.",
    "",
    "## Counts",
    "",
    "- The picture list holds 229 rows. Forge delivered 228 of 229 rows. The 1 open row is hat-pip.",
    "- Rows per sheet: %s." % per_week,
    "- Each picture comes from the Forge folder whose job passed the stage 1 check: %s." % per_folder,
    "- The 4 card rows hippo, ruler, clap, and cold have a line of 9, 8, 11, and 10 px, under the 12 px rule. The PM accepted this as a recorded exception, because the card kit prints only the color file.",
    "- 9 rows of weeks 10 and 16 use a unit 1 picture again. They are outside the list of 229 rows and outside these sheets.",
    "",
    "## Check",
    "",
    "Run `sha256sum -c MANIFEST.txt` in this folder.",
    ""])
open(os.path.join(OUT, "README.md"), "w", encoding="utf-8").write(readme)

names = sorted(n for n in os.listdir(OUT) if n != "MANIFEST.txt")
for n in names:
    if n.endswith((".md", ".tsv")):
        assert not THAI.search(open(os.path.join(OUT, n), encoding="utf-8").read()), "Thai text in " + n
manifest = "".join("%s  %s\n" % (sha(os.path.join(OUT, n)), n) for n in names)
open(os.path.join(OUT, "MANIFEST.txt"), "w", encoding="utf-8").write(manifest)
report.append("rows.tsv: %d delivered rows; sources %s" % (len(table), sources))
report.append("MANIFEST.txt: %d lines, SHA-256 %s" % (len(names), sha(os.path.join(OUT, "MANIFEST.txt"))))
for n in names:
    report.append("%s  %d bytes  %s" % (sha(os.path.join(OUT, n)), os.path.getsize(os.path.join(OUT, n)), n))
open(REPORT, "w", encoding="utf-8").write("\n".join(["# Task 2.8 prep: the look package " + OUT] + report) + "\n")
print("\n".join(report))
