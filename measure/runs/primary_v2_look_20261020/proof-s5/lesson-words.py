"""The longest Adventure 9 lesson (track primary_v2_look_20261020, Phase S5).

It reads only the filtered copies that `thai-filter.py` wrote under
/tmp/opencode/thai-filtered/. It counts the English words of the printed prose
(the `text`, `bank`, `print`, and `activities` sections) and the words of the
article paragraphs. It prints file names and counts only.

Usage: python3 -I -B lesson-words.py
"""

import json
import os
import sys

ROOT = '/tmp/opencode/thai-filtered/content/primary'
SECTIONS = ('text', 'bank', 'print', 'activities')
EXPECTED_BEST = 'adventure-9.2/l09.json'
EXPECTED_WORDS = 1310
EXPECTED_PARAGRAPH_WORDS = 476


def strings(node, out):
    """Collects every string of a node, without the Thai keys."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key == 'th' or key.endswith('_th'):
                continue
            strings(value, out)
    elif isinstance(node, list):
        for value in node:
            strings(value, out)
    elif isinstance(node, str):
        out.append(node)
    return out


def words(text):
    """The number of whitespace-separated tokens of the text."""
    return len(text.split())


def score(package):
    """The prose word count of a package and the word count of its paragraphs."""
    prose = []
    for section in SECTIONS:
        strings(package.get(section), prose)
    paragraphs = []
    strings((package.get('text') or {}).get('paragraphs'), paragraphs)
    return words(' '.join(prose)), words(' '.join(paragraphs))


def main():
    """Scores every Adventure 9 package and checks the longest one."""
    rows = []
    for book in ('adventure-9.1', 'adventure-9.2', 'adventure-9.3'):
        folder = os.path.join(ROOT, book)
        for name in sorted(os.listdir(folder)):
            if not name.endswith('.json'):
                continue
            with open(os.path.join(folder, name), encoding='utf-8') as handle:
                package = json.load(handle)
            prose, paragraphs = score(package)
            rows.append((f'{book}/{name}', prose, paragraphs))
    rows.sort(key=lambda row: (-row[1], row[0]))
    for name, prose, paragraphs in rows:
        print(f'{name} prose_words={prose} article_paragraph_words={paragraphs}')
    best = rows[0]
    print(f'LONGEST: {best[0]} prose_words={best[1]} article_paragraph_words={best[2]}')
    print(f'PACKAGES: {len(rows)}')
    if best[0] != EXPECTED_BEST or best[1] != EXPECTED_WORDS or best[2] != EXPECTED_PARAGRAPH_WORDS:
        print(f'FAIL: expected {EXPECTED_BEST} with {EXPECTED_WORDS} prose words and {EXPECTED_PARAGRAPH_WORDS} article paragraph words')
        return 1
    print(f'LONGEST_PROOF: {best[0]} is the longest Adventure 9 lesson ({best[1]} prose words, {best[2]} article paragraph words, {len(rows)} packages)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
