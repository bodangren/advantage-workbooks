"""Inspect Ghostscript txtwrite XML structure without printing page text.

Prints tag and attribute names only. All text between tags is replaced by [T].
Used to build the S5.G8 paragraph line-pitch report; prints no Thai text.

Usage: python3 -I -B inspect-txtwrite.py <pdf> <page-number>
"""

import os
import re
import subprocess
import sys
import tempfile


def main(argv):
    """Dumps the txtwrite XML skeleton for one page."""
    pdf, page = argv[0], argv[1]
    handle = tempfile.NamedTemporaryFile(suffix='.xml', delete=False)
    target = handle.name
    handle.close()
    try:
        subprocess.run(
            ['gs', '-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=txtwrite', '-dTextFormat=0',
             '-dFirstPage=' + page, '-dLastPage=' + page,
             '-sOutputFile=' + target, pdf],
            capture_output=True,
        )
        with open(target, encoding='utf-8', errors='replace') as stream:
            data = stream.read()
    finally:
        if os.path.isfile(target):
            os.remove(target)
    skeleton = re.sub(r'>([^<]*)<', '>[T]<', data)
    for line in skeleton.splitlines()[:60]:
        print(line)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
