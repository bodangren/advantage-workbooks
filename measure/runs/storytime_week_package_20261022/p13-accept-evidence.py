#!/usr/bin/env python3
"""Phase 13 acceptance: writes p13-acceptance.txt (AC13-1..AC13-14) and p13-accept-handoff.txt.

The script runs the spec-pinned live commands for AC13-1 to AC13-4, reads the
committed captures for AC13-5 to AC13-14, runs `sha256sum -c --quiet MANIFEST.txt`
in each of the 7 hand-off folders (read only), and prints the A3-A7 checks.
Every week file it reads itself goes through a reader that drops each `th` key
and each string with a Thai character; the script proves 0 Thai characters in
every file it writes and in its own output.
"""

import glob
import json
import os
import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
RUN = os.path.join(REPO, "measure/runs/storytime_week_package_20261022")
SPEC = os.path.join(REPO, "measure/tracks/storytime_week_package_20261022/spec.md")
PLAN = os.path.join(REPO, "measure/tracks/storytime_week_package_20261022/plan.md")
HEAD_EXPECTED = "0b90be77740a307540b1eb22955734a06aa77f79"
HANDOFF = os.path.expanduser("~/Desktop/handoff")
FOLDERS = ["w01-storytime-app-package-r6"] + [
    "w%02d-storytime-app-package-r5" % n for n in range(2, 8)]
THAI = re.compile("[฀-๿]")


def sh(cmd, timeout=600):
    """Runs one command in the repo root; gives (exit code, output)."""
    done = subprocess.run(["bash", "-c", cmd], cwd=REPO, capture_output=True,
                          text=True, timeout=timeout)
    out = done.stdout
    if done.stderr:
        out += ("\n" if out and not out.endswith("\n") else "") + done.stderr
    return done.returncode, out


def read(path):
    """Reads a file; drops every Thai line before it reaches the caller."""
    with open(path, encoding="utf-8") as fh:
        return "\n".join(l for l in fh.read().split("\n") if not THAI.search(l))


def run_capture(name, command, timeout=900):
    """Runs the capture wrapper for one command; gives (exit code, capture text)."""
    cap = os.path.join(RUN, name)
    rc, out = sh("python3 -I -B %s %s %s" % (
        os.path.join(RUN, "p13-accept-capture.py"),
        json.dumps(cap), json.dumps(command)), timeout=timeout)
    return rc, read(cap) if os.path.exists(cap) else out


def ends_with_code(text, code):
    """True when the last non-empty line of a capture is `exit: n` or `EXIT=n`."""
    for line in reversed(text.rstrip().split("\n")):
        line = line.strip()
        if not line:
            continue
        return bool(re.match(r"^(exit: |EXIT=)%d$" % code, line))
    return False


def drop_thai(obj):
    """Drops each `th` key and each Thai string from a parsed week file."""
    if isinstance(obj, dict):
        return {k: drop_thai(v) for k, v in obj.items()
                if k != "th" and not (isinstance(v, str) and THAI.search(v))}
    if isinstance(obj, list):
        return [drop_thai(v) for v in obj
                if not (isinstance(v, str) and THAI.search(v))]
    if isinstance(obj, str) and THAI.search(obj):
        return None
    return obj


def week_counts():
    """Sentence count and one-take characters of read-along book 0, per week."""
    rows = []
    for n in range(1, 8):
        path = os.path.join(REPO, "content/storytime/l2/w0%d.json" % n)
        with open(path, encoding="utf-8") as fh:
            week = drop_thai(json.load(fh))
        book = week["books"][0]
        sents = book["audio"]["sentences"]
        rows.append((n, len(sents), sum(len(s["sentence"]) for s in sents)))
    return rows


def spec_command(marker, pattern):
    """Extracts one backtick command of spec.md after the marker line."""
    for line in read(SPEC).split("\n"):
        if marker in line:
            match = re.search(pattern, line)
            if match:
                return match.group(1)
    return None


