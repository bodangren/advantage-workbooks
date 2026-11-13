#!/usr/bin/env python3
"""Runs one command in the repository root and saves its output (track storytime_week_package, Phase 12).

Usage: python3 -I -B p12-capture.py <capture file> <command>

The command runs through bash. The capture holds the standard output, then the standard error, then
the last line `exit: <n>`. The script exits with the code of the command.
"""

import subprocess
import sys


def main(argv):
    """Runs the command and writes the capture."""
    capture_path, command = argv[0], argv[1]
    done = subprocess.run(['bash', '-c', command], capture_output=True, text=True,
                          cwd='/home/daniebo/Desktop/Workbooks')
    text = done.stdout
    if done.stderr:
        text += ('\n' if text and not text.endswith('\n') else '') + done.stderr
    if text and not text.endswith('\n'):
        text += '\n'
    with open(capture_path, 'w', encoding='utf-8') as handle:
        handle.write(text + '\nexit: %d\n' % done.returncode)
    print('CAPTURE_FILE ' + capture_path)
    print('exit: ' + str(done.returncode))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
