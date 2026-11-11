#!/usr/bin/env python3
"""Runs one heavy-run job and saves the capture with a Thai line filter (readers r2b r2b).

Every line of the output that holds a character from U+0E00 to U+0E7F is dropped before the capture
is written. The capture ends with the count of dropped lines and the exit code. Reason: this role is
a non-Claude model and must not see Thai text (PM rule, 2026-11-09).

Usage: python3 -I -B heavy_capture_r2b.py <capture file> <title> <inner command>

It runs the inner command inside the heavy-run wrapper of the PM script with HEAVY_PRIORITY=p1,
HEAVY_MIN_AVAIL_MB=1500, and HEAVY_PREFLIGHT_WAIT_S=5400, in the foreground. On a heavy-run exit 75
it runs the inner command once more.

It prints the capture path, EXIT=<n>, and THAI_LINES_DROPPED=<n>.
"""

import os
import re
import subprocess
import sys

HEAVY = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh'
THAI = re.compile('[\u0e00-\u0e7f]')


def main(argv):
    """Runs the heavy job and writes the capture."""
    capture_path, title, command = argv[0], argv[1], argv[2]
    env = dict(os.environ)
    env['HEAVY_PRIORITY'] = 'p1'
    env['HEAVY_MIN_AVAIL_MB'] = '1500'
    env['HEAVY_PREFLIGHT_WAIT_S'] = '5400'
    lines = [f'CAPTURE of {title}', '']
    attempt = 0
    code = 1
    dropped = 0
    while attempt < 2:
        attempt += 1
        done = subprocess.run(['bash', HEAVY, '-c', command], capture_output=True, text=True, env=env)
        code = done.returncode
        lines.append(f'=== ATTEMPT {attempt} ===')
        lines.append(f'INNER_COMMAND: {command}')
        lines.append(f'HEAVY_EXIT: {code}')
        lines.append('--- STDOUT ---')
        for line in done.stdout.rstrip('\n').splitlines():
            if THAI.search(line):
                dropped += 1
                continue
            lines.append(line)
        lines.append('--- STDERR ---')
        for line in done.stderr.rstrip('\n').splitlines():
            if THAI.search(line):
                dropped += 1
                continue
            lines.append(line)
        lines.append('')
        if code != 75:
            break
    lines.append(f'THAI_LINES_DROPPED={dropped}')
    lines.append(f'EXIT={code}')
    with open(capture_path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    print('CAPTURE_FILE ' + capture_path)
    print('ATTEMPTS ' + str(attempt))
    print(f'THAI_LINES_DROPPED={dropped}')
    print(f'EXIT={code}')
    return 0 if code == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
