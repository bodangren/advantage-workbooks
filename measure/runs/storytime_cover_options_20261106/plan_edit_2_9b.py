#!/usr/bin/env python3
"""Inserts the Task 2.9 part 2 teacher v2 record into the plan (track storytime_cover_options_20261106).

It inserts exactly one line, right before the line that starts with
`- [ ] Task 2.10 (Look at every page)`. It asserts that the line before that line starts with
`  - Part 1 check 1 (2026-11-10`. It changes no other line.

Usage: python3 -I -B plan_edit_2_9b.py
"""

import re

PLAN = '/home/daniebo/Desktop/Workbooks/measure/tracks/storytime_cover_options_20261106/plan.md'
ANCHOR = '- [ ] Task 2.10 (Look at every page)'
BEFORE_ANCHOR = '  - Part 1 check 1 (2026-11-10'
THAI = re.compile('[\u0e00-\u0e7f]')

NEW_LINE = (
    '  - Part 2 teacher v2 (2026-11-10, jr-green, model deepseek/deepseek-flash#high; role base '
    '`c20db3d3`; PM hand-off TC1): The teacher cover v2 was built in both top variants with the '
    'Forge teacher front. The front art is '
    '`/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/'
    'l2-u1-cover-quest-teacher-front-forge-v1.png` with SHA-256 '
    '`c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53`, and its `MANIFEST.txt` '
    'holds `50069dce22d85fc75bf833ac06538fdd3a17f295541ee8cefb72534ee106e128`. '
    '`prep-teacher-front-2-9b.mjs` checked the SHA-256, the size 2480 x 3508 px, and the 3 '
    'channels, and made no resize. It set the density 300 and proved the raw pixels unchanged: both '
    'raw SHA-256 values hold `8fc2be064dc2f81c91f2debf7808582839db8881ee073bf31901157f76de4b24`. '
    'The prepared teacher front holds '
    '`0901411875407c09bd69e779f5aad31b36147d84d0e742feee6316712bf96283` and passes 6 of 6 checks of '
    '`options/upscale_check.mjs` without `--real`. The pictures folder held 31 files; the 29 hard '
    'links gave 29 of 29 SHA-256 pairs equal and 29 of 29 the same inode. The edge-filled back holds '
    '`881e93b2a87385eb15e5cf0240df8629c501a10f0375284f9cec2fe09eda37c4`, and its source holds '
    '`5411e37ec7044d7afd70726ee5fffeccd985225ef0b0da4283db8e6a3979b7bf` before and after the fill. '
    'The 2 builds ran on 2026-11-11 from 00:08 to 00:15 ICT, in one heavy-run wrapper each. Each '
    'build exits 0 on the first attempt, prints `Covers of Level 2 Unit 1 set 1: 32 pages, 44 '
    'files`, and prints 4 lines `All checks pass.`: (a) r5 in `build-2-9b-r5.txt`, (b) A2 with '
    '`--top hlogo` in `build-2-9b-a2.txt`. The 10 copies into `teacher/` are byte copies, and 10 of '
    '10 SHA-256 pairs are equal: `teacher/teacher-front.png` '
    '`ca6678c57507f846a2b22f6aef2cad4da4cc4210887b3a43c1c739cc293f63c0`, '
    '`teacher/teacher-back.png` '
    '`ac56760f7ac0344a96a9c49e17a5d69b04bd64fd2c670e6b3bfd098c11d39005`, '
    '`teacher/teacher-cover.pdf` '
    '`35022d2276570f4aef83d4a00ade267a6d3f81020644073a8ccd249d5276fea8`, '
    '`teacher/build-report.json` '
    '`aa9e752bf7ac01cc01b8a1955a6fcf2e9dc8174acca58d4fa7ba297268c6ce75`, '
    '`teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf` '
    '`1d2bcd99b347836a0dc48b8518064edb919947c0c0b26e076f05e1973f304e0e`, '
    '`teacher/teacher-front-alt-hlogo.png` '
    '`a9670c598e2a8ea5b3638c7f81a2f6cde64f632a53bd6fc319101d6263f690b8`, '
    '`teacher/teacher-back-alt-hlogo.png` '
    '`cbf27022df38adad43f748094e8b41970169a0981541f68f9959aff5355f3d30`, '
    '`teacher/teacher-cover-alt-hlogo.pdf` '
    '`c7419c73038b84171efac4d93a8f7d888524da5117f35fce610087ee74786e15`, '
    '`teacher/build-report-alt-hlogo.json` '
    '`aa9e752bf7ac01cc01b8a1955a6fcf2e9dc8174acca58d4fa7ba297268c6ce75`, and '
    '`teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo_PDFX-1a.pdf` '
    '`f0c43292cca3add0fbfa99e8da651198f158489ad18086f33b370ac54644bf60`. The checks of '
    '`print-gate-2-9b.txt` hold 33 PASS lines and 0 FAIL lines: 16 for the r5 variant, 16 for the '
    'A2 variant, and 1 shared guard line. `PRINT_GATE` exits 0 on both print files with `All checks '
    'pass.`, so the check 1 deviation of Part 1 stays closed. The teacher front page art is 2480 x '
    '3508 px at 300.0 ppi in both variants. Check 17 reads "not in report", because the build '
    'reports hold no picture SHA-256 value. The 3 sheets `contact-sheets/teacher.png`, '
    '`contact-sheets/teacher-alt-hlogo.png`, and `contact-sheets/teacher-r5-vs-alt-hlogo.png` are '
    '2064 x 1566 px each. The new `MANIFEST.txt` holds 33 lines with SHA-256 '
    '`8451debeaedf9a074d0408822960cd95246991f56cc34be2fa182ee9d7647006`, and its 19 old lines are '
    'byte-equal. The 4 guard print files keep their SHA-256: '
    '`920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d`, '
    '`d2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37`, '
    '`8ae118b644765eaeab537b503cab76bc7bb573d9dae6d3b4ed567c465dc5d6fa`, and '
    '`665c044f6e828e618fc4c488564d26c6e63ddaf3d61432b3dba8aebd7596bf1a`. The readers and the game '
    'bar change of Part 2 wait for a later round. The teacher front art goes into '
    '`content/storytime/l2/print/pictures/` only after Daniel\'s look (Task 2.8 stays [~]). '
    'Evidence: automated.'
)


