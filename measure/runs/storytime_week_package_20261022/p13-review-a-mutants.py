#!/usr/bin/env python3
"""The mutants of P13 Review A round 1 (track storytime_week_package).

Usage: python3 -I -B p13-review-a-mutants.py <capture file>

The first 15 mutants are the Green 1 task line mutants (a copy of
p13-green1-mutants.py, plan line 555), rerun by Review A. The R mutants are the
reviewer's own probes for the vacuous-pass suspects (anti-pattern A4) and for
spec rules that the 15 mutants do not name. For each mutant, the script replaces
one exact text in one code file, runs the Red test file, restores the original
bytes, and proves the restore with `cmp`. A mutant is caught when the test run
exits with a code other than 0. The capture ends with the summary lines
`mutants: 15, caught: <n>`, `own mutants: <n>, caught: <n>`, and
`all mutants: <n>, caught: <n>`.
"""

import shutil
import subprocess
import sys
import tempfile

ROOT = '/home/daniebo/Desktop/Workbooks'
LIB = 'dashboard/lib/storytime/sentence-clips.ts'
MAKER = 'dashboard/scripts/storytime/make-sentence-clips.ts'
WORDS = 'dashboard/scripts/storytime/make-word-bank.ts'
MAPPER = 'dashboard/scripts/storytime/set-sentence-clips.ts'
CHECKS = 'dashboard/scripts/storytime/check-weeks.ts'
TEST = 'cd dashboard && CI=true npx vitest run __tests__/storytime-package-readalong-clips.test.ts --maxWorkers=1'

MUTANTS = [
    ('M1 planSentenceClips ignores kinds and plans the decodable books only', LIB,
     "if (typeof book?.kind !== 'string' || !kinds.includes(book.kind)) return;",
     "if (book?.kind !== 'decodable') return;"),
    ('M2 the default kinds holds both kinds', LIB,
     "const DEFAULT_KINDS: readonly SentenceKind[] = ['decodable'];",
     "const DEFAULT_KINDS: readonly SentenceKind[] = ['decodable', 'readalong'];"),
    ('M3 the sentence maker replaces the provenance file with its own items', MAKER,
     'let items: SentenceClipItem[] = [...(existing?.items ?? [])];',
     'let items: SentenceClipItem[] = [];'),
    ('M4 the merged items are not sorted', MAKER,
     '.sort((left, right) => left.book - right.book || left.n - right.n)',
     '.slice()'),
    ('M5 the skip rule is off', MAKER,
     'if (isDone(item)) {',
     'if (item.n < 0) {'),
    ('M6 the skip rule ignores the SHA-256', MAKER,
     'return fs.existsSync(clip) && fileHash(clip) === row.sha256;',
     'return fs.existsSync(clip);'),
    ('M7 the provenance file is written once at the end of the run', MAKER,
     'fs.writeFileSync(provenanceFile, ',
     'if (item === todo[todo.length - 1]) fs.writeFileSync(provenanceFile, '),
    ('M8 the header guard is off', MAKER,
     'if (header.speed !== SPEED || header.model !== MODEL || plan.some((item) => voiceOf(item.book) !== header.voice)) {',
     'if (header.speed === -1) {'),
    ('M9 the call line is added after the call', MAKER,
     '        beforeCall(take);\n        synthesize(item.text, wavFile, voice, SPEED);\n',
     '        synthesize(item.text, wavFile, voice, SPEED);\n        beforeCall(take);\n'),
    ('M10 the line sent: <s> (run failed) is not added when the run throws', MAKER,
     'add(`sent: ${sent} (run failed)`);',
     ''),
    ('M11 the sent sum leaves out the characters of the retakes', MAKER,
     'sent += item.text.length;',
     'sent += take === 1 ? item.text.length : 0;'),
    ('M12 the word maker adds no call line', WORDS,
     r'add(`call ${calls}\t${key}\ttake ${take}\tchars ${takeText.length}\tsent ${chars}`);',
     ''),
    ('M13 the mapper with kinds readalong also edits the decodable block', MAPPER,
     'const kinds: readonly string[] = options.kinds ?? KIND_FLAG.decodable;',
     "const kinds: readonly string[] = ['decodable', 'readalong'];"),
    ('M14 checkReadAlongSentenceClips skips the text compare', CHECKS,
     "if (typeof clip?.sentence !== 'string' || clip.sentence !== sentences[at]?.sentence) {",
     "if (kind === 'decodable' && (typeof clip?.sentence !== 'string' || clip.sentence !== sentences[at]?.sentence)) {"),
    ('M15 checkSentenceClips reads a read-along book', CHECKS,
     'if (book?.kind !== kind) return;',
     "if (book?.kind !== kind) { if (kind === 'decodable' && book?.audio?.sentenceClips) badPath.push(String(index)); return; }"),
]

