#!/usr/bin/env python3
"""Task 3.6 part 2 and Task 3.3 record (track storytime_l2_unit2_20261106).

Applies `sound-stage-change-list.json` word for word to the 8 staged drafts, and writes
Daniel's Thai approval into `approval.thai` of each draft. The file form is the form of
`sound-stage-change-list-apply-check.py` (`dump`). The output holds no Thai text.

Usage: python3 -I measure/runs/storytime_l2_unit2_20261106/t36-p2-apply.py
"""
import copy
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
DRAFTS = os.path.join(REPO, 'content', 'storytime', 'drafts', 'l2')
WEEKS = [f'w{n:02d}' for n in range(9, 17)]

spec = importlib.util.spec_from_file_location('applycheck', os.path.join(HERE, 'sound-stage-change-list-apply-check.py'))
ac = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ac)

THAI = {
    'status': 'approved',
    'date': '2026-11-25',
    'words': 'Ok',
    'source': (
        "Daniel, Google Tasks, 2026-11-25 12:26 UTC (19:26 ICT), reply to the Task dVJTeTd4amN6cjZ6VnFFcA "
        "'Thai check: Storytime unit 2 (weeks 9-16), by 11-28', relayed by the orchestrator session. "
        "Drive folder https://drive.google.com/drive/folders/1A4TBifRIlbwUNJ1ypcLoD08Q9SXQDQXY: the Thai teacher book draft PDF "
        "(SHA-256 42e0114a27551d7091f9f11b0435754dd0efb48c0a295274b67b6e2e25a9a7a5), home-card-lines.md, thai-new-terms.md, "
        "share-captions-sheet.md, the hand-off MANIFEST.txt (SHA-256 82e8ed31c109a9c367e6ff1a3593b820a7cb4361426840e718501fab712bc09a), "
        "and the sound stage change list (measure/runs/storytime_l2_unit2_20261106/sound-stage-change-list.md, commit 7193a137). "
        "The approval includes the change list, applied word for word in Task 3.6 part 2."
    ),
}


def main():
    entries = json.load(open(os.path.join(HERE, 'sound-stage-change-list.json'), encoding='utf-8'))
    docs, raw = {}, {}
    for w in WEEKS:
        path = os.path.join(DRAFTS, f'{w}.json')
        raw[w] = open(path, encoding='utf-8').read()
        docs[w] = json.loads(raw[w])
        if ac.dump(docs[w]) != raw[w]:
            print(f'{w}: file form does not round-trip; stop')
            return 1
    bad = 0
    for i, e in enumerate(entries, 1):
        if ac.get(docs[e['week']], e['path']) != e['old']:
            print(f'#{i} {e["week"]} {e["path"]}: old value differs; stop')
            bad += 1
    if bad:
        return 1
    for e in entries:
        ac.put(docs[e['week']], e['path'], copy.deepcopy(e['new']))
    for w in WEEKS:
        if docs[w]['approval']['thai'].get('status') != 'draft':
            print(f'{w}: approval.thai is not draft; stop')
            return 1
        docs[w]['approval']['thai'] = dict(THAI)
        open(os.path.join(DRAFTS, f'{w}.json'), 'w', encoding='utf-8').write(ac.dump(docs[w]))
        n = sum(1 for e in entries if e['week'] == w)
        print(f'{w}: {n} list entries applied; approval.thai approved 2026-11-25')
    print(f'applied {len(entries)} entries over {len({e["week"] for e in entries})} weeks')
    return 0


if __name__ == '__main__':
    sys.exit(main())
