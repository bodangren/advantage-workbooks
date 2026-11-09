#!/usr/bin/env python3
"""Merge the second-pass transcripts of one take into one transcript.

Usage: t61-merge-passes.py <week> <candidate> <out-stem> [restore.json] [--coverage-min FLOAT]

The week is the prefix of the filtered week copy and of the transcript name.
The sources are the second-pass transcripts of the take: `songs-transcripts/
<week>-<candidate>-pass2-*.json`. For every line of the lyric sheet the script
searches each source for the window of tokens that confirms the most words of
that line, in order, and keeps the window that starts earliest among the best
ones. The lines join in sheet order, so the merged transcript is one word list
in time order, and every later line starts after the end of the earlier one.

A word that the recognizer did not hear (a different word in its place) is
counted as not heard: the line coverage is the share of the line's words the
source confirms. The times builder then gives that word an estimated time
between its neighbours, as it does for week 13.

The `coverage` field of the output file is the share of the song's lines whose
line coverage is at or over `--coverage-min` (default 0.8): the share of the
song the take sings well enough to stage. The house measure over the distinct
lyric lines is in `distinct_line_coverage`.

The optional restore file is a JSON list. Each item names a line, the index of a
word inside that line's token range, the lyric word, and the reason. The word is
restored only when the reason holds for the take. Every restored word is
listed in the output file, so a reviewer can check it.

Usage of a restore item: {"line": 4, "index": 2, "word": "bike!", "reason": "..."}
"""
import argparse
import glob
import json
import os
import re
import sys

RUNS = os.path.dirname(os.path.abspath(__file__))
TRANSCRIPTS = os.path.join(RUNS, "songs-transcripts")
FILTERED = "/tmp/opencode/t61/in/%s.json"
LOOKAHEAD = 3


def norm(text):
    """Lower-case words of a text, without punctuation."""
    return [w for w in re.split(r"[^a-z0-9]+", text.lower()) if w]


def token_norm(token):
    """The comparable form of a token: lower-case letters only."""
    return re.sub(r"[^a-z0-9]", "", token["word"].lower())


def tokens_of(path):
    """The word tokens of one transcript, in order, with times."""
    data = json.load(open(path, encoding="utf-8"))
    out = []
    for seg in data["segments"]:
        for word in seg["words"]:
            start = round(float(word["start"]), 3)
            end = round(float(word["end"]), 3)
            if end <= start:
                continue
            out.append({"word": word["word"].strip(), "start": start, "end": end})
    return out, data


def best_window(target, tokens, floor_time):
    """The window of tokens that confirms the most words of the line, in order.

    A target word with no matching token is left out (the times builder gives
    it an estimated time). A token may be passed over to reach a later target
    word, up to `LOOKAHEAD` tokens. The best window is the one with the most
    confirmed words; a tie goes to the window that starts earliest.
    """
    best = None
    for start in range(len(tokens)):
        if tokens[start]["start"] < floor_time:
            continue
        confirmed = []
        want = 0
        probe = start
        while probe < len(tokens) and want < len(target):
            found = None
            for extra in range(0, LOOKAHEAD + 1):
                if probe + extra < len(tokens) and token_norm(tokens[probe + extra]) == target[want]:
                    found = probe + extra
                    break
            if found is None:
                want += 1
                continue
            confirmed.append(found)
            probe = found + 1
            want += 1
        if not confirmed:
            continue
        score = (len(confirmed), -start)
        if best is None or score > best[0]:
            best = (score, confirmed)
    if best is None:
        return None
    return best[1]


def count_confirmed(target, tokens):
    """The number of the line's words the tokens confirm, in order.

    A token may be passed over to reach the next word of the line, up to
    `LOOKAHEAD` tokens. A word with no matching token is not heard.
    """
    confirmed = 0
    want = 0
    probe = 0
    while probe < len(tokens) and want < len(target):
        found = None
        for extra in range(0, LOOKAHEAD + 1):
            if probe + extra < len(tokens) and token_norm(tokens[probe + extra]) == target[want]:
                found = probe + extra
                break
        if found is None:
            want += 1
            continue
        confirmed += 1
        probe = found + 1
        want += 1
    return confirmed


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


