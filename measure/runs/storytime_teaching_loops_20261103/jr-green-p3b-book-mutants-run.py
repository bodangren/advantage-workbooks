import filecmp
import os
import re
import shutil
import subprocess
import sys

REPO = '/home/daniebo/Desktop/Workbooks'
DASH = os.path.join(REPO, 'dashboard')
BACKUP = '/tmp/opencode/p3b-mut/backup'
ANSI = re.compile('\x1b\\[[0-9;]*m')
MB_TEST = '__tests__/storytime-loops-share-book.test.ts'
MX_TEST = '__tests__/storytime-loops-share-captions.test.ts'
MANUAL = 'dashboard/lib/storytime/manual.ts'
I18N = 'dashboard/lib/storytime/i18n.ts'
CAPTIONS = 'dashboard/scripts/storytime/check-share-captions.ts'
MANUAL_CLI = 'dashboard/scripts/storytime/make-manual-pdf.ts'
PRINT_CLI = 'dashboard/scripts/storytime/make-teacher-book-print.ts'

SHARE_WIRING = """    if (options.share) {
        for (const s of scripts) {
            if (!s.share) continue;
            if (consentStep === undefined) consentStep = s.share.shots[0]?.step;
            for (const shot of s.share.shots) shares.set(shot.step, { media: shot.media, caption: s.share.caption });
        }
    }
    const shareOf = (stepId: string) => (options.share ? shares.get(stepId) : undefined);
    const consentOf = (stepId: string) => options.share === true && stepId === consentStep;"""

SHARE_FILL = """            for (const shot of s.share.shots) shares.set(shot.step, { media: shot.media, caption: s.share.caption });"""

CONSENT_LINE = """    const consentOf = (stepId: string) => options.share === true && stepId === consentStep;"""

COMPARE_BLOCK = """        if (source) {
            if (!source.every((cell, i) => cells[i + 1] === cell)) problems.push(`${id}: the row differs from the week file`);
            continue;
        }"""

TH_BLOCK = """        ${lang === 'th' && share.caption.th ? `<p class="st-share-caption">${escapeHtml(share.caption.th)}</p>` : ''}
        <p class="st-share-caption">${escapeHtml(share.caption.en)}</p>"""

