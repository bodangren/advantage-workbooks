#!/usr/bin/env python3
"""Apply the week 9 song times and Daniel's pick to the staged week file.

Copies the week file to /tmp/opencode/t61/w09.before.json, sets song.times and
approval.song, writes the file in its own format, and proves that nothing else
changed. Restores the copy when the structure differs.
"""
import json
import shutil
import subprocess
import sys

TARGET = "content/storytime/drafts/l2/w09.json"
BEFORE = "/tmp/opencode/t61/w09.before.json"
TIMES = "measure/runs/storytime_l2_unit2_20261106/t61-w09-song-times.json"

APPROVAL = {
    "status": "approved",
    "date": "2026-11-09",
    "words": "Week 9 c2",
    "source": "Owner answer relayed by the PM session, 2026-11-09 09:50 ICT (Tasks item NVU5Wl9TaE1Ca3d4dFRxUg): the pick of the take l2-w09-song-c2.mp3 of the candidate folder storytime-l2u2-song-candidates-2026-11-09 (Lyria 3 Pro).",
}


def strip(value):
    """A copy of the week object without the two fields this task owns."""
    copy = json.loads(json.dumps(value))
    copy.get("song", {}).pop("times", None)
    copy.get("approval", {}).pop("song", None)
    return copy


def main():
    shutil.copyfile(TARGET, BEFORE)
    raw = open(BEFORE, encoding="utf-8").read()
    before = json.loads(raw)
    indent = 2 if raw.split("\n")[1].startswith("  ") and not raw.split("\n")[1].startswith("   ") else 4
    final_newline = raw.endswith("\n")

    times = json.load(open(TIMES, encoding="utf-8"))
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
    after["approval"]["song"] = APPROVAL

    text = json.dumps(after, ensure_ascii=False, indent=indent)
    if final_newline:
        text += "\n"
    with open(TARGET, "w", encoding="utf-8") as handle:
        handle.write(text)

    written = json.load(open(TARGET, encoding="utf-8"))
    equal = strip(before) == strip(written)
    print("STRUCTURE_EQUAL=%d" % (1 if equal else 0))
    print("song_keys_after=%s" % ",".join(written["song"].keys()))
    print("times_count=%d" % len(written["song"].get("times", [])))
    print("approval_song_words=%r" % written["approval"]["song"].get("words"))

    numstat = subprocess.run(
        ["git", "diff", "--numstat", "--", TARGET],
        check=False,
        capture_output=True,
        text=True,
    )
    print("git diff --numstat (added removed path):")
    print(numstat.stdout.strip())

    if not equal:
        shutil.copyfile(BEFORE, TARGET)
        check = subprocess.run(["cmp", BEFORE, TARGET], check=False, capture_output=True, text=True)
        print("RESTORED cmp_exit=%d" % check.returncode)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
