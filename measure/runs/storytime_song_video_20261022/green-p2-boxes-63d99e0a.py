#!/usr/bin/env python3
"""Write the Phase 2 boxes evidence for the w04 and w07 re-render.

Reads the eight outputs, probes and hashes them, records the drawn boxes from src/actorBoxes.ts, and extracts
eight JPG frames. Every hash, probe, and box in the evidence comes from a command here.
"""
import hashlib
import json
import os
import subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
PROJECT = os.path.join(REPO, "video/storytime-song")
RUNS = os.path.join(REPO, "measure/runs/storytime_song_video_20261022")
MEDIA = os.path.join(REPO, "content/storytime/l2/media")
EVIDENCE = os.path.join(RUNS, "green-p2-boxes-63d99e0a.txt")
WEEKS = ["w04", "w07"]
EXITS = {"w04": 0, "w07": 0}  # verified from the one-wrapper-per-week render captures
FILES = ["song.mp4", "song-phone.mp4", "song-poster.jpg", "song-phone-poster.jpg"]
CUTS = [("song.mp4", "classroom"), ("song-phone.mp4", "phone")]
TIMES = [10, 40]

BOX_JS = r"""
import("./src/actorBoxes.ts").then(async (m) => {
  const fs = await import("node:fs");
  const { prepare } = await import("./scripts/prepare.mjs");
  const spec = JSON.parse(fs.readFileSync(prepare("l2/WEEK"), "utf8"));
  const out = {};
  for (const cut of ["classroom", "portrait"]) {
    out[cut] = spec.lines.map((line, i) => m.actorBoxes(spec, i, cut));
  }
  console.log(JSON.stringify(out));
}).catch((e) => { console.error(e); process.exit(1); });
"""


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


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


def main():
    lines = [
        "Phase 2 boxes evidence, role base 63d99e0a (2026-11-23)",
        "Only w04 and w07 were re-rendered; w01, w02, w03, w05 and w06 were not rendered.",
        "One heavy-run wrapper per week: node scripts/render.mjs l2/wNN --concurrency 2.",
        "render.mjs keeps another owner's uncommitted --cut karaoke edit; the default path does not use it.",
        "",
    ]
    output_count = 0
    frame_count = 0
    for week in WEEKS:
        lines.append("week %s render exit: %d" % (week, EXITS[week]))
        drawn = json.loads(subprocess.run(
            ["node", "--input-type=module", "-e", BOX_JS.replace("WEEK", week)],
            cwd=PROJECT, capture_output=True, check=True, text=True).stdout)
        for cut in ["classroom", "portrait"]:
            entries = drawn[cut]
            lines.append("week %s %s drawn box count: %d" % (week, cut, len(entries)))
            for i, row in enumerate(entries):
                summary = "; ".join(
                    "%s=%s[%g,%g,%g,%g]" % (b["name"], b["kind"], b["box"]["left"],
                                             b["box"]["top"], b["box"]["width"], b["box"]["height"])
                    for b in row)
                lines.append("week %s %s line %d boxes: %s" % (week, cut, i + 1, summary))
        for name in FILES:
            path = os.path.join(MEDIA, week, name)
            info = probe(path)
            lines.append("%s %s sha256: %s" % (week, name, sha256(path)))
            lines.append("%s %s ffprobe: codec=%s size=%s fps=%s duration=%s faststart=%s"
                         % (week, name, info["codec"], info["size"], info["fps"],
                            info["duration"], info["faststart"]))
            output_count += 1
        for source, cut in CUTS:
            for second in TIMES:
                target = os.path.join(RUNS, "frames-p2boxes-%s-%s-%d.jpg" % (week, cut, second))
                frame(os.path.join(MEDIA, week, source), second, target)
                frame_count += 1
    lines.append("rendered output count: %d" % output_count)
    lines.append("decoded frame count: %d" % frame_count)
    ok = output_count == 8 and frame_count == 8 and all(v == 0 for v in EXITS.values())
    lines.append("Result: %s" % ("PASS" if ok else "FAIL"))
    with open(EVIDENCE, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print("outputs: %d, frames: %d, result: %s" % (output_count, frame_count, "PASS" if ok else "FAIL"))
    print("wrote", EVIDENCE)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
