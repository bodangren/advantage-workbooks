"""Count accessibility-relevant markup in a proof print HTML file. Prints numbers only (no page text).

Checks: the html lang attribute, the number of img elements and how many lack a non-empty alt,
the heading levels in order of use, lang attributes on Thai blocks, and the title element.

Usage: python3 -I -B html_semantics.py <print.html> <label>
"""

import re
import sys

THAI_LOW = 0x0E00
THAI_HIGH = 0x0E7F


def main(argv):
    """Prints the markup counts for one HTML file."""
    path, label = argv[0], argv[1]
    html = open(path, encoding='utf-8', errors='replace').read()
    html_tag = re.search(r'<html[^>]*>', html)
    lang = re.search(r'lang="([^"]*)"', html_tag.group(0)) if html_tag else None
    imgs = re.findall(r'<img\b[^>]*>', html)
    no_alt = [i for i in imgs if not re.search(r'\balt="[^"]+"', i)]
    headings = [int(m) for m in re.findall(r'<h([1-6])\b', html)]
    seq = []
    for h in headings:
        if not seq or seq[-1] != h:
            seq.append(h)
    thai_lang = len(re.findall(r'lang="th"', html))
    thai_chars = sum(1 for ch in html if THAI_LOW <= ord(ch) <= THAI_HIGH)
    title = re.search(r'<title>([^<]*)</title>', html)
    print('%s html lang=%s; title present %s; imgs %d (without alt %d); headings %d, level sequence %s; lang="th" attributes %d; thai characters in file %d' % (
        label, lang.group(1) if lang else 'none', bool(title), len(imgs), len(no_alt), len(headings),
        ','.join(str(s) for s in seq[:24]), thai_lang, thai_chars))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
