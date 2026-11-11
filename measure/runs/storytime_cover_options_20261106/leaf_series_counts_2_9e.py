#!/usr/bin/env python3
"""Prints counts of the leaf series line (Task 2.9 part 5, the C4 leaf diagnosis).

Track storytime_cover_options_20261106. The C4 check of the leaf print file counts
"Storytime Advantage" on each page, and 13 of the 14 pages give 0. This script prints counts only,
never the page text, so the role can see the shape of the fault.

For each page it prints: the count of "Storytime", the count of "Advantage", the count of the pair
"Storytime Advantage", and the smallest number of characters between "Storytime" and a later
"Advantage" on the page (0 when none follows).

Usage: python3 -I -B leaf_series_counts_2_9e.py <pdf file>
"""

import os
import re
import subprocess
import sys

THAI_LO, THAI_HI = 0x0E00, 0x0E7F


def has_thai(text):
    """Returns True when the text holds one Thai character."""
    return any(THAI_LO <= ord(ch) <= THAI_HI for ch in text)


def page_text(path, page):
    """Returns the text of one page."""
    done = subprocess.run(['pdftotext', '-f', str(page), '-l', str(page), path, '-'],
                          capture_output=True, text=True)
    return done.stdout


def main(argv):
    """Prints the counts of the 14 pages."""
    path = argv[0]
    pages = int(subprocess.run(['pdfinfo', path], capture_output=True, text=True).stdout
                .split('Pages:')[1].split()[0])
    print('PAGES %d' % pages)
    for page in range(1, pages + 1):
        text = page_text(path, page)
        if has_thai(text):
            print('PAGE %d THAI_LINES_PRESENT' % page)
            continue
        single = text.count('Storytime')
        second = text.count('Advantage')
        pair = text.count('Storytime Advantage')
        gaps = [match.start() for match in re.finditer('Storytime', text)]
        gaps = [match.start() for match in re.finditer('Advantage', text)] if gaps else []
        first_story = text.find('Storytime')
        first_advantage = text.find('Advantage')
        gap = (first_advantage - first_story) if 0 <= first_story < first_advantage else -1
        print('PAGE %d storytime=%d advantage=%d pair=%d first_gap=%d advantage_count=%d'
              % (page, single, second, pair, gap, len(gaps)))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