MB = [
    ('MB1', MANUAL, SHARE_WIRING, """    if (options.share !== false) {
        for (const s of scripts) {
            if (!s.share) continue;
            if (consentStep === undefined) consentStep = s.share.shots[0]?.step;
            for (const shot of s.share.shots) shares.set(shot.step, { media: shot.media, caption: s.share.caption });
        }
    }
    const shareOf = (stepId: string) => (options.share !== false ? shares.get(stepId) : undefined);
    const consentOf = (stepId: string) => stepId === consentStep;"""),
    ('MB2', MANUAL, SHARE_WIRING, """    if (true) {
        for (const s of scripts) {
            if (!s.share) continue;
            if (consentStep === undefined) consentStep = s.share.shots[0]?.step;
            for (const shot of s.share.shots) shares.set(shot.step, { media: shot.media, caption: s.share.caption });
        }
    }
    const shareOf = (stepId: string) => shares.get(stepId);
    const consentOf = (stepId: string) => stepId === consentStep;"""),
    ('MB3', MANUAL, SHARE_FILL, """            const regular = new Set(s.steps.filter((st) => !st.moved && st.minutes !== 0).map((st) => st.id));
            for (const shot of s.share.shots) if (regular.has(shot.step)) shares.set(shot.step, { media: shot.media, caption: s.share.caption });"""),
    ('MB4', MANUAL, """    const [first, ...rest] = steps.map((st) => renderStep(st, lang, l, { pageOf, share: shareOf?.(st.id), consent: consentOf?.(st.id) }));""", """    const [first, ...rest] = steps.map((st) => renderStep(st, lang, l, { pageOf, consent: consentOf?.(st.id) }));"""),
    ('MB5', MANUAL, SHARE_FILL, """            for (const shot of s.share.shots.slice(0, 1)) shares.set(shot.step, { media: shot.media, caption: s.share.caption });"""),
    ('MB6', MANUAL, """photo: '<svg class="st-share-icon" data-share-media="photo\"""", """photo: '<svg class="st-share-icon" data-share-media="video\""""),
    ('MB7', MANUAL, """<span class="st-share-label">${escapeHtml(share.media === 'photo' ? l.sharePhoto : l.shareVideo)}</span>""", """<span class="st-share-label" data-share-media="${share.media}">${escapeHtml(share.media === 'photo' ? l.sharePhoto : l.shareVideo)}</span>"""),
    ('MB8', MANUAL, """<p class="st-share-caption">${escapeHtml(share.caption.en)}</p>""", """<p class="st-share-caption">${share.caption.en}</p>"""),
    ('MB9', MANUAL, """<p class="st-share-caption">${escapeHtml(share.caption.th)}</p>""", """<p class="st-share-caption">${share.caption.th}</p>"""),
    ('MB10', MANUAL, """${lang === 'th' && share.caption.th ? `<p class="st-share-caption">${escapeHtml(share.caption.th)}</p>` : ''}""", """${share.caption.th ? `<p class="st-share-caption">${escapeHtml(share.caption.th)}</p>` : ''}"""),
    ('MB11', MANUAL, TH_BLOCK, """        <p class="st-share-caption">${escapeHtml(share.caption.en)}</p>
        ${lang === 'th' && share.caption.th ? `<p class="st-share-caption">${escapeHtml(share.caption.th)}</p>` : ''}"""),
    ('MB12', MANUAL, CONSENT_LINE, """    const consentOf = (stepId: string) => options.share === true && shares.has(stepId);"""),
    ('MB13', MANUAL, CONSENT_LINE, """    const consentOf = (stepId: string) => options.share === true && scripts.some((s) => s.share?.shots[0]?.step === stepId);"""),
    ('MB14', MANUAL, CONSENT_LINE, """    const consentOf = (stepId: string) => {
        const g = globalThis as unknown as { consentShown?: boolean };
        const on = options.share === true && stepId === consentStep && !g.consentShown;
        if (on) g.consentShown = true;
        return on;
    };"""),
    ('MB15', MANUAL, """    const consentBlock = options.consent ? `""", """    const consentBlock = options.consent && lang === 'en' ? `"""),
    ('MB16', I18N, """    sharePhoto: '\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e',""", """    sharePhoto: '',"""),
    ('MB17', MANUAL, """photo: '<svg class="st-share-icon" data-share-media="photo" viewBox="0 0 24 24" fill="none" stroke="#000\"""", """photo: '<svg class="st-share-icon" data-share-media="photo" viewBox="0 0 24 24" fill="none" stroke="#2e6b30\""""),
    ('MB18', MANUAL_CLI, """    const result = compileStorytimeManual(weeks, { lang, paper: 'a4', loops, share });""", """    const result = compileStorytimeManual(weeks, { lang, paper: 'a4', loops });"""),
    ('MB19', PRINT_CLI, """            if (parsed.length > 1) await renderChromePdf([week], weekPdf, tmp, pagedSrc, loops, share, studentBookPages);""", """            if (parsed.length > 1) await renderChromePdf([week], weekPdf, tmp, pagedSrc, loops, studentBookPages);"""),
    ('MB20', MANUAL_CLI, """        else if (a === '--share') share = true;
""", ""),
    ('MB21', MANUAL, """    ${s.steps.filter((st) => !st.moved && !isOpeningSongStep(st)).map((st) => renderStep(st, lang, l, { loops: options.loops, pageOf, share: shareOf(st.id), consent: consentOf(st.id), questions: st.id === 'D3' ? w.books.find((book) => book.kind === 'readalong')?.questions : undefined })).join('')}""", """    ${s.steps.filter((st) => !st.moved && !isOpeningSongStep(st)).map((st) => renderStep(st, lang, l, { loops: options.loops, pageOf, title: pick(st.title, lang) + (options.share ? ' share' : ''), share: shareOf(st.id), consent: consentOf(st.id), questions: st.id === 'D3' ? w.books.find((book) => book.kind === 'readalong')?.questions : undefined })).join('')}"""),
    ('MB22', MANUAL, """share.media === 'photo' ? l.sharePhoto : l.shareVideo""", """share.media === 'photo' ? l.shareVideo : l.sharePhoto"""),
    ('MB23', MANUAL, """            if (!s.share) continue;""", """            if (!s.share) throw new Error('the week file has no share');"""),
    ('MB24', MANUAL, """    const shareBlock = share ? `""", """    const shareBlock = share && !options.pageOf ? `"""),
]

