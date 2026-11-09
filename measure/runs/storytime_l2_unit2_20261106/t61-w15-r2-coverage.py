"""Line coverage of the 3 new week 15 r2 song takes (Task 6.1 support).

The 3 takes are `l2-w15-song-r2-c1.mp3`, `-c2.mp3`, and `-c3.mp3` of the folder
`~/Desktop/handoff/storytime-l2u2-w15-candidates-r2/`.

This script follows the style of `jr-green-t113-check-songs-r2.py`: ffprobe duration and
sample rate, a faster-whisper `small` transcript (int8, cpu, local, language en, word times,
no lyric prompt), and the coverage of the 13 lyric sheet lines.

Two scoring rules run on the same transcript:
- new rule: the 13 sheet lines in order. A line starts at the token after the last matched
  token of the previous accepted line. The line tries start offsets 0 to 8 tokens from the
  cursor, and each try matches the line words in order with a lookahead of 3 tokens. The try
  with the best coverage wins. A line of 0.8 or more is accepted and moves the cursor. A
  missed line keeps the cursor where it was.
- old rule (Task 1.13): each distinct line heard anywhere, in order inside the line.

A take that repeats one word 10 times or more in a row is a LOOP take. The script also
transcribes a LOOP take with the `base` model and scores both.

`--score-only` re-scores the 3 saved transcripts, `songs-transcripts/w15-r2-c1.json`,
`-c2.json`, and `-c3.json`. It loads no speech model and writes no transcript file.

The script reads no week file and no Thai text. `--capture PATH` writes the output to PATH.
"""

import argparse
import gc
import json
import os
import re
import subprocess
import sys
import time

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = os.path.join(REPO, "measure/runs/storytime_l2_unit2_20261106")
TRANSCRIPTS = os.path.join(RUNS, "songs-transcripts")
TAKES_DIR = os.path.expanduser("~/Desktop/handoff/storytime-l2u2-w15-candidates-r2")
SMALL = "small"
BASE = "base"
TAKES = ["c1", "c2", "c3"]
MIN_DUR = 0.05
LOOKAHEAD = 3
START_OFFSETS = 8
SONG_THRESHOLD = 0.8
LOOP_COUNT = 10

# The 13 lyric sheet lines in order, from `w15-lyrics-r2.md`.
SHEET_LINES = [
    "Look, a bus! Beep, beep, beep!",
    "Look, a train! Choo, choo, choo!",
    "Look, a car! Drive, drive, drive!",
    "Look, a bike! Ride, ride, ride!",
    "Look, look, look around!",
    "Look, look, look with me!",
    "Look, a boat! Row, row, row!",
    "Look, a truck! Big, big, big!",
    "Look, a plane! Fly, fly, fly!",
    "Look, a helicopter! Up, up, up!",
    "Look, look, look around!",
    "Look, look, look with me!",
    "Wave goodbye! Time to go home!",
]
# The sheet sings each chorus line two times. Every other line sings one time.
SHEET_COUNTS = {5: 2, 6: 2, 11: 2, 12: 2}

SETTINGS = {
    "compute_type": "int8",
    "device": "cpu",
    "local_files_only": True,
    "language": "en",
    "word_timestamps": True,
    "condition_on_previous_text": False,
    "vad_filter": False,
    "beam_size": 5,
    "temperature": 0.0,
    "initial_prompt": None,
}


class Output:
    """Print one line and keep it in the capture file."""

    def __init__(self, capture):
        self.handle = open(capture, "w", encoding="utf-8") if capture else None

    def line(self, text):
        print(text, flush=True)
        if self.handle:
            self.handle.write(text + "\n")
            self.handle.flush()

    def close(self):
        if self.handle:
            self.handle.close()


def norm_words(text):
    """Lower-case words of a text, without punctuation."""
    text = text.lower().replace("\u2019", "'")
    text = re.sub(r"[']", "", text)
    return [w for w in re.split(r"[^a-z0-9]+", text) if w]


def token_word(word):
    """The normalized form of one recognized token, as a word list."""
    return norm_words(word["word"])


