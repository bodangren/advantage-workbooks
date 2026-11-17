#!/usr/bin/env python3
"""Apply check of the sound stage change list (track storytime_l2_unit2_20261106, Task 3.5b).

The script changes no file of the repository. It reads `sound-stage-change-list.json` and checks it:

  a  Each "old" value equals the value of the draft at the revision (default HEAD).
  b  The list applies to a temporary copy of the 8 drafts, and only the listed values change.
  c  STAGE_CHECKS (the command of plan.md) runs on a temporary root, before and after the list.
  d  The Red test file `storytime-unit2-sound-stage.test.ts` runs on a temporary root, before and
     after the list (one heavy-run for each run; the test file reads its root from process.cwd()).
  e  The picture list has the same ids before and after, so no new picture is needed.
  f  Each day-1 word has a bank clip, and each new audio path exists, so no new audio is needed.

Run it directly, not inside a heavy-run: it takes the heavy lock itself for the two vitest runs.
The output holds no Thai text. A non-Claude role can read it.

Usage: python3 -I measure/runs/storytime_l2_unit2_20261106/sound-stage-change-list-apply-check.py [--rev REV] [--skip-red] [--keep]
"""
import argparse
import copy
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
LIST = os.path.join(HERE, 'sound-stage-change-list.json')
PLAN = os.path.join(REPO, 'measure', 'tracks', 'storytime_l2_unit2_20261106', 'plan.md')
DRAFTS = 'content/storytime/drafts/l2'
HEAVY = os.path.expanduser('~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh')
WEEKS = [f'w{n:02d}' for n in range(9, 17)]

LINES = []
RESULTS = []


def out(*parts):
    text = ' '.join(str(p) for p in parts)
    LINES.append(text)
    print(text, flush=True)


def result(name, ok, detail=''):
    RESULTS.append((name, ok))
    out(f"CHECK {name}: {'PASS' if ok else 'FAIL'}" + (f' ({detail})' if detail else ''))


def git(*args, check=True):
    return subprocess.run(['git', *args], cwd=REPO, capture_output=True, check=check)


def read_at(rev, week):
    return git('show', f'{rev}:{DRAFTS}/{week}.json').stdout.decode('utf-8')


SHOTS = re.compile(r'\{\n\s+"step": ("[^"]*"),\n\s+"media": ("[^"]*")\n\s+\}')


def dump(doc):
    """The file form of a draft: 2-space JSON, raw Thai, a newline at the end, and one-line `shots` objects."""
    text = json.dumps(doc, indent=2, ensure_ascii=False) + '\n'
    return SHOTS.sub(lambda m: '{ "step": %s, "media": %s }' % (m.group(1), m.group(2)), text)


def get(doc, path):
    for p in path:
        doc = doc[p]
    return doc


def put(doc, path, value):
    for p in path[:-1]:
        doc = doc[p]
    doc[path[-1]] = value


def leaf_diff(a, b, prefix=()):
    """The paths of the scalar leaves that differ, and a '#len' marker for a list of another length."""
    found = set()
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                found.add(prefix + (k,))
            else:
                found |= leaf_diff(a[k], b[k], prefix + (k,))
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            found.add(prefix + ('#len',))
        for i in range(min(len(a), len(b))):
            found |= leaf_diff(a[i], b[i], prefix + (i,))
    elif a != b or type(a) is not type(b):
        found.add(prefix)
    return found


def run_shell(cmd, cwd=REPO, env=None, timeout=1800):
    full_env = dict(os.environ)
    if env:
        full_env.update(env)
    p = subprocess.run(['bash', '-c', cmd], cwd=cwd, env=full_env, capture_output=True, timeout=timeout)
    return p.returncode, p.stdout.decode('utf-8', 'replace') + p.stderr.decode('utf-8', 'replace')


