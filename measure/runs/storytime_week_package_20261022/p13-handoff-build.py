#!/usr/bin/env python3
"""Build the seven Phase 13 storytime package folders (create-only).

w01 -> w01-storytime-app-package-r6 (previous r5, song files read-only from r5)
w02 to w07 -> w0N-storytime-app-package-r5 (previous r4)
Every payload file comes from `git show <SRC>:content/storytime/<path>`,
except the 4 w01 song files, which come from the r5 folder and must equal
the SHA-256 values of its MANIFEST.

Usage: p13-handoff-build.py [output-root] [--pending-chars]
  output-root: default ~/Desktop/handoff (Step A uses a /tmp staging root).
  --pending-chars: the Characters values of the README write
  "pending the Clips task" (Step A; p13-chars.txt comes later).
The previous revision folders are always read from ~/Desktop/handoff/,
read only, also when the output root is a staging directory.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
SRC = "6d9ab699766fde74f7c68a08c281615eff5f1f9b"
HANDOFF = os.path.expanduser("~/Desktop/handoff")
OUT = sys.argv[1] if len(sys.argv) > 1 else HANDOFF
PENDING = len(sys.argv) > 2 and sys.argv[2] == "--pending-chars"
DATE = "2026-11-15"
SENDER = "Workbooks session, storytime week package jr-green (Phase 13)"
EXTS = ("mp3", "wav", "m4a", "aac", "ogg", "opus", "mp4", "m4v", "webm", "mov",
        "jpg", "jpeg", "png", "webp", "gif", "svg", "pdf")
MEDIA_RE = re.compile(r"\.(" + "|".join(EXTS) + r")$", re.IGNORECASE)
SHA_LINE = re.compile(r"^([0-9a-f]{64})  (.*)$")

REVISION = {1: ("r6", "r5"), 2: ("r5", "r4"), 3: ("r5", "r4"),
            4: ("r5", "r4"), 5: ("r5", "r4"), 6: ("r5", "r4"),
            7: ("r5", "r4")}
SONG_FILES = ("l2/media/w01/song.mp4", "l2/media/w01/song-poster.jpg",
              "l2/media/w01/song-phone.mp4",
              "l2/media/w01/song-phone-poster.jpg")
# Read-along Characters of each week, from p13-chars.txt (M12). None until
# the Clips task wrote p13-chars.txt; Step A builds with --pending-chars.
READALONG_CHARS = {n: {"one_take": None, "sent": None} for n in range(1, 8)}
READALONG_TOTAL_SENT = None
LISTEN = {
    1: [],
    2: ["l2/media/w02/sentences/b1-s01.mp3 take 3"],
    3: [],
    4: ["l2/media/w04/sentences/b1-s08.mp3 take 3, note: heard 'Nan and Pam "
        "Knapp' in 3 takes"],
    5: ["l2/media/w05/sentences/b1-s08.mp3 take 1, the re-heard check on the "
        "shipped mp3 failed (heard 'Knap')"],
    6: ["l2/media/w06/sentences/b1-s01.mp3 take 3"],
    7: [],
}
KEY_RULE = ("Key rule (spec K2): normalise the word to NFC, change U+2018 and "
            "U+2019 to the straight apostrophe, change it to lower case, then "
            "remove each character other than a-z and the apostrophe from the "
            "start and the end. The key must match ^[a-z]+('[a-z]+)*$. One key "
            "serves the word in each letter case.")


def git_show(path):
    out = subprocess.run(["git", "-C", REPO, "show",
                          f"{SRC}:content/storytime/{path}"],
                         capture_output=True)
    if out.returncode != 0:
        return None
    return out.stdout


def walk_strings(obj, acc):
    if isinstance(obj, str):
        acc.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            walk_strings(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            walk_strings(v, acc)


def manifest_rows(folder):
    rows = {}
    with open(os.path.join(folder, "MANIFEST.txt"), encoding="utf-8") as fh:
        for line in fh:
            m = SHA_LINE.match(line.rstrip("\n"))
            if m:
                rows[m.group(2)] = m.group(1)
    return rows


def write_file(target, rel, data):
    dest = os.path.join(target, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as fh:
        fh.write(data)


def readme_text(n, rev):
    tag = f"w{n:02d}"
    listen = LISTEN[n]
    if listen:
        listen_lines = "\n".join(f"- {item}" for item in listen)
    else:
        listen_lines = "- none"
    if PENDING:
        c_text = "pending the Clips task."
        s_text = "pending the Clips task."
        total_text = "pending the Clips task."
    else:
        vals = READALONG_CHARS[n]
        if vals["one_take"] is None or vals["sent"] is None \
                or READALONG_TOTAL_SENT is None:
            raise SystemExit("STOP: fill READALONG_CHARS from p13-chars.txt "
                             "or build with --pending-chars")
        c_text = f"{vals['one_take']} characters."
        s_text = f"{vals['sent']} characters."
        total_text = f"{READALONG_TOTAL_SENT} characters."
    return f"""Storytime app package {tag} {rev} ({DATE})
Source: Workbooks commit {SRC[:8]}, base path content/storytime/

Contract change (spec M2, an extension of the receiver contract L14):
- books[].audio.sentenceClips now holds on every book of the week: the read-along book (index 0) and the decodable book (index 1).
- Before this revision it held on the decodable book only.
- It is an array in the order of audio.sentences. Each item is {{ sentence, file }}.
- Each file value is a path relative to content/storytime/, as every media path of the package.
- The items and files of the decodable book did not change.
- The other fields of the revision before (opening.wordClips, focus.family.wordClips, focus.trickyWordClips, books[].audio.wordClips) did not change.