def probe(path):
    """Duration in seconds and sample rate in Hz."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=sample_rate:format=duration", "-of", "json", path],
        check=True, capture_output=True, text=True,
    ).stdout
    data = json.loads(out)
    return float(data["format"]["duration"]), int(data["streams"][0]["sample_rate"])


def pcm(path):
    """Mono 16 kHz float samples of the file."""
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000",
         "-f", "f32le", "pipe:1"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def load_model(name):
    """A local faster-whisper model. The import stays out of the score-only path."""
    from faster_whisper import WhisperModel

    return WhisperModel(name, device=SETTINGS["device"],
                        compute_type=SETTINGS["compute_type"],
                        local_files_only=SETTINGS["local_files_only"])


def transcribe(model, samples):
    """Word rows with start and end times, plus the segments."""
    segments, info = model.transcribe(
        samples,
        language=SETTINGS["language"],
        word_timestamps=SETTINGS["word_timestamps"],
        condition_on_previous_text=SETTINGS["condition_on_previous_text"],
        vad_filter=SETTINGS["vad_filter"],
        beam_size=SETTINGS["beam_size"],
        temperature=SETTINGS["temperature"],
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
    return words, segment_rows, info


def longest_run(words):
    """The longest run of one word in a row, and that word."""
    best, best_word, run, last = 0, "", 0, None
    for word in words:
        parts = norm_words(word["word"])
        key = parts[0] if len(parts) == 1 else (word["word"].lower() or "_")
        if key == last:
            run += 1
        else:
            run, last = 1, key
        if run > best:
            best, best_word = run, last
    return best, best_word


def usable(words):
    """The tokens that hold a minimum duration, and the tokens that drop out."""
    tokens = [w for w in words if round(w["end"] - w["start"], 3) >= MIN_DUR]
    dropped = [w for w in words if round(w["end"] - w["start"], 3) < MIN_DUR]
    return tokens, dropped


def match_line(target, tokens, start):
    """Match the words of one line from one start token. Lowest index wins."""
    pos = start
    first = None
    last = None
    examined = start
    matches, missed = [], []
    for word in target:
        stop = min(len(tokens), pos + LOOKAHEAD + 1)
        found = -1
        for index in range(pos, stop):
            if token_word(tokens[index]) == [word]:
                found = index
                break
        examined = max(examined, min(stop, len(tokens)) - 1)
        if found >= 0:
            if first is None:
                first = found
            last = found
            matches.append({
                "word": word,
                "heard": tokens[found]["word"],
                "index": found,
                "start": tokens[found]["start"],
                "end": tokens[found]["end"],
            })
            pos = found + 1
        else:
            missed.append(word)
    return {
        "start_index": start,
        "first_index": first,
        "last_index": last,
        "examined": examined,
        "matched": len(matches),
        "coverage": round(len(matches) / len(target), 4) if target else 0.0,
        "matches": matches,
        "missed": missed,
    }


def score_sheet(tokens):
    """Coverage of the 13 sheet lines in order, from a token index cursor."""
    cursor = 0
    rows = []
    for number, line in enumerate(SHEET_LINES, start=1):
        target = norm_words(line)
        best = None
        for offset in range(START_OFFSETS + 1):
            start = cursor + offset
            if start >= len(tokens):
                break
            try_row = match_line(target, tokens, start)
            if best is None or try_row["coverage"] > best["coverage"]:
                best = try_row
                best["offset"] = offset
        if best is None:
            best = {"start_index": cursor, "first_index": None, "last_index": None,
                    "examined": cursor, "matched": 0, "coverage": 0.0, "matches": [],
                    "missed": target, "offset": 0}
        accepted = best["coverage"] >= SONG_THRESHOLD
        row = {
            "line": number,
            "text": line,
            "words": len(target),
            "matched": best["matched"],
            "coverage": best["coverage"],
            "start_index": best["start_index"],
            "first_index": best["first_index"],
            "last_index": best["last_index"],
            "examined": best["examined"],
            "offset": best["offset"],
            "accepted": accepted,
            "matches": best["matches"],
            "missed_words": best["missed"],
            "start": (tokens[best["first_index"]]["start"]
                      if best["first_index"] is not None else None),
        }
        rows.append(row)
        if accepted and best["last_index"] is not None:
            cursor = best["last_index"] + 1
    return rows


def count_contiguous(line, tokens):
    """How many times the exact word sequence of a line appears in the tokens."""
    target = norm_words(line)
    size = len(target)
    count, index = 0, 0
    while index + size <= len(tokens):
        hit = True
        for offset in range(size):
            if token_word(tokens[index + offset]) != [target[offset]]:
                hit = False
                break
        if hit:
            count += 1
            index += size
        else:
            index += 1
    return count


def in_order(needle, haystack):
    """True when every word of `needle` appears in `haystack` in order, gaps allowed."""
    pos = 0
    for word in needle:
        while pos < len(haystack) and haystack[pos] != word:
            pos += 1
        if pos == len(haystack):
            return False
        pos += 1
    return True


def old_rule(tokens):
    """The Task 1.13 rule: distinct lines heard anywhere, in order inside the line."""
    heard = [w for word in tokens for w in token_word(word)]
    distinct = []
    for line in SHEET_LINES:
        if line not in distinct:
            distinct.append(line)
    hit = [line for line in distinct if in_order(norm_words(line), heard)]
    return len(hit), len(distinct), [line for line in distinct if line not in hit]


def summarize(rows):
    """Lines sung at 0.8 or more, and the missed line numbers."""
    sung = [row["line"] for row in rows if row["coverage"] >= SONG_THRESHOLD]
    missed = [row["line"] for row in rows if row["coverage"] < SONG_THRESHOLD]
    return sung, missed


def chorus_order(rows):
    """Does line 11 start later than line 5, and line 12 later than line 6?"""
    by_number = {row["line"]: row for row in rows}
    checks = {}
    for early, late in [(5, 11), (6, 12)]:
        a = by_number[early]["first_index"]
        b = by_number[late]["first_index"]
        if a is None or b is None:
            missing = early if a is None else late
            checks[f"{early} before {late}"] = f"no (line {missing} not matched)"
        else:
            checks[f"{early} before {late}"] = "yes" if b > a else "no"
    return checks


def repeats(tokens):
    """Lines that the take sings more times than the sheet has them."""
    extras = []
    for number, line in enumerate(SHEET_LINES, start=1):
        heard = count_contiguous(line, tokens)
        want = SHEET_COUNTS.get(number, 1)
        if heard > want:
            extras.append({"line": number, "text": line, "heard": heard, "sheet": want})
    return extras


def fmt_coverage(rows):
    """The coverage list as one string."""
    return "[" + ", ".join(f"{row['coverage']:.2f}" for row in rows) + "]"


def fmt_numbers(numbers):
    """A comma list or `none`."""
    return ",".join(str(x) for x in numbers) if numbers else "none"


def fmt_time(value):
    """One time in seconds to 2 places."""
    return f"{value:.2f}"


def report(out, words, meta):
    """Score one transcript and print its row and the detail of each line under 1.00."""
    tokens, dropped = usable(words)
    raw_run, run_word = longest_run(words)
    rows = score_sheet(tokens)
    sung, missed = summarize(rows)
    order = chorus_order(rows)
    extras = repeats(tokens)
    # The Task 1.13 rule reads every recognized word, with no duration filter.
    old_hit, old_total, old_missed = old_rule(words)

    out.line(f"{meta['take']} {meta['model']} {meta['duration_s']:.1f}s "
             f"{meta['sample_rate_hz']}Hz LOOP={'yes' if meta['loop'] else 'no'} "
             f"line_sung={len(sung)}/13")
    out.line(f"  cover: {fmt_coverage(rows)}")
    out.line(f"  missed: {fmt_numbers(missed)}")
    out.line("  chorus order: " + "; ".join(f"{key}: {val}"
                                             for key, val in order.items()))
    extra_text = "none"
    if extras:
        extra_text = "; ".join(
            f"line {item['line']} heard {item['heard']} times, sheet has {item['sheet']}"
            for item in extras)
    out.line(f"  extra sung lines: {extra_text}")
    out.line(f"  old rule: {old_hit}/{old_total} distinct lines heard"
             + (" (missed: " + "; ".join(" ".join(norm_words(x)) for x in old_missed) + ")"
                if old_missed else ""))
    out.line(f"  matched words: {sum(row['matched'] for row in rows)} of "
             f"{sum(row['words'] for row in rows)}; tokens used: {len(tokens)}; "
             f"longest repeat: {run_word} x{raw_run}")
    if dropped:
        detail = "; ".join(f"{w['word']} ({fmt_time(w['start'])}-{fmt_time(w['end'])})"
                           for w in dropped[:10])
        out.line(f"  short tokens dropped: {len(dropped)} - {detail}")
    else:
        out.line("  short tokens dropped: 0")
    for row in rows:
        if row["coverage"] >= 1.0:
            continue
        out.line(f"  line {row['line']} cover {row['coverage']:.2f} "
                 f"({row['matched']}/{row['words']}) offset {row['offset']}")
        first = row["first_index"]
        last = row["examined"]
        if first is None:
            first = row["start_index"]
        heard = " ".join(
            f"{tokens[i]['word']}({fmt_time(tokens[i]['start'])})"
            for i in range(first, min(last + 1, len(tokens)))
        )
        got = " ".join(f"{item['word']}({fmt_time(item['start'])})"
                       for item in row["matches"]) or "none"
        gone = " ".join(row["missed_words"]) or "none"
        out.line(f"    heard: {heard or 'none'}")
        out.line(f"    matched: {got}")
        out.line(f"    missed: {gone}")
    out.line("")
    return {
        "lines": rows, "lines_sung": sung, "lines_missed": missed,
        "chorus_order": order, "extra_lines": extras,
        "old_rule": {"distinct_heard": old_hit, "distinct_total": old_total,
                     "missed": [" ".join(norm_words(line)) for line in old_missed]},
        "dropped_tokens": dropped, "tokens_used": len(tokens),
    }


def run_take(out, model, take, model_name):
    """Transcribe, score, save, and print one take with one model."""
    path = os.path.join(TAKES_DIR, f"l2-w15-song-r2-{take}.mp3")
    started = time.time()
    duration, rate = probe(path)
    words, segments, info = transcribe(model, pcm(path))
    run, run_word = longest_run(words)
    meta = {
        "take": take,
        "model": model_name,
        "duration_s": round(duration, 3),
        "sample_rate_hz": rate,
        "loop": run >= LOOP_COUNT,
    }
    result = report(out, words, meta)
    tag = take if model_name == SMALL else f"{take}-base"
    transcript = {
        "take": take,
        "file": path,
        "model": model_name,
        "settings": SETTINGS,
        "duration_s": meta["duration_s"],
        "sample_rate_hz": rate,
        "language": info.language,
        "loop": meta["loop"],
        "longest_repeat": {"word": run_word, "count": run},
        "lyric_lines": SHEET_LINES,
        "tokens_used": result["tokens_used"],
        "dropped_tokens": result["dropped_tokens"],
        "lines": result["lines"],
        "lines_sung": result["lines_sung"],
        "lines_missed": result["lines_missed"],
        "chorus_order": result["chorus_order"],
        "extra_lines": result["extra_lines"],
        "old_rule": result["old_rule"],
        "segments": segments,
        "words": words,
    }
    os.makedirs(TRANSCRIPTS, exist_ok=True)
    with open(os.path.join(TRANSCRIPTS, f"w15-r2-{tag}.json"), "w",
              encoding="utf-8") as handle:
        json.dump(transcript, handle, ensure_ascii=False, indent=1)
    out.line(f"  slow step: {time.time() - started:.1f} s")
    out.line("")
    return meta["loop"]


def score_only(out):
    """Re-score the 3 saved transcripts. Loads no speech model and writes no file."""
    for take in TAKES:
        path = os.path.join(TRANSCRIPTS, f"w15-r2-{take}.json")
        with open(path, encoding="utf-8") as handle:
            saved = json.load(handle)
        meta = {
            "take": take,
            "model": saved["model"],
            "duration_s": saved["duration_s"],
            "sample_rate_hz": saved["sample_rate_hz"],
            "loop": saved["loop"],
        }
        report(out, saved["words"], meta)
    return 0


def main():
    parser = argparse.ArgumentParser(description="Week 15 r2 take line coverage.")
    parser.add_argument("--capture", default=None, help="write the output to this file")
    parser.add_argument("--score-only", action="store_true",
                        help="re-score the 3 saved transcripts, no speech model")
    args = parser.parse_args()
    out = Output(args.capture)
    try:
        out.line("week 15 r2 takes, line coverage of the 13 sheet lines")
        out.line("model: faster-whisper small (int8, cpu, local); language en; word times "
                 "on; no lyric prompt")
        out.line("new rule: 13 sheet lines in order, start offsets 0 to 8 tokens, lookahead "
                 "3 tokens, tokens 0.05 s or longer, line sung at 0.8 or more, a missed "
                 "line keeps the cursor")
        out.line("loop rule: one word 10 times or more in a row; a LOOP take also gets the "
                 "base model")
        out.line("")
        if args.score_only:
            out.line("mode: score only, from the saved transcripts; no speech model")
            out.line("")
            return score_only(out)
        small = load_model(SMALL)
        rows = []
        base = None
        for take in TAKES:
            is_loop = run_take(out, small, take, SMALL)
            rows.append((take, is_loop))
            if is_loop:
                if base is None:
                    base = load_model(BASE)
                run_take(out, base, take, BASE)
        loop_takes = [take for take, flag in rows if flag]
        out.line(f"LOOP takes: {fmt_numbers(loop_takes) if loop_takes else 'none'}")
        return 0
    finally:
        gc.collect()
        out.close()


if __name__ == "__main__":
    sys.exit(main())
