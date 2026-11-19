"""Thai filter for the S5 page proofs (track primary_v2_look_20261020, Phase S5).

It is the first command that touches a lesson package. It drops every `th` and
`*_th` key, every string with a character from U+0E00 to U+0E7F, and the part
after " | ". It writes the filtered copies under /tmp/opencode/thai-filtered/
and prints the proof line. It prints no Thai text.

Usage: python3 -I -B thai-filter.py <package.json>...
"""

import json
import os
import re
import sys

THAI = re.compile('[\u0e00-\u0e7f]')
OUT_ROOT = '/tmp/opencode/thai-filtered'
REPO = '/home/daniebo/Desktop/Workbooks'
DROP = object()


def clean_string(text):
    """Keeps the part before " | " and drops a string that holds Thai."""
    head = text.split(' | ')[0]
    return DROP if THAI.search(head) else head


def clean(node):
    """Cleans a package node: it drops the Thai keys and the Thai strings."""
    if isinstance(node, dict):
        out = {}
        for key, value in node.items():
            if key == 'th' or key.endswith('_th'):
                continue
            cleaned = clean(value)
            if cleaned is not DROP:
                out[key] = cleaned
        return out
    if isinstance(node, list):
        items = []
        for value in node:
            cleaned = clean(value)
            if cleaned is not DROP:
                items.append(cleaned)
        return items
    if isinstance(node, str):
        return clean_string(node)
    return node


def out_path(package_path):
    """The filtered copy path: the package path under the output root."""
    relative = os.path.relpath(os.path.abspath(package_path), REPO)
    return os.path.join(OUT_ROOT, relative)


def main(argv):
    """Filters every package and prints the proof line."""
    if not argv:
        print('usage: thai-filter.py <package.json>...')
        return 2
    thai_total = 0
    written = 0
    for package_path in argv:
        with open(package_path, encoding='utf-8') as handle:
            package = json.load(handle)
        filtered = clean(package)
        text = json.dumps(filtered, ensure_ascii=False, indent=1)
        thai_total += len(THAI.findall(text))
        target = out_path(package_path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, 'w', encoding='utf-8') as handle:
            handle.write(text)
        written += 1
        print('filtered %s -> %s' % (os.path.relpath(package_path, REPO), target))
    print('THAI_PROOF: %d Thai characters in %d filtered output files' % (thai_total, written))
    return 1 if thai_total else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
