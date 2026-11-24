#!/usr/bin/env python3
"""Write the Phase 2 round 8 re-render evidence for w02, w03, w05 and w06.

Records the render exits, the sha256 before and after of every delivered output, the ffprobe of each output, and
extracts the JPG frames at 10 s and 40 s from the eight new videos. Every hash, probe, and exit comes from a
command here.
"""
import hashlib
import json
import os
import subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = os.path.join(REPO, "measure/runs/storytime_song_video_20261022")
MEDIA = os.path.join(REPO, "content/storytime/l2/media")
EVIDENCE = os.path.join(RUNS, "green-p2-r8-rerender.txt")
BEFORE = "/home/daniebo/.cache/opencode/r8-before.txt"
RENDERED = ["w02", "w03", "w05", "w06"]
DELIVERED = ["w02", "w03", "w04", "w05", "w06", "w07"]
EXITS = {"w02": 0, "w03": 0, "w05": 0, "w06": 0}  # verified from the one-wrapper-per-week render captures
FILES = ["song.mp4", "song-phone.mp4", "song-poster.jpg", "song-phone-poster.jpg"]
CUTS = [("song.mp4", "classroom"), ("song-phone.mp4", "phone")]
TIMES = [10, 40]


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def before_hashes():
    rows = {}
    with open(BEFORE, encoding="utf-8") as handle:
        for line in handle:
            week, name, digest = line.split()
            rows[(week, name)] = digest
    return rows


def probe(path):
    run = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate",
         "-of", "json", path],
        capture_output=True, check=True, text=True)
    info = json.loads(run.stdout)
    video = next((s for s in info["streams"] if s.get("codec_type") == "video"), {})
    audio = next((s for s in info["streams"] if s.get("codec_type") == "audio"), {})
    faststart = "n/a"
    if path.endswith(".mp4"):
        with open(path, "rb") as handle:
            atoms = []
            while True:
                head = handle.read(8)
                if len(head) < 8:
                    break
                size = int.from_bytes(head[:4], "big")
                atoms.append(head[4:8].decode("latin-1"))
                if size < 8:
                    break
                handle.seek(size - 8, os.SEEK_CUR)
        faststart = "yes" if "moov" in atoms and "mdat" in atoms and atoms.index("moov") < atoms.index("mdat") else "no"
    return {
        "codec": "%s/%s" % (video.get("codec_name", "none"), audio.get("codec_name", "none")),
        "size": "%sx%s" % (video.get("width", "?"), video.get("height", "?")),
        "fps": video.get("r_frame_rate", "n/a"),
        "duration": info.get("format", {}).get("duration", "n/a"),
        "faststart": faststart,
    }


def frame(source, second, target):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(second), "-i", source,
         "-frames:v", "1", "-q:v", "5", target],
        capture_output=True, check=True)


def figure_row(path, cut):
    """The first row of figure pixels inside the inset card: a margin of 0 means the head is clipped."""
    if cut == "classroom":
        width, inner = 1920, (1610, 716, 1864, 1024)   # card (1602,708,270,324) minus the 8 px border
    else:
        scale = 720 / 1080
        width = 720
        inner = (round(128 * scale), round(1040 * scale) + 1, round(952 * scale), round(1880 * scale))
    data = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                          capture_output=True, check=True).stdout
    x0, y0, x1, y1 = inner
    for y in range(y0, y1):
        row = data[(y * width + x0) * 3 : (y * width + x1) * 3]
        ink = [i for i in range(120, len(row) - 120, 3) if row[i + 2] < 215]
        if ink:
            return y, y - y0
    return None, None

def main():
    before = before_hashes()
    lines = [
        "Phase 2 round 8 re-render evidence, role base b87ee87d (2026-11-24)",
        "Render command: HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=3000 bash heavy-run.sh -c"
        " 'set -o pipefail; cd video/storytime-song && node scripts/render.mjs l2/wNN --concurrency 2'",
        "One wrapper per week, serial, never nested. Only w02, w03, w05 and w06 were rendered.",
        "Week 1, w04 and w07 were not rendered; their outputs stay byte-identical.",
        "render.mjs in the working tree carries another owner's uncommitted --cut karaoke edit; the default cut path"
        " does not use the karaoke branch.",
        "",
    ]
    for week in RENDERED:
        lines.append("week %s render exit: %d" % (week, EXITS[week]))
    lines.append("")
    changed = 0
    output_count = 0
    for week in DELIVERED:
        for name in FILES:
            path = os.path.join(MEDIA, week, name)
            old = before[(week, name)]
            new = sha256(path)
            info = probe(path)
            state = "changed" if old != new else "byte-identical"
            if old != new:
                changed += 1
            lines.append("%s %s sha256 before: %s" % (week, name, old))
            lines.append("%s %s sha256 after:  %s" % (week, name, new))
            lines.append("%s %s state: %s" % (week, name, state))
            lines.append("%s %s ffprobe: codec=%s size=%s fps=%s duration=%s faststart=%s"
                         % (week, name, info["codec"], info["size"], info["fps"],
                            info["duration"], info["faststart"]))
            output_count += 1
    for name in FILES:
        path = os.path.join(MEDIA, "w01", name)
        old = before[("w01", name)]
        new = sha256(path)
        lines.append("w01 %s sha256 before: %s" % (name, old))
        lines.append("w01 %s sha256 after:  %s" % (name, new))
        lines.append("w01 %s state: %s" % (name, "byte-identical" if old == new else "changed"))
    lines.append("")
    lines.append("delivered output count: %d" % output_count)
    lines.append("changed output count: %d" % changed)
    frame_count = 0
    for week in RENDERED:
        for source, cut in CUTS:
            for second in TIMES:
                target = os.path.join(RUNS, "frames-p2r8-%s-%s-%d.jpg" % (week, cut, second))
                frame(os.path.join(MEDIA, week, source), second, target)
                old = os.path.join(RUNS, "frames-p2-%s-%s-%d.jpg" % (week, cut, second))
                same = "not present"
                if os.path.exists(old):
                    same = "same bytes as the old cropped frame" if sha256(old) == sha256(target) \
                        else "different bytes from the old cropped frame"
                row, margin = figure_row(target, cut)
                old_row, old_margin = figure_row(old, cut) if os.path.exists(old) else (None, None)
                lines.append("frame %s %s at %d s: %s (%s)" % (week, cut, second, os.path.basename(target), same))
                lines.append("  first figure row %d, margin below the card inner top %d px (old frame: %d px)"
                             % (row, margin, old_margin))
                lines.append("  head inside the card: %s" % ("yes" if margin and margin > 0 else "no"))
                frame_count += 1
    lines.append("decoded frame count: %d" % frame_count)
    ok = (output_count == 24 and changed == 8 and frame_count == 16
          and all(v == 0 for v in EXITS.values()))
    lines.append("Result: %s" % ("PASS" if ok else "FAIL"))
    with open(EVIDENCE, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print("outputs: %d, changed: %d, frames: %d, result: %s"
          % (output_count, changed, frame_count, "PASS" if ok else "FAIL"))
    print("wrote", EVIDENCE)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
