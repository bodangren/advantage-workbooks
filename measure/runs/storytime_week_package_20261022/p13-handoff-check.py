#!/usr/bin/env python3
"""Nine checks on the seven Phase 13 package folders, with the Phase 13 values.

Usage: p13-handoff-check.py [output-root]
  output-root: default ~/Desktop/handoff (Step A checks a /tmp staging root).
The previous revision folders are always read from ~/Desktop/handoff/.
Every check prints the measured value; a difference names its cause (the
Phase 14 clip copies and removals of a318b199, and the missing read-along
clips: the Clips task runs after 2026-11-15 23:00 ICT).
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
CLIP_PENDING = "the Clips task runs after 2026-11-15 23:00 ICT"
P14_CAUSE = "the Phase 14 clip copies and removals of a318b199"
EXTS = ("mp3", "wav", "m4a", "aac", "ogg", "opus", "mp4", "m4v", "webm", "mov",
        "jpg", "jpeg", "png", "webp", "gif", "svg", "pdf")
MEDIA_RE = re.compile(r"\.(" + "|".join(EXTS) + r")$", re.IGNORECASE)
SAFE_RE = re.compile(r"^[A-Za-z0-9._/-]+$")
SHA_LINE = re.compile(r"^([0-9a-f]{64})  (.*)$")
HEX40 = re.compile(r"^[0-9a-f]{40}$")

REVISION = {1: ("r6", "r5"), 2: ("r5", "r4"), 3: ("r5", "r4"),
            4: ("r5", "r4"), 5: ("r5", "r4"), 6: ("r5", "r4"),
            7: ("r5", "r4")}
SONG_FILES = ("l2/media/w01/song.mp4", "l2/media/w01/song-poster.jpg",
              "l2/media/w01/song-phone.mp4",
              "l2/media/w01/song-phone-poster.jpg")
EXPECTED_CLIPS = {1: 30, 2: 36, 3: 27, 4: 31, 5: 34, 6: 27, 7: 33}
EXPECTED_B0 = {1: 8, 2: 16, 3: 8, 4: 8, 5: 8, 6: 8, 7: 16}
EXPECTED_B1 = {n: 8 for n in range(1, 8)}
EXPECTED_CHANGED = {1: 10, 2: 18, 3: 10, 4: 10, 5: 10, 6: 10, 7: 18}
EXPECTED_OLD = {1: 8, 2: 16, 3: 8, 4: 8, 5: 8, 6: 8, 7: 16}
EXPECTED_PAYLOAD = {1: 98, 2: 115, 3: 94, 4: 94, 5: 103, 6: 93, 7: 108}
TMP = "/tmp/opencode/p13-pkg"


def git_show(path):
    out = subprocess.run(["git", "-C", REPO, "show",
                          f"{SRC}:content/storytime/{path}"],
                         capture_output=True)
    return out.stdout if out.returncode == 0 else None


def run(args):
    return subprocess.run(["git", "-C", REPO] + args, capture_output=True,
                          text=True)


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
            if rel in ("MANIFEST.txt", "README.txt"):
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


def readme_checks(target):
    path = os.path.join(target, "README.txt")
    if not os.path.isfile(path):
        return False, "README.txt missing"
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    lines = text.split("\n")
    base_count = text.count("content/storytime/")
    sc_count = text.count("sentenceClips")
    blank_between = 0
    prev_item = False
    pending_blank = False
    for ln in lines:
        if ln.startswith("- "):
            if pending_blank:
                blank_between += 1
            prev_item = True
            pending_blank = False
        elif ln.strip() == "":
            pending_blank = prev_item
        elif ln.startswith("  "):
            continue
        else:
            prev_item = False
            pending_blank = False
    char_period_bad = 0
    in_chars = False
    for ln in lines:
        if ln.startswith("Characters ("):
            in_chars = True
            continue
        if in_chars:
            if ln.strip() == "":
                break
            if ln.startswith("- ") and not ln.rstrip().endswith("."):
                char_period_bad += 1
    ok = base_count >= 2 and sc_count >= 1 and blank_between == 0 \
        and char_period_bad == 0
    text_out = (f"README of AC13-13: 'content/storytime/' lines {base_count} "
                f"(want 2 or more); 'sentenceClips' lines {sc_count} (want 1 "
                f"or more); blank line inside a list {blank_between} (want 0); "
                f"Characters items without a period {char_period_bad} "
                f"(want 0)")
    return ok, text_out


def check_folder(n):
    tag = f"w{n:02d}"
    rev, prev_rev = REVISION[n]
    folder = f"{tag}-storytime-app-package-{rev}"
    previous = f"{tag}-storytime-app-package-{prev_rev}"
    target = os.path.join(OUT, folder)
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
    os.makedirs(TMP, exist_ok=True)
    tmp = os.path.join(TMP, f"{tag}.json.src")
    src_bytes = git_show(week_rel)
    with open(tmp, "wb") as fh:
        fh.write(src_bytes)
    cmp2 = subprocess.run(["cmp", os.path.join(target, week_rel), tmp],
                          capture_output=True)
    record(2, cmp2.returncode == 0 and src_bytes is not None,
           f"cmp of {week_rel} with git show {SRC[:8]} exit {cmp2.returncode}")

    # check 3: word clips, both sentence clip kinds, family join, w01 songs
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
        fam_files = sorted(f for f in os.listdir(fam_dir)
                           if f.endswith(".jpg"))
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
    sent_dir = os.path.join(target, f"l2/media/{tag}/sentences")
    b0_files = []
    b1_files = []
    sent_bad = []
    if os.path.isdir(sent_dir):
        sent_files = sorted(f for f in os.listdir(sent_dir)
                            if re.match(r"^b\d-s\d\d\.mp3$", f))
        b0_files = [f for f in sent_files if f.startswith("b0-")]
        b1_files = [f for f in sent_files if f.startswith("b1-")]
        for name in sent_files:
            rel = f"l2/media/{tag}/sentences/{name}"
            with open(os.path.join(target, rel), "rb") as fh:
                got = fh.read()
            if got != git_show(rel):
                sent_bad.append(rel)
    man_rel = f"l2/media/{tag}/sentences/manifest.json"
    man_ok = (git_show(man_rel) is not None and
              open(os.path.join(target, man_rel), "rb").read()
              == git_show(man_rel))
    song_bad = []
    if n == 1:
        prev_rows = manifest_rows(prev_target)
        for rel in SONG_FILES:
            with open(os.path.join(target, rel), "rb") as fh:
                got = fh.read()
            if (sha256_bytes(got) != prev_rows.get(rel) or
                    got != open(os.path.join(prev_target, rel), "rb").read()):
                song_bad.append(rel)
    b0_note = ""
    if len(b0_files) != EXPECTED_B0[n]:
        b0_note = f" (measured; cause: {CLIP_PENDING})"
    record(3, (not fam_bad and not clip_bad and not sent_bad and man_ok
               and not song_bad and fam_join_diff == 0 and fam_join_rows > 0
               and len(b0_files) == EXPECTED_B0[n]),
           f"family jpgs {len(fam_files)} bad {len(fam_bad)}; provenance rows "
           f"{fam_join_rows}, differences {fam_join_diff}; clips {len(clip_files)} "
           f"equal git show of media and bank with manifest sha equal bank mp3, "
           f"bad {len(clip_bad)}; decodable sentence clips b1 {len(b1_files)} "
           f"equal git show, bad {len(sent_bad)}; read-along sentence clips "
           f"b0 {len(b0_files)} (expected {EXPECTED_B0[n]}){b0_note}; "
           f"sentence manifest cmp: {man_ok}"
           + (f"; w01 song files bad {len(song_bad)}" if n == 1 else ""))

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
    sent_re5 = re.compile(r"^l2/media/" + tag + r"/sentences/")
    new_sent = set(b[0] for b in blocks if not b[1] and sent_re5.match(b[0]))
    other = sorted(set(expected) - {week_rel} - new_clips - new_sent)
    ok5 = (diff_lines == 0 and len(expected) == EXPECTED_CHANGED[n]
           and old_empty == EXPECTED_OLD[n] and new_empty == 0)
    cause5 = ""
    if not ok5:
        missing = max(0, EXPECTED_CHANGED[n] - len(expected))
        bits = []
        if new_empty:
            bits.append(f"{new_empty} removed path(s) of {P14_CAUSE}")
        if missing:
            bits.append(f"{missing} changed path(s) of the read-along clips "
                        f"and the sentence manifest wait for {CLIP_PENDING}")
        if not bits:
            bits.append(f"the new word clip paths of {P14_CAUSE}")
        cause5 = "; cause: " + "; ".join(bits)
    record(5, ok5,
           f"changed paths expected: {len(expected)}, listed: {len(listed)}, "
           f"diff lines: {diff_lines}; old-sha256 empty {old_empty} equals new "
           f"paths {new_paths}; new-sha256 empty {new_empty}; other tracks "
           f"changed: {', '.join(other) or 'none'}" + cause5)

    # check 6
    clip_lines = len([p for p in rows if clip_re.match(p)])
    b0_re = re.compile(r"^l2/media/" + tag + r"/sentences/b0-s\d\d\.mp3$")
    b1_re = re.compile(r"^l2/media/" + tag + r"/sentences/b1-s\d\d\.mp3$")
    b0_lines = len([p for p in rows if b0_re.match(p)])
    b1_lines = len([p for p in rows if b1_re.match(p)])
    ok6_words = clip_lines == EXPECTED_CLIPS[n]
    ok6_b0 = b0_lines == EXPECTED_B0[n]
    ok6_b1 = b1_lines == EXPECTED_B1[n]
    cause6 = ""
    if not ok6_words:
        cause6 += (f"; word clip cause: {clip_lines - EXPECTED_CLIPS[n]:+d} "
                   f"of {P14_CAUSE}")
    if not ok6_b0:
        cause6 += f"; b0 cause: {CLIP_PENDING}"
    if not ok6_b1:
        cause6 += "; b1 count differs (no cause on file)"
    record(6, ok6_words and ok6_b0 and ok6_b1,
           f"word clip lines: {clip_lines} (spec M11 expected "
           f"{EXPECTED_CLIPS[n]}); read-along clip lines b0: {b0_lines} "
           f"(expected {EXPECTED_B0[n]}); decodable clip lines b1: {b1_lines} "
           f"(expected {EXPECTED_B1[n]})" + cause6)

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
    anc = run(["merge-base", "--is-ancestor", sc, "HEAD"]).returncode \
        if HEX40.match(sc) else 1
    with open(os.path.join(target, "MANIFEST.txt"), encoding="utf-8") as fh:
        manifest_text = fh.read()
    present = all(f"{k}:" in manifest_text
                  for k in ("source-repo", "source-path", "date", "sender"))
    record(7, sc == wc and bool(HEX40.match(sc)) and anc == 0 and present,
           f"source-commit equals workbooks-commit {sc[:8]}; 40 hex; ancestor "
           f"exit {anc}; lines 4 of 4 present {present}")

    # check 8
    unsafe = [p for p in files if not SAFE_RE.match(p)]
    longest = max((len(p) for p in files), default=0)
    dotseg = [p for p in files if "." in p.split("/") or ".." in p.split("/")]
    week = json.loads(src_bytes)
    file_vals = []
    walk(week, "file", file_vals)
    bad_file = [v for v in file_vals if not SAFE_RE.match(v)]
    record(8, not unsafe and longest <= 200 and not dotseg and not bad_file,
           f"unsafe paths {len(unsafe)}; longest {longest}; dot segments "
           f"{len(dotseg)}; file values {len(file_vals)}, bad {len(bad_file)}")

    # check 9: every media string is a file; plus the three word maps and the
    # sentenceClips files of both books, each a file of the folder
    acc = []
    walk_strings(week, acc)
    media = sorted({s for s in acc if MEDIA_RE.search(s)})
    missing = [s for s in media if not os.path.isfile(os.path.join(target, s))]
    prose = [s for s in missing if not SAFE_RE.match(s)]
    real_missing = [s for s in missing if SAFE_RE.match(s)]
    map_vals = []
    for holder in (week.get("opening") or {},
                   (week.get("focus") or {}).get("family") or {},
                   week.get("focus") or {}):
        m = holder.get("wordClips") if isinstance(holder, dict) else None
        if isinstance(m, dict):
            map_vals.extend(v for v in m.values() if isinstance(v, str))
    tricky = (week.get("focus") or {}).get("trickyWordClips")
    if isinstance(tricky, dict):
        map_vals.extend(v for v in tricky.values() if isinstance(v, str))
    sent_vals = []
    for book in week.get("books") or []:
        sc2 = (book.get("audio") or {}).get("sentenceClips")
        if isinstance(sc2, list):
            sent_vals.extend(i.get("file") for i in sc2
                             if isinstance(i, dict)
                             and isinstance(i.get("file"), str))
    map_missing = [v for v in map_vals + sent_vals
                   if not os.path.isfile(os.path.join(target, v))]
    note = "none" if not real_missing else ", ".join(real_missing)
    record(9, not real_missing and not map_missing,
           f"media strings {len(media)}; prose notes without a file "
           f"{len(prose)} (allowed); real missing {len(real_missing)}: {note}; "
           f"new map and sentenceClips values {len(map_vals) + len(sent_vals)}, "
           f"missing {len(map_missing)}")

    # payload count and README check of AC13-13
    payload_ok = len(files) == EXPECTED_PAYLOAD[n]
    payload_cause = ""
    if not payload_ok:
        words_delta = clip_lines - EXPECTED_CLIPS[n]
        payload_cause = (f"; cause: {max(0, EXPECTED_PAYLOAD[n] - len(files))} "
                         f"file(s) short of the read-along clips of "
                         f"{CLIP_PENDING}, and the word clip net {words_delta:+d} "
                         f"of {P14_CAUSE}")
    readme_ok, readme_text_out = readme_checks(target)
    print(f"payload files without the MANIFEST and README: {len(files)} "
          f"(spec M11 expected {EXPECTED_PAYLOAD[n]}): "
          f"{'PASS' if payload_ok else 'FAIL'}{payload_cause}")
    print(f"README check of AC13-13: {'PASS' if readme_ok else 'FAIL'}; "
          f"{readme_text_out}")
    print(f"MANIFEST sha256: {msha}")
    passed = len([r for r in results if r[1]])
    result_ok = passed == 9 and payload_ok and readme_ok
    print(f"RESULT {'PASS' if result_ok else 'FAIL'} (9 checks on {folder}: "
          f"{passed} passed, {9 - passed} failed; the measured values and "
          f"their causes are on the lines above)")
    print()
    return dict(tag=tag, folder=folder, target=target, files=len(files),
                manifest_sha=msha, passed=passed, results=results,
                changed=len(expected), old_empty=old_empty,
                new_empty=new_empty, clips=clip_lines, b0=b0_lines,
                b1=b1_lines, other=other, prose=len(prose),
                payload_ok=payload_ok, readme_ok=readme_ok)


def main():
    print(f"source commit: {SRC}")
    print(f"output root: {OUT}")
    print()
    out = []
    for n in range(1, 8):
        out.append(check_folder(n))
    print("=== literal shell checks ===")
    for r in out:
        print(f"{r['folder']}: payload {r['files']}, changed {r['changed']}, "
              f"old-empty {r['old_empty']}, new-empty {r['new_empty']}, "
              f"clips {r['clips']}, b0 {r['b0']}, b1 {r['b1']}, "
              f"manifest {r['manifest_sha']}")
    print()
    print("=== changed paths: join -a1 -a2 of the previous and new MANIFEST "
          "lists ===")
    for r in out:
        expected = set()
        cur = manifest_rows(r["target"])
        rev, prev_rev = REVISION[int(r["tag"][1:])]
        prev = manifest_rows(os.path.join(
            HANDOFF, f"{r['tag']}-storytime-app-package-{prev_rev}"))
        for p in set(cur) | set(prev):
            if cur.get(p) != prev.get(p):
                expected.add(p)
        _, blocks = changed_section(r["target"])
        listed = set(b[0] for b in blocks)
        print(f"{r['folder']}: changed paths from the join: {len(expected)}; "
              f"listed: {len(listed)}; diff lines: {len(expected ^ listed)}")
    print()
    print("=== clip loop of spec M11 (python form) ===")
    loop_lines = 0
    for n in range(1, 8):
        name = f"w{n:02d}"
        rev, _ = REVISION[n]
        count = len([p for p in manifest_rows(os.path.join(
            OUT, f"{name}-storytime-app-package-{rev}")) if re.match(
            r"^l2/media/" + name + r"/words/wa-[a-z]*\.mp3$", p)])
        if count != EXPECTED_CLIPS[n]:
            print(f"{name}: clip count differs (measured {count}, expected "
                  f"{EXPECTED_CLIPS[n]}; cause: {P14_CAUSE})")
            loop_lines += 1
    print(f"clip loop lines: {loop_lines}")
    print()
    print("=== words and sentence files in the 7 folders ===")
    total_w = 0
    total_b0 = 0
    total_b1 = 0
    for n in range(1, 8):
        rev, _ = REVISION[n]
        name = f"w{n:02d}-storytime-app-package-{rev}"
        dw = os.path.join(OUT, name, f"l2/media/w{n:02d}/words")
        ds = os.path.join(OUT, name, f"l2/media/w{n:02d}/sentences")
        cw = len([f for f in os.listdir(dw)
                  if re.match(r"^wa-[a-z]*\.mp3$", f)]) if os.path.isdir(dw) else 0
        cs0 = len([f for f in os.listdir(ds)
                   if re.match(r"^b0-s\d\d\.mp3$", f)]) if os.path.isdir(ds) else 0
        cs1 = len([f for f in os.listdir(ds)
                   if re.match(r"^b1-s\d\d\.mp3$", f)]) if os.path.isdir(ds) else 0
        total_w += cw
        total_b0 += cs0
        total_b1 += cs1
        print(f"  {name}: words {cw}, read-along sentences {cs0}, "
              f"decodable sentences {cs1}")
    print(f"words files in folders: {total_w} (spec M11: 218)")
    print(f"read-along sentence files in folders: {total_b0} "
          f"(spec M11: 72; cause when short: {CLIP_PENDING})")
    print(f"decodable sentence files in folders: {total_b1} (spec M11: 56)")
    all_pass = all(r["passed"] == 9 and r["payload_ok"] and r["readme_ok"]
                   for r in out)
    print()
    print(f"RESULT {'PASS' if all_pass else 'FAIL'} (9 checks on 7 folders, "
          f"{sum(9 - r['passed'] for r in out)} failures; Step A expects "
          f"measured values with causes, not a pass)")
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
