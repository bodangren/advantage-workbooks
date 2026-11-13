#!/usr/bin/env python3
"""Print the tree hash of each existing w0*-storytime-app-package* hand-off folder."""
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
    folders = sorted(glob.glob(os.path.join(os.path.expanduser("~/Desktop/handoff"),
                                            "w0*-storytime-app-package*")))
    folders = [f for f in folders if os.path.isdir(f)]
    for f in folders:
        print(f"{tree_hash(f)}  {os.path.basename(f)}")
    print(f"folders: {len(folders)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
