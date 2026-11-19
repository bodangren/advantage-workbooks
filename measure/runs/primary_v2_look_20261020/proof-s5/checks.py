"""The S5 proof checks (track primary_v2_look_20261020, Phase S5).

Each check of the strategy runs alone and writes its own result file. The
checks read produced bytes, source text, and rasterized pages. They print
counts, file names, and English step names only. They print no Thai text.

Usage: python3 -I -B checks.py --check P1 ... --assemble
"""

import argparse
import hashlib
import os
import re
import subprocess
import sys

from PIL import Image

REPO = '/home/daniebo/Desktop/Workbooks'
RUNS = os.path.join(REPO, 'measure/runs/primary_v2_look_20261020/proof-s5')
FOLDER = os.path.expanduser('~/Desktop/print-ready/primary-v2-look/proof-s5-r1')
CAPTURES = '/home/daniebo/Desktop/advantage-pr/assets/screenshots/primary-advantage/parity-run2-2026-10-19/student'
FILTERED = '/tmp/opencode/thai-filtered'
PROOFS = ['quest5-l01', 'adventure92-l09']
HTML = {tag: os.path.join(RUNS, f'{tag}.html') for tag in PROOFS}
PACKAGE = {
    'quest5-l01': os.path.join(REPO, 'content/primary/quest-5/l01.json'),
    'adventure92-l09': os.path.join(REPO, 'content/primary/adventure-9.2/l09.json'),
}
MANIFEST = os.path.join(RUNS, 'manifest-r1.txt')
THAI = re.compile('[\u0e00-\u0e7f]')
PAGE = {'width': 595.28, 'height': 807.87, 'slack': 2}
TILE = {'width': 827, 'height': 1123, 'dpi': 100}
ROW_H, GAP, HEAD, CAPTION = 1123, 28, 70, 54
NAMES = [
    'Introduction', 'Preview Vocabulary', 'First Reading', 'Vocabulary Collection',
    'Deep Reading', 'Sentence Collection', 'Multiple Choice', 'Short Answer',
    'Vocabulary Practice', 'Sentence Practice', 'Guided Writing', 'Language Questions',
    'Lesson Summary',
]
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


def pdf_text(pdf):
    """The flattened text of a PDF (no whitespace)."""
    text = subprocess.run(['pdftotext', pdf, '-'], capture_output=True, text=True).stdout
    return re.sub(r'\s+', '', text)


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
    """P2: every font is embedded and no font is Type 3."""
    lines, ok = [], True
    for tag in PROOFS:
        out = subprocess.run(['pdffonts', os.path.join(FOLDER, f'{tag}.pdf')], capture_output=True, text=True).stdout
        rows = [line.split() for line in out.splitlines() if line.strip() and not line.startswith('-')]
        rows = [row for row in rows if row and row[0] != 'name']
        type3 = [row[0] for row in rows if 'Type 3' in ' '.join(row)]
        loose = [row[0] for row in rows if 'yes' not in row]
        lines.append(f'P2 {tag}: fonts {len(rows)}, type3 {len(type3)}, not_embedded {len(loose)}')
        ok = ok and not type3 and not loose
    return ok, lines


def check_p3():
    """P3: the 13 names of the S4.1 table in order, and no classic-only name."""
    lines, ok = [], True
    for tag in PROOFS:
        text = pdf_text(os.path.join(FOLDER, f'{tag}.pdf'))
        positions = []
        for name in NAMES:
            key = re.sub(r'\s+', '', name)
            position = text.find(key)
            positions.append((name, position))
        missing = [name for name, position in positions if position < 0]
        order_ok = all(positions[i][1] < positions[i + 1][1] for i in range(len(positions) - 1)) if not missing else False
        classic = [name for name in CLASSIC_ONLY if re.sub(r'\s+', '', name) in text]
        lines.append(f'P3 {tag}: names_present {len(NAMES) - len(missing)} of {len(NAMES)}, in_order {order_ok}, classic_only_present {len(classic)}')
        if missing:
            lines.append(f'P3 {tag}: missing {", ".join(missing)}')
        if classic:
            lines.append(f'P3 {tag}: classic names present {", ".join(classic)}')
        ok = ok and not missing and order_ok and not classic
    return ok, lines


def check_p4():
    """P4: the labeled page count is above zero and equals the tile count."""
    lines, ok = [], True
    for tag in PROOFS:
        pages = page_count(os.path.join(FOLDER, f'{tag}.pdf'))
        tiles = len([name for name in os.listdir(os.path.join(FOLDER, f'{tag}-pages')) if name.endswith('.png')])
        rows = sum(1 for _line in open(os.path.join(FOLDER, f'{tag}-pages.tsv'), encoding='utf-8').read().splitlines()[1:])
        lines.append(f'P4 {tag}: pages {pages}, tiles {tiles}, sheet_rows {rows}')
        ok = ok and pages > 0 and pages == tiles == rows
    return ok, lines


