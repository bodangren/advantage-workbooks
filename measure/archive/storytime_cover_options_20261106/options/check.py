"""Checks the mockup PDFs of the Storytime cover options (track storytime_cover_options_20261106, AC-1, AC-2).

Usage: python3 -I -B check.py <hand-off folder>

For each of the 15 PDFs: one page at the print size of its kind (tolerance 1.5 pt); every approved
text of its kind is present (whitespace normalized); every word on the page is a word of the
approved texts of its kind (no new text); no forbidden word or year (spec FR-4.3); the Thai
characters of a back page are exactly the Thai characters of the five approved contact lines, and
no other page holds Thai. The text comes from `pdftotext` of the Chrome PDF (a PDF/X file drops
Thai tone marks). Exit 0 when every check passes, 1 when one fails.
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PT = 72 / 25.4
SIZES = {'student-front': (210, 297), 'student-back': (210, 297), 'teacher-front': (210, 297), 'reader-a3': (420, 297), 'reader-leaf': (198, 148.5)}
FORBIDDEN = [r'CEFR', r'\bPre[- ]?A1\b', r'\b[ABC][12]\b', r'Starters', r'Primary Advantage', r'\bGSE\b', r'\bYLE\b', r'Reading A-Z', r'\bRAZ\b', r'Chibi', r'Mitr', r'\b(19|20)\d\d\b']
THAI = re.compile(r'[฀-๿]')


def norm(text):
    return re.sub(r'\s+', ' ', text).strip()


def words(text):
    return set(re.findall(r"[\w@.\-·:!?;,'/]+", norm(text).replace('**', '')))


def expected(kind, a):
    if kind == 'student-back':
        heads = ['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']
        return [a['front'][0], *heads, *a['panel'].values(), 'LINE', *[l.replace('**', '') for l in a['contact']]]
    if kind.startswith('reader'):
        r = a['reader']
        return [r['title'], r['band'], a['front'][0], r['week'], r['role']]
    series, level, student, teacher, band = a['front']
    return [series, level, student] if kind == 'student-front' else [series, level, teacher, band]


def main(argv):
    out = os.path.abspath(argv[0])
    a = json.load(open(os.path.join(HERE, 'approved-text.json'), encoding='utf-8'))
    thai_ok = sorted(THAI.findall(''.join(a['contact'])))
    fails, rows = [], []
    pdfs = sorted(f for f in os.listdir(os.path.join(out, 'pdf')) if f.endswith('.pdf'))
    if len(pdfs) != 15:
        fails.append(f'{len(pdfs)} PDFs, not 15')
    for f in pdfs:
        path = os.path.join(out, 'pdf', f)
        kind = re.match(r'option-[ABC]-(.+)\.pdf$', f).group(1)
        info = subprocess.run(['pdfinfo', path], capture_output=True, text=True, check=True).stdout
        pages = int(re.search(r'Pages:\s+(\d+)', info).group(1))
        w, h = map(float, re.search(r'Page size:\s+([\d.]+) x ([\d.]+)', info).groups())
        ew, eh = (v * PT for v in SIZES[kind])
        text = subprocess.run(['pdftotext', path, '-'], capture_output=True, text=True, check=True).stdout
        flat = norm(text)
        exp = expected(kind, a)
        errs = []
        if pages != 1:
            errs.append(f'{pages} pages')
        if abs(w - ew) > 1.5 or abs(h - eh) > 1.5:
            errs.append(f'page {w:.2f} x {h:.2f} pt, expected {ew:.2f} x {eh:.2f}')
        errs += [f'missing "{e}"' for e in exp if norm(e) not in flat]
        extra = words(text) - set().union(*(words(e) for e in exp))
        if extra:
            errs.append(f'new words {sorted(extra)}')
        errs += [f'forbidden {p}' for p in FORBIDDEN if re.search(p, flat)]
        thai = sorted(THAI.findall(text))
        if kind == 'student-back' and thai != thai_ok:
            errs.append(f'Thai differs ({len(thai)} characters, {len(thai_ok)} approved)')
        if kind != 'student-back' and thai:
            errs.append(f'{len(thai)} Thai characters on a page without contact lines')
        rows.append(f'{"PASS" if not errs else "FAIL"} {f}: {w:.2f} x {h:.2f} pt, {len(exp)} approved texts, Thai {len(thai)}' + (f' -- {"; ".join(errs)}' if errs else ''))
        fails += [f'{f}: {e}' for e in errs]
    print('\n'.join(rows))
    print(f'{len(pdfs) - len({x.split(":")[0] for x in fails})} of {len(pdfs)} PDFs pass')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