MX = [
    ('MX1', CAPTIONS, """    return { rows, problems };""", """    return { rows, problems: problems.filter((p) => p.includes('differs from the week file') || p.includes('cells') || p.startsWith('w')) };"""),
    ('MX2', CAPTIONS, COMPARE_BLOCK, """        if (source) {
            if (isSc && !source.every((cell, i) => cells[i + 1] === cell)) problems.push(`${id}: the row differs from the week file`);
            continue;
        }"""),
    ('MX3', CAPTIONS, COMPARE_BLOCK, """        if (source) {
            if (!source.slice(0, -1).every((cell, i) => cells[i + 1] === cell)) problems.push(`${id}: the row differs from the week file`);
            continue;
        }"""),
    ('MX4', CAPTIONS, """    if (level === undefined || listFile === undefined || !Number.isInteger(level) || level < 1 || level > 4) {
        console.error(USAGE);
        return 2;
    }""", """    if (level === undefined || listFile === undefined || !Number.isInteger(level) || level < 1 || level > 4) {
        console.error(USAGE);
        return 1;
    }"""),
    ('MX5', CAPTIONS, """    for (const id of expected.keys()) if (!seen.has(id) && !noShare.has(id)) problems.push(`${id}: the row is missing`);""", """    for (const id of expected.keys()) if (false && !seen.has(id) && !noShare.has(id)) problems.push(`${id}: the row is missing`);"""),
    ('MX6', CAPTIONS, COMPARE_BLOCK, """        if (source) {
            if (!source.slice(0, 1).every((cell, i) => cells[i + 1] === cell)) problems.push(`${id}: the row differs from the week file`);
            continue;
        }"""),
    ('MX7', CAPTIONS, """        problems.push(`${id}: the row is not in the sources`);""", """        // an extra row is not reported"""),
    ('MX8', CAPTIONS, """        if (seen.has(id)) {
            problems.push(`${id}: the row repeats`);
            continue;
        }""", """        if (seen.has(id)) {
            continue;
        }"""),
    ('MX9', CAPTIONS, """            if (!script.share) {
                noShare.add(id);
                problems.push(`${id}: the week file has no share`);
                continue;
            }""", """            if (!script.share) {
                noShare.add(id);
                continue;
            }"""),
    ('MX10', CAPTIONS, r"""        if (c === '\\' && line[i + 1] === '|') {
            cell += '|';
            i++;
            continue;
        }""", ""),
    ('MX11', CAPTIONS, """        if (!isSc && !row.startsWith('| SL-')) continue;""", """        if (!isSc && !row.startsWith('| SL-') && !row.startsWith('| Id') && !row.startsWith('|---')) continue;"""),
    ('MX12', CAPTIONS, COMPARE_BLOCK, """        if (source) {
            const mine = cells.slice(1).map((cell, i) => (isSc && i === 2 ? cell.split('; ').sort().join('; ') : cell));
            const theirs = source.map((cell, i) => (isSc && i === 2 ? cell.split('; ').sort().join('; ') : cell));
            if (!theirs.every((cell, i) => mine[i] === cell)) problems.push(`${id}: the row differs from the week file`);
            continue;
        }"""),
    ('MX13', CAPTIONS, COMPARE_BLOCK, """        if (source) {
            const squash = (cell: string) => cell.replace(/\\s+/g, ' ').trim();
            if (!source.every((cell, i) => squash(cells[i + 1] ?? '') === squash(cell))) problems.push(`${id}: the row differs from the week file`);
            continue;
        }"""),
]


