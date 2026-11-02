#!/usr/bin/env python3
"""Extract every commit reference from the covers plan and verify resolution
and ancestry to HEAD. Read-only. Prints a report and exits non-zero on a miss."""
import re
import subprocess
import sys

PLAN = "measure/tracks/storytime_covers_20261027/plan.md"

text = open(PLAN, encoding="utf-8").read()

# Full 40-hex SHAs anywhere.
full = set(re.findall(r"\b[0-9a-f]{40}\b", text))
# "commit <7-12 hex>", "commits a and b", and "Evidence commit <7-12 hex>"
short = set(re.findall(r"\b(?:Evidence commit|commits?)\s+([0-9a-f]{7,12})\b", text, flags=re.I))
# SHA-256 values are 64 hex; the \b[0-9a-f]{40} token cannot match inside them
# because there is no word boundary at position 40 of a 64-hex run.

def run(args):
    return subprocess.run(args, capture_output=True, text=True).stdout.strip()

head = run(["git", "rev-parse", "HEAD"])
problems = []
seen = {}

def check(token):
    objtype = run(["git", "cat-file", "-t", token])
    if objtype != "commit":
        problems.append(f"{token}: not a commit (type={objtype!r})")
        return
    fullsha = run(["git", "rev-parse", token])
    base = run(["git", "merge-base", fullsha, head])
    if base != fullsha:
        problems.append(f"{token} ({fullsha[:8]}): not an ancestor of HEAD")
    seen[token] = fullsha

for t in sorted(full):
    check(t)
for t in sorted(short):
    check(t)

# Task-line audit: every top-level "- [x]" task must name a commit on its first
# line or in the same bullet before the first sub-bullet.
lines = text.splitlines()
tasks = []
for i, line in enumerate(lines):
    m = re.match(r"- \[([x ~b])\] (.+)", line)
    if m:
        tasks.append((i + 1, m.group(1), m.group(2), line))

missing_sha = []
missing_evidence = []
for lineno, marker, title, raw in tasks:
    # gather text of this bullet until the next top-level "- [" marker
    block = [raw]
    j = lineno  # next line index (0-based)
    while j < len(lines):
        nxt = lines[j]
        if re.match(r"- \[[x ~b]\] ", nxt):
            break
        if nxt.startswith("## "):
            break
        block.append(nxt)
        j += 1
    body = "\n".join(block)
    first_line = raw
    has_commit = bool(re.search(r"\bcommits?\s+[0-9a-f]{7,40}\b", first_line, flags=re.I)) or \
        bool(re.search(r"\bEvidence commit\s+[0-9a-f]{7,40}\b", body, flags=re.I)) or \
        bool(re.match(r"- \[x\] Task[^:]*:\s*[0-9a-f]{40}\.", first_line))
    has_evidence = bool(re.search(r"Evidence:\s*(owner-approved|person-checked|automated|peer-report)", body)) or \
        bool(re.search(r"Evidence \(?(?:owner-approved|person-checked|automated|peer-report)", body))
    if marker == "x":
        if not has_commit:
            missing_sha.append((lineno, title[:70]))
        if not has_evidence:
            missing_evidence.append((lineno, title[:70]))

print(f"HEAD={head}")
print(f"distinct full SHAs: {len(full)}; distinct short refs: {len(short)}")
print(f"resolved+ancestor commits: {len(seen)} unique references")
if problems:
    print("SHA PROBLEMS:")
    for p in problems:
        print("  " + p)
print(f"top-level tasks: {len(tasks)}; markers: "
      + ", ".join(f"{k}={sum(1 for _,m,_,_ in tasks if m==k)}" for k in ['x','~','b']))
if missing_sha:
    print("[x] tasks WITHOUT a commit reference:")
    for ln, t in missing_sha:
        print(f"  line {ln}: {t}")
if missing_evidence:
    print("[x] tasks WITHOUT an evidence class:")
    for ln, t in missing_evidence:
        print(f"  line {ln}: {t}")
if not problems and not missing_sha and not missing_evidence:
    print("TASK/SHA AUDIT: OK")
sys.exit(1 if (problems or missing_sha or missing_evidence) else 0)
