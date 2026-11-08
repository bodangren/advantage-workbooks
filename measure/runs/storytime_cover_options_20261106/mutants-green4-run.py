#!/usr/bin/env python3
"""The mutant runner of Green 4 part 2 (Task 2.7c, adversarial round 2).

Two groups:
- G2-M01 to G2-M23: the 23 mutants of Green 2 and Green 3, re-run on the Green 4 bytes. Old text
  that part 1 moved is updated, and each change is printed.
- F14 to F17: one new mutant for each fix of part 1 (9601ddb5, 15eb2574), each the removal of its
  fix.

Each mutant is one exact replacement in the file under test. The runner asserts that the old text
occurs exactly once, runs the test file, records the result, and restores the file from a backup by
absolute path in a `try/finally` with a byte compare.

Usage: python3 run.py [--preflight]
"""

import hashlib
import os
import re
import shutil
import signal
import subprocess
import sys

ROOT = '/home/daniebo/Desktop/Workbooks'
DASHBOARD = os.path.join(ROOT, 'dashboard')
WORK = '/tmp/opencode/p2-green4/mut'
BACKUPDIR = os.path.join(WORK, 'backup')
LOGDIR = os.path.join(WORK, 'logs')
OUT = os.path.join(ROOT, 'measure', 'runs', 'storytime_cover_options_20261106', 'mutants-green4.txt')

BUILD = 'build'
TEMPLATE = 'template'
SCRIPTS = {
    BUILD: {
        'path': os.path.join(DASHBOARD, 'scripts', 'storytime', 'make-storytime-quest-covers.ts'),
        'sha256': 'd48c94a4b71ea506afd86ea2e270e14e7b9444707794d887ffd5b9b0922d6df1',
        'test': '__tests__/quest-cover-build.test.ts',
        # The slow live ADV and ADV2 tests of both rounds are excluded.
        'filter': r'^(?!.*ADV2?-)',
    },
    TEMPLATE: {
        'path': os.path.join(DASHBOARD, 'lib', 'storytime', 'print', 'cover-quest.ts'),
        'sha256': '309a6e93080dd2a4b04b3da2edd5dbc90c131358c30b2c47d0848a8085c0c419',
        'test': '__tests__/quest-cover-template.test.ts',
        'filter': 'ADV2-3',
    },
}

ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')