def fill(text):
    return text.replace('<', chr(60)).replace('>', chr(62)).replace('`', chr(96))


def one(text, limit=220):
    return ' | '.join(text.split('\n'))[:limit]


def failing(out):
    for line in out.split('\n'):
        s = line.strip()
        if s.startswith('\u00d7'):
            return s[:200]
    for line in out.split('\n'):
        s = line.strip()
        if s.startswith('FAIL'):
            return s[:200]
    return '(no failing test line)'


def dirty():
    p = subprocess.run(['git', 'status', '--porcelain', 'dashboard/lib/storytime', 'dashboard/scripts/storytime'], cwd=REPO, capture_output=True, text=True)
    return p.stdout.strip()


def check(group):
    mutants = MB if group == 'mb' else MX
    bad = 0
    for item in mutants:
        rid, rel = item[0], item[1]
        text = open(os.path.join(REPO, rel), encoding='utf-8').read()
        n = text.count(fill(item[2]))
        mark = 'OK' if n == 1 else 'BAD'
        if n != 1:
            bad += 1
        print(f'{rid}: {rel}: snippet count {n}: {mark}')
    print(f'check: {len(mutants) - bad} of {len(mutants)} snippets fit')
    return 0 if bad == 0 else 1


def run(group):
    mutants = MB if group == 'mb' else MX
    test = MB_TEST if group == 'mb' else MX_TEST
    state = dirty()
    print(f'pre-flight git status of the two folders: {state or "(nothing)"}')
    if state:
        print('ABORT: the source folders are dirty before the run')
        return 2
    os.makedirs(BACKUP, exist_ok=True)
    caught = 0
    survivors = []
    applied = 0
    na = 0
    restore_ok = True
    for item in mutants:
        rid, rel = item[0], item[1]
        if item[3] is None:
            na += 1
            print(f'{rid}: n/a - {item[4]}')
            continue
        old = fill(item[2])
        new = fill(item[3])
        src = os.path.join(REPO, rel)
        bak = os.path.join(BACKUP, f'{rid}-{os.path.basename(rel)}')
        shutil.copyfile(src, bak)
        applied += 1
        print(f'{rid}: file {rel}')
        print(f'{rid}: old  {one(old)}')
        print(f'{rid}: new  {one(new)}')
        try:
            text = open(src, encoding='utf-8').read()
            n = text.count(old)
            if n != 1:
                print(f'{rid}: NOT APPLIED, the snippet occurs {n} times')
                restore_ok = False
                continue
            open(src, 'w', encoding='utf-8').write(text.replace(old, new, 1))
            env = dict(os.environ)
            env['CI'] = 'true'
            p = subprocess.run(['npx', 'vitest', 'run', test, '--maxWorkers=1', '--bail=1'], cwd=DASH, env=env, capture_output=True, text=True, timeout=1800)
            out = ANSI.sub('', (p.stdout or '') + (p.stderr or ''))
            res = 'caught' if p.returncode != 0 else 'SURVIVED'
            print(f'{rid}: exit {p.returncode}, {res}')
            print(f'{rid}: first failing test: {failing(out)}')
            if p.returncode != 0:
                caught += 1
            else:
                survivors.append(rid)
        finally:
            shutil.copyfile(bak, src)
            ok = filecmp.cmp(bak, src, shallow=False)
            print(f'{rid}: restore cmp: {"ok" if ok else "NOT OK"}')
            restore_ok = restore_ok and ok
    print('')
    for rid in survivors:
        print(f'SURVIVOR: {rid}')
    print(f'mutants: {applied}, caught: {caught}')
    print(f'n/a: {na}')
    print(f'survivors: {len(survivors)}')
    print(f'restore cmp: {"ok" if restore_ok else "NOT OK"}')
    state = dirty()
    print('git status --porcelain dashboard/lib/storytime dashboard/scripts/storytime:')
    print(state or '(nothing)')
    print('git status: empty' if not state else 'git status: NOT EMPTY')
    return 0 if (restore_ok and not survivors) else 1


if __name__ == '__main__':
    group = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'run'
    sys.exit(check(group) if mode == 'check' else run(group))
