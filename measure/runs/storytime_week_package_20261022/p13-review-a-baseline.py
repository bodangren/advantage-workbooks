#!/usr/bin/env python3
"""The Review A baseline of the P13 Red test file at HEAD 234883a3.

Usage: python3 -I -B p13-review-a-baseline.py <capture file>

Runs the read-along test file once and writes the labeled summary and the exit
code. The capture ends with `BASELINE exit <code>`.
"""

import re
import subprocess
import sys

ROOT = '/home/daniebo/Desktop/Workbooks'
TEST = 'cd dashboard && CI=true npx vitest run __tests__/storytime-package-readalong-clips.test.ts --maxWorkers=1'


def summary(text):
    plain = re.sub(r'\x1b\[[0-9;]*m', '', text)
    return [line.strip() for line in plain.splitlines() if line.strip().startswith(('Tests ', 'Test Files '))]


def main(argv):
    capture = argv[0]
    run = subprocess.run(['bash', '-c', TEST], cwd=ROOT, capture_output=True, text=True)
    out = ['P13 Review A baseline, test command: ' + TEST]
    out.extend(summary(run.stdout + run.stderr) or ['no summary'])
    out.append('BASELINE exit %d' % run.returncode)
    with open(capture, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    print('\n'.join(out))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
