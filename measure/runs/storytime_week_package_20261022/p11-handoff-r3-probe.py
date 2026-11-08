#!/usr/bin/env python3
"""Probe the r3 package build of weeks 02 to 07 before the build runs (no write)."""
import json
import os
import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
SRC = "953f798ea309cc10abd5538c202e05ff31a2320d"
HANDOFF = os.path.expanduser("~/Desktop/handoff")
EXTS = ("mp3", "wav", "m4a", "aac", "ogg", "opus", "mp4", "m4v", "webm", "mov",
        "jpg", "jpeg", "png", "webp", "gif", "svg", "pdf")
MEDIA_RE = re.compile(r"\.(" + "|".join(EXTS) + r")$", re.IGNORECASE)
SAFE_RE = re.compile(r"^[A-Za-z0-9._/-]+$")
SHA_LINE = re.compile(r"^([0-9a-f]{64})  (.*)$")

EXPECTED = {
    2: dict(made=11, files=23, changed=24, old=23, payload=77, clip=23),
    3: dict(made=5, files=20, changed=21, old=20, payload=70, clip=20),
    4: dict(made=3, files=24, changed=25, old=24, payload=70, clip=24),
    5: dict(made=4, files=28, changed=29, old=28, payload=80, clip=28),
    6: dict(made=2, files=22, changed=23, old=22, payload=71, clip=22),
    7: dict(made=2, files=24, changed=25, old=24, payload=74, clip=24),
}


def show_bytes(path):
    out = subprocess.run(["git", "-C", REPO, "show", f"{SRC}:content/storytime/{path}"],
                         capture_output=True)
    return out.stdout if out.returncode == 0 else None


def sha256_bytes(data):
    import hashlib
    return hashlib.sha256(data).hexdigest()


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
    path = os.path.join(folder, "MANIFEST.txt")
    rows = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            m = SHA_LINE.match(line.rstrip("\n"))
            if m:
                rows[m.group(2)] = m.group(1)
    return rows


def main():
    print(f"source: {SRC}")
    bad = 0
    for n in range(2, 8):
        tag = f"w{n:02d}"
        text = show_bytes(f"l2/{tag}.json")
        if text is None:
            print(f"{tag}: FAIL no week file at source")
            bad += 1
            continue
        week = json.loads(text)
        acc = []
        walk_strings(week, acc)
        media = sorted({s for s in acc if MEDIA_RE.search(s)})
        with_file = [p for p in media if show_bytes(p) is not None]
        missing = [p for p in media if p not in with_file]
        payload = list(with_file)
        for p in (f"l2/media/{tag}/books/pictures.sha256",
                  f"l2/media/{tag}/family/pictures.sha256"):
            if show_bytes(p) is not None:
                payload.append(p)
        payload.append(f"l2/{tag}.json")
        payload = sorted(payload)
        cur_sha = {p: sha256_bytes(show_bytes(p)) for p in payload}
        prev = prev_payload(os.path.join(HANDOFF, f"{tag}-storytime-app-package-r2"))
        removed = sorted(set(prev) - set(payload))
        changed = sorted(p for p in payload if p not in prev or prev[p] != cur_sha[p])
        new = sorted(p for p in payload if p not in prev)
        old_empty = [p for p in new]
        new_empty = [p for p in removed]
        clip_re = re.compile(r"^l2/media/" + tag + r"/words/wa-[a-z]*\.mp3$")
        clips = [p for p in payload if clip_re.match(p)]
        week_path = f"l2/{tag}.json"
        new_clips = [p for p in new if clip_re.match(p)]
        other = sorted(set(changed) - {week_path} - set(new_clips))
        exp = EXPECTED[n]
        checks = {
            "clip": (len(clips), exp["clip"]),
            "changed": (len(changed), exp["changed"]),
            "old": (len(old_empty), exp["old"]),
            "payload": (len(payload), exp["payload"]),
            "files": (len(with_file), exp["files"]),
            "new": (len(new), exp["old"]),
        }
        ok = all(got == want for got, want in checks.values())
        print(f"{tag}: media {len(media)} with-file {len(with_file)} payload {len(payload)}"
              f" changed {len(changed)} new {len(new)} clips {len(clips)}"
              f" expected {'OK' if ok else 'DIFFERS'}")
        if not ok:
            bad += 1
            for name, (got, want) in checks.items():
                if got != want:
                    print(f"  {name}: got {got} expected {want}")
        print(f"  words with no file ({len(missing)}): {', '.join(missing) or 'none'}")
        print(f"  removed from r2 ({len(removed)}): {', '.join(removed) or 'none'}")
        print(f"  other-track changed paths ({len(other)}): {', '.join(other) or 'none'}")
    print(f"probe result: {'PASS' if bad == 0 else 'DIFFERS %d' % bad}")
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
