#!/usr/bin/env python3
"""Compare the tree hashes of the existing hand-off folders before and after the r3 build."""
import os
import sys

RUN = "/home/daniebo/Desktop/Workbooks/measure/runs/storytime_week_package_20261022"
BEFORE = os.path.join(RUN, "p11-handoff-r3-tree-before.txt")
AFTER = os.path.join(RUN, "p11-handoff-r3-tree-after.txt")


def read(path):
    rows = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            if "  " in line:
                sha, name = line.rstrip("\n").split("  ", 1)
                rows[name] = sha
    return rows


def main():
    before = read(BEFORE)
    after = read(AFTER)
    diffs = 0
    for name in sorted(before):
        same = name in after and before[name] == after[name]
        if not same:
            diffs += 1
            print(f"DIFFERS {name}: before {before[name]} after {after.get(name)}")
    new = sorted(set(after) - set(before))
    print(f"existing folders compared: {len(before)}")
    print(f"new folders: {len(new)} ({', '.join(new)})")
    print(f"diff lines: {diffs}")
    return 0 if diffs == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