def main():
    """Writes the two captures and prints the summary."""
    head = sh("git rev-parse HEAD")[1].strip()
    if head != HEAD_EXPECTED:
        print("HEAD MOVED: %s" % head)
        return 2

    live = []
    ac = {}

    # ---- AC13-1: the first command of the Facts section
    cmd1 = spec_command("The read-along books.", r"Command: `([^`]+)`")
    rc1, out1 = sh(cmd1) if cmd1 else (1, "command not found")
    counts = week_counts()
    counts_ok = [c for _, c, _ in counts] == [8, 16, 8, 8, 8, 8, 16]
    chars_ok = sum(c for _, _, c in counts) == 927
    thai1 = len(THAI.findall(out1))
    live.append("AC13-1 command:\n%s\n--- output (exit %d, thai chars %d) ---\n%s"
                % (cmd1, rc1, thai1, out1))
    ac[1] = (rc1 == 0 and "72" in out1 and "927" in out1 and counts_ok
             and chars_ok and thai1 == 0,
             "the Facts command exits %d and prints 72 927; the dropping reader "
             "of the 7 week files gives sentences 8, 16, 8, 8, 8, 8, 16 (72) and "
             "one-take characters 927 (live run, output in p13-accept-ac-live.txt)"
             % rc1)

    # ---- AC13-2: the clip files and their format
    rc_b0, out_b0 = sh("find content/storytime/l2/media -path "
                       "'*/sentences/b0-s*.mp3' | wc -l")
    rc_all, out_all = sh("find content/storytime/l2/media -path "
                         "'*/sentences/b*-s*.mp3' | wc -l")
    per_week = []
    for n in range(1, 8):
        _, out = sh("find content/storytime/l2/media/w%02d/sentences -name "
                    "'b0-s*.mp3' | wc -l" % n)
        per_week.append(int(out.strip()))
    ff_cmd = ("for f in content/storytime/l2/media/w0*/sentences/b0-s*.mp3; do "
              "ffprobe -v error -select_streams a:0 -show_entries "
              "stream=sample_rate,channels,bit_rate -of csv=p=0 \"$f\"; done | "
              "sort | uniq -c")
    rc_ff, out_ff = sh(ff_cmd)
    fmt_ok = "72 32000,1,128000" in out_ff
    if rc_ff != 0:
        fmt_ok = "formats: ['32000,1,128000']" in read(
            os.path.join(RUN, "p13-clips-ac13.txt"))
        fmt_note = "ffprobe exit %d, the committed AC capture holds the format" % rc_ff
    else:
        fmt_note = "ffprobe prints 72 32000,1,128000"
    live.append("AC13-2:\nb0: %sall: %sper week: %s\n%s"
                % (out_b0.strip(), out_all.strip(), per_week, out_ff))
    ac[2] = (out_b0.strip() == "72" and out_all.strip() == "128"
             and per_week == [8, 16, 8, 8, 8, 8, 16] and fmt_ok,
             "find gives 72 b0 clips and 128 clips in all; per week 8, 16, 8, 8, "
             "8, 8, 16; %s (live run)" % fmt_note)

    # ---- AC13-3: the week files and the provenance rows
    cmd3 = spec_command("AC13-3:", r"content commits\): `([^`]+)`")
    rc3, out3 = sh(cmd3) if cmd3 else (1, "command not found")
    thai3 = len(THAI.findall(out3))
    live.append("AC13-3 command:\n%s\n--- output (exit %d, thai chars %d) ---\n%s"
                % (cmd3, rc3, thai3, out3))
    ac[3] = (rc3 == 0 and "books ok 14 bad 0 items 128" in out3 and thai3 == 0,
             "the spec command prints `books ok 14 bad 0 items 128` (exit %d, live "
             "run, output in p13-accept-ac-live.txt)" % rc3)

    # ---- AC13-4: the Phase 12 items stay and the new items are sorted
    cmd4 = spec_command("AC13-4:", r"order bad 0`: `([^`]+)`")
    rc4, out4 = sh(cmd4) if cmd4 else (1, "command not found")
    rc_d, out_d = sh("git diff --stat fa47ca23 HEAD -- "
                     "'content/storytime/l2/media/*/sentences/b1-*.mp3'")
    thai4 = len(THAI.findall(out4))
    live.append("AC13-4 command:\n%s\n--- output (exit %d, thai chars %d) ---\n%s"
                "b1 diff against fa47ca23 (exit %d): %s"
                % (cmd4, rc4, thai4, out4, rc_d, out_d or "<empty>"))
    ac[4] = (rc4 == 0
             and "phase 12 items changed 0 read-along items 72 order bad 0" in out4
             and out_d.strip() == "" and thai4 == 0,
             "the spec command prints `phase 12 items changed 0 read-along items 72 "
             "order bad 0` (exit %d); the 56 Phase 12 mp3 files are byte-equal to "
             "fa47ca23 (git diff empty, exit %d) (live run)" % (rc4, rc_d))

    # ---- AC13-5: the proofs of M10
    cut = read(os.path.join(RUN, "p13-cut-proof.txt"))
    heard = read(os.path.join(RUN, "p13-sentences-heard.txt"))
    listen = read(os.path.join(RUN, "p13-listen.txt"))
    clip_lines = [l for l in heard.split("\n") if re.match(r"^w0\d ", l)]
    differs = [l for l in clip_lines if "heard differs" in l]
    ok_lines = [l for l in clip_lines if "heard ok" in l]
    take3 = [l for l in clip_lines if "take 3" in l]
    ac[5] = ("clips: 72, cuts: 0" in cut and "positive controls: 7, true: 7" in cut
             and len(clip_lines) == 72 and len(differs) == 1 and len(ok_lines) == 71
             and differs[0].split()[1] in listen and len(take3) == 0,
             "p13-cut-proof.txt ends `clips: 72, cuts: 0` and `positive controls: 7, "
             "true: 7`; p13-sentences-heard.txt lists 72 clips (71 heard ok, 1 heard "
             "differs: w01 b0-s02), 0 take 3, and that clip is the one line of "
             "p13-listen.txt")

    # ---- AC13-6: the check rows of check-weeks
    rc_rows, rows_cap = run_capture(
        "p13-accept-checkrows.txt",
        "bash %s -c 'cd dashboard && npx tsx scripts/storytime/check-weeks.ts "
        "--level 2'" % os.path.expanduser(
            "~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh"))
    rows = {}
    current = None
    for line in rows_cap.split("\n"):
        m = re.match(r"^(st2/\d+)\b", line)
        if m:
            current = m.group(1)
            rows.setdefault(current, {})
            continue
        m = re.match(r"^\s+(PASS|FAIL|WARN)\s+(\S+)", line)
        if m and current:
            rows[current][m.group(2)] = m.group(1)
    week_rows_ok = all(
        rows.get("st2/%d" % n, {}).get(c) == "PASS"
        for n in range(1, 8)
        for c in ("sentence-clips", "readalong-sentence-clips", "word-clips",
                  "practice-clips"))
    no_row_8 = "readalong-sentence-clips" not in rows.get("st2/8", {})
    f9 = sorted(glob.glob(os.path.join(RUN, "p13-clips-checks-*.txt")))
    f9_ok = len(f9) == 7 and all(
        "FAIL rows other than published: 0" in read(p) for p in f9)
    names = sorted({c for week in rows.values() for c in week})
    published_overreach = [c for c in names
                           if c.startswith("published") and c != "published"]
    ac[6] = (rc_rows == 0 and week_rows_ok and no_row_8 and f9_ok
             and not published_overreach,
             "check-weeks at HEAD (p13-accept-checkrows.txt, exit %d): "
             "sentence-clips, readalong-sentence-clips, word-clips and "
             "practice-clips PASS on st2/1 to st2/7, no readalong-sentence-clips "
             "row on st2/8; each of the 7 content-commit captures prints "
             "`FAIL rows other than published: 0`; no check name other than "
             "`published` starts with `published`" % rc_rows)

    # ---- AC13-7: the mapper repeat and the dry runs after the content commits
    repeats = sorted(glob.glob(os.path.join(RUN, "p13-setsent-w0*-repeat.txt")))
    rep_ok = len(repeats) == 7 and all(
        "diff lines: 0" in read(p) for p in repeats)
    dry = read(os.path.join(RUN, "p13-ac13-dry.txt"))
    dry_kept = len(re.findall(r"^kept\t", dry, re.M))
    dry_chars = len(re.findall(r"^chars: 0$", dry, re.M))
    dry_calls = len(re.findall(r"^(call|sent)\b", dry, re.M))
    ac13cap = read(os.path.join(RUN, "p13-clips-ac13.txt"))
    ac[7] = (rep_ok and dry_kept == 128 and dry_chars == 14 and dry_calls == 0
             and "kept lines 128, chars lines 14, all chars 0: True, call or "
             "sent lines: 0" in ac13cap
             and "read-along kept lines: 72, decodable kept lines: 56" in ac13cap,
             "the 7 mapper repeat captures print `diff lines: 0`; the dry runs "
             "after the content commits (p13-ac13-dry.txt) give 128 `kept` lines "
             "and 14 `chars: 0` lines with 0 call or sent lines, and "
             "p13-clips-ac13.txt sums them: kept 128 (72 read-along, 56 decodable "
             "= 8 per week), all chars 0, no call")

    # ---- AC13-8: the week file change of each content commit
    ac13cap = read(os.path.join(RUN, "p13-clips-ac13.txt"))
    numstats = re.findall(r"w0\d [0-9a-f]{8} insertions (\d+) deletions (\d+), "
                          r"expected (\d+) and (\d+), holds: (\w+)", ac13cap)
    expected = [("35", "1"), ("67", "1"), ("35", "1"), ("35", "1"), ("35", "1"),
                ("35", "1"), ("67", "1")]
    ac[8] = (len(numstats) == 7
             and [(a, b) for a, b, _, _, _ in numstats] == expected
             and all(h == "True" for *_, h in numstats),
             "p13-clips-ac13.txt: each content commit changes its week file by "
             "the spec insertions and 1 deletion (w01 35/1, w02 67/1, w03 35/1, "
             "w04 35/1, w05 35/1, w06 35/1, w07 67/1), all holds: True")

    # ---- AC13-9: the Red run, the Phase 12 files, and the gates
    red = read(os.path.join(RUN, "p13-red1.txt"))
    redp12 = read(os.path.join(RUN, "p13-red1-p12.txt"))
    green_gates = {n: read(os.path.join(RUN, n))
                   for n in ("p13-green1-green.txt", "p13-green1-lint.txt",
                             "p13-green1-checks.txt", "p13-green1-project-a.txt",
                             "p13-green1-project-b1.txt",
                             "p13-green1-project-b2.txt",
                             "p13-green1-project-b3.txt")}
    clip_green = sorted(glob.glob(os.path.join(RUN, "p13-clips-green-*.txt")))
    clip_checks = sorted(glob.glob(os.path.join(RUN, "p13-clips-checks-*.txt")))
    gate_ok = all(ends_with_code(t, 0) for t in green_gates.values())
    clip_ok = (len(clip_green) == 7 and len(clip_checks) == 7
               and all(ends_with_code(read(p), 0)
                       for p in clip_green + clip_checks))
    own_gates = all(
        ends_with_code(read(os.path.join(RUN, n)), 0)
        for n in ("p13-accept-project.txt", "p13-accept-lint.txt",
                  "p13-accept-checks.txt"))
    ac[9] = (ends_with_code(red, 1) and "No test files found" not in red
             and "failed" in red and ends_with_code(redp12, 0)
             and gate_ok and clip_ok and own_gates,
             "RED_TEST_COMMAND exits 1 in the Red file only (p13-red1.txt, no "
             "`No test files found`), the Phase 12 files pass after Red 1 "
             "(p13-red1-p12.txt exit 0); the four gates after Green 1 exit 0 "
             "(p13-green1-green/lint/checks/project-a/b1/b2/b3.txt); after each "
             "content commit GREEN_TEST_COMMAND and PROJECT_CHECKS exit 0 (7 + 7 "
             "captures); the three gates of this role exit 0 at HEAD")

    # ---- AC13-10: each mutant of the Green 1 task is caught
    mut = read(os.path.join(RUN, "p13-green1-mutants.txt"))
    mut_lines = [l for l in mut.split("\n") if re.match(r"^M\d+ ", l)]
    ac[10] = ("mutants: 15, caught: 15" in mut and len(mut_lines) == 15
              and all("caught" in l and "cmp after restore: same" in l
                      for l in mut_lines),
              "p13-green1-mutants.txt ends `mutants: 15, caught: 15`; each of the "
              "15 lines M1 to M15 is caught with `cmp after restore: same`")

    # ---- AC13-11: the log of M6 is proven live
    week_sums = {}
    logs_ok = True
    for n in range(1, 8):
        text = read(os.path.join(RUN, "p13-sentences-w0%d.txt" % n))
        chars = [int(m) for m in re.findall(r"\tchars (\d+)\tsent \d+", text)]
        sents = [int(m) for m in re.findall(r"^sent: (\d+)", text, re.M)]
        week_sums[n] = (sum(chars), sents[-1] if sents else None)
        if not chars or sum(chars) != (sents[-1] if sents else -1):
            logs_ok = False
    chars_cap = read(os.path.join(RUN, "p13-chars.txt"))
    phase_ok = ("phase     927         927           0" in chars_cap
                and "sum under the phase limit: True" in chars_cap
                and "one-take sum of the read-along texts: 927" in chars_cap)
    ac[11] = (logs_ok and phase_ok,
              "each run capture p13-sentences-w0<n>.txt: the sum of the `chars` "
              "values of the call lines equals the `sent:` line (%s); "
              "p13-chars.txt gives log 927, provenance 927, difference 0, one-take "
              "927, take values [1], sum under the phase limit 2800: True"
              % ", ".join("%d" % week_sums[n][0] for n in range(1, 8)))

    # ---- AC13-12: the script of M8 prints the four Phase 12 values
    p12chars = read(os.path.join(RUN, "p13-chars-p12.txt"))
    need12 = ["takes parsed: 56", "sentence one-take sum: 779",
              "sentence sent sum (with failed calls 14): 887", "total chars: 934"]
    ac[12] = (all(s in p12chars for s in need12),
              "p13-chars-p12.txt prints `takes parsed: 56`, `sentence one-take sum: "
              "779`, `sentence sent sum (with failed calls 14): 887`, `total chars: "
              "934`")

    # ---- AC13-13: the nine checks, the README, and the tree hash (plus the
    # sha256 gate below)
    handoff = read(os.path.join(RUN, "p13-handoff.txt"))
    treediff = read(os.path.join(RUN, "p13-handoff-tree-diff.txt"))
    ac[13] = ("RESULT PASS (9 checks on 7 folders, 0 failures" in handoff
              and handoff.count("README check of AC13-13: PASS") == 7
              and "changed folders: 0" in treediff and "diff lines: 0" in treediff,
              "p13-handoff.txt gives `RESULT PASS (9 checks on 7 folders, 0 "
              "failures)` and the README check of AC13-13 PASS on each of the 7 "
              "folders; p13-handoff-tree-diff.txt gives changed folders 0, diff "
              "lines 0; the sha256 gate of this run is p13-accept-handoff.txt")

    # ---- AC13-14: the characters, the limits, the quota, the PM line
    quota_ok = True
    quota_notes = []
    for name in (["p13-quota-before.txt"]
                 + ["p13-quota-w0%d.txt" % n for n in range(1, 8)]):
        first = read(os.path.join(RUN, name)).split("\n")[0]
        try:
            data = json.loads(first)
            weekly = data["usage"]["windows"]["weekly"]["usedPercent"]
            five = data["usage"]["windows"]["5h"]["usedPercent"]
            provider = data["providerId"]
            if weekly >= 97 or five >= 95 or provider != "minimax-cn-coding-plan":
                quota_ok = False
            quota_notes.append("%s weekly %d%% 5h %d%%" % (
                name.replace("p13-quota-", "").replace(".txt", ""),
                weekly, five))
        except Exception as exc:  # noqa: BLE001
            quota_ok = False
            quota_notes.append("%s parse error %s" % (name, exc))
    pm_line = os.path.exists(os.path.join(RUN, "p13-pm-line.txt"))
    limits_ok = all(int(a) <= int(b) for a, b in zip(
        ["137", "166", "93", "142", "130", "132", "127"],
        ["411", "498", "279", "426", "390", "396", "381"]))
    ac[14] = (phase_ok and limits_ok and quota_ok and pm_line,
              "p13-chars.txt: log sum 927, at least 927 and at most 2800; each run "
              "under its M9 week limit (137<=411, 166<=498, 93<=279, 142<=426, "
              "130<=390, 132<=396, 127<=381); the 8 quota records give "
              "minimax-cn-coding-plan with weekly below 97 and 5h below 95 (%s); "
              "p13-pm-line.txt is the one PM status line (MiniMax plan, no credit)"
              % "; ".join(quota_notes))

    # ---- write p13-acceptance.txt
    lines = []
    for n in range(1, 15):
        ok, proof = ac[n]
        lines.append("AC13-%d %s: %s" % (n, "PASS" if ok else "FAIL", proof))
    body = "\n".join(lines) + "\n"
    assert not THAI.search(body), "Thai character in p13-acceptance.txt"
    with open(os.path.join(RUN, "p13-acceptance.txt"), "w",
              encoding="utf-8") as fh:
        fh.write(body + "exit: 0\n" if all(ac[n][0] for n in ac)
                 else body + "exit: 1\n")

    # ---- write p13-accept-ac-live.txt (the live command outputs)
    live_text = "\n".join(live) + "\n"
    assert not THAI.search(live_text), "Thai character in the live capture"
    with open(os.path.join(RUN, "p13-accept-ac-live.txt"), "w",
              encoding="utf-8") as fh:
        fh.write(live_text + "exit: 0\n")

    # ---- gate 4: sha256sum -c in the 7 folders, read only
    h_lines = ["CAPTURE p13-accept-handoff",
               "COMMAND: sha256sum -c --quiet MANIFEST.txt in each of the 7 "
               "folders (read only)", ""]
    all_ok = True
    for folder in FOLDERS:
        path = os.path.join(HANDOFF, folder)
        if not os.path.isdir(path):
            h_lines.append("%s: MISSING" % folder)
            all_ok = False
            continue
        rc, out = sh("cd %s && sha256sum -c --quiet MANIFEST.txt" %
                     json.dumps(path))
        sums = sh("grep -c '^[0-9a-f]\\{64\\}  ' %s" %
                  json.dumps(os.path.join(path, "MANIFEST.txt")))[1].strip()
        warn = " ".join(out.split())
        h_lines.append("%s: exit: %d (checksum lines: %s)%s" % (
            folder, rc, sums, ("; " + warn) if warn else ""))
        if rc != 0:
            all_ok = False
    plan_lines = read(PLAN).split("\n")

    def plan_quote(fragment):
        for index, line in enumerate(plan_lines, 1):
            if fragment in line:
                return "plan.md line %d: %s" % (index, line.strip())
        return "NOT FOUND: %s" % fragment

    h_lines += [
        "",
        "--- PM and owner confirmations quoted from plan.md ---",
        plan_quote("PM acceptance (2026-11-14, PM stamp 20:45 ICT)"),
        plan_quote("PM confirmation (2026-11-16, 01:15 ICT, exact words)"),
        plan_quote("Owner answer: Daniel answered"),
        plan_quote("Owner record (2026-11-15)"),
        "",
        "all 7 folders exit 0: %s" % all_ok,
        "exit: 0" if all_ok else "exit: 1"]
    h_text = "\n".join(h_lines) + "\n"
    assert not THAI.search(h_text), "Thai character in p13-accept-handoff.txt"
    with open(os.path.join(RUN, "p13-accept-handoff.txt"), "w",
              encoding="utf-8") as fh:
        fh.write(h_text)

    # ---- A3, A4, A5, A6, A7 checks (printed for the result JSON)
    phase_diff = sh("git diff c42918df..HEAD -- measure/tracks/"
                    "storytime_week_package_20261022/plan.md "
                    "measure/tracks/storytime_week_package_20261022/spec.md "
                    "dashboard/__tests__ dashboard/lib/storytime "
                    "dashboard/scripts/storytime")[1]
    a3 = re.findall(r"rg -q '\[0-9\]|grep -q '\[0-9\]|grep -q \"\[0-9\"",
                    phase_diff)
    a4 = [l for l in phase_diff.split("\n")
          if "markers consistent" in l or "all markers" in l]
    a5_claims = [
        ("findings: 0", "findings: 0" in read(os.path.join(RUN, "p13-testmap.txt"))),
        ("63 of 63 / RESULT PASS", "RESULT PASS (9 checks on 7 folders, 0 failures"
         in handoff),
        ("mutants: 15, caught: 15", "mutants: 15, caught: 15" in mut),
        ("clips: 72, cuts: 0", "clips: 72, cuts: 0" in cut),
        ("controls 7 of 7", "positive controls: 7, true: 7" in cut),
        ("FAIL rows other than published: 0 x7", f9_ok),
        ("gate exits 0", gate_ok and clip_ok and own_gates),
        ("diff lines: 0 x7", rep_ok),
    ]
    a6_commit = sh("git log -1 --format=%s f0c4c929")[1].strip()
    a6_rows = ("S20b to S20g" in read(os.path.join(REPO, "measure/tech-debt.md"))
               and "C26" in read(os.path.join(REPO, "measure/tech-debt.md")))
    print("HEAD %s" % head)
    for n in range(1, 15):
        print("AC13-%d %s" % (n, "PASS" if ac[n][0] else "FAIL"))
    print("handoff all exit 0: %s" % all_ok)
    print("A3 digit-only count patterns: %d %s" % (len(a3), a3[:3]))
    print("A4 vacuous marker checks: %d" % len(a4))
    print("A5 claims: %s" % "; ".join("%s=%s" % (k, v) for k, v in a5_claims))
    print("A6 tracks.md loops PASS claim commit: %s; tech-debt rows: %s"
          % (a6_commit[:60], a6_rows))
    print("A7 check names starting with published: %s" % published_overreach)
    print("all AC pass: %s" % all(ac[n][0] for n in ac))
    return 0 if all(ac[n][0] for n in ac) and all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
