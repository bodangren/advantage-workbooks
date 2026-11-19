"""Prints a log file without Thai text (track primary_v2_look_20261020, Phase S5).

The proof runs print their output to a log file. This script prints the log with
every Thai character replaced by "?" and prints the number of Thai characters it
found. It prints no Thai text.

Usage: python3 -I -B safe-print.py <log file>...
"""

import re
import sys

THAI = re.compile('[\u0e00-\u0e7f]')


def main(argv):
    """Prints each log file without its Thai characters."""
    for path in argv:
        with open(path, encoding='utf-8', errors='replace') as handle:
            text = handle.read()
        count = len(THAI.findall(text))
        print(f'--- {path} (thai_chars={count}) ---')
        print(THAI.sub('?', text).rstrip())
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