# The reviewer's own probes (Review A round 1).
OWN_MUTANTS = [
    ('R1 the kept line loses its trailing newline (M6 exact bytes)', MAKER,
     '            add(`kept\\t${item.file}\\n`);',
     '            add(`kept\\t${item.file}`);'),
    ('R2 the flag --kind all maps to readalong only (M3)', MAKER,
     "    all: ['decodable', 'readalong'],",
     "    all: ['readalong'],"),
    ('R3 main of the sentence maker prints result.lines again (M6 stdout, one copy)', MAKER,
     '        if (!dryRun) console.log(`made: ${result.made.length}`);',
     '        for (const line of result.lines) console.log(line);\n        if (!dryRun) console.log(`made: ${result.made.length}`);'),
    ('R4 the skip rule drops the text compare (M5 same text)', MAKER,
     '        if (!row || row.text !== item.text) return false;',
     '        if (!row) return false;'),
]


def summary(text):
    """The test-count lines of a vitest output, without the color codes."""
    import re
    plain = re.sub(r'\x1b\[[0-9;]*m', '', text)
    return [line.strip() for line in plain.splitlines() if line.strip().startswith(('Tests ', 'Test Files '))]


def run_set(name, mutants, out):
    """Runs one set of mutants; returns the caught count."""
    caught = 0
    for name, rel, old, new in mutants:
        path = ROOT + '/' + rel
        backup_dir = tempfile.mkdtemp(prefix='p13ra-mutants-', dir='/tmp')
        backup = backup_dir + '/original'
        shutil.copyfile(path, backup)
        try:
            with open(path, encoding='utf-8') as handle:
                text = handle.read()
            count = text.count(old)
            if count != 1:
                out.append('%s: NOT APPLIED (the text occurs %d times in %s)' % (name, count, rel))
                continue
            try:
                with open(path, 'w', encoding='utf-8') as handle:
                    handle.write(text.replace(old, new))
                run = subprocess.run(['bash', '-c', TEST], cwd=ROOT, capture_output=True, text=True)
            finally:
                shutil.copyfile(backup, path)
            same = subprocess.run(['cmp', backup, path], capture_output=True, text=True).returncode == 0
            verdict = 'caught' if run.returncode != 0 else 'SURVIVED'
            if run.returncode != 0:
                caught += 1
            out.append('%s (%s): %s, exit %d, %s, cmp after restore: %s' % (
                name, rel, verdict, run.returncode, '; '.join(summary(run.stdout + run.stderr)) or 'no summary',
                'same' if same else 'DIFFERS'))
            if not same:
                out.append('STOP: the restore of %s failed' % rel)
                break
        finally:
            shutil.rmtree(backup_dir, ignore_errors=True)
    return caught


def main(argv):
    """Runs the mutants and writes the capture."""
    capture = argv[0]
    out = ['P13 Review A round 1 mutants, test command: ' + TEST]
    caught_m = run_set('M', MUTANTS, out)
    out.append('mutants: %d, caught: %d' % (len(MUTANTS), caught_m))
    caught_r = run_set('R', OWN_MUTANTS, out)
    out.append('own mutants: %d, caught: %d' % (len(OWN_MUTANTS), caught_r))
    out.append('all mutants: %d, caught: %d' % (len(MUTANTS) + len(OWN_MUTANTS), caught_m + caught_r))
    with open(capture, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out) + '\n')
    print('\n'.join(out))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
