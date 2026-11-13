#!/usr/bin/env python3
"""Proves that every part 11 check function survives byte-equal in the part 12 check script.

Track storytime_cover_options_20261106, Task 2.9 part 12 step 8. Task 2.9 part 11 proved the same
fact for CHECK_1 to CHECK_12; this script proves it again for the part 12 file against
`print_gate_final_2_9k.py`.

Two regions of `print_gate_final_2_9l.py` must equal the same regions of `print_gate_final_2_9k.py`,
byte for byte:
1. the helper region, from the line `def run(cmd, args, cwd=None):` up to the line `def main(argv):`;
2. the check region, from the line `    # CHECK_1` up to the end of CHECK_12. In both files the
   region ends at the line `    # CHECK_13`.

It also prints the raw `git diff --no-index --numstat` of the two files, so a reviewer sees the full
extent of the change.

Usage: python3 -I -B gate-functions-2-9l.py

It prints the 2 verdicts, the compared line counts, and the numstat. It reads two Python sources and
no PDF.
"""

import os
import subprocess

RUNS = os.path.join(os.path.dirname(os.path.abspath(__file__)))
OLD = os.path.join(RUNS, 'print_gate_final_2_9k.py')
NEW = os.path.join(RUNS, 'print_gate_final_2_9l.py')

HELPER_START = 'def run(cmd, args, cwd=None):'
MAIN_START = 'def main(argv):'
CHECK_START = '    # CHECK_1'
OLD_CHECKS_END = '    # CHECK_13'
NEW_CHECKS_END = '    # CHECK_13'


def region(path, start, end):
    """Returns the text of one region: from the start line up to the end line."""
    lines = open(path, encoding='utf-8').read().splitlines()
    first = next(index for index, line in enumerate(lines) if line.startswith(start))
    last = next(index for index, line in enumerate(lines) if line.startswith(end))
    if last <= first:
        return None, 0
    return '\n'.join(lines[first:last]), last - first


def main():
    """Compares the 2 regions and prints the verdicts."""
    pairs = [
        ('HELPER', HELPER_START, MAIN_START, MAIN_START),
        ('CHECK_1_TO_12', CHECK_START, OLD_CHECKS_END, NEW_CHECKS_END),
    ]
    all_ok = True
    for label, start, old_end, new_end in pairs:
        old_text, old_count = region(OLD, start, old_end)
        new_text, new_count = region(NEW, start, new_end)
        same = old_text is not None and old_text == new_text
        all_ok = all_ok and same
        print('%s_LINES_OLD %d' % (label, old_count))
        print('%s_LINES_NEW %d' % (label, new_count))
        print('%s_BYTE_EQUAL %s' % (label, str(same).lower()))
    print('CHECK_FUNCTIONS_BYTE_EQUAL %s' % str(all_ok).lower())
    done = subprocess.run(['git', 'diff', '--no-index', '--numstat', OLD, NEW],
                          capture_output=True, text=True)
    print('NUMSTAT ' + done.stdout.strip().replace('\n', ' | '))
    return 0 if all_ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
