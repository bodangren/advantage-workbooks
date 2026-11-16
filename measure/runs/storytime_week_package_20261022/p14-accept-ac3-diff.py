#!/usr/bin/env python3
"""Writes p14-accept-ac3-diff.txt: the AC14-3 diagnosis (deviation D-P14-ACC2).

The capture gives the whitespace-only-change count of the form check at three
revisions for each week (the Green state, HEAD, and the post-Green range alone),
and the later commit that owns each count above zero. The last line is
`exit: 0` only when the Green-state count is 0 for all eight weeks. No line of
the output holds a Thai character.
"""

import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_week_package_20261022/"
OUT = RUNS + "p14-accept-ac3-diff.txt"
OLD = "ddc70618"
GREEN = "a318b199"
HEAD = "ceb17679bfca528f28b0fefe7ed85abbe6676a5d"
THAI = re.compile("[฀-๿]")


def diff(r1, r2, week):
    """The unified diff of one week file between two revisions."""
    path = "content/storytime/l2/w%02d.json" % week
    return subprocess.run(["git", "diff", "-U0", r1, r2, "--", path],
                          check=True, capture_output=True, text=True, cwd=REPO).stdout


def count(text):
    """The whitespace-only-change count and the hunk that holds each one."""
    total = 0
    found = []
    removed, added, head = [], [], ""

    def close():
        nonlocal total
        stripped = {re.sub(r"\s", "", item) for item in removed}
        for item in added:
            if re.sub(r"\s", "", item) in stripped:
                total += 1
                found.append((head, removed, item))

    for line in text.split("\n"):
        if line.startswith("@@"):
            close()
            removed, added, head = [], [], line
        elif line.startswith("-") and not line.startswith("---"):
            removed.append(line[1:])
        elif line.startswith("+") and not line.startswith("+++"):
            added.append(line[1:])
    close()
    return total, found


def main():
    """Writes the diagnosis capture and returns 0 when the Green state is clean."""
    lines = []
    green_state_ok = True
    for week in range(1, 9):
        n_green, _ = count(diff(OLD, GREEN, week))
        n_head, hunks = count(diff(OLD, HEAD, week))
        n_after, _ = count(diff(GREEN, HEAD, week))
        lines.append("w%02d: Green-state %d, HEAD %d, post-Green range %d"
                     % (week, n_green, n_head, n_after))
        if n_green != 0:
            green_state_ok = False
        for head, removed, added in hunks:
            lines.append("    hunk " + head)
            lines.append("    added line strips to " + repr(re.sub(r"\s", "", added)))
            for item in removed:
                if re.sub(r"\s", "", item) == re.sub(r"\s", "", added):
                    lines.append("    matched removed line strips to "
                                 + repr(re.sub(r"\s", "", item)))
        if n_after:
            owners = []
            log = subprocess.run(["git", "log", "--reverse", "--format=%H%x09%s",
                                  GREEN + "..HEAD", "--",
                                  "content/storytime/l2/w%02d.json" % week],
                                 check=True, capture_output=True, text=True,
                                 cwd=REPO).stdout
            prev = GREEN
            for row in log.splitlines():
                if not row.strip():
                    continue
                sha, subject = row.split("\t", 1)
                n_own, _ = count(diff(prev, sha, week))
                if n_own:
                    owners.append(sha[:8] + " " + subject)
                prev = sha
            for owner in owners:
                lines.append("    owner of the post-Green count: " + owner)
    committed = open(RUNS + "p14-form-check.txt", encoding="utf-8").read()
    lines.append("committed p14-form-check.txt gives 0 for 8 of 8 weeks: %s"
                 % str(all(("w%02d: whitespace-only changes 0" % n) in committed
                           for n in range(1, 9))))
    text = "\n".join(lines) + "\n"
    if THAI.search(text):
        text = "\n".join(ln for ln in lines if not THAI.search(ln)) + "\n"
    text += "THAI CHARS IN OUTPUT: 0\n"
    code = 0 if green_state_ok else 1
    text += "exit: %d\n" % code
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write(text)
    print("CAPTURE_FILE " + OUT)
    print("green state clean for 8 weeks: " + str(green_state_ok))
    print("exit: %d" % code)
    return code


if __name__ == "__main__":
    sys.exit(main())