{KEY_RULE}

Characters (spec M9, MiniMax plan quota only, no credits):
- Read-along sentences of this week, one-take text: {c_text}
- Read-along sentences of this week, sent: {s_text}
- Read-along sentences of w01 to w07, one-take text: 927 characters.
- Read-along sentences of w01 to w07, sent: {total_text}
- The decodable sentences and the words did not change (Phase 12 total: 934 characters).

Look points (the listen list of this week):
{listen_lines}
"""


def build_week(n):
    tag = f"w{n:02d}"
    rev, prev_rev = REVISION[n]
    folder = f"{tag}-storytime-app-package-{rev}"
    previous = f"{tag}-storytime-app-package-{prev_rev}"
    target = os.path.join(OUT, folder)
    prev_folder = os.path.join(HANDOFF, previous)
    if os.path.exists(target):
        raise SystemExit(f"STOP: {target} already exists (create-only)")
    if not os.path.isdir(prev_folder):
        raise SystemExit(f"STOP: previous folder missing: {prev_folder}")
    week_text = git_show(f"l2/{tag}.json")
    if week_text is None:
        raise SystemExit(f"STOP: no week file at source for {tag}")
    week = json.loads(week_text)
    acc = []
    walk_strings(week, acc)
    media = sorted({s for s in acc if MEDIA_RE.search(s)})
    payload = [p for p in media if git_show(p) is not None]
    for p in (f"l2/media/{tag}/books/pictures.sha256",
              f"l2/media/{tag}/family/pictures.sha256",
              f"l2/media/{tag}/sentences/manifest.json"):
        if git_show(p) is not None:
            payload.append(p)
    payload.append(f"l2/{tag}.json")
    data = {}
    for p in payload:
        data[p] = git_show(p)
        if data[p] is None:
            raise SystemExit(f"STOP: a payload file of {tag} is absent at source")
    if n == 1:
        prev_rows = manifest_rows(prev_folder)
        for p in SONG_FILES:
            with open(os.path.join(prev_folder, p), "rb") as fh:
                blob = fh.read()
            if hashlib.sha256(blob).hexdigest() != prev_rows.get(p):
                raise SystemExit(f"STOP: {p} differs from the {previous} MANIFEST")
            if p not in data:
                data[p] = blob
                payload.append(p)
    payload = sorted(payload)
    os.makedirs(target, exist_ok=False)
    for p in payload:
        write_file(target, p, data[p])
    cur = {p: hashlib.sha256(data[p]).hexdigest() for p in payload}
    prev = manifest_rows(prev_folder)
    removed = sorted(set(prev) - set(payload))
    changed = sorted(p for p in payload if p not in prev or prev[p] != cur[p])
    changed = sorted(set(changed) | set(removed))
    new = sorted(p for p in payload if p not in prev)
    old_empty = len(new)
    new_empty = len(removed)
    lines = ["source-repo: Workbooks",
             "source-path: content/storytime/",
             f"source-commit: {SRC}",
             f"workbooks-commit: {SRC}",
             ""]
    for p in payload:
        lines.append(f"{cur[p]}  {p}")
    lines.append("")
    lines.append(f"# Changed since {previous}:")
    for p in changed:
        lines.append(f"# {p}")
        lines.append(f"#   old-sha256: {prev.get(p, '')}")
        lines.append(f"#   new-sha256: {cur.get(p, '')}")
    lines.append("")
    lines.append(f"date: {DATE}")
    lines.append(f"sender: {SENDER}")
    manifest = ("\n".join(lines) + "\n").encode("utf-8")
    with open(os.path.join(target, "MANIFEST.txt"), "wb") as fh:
        fh.write(manifest)
    with open(os.path.join(target, "README.txt"), "w", encoding="utf-8") as fh:
        fh.write(readme_text(n, rev))
    return dict(tag=tag, folder=folder, target=target, cargo=len(payload),
                previous=len(prev), changed=len(changed), new=len(new),
                removed=len(removed), old_empty=old_empty,
                new_empty=new_empty,
                manifest_sha=hashlib.sha256(manifest).hexdigest())


def main():
    print(f"source commit: {SRC}")
    print(f"output root: {OUT}")
    print(f"date: {DATE}")
    print("build rule: every media string of the week file with a file at "
          "source, the 2 pictures files, the sentence manifest, and the week "
          "file; each file read by git show; the 4 w01 song files come from "
          "the r5 folder and equal its MANIFEST; the previous folders are "
          "read from ~/Desktop/handoff/ only")
    results = []
    for n in range(1, 8):
        r = build_week(n)
        results.append(r)
        print(f"=== {r['tag']} -> {r['target']} ===")
        print(f"payload files: {r['cargo']}")
        print(f"previous payload paths: {r['previous']}")
        print(f"changed paths: {r['changed']} (new: {r['new']}, "
              f"removed: {r['removed']})")
        print(f"old-sha256 empty lines: {r['old_empty']}")
        print(f"new-sha256 empty lines: {r['new_empty']}")
        print(f"MANIFEST sha256: {r['manifest_sha']}")
        print()
    print("folders built: " + str(len(results)))
    for r in results:
        print(f"{r['folder']}: payload {r['cargo']}, changed {r['changed']},"
              f" old-empty {r['old_empty']}, new-empty {r['new_empty']},"
              f" manifest {r['manifest_sha']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
