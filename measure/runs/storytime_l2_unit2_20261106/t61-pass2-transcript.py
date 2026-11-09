#!/usr/bin/env python3
"""Second-pass transcript of one Storytime Level 2 Unit 2 song take (Task 6.1).

Usage:
  t61-pass2-transcript.py --week 12 --candidate c2 --model small --out NAME.json
  t61-pass2-transcript.py --week 12 --candidate c2 --model base --out NAME.json --cut 14 26

The model runs with the settings of jr-green-t113-check-songs-r2.py: int8, cpu,
local files only, language en, word timestamps, no condition on previous text,
no VAD, beam 5, temperature 0.0, no initial prompt. A cut pass writes a 16 kHz
mono WAV under /tmp/opencode/t61/ first, and records the words on the full
timeline.
"""
import argparse
import json
import os
import subprocess

import numpy as np
from faster_whisper import WhisperModel

CANDIDATES = os.path.expanduser("~/Desktop/handoff/storytime-l2u2-song-candidates-2026-11-09")
TRANSCRIPTS = "/home/daniebo/Desktop/Workbooks/measure/runs/storytime_l2_unit2_20261106/songs-transcripts"
TMP = "/tmp/opencode/t61"


def probe(path):
    """Duration in seconds and sample rate in Hz of a media file."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=sample_rate:format=duration", "-of", "json", path],
        check=True, capture_output=True, text=True,
    ).stdout
    data = json.loads(out)
    return float(data["format"]["duration"]), int(data["streams"][0]["sample_rate"])


def pcm(path):
    """Mono 16 kHz float samples of a media file."""
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def cut_wav(path, start, end):
    """Write a 16 kHz mono WAV of the window and return its path."""
    os.makedirs(TMP, exist_ok=True)
    out = os.path.join(TMP, "cut-%s-%s-%s.wav" % (os.path.basename(path).replace(".mp3", ""), start, end))
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-ss", "%.3f" % start, "-t", "%.3f" % (end - start),
         "-i", path, "-ac", "1", "-ar", "16000", out],
        check=True, capture_output=True,
    )
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--cut", nargs=2, type=float)
    args = parser.parse_args()

    take = os.path.join(CANDIDATES, "w%02d" % args.week, "l2-w%02d-song-%s.mp3" % (args.week, args.candidate))
    duration, rate = probe(take)
    model = WhisperModel(args.model, device="cpu", compute_type="int8", local_files_only=True)

    cut = None
    if args.cut:
        cut = [round(args.cut[0], 3), round(args.cut[1], 3)]
        audio = pcm(cut_wav(take, cut[0], cut[1]))
        offset = cut[0]
    else:
        audio = pcm(take)
        offset = 0.0

    segments, info = model.transcribe(
        audio, language="en", word_timestamps=True, condition_on_previous_text=False,
        vad_filter=False, beam_size=5, temperature=0.0,
    )
    rows = []
    for seg in segments:
        words = [
            {"word": w.word.strip(), "start": round(offset + w.start, 3), "end": round(offset + w.end, 3)}
            for w in seg.words if w.word.strip()
        ]
        rows.append({"text": seg.text.strip(), "start": round(offset + seg.start, 3),
                     "end": round(offset + seg.end, 3), "words": words})

    payload = {
        "week": args.week,
        "candidate": args.candidate,
        "pass": "pass2-%s%s" % (args.model, "" if cut is None else "-cut"),
        "model": args.model,
        "file": take,
        "duration_s": round(duration, 3),
        "sample_rate_hz": rate,
        "language": info.language,
        "cut": cut,
        "settings": "int8, cpu, local_files_only=True, language=en, word_timestamps=True, "
                    "condition_on_previous_text=False, vad_filter=False, beam_size=5, temperature=0.0, "
                    "no initial prompt",
        "segments": rows,
    }
    out = os.path.join(TRANSCRIPTS, args.out)
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=1)
    print("WROTE %s model=%s cut=%s words=%d" % (out, args.model, cut, sum(len(s["words"]) for s in rows)))
    for seg in rows:
        print("  " + " ".join("%s[%.2f-%.2f]" % (w["word"], w["start"], w["end"]) for w in seg["words"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
