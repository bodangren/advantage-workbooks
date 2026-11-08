"""Build the Task 1.13 song request folder for the PM (Lyria 3 Pro route).

Reads the 7 staged week files at HEAD with `git show`, copies the song fields word for word,
writes README.md and MANIFEST.txt, and writes the proof capture. No paid call.
"""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

REPO = Path("/home/daniebo/Desktop/Workbooks")
OUT = Path.home() / "Desktop/handoff/storytime-l2u2-song-request-2026-11-09"
CAPTURE = REPO / "measure/runs/storytime_l2_unit2_20261106/songs-request.txt"
WEEKS = list(range(9, 16))
THAI = range(0x0E00, 0x0E80)

README = """# Storytime Level 2 Unit 2: song request (weeks 9 to 15)

## Request

Make 3 candidates of each of the 7 songs with Lyria 3 Pro. Each `w<NN>-song-request.md` holds
the title, the bpm, the style brief, and the lyric sheet. Copy the style brief and the lyric
sheet word for word. Keep the section tags and the line breaks of the lyric sheet.

- Candidates: 21 (7 songs x 3).
- Price: about 0.08 USD a track, so about 1.68 USD.
- Stop: 6.00 USD, class (d) of the unit 2 paid media list
  (`~/Desktop/handoff/storytime-l2u2-paid-media-2026-11-08/paid-media-list.md`).
- Authority: Daniel's go D10 and his Go of 2026-11-08 on the paid media list:
  "20.16 USD expected, 25.21 USD hard stop".

## Why this route

The PM first named `mmx music` (`music-3.0`) on the MiniMax plan for these songs. Workbooks ran
the route on 2026-11-09. The MiniMax music API answered HTTP 410 for this account: "This Music
API is no longer available to new users. Existing paying customers can continue to use the
service." The account has no music quota group. `mmx quota show` lists `general` and `video`
only. The exact text and the probes are in
`measure/runs/storytime_l2_unit2_20261106/songs-blocked.txt`.

The plan names Lyria 3 Pro as the fallback (Task 1.13: "Lyria 3 Pro stays the fallback"). The
orchestrator confirmed route A on 2026-11-09 05:25.

## Delivery

Put each candidate in the folder of its week:

- Folder: `~/Desktop/handoff/storytime-l2u2-song-candidates-2026-11-09/w<NN>/`
- File names: `l2-w<NN>-song-c<k>.mp3`, k = 1 to 3.

The folders exist and are empty. Example:
`~/Desktop/handoff/storytime-l2u2-song-candidates-2026-11-09/w09/l2-w09-song-c1.mp3`.

## What Workbooks does on delivery

1. Workbooks runs a recognizer (local faster-whisper, no lyric prompt) and a duration check on
   each candidate. A take passes at 45 to 120 s and a lyric line coverage of 0.8 or more.
2. Workbooks writes a listen sheet for Daniel: each song, the candidates, the duration, the
   coverage, and the lines that the recognizer did not hear.
3. Daniel picks one candidate for each song.
4. Then Task 6.1 sets `song.lines` and `song.times` from the chosen audio.

## Files

- `w09-song-request.md` to `w15-song-request.md`: one per song.
- `README.md`: this file.
- `MANIFEST.txt`: the SHA-256 of the 8 files.
"""


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    report: list[str] = []
    sources: dict[int, dict] = {}

    for week in WEEKS:
        rel = f"content/storytime/drafts/l2/w{week:02d}.json"
        raw = subprocess.run(["git", "-C", str(REPO), "show", f"HEAD:{rel}"],
                             check=True, capture_output=True, text=True).stdout
        song = json.loads(raw)["song"]
        sources[week] = song
        for key in ("title", "styleBrief", "lyricSheet"):
            if any(ord(ch) in THAI for ch in str(song[key])):
                raise SystemExit(f"Thai text in {rel} song.{key}")
        text = (
            f"# Week {week:02d} song request: {song['title']}\n\n"
            f"- Week: {week:02d}\n"
            f"- Title: {song['title']}\n"
            f"- BPM: {song['bpm']}\n\n"
            "## Style brief\n\n"
            f"{song['styleBrief']}\n\n"
            "## Lyric sheet\n\n"
            f"{song['lyricSheet']}\n"
        )
        (OUT / f"w{week:02d}-song-request.md").write_text(text)

    (OUT / "README.md").write_text(README)

    names = sorted(p.name for p in OUT.iterdir() if p.is_file() and p.name != "MANIFEST.txt")
    manifest = "".join(f"{sha(OUT / n)}  {n}\n" for n in names)
    (OUT / "MANIFEST.txt").write_text(manifest)

    report.append("Task 1.13 song request: proof capture")
    report.append(f"Folder: {OUT}")
    report.append(f"Files (not MANIFEST): {len(names)}")
    for n in names:
        report.append(f"  {sha(OUT / n)}  {n}")
    report.append("")
    report.append("MANIFEST SHA-256: " + sha(OUT / "MANIFEST.txt"))
    report.append("")

    check = subprocess.run(["sha256sum", "-c", "MANIFEST.txt"], cwd=OUT,
                           capture_output=True, text=True)
    report.append("$ sha256sum -c MANIFEST.txt")
    report.append(check.stdout.rstrip())
    if check.stderr.strip():
        report.append(check.stderr.rstrip())
    report.append(f"EXIT={check.returncode}")
    report.append("")

    report.append("Lyric sheet compare (python, the file text holds the source string):")
    ok_all = True
    for week in WEEKS:
        page = (OUT / f"w{week:02d}-song-request.md").read_text()
        song = sources[week]
        checks = {
            "title": song["title"] in page,
            "bpm": f"- BPM: {song['bpm']}" in page,
            "styleBrief": song["styleBrief"] in page,
            "lyricSheet": song["lyricSheet"] in page,
        }
        ok_all = ok_all and all(checks.values())
        report.append(
            f"  w{week:02d}: title={checks['title']} bpm={checks['bpm']} "
            f"styleBrief={checks['styleBrief']} lyricSheet={checks['lyricSheet']} "
            f"(lyric chars {len(song['lyricSheet'])})"
        )
    report.append(f"All 7 lyric sheets equal their source: {ok_all}")
    report.append("Section tags kept: " + str(all("[Chorus]" in (OUT / f'w{w:02d}-song-request.md').read_text() and "[Verse]" in (OUT / f'w{w:02d}-song-request.md').read_text() for w in WEEKS)))
    report.append("")
    report.append("No paid call ran for this folder. Delivery folder: "
                  "~/Desktop/handoff/storytime-l2u2-song-candidates-2026-11-09/")

    text = "\n".join(report) + "\n"
    CAPTURE.write_text(text)
    print(text)
    return 0 if check.returncode == 0 and ok_all and len(names) == 8 else 1


if __name__ == "__main__":
    sys.exit(main())
