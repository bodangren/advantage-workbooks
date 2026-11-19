"""The S5 proof checks (track primary_v2_look_20261020, Phase S5, round 2).

Each check of the strategy runs alone and writes its own result file. The
checks read produced bytes, source text, and rasterized pages. They print
counts, file names, and English step names only. They print no Thai text.

Round 2 strengthens P2 to P6, adds P10 (the book header and the PDF title), and
adds P11 (the lesson pictures). Round 3 adds P12 (every picture caption prints
on the page of its picture). Round 5 adds P13 (every picture keeps its aspect
ratio) and makes P8 compare the manifest git_head with the product at HEAD.
Round 6 adds the P8 commit-id validation and narrows the P8 render scope.
Round 7 (S5 fix round 2) sets the P8 scope to four Git pathspecs (review A r4
F21) and adds P14 (hero width 84.8 mm), P15 (step-header gap), and P16 (label
size and italic face).
P7 also asserts that the stripped print copy
holds no unpkg script tag, and P8 compares the proof HTML hash and the tracked
state of `dashboard` and `content`.

The round is set by S5_ROUND (default r2), and every path can be overridden for
a falsification run: S5_RUNS, S5_FOLDER, S5_CAPTURES, S5_FILTERED, S5_MANIFEST,
S5_PRINT_READY, and S5_RESULTS. The real run sets none of them.

Usage: python3 -I -B checks.py --check P1 ... --assemble
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys

from PIL import Image, ImageFont

REPO = '/home/daniebo/Desktop/Workbooks'
ROUND = os.environ.get('S5_ROUND') or 'r2'
RUNS = os.environ.get('S5_RUNS') or os.path.join(REPO, 'measure/runs/primary_v2_look_20261020/proof-s5')
FOLDER = os.environ.get('S5_FOLDER') or os.path.expanduser(f'~/Desktop/print-ready/primary-v2-look/proof-s5-{ROUND}')
CAPTURES = os.environ.get('S5_CAPTURES') or '/home/daniebo/Desktop/advantage-pr/assets/screenshots/primary-advantage/parity-run2-2026-10-19/student'
FILTERED = os.environ.get('S5_FILTERED') or '/tmp/opencode/thai-filtered'
PRINT_READY = os.environ.get('S5_PRINT_READY') or os.path.expanduser('~/Desktop/print-ready')
PROOFS = ['quest5-l01', 'adventure92-l09']
HTML = {tag: os.path.join(RUNS, f'{tag}.html') for tag in PROOFS}
PACKAGE = {
    'quest5-l01': os.path.join(REPO, 'content/primary/quest-5/l01.json'),
    'adventure92-l09': os.path.join(REPO, 'content/primary/adventure-9.2/l09.json'),
}
MANIFEST = os.environ.get('S5_MANIFEST') or os.path.join(RUNS, f'manifest-{ROUND}.txt')
RESULTS = os.environ.get('S5_RESULTS') or RUNS
SERIES = {'quest5-l01': 'Quest 5', 'adventure92-l09': 'Adventure 9.2'}
LEVEL = {'quest5-l01': 'A1', 'adventure92-l09': 'A2+'}
THAI = re.compile('[\u0e00-\u0e7f]')
PAGE = {'width': 595.28, 'height': 807.87, 'slack': 2}
TILE = {'width': 827, 'height': 1123, 'dpi': 100}
ROW_H, GAP, HEAD = 1123, 28, 70
CAPTION_LINES, LINE_H = 3, 38
CAPTION = CAPTION_LINES * LINE_H
GAP_LIMIT = 20.0
WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">([^<]*)</word>')
FONT_FILE = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'andika-bold.ttf')
# The printed step of every page and the app capture of that step (plan.md task
# S4.1 and the app step map; steps 9, 10, and 11 have no single app step).
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
NAMES = [STEPS[number][0] for number in sorted(STEPS)]
CLASSIC_ONLY = [
    'Before You Read', 'Key Vocabulary', 'Read the Article', 'Collect Vocabulary',
    'Deep Reading Notes', 'Collect Sentences', 'Comprehension Check', 'Guided Response',
    'Lesson Reflection',
]


def sha256(path):
    """The SHA-256 of a file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def pdfinfo(pdf):
    """The `pdfinfo -box` output of a PDF."""
    return subprocess.run(['pdfinfo', '-box', pdf], capture_output=True, text=True).stdout


