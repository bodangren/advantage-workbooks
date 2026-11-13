#!/usr/bin/env python3
"""Prints the decisive lines of the Phase 12 evidence captures for AC12-9 to AC12-12."""
import os

BASE = "/home/daniebo/Desktop/Workbooks/measure/runs/storytime_week_package_20261022"
MARKERS = {
    "p12-red1.txt": ["exit: 1", "Test Files", "Tests", "No test files found"],
    "p12-green1-green.txt": ["exit: 0", "Test Files", "Tests"],
    "p12-green1-project.txt": ["exit: 0", "Test Files", "Tests"],
    "p12-green1-lint.txt": ["exit: 0"],
    "p12-green1-checks.txt": ["exit: 0", "FAIL rows other than published"],
    "p12-clips-green.txt": ["exit: 0", "Test Files", "Tests"],
    "p12-clips-checks-fa47ca23.txt": ["exit: 0", "FAIL rows other than published"],
    "p12-clips-checks-ade618a5.txt": ["exit: 0", "FAIL rows other than published"],
    "p12-review-a-mutants.txt": ["mutants:", "caught", "cmp"],
    "p12-review-a-cutprobe.txt": ["clips", "cuts:", "positive"],
    "p12-handoff.txt": ["checks", "9/9", "63 of 63", "OK", "FAIL", "pass"],
    "p12-handoff-tree-after.txt": ["diff", "folders"],
    "p12-chars.txt": ["words", "sent", "total", "credits"],
}


def main():
    for name, marks in MARKERS.items():
        path = os.path.join(BASE, name)
        print(f"===== {name}")
        if not os.path.exists(path):
            print("MISSING FILE")
            continue
        with open(path, "r", encoding="utf-8") as fh:
            lines = fh.read().splitlines()
        tail = lines[-3:]
        for line in tail:
            print("TAIL " + line)
        for line in lines:
            if any(mark in line for mark in marks):
                print("HIT  " + line)


if __name__ == "__main__":
    main()
