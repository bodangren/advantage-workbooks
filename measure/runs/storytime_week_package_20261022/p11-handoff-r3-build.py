#!/usr/bin/env python3
"""Build the six r3 storytime package folders for weeks 02 to 07 (create-only)."""
import hashlib
import json
import os
import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
SRC = "953f798ea309cc10abd5538c202e05ff31a2320d"
HANDOFF = os.path.expanduser("~/Desktop/handoff")
DATE = "2026-11-09"
SENDER = "Workbooks session, storytime week package jr-green"
EXTS = ("mp3", "wav", "m4a", "aac", "ogg", "opus", "mp4", "m4v", "webm", "mov",
        "jpg", "jpeg", "png", "webp", "gif", "svg", "pdf")
MEDIA_RE = re.compile(r"\.(" + "|".join(EXTS) + r")$", re.IGNORECASE)
SHA_LINE = re.compile(r"^([0-9a-f]{64})  (.*)$")


def git_show(path):
    out = subprocess.run(["git", "-C", REPO, "show", f"{SRC}:content/storytime/{path}"],
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


def prev_payload(folder):
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


def build_week(n):
    tag = f"w{n:02d}"
    folder = f"{tag}-storytime-app-package-r3"
    previous = f"{tag}-storytime-app-package-r2"
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
              f"l2/media/{tag}/family/pictures.sha256"):
        if git_show(p) is not None:
            payload.append(p)
    payload.append(f"l2/{tag}.json")
    payload = sorted(payload)
    data = {p: git_show(p) for p in payload}
    if any(v is None for v in data.values()):
        raise SystemExit(f"STOP: a payload file of {tag} is absent at source")
    os.makedirs(target, exist_ok=False)
    for p in payload:
        write_file(target, p, data[p])
    cur = {p: hashlib.sha256(data[p]).hexdigest() for p in payload}
    prev = prev_payload(os.path.join(HANDOFF, previous))
    removed = sorted(set(prev) - set(payload))
    changed = sorted(p for p in payload if p not in prev or prev[p] != cur[p])
    new = sorted(p for p in payload if p not in prev)
    old_empty = len([p for p in new])
    new_empty = len(removed)
    week_path = f"l2/{tag}.json"
    clip_re = re.compile(r"^l2/media/" + tag + r"/words/wa-[a-z]*\.mp3$")
    new_clips = [p for p in new if clip_re.match(p)]
    other = sorted(set(changed) - {week_path} - set(new_clips))
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
    return dict(tag=tag, folder=folder, target=target, cargo=len(payload),
                previous=len(prev), changed=len(changed), new=len(new),
                old_empty=old_empty, new_empty=new_empty, other=other,
                manifest_sha=hashlib.sha256(manifest).hexdigest())


def main():
    print(f"source commit: {SRC}")
    print(f"date: {DATE}")
    print("build rule: every media string of the week file with a file at source,"
          " the 2 pictures files, and the week file; each file read by git show")
    results = []
    for n in range(2, 8):
        r = build_week(n)
        results.append(r)
        print(f"=== {r['tag']} -> {r['target']} ===")
        print(f"payload files: {r['cargo']}")
        print(f"previous payload paths: {r['previous']}")
        print(f"changed paths: {r['changed']} (new: {r['new']})")
        print(f"other-track changed paths ({len(r['other'])}): "
              f"{', '.join(r['other']) or 'none'}")
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