def stage_command():
    plan = open(PLAN, encoding='utf-8').read()
    m = re.search(r"^STAGE_CHECKS='(.*)'  # Phases 1 to 3", plan, re.M)
    if not m:
        raise SystemExit('STAGE_CHECKS not found in plan.md')
    return m.group(1)


GATE_ROW = re.compile(r'^  (PASS|FAIL|WARN)\s+(\S+)')
GATE_HEAD = re.compile(r'^st(\d+)/(\d+) ')


def parse_gate(text):
    """(week number, row id) -> status, from the check-weeks output; the weeks of level 2."""
    rows, week = {}, None
    for line in text.splitlines():
        h = GATE_HEAD.match(line)
        if h:
            week = int(h.group(2))
            continue
        r = GATE_ROW.match(line)
        if r and week is not None:
            rows[(week, r.group(2))] = r.group(1)
    summary = next((l for l in text.splitlines() if l.startswith('Summary:')), '')
    return rows, summary


def gate_fails(text):
    return [l for l in text.splitlines() if l.startswith('  FAIL ')]


def build_root(root, drafts_dir):
    """The stage root of the STAGE_CHECKS gate: a link copy of content/storytime, and real copies of the drafts."""
    os.makedirs(os.path.join(root, 'content'), exist_ok=True)
    subprocess.run(['cp', '-rs', os.path.join(REPO, 'content', 'storytime'), os.path.join(root, 'content') + '/'], check=True)
    for week in WEEKS:
        src = os.path.join(drafts_dir, f'{week}.json')
        for dest in (os.path.join(root, 'content', 'storytime', 'l2', f'{week}.json'),
                     os.path.join(root, 'content', 'storytime', 'drafts', 'l2', f'{week}.json')):
            subprocess.run(['cp', '--remove-destination', src, dest], check=True)


PICTURE_TS = """
import { readLevelWeeks, STORYTIME_ROOT } from './lib/storytime/files';
import { storytimePrintPictures } from './lib/storytime/print/pictures';
const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((w) => (w.week ? [w.week] : []));
const rows = storytimePrintPictures(weeks);
console.log(JSON.stringify(rows.map((r) => [r.id, r.week, r.use, r.text])));
"""


def picture_rows(root):
    graph = os.path.normpath(os.path.join(REPO, '..', 'mastery-advantage', 'english', 'phonics', 'phonics-knowledge-space.json'))
    env = {'WORKBOOKS_ROOT': root, 'MASTERY_PHONICS_GRAPH': graph}
    p = subprocess.run(['npx', 'tsx', '-e', PICTURE_TS], cwd=os.path.join(REPO, 'dashboard'),
                       env={**os.environ, **env}, capture_output=True, timeout=600)
    last = p.stdout.decode('utf-8').strip().splitlines()[-1] if p.stdout.strip() else '[]'
    return p.returncode, json.loads(last)


TESTS_LINE = re.compile(r'Tests\s+(?:(\d+) failed \| )?(\d+) passed \((\d+)\)')


