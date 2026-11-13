#!/usr/bin/env python3
"""Build the seven Phase 12 storytime package folders (create-only).

w01 -> w01-storytime-app-package-r5 (previous r4, song files read-only from r4)
w02 to w07 -> w0N-storytime-app-package-r4 (previous r3)
Every payload file comes from `git show <SRC>:content/storytime/<path>`,
except the 4 w01 song files, which come from the r4 folder and must equal
the SHA-256 values of its MANIFEST.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
SRC = "fa47ca23bef49008be2494ea948e8aebb9b638d4"
HANDOFF = os.path.expanduser("~/Desktop/handoff")
DATE = "2026-11-13"
SENDER = "Workbooks session, storytime week package jr-green"
EXTS = ("mp3", "wav", "m4a", "aac", "ogg", "opus", "mp4", "m4v", "webm", "mov",
        "jpg", "jpeg", "png", "webp", "gif", "svg", "pdf")
MEDIA_RE = re.compile(r"\.(" + "|".join(EXTS) + r")$", re.IGNORECASE)
SHA_LINE = re.compile(r"^([0-9a-f]{64})  (.*)$")

REVISION = {1: ("r5", "r4"), 2: ("r4", "r3"), 3: ("r4", "r3"), 4: ("r4", "r3"),
            5: ("r4", "r3"), 6: ("r4", "r3"), 7: ("r4", "r3")}
SONG_FILES = ("l2/media/w01/song.mp4", "l2/media/w01/song-poster.jpg",
              "l2/media/w01/song-phone.mp4",
              "l2/media/w01/song-phone-poster.jpg")
ONE_TAKE = {1: 70, 2: 62, 3: 130, 4: 116, 5: 127, 6: 132, 7: 142}
SENT_TAKES = {1: 70, 2: 78, 3: 130, 4: 160, 5: 127, 6: 166, 7: 142}
FAILED_W01 = 14
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
    sent = SENT_TAKES[n] + (FAILED_W01 if n == 1 else 0)
    failed_note = ""
    if n == 1:
        failed_note = (" This week sent 14 more characters in 2 failed mmx "
                       "calls (\"A nest.\" ENOENT, \"A nose.\" network).\n")
    return f"""Storytime app package {tag} {rev} ({DATE})
Source: Workbooks commit {SRC[:8]}, content/storytime/

Contract change (spec L14, the receiver contract; four new optional fields):
- opening.wordClips: an object, K2 key -> relative file path.
- focus.family.wordClips: an object, K2 key -> relative file path.
- focus.trickyWordClips: an object, K2 key -> relative file path.
- books[].audio.sentenceClips (decodable books only): an array in the order
  of audio.sentences; each item is {{ sentence, file }}.

Key rule (spec K2): normalise the word to NFC, change U+2018 and U+2019 to
the straight apostrophe, change it to lower case, then remove each character
other than a-z and the apostrophe from the start and the end. The key must
match ^[a-z]+('[a-z]+)*$. One key serves the word in each letter case.

Characters (spec L11, MiniMax plan quota only, no credits):
- Word run: 47 characters in all (15 new bank clips, each take 1).
- Sentence run of this week, one-take text sum: {ONE_TAKE[n]} characters
  (the w01 to w07 sums are 70, 62, 130, 116, 127, 132, and 142; 779 in all).
- Sentence run of this week, sent sum: {sent} characters{failed_note}
  (the w01 to w07 sent sums are 84, 78, 130, 160, 127, 166, and 142;
  887 in all, 873 for the takes plus 14 for the failed w01 calls).
- Total (words + sent sentences): 934 characters.

Look points (the listen list of this week):
{listen_lines}
"""


def build_week(n):
    tag = f"w{n:02d}"
    rev, prev_rev = REVISION[n]
    folder = f"{tag}-storytime-app-package-{rev}"
    previous = f"{tag}-storytime-app-package-{prev_rev}"
    target = os.path.join(HANDOFF, folder)
    if os.path.exists(target):
        raise SystemExit(f"STOP: {target} already exists (create-only)")
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
        prev_folder = os.path.join(HANDOFF, previous)
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
    prev = manifest_rows(os.path.join(HANDOFF, previous))
    removed = sorted(set(prev) - set(payload))
    changed = sorted(p for p in payload if p not in prev or prev[p] != cur[p])
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
                old_empty=old_empty, new_empty=new_empty,
                manifest_sha=hashlib.sha256(manifest).hexdigest())


def main():
    print(f"source commit: {SRC}")
    print(f"date: {DATE}")
    print("build rule: every media string of the week file with a file at "
          "source, the 2 pictures files, the sentence manifest, and the week "
          "file; each file read by git show; the 4 w01 song files come from "
          "the r4 folder and equal its MANIFEST")
    results = []
    for n in range(1, 8):
        r = build_week(n)
        results.append(r)
        print(f"=== {r['tag']} -> {r['target']} ===")
        print(f"payload files: {r['cargo']}")
        print(f"previous payload paths: {r['previous']}")
        print(f"changed paths: {r['changed']} (new: {r['new']})")
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
