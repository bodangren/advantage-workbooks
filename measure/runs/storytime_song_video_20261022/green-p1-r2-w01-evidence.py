#!/usr/bin/env python3
"""Write the week 1 same-toolchain evidence from measured frame hashes.

Exports the phase-base source, renders both compositions with the installed toolchain from the base source
and from the current source, hashes decoded raw rgb24 frames, and writes green-p1-w01-compare.txt.
Every hash and every exit code in the evidence comes from a command in this script.
"""
import hashlib
import os
import re
import shutil
import subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
CURRENT = os.path.join(REPO, "video/storytime-song")
BASE = "/tmp/opencode/w01-base"
OUT = "/tmp/opencode/w01-r2"
RUNS = os.path.join(REPO, "measure/runs/storytime_song_video_20261022")
BASELINE = os.path.join(RUNS, "red-p1-w01-frames.txt")
EVIDENCE = os.path.join(RUNS, "green-p1-w01-compare.txt")
PHASE_BASE = "1ffd649b"
PROPS = '{"week":"l2/w01","spec":null}'
CHROME = "/usr/bin/google-chrome"
ROWS = [
    ("content/storytime/l2/media/w01/song.mp4", "StorytimeSong", 1920, 1080),
    ("content/storytime/l2/media/w01/song-phone.mp4", "StorytimeSongPortrait", 720, 1280),
]
FRAMES = [753, 1652]


def command(args, cwd=None):
    return subprocess.run(args, cwd=cwd, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, text=True).returncode


def output(args, cwd=None):
    run = subprocess.run(args, cwd=cwd, stdout=subprocess.PIPE, check=True)
    return run.stdout


def raw_hash(png, scale=None):
    args = ["ffmpeg", "-v", "error", "-i", png]
    if scale:
        args += ["-vf", "scale=%d:%d" % scale]
    args += ["-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    return hashlib.sha256(output(args)).hexdigest()


def approved_frame(media, frame, png):
    filt = "select=eq(n\\,%d)" % frame
    command(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(REPO, media),
             "-vf", filt, "-vsync", "0", "-frames:v", "1", png])
    return raw_hash(png)


