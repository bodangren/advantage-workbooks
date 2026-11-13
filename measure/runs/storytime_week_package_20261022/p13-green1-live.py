#!/usr/bin/env python3
"""The live proofs of P13 Green 1 (track storytime_week_package, plan Task (Green 1)). No mmx call.

Usage: python3 -I -B p13-green1-live.py <capture file>

Run it inside one heavy-run wrapper call, from the repository root. Each command is a check or a
dry run. The capture prints one labeled line for each proof, then `git status --porcelain content/`.
"""

import re
import subprocess
import sys

ROOT = '/home/daniebo/Desktop/Workbooks'
EXPECTED_CHARS = {1: 137, 2: 166, 3: 93, 4: 142, 5: 130, 6: 132, 7: 127}


def run(args):
    """Runs one tsx script in the dashboard folder, with no faster-whisper venv."""
    env = {'PATH': '/usr/local/bin:/usr/bin:/bin', 'HOME': '/home/daniebo', 'WHISPER_PYTHON': '/tmp/p13g1-no-venv/bin/python'}
    import os
    env['PATH'] = os.environ.get('PATH', env['PATH'])
    done = subprocess.run(['npx', 'tsx'] + args, cwd=ROOT + '/dashboard', capture_output=True, env=env)
    return done.returncode, done.stdout.decode('utf-8'), done.stderr.decode('utf-8')


def main(argv):
    """Runs the proofs and writes the capture."""
    out = []
    ok_all = True

    def record(label, ok, detail):
        nonlocal ok_all
        ok_all = ok_all and ok
        out.append('%s: %s (%s)' % (label, 'pass' if ok else 'FAIL', detail))

    # 1. check-weeks.ts --level 2
    code, stdout, _ = run(['scripts/storytime/check-weeks.ts', '--level', '2'])
    fails = [line for line in stdout.splitlines() if '  FAIL ' in line and 'published' not in line]
    out.append('FAIL rows other than published: %d' % len(fails))
    weeks = re.split(r'\n(?=\S.*st2/)', stdout)
    blocks = {}
    current = None
    for line in stdout.splitlines():
        found = re.search(r'st2/(\d+)', line)
        if found and not line.startswith(' '):
            current = int(found.group(1))
            blocks[current] = []
        elif current is not None:
            blocks[current].append(line)
    rows_ok = True
    detail = []
    for week in range(1, 9):
        lines = blocks.get(week, [])
        sentence = [l for l in lines if re.search(r'\ssentence-clips\s', l)]
        readalong = [l for l in lines if 'readalong-sentence-clips' in l]
        if week <= 7:
            good = len(sentence) == 1 and sentence[0].strip().startswith('PASS') and len(readalong) == 1 \
                and readalong[0].strip().startswith('WARN') and readalong[0].rstrip().endswith('no clips')
        else:
            good = len(readalong) == 0
        rows_ok = rows_ok and good
        detail.append('st2/%d %s' % (week, 'ok' if good else 'bad'))
    del weeks
    record('check-weeks --level 2', code == 0 and not fails and rows_ok,
           'exit %d; sentence-clips pass and readalong-sentence-clips warn no clips on st2/1 to st2/7, no read-along row on st2/8: %s' % (code, ', '.join(detail)))

    # 2. to 4. the dry runs of the sentence maker
    for kind in ('readalong', 'decodable', 'all'):
        for week in range(1, 8):
            code, stdout, stderr = run(['scripts/storytime/make-sentence-clips.ts', '--level', '2', '--week', str(week), '--kind', kind, '--dry-run'])
            kept = re.findall(r'^kept\t(l2/media/w\d\d/sentences/b\d-s\d\d\.mp3)\n\n', stdout, flags=re.M)
            chars = re.findall(r'^chars: (\d+)$', stdout, flags=re.M)
            listed = [l for l in stdout.splitlines() if re.match(r'^l2/media/w\d\d/sentences/b\d-s\d\d\.mp3\t', l)]
            calls = [l for l in stdout.splitlines() if l.startswith('call ') or l.startswith('sent:')]
            value = int(chars[-1]) if chars else -1
            if kind == 'readalong':
                good = value == EXPECTED_CHARS[week] and not kept and len(listed) > 0
            elif kind == 'decodable':
                good = value == 0 and len(kept) == 8 and not listed \
                    and all(path.startswith('l2/media/w%02d/sentences/b1-' % week) for path in kept)
            else:
                good = value == EXPECTED_CHARS[week] and len(kept) == 8
            good = good and code == 0 and not calls
            record('dry run w%02d --kind %s' % (week, kind), good,
                   'exit %d, chars: %s, kept lines: %d, list lines: %d, call or sent lines: %d' % (code, value, len(kept), len(listed), len(calls)))

    # 5. a bad --kind value
    code, _, _ = run(['scripts/storytime/make-sentence-clips.ts', '--level', '2', '--week', '1', '--kind', 'readaong', '--dry-run'])
    record('make-sentence-clips --kind readaong', code == 2, 'exit %d' % code)
    code, _, _ = run(['scripts/storytime/set-sentence-clips.ts', '--level', '2', '--week', '1', '--kind', 'readaong', '--check'])
    record('set-sentence-clips --kind readaong', code == 2, 'exit %d' % code)

    # 6. set-sentence-clips --check
    code, stdout, _ = run(['scripts/storytime/set-sentence-clips.ts', '--level', '2', '--week', '1', '--kind', 'readalong', '--check'])
    expected = ['0\tl2/media/w01/sentences/b0-s%02d.mp3\tmissing' % n for n in range(1, 9)]
    record('set-sentence-clips w01 --kind readalong --check', code == 1 and stdout.splitlines() == expected,
           'exit %d, lines: %d, missing lines: %d' % (code, len(stdout.splitlines()), sum(1 for l in stdout.splitlines() if l.endswith('\tmissing'))))
    code, stdout, _ = run(['scripts/storytime/set-sentence-clips.ts', '--level', '2', '--week', '1', '--check'])
    expected = ['1\tl2/media/w01/sentences/b1-s%02d.mp3\tok' % n for n in range(1, 9)]
    record('set-sentence-clips w01 --check (no --kind)', code == 0 and stdout.splitlines() == expected,
           'exit %d, ok lines for book 1: %d' % (code, sum(1 for l in stdout.splitlines() if l.startswith('1\t') and l.endswith('\tok'))))

    # 7. no content change
    status = subprocess.run(['git', 'status', '--porcelain', 'content/'], cwd=ROOT, capture_output=True, text=True).stdout
    record('git status --porcelain content/', status == '', 'lines: %d' % len(status.splitlines()))

    out.append('live proofs: %s' % ('all pass' if ok_all else 'SOME FAIL'))
    with open(argv[0], 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    print('\n'.join(out))
    return 0 if ok_all else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
