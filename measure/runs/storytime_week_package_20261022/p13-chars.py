#!/usr/bin/env python3
"""Phase 13 (spec AC13-11, decision M9): the character reconciliation of the Clips runs.

For each week and for the phase: the sum of the `sent:` values of the maker logs, and the sum of
the text length times the take over the read-along items of the provenance file. The two counts
agree, or the difference equals the failed calls that the call lines name.

Usage: p13-chars.py <runs-folder> <content-root>
"""
import json
import os
import re
import sys

RUNS = sys.argv[1]
ROOT = sys.argv[2]
SENT = re.compile(r"^sent: (\d+)")

log_sum = 0
prov_sum = 0
failed = []
print("week  log sent  provenance  difference  failed calls")
for n in range(1, 8):
    week = "w%02d" % n
    path = os.path.join(RUNS, "p13-sentences-%s.txt" % week)
    sent = 0
    calls = []
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith("call "):
            parts = line.split("\t")
            calls.append((parts[1], int(parts[4].split()[1])))
        match = SENT.match(line)
        if match:
            sent += int(match.group(1))
    manifest = json.load(open(os.path.join(ROOT, "l2/media/%s/sentences/manifest.json" % week), encoding="utf-8"))
    items = [i for i in manifest["items"] if i["book"] == 0]
    total = sum(len(i["text"]) * i["take"] for i in items)
    log_sum += sent
    prov_sum += total
    print("%s  %6d  %10d  %10d  %d" % (week, sent, total, sent - total, len(calls) - len(items)))
print("phase  %6d  %10d  %10d" % (log_sum, prov_sum, log_sum - prov_sum))
print("one-take sum of the read-along texts: %d" % sum(
    len(i["text"]) for n in range(1, 8)
    for i in json.load(open(os.path.join(ROOT, "l2/media/w%02d/sentences/manifest.json" % n), encoding="utf-8"))["items"]
    if i["book"] == 0))
print("take values of the read-along clips: %s" % sorted(set(
    i["take"] for n in range(1, 8)
    for i in json.load(open(os.path.join(ROOT, "l2/media/w%02d/sentences/manifest.json" % n), encoding="utf-8"))["items"]
    if i["book"] == 0)))
print("phase limit: 2800, week limits: 411 498 279 426 390 396 381")
print("sum under the phase limit: %s" % (log_sum <= 2800))
