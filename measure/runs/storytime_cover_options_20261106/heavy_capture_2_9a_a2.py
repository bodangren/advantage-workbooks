#!/usr/bin/env python3
"""Runs one heavy-run job and saves the capture (Task 2.9 part 1 A2).

Usage: python3 -I -B heavy_capture_2_9a_a2.py <capture file> <title> <inner command>

It runs the inner command inside the heavy-run wrapper of the PM script with HEAVY_PRIORITY=p1,
HEAVY_MIN_AVAIL_MB=1500, and HEAVY_PREFLIGHT_WAIT_S=5400, in the foreground. When the output holds
a Chrome "Protocol error" line, it runs the inner command once more and saves both attempts.

It prints the capture path, the exit code, and the number of attempts. It prints no Thai text.
"""

import os
import subprocess
import sys

HEAVY = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh'


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
    while attempt < 2:
        attempt += 1
        done = subprocess.run(['bash', HEAVY, '-c', command], capture_output=True, text=True, env=env)
        code = done.returncode
        lines.append(f'=== ATTEMPT {attempt} ===')
        lines.append(f'INNER_COMMAND: {command}')
        lines.append(f'HEAVY_EXIT: {code}')
        lines.append('--- STDOUT ---')
        lines.append(done.stdout.rstrip('\n'))
        lines.append('--- STDERR ---')
        lines.append(done.stderr.rstrip('\n'))
        lines.append('')
        if 'Protocol error' not in (done.stdout + done.stderr):
            break
    with open(capture_path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines))
    print('CAPTURE_FILE ' + capture_path)
    print('HEAVY_EXIT ' + str(code))
    print('ATTEMPTS ' + str(attempt))
    return 0 if code == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
