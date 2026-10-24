"""Word times of speech clips with faster-whisper (scripts/storytime/book-audio.ts).

Usage: python word-times.py < clips.json

stdin: a JSON list of WAV paths. stdout: a JSON list with one list of {word, start, end} (seconds
from the start of the clip) for each path. The model is the local "small" model (no download).
"""
import json
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel


def main() -> int:
    paths = json.load(sys.stdin)
    model = WhisperModel("small", device="cpu", compute_type="int8", local_files_only=True)
    out = []
    for path in paths:
        raw = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"],
            check=True,
            capture_output=True,
        ).stdout
        pcm = np.frombuffer(raw, dtype=np.float32)
        segments, _ = model.transcribe(
            pcm, language="en", word_timestamps=True, condition_on_previous_text=False, vad_filter=False, beam_size=5, temperature=0.0
        )
        words = [
            {"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
            for s in segments
            for w in s.words
            if w.word.strip()
        ]
        out.append(words)
    json.dump(out, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
