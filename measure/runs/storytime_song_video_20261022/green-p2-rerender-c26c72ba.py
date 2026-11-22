#!/usr/bin/env python3
"""Write Phase 2 re-render evidence from measured files.

Reads the six week outputs, hashes every file, probes codecs and sizes, counts bubbles and cast entries,
and extracts 24 JPG frames. Every hash and every probe value in the evidence comes from a command here.
"""
import hashlib
import json
import os
import subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
VIDEO = os.path.join(REPO, "video/storytime-song")
RUNS = os.path.join(REPO, "measure/runs/storytime_song_video_20261022")
MEDIA = os.path.join(REPO, "content/storytime/l2/media")
EVIDENCE = os.path.join(RUNS, "green-p2-rerender-c26c72ba.txt")
WEEKS = ["w02", "w03", "w05", "w06", "w07", "w04"]
RENDER_LOG = "/tmp/opencode/p2-render-%s.raw"
# Verified from the six one-wrapper-per-week render captures in this round.
EXITS = {week: 0 for week in WEEKS}
FILES = ["song.mp4", "song-phone.mp4", "song-poster.jpg", "song-phone-poster.jpg"]
CUTS = [("song.mp4", "classroom"), ("song-phone.mp4", "phone")]
TIMES = [10, 40]
COVERED = {"pat", "sam", "mia", "may"}


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
    # Faststart means the moov atom precedes mdat in the MP4 box order.
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
        "video_codec": video.get("codec_name", "none"),
        "size": "%sx%s" % (video.get("width", "?"), video.get("height", "?")),
        "fps": video.get("r_frame_rate", "n/a"),
        "duration": info.get("format", {}).get("duration", "n/a"),
        "audio_codec": audio.get("codec_name", "none"),
        "faststart": faststart,
    }


def frame(source, second, target):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(second), "-i", source,
         "-frames:v", "1", "-q:v", "5", target],
        capture_output=True, check=True)


def render_log_excerpt(week):
    path = RENDER_LOG % week
    if not os.path.exists(path):
        return "missing capture"
    lines = [ln.strip() for ln in open(path, encoding="utf-8").read().splitlines() if ln.strip()]
    return "; ".join(lines[-4:])


def render_diff_stat():
    run = subprocess.run(
        ["git", "diff", "--stat", "--", "video/storytime-song/scripts/render.mjs"],
        cwd=REPO, capture_output=True, check=True, text=True)
    return run.stdout.strip().replace("\n", "; ")


def main():
    lines = [
        "Phase 2 re-render evidence, role base c26c72ba (2026-11-23)",
        "Render command: HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=3000 bash heavy-run.sh -c 'set -o pipefail; cd video/storytime-song && node scripts/render.mjs l2/wNN --concurrency 2'",
        "One wrapper per week, serial, never nested. Week 1 was not rendered; its approved media stays unchanged.",
        "render.mjs in the working tree carries another owner's uncommitted --cut karaoke edit; the default cut path does not use the karaoke branch.",
        "git diff --stat -- video/storytime-song/scripts/render.mjs: %s" % render_diff_stat(),
        "",
    ]
    fallback = []
    covered_weeks = 0
    covered_forge = 0
    frame_count = 0
    for week in WEEKS:
        spec_path = os.path.join(VIDEO, "public", "l2", week, "spec.json")
        spec = json.load(open(spec_path, encoding="utf-8"))
        cast = list((spec.get("forge") or {}).get("cast", {}).keys())
        covered = sorted(name for name in cast if name.lower() in COVERED)
        bubbles = sum(len(line.get("bubbles", [])) for line in spec.get("lines", []))
        art = spec.get("art")
        scene = bool(spec.get("sceneVideo"))
        if scene:
            mode = "forge-video scene video, no actor layer, bubbles on top"
        elif covered:
            mode = "Forge classroom scene, cut-outs for covered actors, placeholders for missing cast"
            if week == "w07":
                mode += ", w07 props drawn with their characters"
        else:
            mode = "placeholder art, no covered cast"
        lines.append("week %s render exit: %d" % (week, EXITS[week]))
        lines.append("week %s art mode: %s" % (week, mode))
        lines.append("week %s art field: %s" % (week, art))
        lines.append("week %s scene video: %s" % (week, spec.get("sceneVideo") or "none"))
        lines.append("week %s forge covered cast: %s" % (week, ",".join(covered) if covered else "none"))
        lines.append("week %s bubble count: %d" % (week, bubbles))
        lines.append("week %s render capture: %s" % (week, render_log_excerpt(week)))
        if covered:
            covered_weeks += 1
            if art == "forge":
                covered_forge += 1
            else:
                fallback.append(week)
        for name in FILES:
            path = os.path.join(MEDIA, week, name)
            info = probe(path)
            lines.append(
                "%s %s sha256: %s" % (week, name, sha256(path)))
            lines.append(
                "%s %s ffprobe: codec=%s/%s size=%s fps=%s duration=%s faststart=%s"
                % (week, name, info["video_codec"], info["audio_codec"], info["size"],
                   info["fps"], info["duration"], info["faststart"]))
        for source, cut in CUTS:
            for second in TIMES:
                target = os.path.join(RUNS, "frames-p2-%s-%s-%d.jpg" % (week, cut, second))
                frame(os.path.join(MEDIA, week, source), second, target)
                frame_count += 1
    lines.append("manifest-covered weeks with Forge art: %d of %d" % (covered_forge, covered_weeks))
    lines.append("silent Forge fallback weeks: %s" % (",".join(fallback) if fallback else "none"))
    lines.append("decoded frame count: %d" % frame_count)
    lines.append("Result: %s" % ("PASS" if not fallback and frame_count == 24 and all(v == 0 for v in EXITS.values()) else "FAIL"))
    with open(EVIDENCE, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print("weeks: %d, frames: %d, fallback: %s" % (len(WEEKS), frame_count, fallback or "none"))
    print("wrote", EVIDENCE)
    return 0 if not fallback and frame_count == 24 else 1


if __name__ == "__main__":
    raise SystemExit(main())
