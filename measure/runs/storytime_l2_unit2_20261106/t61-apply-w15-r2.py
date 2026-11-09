#!/usr/bin/env python3
"""Apply Daniel's week 15 r2 pick (the take c3) to the staged week 15 file.

Usage: t61-apply-w15-r2.py [--dry-run]

The script sets in `content/storytime/drafts/l2/w15.json`:
- `song.lines`: the 13 lines of the r2 line plan. The 8 word lines keep the picture of
  the present line of `67946609`, and the 5 other lines take `imageOf` of an earlier line.
- `song.times`: the 13 entries of `t61-w15-r2-song-times.json`.
- `song.lyricSheet` and `song.styleBrief`: the r2 sheet that Lyria got, from the hand-off
  folder `~/Desktop/handoff/storytime-l2u2-w15-lyrics-r2-2026-11-09/w15-song-request.md`.
- `approval.song`: Daniel's words and the take.

The script proves that nothing outside `song` and `approval.song` changed, that the Thai
lines are byte-equal, that every gesture is one of the 24 of the schema, that every line
has a picture or an `imageOf`, and that every `imageOf` names an earlier line with a
picture. The script never prints Thai text.

`--dry-run` writes the result to a temporary file and leaves the week file alone.
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = os.path.join(REPO, "measure/runs/storytime_l2_unit2_20261106")
TARGET = os.path.join(REPO, "content/storytime/drafts/l2/w15.json")
SCHEMA = os.path.join(REPO, "dashboard/lib/storytime/schema.ts")
TIMES = os.path.join(RUNS, "t61-w15-r2-song-times.json")
LYRICS_R2 = os.path.join(RUNS, "w15-lyrics-r2.md")
REQUEST = os.path.expanduser(
    "~/Desktop/handoff/storytime-l2u2-w15-lyrics-r2-2026-11-09/w15-song-request.md")
BEFORE = "/tmp/opencode/t61r8/w15.before.json"
DRY = "/tmp/opencode/t61r8/w15.dry.json"
PRESENT_SHA = "67946609"
THAI = re.compile("[\u0e00-\u0e7f]")

APPROVAL = {
    "status": "approved",
    "date": "2026-11-10",
    "words": "W15 r2 c3",
    "source": "Owner answer relayed by the PM session, 2026-11-10 05:01 ICT (Tasks item "
              "aklrc1IyZ2paejVRNm0xaw): the pick of the take l2-w15-song-r2-c3.mp3 of the "
              "candidate folder storytime-l2u2-w15-candidates-r2 (Lyria 3 Pro). Take SHA-256 "
              "340a771e2a127c63967bf6788d766055053342577ae9f8ae7bf186e37d4066ac. It replaces "
              "the c2 fallback of spec D17.",
}


def read_text(path):
    """The text of a file."""
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def section(text, heading):
    """The lines of a markdown section, without the heading and the blank lines."""
    lines = text.split("\n")
    start = None
    for index, line in enumerate(lines):
        if line.strip() == heading:
            start = index + 1
            break
    if start is None:
        raise SystemExit("SECTION_NOT_FOUND %s" % heading)
    out = []
    for line in lines[start:]:
        if line.startswith("## "):
            break
        if line.strip():
            out.append(line.rstrip())
    return out


def sheet_text(section_lines):
    """The lyric sheet in the form of the present one: a blank line between the blocks."""
    blocks = []
    current = []
    for line in section_lines:
        if re.fullmatch(r"\[[^\]]+\]", line.strip()):
            if current:
                blocks.append(current)
            current = [line.strip()]
        else:
            current.append(line.strip())
    if current:
        blocks.append(current)
    return "\n\n".join("\n".join(block) for block in blocks)


def present_lines():
    """The song lines of the present week file at `PRESENT_SHA`."""
    raw = subprocess.run(
        ["git", "-C", REPO, "show", "%s:content/storytime/drafts/l2/w15.json" % PRESENT_SHA],
        check=True, capture_output=True).stdout.decode("utf-8")
    return json.loads(raw)["song"]["lines"]


def copy_line(line):
    """A copy of one present line, with its key order."""
    return json.loads(json.dumps(line))


def thai_digest(path):
    """SHA-256 of the ordered Thai-holding lines and their count. Prints no Thai."""
    lines = read_text(path).split("\n")
    thai = [line for line in lines if THAI.search(line)]
    return hashlib.sha256("\n".join(thai).encode("utf-8")).hexdigest(), len(thai)


def strip_song(value):
    """A copy of the week object without `song` and without `approval.song`."""
    copy = json.loads(json.dumps(value))
    copy.pop("song", None)
    copy.get("approval", {}).pop("song", None)
    return copy


def schema_gestures():
    """The 24 gesture names of the schema, and the two song parts."""
    text = read_text(SCHEMA)
    block = re.search(r"export const GESTURES = \[(.*?)\] as const;", text, re.S)
    if block is None:
        raise SystemExit("GESTURES_NOT_FOUND")
    gestures = re.findall(r"'([^']+)'", block.group(1))
    parts_block = re.search(r"part: z\.enum\(\[([^\]]*)\]\)", text)
    if parts_block is None:
        raise SystemExit("PARTS_NOT_FOUND")
    parts = re.findall(r"'([^']+)'", parts_block.group(1))
    return gestures, parts


def main():
    parser = argparse.ArgumentParser(description="Apply the week 15 r2 pick to the week file.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    raw = read_text(TARGET)
    shutil.copyfile(TARGET, BEFORE)
    before = json.loads(raw)
    second = raw.split("\n")[1]
    indent = 2 if second.startswith("  ") and not second.startswith("   ") else 4
    final_newline = raw.endswith("\n")

    present = present_lines()

    def keep(number):
        """The present line object of that number, as a copy."""
        return copy_line(present[number - 1])

    bus = keep(1)
    bus["part"] = "verse"
    train = keep(2)
    train["part"] = "verse"
    car = keep(3)
    car["part"] = "verse"
    bike = keep(4)
    bike["part"] = "verse"
    chorus_around = {"text": "Look, look, look around!", "part": "chorus",
                     "gesture": "look", "imageOf": 0}
    chorus_me = {"text": "Look, look, look with me!", "part": "chorus",
                 "gesture": "point to self", "imageOf": 0}
    boat = keep(7)
    boat["part"] = "verse"
    truck = keep(8)
    truck["part"] = "verse"
    plane = keep(11)
    plane["gesture"] = "point up"
    plane["part"] = "verse"
    helicopter = keep(12)
    helicopter["gesture"] = "stretch up"
    helicopter["part"] = "verse"
    ending = {"text": "Wave goodbye! Time to go home!", "part": "verse",
              "gesture": "wave", "imageOf": 9}

    lines = [bus, train, car, bike, chorus_around, chorus_me, boat, truck, plane,
             helicopter, copy_line(chorus_around), copy_line(chorus_me), ending]

    times = json.loads(read_text(TIMES))

    request_lines = section(read_text(REQUEST), "## Lyric sheet")
    lyric_sheet = sheet_text(request_lines)
    style_brief = " ".join(section(read_text(REQUEST), "## Style brief"))
    lyrics_r2_lines = section(read_text(LYRICS_R2), "## Lyric sheet")
    lyrics_r2_sheet = sheet_text(lyrics_r2_lines)
    print("LYRIC_SHEET_EQUALS_RUNS_SHEET=%d" % (1 if lyric_sheet == lyrics_r2_sheet else 0))
    if lyric_sheet != lyrics_r2_sheet:
        print("LYRIC_SHEET_RUNS_SHEET=%r" % lyrics_r2_sheet)
    print("STYLE_BRIEF_CHARS=%d" % len(style_brief))

    after = json.loads(raw)
    after["song"]["lines"] = lines
    after["song"]["lyricSheet"] = lyric_sheet
    after["song"]["styleBrief"] = style_brief
    after["song"]["times"] = times
    after["approval"]["song"] = dict(APPROVAL)

    text = json.dumps(after, ensure_ascii=False, indent=indent)
    if final_newline:
        text += "\n"

    target = DRY if args.dry_run else TARGET
    with open(target, "w", encoding="utf-8") as handle:
        handle.write(text)

    written = json.loads(read_text(target))
    equal = strip_song(before) == strip_song(written)
    print("STRUCTURE_EQUAL=%d" % (1 if equal else 0))
    print("lines_count=%d" % len(written["song"]["lines"]))
    print("times_count=%d" % len(written["song"]["times"]))
    print("approval_song_words=%r" % written["approval"]["song"]["words"])

    before_digest, before_count = thai_digest(BEFORE)
    after_digest, after_count = thai_digest(target)
    print("THAI_LINES_BEFORE=%d SHA=%s" % (before_count, before_digest))
    print("THAI_LINES_AFTER=%d SHA=%s" % (after_count, after_digest))
    print("THAI_LINES_EQUAL=%d" % (1 if before_digest == after_digest else 0))

    gestures, parts = schema_gestures()
    print("GESTURES_COUNT=%d PARTS=%r" % (len(gestures), parts))
    bad_gestures = [(i + 1, l["gesture"]) for i, l in enumerate(written["song"]["lines"])
                     if l["gesture"] not in gestures]
    print("GESTURES_OK=%d" % (1 if not bad_gestures else 0))
    if bad_gestures:
        print("BAD_GESTURES=%r" % (bad_gestures,))
    bad_parts = [(i + 1, l["part"]) for i, l in enumerate(written["song"]["lines"])
                 if l["part"] not in parts]
    print("PARTS_OK=%d" % (1 if not bad_parts else 0))
    if bad_parts:
        print("BAD_PARTS=%r" % (bad_parts,))

    no_picture = [(i + 1, l["text"]) for i, l in enumerate(written["song"]["lines"])
                  if not l.get("image") and l.get("imageOf") is None]
    print("PICTURES_OK=%d" % (1 if not no_picture else 0))
    if no_picture:
        print("NO_PICTURE=%r" % (no_picture,))

    bad_refs = [(i + 1, l["imageOf"]) for i, l in enumerate(written["song"]["lines"])
                if l.get("imageOf") is not None
                and (l["imageOf"] >= i or not written["song"]["lines"][l["imageOf"]].get("image"))]
    print("IMAGEOF_TARGETS_OK=%d" % (1 if not bad_refs else 0))
    if bad_refs:
        print("BAD_IMAGEOF=%r" % (bad_refs,))

    frame_lines = [i + 1 for i, l in enumerate(written["song"]["lines"])
                   if l["text"].startswith("Look, a ")]
    print("FRAME_LINES=%d (the rule is 8 or more)" % len(frame_lines))
    print("FRAME_LINE_NUMBERS=%r" % (frame_lines,))

    sheet_lines = [l for l in lyric_sheet.split("\n")
                   if l.strip() and not re.fullmatch(r"\[[^\]]+\]", l.strip())]
    sung_lines = [l["text"] for l in written["song"]["lines"]]
    print("SHEET_LINES=%d SUNG_LINES=%d SHEET_MATCHES_LINES=%d" % (
        len(sheet_lines), len(sung_lines), 1 if sheet_lines == sung_lines else 0))

    if args.dry_run:
        numstat = subprocess.run(["git", "diff", "--no-index", "--numstat", BEFORE, target],
                                 check=False, capture_output=True, text=True)
    else:
        numstat = subprocess.run(["git", "diff", "--numstat", "--", TARGET],
                                 check=False, capture_output=True, text=True)
    print("git diff --numstat (added removed path):")
    print(numstat.stdout.strip())

    if not equal or before_digest != after_digest or bad_gestures or bad_parts \
            or no_picture or bad_refs:
        if not args.dry_run:
            shutil.copyfile(BEFORE, TARGET)
            check = subprocess.run(["cmp", BEFORE, TARGET], check=False, capture_output=True, text=True)
            print("RESTORED cmp_exit=%d" % check.returncode)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