def red_run(root):
    inner = (f'cd {root} && CI=true NO_COLOR=1 {REPO}/dashboard/node_modules/.bin/vitest run '
             f'--root {REPO}/dashboard __tests__/storytime-unit2-sound-stage.test.ts --maxWorkers=1')
    env = {'HEAVY_MIN_AVAIL_MB': '1500', 'HEAVY_PREFLIGHT_WAIT_S': '5400'}
    p = subprocess.run(['bash', HEAVY, '-c', inner], cwd=REPO, env={**os.environ, **env}, capture_output=True, timeout=3600)
    text = p.stdout.decode('utf-8', 'replace') + p.stderr.decode('utf-8', 'replace')
    text = re.sub(r'\x1b\[[0-9;]*m', '', text)
    m = TESTS_LINE.search(text)
    failed = int(m.group(1) or 0) if m else -1
    passed = int(m.group(2)) if m else -1
    total = int(m.group(3)) if m else -1
    return p.returncode, failed, passed, total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--rev', default='HEAD')
    ap.add_argument('--skip-red', action='store_true')
    ap.add_argument('--keep', action='store_true')
    args = ap.parse_args()

    sha = git('rev-parse', args.rev).stdout.decode().strip()
    out(f'Sound stage change list: apply check. Revision {args.rev} = {sha[:8]}. List: {os.path.relpath(LIST, REPO)}')

    entries = json.load(open(LIST, encoding='utf-8'))
    old_docs = {w: json.loads(read_at(args.rev, w)) for w in WEEKS}
    old_raw = {w: read_at(args.rev, w) for w in WEEKS}

    # (a) the old values
    bad = []
    seen = set()
    for i, e in enumerate(entries, 1):
        key = (e['week'], tuple(e['path']))
        if e['week'] not in old_docs:
            bad.append(f'#{i}: unknown week {e["week"]}')
            continue
        try:
            current = get(old_docs[e['week']], e['path'])
        except (KeyError, IndexError, TypeError):
            bad.append(f'#{i}: {e["week"]} path {e["path"]} does not exist')
            continue
        if current != e['old']:
            bad.append(f'#{i}: {e["week"]} {e["path"]}: old differs from the value at {sha[:8]}')
        if e['old'] == e['new'] or type(e['old']) is not type(e['new']):
            bad.append(f'#{i}: {e["week"]} {e["path"]}: new equals old or has another type')
        if key in seen:
            bad.append(f'#{i}: {e["week"]} {e["path"]}: repeated path')
        seen.add(key)
    for a in seen:
        for b in seen:
            if a != b and a[0] == b[0] and a[1][:len(b[1])] == b[1]:
                bad.append(f'path {a} lies inside path {b}')
    by_lang = {}
    for e in entries:
        by_lang[e['lang']] = by_lang.get(e['lang'], 0) + 1
    out(f'entries {len(entries)} over {len({e["week"] for e in entries})} weeks; by lang {by_lang}; new Thai forms {sum(1 for e in entries if e.get("newThaiForm"))}')
    for w in WEEKS:
        n = [e for e in entries if e['week'] == w]
        out(f'  {w}: {len(n)} entries ({sum(1 for e in n if e["lang"] == "en")} en, {sum(1 for e in n if e["lang"] == "th")} th, {sum(1 for e in n if e["lang"] == "-")} other)')
    for b in bad[:20]:
        out('  BAD', b)
    result('a-old-values-equal-HEAD', not bad, f'{len(entries)} entries' if not bad else f'{len(bad)} problems')

    # (b) apply to the temporary copies
    tmp = tempfile.mkdtemp(prefix='ss35b-')
    exit_code = 0
    try:
        round_trip = all(dump(old_docs[w]) == old_raw[w] for w in WEEKS)
        result('b1-file-form-round-trip', round_trip, 'dump(load(file)) equals the file bytes for the 8 drafts')
        new_docs = copy.deepcopy(old_docs)
        for e in entries:
            put(new_docs[e['week']], e['path'], copy.deepcopy(e['new']))
        drafts_new = os.path.join(tmp, 'drafts_new')
        os.makedirs(drafts_new)
        for w in WEEKS:
            open(os.path.join(drafts_new, f'{w}.json'), 'w', encoding='utf-8').write(dump(new_docs[w]))
        drafts_old = os.path.join(tmp, 'drafts_old')
        os.makedirs(drafts_old)
        for w in WEEKS:
            open(os.path.join(drafts_old, f'{w}.json'), 'w', encoding='utf-8').write(old_raw[w])
        expected, actual = {}, {}
        for w in WEEKS:
            expected[w] = set()
            for e in entries:
                if e['week'] == w:
                    expected[w] |= {tuple(e['path']) + d for d in leaf_diff(e['old'], e['new'])}
            actual[w] = leaf_diff(old_docs[w], new_docs[w])
        same = all(expected[w] == actual[w] for w in WEEKS)
        out('changed leaves by week: ' + ', '.join(f'{w} {len(actual[w])}' for w in WEEKS))
        result('b2-only-listed-values-change', same, 'the changed leaves equal the leaves of the list entries')
        changed_lines = {}
        import difflib
        for w in WEEKS:
            a = old_raw[w].splitlines()
            b = dump(new_docs[w]).splitlines()
            changed_lines[w] = sum(1 for l in difflib.unified_diff(a, b, lineterm='', n=0) if l[:1] in '+-' and l[:3] not in ('+++', '---'))
        out('changed text lines (added + removed) by week: ' + ', '.join(f'{w} {changed_lines[w]}' for w in WEEKS))

        # (c) STAGE_CHECKS before and after
        cmd = stage_command()
        after_cmd = cmd.replace('../content/storytime/drafts/l2/w*.json', f'{drafts_new}/w*.json')
        assert after_cmd != cmd
        rc0, text0 = run_shell(cmd)
        out(f'COMMAND STAGE_CHECKS (plan.md, repo drafts at {sha[:8]}): exit {rc0}')
        rc1, text1 = run_shell(after_cmd)
        out(f'COMMAND STAGE_CHECKS (plan.md, drafts with the list applied): exit {rc1}')
        rows0, sum0 = parse_gate(text0)
        rows1, sum1 = parse_gate(text1)
        out('summary before:', sum0)
        out('summary after: ', sum1)
        fail0 = sorted(k for k, v in rows0.items() if v == 'FAIL')
        fail1 = sorted(k for k, v in rows1.items() if v == 'FAIL')
        r14 = ('sound-stage-mix', 'sound-stage-day1', 'sound-stage-plan')
        r14_fail0 = [k for k in fail0 if k[1] in r14]
        out(f'FAIL rows before: {len(fail0)} ({len(r14_fail0)} R14 rows) ' + ', '.join(f'st2/{w} {i}' for w, i in fail0))
        out(f'FAIL rows after:  {len(fail1)} ' + ', '.join(f'st2/{w} {i}' for w, i in fail1))
        out('R14 rows, week: mix / day1 / plan, before -> after')
        for w in range(9, 17):
            cells = []
            for rid in r14:
                cells.append(f'{rows0.get((w, rid), "-")}->{rows1.get((w, rid), "-")}')
            out(f'  st2/{w}: ' + ' / '.join(cells))
        result('c1-before-has-14-R14-FAIL-rows', len(r14_fail0) == 14 and set(fail0) - set(r14_fail0) == {(12, 'song-frame')},
               f'{len(r14_fail0)} R14 FAIL rows and the song-frame row of st2/12')
        result('c2-after-has-0-R14-FAIL-rows', not [k for k in fail1 if k[1] in r14], 'sound-stage-mix, sound-stage-day1, sound-stage-plan')
        result('c3-after-only-song-frame-st2/12', fail1 == [(12, 'song-frame')], 'the recorded exception of D15')
        changed = sorted(k for k in set(rows0) | set(rows1) if rows0.get(k) != rows1.get(k))
        flips = [k for k in changed if rows0.get(k) == 'FAIL' and rows1.get(k) == 'PASS']
        result('c4-no-other-row-changes-status', set(changed) == set(r14_fail0) and set(flips) == set(r14_fail0),
               f'{len(changed)} rows changed status, all 14 are the R14 FAIL rows')
        pm = [k for k, v in rows1.items() if k[1] == 'print-missing' and 9 <= k[0] <= 15]
        out(f'print-missing warnings of st2/9 to st2/15 after: {len(pm)}')
        result('c5-no-print-missing-warning', not pm)
        warn0 = sum(1 for v in rows0.values() if v == 'WARN')
        warn1 = sum(1 for v in rows1.values() if v == 'WARN')
        result('c6-warning-count-unchanged', warn0 == warn1, f'{warn0} before, {warn1} after')
        norm = lambda t: [re.sub(r'\[[^\]]*\]', '[X]', l) for l in t.splitlines()]
        lines0, lines1 = norm(text0), norm(text1)
        pairs = [(x, y) for x, y in zip(lines0, lines1) if x != y] if len(lines0) == len(lines1) else None
        if pairs is None:
            result('c8-only-expected-output-lines-differ', False, f'line counts differ: {len(lines0)} and {len(lines1)}')
        else:
            n_r14 = sum(1 for x, y in pairs if x.startswith('  FAIL    sound-stage-') and y.startswith('  PASS    sound-stage-') and x.split()[1] == y.split()[1])
            n_clips = sum(1 for x, y in pairs if x.startswith('  WARN    practice-clips') and y.startswith('  WARN    practice-clips'))
            n_sum = sum(1 for x, y in pairs if x.startswith('Summary:') and y.startswith('Summary:'))
            other = len(pairs) - n_r14 - n_clips - n_sum
            out(f'output lines that differ before and after: {n_r14} R14 rows (FAIL to PASS), {n_clips} practice-clips WARN word lists (the day-1 words are new opening words), {n_sum} summary line, {other} other')
            result('c8-only-expected-output-lines-differ', other == 0 and n_r14 == 14, f'{len(pairs)} of {len(lines0)} lines differ')
        out('STAGE_CHECKS exit 1 after the list comes from the song-frame row of st2/12 only (the recorded exception of D15)' if fail1 == [(12, 'song-frame')] else 'STAGE_CHECKS after the list: unexpected FAIL rows')

        # the map of the R14 FAIL rows to the list entries
        out('MAP: each part of each R14 FAIL row at the revision -> list entries (numbers are 1-based positions in the json)')
        detail_re = re.compile(r'^  FAIL\s+(sound-stage-\S+)\s+.* — (.*)$')
        head, week, details = None, None, {}
        for line in text0.splitlines():
            h = GATE_HEAD.match(line)
            if h:
                week = int(h.group(2))
            m = detail_re.match(line)
            if m and week is not None:
                details[(week, m.group(1))] = m.group(2)
        unmapped = []
        for (wk, rid), detail in sorted(details.items()):
            wname = f'w{wk:02d}'
            pieces = []
            for part in detail.replace('mixed: ', '', 1).split('; '):
                m_where = re.match(r'^(?:outside stage: )?([a-z][A-Za-z0-9_.]*) \((?:first|last|middle)(?:\+\w+)?\)$', part)
                prefixes = []
                if rid == 'sound-stage-day1' and re.match(r'^(new sound|untaught sound|position): ', part):
                    prefixes = [['opening', 'pa', 0], ['opening', 'audio', 0]]
                elif part.startswith('tag outside stage: '):
                    prefixes = [['tags']]
                elif m_where:
                    prefix = [int(tok) if tok.isdigit() else tok for tok in m_where.group(1).split('.')]
                    if prefix[0] == 'scripts':
                        prefix = ['scripts', prefix[1], 'steps', prefix[3]]
                    elif prefix[0] == 'opening':
                        prefix = ['opening', 'pa', prefix[2]]
                    prefixes = [prefix]
                hits = [i for i, e in enumerate(entries, 1)
                        if e['week'] == wname and any(e['path'][:len(pf)] == pf for pf in prefixes)]
                if not hits:
                    unmapped.append((wk, rid, part))
                label = ' + '.join('.'.join(map(str, pf)) for pf in prefixes) or '?'
                piece = f'{label} -> {",".join(map(str, hits))}'
                if piece not in pieces:
                    pieces.append(piece)
            out(f'  st2/{wk} {rid}: ' + ' | '.join(pieces))
        result('c7-each-R14-FAIL-part-maps-to-list-rows', not unmapped and len(details) == 14, f'{len(details)} rows mapped')

        # (d) the Red test file
        if args.skip_red:
            out('COMMAND Red test file: skipped (--skip-red)')
        else:
            root0 = os.path.join(tmp, 'root_old')
            root1 = os.path.join(tmp, 'root_new')
            build_root(root0, drafts_old)
            build_root(root1, drafts_new)
            rc, f0, p0, t0 = red_run(root0)
            out(f'COMMAND vitest {os.path.basename("storytime-unit2-sound-stage.test.ts")} on the temp root before the list (heavy-run): exit {rc}; {f0} failed, {p0} passed of {t0}')
            ok0 = rc == 1 and f0 == 24 and t0 == 72
            rc2, f1, p1, t1 = red_run(root1)
            out(f'COMMAND vitest {os.path.basename("storytime-unit2-sound-stage.test.ts")} on the temp root with the list applied (heavy-run): exit {rc2}; {f1} failed, {p1} passed of {t1}')
            result('d1-red-file-fails-24-before', ok0, 'the control: the temp root, not the repository, is read')
            result('d2-red-file-passes-after', rc2 == 0 and f1 == 0 and t1 == 72, '72 of 72')

        # (e) the picture list
        root_a = os.path.join(tmp, 'pic_old')
        root_b = os.path.join(tmp, 'pic_new')
        build_root(root_a, drafts_old)
        build_root(root_b, drafts_new)
        rca, pa = picture_rows(root_a)
        rcb, pb = picture_rows(root_b)
        out(f'COMMAND picture list (storytimePrintPictures over level 2) before: exit {rca}, {len(pa)} rows; after: exit {rcb}, {len(pb)} rows')
        result('e-picture-ids-unchanged', rca == 0 and rcb == 0 and pa == pb and len(pa) > 0, 'same ids, weeks, uses, and texts: no new picture')

        # (f) the clips and the audio
        words = {}
        for e in entries:
            if e['path'][:2] == ['opening', 'pa'] and e['path'][3:] == ['en'] and e['path'][2] == 0:
                words[e['week']] = re.findall(r'Listen: ([A-Za-z]+)\.', e['new'])
        manifest = json.load(open(os.path.join(REPO, 'content', 'storytime', 'words', 'manifest.json'), encoding='utf-8'))
        ids = {i['word'] for i in manifest['items']}
        miss = []
        for w, lst in sorted(words.items()):
            for word in lst:
                clip = os.path.join(REPO, 'content', 'storytime', 'words', f'wa-{word}.mp3')
                ok = os.path.isfile(clip) and word in ids
                out(f'  {w} day-1 word {word}: content/storytime/words/wa-{word}.mp3 {"exists" if ok else "MISSING"}')
                if not ok:
                    miss.append((w, word))
        audio_paths = [p for e in entries if e['path'][:2] == ['opening', 'audio'] for p in e['new']]
        miss_audio = [p for p in audio_paths if not os.path.isfile(os.path.join(REPO, 'content', 'storytime', p))]
        result('f1-day-1-words-have-bank-clips', not miss and len(words) == 5, f'{sum(len(v) for v in words.values())} words in {len(words)} weeks')
        result('f2-new-audio-paths-exist', not miss_audio and bool(audio_paths), f'{len(audio_paths)} paths; no new audio')

        # the working tree
        dirty = git('status', '--porcelain', 'content/').stdout.decode().strip()
        out(f'git status --porcelain content/ prints: {dirty!r}')
        result('g-content-tree-unchanged', dirty == '')
    finally:
        if args.keep:
            out(f'kept the temp folder {tmp}')
        else:
            shutil.rmtree(tmp, ignore_errors=True)

    thai = sum(1 for ch in '\n'.join(LINES) if '฀' <= ch <= '๿')
    out(f'Thai characters in this output: {thai}')
    failed = [n for n, ok in RESULTS if not ok]
    out(f'CHECKS: {len(RESULTS) - len(failed)} of {len(RESULTS)} PASS' + (f'; FAIL: {", ".join(failed)}' if failed else ''))
    out('RESULT: ' + ('PASS' if not failed and thai == 0 else 'FAIL'))
    return 0 if not failed and thai == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