MUTANTS = [
    {
        'id': 'G2-M01', 'family': 'argv', 'mut': 'A', 'expect': 'B02',
        'change': 'level bound <= 5',
        'edits': [(
            "    const level = numberFlag(values.get('--level'), 1, 4, '--level', errors);",
            "    const level = numberFlag(values.get('--level'), 1, 5, '--level', errors);",
        )],
    },
    {
        'id': 'G2-M02', 'family': 'argv', 'mut': 'B', 'expect': 'B02',
        'change': 'accept a float version',
        'edits': [(
            "    const version = values.has('--version') ? numberFlag(values.get('--version'), 1, 4294967295, '--version', errors) : 1;",
            "    const versionText = values.get('--version');\n"
            "    const version = versionText === undefined ? 1 : Number.parseFloat(versionText);",
        )],
    },
    {
        'id': 'G2-M03', 'family': 'out folder', 'mut': 'A', 'expect': 'B03',
        'change': 'allow a ".." segment',
        'edits': [(r'''    if (out.split(/[\\/]+/).some((segment) => segment === '..')) {
        return [`The out folder "${out}" holds a ".." segment.`];
    }''',
                   '    // The mutant allows a ".." segment: the check is dropped.')],
    },
    {
        'id': 'G2-M04', 'family': 'out folder', 'mut': 'B', 'expect': 'B03',
        'change': 'skip realpath',
        'edits': [(
            '    const absolute = path.resolve(target);\n'
            '    let head = absolute;\n'
            '    const tail: string[] = [];\n'
            '    while (!fs.existsSync(head)) {\n'
            '        const parent = path.dirname(head);\n'
            '        if (parent === head) break;\n'
            '        tail.unshift(path.basename(head));\n'
            '        head = parent;\n'
            '    }\n'
            '    return path.join(fs.realpathSync(head), ...tail);',
            '    return path.resolve(target);',
        )],
    },
    {
        'id': 'G2-M05', 'family': 'overwrite', 'mut': 'A', 'expect': 'B04',
        'change': 'open with the flag w',
        'edits': [("    fs.writeFileSync(file, data, { flag: 'wx' });",
                   "    fs.writeFileSync(file, data, { flag: 'w' });")],
    },
    {
        'id': 'G2-M06', 'family': 'overwrite', 'mut': 'B', 'expect': 'B04',
        'change': 'skip the other-version scan',
        'edits': [(
            '            if (wanted.has(relative)) errors.push(`the target file ${relative} exists; the build never overwrites a file`);\n'
            '            else errors.push(`the out folder holds the file ${relative}, which this build does not write; the build never overwrites a file`);',
            '            if (wanted.has(relative)) errors.push(`the target file ${relative} exists; the build never overwrites a file`);',
        )],
    },
    {
        'id': 'G2-M07', 'family': 'names', 'mut': 'A', 'expect': 'B05',
        'change': 'drop one file from the layout',
        'edits': [("        'teacher/teacher-back.png',\n", '')],
    },
    {
        'id': 'G2-M08', 'family': 'names', 'mut': 'B', 'expect': 'B05',
        'change': 'wrong leaf version',
        'edits': [(
            '        readersLeaf: `${stem}-Reader-Leaf-Covers-v${version}_PDFX-1a.pdf`,',
            '        readersLeaf: `${stem}-Reader-Leaf-Covers-v${version + 1}_PDFX-1a.pdf`,',
        )],
    },
    {
        'id': 'G2-M09', 'family': 'PDF page checks', 'mut': 'A', 'expect': 'B06',
        'change': 'tolerance 15 pt',
        'edits': [('const PDF_TOLERANCE_PT = 1.5;', 'const PDF_TOLERANCE_PT = 15;')],
    },
    {
        'id': 'G2-M10', 'family': 'PDF page checks', 'mut': 'B', 'expect': 'B06',
        'change': 'accept 13 pages',
        'edits': [(
            '    if (info.pages !== expectedPages) errors.push(`the ${group} PDF holds ${info.pages} pages, not ${expectedPages}`);',
            '    if (info.pages !== expectedPages && info.pages !== expectedPages - 1) errors.push(`the ${group} PDF holds ${info.pages} pages, not ${expectedPages}`);',
        )],
    },
    {
        'id': 'G2-M11', 'family': 'report', 'mut': 'A', 'expect': 'B07',
        'change': 'hide a failed check',
        'edits': [(
            '''            if (value === 'fail') errors.push(`${row.file}: the check "${key}" failed`);
            else if (value !== 'pass') errors.push(`${row.file}: the check "${key}" holds ${JSON.stringify(value)}, not pass or fail`);''',
            '''            if (value !== 'fail' && value !== 'pass') errors.push(`${row.file}: the check "${key}" holds ${JSON.stringify(value)}, not pass or fail`);''',
        )],
    },
    {
        'id': 'G2-M12', 'family': 'report', 'mut': 'B', 'expect': 'B07',
        'change': 'omit the check key qr',
        'edits': [(
            '        for (const key of CHECK_KEYS) {',
            "        for (const key of CHECK_KEYS.filter((entry) => entry !== 'qr')) {",
        )],
    },
    {
        'id': 'G2-M13', 'family': 'plan order', 'mut': 'A', 'expect': 'B08',
        'change': 'write before the checks: the plan makes the out folder though a check failed',
        'edits': [(
            '    return { errors, files: layout.files, art, pictures };',
            '    if (errors.length) fs.mkdirSync(input.outDir, { recursive: true });\n'
            '    return { errors, files: layout.files, art, pictures };',
        )],
    },
    {
        'id': 'G2-M14', 'family': 'plan order', 'mut': 'B', 'expect': 'B08',
        'change': 'accept alpha art',
        'edits': [(
            '            if (meta.hasAlpha) errors.push(`the art file ${name} holds an alpha channel`);',
            '            // The mutant accepts art with an alpha channel.',
        )],
    },
    {
        'id': 'G2-M15', 'family': 'reader pictures', 'mut': 'A', 'expect': 'B09',
        'change': 'skip the coloured-pixel scan',
        'edits': [(
            '            if (grey && !(await isGreyArt(file, meta.channels))) {\n'
            '                errors.push(`the line art picture ${name} holds a pixel with unequal red, green, and blue values`);\n'
            '            }',
            '            // The mutant skips the coloured-pixel scan.',
        )],
    },
    {
        'id': 'G2-M16', 'family': 'reader pictures', 'mut': 'B', 'expect': 'B09',
        'change': 'accept 3999 px',
        'edits': [(
            '            if (meta.widthPx !== 4000 || meta.heightPx !== 3000) {',
            '            if (meta.widthPx < 3999 || meta.heightPx !== 3000) {',
        )],
    },
    {
        'id': 'G2-M17', 'family': 'PDF/X args', 'mut': 'A', 'expect': 'B10',
        'change': 'leaf without --k-only',
        'edits': [(
            "    if (group === 'readers-leaf') args.push('--k-only');",
            '    // The mutant leaves --k-only off the leaf.',
        )],
    },
    {
        'id': 'G2-M18', 'family': 'PDF/X args', 'mut': 'B', 'expect': 'B10',
        'change': 'shell: true',
        'edits': [(
            "                execFileSync(process.execPath, questPdfxArgs(group, input, staged), { cwd: DASHBOARD_ROOT, stdio: 'inherit' });",
            "                execFileSync(process.execPath, questPdfxArgs(group, input, staged), { cwd: DASHBOARD_ROOT, stdio: 'inherit', shell: true });",
        )],
    },
    {
        'id': 'G2-M19', 'family': 'QR from PNG', 'mut': 'A', 'expect': 'B11',
        'change': 'compare the grid with itself',
        'edits': [(
            '            if (on !== grid.cells[row][col]) different++;',
            '            if (grid.cells[row][col] !== grid.cells[row][col]) different++;',
        )],
    },
    {
        'id': 'G2-M20', 'family': 'QR from PNG', 'mut': 'B', 'expect': 'B11',
        'change': 'ignore the quiet zone shift',
        'edits': [(
            '            const x = Math.round(left + (col + 4.5) * unit);\n'
            '            const y = Math.round(top + (row + 4.5) * unit);',
            '            const x = Math.round(left + (col + 0.5) * unit);\n'
            '            const y = Math.round(top + (row + 0.5) * unit);',
        )],
    },
    {
        'id': 'G2-M21', 'family': 'import side effect', 'mut': 'A', 'expect': 'B01',
        'change': 'main() at module level',
        'edits': [(
            'if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {',
            'if (true) {',
        )],
    },
    {
        'id': 'G2-M22', 'family': 'cleanup', 'mut': 'A', 'expect': 'B14',
        'change': 'skip the temp cleanup on an error (the cleanup moves to the success returns)',
        'edits': [
            (
                '            console.log(parsed.usage);\n'
                '            return 0;',
                '            console.log(parsed.usage);\n'
                '            fs.rmSync(temp, { recursive: true, force: true });\n'
                '            return 0;',
            ),
            (
                '        );\n'
                '        return 0;\n'
                '    } catch (error) {',
                '        );\n'
                '        fs.rmSync(temp, { recursive: true, force: true });\n'
                '        return 0;\n'
                '    } catch (error) {',
            ),
            # Green 4 moved this text: part 1 put the release of the signal handlers first (F16).
            (
                '    } finally {\n'
                '        releaseSignals();\n'
                '        fs.rmSync(temp, { recursive: true, force: true });\n'
                '    }',
                '    } finally {\n'
                '        releaseSignals();\n'
                '    }',
            ),
        ],
    },
    {
        'id': 'G2-M23', 'family': 'QR box read', 'mut': 'A', 'expect': 'B07b',
        'change': 'read the first SVG match again, not the SVG inside the data-part="qr" box',
        'edits': [(
            "    const svg = html.slice(boxStart).match(/<svg[\\s\\S]*?<\\/svg>/)?.[0] ?? '';",
            "    const svg = html.match(/<svg[\\s\\S]*?<\\/svg>/)?.[0] ?? '';",
        )],
    },
    # ---- The 4 new mutants of Green 4: each one removes the fix of one finding. ----
    {
        'id': 'F14', 'family': 'invisible characters (F14)', 'mut': 'A', 'expect': 'ADV2-3',
        'script': TEMPLATE, 'test': '__tests__/quest-cover-template.test.ts', 'filter': 'ADV2-3',
        'change': 'strip only the old 5 zero-width characters, not every default-ignorable code point',
        'edits': [(
            r'const INVISIBLE = /[\u00ad\p{Default_Ignorable_Code_Point}]/gu;',
            r'const INVISIBLE = /[\u200b\u200c\u200d\u2060\ufeff]/gu;',
        )],
    },
    {
        'id': 'F15', 'family': 'compatibility forms (F15)', 'mut': 'A', 'expect': 'ADV2-3',
        'script': TEMPLATE, 'test': '__tests__/quest-cover-template.test.ts', 'filter': 'ADV2-3',
        'change': 'no normalize(NFKC) before the shared copy check',
        'edits': [(
            "    const text = plain.normalize('NFKC').replace(INVISIBLE, '');",
            '    const text = plain;',
        )],
    },
    {
        'id': 'F16', 'family': 'stop signals (F16)', 'mut': 'A', 'expect': 'ADV2-6',
        'script': BUILD, 'test': '__tests__/quest-cover-build.test.ts',
        'filter': 'a SIG(INT|TERM) while the build runs', 'runs': 3,
        'change': 'no cleanTempOnSignals call: a SIGINT or a SIGTERM leaves the temp folder (the signal tests are racy, N3: 3 runs, caught only when all 3 fail)',
        'edits': [(
            '    const releaseSignals = cleanTempOnSignals(temp);',
            '    const releaseSignals = (): void => {};',
        )],
    },
    {
        'id': 'F17', 'family': 'move step rollback (F17)', 'mut': 'A', 'expect': 'ADV2-6',
        'script': BUILD, 'test': '__tests__/quest-cover-build.test.ts',
        'filter': 'a failure in the move step of the print files',
        'change': 'no rollback of the copied print files',
        'edits': [(
            '                for (const file of copied) fs.rmSync(file, { force: true });\n',
            '',
        )],
    },
]


