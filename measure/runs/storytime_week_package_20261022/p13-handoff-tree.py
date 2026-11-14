#!/usr/bin/env python3
"""Print the tree hash of each existing w0*-storytime-app-package* folder.

Usage: p13-handoff-tree.py [root]   (default root: ~/Desktop/handoff)
"""
import glob
import os
import subprocess
import sys


def tree_hash(folder):
    cmd = f"find {folder} -type f -exec sha256sum {{}} + | sort | sha256sum"
    out = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if out.returncode != 0:
        return f"ERROR {out.stderr.strip()}"
    return out.stdout.split()[0]


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
        "~/Desktop/handoff")
    folders = sorted(glob.glob(os.path.join(root, "w0*-storytime-app-package*")))
    folders = [f for f in folders if os.path.isdir(f)]
    for f in folders:
        print(f"{tree_hash(f)}  {os.path.basename(f)}")
    print(f"folders: {len(folders)} (root {root})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
