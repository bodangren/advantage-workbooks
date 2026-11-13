#!/usr/bin/env python3
"""Prints the gate tails of p12-green1.txt and compares the handoff tree hashes."""
import os

BASE = "/home/daniebo/Desktop/Workbooks/measure/runs/storytime_week_package_20261022"

with open(os.path.join(BASE, "p12-green1.txt"), "r", encoding="utf-8") as fh:
    lines = fh.read().splitlines()
print("===== p12-green1.txt head")
for line in lines[:6]:
    print(line)
print("===== p12-green1.txt decisive")
for line in lines:
    if "Test Files" in line or "Tests" in line or "exit" in line or "Command" in line:
        print(line)

before_path = os.path.join(BASE, "p12-handoff-tree-before.txt")
after_path = os.path.join(BASE, "p12-handoff-tree-after.txt")


def read_tree(path):
    rows = {}
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or " " not in line:
                continue
            parts = line.rsplit(" ", 1)
            if len(parts) == 2 and len(parts[1]) >= 8:
                rows[parts[0]] = parts[1]
    return rows


before = read_tree(before_path)
after = read_tree(after_path)
common = set(before) & set(after)
diff = [k for k in sorted(common) if before[k] != after[k]]
print("===== tree compare")
print(f"before folders: {len(before)}, after folders: {len(after)}, common: {len(common)}")
print(f"hash differences on common folders: {len(diff)}")
for name in sorted(set(before) ^ set(after)):
    state = "only in before" if name in before else "only in after"
    print(f"{state}: {name}")
