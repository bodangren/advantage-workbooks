#!/usr/bin/env python3
"""Apply one week's song times and owner pick to its staged week file.

Usage: t61-apply-week.py <week> <words> <tasks-item> <take-file> [options]

Example: t61-apply-week.py w10 "Week 10 c2" QmhmVTBTRGxsRzlvOENqVQ l2-w10-song-c2.mp3
         t61-apply-week.py w12 "Week 12 c2" VG5CR19oU19xTlVzOUJSTg l2-w12-song-c2.mp3 \
             --time "17:34 ICT" --drop-lines 9,10 --take-sha f5c4...

The script copies the week file to /tmp/opencode/t61/<week>.before.json, sets
song.times from t61-<week>-song-times.json and approval.song, drops the named
song lines when asked, writes the file in its own format, and proves that
nothing else changed. It restores the copy when the structure differs, and it
proves that the Thai lines are byte-equal without printing Thai text.

Options:
  --time TEXT       the clock time in the owner record (default: none)
  --drop-lines LIST song lines to remove, 1-based, comma separated (default: none)
  --allow-image-drop LIST
                    the dropped lines whose `image` key may go with them, 1-based,
                    comma separated (default: none). The image must hold no Thai
                    characters. The SHA-256 of the dropped image is printed.
  --take-sha SHA    the take SHA-256; it is added to the approval source
  --source-note TEXT
                    a note appended to the approval source (default: none)
  --out-times PATH  the times file (default measure/runs/.../t61-<week>-song-times.json)
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess

RUNS = "measure/runs/storytime_l2_unit2_20261106"
TEMPLATE = "content/storytime/drafts/l2/%s.json"
BEFORE = "/tmp/opencode/t61/%s.before.json"
THAI = re.compile("[\u0e00-\u0e7f]")
ALLOWED_LINE_KEYS = {"text", "part", "gesture", "imageOf"}


def image_digest(image):
    """The SHA-256 of the dropped image JSON, in one canonical form."""
    text = json.dumps(image, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def strip(value, drops):
    """A copy of the week object without the fields this task owns."""
    copy = json.loads(json.dumps(value))
    copy.get("song", {}).pop("times", None)
    copy.get("approval", {}).pop("song", None)
    if drops:
        copy["song"]["lines"] = [line for index, line in enumerate(copy["song"]["lines"], start=1) if index not in drops]
    return copy


def thai_digest(path):
    """SHA-256 of the ordered Thai-holding lines and their count. Prints no Thai."""
    lines = open(path, encoding="utf-8").read().split("\n")
    thai = [line for line in lines if THAI.search(line)]
    return hashlib.sha256("\n".join(thai).encode("utf-8")).hexdigest(), len(thai)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("week")
    parser.add_argument("words")
    parser.add_argument("item")
    parser.add_argument("take")
    parser.add_argument("--time", default="")
    parser.add_argument("--drop-lines", default="")
    parser.add_argument("--allow-image-drop", default="")
    parser.add_argument("--take-sha", default="")
    parser.add_argument("--source-note", default="")
    parser.add_argument("--out-times", default=None)
    args = parser.parse_args()

    week, words, item, take = args.week, args.words, args.item, args.take
    drops = {int(part) for part in args.drop_lines.split(",") if part.strip()}
    image_drops = {int(part) for part in args.allow_image_drop.split(",") if part.strip()}
    target = TEMPLATE % week
    before_path = BEFORE % week
    times_path = args.out_times or "%s/t61-%s-song-times.json" % (RUNS, week)

    approval = {
        "status": "approved",
        "date": "2026-11-09",
        "words": words,
        "source": "Owner answer relayed by the PM session, 2026-11-09%s (Tasks item %s): the pick of the take %s of the candidate folder storytime-l2u2-song-candidates-2026-11-09 (Lyria 3 Pro)."
        % ((" " + args.time) if args.time else "", item, take),
    }
    if args.take_sha:
        approval["source"] += " Take SHA-256 %s." % args.take_sha
    if args.source_note:
        approval["source"] += " " + args.source_note

    shutil.copyfile(target, before_path)
    raw = open(before_path, encoding="utf-8").read()
    before = json.loads(raw)
    second = raw.split("\n")[1]
    indent = 2 if second.startswith("  ") and not second.startswith("   ") else 4
    final_newline = raw.endswith("\n")

    if drops:
        for index in sorted(drops):
            line = before["song"]["lines"][index - 1]
            extra = sorted(set(line) - ALLOWED_LINE_KEYS)
            thai_chars = len(THAI.findall(json.dumps(line, ensure_ascii=False)))
            allowed_extra = list(extra)
            image_sha = ""
            if index in image_drops:
                image = line.get("image")
                if image is None:
                    print("DROPPED_LINE %d keys=%s other_keys=%s thai_chars=%d" % (index, sorted(line), extra, thai_chars))
                    print("DROP_LINE_NO_IMAGE line %d" % index)
                    return 1
                image_thai = len(THAI.findall(json.dumps(image, ensure_ascii=False)))
                image_sha = image_digest(image)
                allowed_extra = [key for key in extra if key != "image"]
                if image_thai:
                    print("DROPPED_LINE %d keys=%s other_keys=%s thai_chars=%d image_sha256=%s" % (
                        index, sorted(line), extra, thai_chars, image_sha))
                    print("DROP_LINE_IMAGE_HAS_THAI line %d" % index)
                    return 1
            print("DROPPED_LINE %d keys=%s other_keys=%s thai_chars=%d%s" % (
                index, sorted(line), extra, thai_chars,
                (" image_sha256=%s" % image_sha) if image_sha else ""))
            if allowed_extra or thai_chars:
                print("DROP_LINE_NOT_PLAIN line %d" % index)
                return 1
        pointing = [
            (later_index, line.get("imageOf"))
            for later_index, line in enumerate(before["song"]["lines"], start=1)
            for index in drops
            if later_index > index and line.get("imageOf") == index - 1
        ]
        print("LATER_IMAGEOF_POINTERS=%d" % len(pointing))
        if pointing:
            print("DROP_LINE_POINTED_AT %r" % (pointing,))
            return 1

    times = json.load(open(times_path, encoding="utf-8"))
    expected = len(before["song"]["lines"]) - len(drops)
    if len(times) != expected:
        print("TIMES_COUNT=%d (must be %d)" % (len(times), expected))
        return 1

    after = json.loads(raw)
    if drops:
        after["song"]["lines"] = [line for index, line in enumerate(after["song"]["lines"], start=1) if index not in drops]
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
    equal = strip(before, drops) == strip(written, set())
    print("STRUCTURE_EQUAL=%d" % (1 if equal else 0))
    print("times_count=%d" % len(written["song"].get("times", [])))
    print("lines_count=%d" % len(written["song"].get("lines", [])))
    print("approval_song_words=%r" % written["approval"]["song"].get("words"))

    before_digest, before_count = thai_digest(before_path)
    after_digest, after_count = thai_digest(target)
    print("THAI_LINES_BEFORE=%d SHA=%s" % (before_count, before_digest))
    print("THAI_LINES_AFTER=%d SHA=%s" % (after_count, after_digest))
    print("THAI_LINES_EQUAL=%d" % (1 if before_digest == after_digest else 0))

    numstat = subprocess.run(["git", "diff", "--numstat", "--", target], check=False, capture_output=True, text=True)
    print("git diff --numstat (added removed path):")
    print(numstat.stdout.strip())

    if not equal or before_digest != after_digest:
        shutil.copyfile(before_path, target)
        check = subprocess.run(["cmp", before_path, target], check=False, capture_output=True, text=True)
        print("RESTORED cmp_exit=%d" % check.returncode)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
