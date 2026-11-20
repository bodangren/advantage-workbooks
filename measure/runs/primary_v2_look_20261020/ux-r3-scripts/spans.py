"""Extract text spans (page, font, size, bbox, class counts) from a PDF through Ghostscript txtwrite.

Prints and writes no page text. Thai characters count as a class only.

Usage: python3 -I -B spans.py <pdf> <out.tsv>
"""

import html
import os
import re
import subprocess
import sys
import tempfile

THAI_LOW = 0x0E00
THAI_HIGH = 0x0E7F


def page_count(pdf):
    """The page count of a PDF, read from pdfinfo."""
    out = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
    return int(re.search(r'Pages:\s+(\d+)', out).group(1))


def page_xml(pdf, page):
    """The Ghostscript txtwrite XML of one page."""
    handle = tempfile.NamedTemporaryFile(suffix='.xml', delete=False)
    target = handle.name
    handle.close()
    try:
        subprocess.run(
            ['gs', '-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=txtwrite', '-dTextFormat=0',
             '-dFirstPage=%d' % page, '-dLastPage=%d' % page,
             '-sOutputFile=' + target, pdf],
            capture_output=True,
        )
        with open(target, encoding='utf-8', errors='replace') as stream:
            return stream.read()
    finally:
        if os.path.isfile(target):
            os.remove(target)


SPAN = re.compile(r'<span\s+([^>]*)>(.*?)</span>', re.S)


def main(argv):
    """Writes one TSV row for each span of each page."""
    pdf, out = argv[0], argv[1]
    rows = []
    for page in range(1, page_count(pdf) + 1):
        data = page_xml(pdf, page)
        for match in SPAN.finditer(data):
            attrs, body = match.group(1), match.group(2)
            bbox = re.search(r'bbox="([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)"', attrs)
            size = re.search(r'size="([\d.]+)"', attrs)
            font = re.search(r'font="([^"]*)"', attrs)
            if not (bbox and size and font):
                continue
            text = html.unescape(re.sub(r'<[^>]+>', '', body))
            thai = sum(1 for ch in text if THAI_LOW <= ord(ch) <= THAI_HIGH)
            rows.append((page, font.group(1), float(size.group(1)),
                         float(bbox.group(1)), float(bbox.group(2)),
                         float(bbox.group(3)), float(bbox.group(4)),
                         len(text), thai))
    with open(out, 'w', encoding='utf-8') as stream:
        stream.write('page\tfont\tsize\tx0\ty0\tx1\ty1\tnchars\tthai\n')
        for row in rows:
            stream.write('\t'.join(str(v) for v in row) + '\n')
    print('spans', len(rows), 'pages', page_count(pdf))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