def page_count(pdf):
    """The labeled `Pages:` count of a PDF."""
    match = re.search(r'^Pages:\s+(\d+)\s*$', pdfinfo(pdf), re.M)
    return int(match.group(1)) if match else 0


def pagebox(tag):
    """The page-box count that the driver got from `renderPagedPdf`, or 0."""
    path = os.path.join(FOLDER, f'{tag}-pagebox.txt')
    if not os.path.isfile(path):
        return 0
    match = re.search(r'^\s*(\d+)\s*$', open(path, encoding='utf-8').read(), re.M)
    return int(match.group(1)) if match else 0


def pdf_text(pdf):
    """The flattened text of a PDF (no whitespace)."""
    text = subprocess.run(['pdftotext', pdf, '-'], capture_output=True, text=True).stdout
    return re.sub(r'\s+', '', text)


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


def expected_rows(pdf, pages):
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
        rows.append({'page': page, 'primary': primary, 'others': found[1:], 'continued': continued, 'translation': translation})
        if found:
            previous = found[-1]
    return rows


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


def check_p1():
    """P1: the page is the book page (210 x 285 mm)."""
    lines, ok = [], True
    for tag in PROOFS:
        info = pdfinfo(os.path.join(FOLDER, f'{tag}.pdf'))
        match = re.search(r'^Page size:\s+([\d.]+) x ([\d.]+) pts', info, re.M)
        if not match:
            lines.append(f'P1 {tag}: FAIL no labeled Page size')
            ok = False
            continue
        width, height = float(match.group(1)), float(match.group(2))
        good = abs(width - PAGE['width']) <= PAGE['slack'] and abs(height - PAGE['height']) <= PAGE['slack']
        lines.append(f'P1 {tag}: page_size {width} x {height} pt (want {PAGE["width"]} x {PAGE["height"]}, slack {PAGE["slack"]})')
        ok = ok and good
    return ok, lines


def check_p2():
    """P2: the PDF lists fonts, every font is embedded, and no font is Type 3."""
    lines, ok = [], True
    for tag in PROOFS:
        out = subprocess.run(['pdffonts', os.path.join(FOLDER, f'{tag}.pdf')], capture_output=True, text=True).stdout
        rows = [line.split() for line in out.splitlines() if line.strip() and not line.startswith('-')]
        rows = [row for row in rows if row and row[0] != 'name']
        type3 = [row[0] for row in rows if 'Type 3' in ' '.join(row)]
        # As `parsePdffonts` in lib/print/pdfx.ts reads the `emb` column.
        loose = [row[0] for row in rows if len(row) < 5 or row[-5] != 'yes']
        lines.append(f'P2 {tag}: fonts {len(rows)}, type3 {len(type3)}, not_embedded {len(loose)}')
        ok = ok and bool(rows) and not type3 and not loose
    return ok, lines


def check_p3():
    """P3: each of the 13 names occurs once, in order, and no classic-only name occurs."""
    lines, ok = [], True
    for tag in PROOFS:
        text = pdf_text(os.path.join(FOLDER, f'{tag}.pdf'))
        counts = {name: text.count(re.sub(r'\s+', '', name)) for name in NAMES}
        missing = [name for name in NAMES if counts[name] == 0]
        doubled = [name for name in NAMES if counts[name] > 1]
        positions = [text.find(re.sub(r'\s+', '', name)) for name in NAMES]
        order_ok = not missing and all(positions[i] < positions[i + 1] for i in range(len(positions) - 1))
        classic = [name for name in CLASSIC_ONLY if re.sub(r'\s+', '', name) in text]
        lines.append(f'P3 {tag}: names_present {len(NAMES) - len(missing)} of {len(NAMES)}, once_each {not doubled}, in_order {order_ok}, classic_only_present {len(classic)}')
        if missing:
            lines.append(f'P3 {tag}: missing {", ".join(missing)}')
        if doubled:
            lines.append(f'P3 {tag}: name occurs more than once {", ".join(doubled)}')
        if classic:
            lines.append(f'P3 {tag}: classic names present {", ".join(classic)}')
        ok = ok and not missing and not doubled and order_ok and not classic
    return ok, lines


