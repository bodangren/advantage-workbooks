#!/usr/bin/env python3
"""Build the song line times of the week 15 r2 take c3 from the committed transcript.

Usage: t61-w15-r2-song-times.py [--out PATH]

The script reads `songs-transcripts/w15-r2-c3.json` and the 13 line texts of the r2
line plan. The matcher is the index-cursor matcher of `t61-w15-r2-coverage.py`: a line
tries start offsets 0 to 8 tokens from the cursor, each try matches the line words in
order with a lookahead of 3 tokens, and the try with the best coverage wins. A line
starts at the token after the last matched token of the previous line.

For the timing the zero-length tokens stay in the token list, so the two "beep" tokens
of line 1 hold a slot. A word with no usable time gets an estimated window between its
neighbors, the estimate of `t61-song-times.py`.

The output has the format of `t61-w15-song-times.json`: a list of entries with
`sentence`, `startTime`, `endTime`, and `words` (`word`, `start`, `end`).

The script reads no week file and no Thai text.
"""

import argparse
import json
import re

RUNS = "measure/runs/storytime_l2_unit2_20261106"
TRANSCRIPT = RUNS + "/songs-transcripts/w15-r2-c3.json"
OUT = RUNS + "/t61-w15-r2-song-times.json"

LOOKAHEAD = 3
START_OFFSETS = 8
MIN_DUR = 0.05
EST_WINDOW = 0.30
MIN_WINDOW = 0.10

# The 13 sung lines in order, from the r2 line plan and the r2 lyric sheet.
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


def norm_words(text):
    """Lower-case words of a text, without punctuation."""
    text = text.lower().replace("\u2019", "'")
    text = re.sub(r"[']", "", text)
    return [w for w in re.split(r"[^a-z0-9]+", text) if w]


def token_word(word):
    """The normalized form of one recognized token, as a word list."""
    return norm_words(word["word"])


def usable(token):
    """True when the token holds a usable duration."""
    return round(token["end"] - token["start"], 3) >= MIN_DUR


def match_line(target, tokens, start):
    """Match the words of one line from one start token. Lowest index wins.

    The mapping holds the target slot of every matched word and the token index it
    took. The zero-length tokens stay in the list, so they can hold a slot.
    """
    pos = start
    first = None
    last = None
    mapping = {}
    for slot, word in enumerate(target):
        stop = min(len(tokens), pos + LOOKAHEAD + 1)
        found = -1
        for index in range(pos, stop):
            if token_word(tokens[index]) == [word]:
                found = index
                break
        if found >= 0:
            if first is None:
                first = found
            last = found
            mapping[slot] = found
            pos = found + 1
    return {
        "start_index": start,
        "first_index": first,
        "last_index": last,
        "matched": len(mapping),
        "coverage": round(len(mapping) / len(target), 4) if target else 0.0,
        "mapping": mapping,
    }


def score_sheet(tokens):
    """The match of every line, from the index cursor."""
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
                    "matched": 0, "coverage": 0.0, "mapping": {}, "offset": 0}
        rows.append({"line": number, "text": line, "words": len(target), "best": best})
        if best["last_index"] is not None:
            cursor = best["last_index"] + 1
    return rows


def estimate_run(items, run, prev_end, next_start):
    """Give each missing word of a run an estimated window between its neighbors."""
    count = len(run)
    gap = next_start - prev_end
    for position, index in enumerate(run, start=1):
        if gap <= 0.02:
            start = max(0.0, next_start - MIN_WINDOW)
            end = next_start
        else:
            center = prev_end + gap * position / (count + 1)
            width = min(EST_WINDOW, max(MIN_WINDOW, gap / (count + 1) * 0.6))
            start = center - width / 2
            end = center + width / 2
        start = round(start, 2)
        end = round(end, 2)
        if end <= start:
            end = round(start + 0.05, 2)
        items[index]["start"] = start
        items[index]["end"] = end


