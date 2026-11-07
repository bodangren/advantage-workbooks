#!/usr/bin/env python3
"""Classify the rows of the text gate report of the teacher book build v1.

A row is page-list when the draft line and the book line differ ONLY by page-list content:
  (a) badge: the draft step title "<id> · <title>" against the book title "<id> <title>"
      (the book may merge two ids as "A6·D2"; the draft id must be one of them);
  (b) page reference: the book names "<student-book word> <page word> <n> (<x>)" where the draft names
      "student book: <x>";
  (c) re-wrap: a material line with such a page reference wraps in another place. The joined text of
      the neighbouring rows of the same week is compared after (a) and (b).
Thai words are built from code points, so this file holds no Thai literal.
"""
import os
import re
import sys

REPORT = os.path.expanduser('~/Desktop/print-ready/storytime/share-check-v1/teacher-book/text-gate-v1.txt')

T = lambda *cp: ''.join(chr(c) for c in cp)
# "student book" and "page" in Thai, as printed by the book
STUDENT_BOOK = T(0x0E2B, 0x0E19, 0x0E31, 0x0E07, 0x0E2A, 0x0E37, 0x0E2D, 0x0E19, 0x0E31, 0x0E01, 0x0E40, 0x0E23, 0x0E35, 0x0E22, 0x0E19)
PAGE = T(0x0E2B, 0x0E19, 0x0E49, 0x0E32)
EN_DASH = chr(0x2013)

ROW = re.compile(r'^  week (\d+) line (\d+): expected "(.*)" actual "(.*)"$')
HEAD = re.compile(r'^week (\d+): (\d+) difference\(s\) against ')

DRAFT_BADGE = re.compile(r'^([A-E]\d+) · (.*)$')
BOOK_BADGE = re.compile(r'^([A-E]\d+(?:·[A-E]\d+)*) (.*)$')
BOOK_REF = re.compile(re.escape(STUDENT_BOOK) + ' ' + re.escape(PAGE) + r' (\d+(?:' + EN_DASH + r'\d+)?) \((.+?)\)')


def ws(text):
    return re.sub(r'\s+', ' ', text).strip()


def strip_badge(draft, book):
    """Remove the badge of both lines when the draft id is one id of the book badge."""
    d = DRAFT_BADGE.match(draft)
    b = BOOK_BADGE.match(book)
    if d and b and d.group(1) in b.group(1).split('·'):
        return d.group(2), b.group(2), True
    return draft, book, False


def strip_refs(book):
    """Turn each book page reference into the draft form."""
    return BOOK_REF.subn(lambda m: 'student book: ' + m.group(2), book)


def page_list(draft, book):
    """Return the kind of page-list difference, or None."""
    d, b, badge = strip_badge(draft, book)
    b, refs = strip_refs(b)
    if ws(d) == ws(b) and (badge or refs):
        return 'badge' if badge else 'reference'
    return None


def main():
    rows = []
    heads = {}
    for line in open(REPORT, encoding='utf8').read().split('\n'):
        h = HEAD.match(line)
        if h:
            heads[int(h.group(1))] = int(h.group(2))
            continue
        m = ROW.match(line)
        if m:
            rows.append((int(m.group(1)), int(m.group(2)), m.group(3), m.group(4)))
        elif line.startswith('  week'):
            print('UNPARSED row: ' + line)
    if sum(heads.values()) != len(rows):
        print('HEADER MISMATCH: headers say %d, parsed %d' % (sum(heads.values()), len(rows)))

    kind = {}
    for i, (w, ln, d, b) in enumerate(rows):
        k = page_list(d, b)
        if k:
            kind[i] = k

    # (c) re-wrap: runs of rows with consecutive line numbers that no single-row rule explains
    i = 0
    rewrap = 0
    while i < len(rows):
        if i in kind:
            i += 1
            continue
        j = i
        while j + 1 < len(rows) and j + 1 not in kind and rows[j + 1][0] == rows[i][0] and rows[j + 1][1] == rows[j][1] + 1:
            j += 1
        draft = ' '.join(r[2] for r in rows[i:j + 1])
        book = ' '.join(r[3] for r in rows[i:j + 1])
        if j > i and page_list(draft, book):
            for n in range(i, j + 1):
                kind[n] = 'rewrap'
            rewrap += j - i + 1
        i = j + 1

    real = 0
    for n, (w, ln, d, b) in enumerate(rows):
        if n not in kind:
            real += 1
            print('REAL TEXT week %d line %d: expected "%s" actual "%s"' % (w, ln, d, b))
    counts = {k: sum(1 for v in kind.values() if v == k) for k in ('badge', 'reference', 'rewrap')}
    print('badge rows: %d' % counts['badge'])
    print('reference rows: %d' % counts['reference'])
    print('rewrap rows: %d' % counts['rewrap'])
    print('rows: %d' % len(rows))
    print('page-list: %d' % len(kind))
    print('real text: %d' % real)
    return 0


if __name__ == '__main__':
    sys.exit(main())