def check_p4():
    """P4: the PDF page count equals the independent page-box count and the tiles."""
    lines, ok = [], True
    for tag in PROOFS:
        pages = page_count(os.path.join(FOLDER, f'{tag}.pdf'))
        boxes = pagebox(tag)
        tiles = len([name for name in os.listdir(os.path.join(FOLDER, f'{tag}-pages')) if name.endswith('.png')])
        rows = sum(1 for _line in open(os.path.join(FOLDER, f'{tag}-pages.tsv'), encoding='utf-8').read().splitlines()[1:])
        lines.append(f'P4 {tag}: pdf_pages {pages}, page_boxes {boxes}, tiles {tiles}, sheet_rows {rows}')
        ok = ok and pages > 0 and pages == boxes == tiles == rows
    return ok, lines


def check_p5():
    """P5: one tile per page, the right capture on each row, and a label that fits."""
    lines, ok = [], True
    font = ImageFont.truetype(FONT_FILE, 30)
    for tag in PROOFS:
        pdf = os.path.join(FOLDER, f'{tag}.pdf')
        pages = page_count(pdf)
        sheet = os.path.join(FOLDER, f'{tag}-contact.jpg')
        sheet_ok = os.path.isfile(sheet) and os.path.getsize(sheet) > 0
        if not sheet_ok:
            lines.append(f'P5 {tag}: FAIL no contact sheet')
            ok = False
            continue
        with Image.open(sheet) as image:
            sheet_size = image.size
        rows = [line.split('\t') for line in open(os.path.join(FOLDER, f'{tag}-pages.tsv'), encoding='utf-8').read().splitlines()[1:]]
        want_h = HEAD + GAP + len(rows) * (ROW_H + CAPTION + GAP)
        want_w = GAP + TILE['width'] + GAP + 1699 + GAP
        expected = expected_rows(pdf, pages)
        problems = []
        pairs = 0
        previous = 0
        for row in rows:
            page, step, name, capture, others, continues, label = int(row[0]), int(row[1]), row[2], row[3], row[4], row[5], row[6]
            if page != previous + 1:
                problems.append(f'page {page} is out of order')
            previous = page
            tile = os.path.join(FOLDER, f'{tag}-pages', f'page-{page:02d}.png')
            if not os.path.exists(tile):
                tile = os.path.join(FOLDER, f'{tag}-pages', f'page-{page}.png')
            if not os.path.exists(tile):
                problems.append(f'page {page} has no tile')
            else:
                with Image.open(tile) as image:
                    if abs(image.width - TILE['width']) > 2 or abs(image.height - TILE['height']) > 2:
                        problems.append(f'page {page} tile {image.width}x{image.height}')
            want = expected[page - 1] if page <= len(expected) else {'primary': -1, 'others': [], 'continued': 0, 'translation': False}
            want_step, want_others, continued, translation = want['primary'], want['others'], want['continued'], want['translation']
            want_capture = '-' if not want_step else (STEPS[want_step][1] or '-')
            if step != want_step:
                problems.append(f'page {page} step {step} but the page holds {want_step}')
            if (others if others != '-' else '') != ' '.join(str(number) for number in want_others):
                problems.append(f'page {page} also_starts {others} but the page holds {want_others}')
            if (continues if continues != '-' else '') != (str(continued) if continued else ''):
                problems.append(f'page {page} continues {continues} but the page holds {continued}')
            if capture != want_capture:
                problems.append(f'page {page} capture {capture} but the step wants {want_capture}')
            if capture != '-':
                if not os.path.isfile(os.path.join(CAPTURES, capture)):
                    problems.append(f'page {page} capture file missing {capture}')
                else:
                    pairs += 1
            if translation and 'Thai article translation' not in label:
                problems.append(f'page {page} is the translation page but the label does not say so')
            if not translation and 'Thai article translation' in label:
                problems.append(f'page {page} is not the translation page but the label says so')
            if f'printed page {page}' not in label:
                problems.append(f'page {page} label has no page number')
            wrapped = wrap_label(label, font, TILE['width'])
            if len(wrapped) > CAPTION_LINES:
                problems.append(f'page {page} label needs {len(wrapped)} lines of {CAPTION_LINES}')
            for line in wrapped:
                if font.getlength(line) > TILE['width']:
                    problems.append(f'page {page} label line is {round(font.getlength(line))} px of {TILE["width"]}')
        lines.append(f'P5 {tag}: tiles {len(rows)} of {pages} pages, capture_pairs {pairs}, sheet {sheet_size[0]}x{sheet_size[1]} (want {want_w}x{want_h})')
        if problems:
            lines.append(f'P5 {tag}: problems {"; ".join(problems[:12])}')
        ok = ok and not problems and len(rows) == pages and sheet_size == (want_w, want_h)
    return ok, lines


