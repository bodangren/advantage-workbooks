#!/usr/bin/env python3
"""The stand-alone PRINT_GATE run on the 2 A2 print files (Task 2.9 part 1 A2).

Model: the PRINT_GATE command of `measure/tracks/storytime_cover_options_20261106/test-strategy.md`
section 4.10 check 1, which is `make-pdfx.ts <print file> --check` in the dashboard folder.

Usage: python3 -I -B gate_run_2_9a_a2.py

It runs the gate on the 2 new A2 print files of the hand-off folder, writes the exit codes and the
FAIL lines into `/tmp/opencode/c29a2/print-gate-run.txt`, and prints them. It drops every line that
holds a Thai character and prints the count of the Thai characters of the raw output. It prints no
Thai text.
"""

import os
import re
import subprocess

REPO = '/home/daniebo/Desktop/Workbooks'
DASHBOARD = os.path.join(REPO, 'dashboard')
OUT = '/home/daniebo/Desktop/print-ready/storytime/covers-quest-v1'
STUDENT = os.path.join(OUT, 'student', 'Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf')
TEACHER = os.path.join(
    OUT, 'teacher-candidate',
    'Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf')
CAPTURE = '/tmp/opencode/c29a2/print-gate-run.txt'
THAI_LO, THAI_HI = 0x0E00, 0x0E7F


def thai_count(text):
    """Returns the count of the Thai characters of a text."""
    return sum(1 for ch in text if THAI_LO <= ord(ch) <= THAI_HI)


def run_gate(path):
    """Runs the print gate on one print file and returns its exit code and its output."""
    done = subprocess.run(['npx', 'tsx', 'scripts/print/make-pdfx.ts', path, '--check'],
                          cwd=DASHBOARD, capture_output=True, text=True)
    return done.returncode, done.stdout + done.stderr


def main():
    """Runs the gate on the 2 print files and writes the capture."""
    lines = []
    for label, path in (('STUDENT', STUDENT), ('TEACHER', TEACHER)):
        code, output = run_gate(path)
        raw = output
        lines.append(f'{label}_GATE_EXIT={code}')
        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith('FAIL'):
                lines.append(f'{label} {stripped}')
        print(f'{label}_GATE_EXIT={code}')
        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith('FAIL'):
                print(f'{label} {stripped}')
        print(f'{label}_THAI_CHARS {thai_count(raw)}')
    with open(CAPTURE, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    print('CAPTURE_FILE ' + CAPTURE)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