def check_p5():
    """P5: one rasterized tile per page at 100 dpi, paired with the app capture."""
    lines, ok = [], True
    for tag in PROOFS:
        pages = page_count(os.path.join(FOLDER, f'{tag}.pdf'))
        sheet = os.path.join(FOLDER, f'{tag}-contact.jpg')
        sheet_ok = os.path.isfile(sheet) and os.path.getsize(sheet) > 0
        with Image.open(sheet) as image:
            sheet_size = image.size
        rows = [line.split('\t') for line in open(os.path.join(FOLDER, f'{tag}-pages.tsv'), encoding='utf-8').read().splitlines()[1:]]
        want_h = HEAD + GAP + len(rows) * (ROW_H + CAPTION + GAP)
        want_w = GAP + TILE['width'] + GAP + 1699 + GAP
        pairs = 0
        missing_captures = []
        bad_tiles = []
        for row in rows:
            page = int(row[0])
            tile = os.path.join(FOLDER, f'{tag}-pages', f'page-{page:02d}.png')
            if not os.path.exists(tile):
                tile = os.path.join(FOLDER, f'{tag}-pages', f'page-{page}.png')
            if not os.path.exists(tile):
                bad_tiles.append(f'page {page} has no tile')
                continue
            with Image.open(tile) as image:
                if abs(image.width - TILE['width']) > 2 or abs(image.height - TILE['height']) > 2:
                    bad_tiles.append(f'page {page} tile {image.width}x{image.height}')
            if row[3] != '-':
                if os.path.isfile(os.path.join(CAPTURES, row[3])):
                    pairs += 1
                else:
                    missing_captures.append(row[3])
        labelled = [row for row in rows if row[3] == '-']
        lines.append(f'P5 {tag}: tiles {len(rows)} of {pages} pages, capture_pairs {pairs}, labelled_rows_without_capture {len(labelled)}, sheet {sheet_size[0]}x{sheet_size[1]} (want {want_w}x{want_h})')
        if bad_tiles:
            lines.append(f'P5 {tag}: tile problem {", ".join(bad_tiles)}')
        if missing_captures:
            lines.append(f'P5 {tag}: missing capture {", ".join(missing_captures)}')
        ok = ok and sheet_ok and not bad_tiles and not missing_captures and len(rows) == pages and sheet_size == (want_w, want_h)
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
    ok = ok and total == 0 and not untracked
    return ok, lines


def check_p7():
    """P7: the wrapper body holds the chibi-quest class and no classic class."""
    lines, ok = [], True
    for tag in PROOFS:
        with open(HTML[tag], encoding='utf-8') as handle:
            text = handle.read()
        body = re.search(r'<body[^>]*>', text)
        first = body.group(0) if body else ''
        classic = text.count('look-classic')
        good = 'look-chibi-quest' in first and classic == 0
        lines.append(f'P7 {tag}: first_body_tag_holds_chibi {"look-chibi-quest" in first}, classic_class_count {classic}')
        ok = ok and good
    return ok, lines


def check_p8():
    """P8: the manifest records the git HEAD, the packages, the PDFs, and the sheets."""
    lines, ok = [], True
    if not os.path.isfile(MANIFEST):
        lines.append('P8: FAIL no manifest')
        return False, lines
    manifest = open(MANIFEST, encoding='utf-8').read()
    head = re.search(r'^git_head (\S+)$', manifest, re.M)
    if not head:
        lines.append('P8: FAIL the manifest has no git_head line')
        return False, lines
    lines.append(f'P8: manifest git_head {head.group(1)}')
    for tag in PROOFS:
        for kind, path in (('package', PACKAGE[tag]), ('pdf', os.path.join(FOLDER, f'{tag}.pdf')), ('contact', os.path.join(FOLDER, f'{tag}-contact.jpg'))):
            want = sha256(path)
            found = re.search(rf'^{kind} {tag} (\S+)$', manifest, re.M)
            good = bool(found) and found.group(1) == want
            lines.append(f'P8 {tag}: {kind} sha256 match {good}')
            ok = ok and good
    diff = subprocess.run(['git', '-C', REPO, 'diff', '--name-only', f'{head.group(1)}..HEAD', '--', 'dashboard', 'content'], capture_output=True, text=True).stdout.split()
    lines.append(f'P8: product files changed between the manifest head and HEAD {len(diff)}')
    ok = ok and not diff
    return ok, lines


def check_p9():
    """P9: no printer file exists before the approval line."""
    lines, ok = [], True
    found = []
    for root, _dirs, names in os.walk(os.path.expanduser('~/Desktop/print-ready')):
        for name in names:
            if name == 'Primary-Advantage-Quest-5_PDFX-1a.pdf':
                found.append(os.path.join(root, name))
    lines.append(f'P9: printer files before approval {len(found)}')
    return ok and not found, lines


CHECKS = {
    'P1': check_p1, 'P2': check_p2, 'P3': check_p3, 'P4': check_p4, 'P5': check_p5,
    'P6': check_p6, 'P7': check_p7, 'P8': check_p8, 'P9': check_p9,
}


def assemble():
    """Writes the check record with the exit code of every check."""
    lines = ['S5 proof checks, round 1', f'proof folder {FOLDER}', '']
    failures = 0
    for name in sorted(CHECKS):
        path = os.path.join(RUNS, f'check-{name}.txt')
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
    with open(os.path.join(RUNS, 'checks-r1.txt'), 'w', encoding='utf-8') as handle:
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
    with open(os.path.join(RUNS, f'check-{args.check}.txt'), 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
        handle.write(f'exit {code}\n')
    print('\n'.join(lines))
    print(f'exit {code}')
    return code


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