def check_p6():
    """P6: the Thai filter proof; only filtered output reaches this role."""
    lines, ok = [], True
    total = 0
    files = 0
    for root, _dirs, names in os.walk(FILTERED):
        for name in names:
            if not name.endswith('.json'):
                continue
            with open(os.path.join(root, name), encoding='utf-8') as handle:
                total += len(THAI.findall(handle.read()))
            files += 1
    lines.append(f'P6: filtered files {files}, thai characters {total}')
    untracked = []
    for tag in PROOFS:
        result = subprocess.run(['git', '-C', REPO, 'ls-files', '--error-unmatch', HTML[tag]], capture_output=True, text=True)
        if result.returncode == 0:
            untracked.append(tag)
    lines.append(f'P6: proof HTML files tracked by git {len(untracked)} of {len(PROOFS)} (the Thai files stay untracked)')
    ok = ok and files > 0 and total == 0 and not untracked
    return ok, lines


def check_p7():
    """P7: the chibi-quest body, and a stripped print copy with no unpkg tag."""
    lines, ok = [], True
    for tag in PROOFS:
        with open(HTML[tag], encoding='utf-8') as handle:
            text = handle.read()
        body = re.search(r'<body[^>]*>', text)
        first = body.group(0) if body else ''
        classic = text.count('look-classic')
        print_copy = os.path.join(FOLDER, f'{tag}.print.html')
        stripped = 0
        if os.path.isfile(print_copy):
            with open(print_copy, encoding='utf-8') as handle:
                stripped = handle.read().count('unpkg')
        else:
            lines.append(f'P7 {tag}: FAIL no stripped print copy {print_copy}')
        good = 'look-chibi-quest' in first and classic == 0 and os.path.isfile(print_copy) and stripped == 0
        lines.append(f'P7 {tag}: first_body_tag_holds_chibi {"look-chibi-quest" in first}, classic_class_count {classic}, print_copy_unpkg {stripped}')
        ok = ok and good
    return ok, lines


# The P8 render scope (review A r4 F21, review A r3 F19). Four Git pathspecs cover every render
# input: the app code and fonts under dashboard (except its tests), and the two lesson folders.
P8_SCOPE = [
    'dashboard',
    ':(exclude)dashboard/__tests__',
    'content/primary/quest-5',
    'content/primary/adventure-9.2',
]
COMMIT_ID = re.compile(r'[0-9a-f]{7,40}')


