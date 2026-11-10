#!/usr/bin/env python3
"""Runs one heavy-run job and saves the capture (Task 2.9 part 2 teacher v2).

This is the script of the A2 round with the new name. One change: every Thai line of the output is
dropped before the capture is written, and the count of dropped lines is printed. Reason: this role
is a non-Claude model and must not see Thai text (PM rule, 2026-11-09).

Usage: python3 -I -B heavy_capture_2_9b.py <capture file> <title> <inner command>

It runs the inner command inside the heavy-run wrapper of the PM script with HEAVY_PRIORITY=p1,
HEAVY_MIN_AVAIL_MB=1500, and HEAVY_PREFLIGHT_WAIT_S=5400, in the foreground. When the output holds
a Chrome "Protocol error" line, it runs the inner command once more and saves both attempts.

It prints the capture path, the exit code, the attempt count, and the dropped-line count.
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
    lines = [f'BUILD CAPTURE of {title}', '']
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
        if 'Protocol error' not in (done.stdout + done.stderr):
            break
    with open(capture_path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines))
    print('CAPTURE_FILE ' + capture_path)
    print('HEAVY_EXIT ' + str(code))
    print('ATTEMPTS ' + str(attempt))
    print('CAPTURE_THAI_LINES_DROPPED ' + str(dropped))
    return 0 if code == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
