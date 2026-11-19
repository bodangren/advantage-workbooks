"""The S5 proof manifest (track primary_v2_look_20261020, Phase S5, round 2).

It records the identity of the proof round: the git HEAD, the header values, the
SHA-256 of every package, proof HTML, stripped print copy, PDF, and contact
sheet, the page-box count, and the page count of every PDF. It prints file
names, hashes, and counts only.

The proof folder is set by S5_FOLDER (default proof-s5-r2).

Usage: python3 -I -B manifest.py [--out <file>]
"""

import argparse
import hashlib
import os
import re
import subprocess
import sys

REPO = '/home/daniebo/Desktop/Workbooks'
RUNS = os.path.join(REPO, 'measure/runs/primary_v2_look_20261020/proof-s5')
FOLDER = os.path.expanduser(os.environ.get('S5_FOLDER') or '~/Desktop/print-ready/primary-v2-look/proof-s5-r2')
PROOFS = ['quest5-l01', 'adventure92-l09']
HTML = {tag: os.path.join(RUNS, f'{tag}.html') for tag in PROOFS}
PACKAGE = {
    'quest5-l01': os.path.join(REPO, 'content/primary/quest-5/l01.json'),
    'adventure92-l09': os.path.join(REPO, 'content/primary/adventure-9.2/l09.json'),
}
SERIES = {'quest5-l01': 'Quest 5', 'adventure92-l09': 'Adventure 9.2'}
LEVEL = {'quest5-l01': 'A1', 'adventure92-l09': 'A2+'}


def sha256(path):
    """The SHA-256 of a file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def pages(pdf):
    """The labeled `Pages:` count of a PDF."""
    info = subprocess.run(['pdfinfo', '-box', pdf], capture_output=True, text=True).stdout
    match = re.search(r'^Pages:\s+(\d+)\s*$', info, re.M)
    return int(match.group(1)) if match else 0


def pagebox(tag):
    """The page-box count that the driver wrote for check P4."""
    path = os.path.join(FOLDER, f'{tag}-pagebox.txt')
    match = re.search(r'^\s*(\d+)\s*$', open(path, encoding='utf-8').read(), re.M) if os.path.isfile(path) else None
    return int(match.group(1)) if match else 0


def main(argv):
    """Writes the manifest of the proof round."""
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', default=os.path.join(RUNS, 'manifest-r2.txt'))
    args = parser.parse_args(argv)
    head = subprocess.run(['git', '-C', REPO, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
    lines = [
        f"S5 proof manifest, round {os.path.basename(FOLDER).rsplit('-', 1)[-1]}",
        f'proof_folder {FOLDER}',
        f'git_head {head}',
        'look chibi-quest',
    ]
    for tag in PROOFS:
        pdf = os.path.join(FOLDER, f'{tag}.pdf')
        sheet = os.path.join(FOLDER, f'{tag}-contact.jpg')
        print_copy = os.path.join(FOLDER, f'{tag}.print.html')
        lines.append(f'series {tag} {SERIES[tag]} {LEVEL[tag]}')
        lines.append(f'package {tag} {sha256(PACKAGE[tag])}')
        lines.append(f'html {tag} {sha256(HTML[tag])}')
        lines.append(f'print {tag} {sha256(print_copy)}')
        lines.append(f'pdf {tag} {sha256(pdf)}')
        lines.append(f'pagebox {tag} {pagebox(tag)}')
        lines.append(f'pages {tag} {pages(pdf)}')
        lines.append(f'contact {tag} {sha256(sheet)}')
    with open(args.out, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
