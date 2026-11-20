"""Paragraph line pitch from Ghostscript txtwrite (track primary_v2_look_20261020).

Reads one page of a proof PDF. Reports only sizes, x/y positions, and line
pitches in points. It prints no page text and no Thai text.

Usage: python3 -I -B line-pitch.py <pdf> <page> <min-x> <label>
"""

import os
import re
import subprocess
import sys
import tempfile
from statistics import median


def spans(pdf, page):
    """The (x0, baseline, size) of every txtwrite span on one page."""
    handle = tempfile.NamedTemporaryFile(suffix='.xml', delete=False)
    target = handle.name
    handle.close()
    try:
        subprocess.run(
            ['gs', '-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=txtwrite', '-dTextFormat=0',
             '-dFirstPage=' + str(page), '-dLastPage=' + str(page),
             '-sOutputFile=' + target, pdf],
            capture_output=True,
        )
        with open(target, encoding='utf-8', errors='replace') as stream:
            data = stream.read()
    finally:
        if os.path.isfile(target):
            os.remove(target)
    out = []
    for match in re.finditer(r'<span\s+([^>]*)>', data):
        attrs = match.group(1)
        bbox = re.search(r'bbox="([\d.]+)\s+([\d.]+)\s+[\d.]+\s+[\d.]+"', attrs)
        size = re.search(r'size="([\d.]+)"', attrs)
        if bbox and size:
            out.append((float(bbox.group(1)), float(bbox.group(2)), float(size.group(1))))
    return out


def main(argv):
    """Prints the median line pitch of the 12 pt article spans on one page."""
    pdf, page, min_x, label = argv[0], int(argv[1]), float(argv[2]), argv[3]
    rows = [row for row in spans(pdf, page) if abs(row[2] - 12.0) < 0.05 and row[0] >= min_x]
    baselines = sorted(set(int(round(row[1])) for row in rows))
    pitches = [b - a for a, b in zip(baselines, baselines[1:]) if 0 < b - a < 100]
    print('%s page %d: 12pt spans %d, x_min %.0f, baselines %d, pitches %d' % (
        label, page, len(rows), min_x, len(baselines), len(pitches)))
    if pitches:
        print('%s pitch values %s' % (label, ','.join(str(p) for p in pitches)))
        print('%s median_pitch_pt %.1f min %d max %d' % (
            label, median(pitches), min(pitches), max(pitches)))
    else:
        print('%s median_pitch_pt NA' % label)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
