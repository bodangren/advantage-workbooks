#!/usr/bin/env python3
"""Task 3.6 (Green, PA-P3-1): the sound stage fields and the day-1 lines of unit 2 weeks 9 to 16.

Edits, in the order of the task brief:
  1. focus.paStage = {stage: 2, positions: [first, last]} on each of the 8 drafts.
  2. week 9 tags.taught gets english.phonics.pa.final-sound.identify once.
  3. opening.pa[0] (en and th) and opening.audio[0] become the day-1 line of the previous
     teaching week of the level, copied byte for byte; the chain starts at w09 <- w08.
     Exception: w10 keeps its own day-1 line. The chain source for w10 is w08's line, and
     that line names /a/, which is week 10's new sound, so the sound-stage-day1 row of w10
     would fail with `new sound: /a/`. Week 10's own line already holds no new sound, no
     untaught sound, and asks the first sound only, which is the rule of D-U2-S4.

The script reads the week files at HEAD and writes them from that base, so it is repeatable.
It writes no Thai text of its own: the only Thai that it writes is a copy of a source week's
Thai string. It edits the file text surgically, so the 2-space format and the inline objects
of the files stay as they are. It prints counts, paths, and English only.
"""

import copy
import json
import re
import subprocess
import sys

ROOT = '/home/daniebo/Desktop/Workbooks'
THAI = re.compile('[\u0E00-\u0E7F]')
TAG = 'english.phonics.pa.final-sound.identify'
KEEP_OWN_DAY1 = 10

PA_STAGE_BLOCK = [
    '    "paStage": {',
    '      "stage": 2,',
    '      "positions": [',
    '        "first",',
    '        "last"',
    '      ]',
    '    },',
]


def rel_path(n):
    return f'content/storytime/drafts/l2/w{n:02d}.json' if n >= 9 else f'content/storytime/l2/w{n:02d}.json'


def head_text(path):
    return subprocess.run(['git', 'show', f'HEAD:{path}'], cwd=ROOT, check=True,
                          capture_output=True, text=True).stdout


def block_end(lines, start, closing):
    """The index of the first line equal to `closing` at or after `start`."""
    for i in range(start, len(lines)):
        if lines[i] == closing:
            return i
    raise AssertionError(f'no closing line {closing!r} after line {start + 1}')


def replace_pa0(lines, en, th):
    start = lines.index('    "pa": [')
    en_at = next(i for i in range(start, len(lines)) if lines[i].startswith('        "en": '))
    th_at = en_at + 1
    assert lines[th_at].startswith('        "th": '), lines[th_at][:40]
    lines[en_at] = '        "en": ' + json.dumps(en, ensure_ascii=False) + ','
    lines[th_at] = '        "th": ' + json.dumps(th, ensure_ascii=False)


def replace_audio0(lines, audio):
    opening = lines.index('  "opening": {')
    start = next(i for i in range(opening, len(lines)) if lines[i] == '    "audio": [')
    inner = start + 1
    assert lines[inner] == '      [', lines[inner][:40]
    end = next(i for i in range(inner, len(lines)) if lines[i].rstrip(',') == '      ]')
    tail = lines[end][len('      ]'):]
    new = ['      ['] + ['        ' + json.dumps(p, ensure_ascii=False) + (',' if i + 1 < len(audio) else '')
                         for i, p in enumerate(audio)] + ['      ]' + tail]
    lines[inner:end + 1] = new


def insert_pa_stage(lines):
    start = lines.index('    "paSkill": {')
    end = block_end(lines, start, '    },')
    lines[end + 1:end + 1] = PA_STAGE_BLOCK


def insert_tag(lines, after):
    at = lines.index('      ' + json.dumps(after) + ',') + 1
    lines[at:at] = ['      ' + json.dumps(TAG) + ',']


def main():
    source = json.loads(head_text(rel_path(8)))
    carry = {
        'en': source['opening']['pa'][0]['en'],
        'th': source['opening']['pa'][0]['th'],
        'audio': source['opening']['audio'][0],
    }
    print('day-1 source: w08 opening.pa[0] (English, Thai, the 4 day-1 audio files)')

    for n in range(9, 17):
        path = rel_path(n)
        raw = head_text(path)
        original = json.loads(raw)
        lines = raw.split('\n')
        assert lines[-1] == '', 'the file ends with a newline'

        want = copy.deepcopy(original)
        focus = {}
        for key, value in want['focus'].items():
            focus[key] = value
            if key == 'paSkill':
                focus['paStage'] = {'stage': 2, 'positions': ['first', 'last']}
        want['focus'] = focus
        if n != KEEP_OWN_DAY1:
            want['opening']['pa'][0]['en'] = carry['en']
            want['opening']['pa'][0]['th'] = carry['th']
            want['opening']['audio'][0] = carry['audio']
            replace_pa0(lines, carry['en'], carry['th'])
            replace_audio0(lines, carry['audio'])
        insert_pa_stage(lines)
        if n == 9:
            taught = want['tags']['taught']
            at = taught.index('english.phonics.letter.d.form-lower') + 1
            want['tags']['taught'] = taught[:at] + [TAG] + taught[at:]
            insert_tag(lines, 'english.phonics.letter.d.form-lower')

        after = json.loads('\n'.join(lines))
        assert after == want, f'w{n:02d}: the text edit differs from the intended object edit'
        assert after['opening']['pa'][0]['th'].encode() == want['opening']['pa'][0]['th'].encode()
        assert len(after['opening']['pa']) == 5
        assert len(after['opening']['audio']) == 5

        with open(f'{ROOT}/{path}', 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        day1 = 'kept (own line)' if n == KEEP_OWN_DAY1 else 'copied from the week before'
        print(f'w{n:02d}: paStage {after["focus"]["paStage"]}, day-1 {day1}, '
              f'en {len(after["opening"]["pa"][0]["en"])} chars, audio {len(after["opening"]["audio"][0])} files')
        carry = {
            'en': after['opening']['pa'][0]['en'],
            'th': after['opening']['pa'][0]['th'],
            'audio': after['opening']['audio'][0],
        }

    assert not THAI.search('\n'.join(str(x) for x in [TAG, str(KEEP_OWN_DAY1)]))
    print('done: 8 files written from HEAD; Thai filter 0')


if __name__ == '__main__':
    sys.exit(main())
