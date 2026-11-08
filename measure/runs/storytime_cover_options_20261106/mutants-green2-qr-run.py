#!/usr/bin/env python3
"""The mutant runner of test-strategy.md section 4.8 (Task 2.7, part 2).

Each mutant is one exact replacement in the script under test. The runner asserts that the old
text occurs exactly once, runs the build test file, records the result, and restores the script
from a backup by absolute path in a `try/finally` with a byte compare.

Usage: python3 run.py [--preflight]
"""

import os
import re
import shutil
import signal
import subprocess
import sys

ROOT = '/home/daniebo/Desktop/Workbooks'
DASHBOARD = os.path.join(ROOT, 'dashboard')
SCRIPT = os.path.join(DASHBOARD, 'scripts', 'storytime', 'make-storytime-quest-covers.ts')
WORK = '/tmp/opencode/p2-green2-qr/mut'
BACKUP = os.path.join(WORK, 'make-storytime-quest-covers.backup.ts')
LOGDIR = os.path.join(WORK, 'logs')
OUT = os.path.join(ROOT, 'measure', 'runs', 'storytime_cover_options_20261106', 'mutants-green2-qr.txt')
TEST_FILE = '__tests__/quest-cover-build.test.ts'
SCRIPT_SHA256 = 'a3c822fd369316bf7c98ce091948fa3984f25b4a95018b2885935ea8e35ae403'

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
            "                execFileSync(process.execPath, questPdfxArgs(group, input, output), { cwd: DASHBOARD_ROOT, stdio: 'inherit' });",
            "                execFileSync(process.execPath, questPdfxArgs(group, input, output), { cwd: DASHBOARD_ROOT, stdio: 'inherit', shell: true });",
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
            (
                '    } finally {\n'
                '        fs.rmSync(temp, { recursive: true, force: true });\n'
                '    }',
                '    }',
            ),
        ],
    },
    {
        'id': 'G2-M23', 'family': 'QR box read', 'mut': 'A', 'expect': 'B07b',
        'change': 'read the first SVG match again, not the SVG inside the data-part="qr" box',
        'edits': [(
            r'''    const boxStart = html.indexOf('data-part="qr"');
    if (boxStart === -1) return 'fail';
    const svg = html.slice(boxStart).match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';''',
            r'''    const svg = html.match(/<svg[^>]*viewBox="0 0 \d+ \d+"[^>]*>[\s\S]*?<\/svg>/)?.[0] ?? '';''',
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


def apply_edits(text: str, edits) -> str:
    for old, new in edits:
        count = text.count(old)
        if count != 1:
            raise AssertionError('the old text occurs %d times, not 1: %r' % (count, old[:120]))
        text = text.replace(old, new, 1)
    return text


def restore() -> None:
    shutil.copyfile(BACKUP, SCRIPT)


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
    os.makedirs(LOGDIR, exist_ok=True)
    original = read_text(SCRIPT)
    if os.path.exists(BACKUP):
        backup = read_text(BACKUP)
        if backup != original:
            raise SystemExit('the backup %s is stale; remove it first' % BACKUP)
    else:
        write_text(BACKUP, original)
    print('backup: %s (%d bytes)' % (BACKUP, len(original.encode('utf8'))))

    # Pre-flight: every old text must occur exactly once in the pristine script.
    for mutant in MUTANTS:
        apply_edits(original, mutant['edits'])
        print('preflight %s ok (%s %s)' % (mutant['id'], mutant['family'], mutant['mut']))

    if '--preflight' in sys.argv:
        return 0

    def on_signal(signum, frame):
        restore()
        raise SystemExit('signal %d: the script was restored' % signum)

    signal.signal(signal.SIGTERM, on_signal)
    signal.signal(signal.SIGINT, on_signal)

    env = dict(os.environ)
    env['CI'] = 'true'
    command = ['npx', 'vitest', 'run', TEST_FILE, '--maxWorkers=1', '--bail=1']

    header = [
        '# The mutant table of test-strategy.md section 4.8 (12 families, 22 mutants), plus G2-M23 of',
        '# the QR fix round (family "QR box read")',
        '# module: dashboard/scripts/storytime/make-storytime-quest-covers.ts at commit d65955fe',
        '# script sha256: %s' % SCRIPT_SHA256,
        '# run: cd dashboard; CI=true npx vitest run %s --maxWorkers=1 --bail=1' % TEST_FILE,
        '# each row: id | family | A or B | change | expected test | exit | result | first failing test',
        '',
    ]
    rows = []
    details = []
    caught = 0
    survived = []

    try:
        for mutant in MUTANTS:
            mutated = apply_edits(original, mutant['edits'])
            write_text(SCRIPT, mutated)
            result = subprocess.run(command, cwd=DASHBOARD, env=env, stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, text=True)
            output = strip_ansi(result.stdout or '')
            write_text(os.path.join(LOGDIR, '%s.txt' % mutant['id']), output)
            failing = first_failure(output)
            summary = summary_line(output)
            if result.returncode != 0 and failing:
                verdict = 'CAUGHT'
                caught += 1
            elif result.returncode != 0:
                verdict = 'CAUGHT (no failing test line: a collection or setup error)'
                caught += 1
            else:
                verdict = 'SURVIVED'
                survived.append('%s (%s %s: %s)' % (mutant['id'], mutant['family'], mutant['mut'], mutant['change']))
            shape = 'exit %d' % result.returncode
            row = '%s | %s | %s | %s | %s | %s | %s | %s' % (
                mutant['id'], mutant['family'], mutant['mut'], mutant['change'], mutant['expect'],
                shape, verdict, failing or '(none)',
            )
            if failing and not failing.startswith(mutant['expect']):
                row += ' [the table names %s; another test of the file caught it first]' % mutant['expect']
            rows.append(row)
            for old, new in mutant['edits']:
                details.append('%s old | %s' % (mutant['id'], old.replace('\n', '\n          ')))
                details.append('%s new | %s' % (mutant['id'], new.replace('\n', '\n          ') if new else '(empty)'))
            details.append('%s tests | %s' % (mutant['id'], summary or '(no summary line)'))
            print('%s %s -> %s | %s' % (mutant['id'], shape, verdict, failing or '(none)'))
            sys.stdout.flush()
            # Restore and prove it before the next mutant.
            restore()
            if read_text(SCRIPT) != original:
                raise SystemExit('the restore of %s failed' % SCRIPT)
    finally:
        restore()

    unchanged = read_text(SCRIPT) == original
    import hashlib
    sha = hashlib.sha256(read_text(SCRIPT).encode('utf8')).hexdigest()
    status = subprocess.run(['git', 'status', '--porcelain', 'dashboard/scripts/storytime'],
                            cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    status_text = status.stdout.strip()
    footer = [
        '',
        *details,
        '',
        'mutants: %d, caught: %d' % (len(MUTANTS), caught),
        'n/a: 0',
        'survivors: %s' % (', '.join(survived) if survived else 'none'),
        'restore cmp: %s' % ('ok' if unchanged else 'FAILED'),
        'script sha256 after the last restore: %s' % sha,
        '$ git status --porcelain dashboard/scripts/storytime',
        status_text if status_text else '(empty)',
        '$ exit of that command: %d' % status.returncode,
    ]
    write_text(OUT, '\n'.join(header + rows + footer) + '\n')
    print('\n'.join(rows))
    print('restore cmp: %s' % ('ok' if unchanged else 'FAILED'))
    print('script sha256 after the last restore: %s' % sha)
    return 0 if unchanged and sha == SCRIPT_SHA256 else 1


if __name__ == '__main__':
    raise SystemExit(main())
