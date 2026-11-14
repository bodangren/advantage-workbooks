#!/usr/bin/env python3
"""The 2 review mutants of P13 Red retry R2 (track storytime_week_package, Review A round 1 F1 and F2).

Usage: python3 -I -B p13-red-r2-mutants.py <capture file>

Run it inside one heavy-run wrapper call, from the repository root. For each mutant, the script
replaces one exact text in dashboard/scripts/storytime/make-sentence-clips.ts, runs the Red test
file, restores the original bytes, and proves the restore with `cmp` against the saved copy and
against `git show HEAD:dashboard/scripts/storytime/make-sentence-clips.ts`. A mutant is caught
when the test run exits with a code other than 0. Every recorded vitest line passes a Thai mask
(PM rule 2026-11-09): a line that holds a Thai character is dropped. The capture ends with the
line `mutants: 2, caught: <n>` and `restore: cmp equal <n> of 2`.
"""

import re
import shutil
import subprocess
import sys
import tempfile

ROOT = '/home/daniebo/Desktop/Workbooks'
MAKER = 'dashboard/scripts/storytime/make-sentence-clips.ts'
TEST = 'cd dashboard && CI=true npx vitest run __tests__/storytime-package-readalong-clips.test.ts --maxWorkers=1'
THAI = re.compile("[" + chr(0x0e00) + "-" + chr(0x0e7f) + "]")
ANSI = re.compile(r'\x1b\[[0-9;]*m')

# (name, old text, new text, the test case that must fail)
MUTANTS = [
    ('R4 the skip rule drops the text compare of M5',
     '        if (!row || row.text !== item.text) return false;',
     '        if (!row) return false;',
     'a done sentence whose item text differs from the book sentence is made again'),
    ('R2 the flag --kind all maps to readalong only',
     "    all: ['decodable', 'readalong'],",
     "    all: ['readalong'],",
     '--kind all plans both kinds: the decodable kept lines and the read-along call list'),
]


def plain(text):
    """The text without color codes and without any line that holds a Thai character."""
    lines = []
    for line in ANSI.sub('', text).splitlines():
        if not THAI.search(line):
            lines.append(line)
    return '\n'.join(lines)


def summary(text):
    """The test-count and failed-test lines of a Thai-masked vitest output."""
    out = []
    for line in plain(text).splitlines():
        stripped = line.strip()
        if stripped.startswith(('Tests ', 'Test Files ')) or stripped.startswith('FAIL') or stripped.startswith('×'):
            out.append(stripped)
    return out


def main(argv):
    """Runs the mutants and writes the capture."""
    capture = argv[0]
    out = ['P13 Red retry R2 mutants, test command: ' + TEST]
    backup_dir = tempfile.mkdtemp(prefix='p13r2-mutants-', dir='/tmp')
    caught = 0
    restores = 0
    for name, old, new, expected_case in MUTANTS:
        path = ROOT + '/' + MAKER
        backup = backup_dir + '/original'
        shutil.copyfile(path, backup)
        with open(path, encoding='utf-8') as handle:
            text = handle.read()
        count = text.count(old)
        if count != 1:
            out.append('%s: NOT APPLIED (the text occurs %d times in %s)' % (name, count, MAKER))
            continue
        try:
            with open(path, 'w', encoding='utf-8') as handle:
                handle.write(text.replace(old, new))
            run = subprocess.run(['bash', '-c', TEST], cwd=ROOT, capture_output=True, text=True)
        finally:
            shutil.copyfile(backup, path)
        same_copy = subprocess.run(['cmp', backup, path], capture_output=True, text=True).returncode == 0
        head = subprocess.run(['git', 'show', 'HEAD:' + MAKER], cwd=ROOT, capture_output=True)
        head_file = backup_dir + '/head'
        with open(head_file, 'wb') as handle:
            handle.write(head.stdout)
        same_head = subprocess.run(['cmp', head_file, path], capture_output=True, text=True).returncode == 0
        if same_copy and same_head:
            restores += 1
        combined = plain(run.stdout + run.stderr)
        lines = summary(run.stdout + run.stderr)
        failed_names = [line for line in lines if line.startswith('FAIL') or line.startswith('×')]
        verdict = 'caught' if run.returncode != 0 else 'SURVIVED'
        if run.returncode != 0:
            caught += 1
        out.append('%s: %s, exit %d' % (name, verdict, run.returncode))
        for failed in failed_names[:8]:
            out.append('  failed: %s' % failed)
        for line in lines:
            if line.startswith(('Tests ', 'Test Files ')):
                out.append('  %s' % line)
        if expected_case in combined and run.returncode != 0:
            out.append('  expected case failed: %s' % expected_case)
        else:
            out.append('  expected case NOT in the failures: %s' % expected_case)
        out.append('  restore cmp vs copy: %s, cmp vs git show HEAD: %s' % (
            'equal' if same_copy else 'DIFFERS', 'equal' if same_head else 'DIFFERS'))
        if not (same_copy and same_head):
            out.append('STOP: the restore of %s failed' % MAKER)
            break
    shutil.rmtree(backup_dir, ignore_errors=True)
    out.append('mutants: %d, caught: %d' % (len(MUTANTS), caught))
    out.append('restore: cmp equal %d of %d' % (restores, len(MUTANTS)))
    with open(capture, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    print('\n'.join(out))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
