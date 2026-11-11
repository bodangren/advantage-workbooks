#!/usr/bin/env python3
"""Runs one light step and saves the capture with the Thai line filter (Task 2.9 part 7).

Track storytime_cover_options_20261106. This script is the light-step form of
`heavy_capture_2_9g.py`. It runs a command outside the heavy-run wrapper, because the step is a
few seconds of PIL, node, or Python work.

One rule: every Thai line of the output is dropped before the capture is written, and the count of
dropped lines is printed. Reason: this role is a non-Claude model and must not see Thai text
(PM rule, 2026-11-09).

Usage: python3 -I -B light_capture_2_9f.py <capture file> <title> <command>

The command runs through bash in the repository root. The script prints the capture path, the exit
code, and the dropped-line count, and it exits 1 when the command exits not 0. The capture ends
with the two lines `THAI_LINES_DROPPED=<n>` and `EXIT=<n>`.
"""

import re
import subprocess
import sys

THAI = re.compile('[\u0e00-\u0e7f]')


def main(argv):
    """Runs the step and writes the capture."""
    capture_path, title, command = argv[0], argv[1], argv[2]
    done = subprocess.run(['bash', '-c', command], capture_output=True, text=True,
                          cwd='/home/daniebo/Desktop/Workbooks')
    lines = [f'CAPTURE of {title}', f'COMMAND: {command}', '']
    dropped = 0
    for stream, text in (('--- STDOUT ---', done.stdout), ('--- STDERR ---', done.stderr)):
        lines.append(stream)
        for line in text.rstrip('\n').splitlines():
            if THAI.search(line):
                dropped += 1
                continue
            lines.append(line)
        lines.append('')
    lines.append('THAI_LINES_DROPPED=%d' % dropped)
    lines.append('EXIT=%d' % done.returncode)
    with open(capture_path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    print('CAPTURE_FILE ' + capture_path)
    print('EXIT ' + str(done.returncode))
    print('THAI_LINES_DROPPED ' + str(dropped))
    return 0 if done.returncode == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
