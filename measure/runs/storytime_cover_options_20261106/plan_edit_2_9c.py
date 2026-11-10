#!/usr/bin/env python3
"""Inserts the Task 2.9 part 3 A2 r2 record into the plan (track storytime_cover_options_20261106).

It inserts exactly one line, right before the line that starts with
`- [ ] Task 2.10 (Look at every page)`. It asserts that the line before that line starts with
`  - Part 2 teacher v2 (2026-11-10`. It changes no other line.

Usage: python3 -I -B plan_edit_2_9c.py
"""

import re

PLAN = '/home/daniebo/Desktop/Workbooks/measure/tracks/storytime_cover_options_20261106/plan.md'
ANCHOR = '- [ ] Task 2.10 (Look at every page)'
BEFORE_ANCHOR = '  - Part 2 teacher v2 (2026-11-10'
THAI = re.compile('[\u0e00-\u0e7f]')

NEW_LINE = (
    '  - Part 3 A2 r2 (2026-11-11, jr-green, model deepseek/deepseek-flash#high; role base '
    '`1a227809`; the Green code `93ad740f`; PM look check and order of 2026-11-11): The r2 build of '
    'the student book and the teacher book ran once in one heavy-run wrapper. The command is `cd '
    'dashboard && npx tsx scripts/storytime/make-storytime-quest-covers.ts --level 2 --unit 1 '
    '--version 1 --top hlogo --pictures-dir /tmp/opencode/c29c/pictures --print-ready-root '
    '/tmp/opencode/c29c/pr-a2r2 --print`. It exits 0 on the first attempt and prints `Covers of '
    'Level 2 Unit 1 set 1: 32 pages, 44 files` and 4 lines `All checks pass.` (capture '
    '`build-2-9c-a2r2.txt`). The pictures folder held 31 files. The 29 hard links gave 29 of 29 '
    'SHA-256 pairs equal and 29 of 29 the same inode. The edge-filled back holds '
    '`881e93b2a87385eb15e5cf0240df8629c501a10f0375284f9cec2fe09eda37c4`, and its source holds '
    '`5411e37ec7044d7afd70726ee5fffeccd985225ef0b0da4283db8e6a3979b7bf` before and after the fill. '
    'The prepared teacher front holds '
    '`0901411875407c09bd69e779f5aad31b36147d84d0e742feee6316712bf96283`, and both raw SHA-256 '
    'values hold `8fc2be064dc2f81c91f2debf7808582839db8881ee073bf31901157f76de4b24`. The 10 copies '
    'into the folder are byte copies, and 10 of 10 SHA-256 pairs are equal: '
    '`student/front-alt-hlogo-r2.png` '
    '`5e96dc4058ba156423d6c274cf6ba5156448bec22f30d5222acdfb536834982e`, '
    '`student/back-alt-hlogo-r2.png` '
    '`1adc4e7df4de14ff101f4043b7f80a1a01801f89e2e8086a43ffc055c636f968`, '
    '`student/cover-alt-hlogo-r2.pdf` '
    '`af7ca3be5378719fa1aad5659876ba77a9c67177628d315e9567589ec990ea75`, '
    '`student/build-report-alt-hlogo-r2.json` '
    '`0987b1fdabb395d89e6cc10b36928131dfa4d6af8f7a7004297e2c63a005c058`, '
    '`student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf` '
    '`bc00778ebcc91787b708a5dec353f75aa4559218404e598bcc596ec07daf6663`, '
    '`teacher/teacher-front-alt-hlogo-r2.png` '
    '`c0acc1ad5e99fa4d3002630901b02653e0e3dbbc2c57fdd2e9eb29a392cfb103`, '
    '`teacher/teacher-back-alt-hlogo-r2.png` '
    '`ad6c3335e4e92ae43eae1d86e50b2a8c4175bc7cbc9eecb23bc83aeb6e13b0a4`, '
    '`teacher/teacher-cover-alt-hlogo-r2.pdf` '
    '`b65dc772126dec22de7745414e53389f7637d7f6ab0b097bc21262ff448df138`, '
    '`teacher/build-report-alt-hlogo-r2.json` '
    '`827e257bec52f2106a86607c2fe43aeed9972ce9fe7f530b2da61f86290cfa4d`, and '
    '`teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf` '
    '`6a50cdb2767c3afe734d96d1d38657d11f48e11289b008753d89c9a955cdeefd`. The checks of '
    '`print-gate-2-9c.txt` hold 30 PASS lines and 0 FAIL lines: 14 PASS lines and 0 FAIL lines for '
    'the student book, 14 PASS lines and 0 FAIL lines for the teacher book, and 2 shared PASS lines '
    'for check 11 and check 16. `PRINT_GATE` exits 0 on both print files with `All checks pass.` '
    'Both print files are A4 PDF 1.3 PDF/X-1a:2001 with 2 pages, 5 embedded fonts, and 0 Type 3 '
    'fonts, and each page holds one art picture of 2480 x 3508 px at 300.0 ppi. The 2 fronts hold 0 '
    'Thai characters, and each back holds the 38 Thai characters of `BACK_LINES.contact`. The QR '
    'check gives qr `pass` and 0 of 841 modules different for both books. The 4 new sheets are '
    '`contact-sheets/student-alt-hlogo-r2.png` '
    '`092344f420b18e0d45ec5f1dde056fc994ef3757f213a3a40df872e234a3a846`, '
    '`contact-sheets/teacher-alt-hlogo-r2.png` '
    '`8d82be3dd5ae91369668d8acaa9c88cd3f9688be610793dcf42ddc035955e90b`, '
    '`contact-sheets/student-r5-vs-alt-hlogo-r2.png` '
    '`7fca6ada5469f9f97179b32ca8d9967fc254c8d9ed39d348be437b1555aa8d34`, and '
    '`contact-sheets/teacher-r5-vs-alt-hlogo-r2.png` '
    '`2bbd84488b6e5efe1e7f703ca3c05112dea58635467498e3c6deb76e652fb340`. The new `MANIFEST.txt` '
    'holds 48 lines with SHA-256 '
    '`2aa88d4082df1c94bd3f67d2792b1e0065e139375592b6479e9f4faedb96043d`, and its 33 old lines are '
    'byte-equal. The 6 guard print files keep their SHA-256: '
    '`920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d`, '
    '`8ae118b644765eaeab537b503cab76bc7bb573d9dae6d3b4ed567c465dc5d6fa`, '
    '`d2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37`, '
    '`665c044f6e828e618fc4c488564d26c6e63ddaf3d61432b3dba8aebd7596bf1a`, '
    '`1d2bcd99b347836a0dc48b8518064edb919947c0c0b26e076f05e1973f304e0e`, and '
    '`f0c43292cca3add0fbfa99e8da651198f158489ad18086f33b370ac54644bf60`. Daniel picks between r5 '
    'and A2 r2 for both books, with no new build. Evidence: automated.'
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
    if any(line.startswith('  - Part 3 A2 r2') for line in lines):
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