def strip_ansi(text: str) -> str:
    return ANSI.sub('', text)


def read_text(path: str) -> str:
    with open(path, 'r', encoding='utf8') as handle:
        return handle.read()


def write_text(path: str, text: str) -> None:
    with open(path, 'w', encoding='utf8') as handle:
        handle.write(text)


def sha256_of(path: str) -> str:
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def apply_edits(text: str, edits) -> str:
    for old, new in edits:
        count = text.count(old)
        if count != 1:
            raise AssertionError('the old text occurs %d times, not 1: %r' % (count, old[:160]))
        text = text.replace(old, new, 1)
    return text


def backup_path(name: str) -> str:
    return os.path.join(BACKUPDIR, '%s.ts' % name)


def restore(name: str) -> None:
    shutil.copyfile(backup_path(name), SCRIPTS[name]['path'])


def first_failure(output: str) -> str:
    """The describe group and the test name of the first failure, from the FAIL line or the x mark."""
    for line in output.splitlines():
        stripped = line.strip()
        if stripped.startswith('FAIL '):
            parts = stripped.split(' > ')
            if len(parts) >= 3:
                return ' > '.join(parts[1:])
            return stripped
    for line in output.splitlines():
        if '\u00d7' in line:
            name = line.split('\u00d7', 1)[1].strip()
            return re.sub(r'\s+\d+(?:\.\d+)?m?s$', '', name).strip()
    return ''


