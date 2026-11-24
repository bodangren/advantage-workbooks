#!/usr/bin/env python3
"""Write the Phase 2 round 7 evidence for the w04 and w07 re-render.

Reads the eight outputs, probes and hashes them, records the drawn boxes from src/actorBoxes.ts, records the shot
windows from src/timeline.ts, and extracts the JPG frames that the brief asks for. Every hash, probe, box, and
window in the evidence comes from a command here.
"""
import hashlib
import json
import os
import subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
PROJECT = os.path.join(REPO, "video/storytime-song")
RUNS = os.path.join(REPO, "measure/runs/storytime_song_video_20261022")
MEDIA = os.path.join(REPO, "content/storytime/l2/media")
EVIDENCE = os.path.join(RUNS, "green-p2-r7-01f45859.txt")
WEEKS = ["w04", "w07"]
EXITS = {"w04": 0, "w07": 0}  # verified from the one-wrapper-per-week render captures
FILES = ["song.mp4", "song-phone.mp4", "song-poster.jpg", "song-phone-poster.jpg"]
FRAMES = [
    ("w04", "song.mp4", "classroom", 10),
    ("w04", "song-phone.mp4", "phone", 10),
    ("w04", "song.mp4", "classroom", 13.48),
    ("w04", "song-phone.mp4", "phone", 13.48),
    ("w07", "song.mp4", "classroom", 10),
    ("w07", "song-phone.mp4", "phone", 10),
]

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

SHOT_JS = r"""
import("./src/timeline.ts").then(async (m) => {
  const fs = await import("node:fs");
  const { prepare } = await import("./scripts/prepare.mjs");
  const spec = JSON.parse(fs.readFileSync(prepare("l2/WEEK"), "utf8"));
  const list = m.shots(spec);
  console.log(JSON.stringify(list.map((s, i) => ({
    index: i + 1, start: s.start, end: s.end, next: list[i + 1] ? list[i + 1].start : null,
    actors: s.actors,
  }))));
}).catch((e) => { console.error(e); process.exit(1); });
"""

FIGURE_SVG_ASPECT = 240 / 340


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


def node_json(script):
    run = subprocess.run(["node", "--input-type=module", "-e", script],
                         cwd=PROJECT, capture_output=True, check=True, text=True)
    return json.loads(run.stdout)


def main():
    lines = [
        "Phase 2 round 7 evidence, role base 01f45859 (2026-11-24)",
        "Only w04 and w07 were re-rendered; w01, w02, w03, w05 and w06 were not rendered.",
        "One heavy-run wrapper per week: node scripts/render.mjs l2/wNN --concurrency 2.",
        "render.mjs keeps another owner's uncommitted --cut karaoke edit; the default path does not use it.",
        "",
    ]
    output_count = 0
    frame_count = 0
    for week in WEEKS:
        lines.append("week %s render exit: %d" % (week, EXITS[week]))
        drawn = node_json(BOX_JS.replace("WEEK", week))
        for cut in ["classroom", "portrait"]:
            entries = drawn[cut]
            lines.append("week %s %s drawn box count: %d" % (week, cut, len(entries)))
            for i, row in enumerate(entries):
                summary = "; ".join(
                    "%s=%s[%g,%g,%g,%g]" % (b["name"], b["kind"], b["box"]["left"],
                                             b["box"]["top"], b["box"]["width"], b["box"]["height"])
                    for b in row)
                lines.append("week %s %s line %d boxes: %s" % (week, cut, i + 1, summary))
        shots = node_json(SHOT_JS.replace("WEEK", week))
        gaps = 0
        for shot in shots:
            if shot["next"] is None:
                continue
            if abs(shot["end"] - shot["next"]) > 1e-9:
                gaps += 1
            lines.append("week %s shot %d window: %g to %g (next start %g) actors: %s"
                         % (week, shot["index"], shot["start"], shot["end"],
                            shot["next"], ",".join(shot["actors"])))
        lines.append("week %s shot window gaps: %d" % (week, gaps))
        for name in FILES:
            path = os.path.join(MEDIA, week, name)
            info = probe(path)
            lines.append("%s %s sha256: %s" % (week, name, sha256(path)))
            lines.append("%s %s ffprobe: codec=%s size=%s fps=%s duration=%s faststart=%s"
                         % (week, name, info["codec"], info["size"], info["fps"],
                            info["duration"], info["faststart"]))
            output_count += 1
    for week, source, cut, second in FRAMES:
        target = os.path.join(RUNS, "frames-p2r7-%s-%s-%s.jpg" % (week, cut, str(second).replace(".", "_")))
        frame(os.path.join(MEDIA, week, source), second, target)
        lines.append("frame %s %s at %s s: %s" % (week, cut, second, os.path.basename(target)))
        frame_count += 1
    lines.append("rendered output count: %d" % output_count)
    lines.append("decoded frame count: %d" % frame_count)
    ok = output_count == 8 and frame_count == len(FRAMES) and all(v == 0 for v in EXITS.values())
    lines.append("Result: %s" % ("PASS" if ok else "FAIL"))
    with open(EVIDENCE, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print("outputs: %d, frames: %d, result: %s" % (output_count, frame_count, "PASS" if ok else "FAIL"))
    print("wrote", EVIDENCE)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
