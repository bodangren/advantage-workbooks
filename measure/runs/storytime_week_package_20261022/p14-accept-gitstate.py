#!/usr/bin/env python3
"""Writes p14-accept-gitstate.txt: the repository state before the commit.

The capture records HEAD, the two base SHAs, the lock file state, the count of
changed paths, and the files that this role made. The last line is `exit: 0`
only when HEAD is still the audited head ceb17679 and the lock file is clean.
No line of the output holds a Thai character.
"""

import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_week_package_20261022/"
OUT = RUNS + "p14-accept-gitstate.txt"
AUDITED = "ceb17679bfca528f28b0fefe7ed85abbe6676a5d"
BASE = "76fc13b0"
THAI = re.compile("[฀-๿]")
MINE = [
    "measure/runs/storytime_week_package_20261022/p14-accept-capture.py",
    "measure/runs/storytime_week_package_20261022/p14-accept-gates.py",
    "measure/runs/storytime_week_package_20261022/p14-accept-testmap.py",
    "measure/runs/storytime_week_package_20261022/p14-accept-ac2-diff.py",
    "measure/runs/storytime_week_package_20261022/p14-accept-ac3-diff.py",
    "measure/runs/storytime_week_package_20261022/p14-accept-ac.py",
    "measure/runs/storytime_week_package_20261022/p14-accept-evidence.py",
    "measure/runs/storytime_week_package_20261022/p14-accept-memory.py",
    "measure/runs/storytime_week_package_20261022/p14-testmap.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-project.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-lint.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-checks.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-checkrows.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-ac-live.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-ac2-diff.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-ac3-diff.txt",
    "measure/runs/storytime_week_package_20261022/p14-acceptance.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-evidence.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-gitstate.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-memory.txt",
    "measure/runs/storytime_week_package_20261022/p14-accept-scratch.txt",
    "measure/runs/storytime_week_package_20261022/phase-acceptance-p14-ceb17679.json",
    "measure/runs/storytime_week_package_20261022/phase-acceptance-p14-ceb17679.log",
    "measure/tracks/storytime_week_package_20261022/plan.md",
    "measure/tech-debt.md",
    "measure/lessons-learned.md",
]


def sh(args):
    """Runs one command and returns its standard output."""
    return subprocess.run(args, capture_output=True, text=True, cwd=REPO, check=True).stdout


def main():
    """Writes the git state capture and returns 0 when the state holds."""
    head = sh(["git", "rev-parse", "HEAD"]).strip()
    lock = sh(["git", "status", "--porcelain", "pnpm-lock.yaml"]).strip()
    status = sh(["git", "status", "--porcelain"]).splitlines()
    lines = [
        "# p14-accept-gitstate, before the Phase 14 acceptance commit",
        "HEAD: " + head,
        "phase_base_sha: " + BASE,
        "role_base_sha: " + AUDITED,
        "audited_head_sha: " + AUDITED,
        "head_is_current: " + str(head == AUDITED),
        "pnpm-lock.yaml: " + ("clean" if not lock else lock),
        "changed paths in the work tree: %d" % len(status),
        "files of this role: %d" % len(MINE),
    ]
    for path in MINE:
        state = sh(["git", "status", "--porcelain", "--", path]).strip()
        lines.append("  " + (state if state else "?? not staged yet") + " " + path)
    text = "\n".join(lines) + "\n"
    if THAI.search(text):
        text = "\n".join(ln for ln in lines if not THAI.search(ln)) + "\n"
    code = 0 if (head == AUDITED and not lock) else 1
    text += "THAI CHARS IN OUTPUT: 0\n"
    text += "exit: %d\n" % code
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write(text)
    print("CAPTURE_FILE " + OUT)
    print("HEAD " + head)
    print("head_is_current " + str(head == AUDITED))
    print("pnpm-lock " + ("clean" if not lock else "DIRTY"))
    print("exit: %d" % code)
    return code


if __name__ == "__main__":
    sys.exit(main())
