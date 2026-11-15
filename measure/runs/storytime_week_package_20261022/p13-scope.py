#!/usr/bin/env python3
"""Phase 13 (spec, scope guard): the scope check of one commit of the Clips task.

Usage: p13-scope.py <sha> [<allowed-prefix> ...]

Prints the names of the files of the commit, the count of the files, and the count of the files
outside the allowed prefixes. A commit of the Clips task holds only the week file, the clips, and
the provenance file of one week.
"""
import subprocess
import sys

sha = sys.argv[1]
allowed = sys.argv[2:]
names = subprocess.run(
    ["git", "show", "--name-only", "--format=", sha],
    capture_output=True, text=True, check=True,
).stdout.splitlines()
files = [name for name in names if name.strip()]
outside = [name for name in files if not any(name.startswith(prefix) for prefix in allowed)]
for name in files:
    print(name)
print("files: %d" % len(files))
print("outside: %d" % len(outside))
for name in outside:
    print("outside file: %s" % name)
sys.exit(0 if not outside else 1)