def summary_line(output: str) -> str:
    found = ''
    for line in output.splitlines():
        if line.strip().startswith('Tests '):
            found = ' '.join(line.split())
    return found


def main() -> int:
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(BACKUPDIR, exist_ok=True)
    os.makedirs(LOGDIR, exist_ok=True)

    originals = {}
    for name, spec in SCRIPTS.items():
        original = read_text(spec['path'])
        originals[name] = original
        path = backup_path(name)
        if os.path.exists(path):
            if read_text(path) != original:
                raise SystemExit('the backup %s is stale; remove it first' % path)
        else:
            write_text(path, original)
        print('backup %s: %s (%d bytes)' % (name, path, len(original.encode('utf8'))))

    # Pre-flight: every old text must occur exactly once in its pristine file.
    for mutant in MUTANTS:
        name = mutant.get('script', BUILD)
        apply_edits(originals[name], mutant['edits'])
        print('preflight %s ok on %s (%s %s)' % (mutant['id'], name, mutant['family'], mutant['mut']))

    if '--preflight' in sys.argv:
        return 0

    def on_signal(signum, frame):
        for name in SCRIPTS:
            restore(name)
        raise SystemExit('signal %d: the files were restored' % signum)

    signal.signal(signal.SIGTERM, on_signal)
    signal.signal(signal.SIGINT, on_signal)

    env = dict(os.environ)
    env['CI'] = 'true'

    header = [
        '# The mutant table of Green 4 part 2 (Task 2.7c, adversarial round 2)',
        '# group 1: the 23 mutants of Green 2 and Green 3, re-run on the Green 4 bytes',
        '# group 2: F14 to F17, one mutant for each fix of part 1 (9601ddb5, 15eb2574)',
        '# build script: dashboard/scripts/storytime/make-storytime-quest-covers.ts sha256 %s' % SCRIPTS[BUILD]['sha256'],
        '# template file: dashboard/lib/storytime/print/cover-quest.ts sha256 %s' % SCRIPTS[TEMPLATE]['sha256'],
        '# run: cd dashboard; CI=true npx vitest run <test file> --maxWorkers=1 --bail=1 -t <filter>',
        '# each row: id | family | A or B | change | expected test | exit | result | first failing test',
        '',
    ]
    rows = []
    details = []
    caught = 0
    na = 0
    survived = []

    try:
        for mutant in MUTANTS:
            name = mutant.get('script', BUILD)
            spec = SCRIPTS[name]
            mutated = apply_edits(originals[name], mutant['edits'])
            write_text(spec['path'], mutated)
            command = ['npx', 'vitest', 'run', mutant.get('test', spec['test']),
                       '--maxWorkers=1', '--bail=1', '-t', mutant.get('filter', spec['filter'])]
            runs = int(mutant.get('runs', 1))
            run_results = []
            for index in range(runs):
                result = subprocess.run(command, cwd=DASHBOARD, env=env, stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, text=True)
                output = strip_ansi(result.stdout or '')
                log_name = '%s.txt' % mutant['id'] if runs == 1 else '%s-run%d.txt' % (mutant['id'], index + 1)
                write_text(os.path.join(LOGDIR, log_name), output)
                run_results.append({
                    'code': result.returncode,
                    'failing': first_failure(output),
                    'summary': summary_line(output),
                })
                print('%s run %d -> exit %d | %s' % (mutant['id'], index + 1, result.returncode,
                                                     run_results[-1]['failing'] or '(none)'))
                sys.stdout.flush()
            all_failed = all(entry['code'] != 0 for entry in run_results)
            failing = run_results[0]['failing']
            if all_failed:
                verdict = 'CAUGHT' if any(entry['failing'] for entry in run_results) else \
                    'CAUGHT (no failing test line: a collection or setup error)'
                caught += 1
            else:
                verdict = 'SURVIVED'
                survived.append('%s (%s %s: %s)' % (mutant['id'], mutant['family'], mutant['mut'], mutant['change']))
            exits = 'exit ' + ', '.join(str(entry['code']) for entry in run_results)
            row = '%s | %s | %s | %s | %s | %s | %s | %s' % (
                mutant['id'], mutant['family'], mutant['mut'], mutant['change'], mutant['expect'],
                exits, verdict, failing or '(none)',
            )
            if failing and not failing.startswith(mutant['expect']):
                row += ' [the table names %s; another test of the file caught it first]' % mutant['expect']
            if runs > 1:
                row += ' [%d runs: %s]' % (
                    runs, '; '.join('run%d exit %d %s' % (i + 1, e['code'], e['failing'] or '(none)')
                                    for i, e in enumerate(run_results)))
            rows.append(row)
            for old, new in mutant['edits']:
                details.append('%s old | %s' % (mutant['id'], old.replace('\n', '\n          ')))
                details.append('%s new | %s' % (mutant['id'], new.replace('\n', '\n          ') if new else '(empty)'))
            details.append('%s tests | %s' % (
                mutant['id'], '; '.join(e['summary'] or '(no summary line)' for e in run_results)))
            print('%s %s -> %s | %s' % (mutant['id'], exits, verdict, failing or '(none)'))
            sys.stdout.flush()
            # Restore and prove it before the next mutant.
            restore(name)
            if read_text(spec['path']) != originals[name]:
                raise SystemExit('the restore of %s failed' % spec['path'])
    finally:
        for name in SCRIPTS:
            restore(name)

    unchanged = all(read_text(SCRIPTS[name]['path']) == originals[name] for name in SCRIPTS)
    actual = {name: sha256_of(SCRIPTS[name]['path']) for name in SCRIPTS}
    sha_ok = all(actual[name] == SCRIPTS[name]['sha256'] for name in SCRIPTS)
    status = subprocess.run(['git', 'status', '--porcelain', 'dashboard'],
                            cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    status_text = status.stdout.strip()
    footer = [
        '',
        *details,
        '',
        'mutants: %d, caught: %d' % (len(MUTANTS), caught),
        'n/a: %d' % na,
        'survivors: %s' % (', '.join(survived) if survived else 'none'),
        'restore cmp: %s' % ('ok' if unchanged else 'FAILED'),
        'script sha256 after the last restore: %s' % actual[BUILD],
        'template sha256 after the last restore: %s' % actual[TEMPLATE],
        '$ git status --porcelain dashboard',
        status_text if status_text else '(empty)',
        '$ exit of that command: %d' % status.returncode,
    ]
    write_text(OUT, '\n'.join(header + rows + footer) + '\n')
    print('\n'.join(rows))
    print('restore cmp: %s' % ('ok' if unchanged else 'FAILED'))
    print('script sha256 after the last restore: %s' % actual[BUILD])
    print('template sha256 after the last restore: %s' % actual[TEMPLATE])
    print('$ git status --porcelain dashboard')
    print(status_text if status_text else '(empty)')
    return 0 if unchanged and sha_ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