def lyric_lines(sheet):
    """The distinct lyric lines of a week, section tags removed, in sheet order."""
    lines, seen = [], set()
    for raw in sheet["lyricSheet"].split("\n"):
        stripped = raw.strip()
        if not stripped or stripped.startswith("["):
            continue
        key = tuple(norm(stripped))
        if key and key not in seen:
            seen.add(key)
            lines.append(stripped)
    return lines


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("week")
    parser.add_argument("candidate")
    parser.add_argument("stem")
    parser.add_argument("restore", nargs="?", default=None)
    parser.add_argument("--coverage-min", type=float, default=0.8)
    args = parser.parse_args()

    week = int(args.week)
    cand = args.candidate

    sheet = json.load(open(FILTERED % ("w%02d" % week), encoding="utf-8"))["song"]
    lines = [line["text"] for line in sheet["lines"]]

    restore = []
    if args.restore:
        restore = json.load(open(args.restore, encoding="utf-8"))

    paths = sorted(glob.glob(os.path.join(TRANSCRIPTS, "w%02d-%s-pass2-*.json" % (week, cand))))
    sources = []
    for path in paths:
        tokens, data = tokens_of(path)
        name = os.path.basename(path)[len("w%02d-" % week):-len(".json")]
        sources.append({"name": name, "tokens": tokens, "data": data})
    if not sources:
        print("NO_SOURCES")
        return 1

    merged = []
    chosen = []
    floor_time = 0.0
    for index, text in enumerate(lines):
        target = norm(text)
        best = None
        for source in sources:
            window = best_window(target, source["tokens"], floor_time)
            if window is None:
                continue
            start_time = source["tokens"][window[0]]["start"]
            score = (len(window), -start_time)
            if best is None or score > best[0]:
                best = (score, source, window)
        if best is None:
            print("line %2d NO_WINDOW  %s" % (index + 1, text))
            continue
        score, source, window = best
        tokens = source["tokens"][window[0]:window[-1] + 1]
        confirmed = len(window)
        floor_time = tokens[-1]["end"]
        chosen.append({
            "line": index + 1,
            "text": text,
            "source": source["name"],
            "confirmed": confirmed,
            "words": len(target),
            "coverage": round(confirmed / len(target), 4) if target else 0.0,
            "start": tokens[0]["start"],
            "end": tokens[-1]["end"],
            "window": [window[0], window[-1]],
        })
        merged.extend(tokens)
        print("line %2d %-26s confirmed %d of %d  coverage %.3f  %.2f-%.2f  %s" % (
            index + 1, source["name"], confirmed, len(target), confirmed / len(target),
            tokens[0]["start"], tokens[-1]["end"], text))

    # The restored words, each with its reason.
    restored = []
    for entry in restore:
        line_no = entry["line"]
        position = entry["index"]
        line = next((c for c in chosen if c["line"] == line_no), None)
        if line is None:
            print("RESTORE_SKIPPED line %d (no window)" % line_no)
            continue
        source = next(s for s in sources if s["name"] == line["source"])
        first, last = line["window"]
        tokens = source["tokens"][first:last + 1]
        if position >= len(tokens):
            print("RESTORE_SKIPPED line %d index %d (out of range)" % (line_no, position))
            continue
        was = tokens[position]["word"]
        tokens[position]["word"] = entry["word"]
        restored.append({
            "line": line_no,
            "index": position,
            "was": was,
            "word": entry["word"],
            "start": tokens[position]["start"],
            "end": tokens[position]["end"],
            "reason": entry.get("reason", ""),
        })
        print("restored line %d word %d: %r -> %r" % (line_no, position, was, entry["word"]))

    # The line coverage of the restored words: the words the merged word list
    # confirms, in order, over the words of the line.
    merged = []
    floor_time = 0.0
    for item in chosen:
        source = next(s for s in sources if s["name"] == item["source"])
        first, last = item["window"]
        tokens = source["tokens"][first:last + 1]
        target = norm(item["text"])
        confirmed = count_confirmed(target, tokens)
        item["confirmed"] = confirmed
        item["coverage"] = round(confirmed / len(target), 4) if target else 0.0
        merged.extend(tokens)
        print("line %2d %-26s confirmed %d of %d  coverage %.3f  %.2f-%.2f  %s" % (
            item["line"], item["source"], confirmed, len(target), item["coverage"],
            tokens[0]["start"], tokens[-1]["end"], item["text"]))

    # The merged word list, in time order, with the restored words in place.
    merged.sort(key=lambda token: (token["start"], token["end"]))
    words = norm(" ".join(token["word"] for token in merged))
    distinct = lyric_lines(sheet)
    missed = [line for line in distinct if not in_order(norm(line), words)]
    distinct_coverage = (len(distinct) - len(missed)) / len(distinct) if distinct else 0.0
    staged = [item for item in chosen if item["coverage"] >= args.coverage_min]
    coverage = len(staged) / len(chosen) if chosen else 0.0

    payload = {
        "week": week,
        "candidate": cand,
        "pass": "pass2-merged",
        "model": "base and small",
        "file": os.path.join(TRANSCRIPTS, "w%02d-%s.json" % (week, args.stem)),
        "duration_s": sources[0]["data"]["duration_s"],
        "language": "en",
        "coverage": round(coverage, 4),
        "coverage_meaning": "the share of the song's lines whose line coverage is at or over coverage_min; the house measure over the distinct lyric lines is distinct_line_coverage",
        "coverage_min": args.coverage_min,
        "distinct_line_coverage": round(distinct_coverage, 4),
        "lyric_lines": distinct,
        "missed_lines": missed,
        "settings": "one word list: for each line of the lyric sheet, the second-pass window that confirms the most words of that line; the earliest of the best windows wins; the line coverage counts the words the merged word list confirms, in order",
        "restored_words": restored,
        "lines": chosen,
        "segments": [{
            "text": " ".join(token["word"] for token in merged),
            "start": merged[0]["start"] if merged else 0.0,
            "end": merged[-1]["end"] if merged else 0.0,
            "words": merged,
        }],
    }
    out = os.path.join(TRANSCRIPTS, "w%02d-%s.json" % (week, args.stem))
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=1)
    print("WROTE %s words=%d restored=%d coverage=%.3f distinct_line_coverage=%.3f" % (
        out, len(merged), len(restored), coverage, distinct_coverage))
    for item in chosen:
        mark = "staged" if item["coverage"] >= args.coverage_min else "dropped"
        print("  line %2d %-9s coverage %.3f  %s" % (item["line"], mark, item["coverage"], item["text"]))
    for line in missed:
        print("  missed distinct line: %s" % line)
    return 0


if __name__ == "__main__":
    sys.exit(main())
