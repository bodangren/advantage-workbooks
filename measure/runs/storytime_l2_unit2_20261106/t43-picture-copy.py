#!/usr/bin/env python3
"""Task 4.3 picture copy (track storytime_l2_unit2_20261106).

Copies the delivered unit 2 pictures (color and line art) of the 229 rows of
`content/storytime/l2/print/u2/pictures.json` from the 4 Forge folders into
`content/storytime/l2/print/pictures/`, and appends their jobs to the `manifest.json` of that
folder. The job of a row comes from the first folder in the union order that holds it:
look1, repair1, retry1, main (Task 2.7 part 3). Each copied file must equal the SHA-256 of its
job. A unit 1 file or job does not change. The script writes a backup of the manifest first.
The output holds no Thai text.

Usage: python3 -I measure/runs/storytime_l2_unit2_20261106/t43-picture-copy.py [--dry-run]
"""
import hashlib
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
HANDOFF = os.path.expanduser('~/Desktop/handoff')
FOLDERS = [
    ('look1', os.path.join(HANDOFF, 'storytime-l2u2-book-pictures-look1')),
    ('repair1', os.path.join(HANDOFF, 'storytime-l2u2-book-pictures-repair1')),
    ('retry1', os.path.join(HANDOFF, 'storytime-l2u2-book-pictures-retry1')),
    ('main', os.path.join(HANDOFF, 'storytime-l2u2-book-pictures')),
]
DEST = os.path.join(REPO, 'content', 'storytime', 'l2', 'print', 'pictures')
ROWS = os.path.join(REPO, 'content', 'storytime', 'l2', 'print', 'u2', 'pictures.json')


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()


def files_of(job):
    """The color and the line file of the selected candidate, with their SHA-256."""
    if job.get('status') != 'ready':
        return None
    cand = next((c for c in job.get('candidates', []) if c.get('version') == job.get('selectedVersion')), None)
    if not cand or cand.get('status') != 'ready' or (cand.get('lineArt') or {}).get('status') != 'ready':
        return None
    return [(cand['file'], cand['fileSha256'].lower()), (cand['lineArt']['file'], cand['lineArt']['fileSha256'].lower())]


def main():
    dry = '--dry-run' in sys.argv
    rows = json.load(open(ROWS, encoding='utf-8'))
    manifests = {name: json.load(open(os.path.join(folder, 'manifest.json'), encoding='utf-8')) for name, folder in FOLDERS}
    dest_manifest_path = os.path.join(DEST, 'manifest.json')
    dest = json.load(open(dest_manifest_path, encoding='utf-8'))
    have = {job['id'] for job in dest['jobs']}
    plan, problems, sources = [], [], {}
    for row in rows:
        rid = row['id']
        if rid in have:
            problems.append(f'{rid}: the print folder already holds a job')
            continue
        for name, folder in FOLDERS:
            jobs = [j for j in manifests[name]['jobs'] if j.get('id') == rid]
            if len(jobs) != 1:
                continue
            files = files_of(jobs[0])
            if not files:
                continue
            ok = all(os.path.isfile(os.path.join(folder, f)) and sha(os.path.join(folder, f)) == h for f, h in files)
            if not ok:
                problems.append(f'{rid}: {name} file missing or SHA-256 differs')
                break
            plan.append((rid, name, folder, jobs[0], files))
            sources[name] = sources.get(name, 0) + 1
            break
        else:
            problems.append(f'{rid}: no ready job in the 4 folders')
    for rid, name, folder, job, files in plan:
        for f, h in files:
            target = os.path.join(DEST, f)
            if os.path.exists(target) and sha(target) != h:
                problems.append(f'{rid}: {f} exists in the print folder with another SHA-256')
    print(f'rows {len(rows)}; planned {len(plan)}; sources {sources}; problems {len(problems)}')
    for p in problems[:20]:
        print('  PROBLEM', p)
    if problems or dry:
        return 1 if problems else 0
    backup = os.path.expanduser('~/Desktop/print-ready/storytime/l2-print-pictures-manifest-before-u2-2026-11-25.json')
    shutil.copyfile(dest_manifest_path, backup)
    copied = 0
    for rid, name, folder, job, files in plan:
        for f, h in files:
            target = os.path.join(DEST, f)
            if not os.path.exists(target):
                shutil.copyfile(os.path.join(folder, f), target)
                copied += 1
            if sha(target) != h:
                print(f'  FAIL {rid}: {f} SHA-256 after the copy differs')
                return 1
        dest['jobs'].append(job)
    with open(dest_manifest_path, 'w', encoding='utf-8') as out:
        json.dump(dest, out, indent=2, ensure_ascii=False)
        out.write('\n')
    print(f'copied {copied} files; jobs {len(dest["jobs"])} (was {len(have)}); manifest backup {os.path.relpath(backup, REPO)}')
    print(f'manifest SHA-256 before {sha(backup)} after {sha(dest_manifest_path)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