def check_p8():
    """P8: the manifest matches the HTML, the packages, the PDFs, and the sheets."""
    lines, ok = [], True
    if not os.path.isfile(MANIFEST):
        lines.append('P8: FAIL no manifest')
        return False, lines
    manifest = open(MANIFEST, encoding='utf-8').read()
    head = re.search(r'^git_head (\S+)$', manifest, re.M)
    if not head:
        lines.append('P8: FAIL the manifest has no git_head line')
        return False, lines
    built = head.group(1)
    lines.append(f'P8: manifest git_head {built}')
    # Review B r3 F5: a crafted value must never reach Git as an option.
    if not COMMIT_ID.fullmatch(built):
        lines.append('P8: FAIL the manifest git_head is not a hex commit id; no manifest value reaches Git as an option')
        return False, lines
    head_now = subprocess.run(['git', '-C', REPO, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
    product = subprocess.run(
        ['git', '-C', REPO, 'diff', '--quiet', '--end-of-options', built, head_now, '--', *P8_SCOPE],
        capture_output=True, text=True,
    )
    product_changed = product.returncode != 0
    lines.append(f'P8: head at check {head_now}, same_head {head_now == built}, product_changed_since_manifest {product_changed}')
    lines.append('P8: render scope 4 pathspecs (dashboard except its tests; the 2 lesson folders)')
    ok = ok and not product_changed
    for tag in PROOFS:
        entries = (
            ('package', PACKAGE[tag]),
            ('html', HTML[tag]),
            ('pdf', os.path.join(FOLDER, f'{tag}.pdf')),
            ('contact', os.path.join(FOLDER, f'{tag}-contact.jpg')),
        )
        for kind, path in entries:
            want = sha256(path)
            found = re.search(rf'^{kind} {tag} (\S+)$', manifest, re.M)
            good = bool(found) and found.group(1) == want
            lines.append(f'P8 {tag}: {kind} sha256 match {good}')
            ok = ok and good
    status = subprocess.run(['git', '-C', REPO, 'status', '--porcelain', '--', *P8_SCOPE], capture_output=True, text=True).stdout.splitlines()
    dirty = [line for line in status if not line.startswith('??')]
    lines.append(f'P8: tracked files edited in the render scope {len(dirty)}')
    ok = ok and not dirty
    return ok, lines


def check_p9():
    """P9: no Quest 5 printer file exists before the approval line."""
    lines, ok = [], True
    found = []
    for root, _dirs, names in os.walk(PRINT_READY):
        for name in names:
            if name.startswith('Primary-Advantage-Quest-5'):
                found.append(os.path.join(root, name))
    lines.append(f'P9: printer files before approval {len(found)}')
    return ok and not found, lines


def check_p10():
    """P10: the page-1 header and the PDF title carry the book name and level."""
    lines, ok = [], True
    for tag in PROOFS:
        with open(HTML[tag], encoding='utf-8') as handle:
            text = handle.read()
        match = re.search(r'<div class="workbook-title">([^<]*)</div>', text)
        want = f'Primary Advantage \u2022 {SERIES[tag]} \u2022 {LEVEL[tag]}'
        exact = bool(match) and match.group(1).strip() == want
        doubled = 'Primary Advantage \u2022 Primary Advantage' in text
        title = re.search(r'^Title:\s+(.+)$', pdfinfo(os.path.join(FOLDER, f'{tag}.pdf')), re.M)
        want_title = f'Primary Advantage Workbook - {SERIES[tag]}'
        title_ok = bool(title) and title.group(1).strip() == want_title
        lines.append(f'P10 {tag}: workbook_title_exact {exact}, product_name_doubled {doubled}, pdf_title_has_book {title_ok}')
        ok = ok and exact and not doubled and title_ok
    return ok, lines


def check_p11():
    """P11: every lesson picture is in the proof HTML and in the PDF."""
    lines, ok = [], True
    for tag in PROOFS:
        with open(HTML[tag], encoding='utf-8') as handle:
            text = handle.read()
        srcs = re.findall(r'<img[^>]+src="(file://[^"]+)"', text)
        missing = [src for src in srcs if not os.path.isfile(src[len('file://'):])]
        with open(PACKAGE[tag], encoding='utf-8') as handle:
            want = len(json.load(handle).get('images') or [])
        out = subprocess.run(['pdfimages', '-list', os.path.join(FOLDER, f'{tag}.pdf')], capture_output=True, text=True).stdout
        images = [line for line in out.splitlines() if re.match(r'^\s*\d+\s+\d+\s+image\b', line)]
        lines.append(f'P11 {tag}: package_pictures {want}, html_file_pictures {len(srcs)}, pdf_images {len(images)}, missing_srcs {len(missing)}')
        ok = ok and want > 0 and len(srcs) >= want and len(images) >= want and not missing
    return ok, lines


def pdf_image_pages(pdf):
    """The pages of the PDF images, in document order."""
    out = subprocess.run(['pdfimages', '-list', pdf], capture_output=True, text=True).stdout
    return [int(line.split()[0]) for line in out.splitlines() if re.match(r'^\s*\d+\s+\d+\s+image\b', line)]


def pdf_page_text(pdf, page):
    """The flattened text of one page, with single spaces."""
    text = subprocess.run(['pdftotext', '-f', str(page), '-l', str(page), pdf, '-'], capture_output=True, text=True).stdout
    return re.sub(r'\s+', ' ', text)


def filtered_package(tag):
    """The Thai-filtered package of a proof: English fields only."""
    return os.path.join(FILTERED, os.path.relpath(PACKAGE[tag], REPO))


def check_p12():
    """P12: every picture caption prints on the page of its picture."""
    lines, ok = [], True
    for tag in PROOFS:
        with open(filtered_package(tag), encoding='utf-8') as handle:
            captions = [image.get('caption') or '' for image in (json.load(handle).get('images') or [])]
        pdf = os.path.join(FOLDER, f'{tag}.pdf')
        total = page_count(pdf)
        pictures = pdf_image_pages(pdf)
        texts = [pdf_page_text(pdf, page) for page in range(1, total + 1)]
        pairs = 0
        for index, caption in enumerate(captions):
            want = re.sub(r'\s+', ' ', caption).strip()
            # A caption can also occur in the article prose, so P12 needs one occurrence on
            # the page of the picture, not the only occurrence.
            found = [page for page, text in enumerate(texts, 1) if want and want in text]
            picture = pictures[index] if index < len(pictures) else 0
            same = picture > 0 and picture in found
            pairs += 1 if same else 0
            where = ','.join(str(page) for page in found) or 'absent'
            lines.append(f'P12 {tag}: caption {index + 1} pages {where}, picture page {picture}, same_page {same}')
        counts = len(captions) > 0 and len(captions) == len(pictures)
        lines.append(f'P12 {tag}: captions {len(captions)}, pictures {len(pictures)}, captions_on_picture_page {pairs}, counts_match {counts}')
        ok = ok and counts and pairs == len(captions)
    return ok, lines


def pdf_image_ppi(pdf):
    """The page, pixel width, pixel height, x-ppi, and y-ppi of every image, in document order."""
    out = subprocess.run(['pdfimages', '-list', pdf], capture_output=True, text=True).stdout
    rows = []
    for line in out.splitlines():
        if not re.match(r'^\s*\d+\s+\d+\s+image\b', line):
            continue
        parts = line.split()
        rows.append((int(parts[0]), float(parts[3]), float(parts[4]), float(parts[12]), float(parts[13])))
    return rows


def check_p13():
    """P13: every picture keeps its aspect ratio (x-ppi and y-ppi within 2 percent)."""
    lines, ok = [], True
    for tag in PROOFS:
        rows = pdf_image_ppi(os.path.join(FOLDER, f'{tag}.pdf'))
        off = 0
        for page, _width, _height, x_ppi, y_ppi in rows:
            high = max(x_ppi, y_ppi)
            delta = abs(x_ppi - y_ppi) / high if high else 1.0
            square = delta <= 0.02
            off += 0 if square else 1
            lines.append(f'P13 {tag}: page {page} x_ppi {x_ppi:g} y_ppi {y_ppi:g} ratio_delta {delta:.4f} within_2pct {square}')
        lines.append(f'P13 {tag}: images {len(rows)}, ratio_off {off}')
        ok = ok and len(rows) > 0 and off == 0
    return ok, lines


P15_DPI = 300
P15_MIN_MM = 3.0
P16_MIN_PX = 10.66
WORD_BOX = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>')


def check_p14():
    """P14: the hero prints at full inline width, 84.8 mm within 1 mm."""
    lines, ok = [], True
    for tag in PROOFS:
        rows = pdf_image_ppi(os.path.join(FOLDER, f'{tag}.pdf'))
        page, width_px, _height, x_ppi, _y_ppi = rows[0] if rows else (0, 0, 0, 0, 0)
        width_mm = width_px / x_ppi * 25.4 if x_ppi else 0
        exact = abs(width_mm - 84.8) <= 1.0
        lines.append(f'P14 {tag}: hero page {page} width_px {width_px:g} x_ppi {x_ppi:g} width_mm {width_mm:.2f} within_1mm {exact}')
        ok = ok and exact
    return ok, lines


def page_title_boxes(pdf, page):
    """The top, left, right (points) and step number of each step title on the page."""
    out = subprocess.run(['pdftotext', '-bbox', '-f', str(page), '-l', str(page), pdf, '-'], capture_output=True, text=True).stdout
    words = [(float(x0), float(y0), float(x1), float(y1), text) for x0, y0, x1, y1, text in WORD_BOX.findall(out)]
    found = []
    lines_by_y = {}
    for word in words:
        lines_by_y.setdefault(round(word[1], 1), []).append(word)
    for items in lines_by_y.values():
        items = sorted(items)
        joined = ' '.join(item[4] for item in items)
        for index, name in enumerate(NAMES, 1):
            if name not in joined:
                continue
            parts = [item for item in items if item[4] in name.split()]
            if parts:
                found.append((min(part[1] for part in parts), min(part[0] for part in parts), max(part[2] for part in parts), index))
    return found


def pixel_gap_mm(image, top_pt, left_pt, right_pt):
    """The white gap in mm between the header block and the nearest ink above it."""
    scale = P15_DPI / 72.0
    y = int(top_pt * scale)
    cx = int((left_pt + right_pt) / 2 * scale)
    if cx < 0 or cx >= image.width:
        return None
    pixels = image.load()

    def dark(row):
        r, g, b = pixels[cx, row][:3]
        return min(r, g, b) < 245

    while y >= 0 and dark(y):
        y -= 1
    sign_top = y
    while y >= 0 and not dark(y):
        y -= 1
    if y < 0:
        return None
    return (sign_top - y) * 25.4 / P15_DPI


def check_p15():
    """P15: no step header sits within 3 mm of the element above it (300 dpi pixel column)."""
    lines, ok = [], True
    for tag in PROOFS:
        pdf = os.path.join(FOLDER, f'{tag}.pdf')
        gaps = []
        for page in range(1, page_count(pdf) + 1):
            boxes = page_title_boxes(pdf, page)
            if not boxes:
                continue
            prefix = os.path.join('/tmp/opencode', f'p15-{tag}-{page}')
            subprocess.run(['pdftoppm', '-r', str(P15_DPI), '-f', str(page), '-l', str(page), '-png', '-singlefile', pdf, prefix], check=True)
            image = Image.open(prefix + '.png').convert('RGB')
            for top, left, right, index in boxes:
                gap = pixel_gap_mm(image, top, left, right)
                if gap is not None:
                    gaps.append((gap, page, index))
            os.remove(prefix + '.png')
        tight = [row for row in gaps if row[0] < P15_MIN_MM]
        for gap, page, index in gaps:
            lines.append(f'P15 {tag}: page {page} step {index} gap_mm {gap:.2f}')
        smallest = min((row[0] for row in gaps), default=0)
        lines.append(f'P15 {tag}: headers {len(gaps)}, below_{P15_MIN_MM:g}mm {len(tight)}, method pixel_{P15_DPI}dpi, min_mm {smallest:.2f}')
        ok = ok and len(gaps) > 0 and not tight
    return ok, lines


def check_p16():
    """P16: no text run prints under 8 pt, and no italic face prints (counts only)."""
    lines, ok = [], True
    for tag in PROOFS:
        pdf = os.path.join(FOLDER, f'{tag}.pdf')
        xml = subprocess.run(['pdftohtml', '-xml', '-i', '-stdout', pdf], capture_output=True, text=True).stdout
        sizes = {int(m.group(1)): float(m.group(2)) for m in re.finditer(r'<fontspec id="(\d+)" size="([\d.]+)"', xml)}
        runs = {}
        for match in re.finditer(r'<text[^>]*font="(\d+)"', xml):
            font = int(match.group(1))
            runs[font] = runs.get(font, 0) + 1
        under = sum(count for font, count in runs.items() if sizes.get(font, 0) < P16_MIN_PX)
        smallest = min((sizes.get(font, 0) for font in runs), default=0)
        fonts = subprocess.run(['pdffonts', pdf], capture_output=True, text=True).stdout.splitlines()[2:]
        italic = [line.split()[0] for line in fonts if line.split() and re.search(r'italic|oblique', line.split()[0], re.I)]
        lines.append(f'P16 {tag}: text runs {sum(runs.values())}, runs_under_8pt {under}, smallest_size_px {smallest:g}, italic_fonts {len(italic)}')
        for name in italic:
            lines.append(f'P16 {tag}: italic face {name}')
        ok = ok and sum(runs.values()) > 0 and under == 0 and not italic
    return ok, lines


CHECKS = {
    'P1': check_p1, 'P2': check_p2, 'P3': check_p3, 'P4': check_p4, 'P5': check_p5,
    'P6': check_p6, 'P7': check_p7, 'P8': check_p8, 'P9': check_p9, 'P10': check_p10,
    'P11': check_p11, 'P12': check_p12, 'P13': check_p13, 'P14': check_p14,
    'P15': check_p15, 'P16': check_p16,
}


def result_path(name):
    """The result file of one check of this round."""
    return os.path.join(RESULTS, f'check-{name}-{ROUND}.txt')


def assemble():
    """Writes the check record with the exit code of every check."""
    lines = [f'S5 proof checks, round {ROUND}', f'proof folder {FOLDER}', '']
    failures = 0
    for name in sorted(CHECKS, key=lambda item: int(item[1:])):
        path = result_path(name)
        if not os.path.isfile(path):
            lines.append(f'{name}: exit MISSING (the check did not run)')
            failures += 1
            continue
        body = open(path, encoding='utf-8').read().splitlines()
        code = next((line.split()[-1] for line in body if line.startswith('exit ')), '?')
        if code != '0':
            failures += 1
        lines.append(f'{name}: exit {code}')
        lines.extend(f'  {line}' for line in body if not line.startswith('exit '))
    lines.append('')
    lines.append(f'checks run {len(CHECKS)}, failures {failures}')
    lines.append('RESULT: PASS' if failures == 0 else 'RESULT: FAIL')
    with open(os.path.join(RESULTS, f'checks-{ROUND}.txt'), 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))
    return 1 if failures else 0


def main(argv):
    """Runs one check or assembles the record."""
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', choices=sorted(CHECKS))
    parser.add_argument('--assemble', action='store_true')
    args = parser.parse_args(argv)
    if args.assemble:
        return assemble()
    ok, lines = CHECKS[args.check]()
    code = 0 if ok else 1
    with open(result_path(args.check), 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
        handle.write(f'exit {code}\n')
    print('\n'.join(lines))
    print(f'exit {code}')
    return code


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
