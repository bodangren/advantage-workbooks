#!/usr/bin/env python3
"""Apply one week's song times and owner pick to its staged week file.

Usage: t61-apply-week.py <week> <words> <tasks-item> <take-file>

Example: t61-apply-week.py w10 "Week 10 c2" QmhmVTBTRGxsRzlvOENqVQ l2-w10-song-c2.mp3

The script copies the week file to /tmp/opencode/t61/<week>.before.json, sets
song.times from t61-<week>-song-times.json and approval.song, writes the file in
its own format, and proves that nothing else changed. It restores the copy when
the structure differs.
"""
import json
import shutil
import subprocess
import sys

RUNS = "measure/runs/storytime_l2_unit2_20261106"
TEMPLATE = "content/storytime/drafts/l2/%s.json"
BEFORE = "/tmp/opencode/t61/%s.before.json"


def strip(value):
    """A copy of the week object without the two fields this task owns."""
    copy = json.loads(json.dumps(value))
    copy.get("song", {}).pop("times", None)
    copy.get("approval", {}).pop("song", None)
    return copy


def main():
    if len(sys.argv) != 5:
        print("usage: t61-apply-week.py <week> <words> <tasks-item> <take-file>")
        return 2
    week, words, item, take = sys.argv[1:5]
    target = TEMPLATE % week
    before_path = BEFORE % week
    times_path = "%s/t61-%s-song-times.json" % (RUNS, week)

    approval = {
        "status": "approved",
        "date": "2026-11-09",
        "words": words,
        "source": "Owner answer relayed by the PM session, 2026-11-09 (Tasks item %s): the pick of the take %s of the candidate folder storytime-l2u2-song-candidates-2026-11-09 (Lyria 3 Pro)." % (item, take),
    }

    shutil.copyfile(target, before_path)
    raw = open(before_path, encoding="utf-8").read()
    before = json.loads(raw)
    second = raw.split("\n")[1]
    indent = 2 if second.startswith("  ") and not second.startswith("   ") else 4
    final_newline = raw.endswith("\n")

    times = json.load(open(times_path, encoding="utf-8"))
    if len(times) != 12:
        print("TIMES_COUNT=%d (must be 12)" % len(times))
        return 1

    after = json.loads(raw)
    song = {}
    placed = False
    for key, value in after["song"].items():
        if key == "times":
            continue
        song[key] = value
        if key == "choreography":
            song["times"] = times
            placed = True
    if not placed:
        song["times"] = times
    after["song"] = song
    after["approval"]["song"] = approval

    text = json.dumps(after, ensure_ascii=False, indent=indent)
    if final_newline:
        text += "\n"
    with open(target, "w", encoding="utf-8") as handle:
        handle.write(text)

    written = json.load(open(target, encoding="utf-8"))
    equal = strip(before) == strip(written)
    print("STRUCTURE_EQUAL=%d" % (1 if equal else 0))
    print("times_count=%d" % len(written["song"].get("times", [])))
    print("approval_song_words=%r" % written["approval"]["song"].get("words"))

    numstat = subprocess.run(["git", "diff", "--numstat", "--", target], check=False, capture_output=True, text=True)
    print("git diff --numstat (added removed path):")
    print(numstat.stdout.strip())

    if not equal:
        shutil.copyfile(before_path, target)
        check = subprocess.run(["cmp", before_path, target], check=False, capture_output=True, text=True)
        print("RESTORED cmp_exit=%d" % check.returncode)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
