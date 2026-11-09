"""Check the unit 2 song candidates of Storytime Level 2 (Task 1.13, spec FR-8.2).

For each of the 21 mp3 files: the duration and the sample rate (ffprobe), and a transcript
of faster-whisper with no lyric prompt and word times on. The lyric lines come from
`song.lyricSheet` of `content/storytime/drafts/l2/w<nn>.json` at HEAD, section tags removed.

Coverage = the share of the distinct lyric lines whose words appear in order in the
transcript. A candidate passes when coverage is 0.8 or more and the duration is 45 to 120 s.

Output: one row per file on stdout and the transcripts as JSON in the transcripts folder.
No network call, no paid call, no file outside the output folder.
"""

import json
import os
import re
import subprocess
import sys

from faster_whisper import WhisperModel

REPO = "/home/daniebo/Desktop/Workbooks"
CANDIDATES = os.path.expanduser("~/Desktop/handoff/storytime-l2u2-song-candidates-2026-11-09")
RUNS = os.path.join(REPO, "measure/runs/storytime_l2_unit2_20261106")
TRANSCRIPTS = os.path.join(RUNS, "songs-transcripts")
MODEL = os.environ.get("SONG_WHISPER_MODEL", "small")
WEEKS = [9, 10, 11, 12, 13, 14, 15]


def norm_words(text: str):
    """Lower-case words of a text, without punctuation."""
    text = text.lower().replace("’", "'")
    text = re.sub(r"[']", "", text)
    return [w for w in re.split(r"[^a-z0-9]+", text) if w]


def lyric_lines(week: int):
    """The distinct lyric lines of a week at HEAD, section tags removed, in sheet order."""
    raw = subprocess.run(
        ["git", "-C", REPO, "show", f"HEAD:content/storytime/drafts/l2/w{week:02d}.json"],
        check=True, capture_output=True, text=True,
    ).stdout
    sheet = json.loads(raw)["song"]["lyricSheet"]
    lines, seen = [], set()
    for line in sheet.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("["):
            continue
        key = tuple(norm_words(stripped))
        if key and key not in seen:
            seen.add(key)
            lines.append(stripped)
    return lines


def in_order(needle, haystack) -> bool:
    """True when every word of `needle` appears in `haystack` in order, gaps allowed."""
    pos = 0
    for word in needle:
        while pos < len(haystack) and haystack[pos] != word:
            pos += 1
        if pos == len(haystack):
            return False
        pos += 1
    return True


def probe(path: str):
    """Duration in seconds and sample rate in Hz."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=sample_rate:format=duration", "-of", "json", path],
        check=True, capture_output=True, text=True,
    ).stdout
    data = json.loads(out)
    return float(data["format"]["duration"]), int(data["streams"][0]["sample_rate"])


def pcm(path: str):
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main() -> int:
    os.makedirs(TRANSCRIPTS, exist_ok=True)
    model = WhisperModel(MODEL, device="cpu", compute_type="int8", local_files_only=True)
    rows, failures, passed = [], [], 0
    print(f"model: faster-whisper {MODEL} (int8, cpu, local); language en; word times on; no lyric prompt")
    print("rule: pass when coverage is 0.8 or more and the duration is 45 to 120 s")
    print("week cand duration_s sample_rate_hz coverage lines_heard/lines missed_lines")
    for week in WEEKS:
        lines = lyric_lines(week)
        for cand in (1, 2, 3):
            path = os.path.join(CANDIDATES, f"w{week:02d}", f"l2-w{week:02d}-song-c{cand}.mp3")
            duration, rate = probe(path)
            segments, info = model.transcribe(
                pcm(path), language="en", word_timestamps=True, condition_on_previous_text=False,
                vad_filter=False, beam_size=5, temperature=0.0,
            )
            words, segment_rows = [], []
            for seg in segments:
                seg_words = [
                    {"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
                    for w in seg.words if w.word.strip()
                ]
                words.extend(seg_words)
                segment_rows.append({"text": seg.text.strip(), "start": round(seg.start, 3),
                                     "end": round(seg.end, 3), "words": seg_words})
            heard = [w for w in norm_words(" ".join(x["word"] for x in words))]
            missed = [line for line in lines if not in_order(norm_words(line), heard)]
            coverage = (len(lines) - len(missed)) / len(lines) if lines else 0.0
            ok = coverage >= 0.8 and 45.0 <= duration <= 120.0
            passed += 1 if ok else 0
            if not ok:
                failures.append((week, cand, coverage, duration, missed))
            transcript = {
                "week": week, "candidate": cand, "file": path, "model": MODEL,
                "duration_s": round(duration, 3), "sample_rate_hz": rate,
                "language": info.language, "coverage": round(coverage, 4),
                "lyric_lines": lines, "missed_lines": missed, "segments": segment_rows,
            }
            with open(os.path.join(TRANSCRIPTS, f"w{week:02d}-c{cand}.json"), "w", encoding="utf-8") as fh:
                json.dump(transcript, fh, ensure_ascii=False, indent=1)
            missed_text = " | ".join(missed) if missed else "none"
            row = (f"w{week:02d} c{cand} {duration:.1f} {rate} {coverage:.2f} "
                   f"{len(lines) - len(missed)}/{len(lines)} {missed_text}")
            rows.append(row)
            print(row, flush=True)
    print("")
    print(f"PASS {passed} of {len(rows)}")
    if failures:
        print("FAILED CANDIDATES")
        for week, cand, coverage, duration, missed in failures:
            print(f"w{week:02d} c{cand}: coverage {coverage:.2f}, duration {duration:.1f} s")
            for line in missed:
                print(f"  missed: {line}")
    else:
        print("FAILED CANDIDATES: none")
    return 0


if __name__ == "__main__":
    sys.exit(main())