def main():
    """Inserts the line and checks the result."""
    if THAI.search(NEW_LINE):
        print('NEW_LINE_HAS_THAI true')
        return 1
    text = open(PLAN, encoding='utf-8').read()
    if not text.endswith('\n'):
        print('PLAN_HAS_NO_FINAL_NEWLINE')
        return 1
    lines = text.split('\n')
    index = None
    for position, line in enumerate(lines):
        if line.startswith(ANCHOR):
            index = position
            break
    if index is None:
        print('ANCHOR_NOT_FOUND')
        return 1
    if not lines[index - 1].startswith(BEFORE_ANCHOR):
        print('LINE_BEFORE_ANCHOR_UNEXPECTED ' + lines[index - 1][:60])
        return 1
    if any(line.startswith('  - Part 2 teacher v2') for line in lines):
        print('LINE_ALREADY_PRESENT')
        return 1
    before = len(lines)
    lines.insert(index, NEW_LINE)
    after = len(lines)
    open(PLAN, 'w', encoding='utf-8').write('\n'.join(lines))
    print('ANCHOR_INDEX %d' % index)
    print('LINES_BEFORE %d' % before)
    print('LINES_AFTER %d' % after)
    print('INSERTED %d' % (after - before))
    print('THAI_CHARS_IN_PLAN %d' % len(THAI.findall('\n'.join(lines))))
    return 0 if after - before == 1 else 1


if __name__ == '__main__':
    raise SystemExit(main())
