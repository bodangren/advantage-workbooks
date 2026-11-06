"""Writes MANIFEST.txt of the hand-off folder (track storytime_cover_options_20261106, FR-5.2).

Usage: python3 -I -B manifest.py <hand-off folder> [--check]

One line per file, sorted by name: SHA-256, two spaces, the size in bytes, two spaces, the path
relative to the folder. MANIFEST.txt itself is not listed. With --check, the script reads the
manifest and exits 1 when a line does not match its file or a file has no line.
"""
import hashlib
import os
import sys


def entries(root):
    out = []
    for base, _, files in os.walk(root):
        for name in files:
            path = os.path.join(base, name)
            relpath = os.path.relpath(path, root)
            if relpath == 'MANIFEST.txt':
                continue
            data = open(path, 'rb').read()
            out.append(f'{hashlib.sha256(data).hexdigest()}  {len(data)}  {relpath}')
    return sorted(out, key=lambda line: line.split('  ', 2)[2])


def main(argv):
    root = os.path.abspath(argv[0])
    lines = entries(root)
    path = os.path.join(root, 'MANIFEST.txt')
    if '--check' in argv:
        have = open(path, encoding='utf-8').read().splitlines()
        if have != lines:
            print('MANIFEST.txt differs from the files:')
            for line in sorted(set(have) ^ set(lines)):
                print(('  file:     ' if line in lines else '  manifest: ') + line)
            sys.exit(1)
        print(f'MANIFEST.txt matches {len(lines)} files')
        return
    open(path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'MANIFEST.txt: {len(lines)} files')


if __name__ == '__main__':
    main(sys.argv[1:])
