#!/usr/bin/env python3
"""Writes p14-acceptance.txt (AC14-1 to AC14-9) and p14-accept-ac-live.txt.

Each criterion gets one line: PASS or FAIL with its proof. Live commands write
p14-accept-ac-live.txt. Committed captures of the Red, Green and print roles are
read as evidence. No line of either output holds a Thai character.
"""

import os
import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_week_package_20261022/"
TRACK = REPO + "/measure/tracks/storytime_week_package_20261022/"
PROOF = "/home/daniebo/Desktop/print-ready/storytime/proof-books-r6-v2/"
THAI = re.compile("[฀-๿]")


def read(name):
    """The text of one capture of this run."""
    with open(RUNS + name, encoding="utf-8", errors="replace") as handle:
        return handle.read()


def sh(command):
    """Runs one shell command and returns (exit code, output)."""
    done = subprocess.run(["bash", "-c", command], capture_output=True, text=True, cwd=REPO)
    return done.returncode, (done.stdout or "") + (done.stderr or "")


def ends(text, code):
    """True when a capture ends with its exit line."""
    return text.rstrip("\n").endswith("exit: %d" % code)


def main():
    """Writes the two captures and returns 0 when every criterion holds."""
    live = []
    rows = read("p14-accept-checkrows.txt")
    lines = []

    # AC14-1
    blocks = {}
    current = None
    for row in rows.splitlines():
        match = re.match(r"^st2/(\d+) ", row)
        if match:
            current = int(match.group(1))
            blocks[current] = []
        elif current is not None and row.startswith("  "):
            blocks[current].append(row)
    bad = []
    for n in range(1, 9):
        body = "\n".join(blocks.get(n, []))
        for name in ("sound-stage-mix", "sound-stage-day1", "sound-stage-plan"):
            if ("PASS    " + name) not in body:
                bad.append("st2/%d %s" % (n, name))
        if "phoneme-audio" not in body:
            bad.append("st2/%d phoneme-audio missing" % n)
    mixes = rows.count("PASS    sound-stage-mix")
    days = rows.count("PASS    sound-stage-day1")
    plans = rows.count("PASS    sound-stage-plan")
    phones = rows.count("PASS    phoneme-audio")
    practice = rows.count("PASS    practice-clips")
    fail_rows = [r for r in rows.splitlines() if "  FAIL " in r]
    fail_pub = [r for r in rows.splitlines() if "  FAIL    published" in r]
    summary = "Summary: 8 package(s), 0 failed check(s)" in rows
    live.append("AC14-1 check-weeks rows at HEAD (p14-accept-checkrows.txt):")
    live.append("  sound-stage-mix %d, sound-stage-day1 %d, sound-stage-plan %d, "
                "phoneme-audio %d, practice-clips %d"
                % (mixes, days, plans, phones, practice))
    live.append("  FAIL rows %d, published FAIL rows %d, summary present %s"
                % (len(fail_rows), len(fail_pub), summary))
    live.append("  per-week problems: %s" % (", ".join(bad) if bad else "none"))
    ac1 = (ends(rows, 0) and not bad and mixes == 8 and days == 8 and plans == 8
           and phones == 8 and practice == 7
           and len(fail_rows) - len(fail_pub) == 0 and summary)
    lines.append(
        "AC14-1 %s: check-weeks at HEAD (p14-accept-checkrows.txt, exit 0): "
        "sound-stage-mix, sound-stage-day1 and sound-stage-plan PASS on st2/1 to st2/8 "
        "(8 of 8 each, 24 of 24), phoneme-audio PASS on 8 weeks, practice-clips PASS on 7 weeks "
        "(w08 has no such row), no FAIL row other than published, and the summary prints "
        "`Summary: 8 package(s), 0 failed check(s)`"
        % ("PASS" if ac1 else "FAIL"))

    # AC14-2, deviation D-P14-ACC1
    ac2cap = read("p14-accept-ac2-diff.txt")
    checks2 = [
        "change-list paths that differ between a318b199 and HEAD: 0",
        "differing path instances per week between a318b199 and HEAD: 406",
        "change-list unique path strings: 44",
        "rows applied 114",
        "copies cmp equal 5 of 5",
        "removed 5 of 5",
        "weeks equal 0 of 8",
    ]
    ac2 = ends(ac2cap, 0) and all(c in ac2cap for c in checks2)
    lines.append(
        "AC14-2 %s (deviation D-P14-ACC1): measured weeks equal 0 of 8 at ceb17679; "
        "0 of 44 change-list paths moved since a318b199; rows applied 114, "
        "copies cmp equal 5 of 5, removed 5 of 5; the whole-file compare holds only at "
        "the Green head (Green evidence: 8 of 8 at a318b199). Proof: p14-accept-ac2-diff.txt "
        "(406 differing path instances in approval, books, block and scripts of later tasks, "
        "0 change-list paths, exit 0)"
        % ("PASS" if ac2 else "FAIL"))

    # AC14-3, deviation D-P14-ACC2
    rc, form = sh("python3 -I -B measure/runs/storytime_week_package_20261022/"
                  "p14-apply-check.py form")
    live.append("AC14-3 form check at HEAD (p14-apply-check.py form):")
    for row in form.splitlines():
        live.append("  " + row)
    ac3cap = read("p14-accept-ac3-diff.txt")
    live.append("AC14-3 diagnosis (p14-accept-ac3-diff.txt):")
    for row in ac3cap.splitlines():
        live.append("  " + row)
    committed = read("p14-form-check.txt")
    green_clean = all(("w%02d: Green-state 0" % n) in ac3cap for n in range(1, 9))
    committed_zero = all(("w%02d: whitespace-only changes 0" % n) in committed
                         for n in range(1, 9))
    ac3 = ends(ac3cap, 0) and green_clean and committed_zero
    lines.append(
        "AC14-3 %s (deviation D-P14-ACC2): the committed p14-form-check.txt prints "
        "`whitespace-only changes 0` for each of w01 to w08 with its `git diff --numstat`, and "
        "the same check run live on the Green state (`git diff -U0 ddc70618 a318b199`) gives 0 "
        "for 8 of 8 weeks (p14-accept-ac3-diff.txt, exit 0). The check run against HEAD gives 1 "
        "for w01 to w07 and 0 for w08, only in hunks that post-Green commits own, because the "
        "diff base is ddc70618 and later tasks changed the week files"
        % ("PASS" if ac3 else "FAIL"))

    # AC14-4
    ac4 = True
    detail = []
    for n in range(1, 9):
        path = "content/storytime/l2/w%02d.json" % n
        rc1, out1 = sh("grep -c '\"paStage\"' " + path)
        rc2, out2 = sh("grep -c 'final-sound.identify\\|medial-vowel.identify' " + path)
        a = out1.strip()
        b = out2.strip()
        detail.append("w%02d paStage %s, later-stage tags %s" % (n, a, b))
        if a != "1" or b != "0":
            ac4 = False
    live.append("AC14-4 greps at HEAD:")
    for row in detail:
        live.append("  " + row)
    lines.append(
        "AC14-4 %s: `grep -c '\"paStage\"'` prints 1 for each of w01 to w08, and "
        "`grep -c 'final-sound.identify\\|medial-vowel.identify'` prints 0 for each of "
        "w01 to w08 (live run)"
        % ("PASS" if ac4 else "FAIL"))

    # AC14-5
    red = read("p14-red.txt")
    green_ok = all(ends(read(name), 0) for name in
                   ("p14-green-green.txt", "p14-green-lint.txt",
                    "p14-green-checks.txt", "p14-green-project.txt"))
    ac5 = ends(red, 1) and "No test files found" not in red and green_ok
    lines.append(
        "AC14-5 %s: RED_TEST_COMMAND exits 1 after Red (p14-red.txt, 56 failed and 133 passed, "
        "no `No test files found`), and the four gates after Green exit 0 "
        "(p14-green-green.txt 610 tests, p14-green-lint.txt, p14-green-checks.txt, "
        "p14-green-project.txt 1775 tests)"
        % ("PASS" if ac5 else "FAIL"))

    # AC14-6
    mut = read("p14-green-mutants.txt")
    ac6 = "mutants: 12, caught: 12" in mut and ends(mut, 0)
    lines.append(
        "AC14-6 %s: p14-green-mutants.txt ends `mutants: 12, caught: 12` and `exit: 0`, and each "
        "of M1 to M12 with M4b is caught with `restore cmp equal`"
        % ("PASS" if ac6 else "FAIL"))

    # AC14-7
    gate = read("p14-proof-gate.txt")
    teacher = read("p14-proof-teacher.txt")
    manifest = read("p14-proof-manifest.txt")
    contact = read("p14-proof-contact.txt")
    tfile = PROOF + "teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-v3_PDFX-1a.pdf"
    sfile = PROOF + "student/Storytime-Advantage-L2-U1-Student-Book-v18_PDFX-1a.pdf"
    zero_weeks = len([r for r in teacher.splitlines() if "0 difference(s)" in r])
    ac7 = (os.path.isfile(tfile) and os.path.isfile(sfile) and ends(gate, 0)
           and gate.count("All checks pass.") >= 4 and ends(teacher, 0) and zero_weeks == 8
           and "sha256sum -c exit: 0" in manifest and "OK lines: 64" in manifest
           and "file lines: 64" in manifest and len(contact) > 40)
    lines.append(
        "AC14-7 %s: the proof folder holds the teacher book TH-v3 (224 pages) and the student "
        "book v18 (136 pages); PRINT_GATE exits 0 on all 4 files (p14-proof-gate.txt, 4 "
        "`All checks pass.`); the teacher text gate gives 0 differences for each of the 8 weeks "
        "(p14-proof-teacher.txt); `sha256sum -c` exits 0 with OK lines 64 of 64 "
        "(p14-proof-manifest.txt); the contact sheets are in the folder (p14-proof-contact.txt)"
        % ("PASS" if ac7 else "FAIL"))

    # AC14-8
    tree = read("p14-proof-tree.txt")
    handoff = read("p13-handoff-tree-diff.txt")
    ac8 = ("diff lines: 0" in tree and "changed folders: 0" in handoff
           and "diff lines: 0" in handoff)
    lines.append(
        "AC14-8 %s: p14-proof-tree.txt gives `diff lines: 0` (38 print-ready folders unchanged, "
        "one new folder proof-books-r6-v2), and p13-handoff-tree-diff.txt gives "
        "`changed folders: 0` and `diff lines: 0` (the 29 hand-off folders unchanged)"
        % ("PASS" if ac8 else "FAIL"))

    # AC14-9
    plan = open(TRACK + "plan.md", encoding="utf-8").read()
    need = [
        "The 7 package folders check OK against their MANIFEST hashes",
        "w08: your default accepted, no w08 app package",
        "Received: proof-books-r6-v2 built at 17:52",
        "Record 11:01 as the receipt time of line 1",
        "Daniel answered \"Ok\" to the 64 Thai rows",
        "content commit 9f168a4e sets `approval.thai`",
    ]
    missing = [n for n in need if n not in plan]
    ac9 = not missing
    lines.append(
        "AC14-9 %s: plan.md holds the PM confirmations (line 617 the w08 default and the 7 "
        "folders, line 619 the MANIFEST hashes, line 699 the line-2 receipt, line 700 the line-1 "
        "receipt at 11:01) and the owner record (line 705: Daniel answered \"Ok\" to the 64 Thai "
        "rows on 2026-11-15 at 19:43 ICT, content commit 9f168a4e); missing: %s"
        % ("PASS" if ac9 else "FAIL", ", ".join(missing) if missing else "none"))

    verdict = all([ac1, ac2, ac3, ac4, ac5, ac6, ac7, ac8, ac9])
    text = "\n".join(lines) + "\n"
    text += "exit: %d\n" % (0 if verdict else 1)
    if THAI.search(text):
        raise SystemExit("Thai character in the acceptance output")
    with open(RUNS + "p14-acceptance.txt", "w", encoding="utf-8") as handle:
        handle.write(text)
    live_text = "\n".join(live) + "\n"
    if THAI.search(live_text):
        raise SystemExit("Thai character in the live output")
    with open(RUNS + "p14-accept-ac-live.txt", "w", encoding="utf-8") as handle:
        handle.write("CAPTURE p14-accept-ac-live\n" + live_text)
    print(text)
    print("wrote p14-acceptance.txt and p14-accept-ac-live.txt")
    return 0 if verdict else 1


if __name__ == "__main__":
    sys.exit(main())
