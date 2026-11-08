#!/usr/bin/env python3
"""Nine checks on the r3 package folders of weeks 02 to 07, with the Phase 11 values."""
import hashlib
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
HEX40 = re.compile(r"^[0-9a-f]{40}$")

EXPECTED_CLIPS = {2: 23, 3: 20, 4: 24, 5: 28, 6: 22, 7: 24}
EXPECTED_CHANGED = {2: 24, 3: 21, 4: 25, 5: 29, 6: 23, 7: 25}
EXPECTED_OLD = {2: 23, 3: 20, 4: 24, 5: 28, 6: 22, 7: 24}
EXPECTED_PAYLOAD = {2: 77, 3: 70, 4: 70, 5: 80, 6: 71, 7: 74}


def git_show(path):
    out = subprocess.run(["git", "-C", REPO, "show", f"{SRC}:content/storytime/{path}"],
                         capture_output=True)
    return out.stdout if out.returncode == 0 else None


def run(args):
    return subprocess.run(["git", "-C", REPO] + args, capture_output=True, text=True)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def walk(obj, key, acc):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == key and isinstance(v, str):
                acc.append(v)
            walk(v, key, acc)
    elif isinstance(obj, list):
        for v in obj:
            walk(v, key, acc)


def walk_strings(obj, acc):
    if isinstance(obj, str):
        acc.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            walk_strings(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            walk_strings(v, acc)


def payload_files(target):
    files = []
    for root, _dirs, names in os.walk(target):
        for name in names:
            full = os.path.join(root, name)
            rel = os.path.relpath(full, target)
            if rel == "MANIFEST.txt":
                continue
            files.append(rel)
    return sorted(files)


def manifest_rows(target):
    rows = {}
    with open(os.path.join(target, "MANIFEST.txt"), encoding="utf-8") as fh:
        for line in fh:
            m = SHA_LINE.match(line.rstrip("\n"))
            if m:
                rows[m.group(2)] = m.group(1)
    return rows


def changed_section(target):
    blocks = []
    header = None
    with open(os.path.join(target, "MANIFEST.txt"), encoding="utf-8") as fh:
        lines = [line.rstrip("\n") for line in fh]
    i = 0
    while i < len(lines) and not lines[i].startswith("# Changed since "):
        i += 1
    if i == len(lines):
        return header, blocks
    header = lines[i]
    i += 1
    while i < len(lines) and lines[i].startswith("# "):
        if lines[i].startswith("#   "):
            i += 1
            continue
        path = lines[i][2:]
        old = new = None
        if i + 1 < len(lines) and lines[i + 1].startswith("#   old-sha256:"):
            old = lines[i + 1].split("old-sha256:", 1)[1].strip()
        if i + 2 < len(lines) and lines[i + 2].startswith("#   new-sha256:"):
            new = lines[i + 2].split("new-sha256:", 1)[1].strip()
        blocks.append((path, old, new))
        i += 3
    return header, blocks


def check_folder(n):
    tag = f"w{n:02d}"
    folder = f"{tag}-storytime-app-package-r3"
    previous = f"{tag}-storytime-app-package-r2"
    target = os.path.join(HANDOFF, folder)
    prev_target = os.path.join(HANDOFF, previous)
    results = []

    def record(name, ok, text):
        results.append((name, ok, text))
        print(f"[{'PASS' if ok else 'FAIL'}] check {name} {text}")

    print(f"=== {folder} (previous {previous}) ===")
    files = payload_files(target)
    rows = manifest_rows(target)
    msha = sha256_file(os.path.join(target, "MANIFEST.txt"))

    # check 1
    literal = subprocess.run(
        "grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c --quiet -",
        shell=True, cwd=target, capture_output=True, text=True)
    unlisted = sorted(set(files) - set(rows))
    same_set = set(files) == set(rows)
    record(1, literal.returncode == 0 and same_set and len(files) > 0,
           f"manifest lines {len(rows)} equals payload files {len(files)}; "
           f"sha256sum -c exit {literal.returncode}; unlisted {len(unlisted)}")

    # check 2
    week_rel = f"l2/{tag}.json"
    tmp = f"/tmp/opencode/p11-r3/{tag}.json.src"
    src_bytes = git_show(week_rel)
    with open(tmp, "wb") as fh:
        fh.write(src_bytes)
    cmp2 = subprocess.run(["cmp", os.path.join(target, week_rel), tmp],
                          capture_output=True)
    record(2, cmp2.returncode == 0 and src_bytes is not None,
           f"cmp of {week_rel} with git show {SRC[:8]} exit {cmp2.returncode}")

    # check 3: family JPEGs and word clips, plus the family provenance join
    fam_bad = []
    fam_join_rows = 0
    fam_join_diff = 0
    prov = {}
    prov_path = os.path.join(target, f"l2/media/{tag}/family/pictures.sha256")
    if os.path.exists(prov_path):
        with open(prov_path, encoding="utf-8") as fh:
            for line in fh:
                parts = line.rstrip("\n").split("\t")
                if len(parts) >= 2:
                    prov[parts[0]] = parts[1]
    fam_dir = os.path.join(target, f"l2/media/{tag}/family")
    fam_files = []
    if os.path.isdir(fam_dir):
        fam_files = sorted(f for f in os.listdir(fam_dir) if f.endswith(".jpg"))
    for name in fam_files:
        rel = f"l2/media/{tag}/family/{name}"
        want = git_show(rel)
        with open(os.path.join(target, rel), "rb") as fh:
            got = fh.read()
        if got != want:
            fam_bad.append(rel)
        if rel in prov:
            fam_join_rows += 1
            if rows.get(rel) != prov[rel]:
                fam_join_diff += 1
        else:
            fam_join_diff += 1
    clip_bad = []
    clip_dir = os.path.join(target, f"l2/media/{tag}/words")
    clip_files = []
    if os.path.isdir(clip_dir):
        clip_files = sorted(f for f in os.listdir(clip_dir)
                            if re.match(r"^wa-[a-z]*\.mp3$", f))
    for name in clip_files:
        rel = f"l2/media/{tag}/words/{name}"
        bank = f"words/{name}"
        with open(os.path.join(target, rel), "rb") as fh:
            got = fh.read()
        if got != git_show(rel) or got != git_show(bank):
            clip_bad.append(rel)
        elif rows.get(rel) != sha256_bytes(git_show(bank)):
            clip_bad.append(rel)
    record(3, not fam_bad and not clip_bad and fam_join_diff == 0 and fam_join_rows > 0,
           f"family jpgs {len(fam_files)} bad {len(fam_bad)}; provenance rows "
           f"{fam_join_rows}, differences {fam_join_diff}; clips {len(clip_files)} "
           f"equal git show of media and bank with manifest sha equal bank mp3, bad "
           f"{len(clip_bad)} {clip_bad[:3]}")

    # check 4
    header, blocks = changed_section(target)
    want_line = f"# Changed since {previous}:"
    nheader = 1 if header == want_line else 0
    record(4, nheader == 1, f"headers {nheader}, line '{header}'")

    # check 5
    prev_rows = manifest_rows(prev_target)
    expected = sorted(p for p in set(rows) | set(prev_rows)
                      if rows.get(p) != prev_rows.get(p))
    listed = sorted(b[0] for b in blocks)
    diff_lines = len(set(expected) ^ set(listed))
    old_empty = len([b for b in blocks if not b[1]])
    new_empty = len([b for b in blocks if not b[2]])
    new_paths = len([b for b in blocks if not b[1]])
    clip_re = re.compile(r"^l2/media/" + tag + r"/words/wa-[a-z]*\.mp3$")
    new_clips = set(b[0] for b in blocks if not b[1] and clip_re.match(b[0]))
    other = sorted(set(expected) - {week_rel} - new_clips)
    ok5 = (diff_lines == 0 and len(expected) == EXPECTED_CHANGED[n]
           and old_empty == EXPECTED_OLD[n] and new_empty == 0)
    record(5, ok5,
           f"changed paths expected: {len(expected)}, listed: {len(listed)}, "
           f"diff lines: {diff_lines}; old-sha256 empty {old_empty} equals new paths "
           f"{new_paths}; new-sha256 empty {new_empty}; other tracks changed: "
           f"{', '.join(other) or 'none'}")

    # check 6
    clip_lines = len([p for p in rows if clip_re.match(p)])
    record(6, clip_lines == EXPECTED_CLIPS[n],
           f"clip lines: {clip_lines} (line 403 expected {EXPECTED_CLIPS[n]})")

    # check 7
    head_lines = {}
    with open(os.path.join(target, "MANIFEST.txt"), encoding="utf-8") as fh:
        for line in fh:
            if line.startswith("# "):
                break
            if ": " in line and not SHA_LINE.match(line):
                k, v = line.rstrip("\n").split(": ", 1)
                head_lines[k] = v
    sc = head_lines.get("source-commit", "")
    wc = head_lines.get("workbooks-commit", "")
    anc = run(["merge-base", "--is-ancestor", sc, "HEAD"]).returncode if HEX40.match(sc) else 1
    with open(os.path.join(target, "MANIFEST.txt"), encoding="utf-8") as fh:
        manifest_text = fh.read()
    present = all(f"{k}:" in manifest_text
                  for k in ("source-repo", "source-path", "date", "sender"))
    record(7, sc == wc and bool(HEX40.match(sc)) and anc == 0 and present,
           f"source-commit equals workbooks-commit {sc[:8]}; 40 hex; ancestor exit "
           f"{anc}; lines 4 of 4 present {present}")

    # check 8
    unsafe = [p for p in files if not SAFE_RE.match(p)]
    longest = max((len(p) for p in files), default=0)
    dotseg = [p for p in files if "." in p.split("/") or ".." in p.split("/")]
    week = json.loads(src_bytes)
    file_vals = []
    walk(week, "file", file_vals)
    bad_file = [v for v in file_vals if not SAFE_RE.match(v)]
    record(8, not unsafe and longest <= 200 and not dotseg and not bad_file,
           f"unsafe paths {len(unsafe)}; longest {longest}; dot segments {len(dotseg)}; "
           f"file values {len(file_vals)}, bad {len(bad_file)}")

    # check 9
    acc = []
    walk_strings(week, acc)
    media = sorted({s for s in acc if MEDIA_RE.search(s)})
    missing = [s for s in media if not os.path.isfile(os.path.join(target, s))]
    note = "none" if not missing else ", ".join(missing)
    record(9, not missing,
           f"media strings {len(media)}; each has its file except {len(missing)}: {note}")

    print(f"payload files without the MANIFEST: {len(files)}")
    print(f"MANIFEST sha256: {msha}")
    passed = len([r for r in results if r[1]])
    print(f"RESULT {'PASS' if passed == 9 else 'FAIL'} (9 checks on {folder}: "
          f"{passed} passed, {9 - passed} failed)")
    print()
    return dict(tag=tag, folder=folder, target=target, files=len(files),
                manifest_sha=msha, passed=passed, results=results,
                changed=len(expected), old_empty=old_empty, new_empty=new_empty,
                clips=clip_lines, other=other)


def main():
    print(f"source commit: {SRC}")
    print()
    out = []
    for n in range(2, 8):
        out.append(check_folder(n))
    print("=== literal shell checks ===")
    for r in out:
        print(f"{r['folder']}: payload {r['files']}, changed {r['changed']}, "
              f"old-empty {r['old_empty']}, new-empty {r['new_empty']}, "
              f"clips {r['clips']}, manifest {r['manifest_sha']}")
    # changed-path join, one line per folder
    print()
    print("=== changed paths: join -a1 -a2 of the r2 and r3 MANIFEST lists ===")
    for r in out:
        expected = set()
        cur = manifest_rows(r["target"])
        prev = manifest_rows(os.path.join(HANDOFF, f"{r['tag']}-storytime-app-package-r2"))
        for p in set(cur) | set(prev):
            if cur.get(p) != prev.get(p):
                expected.add(p)
        _, blocks = changed_section(r["target"])
        listed = set(b[0] for b in blocks)
        print(f"{r['folder']}: changed paths from the join: {len(expected)}; "
              f"listed: {len(listed)}; diff lines: {len(expected ^ listed)}")
    # clip loop of line 403
    print()
    print("=== clip loop of line 403 (python form of the here-string loop) ===")
    loop_lines = 0
    for n in range(2, 8):
        name = f"w{n:02d}"
        count = len([p for p in manifest_rows(os.path.join(
            HANDOFF, f"{name}-storytime-app-package-r3")) if re.match(
            r"^l2/media/" + name + r"/words/wa-[a-z]*\.mp3$", p)])
        if count != EXPECTED_CLIPS[n]:
            print(f"{name}: clip count differs")
            loop_lines += 1
    print(f"clip loop lines: {loop_lines} (the loop prints nothing)")
    # words files in folders, with the w01 r4 folder
    print()
    print("=== words files in folders ===")
    total = 0
    for n, forced in [(1, "w01-storytime-app-package-r4")] + [(k, None) for k in range(2, 8)]:
        name = forced or f"w{n:02d}-storytime-app-package-r3"
        d = os.path.join(HANDOFF, name, f"l2/media/w{n:02d}/words")
        c = 0
        if os.path.isdir(d):
            c = len([f for f in os.listdir(d) if re.match(r"^wa-[a-z]*\.mp3$", f)])
        total += c
        print(f"  {name}: {c}")
    print(f"words files in folders: {total}")
    all_pass = all(r["passed"] == 9 for r in out)
    print()
    print(f"RESULT {'PASS' if all_pass else 'FAIL'} (9 checks on 6 folders, "
          f"{sum(9 - r['passed'] for r in out)} failures)")
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