def main():
    parser = argparse.ArgumentParser(description="The line times of the week 15 r2 take c3.")
    parser.add_argument("--out", default=OUT)
    args = parser.parse_args()

    with open(TRANSCRIPT, encoding="utf-8") as handle:
        transcript = json.load(handle)
    duration = float(transcript["duration_s"])
    tokens = transcript["words"]

    ok = True

    def check(name, condition, detail=""):
        nonlocal ok
        print("CHECK %s: %s%s" % (name, "PASS" if condition else "FAIL",
                                  "" if condition else " (%s)" % detail))
        ok = ok and bool(condition)
        return condition

    check("transcript_sheet_lines", transcript["lyric_lines"] == SHEET_LINES,
          "the saved transcript holds other sheet lines")
    check("take_is_c3", transcript["take"] == "c3", transcript["take"])
    print("TOKENS=%d USABLE=%d DURATION=%.2f" % (
        len(tokens), sum(1 for t in tokens if usable(t)), duration))

    rows = score_sheet(tokens)
    entries = []
    estimated = []
    for row in rows:
        line = row["text"]
        best = row["best"]
        words = line.split(" ")
        mapping = best["mapping"]
        resolved = []
        for slot, word in enumerate(words):
            index = mapping.get(slot)
            if index is None or not usable(tokens[index]):
                resolved.append({"word": word, "start": None, "end": None, "estimated": True})
            else:
                resolved.append({"word": word, "start": tokens[index]["start"],
                                 "end": tokens[index]["end"], "estimated": False})
        last_probe = max(mapping.values()) if mapping else None
        run = []
        for slot, item in enumerate(resolved + [None]):
            if item is not None and item["estimated"]:
                run.append(slot)
                continue
            if not run:
                continue
            prev_end = 0.0
            for back in range(run[0] - 1, -1, -1):
                if not resolved[back]["estimated"]:
                    prev_end = resolved[back]["end"]
                    break
            next_start = duration
            for ahead in range(run[-1] + 1, len(resolved)):
                if not resolved[ahead]["estimated"]:
                    next_start = resolved[ahead]["start"]
                    break
            else:
                if last_probe is not None and last_probe + 1 < len(tokens):
                    next_start = tokens[last_probe + 1]["start"]
            estimate_run(resolved, run, prev_end, next_start)
            run = []
        entry = {
            "sentence": line,
            "startTime": resolved[0]["start"],
            "endTime": resolved[-1]["end"],
            "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in resolved],
        }
        entries.append(entry)
        for slot, item in enumerate(resolved):
            if item["estimated"]:
                estimated.append((row["line"], item["word"], item["start"], item["end"]))
        print("LINE %2d cover %.2f offset %d  %6.2f-%6.2f  estimated=%s" % (
            row["line"], best["coverage"], best["offset"], entry["startTime"],
            entry["endTime"], [w["word"] for w in resolved if w["estimated"]] or "none"))

    check("lines_count_13", len(entries) == 13, "%d entries" % len(entries))
    check("sentence_equals_line_text",
          all(entries[i]["sentence"] == SHEET_LINES[i] for i in range(len(entries))),
          "a sentence differs from its line text")
    check("word_counts_equal",
          all(len(entries[i]["words"]) == len(SHEET_LINES[i].split(" ")) for i in range(len(entries))),
          "a word count differs from its line word count")
    check("coverage_full",
          all(row["best"]["coverage"] == 1.0 for row in rows),
          [row["line"] for row in rows if row["best"]["coverage"] != 1.0])
    rising = all(entries[i]["startTime"] > entries[i - 1]["startTime"] for i in range(1, len(entries)))
    check("start_times_increase", rising, "the line starts must rise")
    ends_ok = all(entries[i - 1]["endTime"] <= entries[i]["startTime"] + 1e-9
                  for i in range(1, len(entries)))
    check("line_ends_before_next", ends_ok,
          [(i + 1, entries[i]["endTime"], entries[i + 1]["startTime"])
           for i in range(len(entries) - 1) if entries[i]["endTime"] > entries[i + 1]["startTime"] + 1e-9])
    bad_word = [(i + 1, w["word"]) for i, e in enumerate(entries) for w in e["words"]
                if not w["start"] < w["end"]]
    check("word_start_below_end", not bad_word, bad_word[:5])
    all_times = [e["startTime"] for e in entries] + [e["endTime"] for e in entries] \
        + [w["start"] for e in entries for w in e["words"]] \
        + [w["end"] for e in entries for w in e["words"]]
    check("range_0_duration", min(all_times) >= 0 and max(all_times) <= duration,
          "min %.2f max %.2f duration %.2f" % (min(all_times), max(all_times), duration))

    print("ESTIMATED_WORDS=%d" % len(estimated))
    for line_no, word, start, end in estimated:
        print("  estimated line %d %r %.2f-%.2f" % (line_no, word, start, end))

    if ok:
        with open(args.out, "w", encoding="utf-8") as handle:
            handle.write(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
        print("WROTE %s" % args.out)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