def psnr_of(left, right, scale=None):
    compare = right
    if scale:
        compare = right + ".cmp.png"
        command(["ffmpeg", "-v", "error", "-y", "-i", right,
                 "-vf", "scale=%d:%d" % scale, compare])
    run = subprocess.run(
        ["ffmpeg", "-i", left, "-i", compare, "-lavfi", "psnr", "-f", "null", "-"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    match = re.search(r"average:([0-9.]+)", run.stdout)
    if not match:
        raise RuntimeError("ffmpeg gave no PSNR for %s and %s" % (left, right))
    return float(match.group(1))


def still(project, composition, frame, path):
    return command(["npx", "remotion", "still", composition, path,
                    "--frame=%d" % frame, "--props=" + PROPS,
                    "--browser-executable=" + CHROME, "--log=error"], cwd=project)


def baseline_rows():
    rows = []
    for line in open(BASELINE, encoding="utf-8").read().strip().split("\n"):
        match = re.match(r"^(.*) frame (\d+) sha256: ([0-9a-f]{64})$", line)
        if not match:
            raise RuntimeError("bad baseline line: " + line)
        rows.append((match.group(1), int(match.group(2)), match.group(3)))
    return rows


def main():
    os.makedirs(OUT, exist_ok=True)
    shutil.rmtree(BASE, ignore_errors=True)
    os.makedirs(BASE, exist_ok=True)
    archive = output(["git", "archive", PHASE_BASE, "video/storytime-song"], cwd=REPO)
    unpack = subprocess.run(["tar", "-x", "-C", BASE], input=archive, check=True)
    del unpack
    base_project = os.path.join(BASE, "video/storytime-song")
    os.symlink(os.path.join(CURRENT, "node_modules"),
               os.path.join(base_project, "node_modules"))

    # render.mjs regenerates the gitignored spec before a render. Do it once and use the same spec in both trees.
    if command(["node", "-e",
                'import("./scripts/prepare.mjs").then((m) => m.prepare("l2/w01"))'],
               cwd=CURRENT):
        raise RuntimeError("prepare failed for l2/w01")
    shutil.copytree(os.path.join(CURRENT, "public/l2"),
                    os.path.join(base_project, "public/l2"))

    lines = [
        "Week 1 regression, same-toolchain evidence, Phase 1 Green r2",
        "Method: git archive of phase-base source %s, installed node_modules by symlink, and the current source."
        % PHASE_BASE,
        "Method: npx remotion still with the same props and flags in both trees. Frame hashes come from ffmpeg"
        " decoding of the PNG still to raw rgb24, sha256.",
        "Method: the phone same-toolchain pairs use the composition still before the 720x1280 scale."
        " The drift comparison scales that still to 720x1280 to match the approved phone video.",
        "Method: approved hashes come from ffmpeg decoding of the unchanged media files to raw rgb24, sha256.",
    ]

    exits = {}
    base_hashes = {}
    new_hashes = {}
    approved_hashes = {}
    psnrs = []
    for media, composition, width, height in ROWS:
        short = "classroom" if composition == "StorytimeSong" else "phone"
        exit_code = 0
        for frame in FRAMES:
            approved_png = os.path.join(OUT, "%s-approved-%d.png" % (short, frame))
            approved_hashes[(media, frame)] = approved_frame(media, frame, approved_png)

            base_png = os.path.join(OUT, "%s-base-%d.png" % (short, frame))
            new_png = os.path.join(OUT, "%s-new-%d.png" % (short, frame))
            exit_code |= still(base_project, composition, frame, base_png)
            exit_code |= still(CURRENT, composition, frame, new_png)
            base_hashes[(media, frame)] = raw_hash(base_png)
            new_hashes[(media, frame)] = raw_hash(new_png)
            psnrs.append(psnr_of(approved_png, new_png, scale=(width, height)))
        exits[short] = exit_code

    lines.append("render exit classroom: %d" % exits["classroom"])
    lines.append("render exit phone: %d" % exits["phone"])

    for media, frame, baseline_sha in baseline_rows():
        actual = approved_hashes[(media, frame)]
        if actual != baseline_sha:
            raise RuntimeError("approved hash moved for %s frame %d" % (media, frame))
        lines.append("%s frame %d approved sha256: %s" % (media, frame, actual))

    equal = []
    for media, _composition, _width, _height in ROWS:
        for frame in FRAMES:
            base = base_hashes[(media, frame)]
            new = new_hashes[(media, frame)]
            equal.append(base == new)
            lines.append("same-toolchain %s frame %d base sha256: %s" % (media, frame, base))
            lines.append("same-toolchain %s frame %d new sha256: %s" % (media, frame, new))

    drift = 0
    for media, _composition, width, height in ROWS:
        for frame in FRAMES:
            approved = approved_hashes[(media, frame)]
            current = raw_hash(os.path.join(
                OUT, "%s-new-%d.png" % ("classroom" if media.endswith("song.mp4") else "phone", frame)),
                scale=(width, height))
            if approved == current:
                drift += 1
    lines.append("toolchain drift approved vs current match count: %d of 4" % drift)
    lines.append("toolchain drift PSNR dB: %.3f" % (sum(psnrs) / len(psnrs)))
    lines.append("Result: %s" % ("PASS" if all(equal) else "FAIL"))

    with open(EVIDENCE, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print("same-toolchain pairs equal: %d of %d" % (sum(equal), len(equal)))
    print("drift matches: %d of 4" % drift)
    print("wrote", EVIDENCE)
    return 0 if all(equal) else 1


if __name__ == "__main__":
    raise SystemExit(main())
